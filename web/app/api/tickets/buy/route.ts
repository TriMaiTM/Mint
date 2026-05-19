import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getSessionCookieName, verifySessionToken } from "@/lib/auth";
import { sendEmail, generateTicketPurchaseEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(getSessionCookieName())?.value;
    const session = verifySessionToken(token);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as {
      tierId?: string;
      txHash?: string;
      tokenId?: number;
      onchainTierId?: number;
    };
    if (!body.tierId) {
      return NextResponse.json(
        { error: "tierId is required" },
        { status: 400 },
      );
    }

    const providedTxHash = body.txHash?.trim();

    const tier = await prisma.ticketTier.findUnique({
      where: { id: body.tierId },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            contractAddress: true,
            startDate: true,
            venue: true,
          },
        },
      },
    });

    if (!tier) {
      return NextResponse.json(
        { error: "Ticket tier not found" },
        { status: 404 },
      );
    }

    if (tier.soldCount >= tier.maxQuantity) {
      return NextResponse.json({ error: "Tier sold out" }, { status: 409 });
    }

    if (!tier.event.contractAddress) {
      return NextResponse.json(
        { error: "Event is not live on-chain yet" },
        { status: 412 },
      );
    }

    if (!providedTxHash || !/^0x[a-fA-F0-9]{64}$/.test(providedTxHash)) {
      return NextResponse.json(
        { error: "Valid on-chain txHash is required" },
        { status: 400 },
      );
    }

    if (typeof body.tokenId !== "number" || body.tokenId <= 0) {
      return NextResponse.json(
        { error: "Valid on-chain tokenId is required" },
        { status: 400 },
      );
    }

    if (!Number.isInteger(body.onchainTierId)) {
      return NextResponse.json(
        { error: "Valid minted on-chain tier id is required" },
        { status: 400 },
      );
    }

    if (
      tier.onchainTierId !== null &&
      body.onchainTierId !== tier.onchainTierId
    ) {
      return NextResponse.json(
        { error: "Minted on-chain tier does not match selected draft tier" },
        { status: 409 },
      );
    }

    const user = await prisma.user.findUnique({ where: { id: session.sub } });
    if (!user) {
      return NextResponse.json(
        { error: "Session user not found" },
        { status: 401 },
      );
    }

    const onchainTokenId = body.tokenId;

    const result = await prisma.$transaction(async (tx) => {
      const latestTier = await tx.ticketTier.findUnique({
        where: { id: tier.id },
      });
      if (!latestTier || latestTier.soldCount >= latestTier.maxQuantity) {
        throw new Error("TIER_SOLD_OUT");
      }

      const existingTicket = await tx.ticket.findUnique({
        where: {
          eventId_tokenId: {
            eventId: tier.eventId,
            tokenId: onchainTokenId,
          },
        },
      });

      if (existingTicket) {
        throw new Error("TOKEN_ID_ALREADY_USED");
      }

      await tx.ticketTier.update({
        where: { id: latestTier.id },
        data: { soldCount: { increment: 1 } },
      });

      const order = await tx.order.create({
        data: {
          userId: session.sub,
          eventId: tier.eventId,
          totalAmount: tier.price,
          paymentMethod: "CRYPTO",
          status: "CONFIRMED",
          txHash: providedTxHash,
        },
      });

      const ticket = await tx.ticket.create({
        data: {
          eventId: tier.eventId,
          tierId: tier.id,
          ownerId: session.sub,
          tokenId: onchainTokenId,
          txHash: order.txHash,
          status: "MINTED",
          isUsed: false,
          qrCode: `${tier.eventId}:${onchainTokenId}`,
        },
      });

      return { order, ticket };
    });

    // Send email notification (non-blocking)
    if (user.email) {
      const eventDate = tier.event.startDate
        ? new Date(tier.event.startDate).toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })
        : "TBD";

      sendEmail({
        to: user.email,
        subject: `🎫 Ticket Confirmed - ${tier.event.title}`,
        html: generateTicketPurchaseEmail({
          eventTitle: tier.event.title,
          tierName: tier.name,
          tokenId: result.ticket.tokenId,
          eventDate,
          venue: tier.event.venue || "TBD",
          txHash: providedTxHash,
        }),
      }).catch((err) => console.error("Failed to send purchase email:", err));
    }

    return NextResponse.json({
      data: {
        orderId: result.order.id,
        ticketId: result.ticket.id,
        eventId: result.ticket.eventId,
        tokenId: result.ticket.tokenId,
        txHash: result.ticket.txHash,
      },
    });
  } catch (error) {
    console.error("POST /api/tickets/buy failed", error);

    if (error instanceof Error && error.message === "TIER_SOLD_OUT") {
      return NextResponse.json({ error: "Tier sold out" }, { status: 409 });
    }

    if (error instanceof Error && error.message === "TOKEN_ID_ALREADY_USED") {
      return NextResponse.json(
        { error: "tokenId already exists for this event" },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { error: "Failed to buy ticket" },
      { status: 500 },
    );
  }
}

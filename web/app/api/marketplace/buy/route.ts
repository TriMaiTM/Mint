import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSessionCookieName, verifySessionToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  sendEmail,
  generateSaleEmail,
  generateTicketPurchaseEmail,
} from "@/lib/email";

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(getSessionCookieName())?.value;
    const session = verifySessionToken(token);
    if (!session?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { ticketId, txHash } = body;

    if (!ticketId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const listing = await prisma.listing.findUnique({
      where: { ticketId },
      include: {
        ticket: {
          include: {
            tier: true,
          },
        },
      },
    });

    if (!listing || listing.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "Listing is not active or does not exist" },
        { status: 404 },
      );
    }

    if (listing.sellerId === session.sub) {
      return NextResponse.json(
        { error: "You cannot buy your own ticket" },
        { status: 400 },
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Mark listing as SOLD
      await tx.listing.update({
        where: { ticketId },
        data: { status: "SOLD" },
      });

      // 2. Transfer ticket ownership
      return tx.ticket.update({
        where: { id: ticketId },
        data: {
          ownerId: session.sub,
          status: "MINTED", // Reset status back to minted for the new owner
          txHash: txHash || listing.ticket.txHash,
        },
      });
    });

    // Send email notifications (non-blocking)
    const [buyer, seller] = await Promise.all([
      prisma.user.findUnique({ where: { id: session.sub } }),
      prisma.user.findUnique({ where: { id: listing.sellerId } }),
    ]);

    const event = await prisma.event.findUnique({
      where: { id: listing.ticket.eventId },
    });
    const tier = await prisma.ticketTier.findUnique({
      where: { id: listing.ticket.tierId },
    });

    if (event && tier) {
      // Notify seller about the sale
      if (seller?.email) {
        sendEmail({
          to: seller.email,
          subject: `🎉 Ticket Sold - ${event.title}`,
          html: generateSaleEmail({
            eventTitle: event.title,
            tierName: tier.name,
            tokenId: listing.ticket.tokenId,
            price: listing.price,
            buyerAddress: session.sub,
          }),
        }).catch((err) => console.error("Failed to send sale email:", err));
      }

      // Notify buyer about the purchase
      if (buyer?.email) {
        const eventDate = event.startDate
          ? new Date(event.startDate).toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })
          : "TBD";

        sendEmail({
          to: buyer.email,
          subject: `🎫 Ticket Purchased - ${event.title}`,
          html: generateTicketPurchaseEmail({
            eventTitle: event.title,
            tierName: tier.name,
            tokenId: listing.ticket.tokenId,
            eventDate,
            venue: event.venue || "TBD",
            txHash: txHash || listing.ticket.txHash,
          }),
        }).catch((err) => console.error("Failed to send purchase email:", err));
      }
    }

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error("POST /api/marketplace/buy failed", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal Server Error",
      },
      { status: 500 },
    );
  }
}

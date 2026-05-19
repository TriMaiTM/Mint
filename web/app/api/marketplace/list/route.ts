import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSessionCookieName, verifySessionToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail, generateListingEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(getSessionCookieName())?.value;
    const session = verifySessionToken(token);
    if (!session?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { ticketId, price } = body;

    if (!ticketId || !price) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    if (ticket.ownerId !== session.sub) {
      return NextResponse.json(
        { error: "Not authorized to list this ticket" },
        { status: 403 },
      );
    }

    if (ticket.isUsed) {
      return NextResponse.json(
        { error: "Cannot list a used ticket" },
        { status: 400 },
      );
    }

    // Check if there is already an active listing
    const existing = await prisma.listing.findUnique({
      where: { ticketId },
    });

    if (existing && existing.status === "ACTIVE") {
      return NextResponse.json(
        { error: "Ticket is already listed" },
        { status: 400 },
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Mark ticket as listed
      await tx.ticket.update({
        where: { id: ticketId },
        data: { status: "LISTED" },
      });

      // 2. Create or Update Listing
      return tx.listing.upsert({
        where: { ticketId },
        update: {
          price: price,
          status: "ACTIVE",
        },
        create: {
          ticketId,
          eventId: ticket.eventId,
          sellerId: session.sub,
          price: price,
          status: "ACTIVE",
        },
      });
    });

    // Send email notification (non-blocking)
    const user = await prisma.user.findUnique({ where: { id: session.sub } });
    if (user?.email) {
      const event = await prisma.event.findUnique({
        where: { id: ticket.eventId },
      });
      const tier = await prisma.ticketTier.findUnique({
        where: { id: ticket.tierId },
      });

      if (event && tier) {
        sendEmail({
          to: user.email,
          subject: `📢 Ticket Listed - ${event.title}`,
          html: generateListingEmail({
            eventTitle: event.title,
            tierName: tier.name,
            tokenId: ticket.tokenId,
            price: price,
          }),
        }).catch((err) => console.error("Failed to send listing email:", err));
      }
    }

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error("POST /api/marketplace/list failed", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal Server Error",
      },
      { status: 500 },
    );
  }
}

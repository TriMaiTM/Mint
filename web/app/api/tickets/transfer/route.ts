import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getSessionCookieName, verifySessionToken } from "@/lib/auth";
import { createNotification } from "@/lib/notifications";

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const session = verifySessionToken(cookieStore.get(getSessionCookieName())?.value);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { ticketId, toAddress, txHash } = body as {
      ticketId?: string;
      toAddress?: string;
      txHash?: string;
    };

    if (!ticketId || !toAddress) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const cleanToAddress = toAddress.trim().toLowerCase();
    if (!/^0x[a-fA-F0-9]{40}$/.test(cleanToAddress)) {
      return NextResponse.json({ error: "Invalid recipient address" }, { status: 400 });
    }

    // Load ticket
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        owner: true,
        event: { select: { title: true } },
        tier: { select: { name: true } },
      },
    });

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    if (ticket.ownerId !== session.sub) {
      return NextResponse.json({ error: "Forbidden: You do not own this ticket" }, { status: 403 });
    }

    // Find or create recipient user
    let recipient = await prisma.user.findUnique({
      where: { walletAddress: cleanToAddress },
    });

    if (!recipient) {
      recipient = await prisma.user.create({
        data: {
          walletAddress: cleanToAddress,
          role: "USER",
        },
      });
    }

    // Transfer the ticket in DB
    const updated = await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        ownerId: recipient.id,
        txHash: txHash || ticket.txHash,
        status: "MINTED", // reset listed status if it was listed
      },
    });

    // Cancel any listing for this ticket in the DB if exists
    await prisma.listing.updateMany({
      where: {
        ticketId,
        status: "ACTIVE",
      },
      data: {
        status: "CANCELLED",
      },
    });

    // Trigger in-app notifications
    createNotification(
      session.sub,
      "Đã tặng vé thành công 🎁",
      `Bạn đã tặng thành công vé hạng ${ticket.tier.name} của sự kiện "${ticket.event.title}" cho ví ${cleanToAddress}.`,
      "TRANSFER"
    ).catch((err) => console.error("Failed to create sender notification:", err));

    createNotification(
      recipient.id,
      "Nhận được vé tặng 🎁",
      `Bạn đã nhận được vé tặng hạng ${ticket.tier.name} của sự kiện "${ticket.event.title}" từ ví ${ticket.owner.walletAddress}.`,
      "TRANSFER"
    ).catch((err) => console.error("Failed to create recipient notification:", err));

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error("POST /api/tickets/transfer failed", error);
    return NextResponse.json({ error: "Failed to transfer ticket" }, { status: 500 });
  }
}

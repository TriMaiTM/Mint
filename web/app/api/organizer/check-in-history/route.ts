import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSessionCookieName, verifySessionToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(getSessionCookieName())?.value;
    const session = verifySessionToken(token);

    if (!session?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const organizer = await prisma.user.findUnique({
      where: { id: session.sub },
    });

    if (!organizer || (organizer.role !== "ORGANIZER" && organizer.role !== "ADMIN")) {
      return NextResponse.json({ error: "Forbidden: Access denied" }, { status: 403 });
    }

    // Retrieve all checked-in tickets for events organized by this user
    const tickets = await prisma.ticket.findMany({
      where: {
        event: {
          organizerId: organizer.id,
        },
        isUsed: true,
      },
      include: {
        owner: {
          select: {
            name: true,
            email: true,
            walletAddress: true,
          },
        },
        tier: {
          select: {
            name: true,
            price: true,
          },
        },
        event: {
          select: {
            title: true,
          },
        },
      },
      orderBy: {
        usedAt: "desc",
      },
    });

    return NextResponse.json({ success: true, data: tickets });
  } catch (error) {
    console.error("GET /api/organizer/check-in-history failed", error);
    return NextResponse.json(
      { error: "Failed to fetch check-in history" },
      { status: 500 },
    );
  }
}

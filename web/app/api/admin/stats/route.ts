import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSessionCookieName, verifySessionToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createPublicClient, http } from "viem";
import { sepolia } from "viem/chains";
import { TicketMarketplaceAbi } from "@/lib/contracts";

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(getSessionCookieName())?.value;
    const session = verifySessionToken(token);

    if (!session?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user is ADMIN
    const me = await prisma.user.findUnique({
      where: { id: session.sub },
      select: { id: true, role: true },
    });

    if (!me || me.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admins only" }, { status: 403 });
    }

    // 1. Fetch counts
    const totalUsers = await prisma.user.count();
    const organizersCount = await prisma.user.count({
      where: { role: "ORGANIZER" },
    });
    const adminsCount = await prisma.user.count({
      where: { role: "ADMIN" },
    });
    const regularUsersCount = totalUsers - organizersCount - adminsCount;

    const totalEvents = await prisma.event.count();
    const publishedEventsCount = await prisma.event.count({
      where: { status: "PUBLISHED" },
    });
    const ongoingEventsCount = await prisma.event.count({
      where: { status: "ONGOING" },
    });
    const draftEventsCount = await prisma.event.count({
      where: { status: "DRAFT" },
    });
    const cancelledEventsCount = await prisma.event.count({
      where: { status: "CANCELLED" },
    });

    const totalTicketsSold = await prisma.ticket.count();
    const ticketsCheckedInCount = await prisma.ticket.count({
      where: { isUsed: true },
    });
    const ticketsListedCount = await prisma.ticket.count({
      where: { status: "LISTED" },
    });

    // 2. Fetch revenue stats
    const confirmedOrders = await prisma.order.findMany({
      where: { status: "CONFIRMED" },
      select: { totalAmount: true, createdAt: true },
    });
    const primaryVolume = confirmedOrders.reduce(
      (sum, order) => sum + Number(order.totalAmount),
      0
    );

    // 3. Fetch secondary marketplace stats
    const soldListings = await prisma.listing.findMany({
      where: { status: "SOLD" },
      select: { price: true, createdAt: true },
    });
    const secondaryVolume = soldListings.reduce(
      (sum, listing) => sum + (Number(listing.price) / 1e18),
      0
    );

    // 4. Fetch platform fee BPS from contract
    let platformFeeBps = 250; // default 2.5%
    const marketplaceAddress = process.env.NEXT_PUBLIC_MARKETPLACE_ADDRESS;
    if (marketplaceAddress) {
      try {
        const rpcUrl = process.env.SEPOLIA_RPC_URL ?? "https://sepolia.drpc.org";
        const publicClient = createPublicClient({
          chain: sepolia,
          transport: http(rpcUrl),
        });
        const feeBps = await publicClient.readContract({
          address: marketplaceAddress as `0x${string}`,
          abi: TicketMarketplaceAbi,
          functionName: "platformFeeBps",
        });
        platformFeeBps = Number(feeBps);
      } catch (err) {
        console.error("Failed to read platformFeeBps from contract:", err);
      }
    }

    const platformFeesVolume = secondaryVolume * (platformFeeBps / 10000);

    // 5. Daily volume data for the last 7 days (Primary vs Secondary)
    const dailyStats: { date: string; primary: number; secondary: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayStart = new Date(date.setHours(0, 0, 0, 0));
      const dayEnd = new Date(date.setHours(23, 59, 59, 999));

      const dayPrimary = confirmedOrders
        .filter((o) => {
          const orderDate = new Date(o.createdAt);
          return orderDate >= dayStart && orderDate <= dayEnd;
        })
        .reduce((sum, order) => sum + Number(order.totalAmount), 0);

      const daySecondary = soldListings
        .filter((l) => {
          const listingDate = new Date(l.createdAt);
          return listingDate >= dayStart && listingDate <= dayEnd;
        })
        .reduce((sum, listing) => sum + (Number(listing.price) / 1e18), 0);

      dailyStats.push({
        date: dayStart.toISOString().split("T")[0],
        primary: dayPrimary,
        secondary: daySecondary,
      });
    }

    // 6. Recent events
    const recentEvents = await prisma.event.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        status: true,
        createdAt: true,
        organizer: {
          select: {
            name: true,
            walletAddress: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      stats: {
        users: {
          total: totalUsers,
          regular: regularUsersCount,
          organizers: organizersCount,
          admins: adminsCount,
        },
        events: {
          total: totalEvents,
          published: publishedEventsCount,
          ongoing: ongoingEventsCount,
          draft: draftEventsCount,
          cancelled: cancelledEventsCount,
        },
        tickets: {
          totalSold: totalTicketsSold,
          checkedIn: ticketsCheckedInCount,
          listed: ticketsListedCount,
        },
        volume: {
          primary: primaryVolume,
          secondary: secondaryVolume,
          fees: platformFeesVolume,
          platformFeeBps,
        },
        dailyStats,
        recentEvents,
      },
    });
  } catch (error) {
    console.error("Admin stats API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

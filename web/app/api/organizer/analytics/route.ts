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

    // Get all events organized by this user
    const events = await prisma.event.findMany({
      where: { organizerId: session.sub },
      include: {
        ticketTiers: true,
        tickets: {
          select: {
            id: true,
            status: true,
            isUsed: true,
            createdAt: true,
            tierId: true,
          },
        },
        orders: {
          select: {
            id: true,
            totalAmount: true,
            status: true,
            createdAt: true,
          },
        },
        listings: {
          select: {
            id: true,
            price: true,
            status: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Calculate analytics
    const totalEvents = events.length;
    const publishedEvents = events.filter(
      (e) => e.status === "PUBLISHED" || e.status === "ONGOING"
    ).length;

    // Ticket stats
    const allTickets = events.flatMap((e) => e.tickets);
    const totalTicketsSold = allTickets.length;
    const totalTicketsCheckedIn = allTickets.filter((t) => t.isUsed).length;
    const totalTicketsListed = allTickets.filter(
      (t) => t.status === "LISTED"
    ).length;

    // Revenue stats
    const allOrders = events.flatMap((e) => e.orders);
    const confirmedOrders = allOrders.filter((o) => o.status === "CONFIRMED");
    const totalRevenue = confirmedOrders.reduce(
      (sum, order) => sum + Number(order.totalAmount),
      0
    );

    // Marketplace stats
    const allListings = events.flatMap((e) => e.listings);
    const soldListings = allListings.filter((l) => l.status === "SOLD");
    const activeListings = allListings.filter((l) => l.status === "ACTIVE");
    const marketplaceVolume = soldListings.reduce(
      (sum, listing) => sum + Number(listing.price),
      0
    );

    // Revenue by event
    const revenueByEvent = events.map((event) => {
      const eventRevenue = event.orders
        .filter((o) => o.status === "CONFIRMED")
        .reduce((sum, order) => sum + Number(order.totalAmount), 0);

      const eventTicketsSold = event.tickets.length;
      const eventCheckedIn = event.tickets.filter((t) => t.isUsed).length;

      return {
        id: event.id,
        title: event.title,
        status: event.status,
        revenue: eventRevenue,
        ticketsSold: eventTicketsSold,
        checkedIn: eventCheckedIn,
        startDate: event.startDate,
      };
    });

    // Tickets sold by tier
    const tierStats = events.flatMap((event) =>
      event.ticketTiers.map((tier) => ({
        eventId: event.id,
        eventTitle: event.title,
        tierId: tier.id,
        tierName: tier.name,
        price: Number(tier.price),
        maxQuantity: tier.maxQuantity,
        soldCount: tier.soldCount,
        remaining: tier.maxQuantity - tier.soldCount,
      }))
    );

    // Recent activity (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentOrders = allOrders
      .filter((o) => new Date(o.createdAt) >= thirtyDaysAgo)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .slice(0, 10);

    // Daily revenue for the last 7 days
    const dailyRevenue: { date: string; revenue: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayStart = new Date(date.setHours(0, 0, 0, 0));
      const dayEnd = new Date(date.setHours(23, 59, 59, 999));

      const dayRevenue = confirmedOrders
        .filter((o) => {
          const orderDate = new Date(o.createdAt);
          return orderDate >= dayStart && orderDate <= dayEnd;
        })
        .reduce((sum, order) => sum + Number(order.totalAmount), 0);

      dailyRevenue.push({
        date: dayStart.toISOString().split("T")[0],
        revenue: dayRevenue,
      });
    }

    return NextResponse.json({
      data: {
        overview: {
          totalEvents,
          publishedEvents,
          totalTicketsSold,
          totalTicketsCheckedIn,
          totalTicketsListed,
          totalRevenue,
          marketplaceVolume,
          activeListingsCount: activeListings.length,
        },
        revenueByEvent,
        tierStats,
        recentOrders,
        dailyRevenue,
      },
    });
  } catch (error) {
    console.error("GET /api/organizer/analytics failed", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}

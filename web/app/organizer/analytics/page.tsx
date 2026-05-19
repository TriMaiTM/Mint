"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAccount } from "wagmi";
import { Nav } from "@/components/layout/nav";

interface AnalyticsData {
  overview: {
    totalEvents: number;
    publishedEvents: number;
    totalTicketsSold: number;
    totalTicketsCheckedIn: number;
    totalTicketsListed: number;
    totalRevenue: number;
    marketplaceVolume: number;
    activeListingsCount: number;
  };
  revenueByEvent: Array<{
    id: string;
    title: string;
    status: string;
    revenue: number;
    ticketsSold: number;
    checkedIn: number;
    startDate: string;
  }>;
  tierStats: Array<{
    eventId: string;
    eventTitle: string;
    tierId: string;
    tierName: string;
    price: number;
    maxQuantity: number;
    soldCount: number;
    remaining: number;
  }>;
  recentOrders: Array<{
    id: string;
    totalAmount: number;
    status: string;
    createdAt: string;
  }>;
  dailyRevenue: Array<{
    date: string;
    revenue: number;
  }>;
}

export default function AnalyticsPage() {
  const { address, isConnected } = useAccount();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const response = await fetch("/api/organizer/analytics");
        if (!response.ok) {
          throw new Error("Failed to fetch analytics");
        }
        const data = await response.json();
        setAnalytics(data.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    }

    if (isConnected) {
      fetchAnalytics();
    } else {
      setLoading(false);
    }
  }, [isConnected]);

  if (!isConnected) {
    return (
      <>
        <Nav />
        <main className="container section-gap" style={{ textAlign: "center" }}>
          <h1 className="text-heading-xl mb-md">Analytics Dashboard</h1>
          <p className="text-body-md text-muted mb-lg">
            Please connect your wallet to view analytics.
          </p>
          <Link href="/" className="btn-secondary">
            Back to Home
          </Link>
        </main>
      </>
    );
  }

  if (loading) {
    return (
      <>
        <Nav />
        <main
          className="container section-gap"
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "50vh",
          }}
        >
          <div className="spinner" />
        </main>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Nav />
        <main className="container section-gap" style={{ textAlign: "center" }}>
          <h1 className="text-heading-xl mb-md">Error</h1>
          <p className="text-body-md text-muted mb-lg">{error}</p>
          <Link href="/organizer/events" className="btn-secondary">
            Back to My Events
          </Link>
        </main>
      </>
    );
  }

  if (!analytics) {
    return (
      <>
        <Nav />
        <main className="container section-gap" style={{ textAlign: "center" }}>
          <h1 className="text-heading-xl mb-md">No Data</h1>
          <p className="text-body-md text-muted mb-lg">
            Create some events to see analytics.
          </p>
          <Link href="/organizer/events/new" className="btn-primary">
            Create Event
          </Link>
        </main>
      </>
    );
  }

  const { overview, revenueByEvent, tierStats, dailyRevenue } = analytics;

  return (
    <>
      <Nav />
      <main className="container section-gap">
        {/* Header */}
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "var(--space-xxl)",
          }}
        >
          <div>
            <h1 className="text-display-lg">Analytics Dashboard</h1>
            <p className="text-body-md text-muted mt-sm">
              Track your event performance and revenue.
            </p>
          </div>
          <Link href="/organizer/events" className="btn-secondary">
            ← Back to Events
          </Link>
        </header>

        {/* Overview Cards */}
        <section style={{ marginBottom: "var(--space-xxl)" }}>
          <h2 className="text-heading-lg mb-lg">Overview</h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "var(--space-lg)",
            }}
          >
            <div className="card" style={{ padding: "var(--space-lg)" }}>
              <p className="text-body-sm text-muted">Total Events</p>
              <p className="text-display-md" style={{ color: "var(--color-primary)" }}>
                {overview.totalEvents}
              </p>
              <p className="text-body-sm text-muted">
                {overview.publishedEvents} published
              </p>
            </div>

            <div className="card" style={{ padding: "var(--space-lg)" }}>
              <p className="text-body-sm text-muted">Tickets Sold</p>
              <p className="text-display-md" style={{ color: "var(--color-primary)" }}>
                {overview.totalTicketsSold}
              </p>
              <p className="text-body-sm text-muted">
                {overview.totalTicketsCheckedIn} checked in
              </p>
            </div>

            <div className="card" style={{ padding: "var(--space-lg)" }}>
              <p className="text-body-sm text-muted">Total Revenue</p>
              <p className="text-display-md" style={{ color: "var(--color-primary)" }}>
                {overview.totalRevenue.toFixed(4)} ETH
              </p>
              <p className="text-body-sm text-muted">from primary sales</p>
            </div>

            <div className="card" style={{ padding: "var(--space-lg)" }}>
              <p className="text-body-sm text-muted">Marketplace Volume</p>
              <p className="text-display-md" style={{ color: "var(--color-primary)" }}>
                {overview.marketplaceVolume.toFixed(4)} ETH
              </p>
              <p className="text-body-sm text-muted">
                {overview.activeListingsCount} active listings
              </p>
            </div>
          </div>
        </section>

        {/* Daily Revenue Chart */}
        <section style={{ marginBottom: "var(--space-xxl)" }}>
          <h2 className="text-heading-lg mb-lg">Revenue (Last 7 Days)</h2>
          <div className="card" style={{ padding: "var(--space-lg)" }}>
            <div
              style={{
                display: "flex",
                alignItems: "flex-end",
                gap: "var(--space-sm)",
                height: "200px",
                padding: "var(--space-md) 0",
              }}
            >
              {dailyRevenue.map((day) => {
                const maxRevenue = Math.max(
                  ...dailyRevenue.map((d) => d.revenue),
                  0.001
                );
                const height = (day.revenue / maxRevenue) * 100;
                return (
                  <div
                    key={day.date}
                    style={{
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "var(--space-xs)",
                    }}
                  >
                    <div
                      style={{
                        width: "100%",
                        height: `${Math.max(height, 2)}%`,
                        backgroundColor: "var(--color-primary)",
                        borderRadius: "var(--radius-sm) var(--radius-sm) 0 0",
                        minHeight: "4px",
                      }}
                    />
                    <p
                      className="text-body-sm text-muted"
                      style={{ fontSize: "10px" }}
                    >
                      {new Date(day.date).toLocaleDateString("en-US", {
                        weekday: "short",
                      })}
                    </p>
                    <p className="text-body-sm" style={{ fontSize: "11px" }}>
                      {day.revenue.toFixed(3)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Revenue by Event */}
        <section style={{ marginBottom: "var(--space-xxl)" }}>
          <h2 className="text-heading-lg mb-lg">Revenue by Event</h2>
          <div className="card" style={{ overflow: "hidden" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
              }}
            >
              <thead>
                <tr
                  style={{
                    backgroundColor: "var(--color-surface-card)",
                    borderBottom: "1px solid var(--color-border)",
                  }}
                >
                  <th
                    style={{
                      padding: "var(--space-md) var(--space-lg)",
                      textAlign: "left",
                      fontWeight: 600,
                    }}
                  >
                    Event
                  </th>
                  <th
                    style={{
                      padding: "var(--space-md) var(--space-lg)",
                      textAlign: "left",
                      fontWeight: 600,
                    }}
                  >
                    Status
                  </th>
                  <th
                    style={{
                      padding: "var(--space-md) var(--space-lg)",
                      textAlign: "right",
                      fontWeight: 600,
                    }}
                  >
                    Tickets Sold
                  </th>
                  <th
                    style={{
                      padding: "var(--space-md) var(--space-lg)",
                      textAlign: "right",
                      fontWeight: 600,
                    }}
                  >
                    Checked In
                  </th>
                  <th
                    style={{
                      padding: "var(--space-md) var(--space-lg)",
                      textAlign: "right",
                      fontWeight: 600,
                    }}
                  >
                    Revenue
                  </th>
                </tr>
              </thead>
              <tbody>
                {revenueByEvent.map((event) => (
                  <tr
                    key={event.id}
                    style={{
                      borderBottom: "1px solid var(--color-border)",
                    }}
                  >
                    <td
                      style={{
                        padding: "var(--space-md) var(--space-lg)",
                      }}
                    >
                      <Link
                        href={`/organizer/events/${event.id}`}
                        style={{
                          color: "var(--color-text)",
                          textDecoration: "none",
                          fontWeight: 500,
                        }}
                      >
                        {event.title}
                      </Link>
                    </td>
                    <td
                      style={{
                        padding: "var(--space-md) var(--space-lg)",
                      }}
                    >
                      <span
                        className={`chip ${event.status === "PUBLISHED" ? "chip-active" : ""}`}
                      >
                        {event.status}
                      </span>
                    </td>
                    <td
                      style={{
                        padding: "var(--space-md) var(--space-lg)",
                        textAlign: "right",
                      }}
                    >
                      {event.ticketsSold}
                    </td>
                    <td
                      style={{
                        padding: "var(--space-md) var(--space-lg)",
                        textAlign: "right",
                      }}
                    >
                      {event.checkedIn}
                    </td>
                    <td
                      style={{
                        padding: "var(--space-md) var(--space-lg)",
                        textAlign: "right",
                        fontWeight: 600,
                      }}
                    >
                      {event.revenue.toFixed(4)} ETH
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Ticket Tiers */}
        <section style={{ marginBottom: "var(--space-xxl)" }}>
          <h2 className="text-heading-lg mb-lg">Ticket Inventory</h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap: "var(--space-lg)",
            }}
          >
            {tierStats.map((tier) => {
              const percentage =
                tier.maxQuantity > 0
                  ? (tier.soldCount / tier.maxQuantity) * 100
                  : 0;
              return (
                <div
                  key={tier.tierId}
                  className="card"
                  style={{ padding: "var(--space-lg)" }}
                >
                  <p className="text-body-sm text-muted">{tier.eventTitle}</p>
                  <h3 className="text-heading-md mt-sm">{tier.tierName}</h3>
                  <p
                    className="text-body-md mt-sm"
                    style={{ fontWeight: 600 }}
                  >
                    {tier.price.toFixed(4)} ETH
                  </p>

                  {/* Progress Bar */}
                  <div
                    style={{
                      marginTop: "var(--space-md)",
                      backgroundColor: "var(--color-surface-card)",
                      borderRadius: "var(--radius-full)",
                      height: "8px",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${percentage}%`,
                        height: "100%",
                        backgroundColor:
                          percentage >= 80
                            ? "#10b981"
                            : percentage >= 50
                              ? "#f59e0b"
                              : "var(--color-primary)",
                        borderRadius: "var(--radius-full)",
                        transition: "width 0.3s ease",
                      }}
                    />
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginTop: "var(--space-sm)",
                    }}
                  >
                    <p className="text-body-sm text-muted">
                      {tier.soldCount} sold
                    </p>
                    <p className="text-body-sm text-muted">
                      {tier.remaining} remaining
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Quick Actions */}
        <section>
          <h2 className="text-heading-lg mb-lg">Quick Actions</h2>
          <div
            style={{
              display: "flex",
              gap: "var(--space-md)",
              flexWrap: "wrap",
            }}
          >
            <Link href="/organizer/events/new" className="btn-primary">
              Create New Event
            </Link>
            <Link href="/organizer/events" className="btn-secondary">
              Manage Events
            </Link>
            <Link href="/organizer/check-in" className="btn-secondary">
              Check-in Scanner
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAccount } from "wagmi";

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

export default function OrganizerDashboardPage() {
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
      <div style={{ textAlign: "center", padding: "var(--space-xxl) 0" }}>
        <h1 className="text-heading-xl mb-md">Organizer Dashboard</h1>
        <p className="text-body-md text-muted mb-lg">
          Please connect your wallet to view your dashboard analytics.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "50vh",
        }}
      >
        <div className="spinner" />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: "center", padding: "var(--space-xxl) 0" }}>
        <h1 className="text-heading-xl mb-md">Error Loading Data</h1>
        <p className="text-body-md text-muted mb-lg" style={{ color: "var(--color-error)" }}>
          {error}
        </p>
        <button onClick={() => window.location.reload()} className="btn-secondary">
          Retry
        </button>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div style={{ textAlign: "center", padding: "var(--space-xxl) 0" }}>
        <h1 className="text-heading-xl mb-md">No Data Available</h1>
        <p className="text-body-md text-muted mb-lg">
          Create some events to start tracking sales and analytics.
        </p>
        <Link href="/organizer/events/new" className="btn-primary">
          Create Event
        </Link>
      </div>
    );
  }

  const { overview, revenueByEvent, tierStats, dailyRevenue } = analytics;

  const maxRevenue = Math.max(
    ...dailyRevenue.map((d) => d.revenue),
    0.001
  );
  const yTicks = [
    maxRevenue,
    maxRevenue * 0.75,
    maxRevenue * 0.5,
    maxRevenue * 0.25,
    0,
  ];

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
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
          <h1 className="text-display-lg">Dashboard Overview</h1>
          <p className="text-body-md text-muted mt-sm">
            Track your event sales, revenue, and ticket check-ins.
          </p>
        </div>
      </header>

      {/* Overview Cards */}
      <section style={{ marginBottom: "var(--space-xxl)" }}>
        <h2 className="text-heading-lg mb-lg">Overview</h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "var(--space-lg)",
          }}
        >
          <div className="card" style={{ padding: "var(--space-lg)", background: "var(--color-surface-soft)" }}>
            <p className="text-body-sm text-muted">Total Events</p>
            <p className="text-display-md" style={{ color: "var(--color-primary)", margin: "var(--space-sm) 0" }}>
              {overview.totalEvents}
            </p>
            <p className="text-body-sm text-muted">
              {overview.publishedEvents} published events
            </p>
          </div>

          <div className="card" style={{ padding: "var(--space-lg)", background: "var(--color-surface-soft)" }}>
            <p className="text-body-sm text-muted">Tickets Sold</p>
            <p className="text-display-md" style={{ color: "var(--color-primary)", margin: "var(--space-sm) 0" }}>
              {overview.totalTicketsSold}
            </p>
            <p className="text-body-sm text-muted">
              {overview.totalTicketsCheckedIn} / {overview.totalTicketsSold} checked in
            </p>
          </div>

          <div className="card" style={{ padding: "var(--space-lg)", background: "var(--color-surface-soft)" }}>
            <p className="text-body-sm text-muted">Primary Sales Revenue</p>
            <p className="text-display-md" style={{ color: "var(--color-primary)", margin: "var(--space-sm) 0" }}>
              {overview.totalRevenue.toFixed(4)} ETH
            </p>
            <p className="text-body-sm text-muted">from direct orders</p>
          </div>

          <div className="card" style={{ padding: "var(--space-lg)", background: "var(--color-surface-soft)" }}>
            <p className="text-body-sm text-muted">Marketplace Volume</p>
            <p className="text-display-md" style={{ color: "var(--color-primary)", margin: "var(--space-sm) 0" }}>
              {/* Fix Wei to ETH conversion */}
              {(overview.marketplaceVolume / 1e18).toFixed(4)} ETH
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
        <div className="card" style={{ padding: "var(--space-xl)", background: "var(--color-surface-soft)" }}>
          <div
            style={{
              display: "flex",
              height: "240px",
              position: "relative",
            }}
          >
            {/* Y-Axis Labels */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                height: "200px",
                paddingRight: "var(--space-md)",
                borderRight: "1px solid var(--color-hairline)",
                textAlign: "right",
                width: "60px",
                flexShrink: 0,
                fontSize: "11px",
                color: "var(--color-mute)",
                fontFamily: "monospace",
              }}
            >
              {yTicks.map((tick, idx) => (
                <span key={idx}>{tick.toFixed(3)}</span>
              ))}
            </div>

            {/* Bars Area */}
            <div
              style={{
                display: "flex",
                alignItems: "flex-end",
                gap: "var(--space-md)",
                height: "200px",
                flex: 1,
                paddingLeft: "var(--space-md)",
                position: "relative",
              }}
            >
              {/* Horizontal helper gridlines */}
              <div style={{ position: "absolute", left: 0, right: 0, top: "25%", borderTop: "1px dashed var(--color-hairline)", opacity: 0.5, pointerEvents: "none" }} />
              <div style={{ position: "absolute", left: 0, right: 0, top: "50%", borderTop: "1px dashed var(--color-hairline)", opacity: 0.5, pointerEvents: "none" }} />
              <div style={{ position: "absolute", left: 0, right: 0, top: "75%", borderTop: "1px dashed var(--color-hairline)", opacity: 0.5, pointerEvents: "none" }} />
              <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, borderBottom: "1px solid var(--color-hairline)", opacity: 0.8, pointerEvents: "none" }} />

              {dailyRevenue.map((day) => {
                const height = (day.revenue / maxRevenue) * 100;
                return (
                  <div
                    key={day.date}
                    style={{
                      flex: 1,
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "flex-end",
                      alignItems: "center",
                      position: "relative",
                      zIndex: 2,
                    }}
                  >
                    {/* The bar itself */}
                    <div
                      style={{
                        width: "32px",
                        height: `${Math.max(height, 2)}%`,
                        backgroundColor: "var(--color-primary)",
                        borderRadius: "var(--radius-sm) var(--radius-sm) 0 0",
                        minHeight: "2px",
                        transition: "height 0.3s ease",
                        boxShadow: "0 2px 8px rgba(230, 0, 35, 0.2)",
                      }}
                      title={`${day.revenue.toFixed(4)} POL`}
                    />
                    
                    {/* Labels below the axis line (absolutely positioned below the 200px boundary) */}
                    <div
                      style={{
                        position: "absolute",
                        top: "205px",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "2px",
                        width: "100%",
                      }}
                    >
                      <p
                        className="text-body-sm text-muted"
                        style={{ fontSize: "10px", margin: 0 }}
                      >
                        {new Date(day.date).toLocaleDateString("en-US", {
                          weekday: "short",
                        })}
                      </p>
                      <p className="text-body-sm" style={{ fontSize: "11px", margin: 0, fontWeight: 600, color: "var(--color-ink)" }}>
                        {day.revenue.toFixed(3)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Revenue by Event */}
      <section style={{ marginBottom: "var(--space-xxl)" }}>
        <h2 className="text-heading-lg mb-lg">Revenue by Event</h2>
        <div className="card" style={{ overflowX: "auto", background: "var(--color-surface-soft)", padding: 0 }}>
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
                  borderBottom: "1px solid var(--color-hairline)",
                }}
              >
                <th style={{ padding: "var(--space-md) var(--space-lg)", textAlign: "left", fontWeight: 600 }}>
                  Event
                </th>
                <th style={{ padding: "var(--space-md) var(--space-lg)", textAlign: "left", fontWeight: 600 }}>
                  Status
                </th>
                <th style={{ padding: "var(--space-md) var(--space-lg)", textAlign: "right", fontWeight: 600 }}>
                  Tickets Sold
                </th>
                <th style={{ padding: "var(--space-md) var(--space-lg)", textAlign: "right", fontWeight: 600 }}>
                  Checked In
                </th>
                <th style={{ padding: "var(--space-md) var(--space-lg)", textAlign: "right", fontWeight: 600 }}>
                  Revenue
                </th>
              </tr>
            </thead>
            <tbody>
              {revenueByEvent.map((event) => (
                <tr
                  key={event.id}
                  style={{
                    borderBottom: "1px solid var(--color-hairline)",
                  }}
                >
                  <td style={{ padding: "var(--space-md) var(--space-lg)" }}>
                    <Link
                      href={`/organizer/events/${event.id}`}
                      style={{
                        color: "var(--color-ink)",
                        textDecoration: "none",
                        fontWeight: 500,
                      }}
                      className="text-hover-primary"
                    >
                      {event.title}
                    </Link>
                  </td>
                  <td style={{ padding: "var(--space-md) var(--space-lg)" }}>
                    <span
                      style={{
                        padding: "var(--space-xxs) var(--space-md)",
                        borderRadius: "var(--radius-full)",
                        fontSize: "12px",
                        fontWeight: 600,
                        backgroundColor: event.status === "PUBLISHED" || event.status === "ONGOING" ? "var(--color-success-pale)" : "var(--color-secondary-bg)",
                        color: event.status === "PUBLISHED" || event.status === "ONGOING" ? "var(--color-success-deep)" : "var(--color-mute)",
                      }}
                    >
                      {event.status}
                    </span>
                  </td>
                  <td style={{ padding: "var(--space-md) var(--space-lg)", textAlign: "right" }}>
                    {event.ticketsSold}
                  </td>
                  <td style={{ padding: "var(--space-md) var(--space-lg)", textAlign: "right" }}>
                    {event.checkedIn}
                  </td>
                  <td style={{ padding: "var(--space-md) var(--space-lg)", textAlign: "right", fontWeight: 600 }}>
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
                style={{ padding: "var(--space-lg)", background: "var(--color-surface-soft)" }}
              >
                <p className="text-body-sm text-muted" style={{ margin: 0 }}>{tier.eventTitle}</p>
                <h3 className="text-heading-md" style={{ margin: "var(--space-xs) 0" }}>{tier.tierName}</h3>
                <p
                  className="text-body-md"
                  style={{ fontWeight: 600, margin: 0 }}
                >
                  {tier.price.toFixed(4)} ETH
                </p>

                {/* Progress Bar */}
                <div
                  style={{
                    marginTop: "var(--space-md)",
                    backgroundColor: "var(--color-secondary-bg)",
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
                  <p className="text-body-sm text-muted" style={{ margin: 0 }}>
                    {tier.soldCount} sold
                  </p>
                  <p className="text-body-sm text-muted" style={{ margin: 0 }}>
                    {tier.remaining} remaining
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Quick Actions */}
      <section style={{ marginBottom: "var(--space-xxl)" }}>
        <h2 className="text-heading-lg mb-lg">Quick Actions</h2>
        <div
          style={{
            display: "flex",
            gap: "var(--space-md)",
            flexWrap: "wrap",
          }}
        >
          <Link href="/organizer/events/new" className="btn-primary" style={{ textDecoration: "none" }}>
            Create New Event
          </Link>
          <Link href="/organizer/events" className="btn-secondary" style={{ textDecoration: "none" }}>
            Manage Events
          </Link>
          <Link href="/organizer/check-in" className="btn-secondary" style={{ textDecoration: "none" }}>
            Check-in Scanner
          </Link>
        </div>
      </section>
    </div>
  );
}

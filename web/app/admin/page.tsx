"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAccount } from "wagmi";

interface AdminStats {
  users: {
    total: number;
    regular: number;
    organizers: number;
    admins: number;
  };
  events: {
    total: number;
    published: number;
    ongoing: number;
    draft: number;
    cancelled: number;
  };
  tickets: {
    totalSold: number;
    checkedIn: number;
    listed: number;
  };
  volume: {
    primary: number;
    secondary: number;
    fees: number;
    platformFeeBps: number;
  };
  dailyStats: Array<{
    date: string;
    primary: number;
    secondary: number;
  }>;
  recentEvents: Array<{
    id: string;
    title: string;
    status: string;
    createdAt: string;
    organizer: {
      name: string | null;
      walletAddress: string;
    };
  }>;
}

export default function AdminDashboardPage() {
  const { isConnected } = useAccount();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch("/api/admin/stats");
        if (!response.ok) {
          if (response.status === 403) {
            throw new Error("Access denied: Admin role required");
          }
          throw new Error("Failed to fetch admin statistics");
        }
        const data = await response.json();
        setStats(data.stats);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    }

    if (isConnected) {
      fetchStats();
    } else {
      setLoading(false);
    }
  }, [isConnected]);

  if (!isConnected) {
    return (
      <div style={{ textAlign: "center", padding: "var(--space-xxl) 0" }}>
        <h1 className="text-heading-xl mb-md">Admin Dashboard</h1>
        <p className="text-body-md text-muted mb-lg">
          Please connect your wallet to view system administration metrics.
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

  if (!stats) {
    return (
      <div style={{ textAlign: "center", padding: "var(--space-xxl) 0" }}>
        <h1 className="text-heading-xl mb-md">No Admin Data Available</h1>
      </div>
    );
  }

  const maxVal = Math.max(
    ...stats.dailyStats.map((d) => d.primary + d.secondary),
    0.001
  );
  const yTicks = [
    maxVal,
    maxVal * 0.75,
    maxVal * 0.5,
    maxVal * 0.25,
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
          <h1 className="text-display-lg">Admin Overview</h1>
          <p className="text-body-md text-muted mt-sm">
            Monitor users, event distribution, total volumes, and platform fees.
          </p>
        </div>
      </header>

      {/* Overview Cards */}
      <section style={{ marginBottom: "var(--space-xxl)" }}>
        <h2 className="text-heading-lg mb-lg">Platform Summary</h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "var(--space-lg)",
          }}
        >
          {/* Users Card */}
          <div className="card" style={{ padding: "var(--space-lg)", background: "var(--color-surface-soft)" }}>
            <p className="text-body-sm text-muted">Total Registered Users</p>
            <p className="text-display-md" style={{ color: "var(--color-primary)", margin: "var(--space-sm) 0" }}>
              {stats.users.total}
            </p>
            <p className="text-body-sm text-muted">
              {stats.users.regular} users • {stats.users.organizers} organizers • {stats.users.admins} admins
            </p>
          </div>

          {/* Events Card */}
          <div className="card" style={{ padding: "var(--space-lg)", background: "var(--color-surface-soft)" }}>
            <p className="text-body-sm text-muted">Total Events Created</p>
            <p className="text-display-md" style={{ color: "var(--color-primary)", margin: "var(--space-sm) 0" }}>
              {stats.events.total}
            </p>
            <p className="text-body-sm text-muted">
              {stats.events.published} published • {stats.events.ongoing} ongoing • {stats.events.draft} drafts
            </p>
          </div>

          {/* Tickets Card */}
          <div className="card" style={{ padding: "var(--space-lg)", background: "var(--color-surface-soft)" }}>
            <p className="text-body-sm text-muted">Total Tickets Sold</p>
            <p className="text-display-md" style={{ color: "var(--color-primary)", margin: "var(--space-sm) 0" }}>
              {stats.tickets.totalSold}
            </p>
            <p className="text-body-sm text-muted">
              {stats.tickets.checkedIn} checked in • {stats.tickets.listed} listed on marketplace
            </p>
          </div>
        </div>
      </section>

      {/* Financials & Volume Summary */}
      <section style={{ marginBottom: "var(--space-xxl)" }}>
        <h2 className="text-heading-lg mb-lg">Platform Volumes</h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "var(--space-lg)",
          }}
        >
          {/* Primary Volume Card */}
          <div className="card" style={{ padding: "var(--space-lg)", background: "var(--color-surface-soft)" }}>
            <p className="text-body-sm text-muted">Primary Sales Volume</p>
            <p className="text-display-md" style={{ color: "var(--color-success)", margin: "var(--space-sm) 0" }}>
              {stats.volume.primary.toFixed(4)} POL
            </p>
            <p className="text-body-sm text-muted">Direct primary mints on-chain</p>
          </div>

          {/* Secondary Volume Card */}
          <div className="card" style={{ padding: "var(--space-lg)", background: "var(--color-surface-soft)" }}>
            <p className="text-body-sm text-muted">Secondary Market Volume</p>
            <p className="text-display-md" style={{ color: "var(--color-primary)", margin: "var(--space-sm) 0" }}>
              {stats.volume.secondary.toFixed(4)} POL
            </p>
            <p className="text-body-sm text-muted">Ticket resales on marketplace</p>
          </div>

          {/* Platform Fees Card */}
          <div className="card" style={{ padding: "var(--space-lg)", background: "var(--color-surface-soft)" }}>
            <p className="text-body-sm text-muted">Accumulated Fees Volume</p>
            <p className="text-display-md" style={{ color: "var(--color-primary)", margin: "var(--space-sm) 0" }}>
              {stats.volume.fees.toFixed(4)} POL
            </p>
            <p className="text-body-sm text-muted">
              Rate: {(stats.volume.platformFeeBps / 100).toFixed(2)}% on secondary resales
            </p>
          </div>
        </div>
      </section>

      {/* Daily Volume Chart */}
      <section style={{ marginBottom: "var(--space-xxl)" }}>
        <h2 className="text-heading-lg mb-lg">Platform Transaction Activity (Last 7 Days)</h2>
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
                gap: "var(--space-xl)",
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

              {stats.dailyStats.map((day) => {
                const primHeight = (day.primary / maxVal) * 100;
                const secHeight = (day.secondary / maxVal) * 100;

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
                    {/* Bars Container */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-end",
                        justifyContent: "center",
                        gap: "4px",
                        height: "100%",
                        width: "100%",
                        paddingBottom: "2px",
                      }}
                    >
                      {/* Primary volume bar */}
                      <div
                        title={`Primary: ${day.primary.toFixed(4)} POL`}
                        style={{
                          width: "16px",
                          height: `${Math.max(primHeight, 2)}%`,
                          backgroundColor: "var(--color-success)",
                          borderRadius: "var(--radius-sm) var(--radius-sm) 0 0",
                          minHeight: "2px",
                          transition: "height 0.3s ease",
                          boxShadow: "0 2px 6px rgba(16, 185, 129, 0.15)",
                        }}
                      />
                      {/* Secondary volume bar */}
                      <div
                        title={`Secondary: ${day.secondary.toFixed(4)} POL`}
                        style={{
                          width: "16px",
                          height: `${Math.max(secHeight, 2)}%`,
                          backgroundColor: "var(--color-primary)",
                          borderRadius: "var(--radius-sm) var(--radius-sm) 0 0",
                          minHeight: "2px",
                          transition: "height 0.3s ease",
                          boxShadow: "0 2px 6px rgba(230, 0, 35, 0.15)",
                        }}
                      />
                    </div>
                    
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
                        style={{ fontSize: "10px", margin: 0, textTransform: "uppercase" }}
                      >
                        {new Date(day.date).toLocaleDateString("en-US", {
                          weekday: "short",
                        })}
                      </p>
                      <p className="text-body-sm" style={{ fontSize: "11px", margin: 0, fontWeight: 600, color: "var(--color-ink)" }}>
                        {(day.primary + day.secondary).toFixed(3)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div style={{ display: "flex", gap: "var(--space-xl)", justifyContent: "center", marginTop: "var(--space-md)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-xs)" }}>
              <div style={{ width: "12px", height: "12px", backgroundColor: "var(--color-success)", borderRadius: "var(--radius-xs)" }}></div>
              <span className="text-body-sm text-muted">Primary Sales</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-xs)" }}>
              <div style={{ width: "12px", height: "12px", backgroundColor: "var(--color-primary)", borderRadius: "var(--radius-xs)" }}></div>
              <span className="text-body-sm text-muted">Secondary Market</span>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Activity */}
      <section style={{ marginBottom: "var(--space-xxl)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-lg)" }}>
          <h2 className="text-heading-lg m-0">Recent Events</h2>
          <Link href="/admin/events" className="text-body-sm text-primary" style={{ textDecoration: "none" }}>
            View all events →
          </Link>
        </div>
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
                  Event Title
                </th>
                <th style={{ padding: "var(--space-md) var(--space-lg)", textAlign: "left", fontWeight: 600 }}>
                  Organizer
                </th>
                <th style={{ padding: "var(--space-md) var(--space-lg)", textAlign: "left", fontWeight: 600 }}>
                  Created At
                </th>
                <th style={{ padding: "var(--space-md) var(--space-lg)", textAlign: "center", fontWeight: 600 }}>
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {stats.recentEvents.map((event) => (
                <tr
                  key={event.id}
                  style={{
                    borderBottom: "1px solid var(--color-hairline)",
                  }}
                >
                  <td style={{ padding: "var(--space-md) var(--space-lg)", fontWeight: 500 }}>
                    {event.title}
                  </td>
                  <td style={{ padding: "var(--space-md) var(--space-lg)", color: "var(--color-ink)" }}>
                    <div>{event.organizer.name || "Unnamed Organizer"}</div>
                    <div style={{ fontSize: "11px", fontFamily: "monospace", color: "var(--color-ash)" }}>
                      {event.organizer.walletAddress}
                    </div>
                  </td>
                  <td style={{ padding: "var(--space-md) var(--space-lg)", color: "var(--color-ash)" }}>
                    {new Date(event.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </td>
                  <td style={{ padding: "var(--space-md) var(--space-lg)", textAlign: "center" }}>
                    <span
                      style={{
                        display: "inline-block",
                        padding: "4px 8px",
                        borderRadius: "var(--radius-full)",
                        fontSize: "11px",
                        fontWeight: 600,
                        backgroundColor:
                          event.status === "PUBLISHED" || event.status === "ONGOING"
                            ? "rgba(16, 185, 129, 0.15)"
                            : event.status === "CANCELLED"
                            ? "rgba(239, 68, 68, 0.15)"
                            : "rgba(251, 191, 36, 0.15)",
                        color:
                          event.status === "PUBLISHED" || event.status === "ONGOING"
                            ? "#10b981"
                            : event.status === "CANCELLED"
                            ? "#ef4444"
                            : "#fbbf24",
                      }}
                    >
                      {event.status}
                    </span>
                  </td>
                </tr>
              ))}
              {stats.recentEvents.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ padding: "var(--space-xl)", textAlign: "center", color: "var(--color-ash)" }}>
                    No events created yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

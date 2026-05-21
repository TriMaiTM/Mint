"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";

interface Event {
  id: string;
  title: string;
  category: string | null;
  venue: string | null;
  status: "DRAFT" | "PUBLISHED" | "ONGOING" | "ENDED" | "CANCELLED";
  createdAt: string;
  organizer: {
    name: string | null;
    walletAddress: string;
  };
  _count: {
    tickets: number;
    ticketTiers: number;
  };
}

export default function AdminEventsPage() {
  const { isConnected } = useAccount();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingEventId, setUpdatingEventId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchEvents = async (query = "", status = "", pageNum = 1) => {
    try {
      setLoading(true);
      const res = await fetch(
        `/api/admin/events?search=${encodeURIComponent(query)}&status=${status}&page=${pageNum}&limit=10`
      );
      if (!res.ok) {
        throw new Error("Failed to fetch events");
      }
      const data = await res.json();
      setEvents(data.events);
      setTotalPages(data.pagination.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load events");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isConnected) {
      fetchEvents(search, statusFilter, page);
    } else {
      setLoading(false);
    }
  }, [isConnected, page]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchEvents(search, statusFilter, 1);
  };

  const handleStatusFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setStatusFilter(val);
    setPage(1);
    fetchEvents(search, val, 1);
  };

  const handleStatusChange = async (eventId: string, newStatus: string) => {
    try {
      setUpdatingEventId(eventId);
      setError(null);
      const res = await fetch("/api/admin/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, status: newStatus }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update event status");
      }

      setEvents((prevEvents) =>
        prevEvents.map((e) => (e.id === eventId ? { ...e, status: newStatus as any } : e))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update status");
    } finally {
      setUpdatingEventId(null);
    }
  };

  if (!isConnected) {
    return (
      <div style={{ textAlign: "center", padding: "var(--space-xxl) 0" }}>
        <h1 className="text-heading-xl mb-md">Events Moderation</h1>
        <p className="text-body-md text-muted mb-lg">
          Please connect your wallet to access platform events moderation.
        </p>
      </div>
    );
  }

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
          <h1 className="text-display-lg">Events Moderation</h1>
          <p className="text-body-md text-muted mt-sm">
            Search, filter, approve, cancel or moderate all events on the platform.
          </p>
        </div>
      </header>

      {/* Search & Filter Bar */}
      <div style={{ marginBottom: "var(--space-xl)" }}>
        <form onSubmit={handleSearchSubmit} style={{ display: "flex", gap: "var(--space-sm)", flexWrap: "wrap" }}>
          <input
            type="text"
            placeholder="Search by event title or venue..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              flex: 1,
              minWidth: "250px",
              padding: "var(--space-md) var(--space-lg)",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--color-hairline)",
              backgroundColor: "var(--color-surface-soft)",
              color: "var(--color-ink)",
              fontSize: "15px",
            }}
          />
          <select
            value={statusFilter}
            onChange={handleStatusFilterChange}
            style={{
              padding: "var(--space-md) var(--space-lg)",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--color-hairline)",
              backgroundColor: "var(--color-surface-soft)",
              color: "var(--color-ink)",
              fontSize: "15px",
              minWidth: "150px",
            }}
          >
            <option value="">All Statuses</option>
            <option value="DRAFT">DRAFT</option>
            <option value="PUBLISHED">PUBLISHED</option>
            <option value="ONGOING">ONGOING</option>
            <option value="ENDED">ENDED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
          <button type="submit" className="btn-primary" style={{ minWidth: "120px" }}>
            Search
          </button>
        </form>
      </div>

      {error && (
        <div
          style={{
            padding: "var(--space-md) var(--space-lg)",
            backgroundColor: "rgba(239, 68, 68, 0.1)",
            border: "1px solid rgba(239, 68, 68, 0.2)",
            color: "var(--color-error)",
            borderRadius: "var(--radius-md)",
            marginBottom: "var(--space-xl)",
            fontSize: "14px",
          }}
        >
          ⚠️ {error}
        </div>
      )}

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-xxl) 0" }}>
          <div className="spinner" />
        </div>
      ) : (
        <>
          {/* Events Table */}
          <div className="card" style={{ overflowX: "auto", background: "var(--color-surface-soft)", padding: 0, marginBottom: "var(--space-xl)" }}>
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
                    Event Title / Details
                  </th>
                  <th style={{ padding: "var(--space-md) var(--space-lg)", textAlign: "left", fontWeight: 600 }}>
                    Organizer
                  </th>
                  <th style={{ padding: "var(--space-md) var(--space-lg)", textAlign: "center", fontWeight: 600 }}>
                    Tiers
                  </th>
                  <th style={{ padding: "var(--space-md) var(--space-lg)", textAlign: "center", fontWeight: 600 }}>
                    Tickets Sold
                  </th>
                  <th style={{ padding: "var(--space-md) var(--space-lg)", textAlign: "center", fontWeight: 600, width: "180px" }}>
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => (
                  <tr
                    key={event.id}
                    style={{
                      borderBottom: "1px solid var(--color-hairline)",
                    }}
                  >
                    <td style={{ padding: "var(--space-md) var(--space-lg)" }}>
                      <div style={{ fontWeight: 600, color: "var(--color-ink)", fontSize: "16px" }}>
                        {event.title}
                      </div>
                      <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
                        <span
                          style={{
                            fontSize: "11px",
                            backgroundColor: "rgba(255, 255, 255, 0.08)",
                            padding: "2px 6px",
                            borderRadius: "var(--radius-xs)",
                            color: "var(--color-ash)",
                          }}
                        >
                          {event.category || "General"}
                        </span>
                        <span style={{ fontSize: "12px", color: "var(--color-ash)" }}>
                          📍 {event.venue || "Virtual / No venue"}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: "var(--space-md) var(--space-lg)" }}>
                      <div style={{ fontWeight: 500, color: "var(--color-ink)" }}>
                        {event.organizer.name || "Unnamed Organizer"}
                      </div>
                      <div style={{ fontSize: "11px", fontFamily: "monospace", color: "var(--color-ash)", marginTop: "2px" }}>
                        {event.organizer.walletAddress}
                      </div>
                    </td>
                    <td style={{ padding: "var(--space-md) var(--space-lg)", textAlign: "center" }}>
                      <span>{event._count.ticketTiers}</span>
                    </td>
                    <td style={{ padding: "var(--space-md) var(--space-lg)", textAlign: "center" }}>
                      <span style={{ fontWeight: 600 }}>{event._count.tickets}</span>
                    </td>
                    <td style={{ padding: "var(--space-md) var(--space-lg)", textAlign: "center" }}>
                      <select
                        value={event.status}
                        onChange={(e) => handleStatusChange(event.id, e.target.value)}
                        disabled={updatingEventId === event.id}
                        style={{
                          padding: "8px 12px",
                          borderRadius: "var(--radius-sm)",
                          border: "1px solid var(--color-hairline)",
                          backgroundColor: "var(--color-surface-card)",
                          color:
                            event.status === "PUBLISHED" || event.status === "ONGOING"
                              ? "#10b981"
                              : event.status === "CANCELLED"
                              ? "#ef4444"
                              : "#fbbf24",
                          width: "100%",
                          fontSize: "14px",
                          fontWeight: 600,
                          cursor: updatingEventId === event.id ? "not-allowed" : "pointer",
                        }}
                      >
                        <option value="DRAFT" style={{ color: "#fbbf24" }}>DRAFT</option>
                        <option value="PUBLISHED" style={{ color: "#10b981" }}>PUBLISHED</option>
                        <option value="ONGOING" style={{ color: "#10b981" }}>ONGOING</option>
                        <option value="ENDED" style={{ color: "var(--color-ash)" }}>ENDED</option>
                        <option value="CANCELLED" style={{ color: "#ef4444" }}>CANCELLED</option>
                      </select>
                    </td>
                  </tr>
                ))}
                {events.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ padding: "var(--space-xl)", textAlign: "center", color: "var(--color-ash)" }}>
                      No events found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: "flex", justifyContent: "center", gap: "var(--space-sm)", marginTop: "var(--space-lg)" }}>
              <button
                className="btn-secondary"
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={page === 1}
                style={{ padding: "8px 16px" }}
              >
                Previous
              </button>
              <span style={{ alignSelf: "center", color: "var(--color-ash)", fontSize: "14px" }}>
                Page {page} of {totalPages}
              </span>
              <button
                className="btn-secondary"
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                disabled={page === totalPages}
                style={{ padding: "8px 16px" }}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";

type OrganizerRequest = {
  id: string;
  userId: string;
  userWalletAddress: string;
  userName: string;
  orgName: string;
  email: string;
  website: string;
  description: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
  updatedAt: string;
};

export default function AdminOrganizerRequestsPage() {
  const [requests, setRequests] = useState<OrganizerRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"ALL" | "PENDING" | "APPROVED" | "REJECTED">("ALL");

  useEffect(() => {
    fetchRequests();
  }, []);

  async function fetchRequests() {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/organizer-requests");
      const data = await res.json();
      if (res.ok && data.success) {
        // Sort requests by createdAt desc
        const sorted = (data.requests || []).sort(
          (a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setRequests(sorted);
      } else {
        throw new Error(data.error ?? "Failed to fetch organizer requests");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error fetching requests");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleAction(requestId: string, action: "APPROVE" | "REJECT") {
    setProcessingId(requestId);
    setError(null);
    try {
      const res = await fetch("/api/admin/organizer-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, action }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        // Update local state
        setRequests((prev) =>
          prev.map((r) => (r.id === requestId ? data.request : r))
        );
      } else {
        throw new Error(data.error ?? `Failed to ${action.toLowerCase()} request`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setProcessingId(null);
    }
  }

  const filteredRequests = requests.filter(
    (r) => filter === "ALL" || r.status === filter
  );

  const stats = {
    total: requests.length,
    pending: requests.filter((r) => r.status === "PENDING").length,
    approved: requests.filter((r) => r.status === "APPROVED").length,
    rejected: requests.filter((r) => r.status === "REJECTED").length,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-xl)" }}>
      {/* Page Title */}
      <div>
        <h1 className="text-display-md" style={{ margin: 0 }}>Organizer Applications</h1>
        <p className="text-body-md text-muted mt-xs">
          Review and approve or reject organizer verification requests from users.
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <div
          style={{
            padding: "var(--space-md)",
            backgroundColor: "rgba(239, 68, 68, 0.1)",
            border: "1px solid var(--color-error)",
            borderRadius: "var(--radius-md)",
            color: "var(--color-error)",
            display: "flex",
            alignItems: "center",
            gap: "var(--space-sm)",
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* Quick Stats Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "var(--space-md)",
        }}
      >
        <div className="card-feature-soft" style={{ padding: "var(--space-md) var(--space-lg)" }}>
          <p className="text-caption-md text-muted" style={{ margin: 0, textTransform: "uppercase" }}>Total Requests</p>
          <p className="text-display-xs" style={{ margin: "var(--space-xs) 0 0 0" }}>{stats.total}</p>
        </div>
        <div
          className="card-feature-soft"
          style={{
            padding: "var(--space-md) var(--space-lg)",
            borderLeft: "4px solid orange",
          }}
        >
          <p className="text-caption-md text-muted" style={{ margin: 0, textTransform: "uppercase" }}>Pending</p>
          <p className="text-display-xs" style={{ margin: "var(--space-xs) 0 0 0", color: "orange" }}>{stats.pending}</p>
        </div>
        <div
          className="card-feature-soft"
          style={{
            padding: "var(--space-md) var(--space-lg)",
            borderLeft: "4px solid green",
          }}
        >
          <p className="text-caption-md text-muted" style={{ margin: 0, textTransform: "uppercase" }}>Approved</p>
          <p className="text-display-xs" style={{ margin: "var(--space-xs) 0 0 0", color: "green" }}>{stats.approved}</p>
        </div>
        <div
          className="card-feature-soft"
          style={{
            padding: "var(--space-md) var(--space-lg)",
            borderLeft: "4px solid var(--color-error)",
          }}
        >
          <p className="text-caption-md text-muted" style={{ margin: 0, textTransform: "uppercase" }}>Rejected</p>
          <p className="text-display-xs" style={{ margin: "var(--space-xs) 0 0 0", color: "var(--color-error)" }}>{stats.rejected}</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: "flex", gap: "var(--space-sm)", borderBottom: "1px solid var(--color-hairline)", paddingBottom: "var(--space-sm)" }}>
        {(["ALL", "PENDING", "APPROVED", "REJECTED"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            style={{
              padding: "var(--space-sm) var(--space-md)",
              borderRadius: "var(--radius-md)",
              border: "none",
              background: filter === t ? "rgba(230, 0, 35, 0.08)" : "transparent",
              color: filter === t ? "var(--color-primary)" : "var(--color-ink)",
              fontWeight: filter === t ? 600 : 500,
              cursor: "pointer",
            }}
          >
            {t.charAt(0) + t.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* Applications List */}
      {isLoading ? (
        <div className="text-center" style={{ padding: "var(--space-xxl) 0" }}>
          <p className="text-body-md text-muted">Loading applications...</p>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="card-feature-soft text-center" style={{ padding: "var(--space-xl) 0" }}>
          <p className="text-heading-md">No applications found</p>
          <p className="text-body-md text-muted mt-sm">No organizer requests match the selected filter.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-md)" }}>
          {filteredRequests.map((req) => (
            <div
              key={req.id}
              className="card-feature-soft"
              style={{
                padding: "var(--space-lg) var(--space-xl)",
                border: "1px solid var(--color-hairline)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: "var(--space-md)",
                }}
              >
                <div>
                  <h3 className="text-heading-md" style={{ margin: 0, display: "flex", alignItems: "center", gap: "var(--space-sm)" }}>
                    {req.orgName}
                    <span
                      style={{
                        fontSize: "0.75rem",
                        padding: "2px 8px",
                        borderRadius: "12px",
                        fontWeight: "bold",
                        backgroundColor:
                          req.status === "PENDING"
                            ? "rgba(245, 158, 11, 0.15)"
                            : req.status === "APPROVED"
                            ? "rgba(46, 125, 50, 0.15)"
                            : "rgba(239, 68, 68, 0.15)",
                        color:
                          req.status === "PENDING"
                            ? "orange"
                            : req.status === "APPROVED"
                            ? "green"
                            : "var(--color-error)",
                      }}
                    >
                      {req.status}
                    </span>
                  </h3>
                  <p className="text-caption-md text-muted" style={{ margin: "4px 0 0 0" }}>
                    Submitted by {req.userName} ({req.userWalletAddress.substring(0, 6)}...{req.userWalletAddress.substring(38)}) on {new Date(req.createdAt).toLocaleString()}
                  </p>
                </div>

                {req.status === "PENDING" && (
                  <div style={{ display: "flex", gap: "var(--space-sm)" }}>
                    <button
                      className="btn-primary"
                      onClick={() => handleAction(req.id, "APPROVE")}
                      disabled={processingId !== null}
                      style={{
                        backgroundColor: "green",
                        color: "white",
                        height: "36px",
                        padding: "0 16px",
                        fontSize: "0.85rem",
                      }}
                    >
                      {processingId === req.id ? "..." : "Approve"}
                    </button>
                    <button
                      className="btn-secondary"
                      onClick={() => handleAction(req.id, "REJECT")}
                      disabled={processingId !== null}
                      style={{
                        height: "36px",
                        padding: "0 16px",
                        fontSize: "0.85rem",
                        borderColor: "var(--color-error)",
                        color: "var(--color-error)",
                      }}
                    >
                      {processingId === req.id ? "..." : "Reject"}
                    </button>
                  </div>
                )}
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 2fr",
                  gap: "var(--space-md)",
                  fontSize: "0.9rem",
                  borderTop: "1px solid var(--color-hairline-soft)",
                  paddingTop: "var(--space-md)",
                }}
              >
                <div>
                  <p style={{ margin: "0 0 var(--space-xs) 0" }}>
                    <strong>Email:</strong> <a href={`mailto:${req.email}`} style={{ color: "var(--color-primary)" }}>{req.email}</a>
                  </p>
                  {req.website && (
                    <p style={{ margin: 0 }}>
                      <strong>Website:</strong> <a href={req.website} target="_blank" rel="noopener noreferrer" style={{ color: "var(--color-primary)" }}>{req.website}</a>
                    </p>
                  )}
                </div>
                <div>
                  <p style={{ margin: "0 0 4px 0" }}><strong>Credentials/Reason:</strong></p>
                  <p style={{ margin: 0, whiteSpace: "pre-wrap", color: "var(--color-ink)" }}>{req.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

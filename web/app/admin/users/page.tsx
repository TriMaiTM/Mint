"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";

interface User {
  id: string;
  name: string | null;
  email: string | null;
  walletAddress: string;
  role: "USER" | "ORGANIZER" | "ADMIN";
  createdAt: string;
  _count: {
    tickets: number;
    organizedEvents: number;
  };
}

export default function AdminUsersPage() {
  const { address, isConnected } = useAccount();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchUsers = async (query = "", pageNum = 1) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/users?search=${encodeURIComponent(query)}&page=${pageNum}&limit=10`);
      if (!res.ok) {
        throw new Error("Failed to fetch users");
      }
      const data = await res.json();
      setUsers(data.users);
      setTotalPages(data.pagination.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isConnected) {
      fetchUsers(search, page);
    } else {
      setLoading(false);
    }
  }, [isConnected, page]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchUsers(search, 1);
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      setUpdatingUserId(userId);
      setError(null);
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: newRole }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update role");
      }

      setUsers((prevUsers) =>
        prevUsers.map((u) => (u.id === userId ? { ...u, role: newRole as any } : u))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update role");
    } finally {
      setUpdatingUserId(null);
    }
  };

  if (!isConnected) {
    return (
      <div style={{ textAlign: "center", padding: "var(--space-xxl) 0" }}>
        <h1 className="text-heading-xl mb-md">Users Management</h1>
        <p className="text-body-md text-muted mb-lg">
          Please connect your wallet to access platform user management.
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
          <h1 className="text-display-lg">Users Management</h1>
          <p className="text-body-md text-muted mt-sm">
            Search users, view statistics, and update platform roles.
          </p>
        </div>
      </header>

      {/* Search Bar */}
      <div style={{ marginBottom: "var(--space-xl)" }}>
        <form onSubmit={handleSearchSubmit} style={{ display: "flex", gap: "var(--space-sm)" }}>
          <input
            type="text"
            placeholder="Search by name, email, or wallet address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              flex: 1,
              padding: "var(--space-md) var(--space-lg)",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--color-hairline)",
              backgroundColor: "var(--color-surface-soft)",
              color: "var(--color-ink)",
              fontSize: "15px",
            }}
          />
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
          {/* Users Table */}
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
                    User Info
                  </th>
                  <th style={{ padding: "var(--space-md) var(--space-lg)", textAlign: "center", fontWeight: 600 }}>
                    Tickets Owned
                  </th>
                  <th style={{ padding: "var(--space-md) var(--space-lg)", textAlign: "center", fontWeight: 600 }}>
                    Events Organized
                  </th>
                  <th style={{ padding: "var(--space-md) var(--space-lg)", textAlign: "left", fontWeight: 600 }}>
                    Registered Date
                  </th>
                  <th style={{ padding: "var(--space-md) var(--space-lg)", textAlign: "center", fontWeight: 600, width: "180px" }}>
                    Role
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const isSelf = address && user.walletAddress.toLowerCase() === address.toLowerCase();

                  return (
                    <tr
                      key={user.id}
                      style={{
                        borderBottom: "1px solid var(--color-hairline)",
                      }}
                    >
                      <td style={{ padding: "var(--space-md) var(--space-lg)" }}>
                        <div style={{ fontWeight: 600, color: "var(--color-ink)" }}>
                          {user.name || "Unnamed User"} {isSelf && <span style={{ fontSize: "11px", color: "var(--color-primary)" }}>(You)</span>}
                        </div>
                        <div style={{ fontSize: "13px", color: "var(--color-ash)", marginTop: "2px" }}>
                          {user.email || "No email"}
                        </div>
                        <div style={{ fontSize: "11px", fontFamily: "monospace", color: "var(--color-ash)", marginTop: "2px" }}>
                          {user.walletAddress}
                        </div>
                      </td>
                      <td style={{ padding: "var(--space-md) var(--space-lg)", textAlign: "center" }}>
                        <span style={{ fontWeight: 600 }}>{user._count.tickets}</span>
                      </td>
                      <td style={{ padding: "var(--space-md) var(--space-lg)", textAlign: "center" }}>
                        <span style={{ fontWeight: 600 }}>{user._count.organizedEvents}</span>
                      </td>
                      <td style={{ padding: "var(--space-md) var(--space-lg)", color: "var(--color-ash)" }}>
                        {new Date(user.createdAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                      <td style={{ padding: "var(--space-md) var(--space-lg)", textAlign: "center" }}>
                        <select
                          value={user.role}
                          onChange={(e) => handleRoleChange(user.id, e.target.value)}
                          disabled={updatingUserId === user.id || !!isSelf}
                          style={{
                            padding: "8px 12px",
                            borderRadius: "var(--radius-sm)",
                            border: "1px solid var(--color-hairline)",
                            backgroundColor: "var(--color-surface-card)",
                            color: "var(--color-ink)",
                            width: "100%",
                            fontSize: "14px",
                            cursor: updatingUserId === user.id || !!isSelf ? "not-allowed" : "pointer",
                          }}
                        >
                          <option value="USER">USER</option>
                          <option value="ORGANIZER">ORGANIZER</option>
                          <option value="ADMIN">ADMIN</option>
                        </select>
                      </td>
                    </tr>
                  );
                })}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ padding: "var(--space-xl)", textAlign: "center", color: "var(--color-ash)" }}>
                      No users found.
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

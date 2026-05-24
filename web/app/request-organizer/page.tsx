"use client";

import { FormEvent, useEffect, useState } from "react";
import { useWalletAuth } from "@/hooks/use-wallet-auth";
import { Nav } from "@/components/layout/nav";
import { Footer } from "@/components/layout/footer";

type OrganizerRequest = {
  id: string;
  orgName: string;
  email: string;
  website: string;
  description: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
};

export default function RequestOrganizerPage() {
  const { user, isAuthenticated, isLoadingSession } = useWalletAuth();

  const [existingRequest, setExistingRequest] = useState<OrganizerRequest | null>(null);
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);

  // Form states
  const [orgName, setOrgName] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [description, setDescription] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      setIsLoadingConfig(false);
      return;
    }

    let active = true;
    fetch("/api/organizer/request")
      .then((res) => res.json())
      .then((data) => {
        if (active && data.success && data.request) {
          setExistingRequest(data.request);
        }
      })
      .catch((err) => console.error("Error fetching request status:", err))
      .finally(() => {
        if (active) setIsLoadingConfig(false);
      });

    return () => {
      active = false;
    };
  }, [isAuthenticated]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage(null);
    setIsError(false);

    try {
      const res = await fetch("/api/organizer/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgName, email, website, description }),
      });

      const payload = await res.json();
      if (!res.ok) {
        throw new Error(payload.error ?? "Failed to submit request");
      }

      setMessage("Your organizer request has been submitted successfully!");
      setExistingRequest(payload.request);
    } catch (err) {
      setIsError(true);
      setMessage(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <Nav />

      <main className="container section-gap" style={{ minHeight: "70vh" }}>
        <div style={{ maxWidth: "640px", margin: "0 auto" }}>
          {/* Header */}
          <header style={{ marginBottom: "var(--space-xxl)", textAlign: "center" }}>
            <h1 className="text-display-md">Become an Organizer</h1>
            <p className="text-body-md text-muted mt-sm">
              Apply to become a verified event organizer to create events and sell tickets on-chain.
            </p>
          </header>

          {isLoadingSession || isLoadingConfig ? (
            <div className="text-center" style={{ padding: "var(--space-xxl) 0" }}>
              <p className="text-body-md text-muted">Loading your application details...</p>
            </div>
          ) : !isAuthenticated ? (
            <div className="card-feature-soft text-center" style={{ padding: "var(--space-xl)" }}>
              <p className="text-heading-md">Wallet Connection Required</p>
              <p className="text-body-md text-muted mt-md">
                Please connect your wallet and sign in to submit an organizer application.
              </p>
            </div>
          ) : user?.role === "ORGANIZER" || user?.role === "ADMIN" ? (
            <div
              className="card-feature-soft text-center"
              style={{
                padding: "var(--space-xl)",
                border: "1px solid rgba(46, 125, 50, 0.3)",
                backgroundColor: "rgba(46, 125, 50, 0.05)",
              }}
            >
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "50%",
                  backgroundColor: "rgba(46, 125, 50, 0.1)",
                  color: "green",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto var(--space-md) auto",
                }}
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <p className="text-heading-md" style={{ color: "green" }}>
                Already an Organizer / Admin
              </p>
              <p className="text-body-md text-muted mt-sm">
                Your account ({user.role}) already has full permissions to manage events on the platform.
              </p>
            </div>
          ) : existingRequest && existingRequest.status === "PENDING" ? (
            <div
              className="card-feature-soft"
              style={{
                padding: "var(--space-xl)",
                border: "1px solid rgba(245, 158, 11, 0.3)",
                backgroundColor: "rgba(245, 158, 11, 0.05)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "var(--space-md)", marginBottom: "var(--space-lg)" }}>
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    backgroundColor: "rgba(245, 158, 11, 0.1)",
                    color: "orange",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-heading-md" style={{ color: "orange", margin: 0 }}>
                    Application Pending Review
                  </h3>
                  <p className="text-caption-md text-muted" style={{ margin: 0 }}>
                    Submitted on {new Date(existingRequest.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div style={{ marginBottom: "var(--space-md)" }}>
                <p className="text-body-sm-strong text-muted" style={{ marginBottom: "4px" }}>Organization Name</p>
                <p className="text-body-md" style={{ margin: 0 }}>{existingRequest.orgName}</p>
              </div>

              <div style={{ marginBottom: "var(--space-md)" }}>
                <p className="text-body-sm-strong text-muted" style={{ marginBottom: "4px" }}>Contact Email</p>
                <p className="text-body-md" style={{ margin: 0 }}>{existingRequest.email}</p>
              </div>

              {existingRequest.website && (
                <div style={{ marginBottom: "var(--space-md)" }}>
                  <p className="text-body-sm-strong text-muted" style={{ marginBottom: "4px" }}>Website URL</p>
                  <p className="text-body-md" style={{ margin: 0 }}>
                    <a href={existingRequest.website} target="_blank" rel="noopener noreferrer" style={{ color: "var(--color-primary)" }}>
                      {existingRequest.website}
                    </a>
                  </p>
                </div>
              )}

              <div style={{ marginBottom: "var(--space-md)" }}>
                <p className="text-body-sm-strong text-muted" style={{ marginBottom: "4px" }}>Description</p>
                <p className="text-body-md" style={{ margin: 0, whiteSpace: "pre-wrap" }}>{existingRequest.description}</p>
              </div>

              <div
                style={{
                  marginTop: "var(--space-lg)",
                  paddingTop: "var(--space-md)",
                  borderTop: "1px solid rgba(245, 158, 11, 0.2)",
                  fontSize: "0.9rem",
                  color: "var(--color-text-body)",
                }}
              >
                Our administrators are currently reviewing your application details. You will receive an role upgrade status as soon as it is approved.
              </div>
            </div>
          ) : (
            <div className="card-feature">
              {existingRequest && existingRequest.status === "REJECTED" && (
                <div
                  style={{
                    padding: "var(--space-md) var(--space-lg)",
                    backgroundColor: "rgba(239, 68, 68, 0.08)",
                    border: "1px solid rgba(239, 68, 68, 0.3)",
                    borderRadius: "var(--radius-md)",
                    color: "var(--color-error)",
                    marginBottom: "var(--space-lg)",
                    fontSize: "0.9rem",
                  }}
                >
                  <p className="text-body-strong" style={{ margin: "0 0 4px 0" }}>Previous Application Rejected</p>
                  <p style={{ margin: 0 }}>
                    Your previous request to become an organizer was rejected. You may review your information and submit a new request below.
                  </p>
                </div>
              )}

              <form onSubmit={onSubmit}>
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-lg)" }}>
                  <div>
                    <label
                      className="text-body-strong"
                      style={{ display: "block", marginBottom: "var(--space-xs)" }}
                      htmlFor="orgName"
                    >
                      Organization Name
                    </label>
                    <input
                      id="orgName"
                      className="input-text"
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      placeholder="Acme Corporation"
                      required
                    />
                  </div>

                  <div>
                    <label
                      className="text-body-strong"
                      style={{ display: "block", marginBottom: "var(--space-xs)" }}
                      htmlFor="email"
                    >
                      Contact Email
                    </label>
                    <input
                      id="email"
                      type="email"
                      className="input-text"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="contact@acme.com"
                      required
                    />
                  </div>

                  <div>
                    <label
                      className="text-body-strong"
                      style={{ display: "block", marginBottom: "var(--space-xs)" }}
                      htmlFor="website"
                    >
                      Website URL <span className="text-body-sm text-muted">(optional)</span>
                    </label>
                    <input
                      id="website"
                      type="url"
                      className="input-text"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      placeholder="https://acme.com"
                    />
                  </div>

                  <div>
                    <label
                      className="text-body-strong"
                      style={{ display: "block", marginBottom: "var(--space-xs)" }}
                      htmlFor="description"
                    >
                      Organization Description & Credentials
                    </label>
                    <textarea
                      id="description"
                      className="input-text"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Please tell us about your team, event history, or why you want to become an organizer..."
                      rows={5}
                      style={{ height: "auto", resize: "vertical" }}
                      required
                    />
                  </div>

                  <div>
                    <button
                      type="submit"
                      className="btn-primary"
                      disabled={isSubmitting}
                      style={{ width: "100%", height: "48px" }}
                    >
                      {isSubmitting ? "Submitting application..." : "Submit Application"}
                    </button>

                    {message && (
                      <p
                        className="text-body-md mt-md"
                        style={{
                          textAlign: "center",
                          color: isError ? "var(--color-error)" : "var(--color-success-deep)",
                          fontWeight: "bold",
                        }}
                      >
                        {message}
                      </p>
                    )}
                  </div>
                </div>
              </form>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}

"use client";

import { useState } from "react";
import { QRScanner } from "@/components/organizer/qr-scanner";
import { Nav } from "@/components/layout/nav";

type CheckInResult = {
  success: boolean;
  message: string;
  ticketData?: {
    ticketId: string;
    eventId: string;
    tokenId: number;
    owner?: string;
  };
};

export default function CheckInPage() {
  const [result, setResult] = useState<CheckInResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [scanKey, setScanKey] = useState(0);

  const handleScan = async (decodedText: string) => {
    if (isProcessing) return;
    setIsProcessing(true);
    setResult(null);

    try {
      const payload = JSON.parse(decodedText);

      if (
        !payload.ticketId ||
        !payload.eventId ||
        payload.tokenId === undefined
      ) {
        throw new Error("Invalid QR code format.");
      }

      const response = await fetch("/api/tickets/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Check-in failed.");
      }

      setResult({
        success: true,
        message: `Check-in successful! Token #${payload.tokenId}`,
        ticketData: payload,
      });
    } catch (error) {
      setResult({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Invalid QR code or connection error.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const resetScanner = () => {
    setResult(null);
    setScanKey((prev) => prev + 1);
  };

  return (
    <>
      {/* ── Navigation ── */}
      <Nav />

      {/* ── Page Content ── */}
      <main className="container section-gap" style={{ maxWidth: "600px" }}>
        <header
          style={{ textAlign: "center", marginBottom: "var(--space-xxl)" }}
        >
          <h1 className="text-display-lg">Check-in</h1>
          <p className="text-body-md text-muted mt-sm">
            Scan attendee QR codes to validate and check in tickets.
          </p>
        </header>

        <div className="card-feature">
          {!result ? (
            <>
              <p
                className="text-body-md text-muted"
                style={{ textAlign: "center", marginBottom: "var(--space-lg)" }}
              >
                Point the camera at the attendee&apos;s QR code
              </p>

              <div
                className="qr-container"
                style={{ marginBottom: "var(--space-lg)" }}
              >
                <QRScanner key={scanKey} onScanSuccess={handleScan} />
              </div>

              {isProcessing && (
                <p
                  className="text-body-md"
                  style={{
                    textAlign: "center",
                    color: "var(--color-accent-blue)",
                  }}
                >
                  Processing...
                </p>
              )}
            </>
          ) : (
            <div style={{ textAlign: "center", padding: "var(--space-xxl) 0" }}>
              {/* Status Icon */}
              <div
                style={{
                  width: "64px",
                  height: "64px",
                  margin: "0 auto var(--space-lg)",
                  borderRadius: "var(--radius-full)",
                  backgroundColor: result.success
                    ? "var(--color-success-pale)"
                    : "var(--color-error)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "28px",
                }}
              >
                {result.success ? "✓" : "✕"}
              </div>

              {/* Message */}
              <h2
                className="text-heading-lg mb-md"
                style={{
                  color: result.success
                    ? "var(--color-success-deep)"
                    : "var(--color-error)",
                }}
              >
                {result.message}
              </h2>

              {/* Ticket Data */}
              {result.ticketData && (
                <div
                  className="card-feature-soft"
                  style={{
                    textAlign: "left",
                    marginBottom: "var(--space-xl)",
                  }}
                >
                  <p className="text-body-sm text-muted mb-sm">
                    Ticket Details
                  </p>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "var(--space-sm)",
                    }}
                  >
                    <div>
                      <p className="text-body-sm text-muted">Token ID</p>
                      <p className="text-body-strong">
                        #{result.ticketData.tokenId}
                      </p>
                    </div>
                    <div>
                      <p className="text-body-sm text-muted">Event</p>
                      <p
                        className="text-body-strong"
                        style={{ wordBreak: "break-all" }}
                      >
                        {result.ticketData.eventId}
                      </p>
                    </div>
                    {result.ticketData.owner && (
                      <div style={{ gridColumn: "1 / -1" }}>
                        <p className="text-body-sm text-muted">Owner</p>
                        <p
                          className="text-body-sm"
                          style={{
                            fontFamily: "monospace",
                            wordBreak: "break-all",
                          }}
                        >
                          {result.ticketData.owner}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Scan Next */}
              <button
                className="btn-primary"
                onClick={resetScanner}
                type="button"
                style={{ minWidth: "200px" }}
              >
                Scan Next Ticket
              </button>
            </div>
          )}
        </div>
      </main>
    </>
  );
}

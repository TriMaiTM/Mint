"use client";

import { useState, useEffect } from "react";
import { QRScanner } from "@/components/organizer/qr-scanner";
import Link from "next/link";

type TicketDetails = {
  id: string;
  tokenId: number;
  isUsed: boolean;
  usedAt: string;
  owner: {
    name: string | null;
    email: string | null;
    walletAddress: string;
  };
  tier: {
    name: string;
    price: string;
  };
  event: {
    title: string;
  };
};

type CheckInResult = {
  success: boolean;
  message: string;
  errorType?: "EXPIRED" | "SIGNATURE" | "USED" | "PERMISSION" | "OTHER";
  ticket?: TicketDetails;
};

// Play audio feedback using web audio API (synthesizer)
function playFeedbackSound(type: "success" | "error") {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    if (type === "success") {
      // Short double beep
      const osc1 = audioCtx.createOscillator();
      const gain1 = audioCtx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc1.connect(gain1);
      gain1.connect(audioCtx.destination);
      gain1.gain.setValueAtTime(0.1, audioCtx.currentTime);
      osc1.start();
      osc1.stop(audioCtx.currentTime + 0.08);

      setTimeout(() => {
        const osc2 = audioCtx.createOscillator();
        const gain2 = audioCtx.createGain();
        osc2.type = "sine";
        osc2.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
        osc2.connect(gain2);
        gain2.connect(audioCtx.destination);
        gain2.gain.setValueAtTime(0.1, audioCtx.currentTime);
        osc2.start();
        osc2.stop(audioCtx.currentTime + 0.15);
      }, 100);
    } else {
      // Buzz alarm
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(130, audioCtx.currentTime); // Low buzz
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      osc.start();
      
      osc.frequency.exponentialRampToValueAtTime(70, audioCtx.currentTime + 0.35);
      osc.stop(audioCtx.currentTime + 0.38);
    }
  } catch (err) {
    console.error("Audio feedback error:", err);
  }
}

export default function CheckInPage() {
  const [result, setResult] = useState<CheckInResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [autoResume, setAutoResume] = useState(true);
  const [secondsLeft, setSecondsLeft] = useState(0);

  const [history, setHistory] = useState<TicketDetails[]>([]);
  const [historySearch, setHistorySearch] = useState("");
  const [loadingHistory, setLoadingHistory] = useState(true);

  const fetchHistory = async () => {
    try {
      const res = await fetch("/api/organizer/check-in-history");
      if (res.ok) {
        const data = await res.json();
        setHistory(data.data || []);
      }
    } catch (e) {
      console.error("Error fetching check-in history:", e);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

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
        throw new Error("Invalid QR code format. Please scan a secure dynamic QR code.");
      }

      const response = await fetch("/api/tickets/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        const errMsg = data.error || "Check-in failed.";
        let errorType: "EXPIRED" | "SIGNATURE" | "USED" | "PERMISSION" | "OTHER" = "OTHER";
        
        if (errMsg.includes("hết hạn") || errMsg.includes("expired")) {
          errorType = "EXPIRED";
        } else if (errMsg.includes("Chữ ký") || errMsg.includes("signature")) {
          errorType = "SIGNATURE";
        } else if (errMsg.includes("used") || errMsg.includes("sử dụng")) {
          errorType = "USED";
        } else if (errMsg.includes("organizer")) {
          errorType = "PERMISSION";
        }

        playFeedbackSound("error");
        setResult({
          success: false,
          message: errMsg,
          errorType,
        });
        return;
      }

      playFeedbackSound("success");
      setResult({
        success: true,
        message: `Ticket #${data.ticket.tokenId} is valid!`,
        ticket: data.ticket,
      });

      // Update local history log safely
      setHistory((prev) => {
        if (prev.some((t) => t.id === data.ticket.id)) return prev;
        return [data.ticket, ...prev];
      });
    } catch (error) {
      playFeedbackSound("error");
      setResult({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to decode QR or network error.",
        errorType: "OTHER",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const resetScanner = () => {
    setResult(null);
    setSecondsLeft(0);
  };

  // Auto-resume timer countdown effect
  useEffect(() => {
    if (!result || !autoResume) {
      setSecondsLeft(0);
      return;
    }

    setSecondsLeft(5);

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          resetScanner();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [result, autoResume]);

  return (
    <>
      {/* ── Main Container ── */}
      <div 
        className="container" 
        style={{ 
          maxWidth: "1000px", 
          margin: "0 auto",
          padding: "0 var(--container-gutter)",
          display: "flex", 
          flexDirection: "column", 
          alignItems: "center" 
        }}
      >
          <header style={{ textAlign: "center", marginBottom: "var(--space-xl)", width: "100%" }}>
            <div 
              style={{ 
                display: "inline-block", 
                backgroundColor: "var(--color-surface-card)", 
                border: "1px solid var(--color-hairline)",
                color: "var(--color-primary)", 
                padding: "6px 14px", 
                borderRadius: "var(--radius-full)", 
                fontSize: "0.8rem", 
                fontWeight: "600",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: "var(--space-sm)"
              }}
            >
              Check-in System
            </div>
            <h1 className="text-display-lg" style={{ color: "var(--color-ink)", fontWeight: "700", margin: "0 0 var(--space-xs) 0" }}>
              NFT Ticket Check-in Gate
            </h1>
            <p className="text-body-md text-muted" style={{ color: "var(--color-mute)", margin: 0 }}>
              Automated ticket validation via camera scanner. Read results instantly in real-time.
            </p>
          </header>

          {/* ── 2-Column Responsive Layout ── */}
          <div 
            style={{ 
              width: "100%",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: "var(--space-lg)",
              alignItems: "stretch"
            }}
          >
            {/* ── LEFT COLUMN: CAMERA SCANNER (Always Visible) ── */}
            <div 
              style={{ 
                backgroundColor: "var(--color-surface-card)",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--color-hairline)",
                boxShadow: "0 8px 30px rgba(0, 0, 0, 0.04)",
                padding: "var(--space-lg)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "space-between"
              }}
            >
              <div style={{ width: "100%", textAlign: "center", marginBottom: "var(--space-md)" }}>
                <p
                  style={{ 
                    fontSize: "1.05rem",
                    fontWeight: "600",
                    color: "var(--color-ink)",
                    margin: "0 0 var(--space-xs) 0"
                  }}
                >
                  Camera Scanner
                </p>
                <p style={{ fontSize: "0.85rem", color: "var(--color-mute)", margin: 0 }}>
                  {isProcessing 
                    ? "⏳ Reading ticket info..." 
                    : result 
                      ? "⏸️ Paused to view result" 
                      : "📷 Active, scanning QR code..."}
                </p>
              </div>

              {/* Scanner box with dynamic border matching system success/error */}
              <div
                style={{ 
                  width: "100%",
                  maxWidth: "340px",
                  borderRadius: "var(--radius-md)",
                  overflow: "hidden",
                  border: isProcessing 
                    ? "2px solid var(--color-primary)"
                    : result
                      ? (result.success ? "2px solid var(--color-success-deep)" : "2px solid var(--color-error)")
                      : "2px solid var(--color-hairline)",
                  backgroundColor: "var(--color-surface-soft)",
                  padding: "var(--space-xs)",
                  position: "relative",
                  transition: "all 0.3s ease",
                  boxShadow: isProcessing
                    ? "0 0 15px rgba(230, 0, 35, 0.15)"
                    : result
                      ? (result.success ? "0 0 15px var(--color-success-pale)" : "0 0 15px rgba(239, 68, 68, 0.15)")
                      : "none"
                }}
              >
                <QRScanner onScanSuccess={handleScan} isPaused={!!result || isProcessing} />
                
                {/* Scan Overlay Lines */}
                <div 
                  style={{
                    position: "absolute",
                    top: "0",
                    left: "0",
                    right: "0",
                    bottom: "0",
                    pointerEvents: "none",
                    boxShadow: "inset 0 0 40px rgba(0,0,0,0.03)",
                  }}
                />
                
                {/* Holographic Laser line (only when scanning) */}
                {!result && !isProcessing && (
                  <div 
                    style={{
                      position: "absolute",
                      top: "10%",
                      left: "5%",
                      width: "90%",
                      height: "2px",
                      background: "linear-gradient(90deg, transparent, var(--color-primary), transparent)",
                      boxShadow: "0 0 8px var(--color-primary)",
                      animation: "scanLine 2s linear infinite",
                      pointerEvents: "none"
                    }}
                  />
                )}
              </div>

              {/* Scanning Status Badge */}
              <div style={{ marginTop: "var(--space-md)", width: "100%", display: "flex", justifyContent: "center" }}>
                {isProcessing ? (
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--color-primary)", fontSize: "0.9rem", fontWeight: "600" }}>
                    <div className="spinner" style={{
                      width: "14px",
                      height: "14px",
                      border: "2px solid transparent",
                      borderTopColor: "var(--color-primary)",
                      borderRadius: "50%",
                      animation: "spin 0.8s linear infinite"
                    }}/>
                    <span>Decoding...</span>
                  </div>
                ) : result ? (
                  <button 
                    className="btn-secondary" 
                    onClick={resetScanner}
                    style={{ fontSize: "0.85rem", padding: "6px 14px" }}
                  >
                    ▶ Resume Scanning
                  </button>
                ) : (
                  <span style={{ fontSize: "0.85rem", color: "var(--color-primary)", display: "flex", alignItems: "center", gap: "6px", fontWeight: "600" }}>
                    <span style={{ display: "inline-block", width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "var(--color-success-deep)", animation: "pulse 1.5s infinite" }}/>
                    Ready to scan
                  </span>
                )}
              </div>
            </div>

            {/* ── RIGHT COLUMN: SCAN RESULTS (Updates Dynamically) ── */}
            <div 
              style={{ 
                backgroundColor: "var(--color-surface-card)",
                borderRadius: "var(--radius-md)",
                border: result 
                  ? (result.success ? "1px solid var(--color-success-deep)" : "1px solid var(--color-error)")
                  : "1px solid var(--color-hairline)",
                boxShadow: result
                  ? (result.success ? "0 0 25px var(--color-success-pale)" : "0 0 25px rgba(239, 68, 68, 0.08)")
                  : "0 8px 30px rgba(0, 0, 0, 0.04)",
                backdropFilter: "blur(12px)",
                padding: "var(--space-lg)",
                transition: "all 0.3s ease-in-out",
                display: "flex",
                flexDirection: "column",
                justifyContent: result ? "flex-start" : "center",
                minHeight: "420px"
              }}
            >
              {!result && !isProcessing ? (
                /* PLACEHOLDER STATE */
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "var(--space-xl) 0" }}>
                  <div 
                    style={{ 
                      fontSize: "4rem", 
                      marginBottom: "var(--space-md)", 
                      color: "var(--color-stone)",
                      opacity: 0.5,
                      animation: "float 3s ease-in-out infinite"
                    }}
                  >
                    🎫
                  </div>
                  <h3 style={{ fontSize: "1.2rem", fontWeight: "600", color: "var(--color-ink)", margin: "0 0 var(--space-xs) 0" }}>
                    No Scans Yet
                  </h3>
                  <p style={{ fontSize: "0.9rem", color: "var(--color-mute)", maxWidth: "280px", margin: 0 }}>
                    Hold the attendee's dynamic QR code in front of the camera to verify their ticket.
                  </p>
                </div>
              ) : isProcessing ? (
                /* LOADING STATE */
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "var(--space-xl) 0" }}>
                  <div className="spinner" style={{
                    width: "48px",
                    height: "48px",
                    border: "4px solid var(--color-hairline)",
                    borderTopColor: "var(--color-primary)",
                    borderRadius: "50%",
                    animation: "spin 0.8s linear infinite",
                    marginBottom: "var(--space-lg)"
                  }}/>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: "600", color: "var(--color-ink)", margin: "0 0 var(--space-xs) 0" }}>
                    Verifying Ticket
                  </h3>
                  <p style={{ fontSize: "0.9rem", color: "var(--color-mute)", maxWidth: "280px", margin: 0 }}>
                    Validating cryptographic signature and on-chain status...
                  </p>
                </div>
              ) : result ? (
                /* ACTIVE RESULT STATE */
                <div style={{ display: "flex", flexDirection: "column", height: "100%", justifyContent: "space-between" }}>
                  <div>
                    {/* Status Circle & Message */}
                    <div style={{ display: "flex", alignItems: "center", gap: "var(--space-md)", marginBottom: "var(--space-md)" }}>
                      <div
                        style={{
                          width: "44px",
                          height: "44px",
                          borderRadius: "50%",
                          backgroundColor: result.success
                            ? "var(--color-success-pale)"
                            : "rgba(239, 68, 68, 0.08)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "20px",
                          color: result.success ? "var(--color-success-deep)" : "var(--color-error)",
                          border: result.success ? "2px solid var(--color-success-deep)" : "2px solid var(--color-error)",
                          fontWeight: "700"
                        }}
                      >
                        {result.success ? "✓" : "✕"}
                      </div>
                      <div>
                        <h2
                          style={{
                            fontSize: "1.25rem",
                            fontWeight: "700",
                            margin: 0,
                            color: result.success ? "var(--color-success-deep)" : "var(--color-error)",
                            textTransform: "uppercase"
                          }}
                        >
                          {result.success ? "Valid" : "Invalid"}
                        </h2>
                        <p style={{ fontSize: "0.85rem", color: "var(--color-ink)", margin: 0 }}>
                          {result.message}
                        </p>
                      </div>
                    </div>

                    {/* Error Guidance Banners */}
                    {!result.success && (
                      <div
                        style={{
                          backgroundColor: "rgba(239, 68, 68, 0.03)",
                          borderRadius: "var(--radius-sm)",
                          padding: "12px var(--space-md)",
                          border: "1px solid rgba(239, 68, 68, 0.15)",
                          marginBottom: "var(--space-md)",
                          fontSize: "0.85rem",
                          lineHeight: "1.4"
                        }}
                      >
                        <strong style={{ display: "block", color: "var(--color-ink)", marginBottom: "4px" }}>
                          ⚠️ Troubleshooting:
                        </strong>
                        {result.errorType === "EXPIRED" && (
                          <span style={{ color: "var(--color-primary)" }}>
                            QR code expired. Ask the attendee to tap <strong>"Refresh Code"</strong> in their app to generate a fresh signed QR code.
                          </span>
                        )}
                        {result.errorType === "SIGNATURE" && (
                          <span style={{ color: "var(--color-error)" }}>
                            Cryptographic signature mismatch. The QR code may be a screenshot or a fake ticket. Deny entry.
                          </span>
                        )}
                        {result.errorType === "USED" && (
                          <span style={{ color: "var(--color-error)" }}>
                            Ticket has already been checked in. Please check prior check-in times.
                          </span>
                        )}
                        {result.errorType === "PERMISSION" && (
                          <span style={{ color: "var(--color-error)" }}>
                            You do not have organizer permissions to check in attendees for this event.
                          </span>
                        )}
                        {result.errorType === "OTHER" && (
                          <span style={{ color: "var(--color-mute)" }}>
                            Please check network connection, ask attendee to refresh their page, and scan again.
                          </span>
                        )}
                      </div>
                    )}

                    {/* Detailed Ticket Info Card */}
                    {result.success && result.ticket && (
                      <div
                        style={{
                          backgroundColor: "var(--color-surface-soft)",
                          borderRadius: "var(--radius-sm)",
                          border: "1px solid var(--color-hairline)",
                          padding: "14px",
                          marginBottom: "var(--space-md)",
                          display: "flex",
                          flexDirection: "column",
                          gap: "12px"
                        }}
                      >
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", borderBottom: "1px solid var(--color-hairline)", paddingBottom: "10px" }}>
                          <div>
                            <span style={{ fontSize: "0.75rem", color: "var(--color-mute)", display: "block" }}>TICKET TIER</span>
                            <strong style={{ fontSize: "0.9rem", color: "var(--color-accent-blue)" }}>
                              {result.ticket.tier.name}
                            </strong>
                          </div>
                          <div>
                            <span style={{ fontSize: "0.75rem", color: "var(--color-mute)", display: "block" }}>TOKEN ID</span>
                            <strong style={{ fontSize: "0.9rem", color: "var(--color-success-deep)" }}>
                              #{result.ticket.tokenId}
                            </strong>
                          </div>
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                          <div>
                            <span style={{ fontSize: "0.75rem", color: "var(--color-mute)", display: "block" }}>ATTENDEE</span>
                            <strong style={{ fontSize: "0.9rem", color: "var(--color-ink)" }}>
                              {result.ticket.owner.name ?? "Not set"}
                            </strong>
                          </div>
                          <div>
                            <span style={{ fontSize: "0.75rem", color: "var(--color-mute)", display: "block" }}>EMAIL</span>
                            <span style={{ fontSize: "0.85rem", color: "var(--color-ink-soft)", wordBreak: "break-all" }}>
                              {result.ticket.owner.email ?? "Not set"}
                            </span>
                          </div>
                          <div>
                            <span style={{ fontSize: "0.75rem", color: "var(--color-mute)", display: "block" }}>WALLET ADDRESS</span>
                            <span style={{ fontSize: "0.75rem", color: "var(--color-mute)", fontFamily: "monospace", wordBreak: "break-all" }}>
                              {result.ticket.owner.walletAddress}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Footer Actions & Countdown */}
                  <div style={{ borderTop: "1px solid var(--color-hairline)", paddingTop: "var(--space-md)", display: "flex", flexDirection: "column", gap: "10px" }}>
                    {autoResume && secondsLeft > 0 ? (
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "0.85rem", color: "var(--color-ink)" }}>
                        <span>
                          🔄 Auto-resuming scan in <strong style={{ color: "var(--color-primary)" }}>{secondsLeft}s</strong>...
                        </span>
                        <button 
                          style={{ background: "none", border: "none", color: "var(--color-primary)", cursor: "pointer", fontSize: "0.8rem", padding: "0 4px", fontWeight: "600" }}
                          onClick={() => setAutoResume(false)}
                        >
                          [Pause]
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "0.85rem", color: "var(--color-mute)" }}>
                        <span>Auto-resume is disabled.</span>
                        <button 
                          style={{ background: "none", border: "none", color: "var(--color-primary)", cursor: "pointer", fontSize: "0.8rem", padding: "0 4px", fontWeight: "600" }}
                          onClick={() => {
                            setAutoResume(true);
                            setSecondsLeft(5);
                          }}
                        >
                          [Enable]
                        </button>
                      </div>
                    )}

                    {/* Manual trigger */}
                    <button
                      className="btn-primary"
                      onClick={resetScanner}
                      type="button"
                      style={{ 
                        width: "100%", 
                        backgroundColor: result.success ? "var(--color-success-deep)" : "var(--color-primary)",
                        color: "var(--color-on-primary)",
                        fontSize: "0.95rem",
                        fontWeight: "600",
                        padding: "10px 16px",
                        borderRadius: "var(--radius-md)",
                      }}
                    >
                      Scan Next Ticket
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          {/* ── CHECK-IN HISTORY BLOCK ── */}
          <div
            style={{
              width: "100%",
              marginTop: "var(--space-xxl)",
              backgroundColor: "var(--color-surface-card)",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--color-hairline)",
              boxShadow: "0 8px 30px rgba(0, 0, 0, 0.04)",
              padding: "var(--space-lg)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "var(--space-md)",
                marginBottom: "var(--space-lg)",
                borderBottom: "1px solid var(--color-hairline)",
                paddingBottom: "var(--space-md)",
              }}
            >
              <div>
                <h2 className="text-heading-lg" style={{ margin: 0, color: "var(--color-ink)", fontWeight: 700 }}>
                  Recent Check-ins
                </h2>
                <p className="text-body-sm text-muted" style={{ margin: "4px 0 0 0" }}>
                  Real-time entry logs for your events. Total checked in: <strong>{history.length}</strong>
                </p>
              </div>
              
              {/* Search filter input */}
              <input
                type="text"
                placeholder="Search by name, email, token ID, or wallet..."
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                style={{
                  padding: "8px 14px",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--color-hairline)",
                  backgroundColor: "var(--color-surface-soft)",
                  color: "var(--color-ink)",
                  fontSize: "14px",
                  minWidth: "260px",
                }}
              />
            </div>

            {loadingHistory ? (
              <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-xl) 0" }}>
                <div className="spinner" style={{ width: "24px", height: "24px" }} />
              </div>
            ) : history.length === 0 ? (
              <div style={{ textAlign: "center", padding: "var(--space-xl) 0", color: "var(--color-mute)" }}>
                No attendees checked in yet.
              </div>
            ) : history.filter((t) => {
                const query = historySearch.toLowerCase();
                return (
                  t.owner.name?.toLowerCase().includes(query) ||
                  t.owner.email?.toLowerCase().includes(query) ||
                  t.owner.walletAddress.toLowerCase().includes(query) ||
                  t.tokenId.toString().includes(query) ||
                  t.event.title.toLowerCase().includes(query) ||
                  t.tier.name.toLowerCase().includes(query)
                );
              }).length === 0 ? (
              <div style={{ textAlign: "center", padding: "var(--space-xl) 0", color: "var(--color-mute)" }}>
                No matching check-in records found.
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid var(--color-hairline)", color: "var(--color-mute)", textAlign: "left" }}>
                      <th style={{ padding: "8px var(--space-sm)", fontWeight: 600 }}>Time</th>
                      <th style={{ padding: "8px var(--space-sm)", fontWeight: 600 }}>Attendee</th>
                      <th style={{ padding: "8px var(--space-sm)", fontWeight: 600 }}>Event / Tier</th>
                      <th style={{ padding: "8px var(--space-sm)", fontWeight: 600, textAlign: "center" }}>Token ID</th>
                      <th style={{ padding: "8px var(--space-sm)", fontWeight: 600, textAlign: "right" }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history
                      .filter((t) => {
                        const query = historySearch.toLowerCase();
                        return (
                          t.owner.name?.toLowerCase().includes(query) ||
                          t.owner.email?.toLowerCase().includes(query) ||
                          t.owner.walletAddress.toLowerCase().includes(query) ||
                          t.tokenId.toString().includes(query) ||
                          t.event.title.toLowerCase().includes(query) ||
                          t.tier.name.toLowerCase().includes(query)
                        );
                      })
                      .map((item) => (
                        <tr key={item.id} style={{ borderBottom: "1px solid var(--color-hairline)" }}>
                          <td style={{ padding: "var(--space-sm) var(--space-sm)", color: "var(--color-mute)", whiteSpace: "nowrap" }}>
                            {new Date(item.usedAt).toLocaleTimeString("en-US", {
                              hour: "numeric",
                              minute: "2-digit",
                              second: "2-digit",
                            })}
                          </td>
                          <td style={{ padding: "var(--space-sm) var(--space-sm)" }}>
                            <strong style={{ display: "block", color: "var(--color-ink)" }}>{item.owner.name || "Unnamed"}</strong>
                            <span style={{ fontSize: "11px", color: "var(--color-mute)", display: "block" }}>{item.owner.email || "No email"}</span>
                            <span style={{ fontSize: "10px", fontFamily: "monospace", color: "var(--color-mute)" }}>
                              {item.owner.walletAddress.slice(0, 8)}...{item.owner.walletAddress.slice(-6)}
                            </span>
                          </td>
                          <td style={{ padding: "var(--space-sm) var(--space-sm)" }}>
                            <span style={{ display: "block", color: "var(--color-ink)", fontWeight: 500 }}>{item.event.title}</span>
                            <span style={{ fontSize: "11px", color: "var(--color-primary)", fontWeight: 600 }}>{item.tier.name}</span>
                          </td>
                          <td style={{ padding: "var(--space-sm) var(--space-sm)", textAlign: "center", fontWeight: 600, color: "var(--color-success-deep)" }}>
                            #{item.tokenId}
                          </td>
                          <td style={{ padding: "var(--space-sm) var(--space-sm)", textAlign: "right" }}>
                            <span
                              style={{
                                padding: "4px 8px",
                                borderRadius: "var(--radius-full)",
                                fontSize: "11px",
                                fontWeight: 600,
                                backgroundColor: "var(--color-success-pale)",
                                color: "var(--color-success-deep)",
                              }}
                            >
                              ✓ Checked In
                            </span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

      {/* Embedded CSS for scanner animations & video enhancements */}
      <style dangerouslySetInnerHTML={{ __html: `
        .scanner-container video {
          border-radius: var(--radius-md) !important;
          object-fit: cover !important;
          width: 100% !important;
          height: 100% !important;
        }
        .scanner-container a {
          display: none !important;
        }
        @keyframes scanLine {
          0% { top: 10%; }
          50% { top: 90%; }
          100% { top: 10%; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0% { transform: scale(0.95); opacity: 0.5; }
          50% { transform: scale(1.1); opacity: 1; }
          100% { transform: scale(0.95); opacity: 0.5; }
        }
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
          100% { transform: translateY(0px); }
        }
      `}} />
    </>
  );
}

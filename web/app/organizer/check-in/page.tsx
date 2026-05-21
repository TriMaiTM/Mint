"use client";

import { useState } from "react";
import { QRScanner } from "@/components/organizer/qr-scanner";
import { Nav } from "@/components/layout/nav";

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
        throw new Error("Mã QR không đúng định dạng. Vui lòng quét mã QR động bảo mật.");
      }

      const response = await fetch("/api/tickets/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        const errMsg = data.error || "Check-in thất bại.";
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
        message: `Vé #${data.ticket.tokenId} hợp lệ!`,
        ticket: data.ticket,
      });
    } catch (error) {
      playFeedbackSound("error");
      setResult({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Lỗi giải mã QR hoặc kết nối mạng.",
        errorType: "OTHER",
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
    <div style={{ backgroundColor: "#0b0b0c", minHeight: "100vh", color: "#e4e4e7" }}>
      {/* ── Navigation ── */}
      <Nav />

      {/* ── Main Container ── */}
      <main 
        className="container" 
        style={{ 
          maxWidth: "640px", 
          padding: "var(--space-xxl) var(--space-md)",
          display: "flex", 
          flexDirection: "column", 
          alignItems: "center" 
        }}
      >
        <header style={{ textAlign: "center", marginBottom: "var(--space-xl)", width: "100%" }}>
          <div 
            style={{ 
              display: "inline-block", 
              backgroundColor: "rgba(99, 102, 241, 0.15)", 
              color: "#a5b4fc", 
              padding: "6px 14px", 
              borderRadius: "var(--radius-full)", 
              fontSize: "0.8rem", 
              fontWeight: "600",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              marginBottom: "var(--space-sm)"
            }}
          >
            Hệ thống Kiểm Soát Vé
          </div>
          <h1 className="text-display-md" style={{ color: "#ffffff", fontWeight: "700", margin: "0 0 var(--space-xs) 0" }}>
            Cổng Check-in Vé NFT
          </h1>
          <p className="text-body-md text-muted" style={{ color: "#a1a1aa", margin: 0 }}>
            Quét mã QR động có chữ ký số của khách dự tiệc để xác thực và check-in vé.
          </p>
        </header>

        {/* ── Glassmorphic card container ── */}
        <div 
          style={{ 
            width: "100%",
            backgroundColor: "rgba(20, 20, 23, 0.7)",
            borderRadius: "var(--radius-md)",
            border: result 
              ? (result.success ? "1px solid rgba(16, 185, 129, 0.4)" : "1px solid rgba(239, 68, 68, 0.4)")
              : "1px solid rgba(255, 255, 255, 0.08)",
            boxShadow: result
              ? (result.success ? "0 0 25px rgba(16, 185, 129, 0.15)" : "0 0 25px rgba(239, 68, 68, 0.15)")
              : "0 12px 40px rgba(0, 0, 0, 0.4)",
            backdropFilter: "blur(12px)",
            padding: "var(--space-xl)",
            transition: "all 0.3s ease-in-out"
          }}
        >
          {!result ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <p
                style={{ 
                  textAlign: "center", 
                  marginBottom: "var(--space-lg)",
                  fontSize: "0.95rem",
                  color: "#d4d4d8"
                }}
              >
                Đặt mã QR động trước camera thiết bị của bạn
              </p>

              <div
                style={{ 
                  width: "100%",
                  maxWidth: "400px",
                  borderRadius: "var(--radius-md)",
                  overflow: "hidden",
                  border: "2px dashed rgba(255, 255, 255, 0.15)",
                  backgroundColor: "rgba(0, 0, 0, 0.2)",
                  padding: "var(--space-xs)",
                  position: "relative"
                }}
              >
                <QRScanner key={scanKey} onScanSuccess={handleScan} />
                
                {/* Visual scanner guideline lines */}
                <div 
                  style={{
                    position: "absolute",
                    top: "0",
                    left: "0",
                    right: "0",
                    bottom: "0",
                    pointerEvents: "none",
                    boxShadow: "inset 0 0 40px rgba(0,0,0,0.5)"
                  }}
                />
              </div>

              {isProcessing && (
                <div 
                  style={{ 
                    marginTop: "var(--space-lg)",
                    display: "flex", 
                    alignItems: "center", 
                    gap: "10px",
                    color: "#a5b4fc"
                  }}
                >
                  <div className="spinner" style={{
                    width: "18px",
                    height: "18px",
                    border: "2px solid transparent",
                    borderTopColor: "#a5b4fc",
                    borderRadius: "50%",
                    animation: "spin 0.8s linear infinite"
                  }}/>
                  <p style={{ margin: 0, fontSize: "0.95rem", fontWeight: "500" }}>
                    Đang xử lý dữ liệu vé...
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              {/* Status Circle Header */}
              <div
                style={{
                  width: "72px",
                  height: "72px",
                  borderRadius: "50%",
                  backgroundColor: result.success
                    ? "rgba(16, 185, 129, 0.15)"
                    : "rgba(239, 68, 68, 0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "32px",
                  color: result.success ? "#10b981" : "#ef4444",
                  marginBottom: "var(--space-md)",
                  border: result.success
                    ? "2px solid #10b981"
                    : "2px solid #ef4444",
                  boxShadow: result.success
                    ? "0 0 15px rgba(16, 185, 129, 0.3)"
                    : "0 0 15px rgba(239, 68, 68, 0.3)"
                }}
              >
                {result.success ? "✓" : "✕"}
              </div>

              {/* Status message */}
              <h2
                style={{
                  fontSize: "1.5rem",
                  fontWeight: "700",
                  textAlign: "center",
                  margin: "0 0 var(--space-xs) 0",
                  color: result.success ? "#10b981" : "#ef4444",
                }}
              >
                {result.success ? "QUÉT VÉ THÀNH CÔNG!" : "QUÉT VÉ THẤT BẠI"}
              </h2>

              <p 
                style={{ 
                  textAlign: "center", 
                  margin: "0 0 var(--space-xl) 0",
                  color: "#d4d4d8",
                  fontSize: "1rem"
                }}
              >
                {result.message}
              </p>

              {/* Error Guidance Banners */}
              {!result.success && (
                <div
                  style={{
                    width: "100%",
                    backgroundColor: "rgba(255, 255, 255, 0.02)",
                    borderRadius: "var(--radius-sm)",
                    padding: "16px",
                    border: "1px solid rgba(255, 255, 255, 0.06)",
                    marginBottom: "var(--space-xl)",
                    fontSize: "0.9rem",
                    lineHeight: "1.5"
                  }}
                >
                  <strong style={{ display: "block", color: "#f4f4f5", marginBottom: "6px" }}>
                    ⚠️ Hướng dẫn xử lý:
                  </strong>
                  {result.errorType === "EXPIRED" && (
                    <span style={{ color: "#fbbf24" }}>
                      Mã QR này đã quá hạn 60 giây để đảm bảo bảo mật chống sao chép. Vui lòng hướng dẫn khách hàng bấm <strong>"Tải lại mã mới"</strong> trên màn hình vé của họ rồi thực hiện quét lại.
                    </span>
                  )}
                  {result.errorType === "SIGNATURE" && (
                    <span style={{ color: "#f87171" }}>
                      Mã QR có chữ ký số không chính chủ hoặc không trùng khớp với tài khoản sở hữu NFT vé này. Khách hàng này có thể đã chụp ảnh vé của người khác. Vui lòng từ chối check-in.
                    </span>
                  )}
                  {result.errorType === "USED" && (
                    <span style={{ color: "#ef4444" }}>
                      Vé NFT này đã được check-in sử dụng trước đó tại cổng vé và không còn hiệu lực. Vui lòng đối chiếu với khách hàng.
                    </span>
                  )}
                  {result.errorType === "PERMISSION" && (
                    <span style={{ color: "#fb7185" }}>
                      Bạn không phải ban tổ chức hoặc người sở hữu sự kiện này trên blockchain nên không có thẩm quyền kiểm duyệt vé cho khách hàng này.
                    </span>
                  )}
                  {result.errorType === "OTHER" && (
                    <span style={{ color: "#a1a1aa" }}>
                      Hệ thống không thể định vị vé hoặc xác thực. Vui lòng yêu cầu khách hàng kiểm tra lại mạng kết nối, làm mới trang "My Tickets" và thử lại.
                    </span>
                  )}
                </div>
              )}

              {/* Detailed Ticket Info Card */}
              {result.success && result.ticket && (
                <div
                  style={{
                    width: "100%",
                    backgroundColor: "rgba(255, 255, 255, 0.03)",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid rgba(255, 255, 255, 0.06)",
                    padding: "20px",
                    marginBottom: "var(--space-xl)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "16px"
                  }}
                >
                  <h3 style={{ color: "#ffffff", fontSize: "1.1rem", fontWeight: "600", borderBottom: "1px solid rgba(255, 255, 255, 0.08)", paddingBottom: "10px", margin: 0 }}>
                    🎫 Thông Tin Vé
                  </h3>
                  
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                    <div>
                      <span style={{ fontSize: "0.8rem", color: "#a1a1aa", display: "block" }}>TÊN SỰ KIỆN</span>
                      <strong style={{ fontSize: "0.95rem", color: "#ffffff", wordBreak: "break-word" }}>
                        {result.ticket.event.title}
                      </strong>
                    </div>

                    <div>
                      <span style={{ fontSize: "0.8rem", color: "#a1a1aa", display: "block" }}>HẠNG VÉ (TIER)</span>
                      <strong style={{ fontSize: "0.95rem", color: "#60a5fa" }}>
                        {result.ticket.tier.name}
                      </strong>
                    </div>

                    <div>
                      <span style={{ fontSize: "0.8rem", color: "#a1a1aa", display: "block" }}>TOKEN ID ON-CHAIN</span>
                      <strong style={{ fontSize: "0.95rem", color: "#34d399" }}>
                        #{result.ticket.tokenId}
                      </strong>
                    </div>

                    <div>
                      <span style={{ fontSize: "0.8rem", color: "#a1a1aa", display: "block" }}>GIÁ VÉ GỐC</span>
                      <strong style={{ fontSize: "0.95rem", color: "#fbbf24" }}>
                        {Number(result.ticket.tier.price).toFixed(3)} POL
                      </strong>
                    </div>
                  </div>

                  <h3 style={{ color: "#ffffff", fontSize: "1.1rem", fontWeight: "600", borderBottom: "1px solid rgba(255, 255, 255, 0.08)", paddingBottom: "10px", margin: "10px 0 0 0" }}>
                    👤 Thông Tin Khách Hàng
                  </h3>

                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    <div>
                      <span style={{ fontSize: "0.8rem", color: "#a1a1aa", display: "block" }}>TÊN KHÁCH HÀNG</span>
                      <strong style={{ fontSize: "0.95rem", color: "#ffffff" }}>
                        {result.ticket.owner.name ?? "Chưa thiết lập"}
                      </strong>
                    </div>

                    <div>
                      <span style={{ fontSize: "0.8rem", color: "#a1a1aa", display: "block" }}>EMAIL LIÊN HỆ</span>
                      <strong style={{ fontSize: "0.95rem", color: "#ffffff" }}>
                        {result.ticket.owner.email ?? "Chưa thiết lập"}
                      </strong>
                    </div>

                    <div>
                      <span style={{ fontSize: "0.8rem", color: "#a1a1aa", display: "block" }}>ĐỊA CHỈ VÍ MINT</span>
                      <span 
                        style={{ 
                          fontSize: "0.85rem", 
                          color: "#cbd5e1", 
                          fontFamily: "monospace",
                          wordBreak: "break-all" 
                        }}
                      >
                        {result.ticket.owner.walletAddress}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Button: Scan Next */}
              <button
                className="btn-primary"
                onClick={resetScanner}
                type="button"
                style={{ 
                  minWidth: "240px", 
                  backgroundColor: result.success ? "#10b981" : "#e60023",
                  color: "#ffffff",
                  fontSize: "1rem",
                  fontWeight: "600",
                  padding: "12px 24px",
                  borderRadius: "var(--radius-sm)",
                  boxShadow: "0 4px 14px rgba(0, 0, 0, 0.2)",
                  transition: "all 0.2s"
                }}
              >
                Tiếp tục quét vé mới
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { useAccount, useSignMessage } from "wagmi";

type TicketQRProps = {
  ticketId: string;
  eventId: string;
  tokenId: number;
  ownerAddress: string;
};

export function TicketQR({
  ticketId,
  eventId,
  tokenId,
  ownerAddress,
}: TicketQRProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();

  const [showQR, setShowQR] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [qrPayload, setQrPayload] = useState<string | null>(null);

  // Timer countdown
  useEffect(() => {
    if (!showQR || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [showQR, timeLeft]);

  // Render QR Code to Canvas when payload changes
  useEffect(() => {
    if (!showQR || !qrPayload || !canvasRef.current) return;

    QRCode.toCanvas(canvasRef.current, qrPayload, {
      width: 220,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#ffffff",
      },
    });
  }, [showQR, qrPayload]);

  async function generateSignedQR() {
    if (!isConnected || !address) {
      setError("Vui lòng kết nối ví để xác thực.");
      return;
    }

    if (address.toLowerCase() !== ownerAddress.toLowerCase()) {
      setError("Địa chỉ ví đang kết nối không trùng khớp với chủ sở hữu vé.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const timestamp = Math.floor(Date.now() / 1000);
      const message = `Verify ownership of Ticket #${tokenId} at timestamp: ${timestamp}`;
      
      const signature = await signMessageAsync({ message });

      const payloadObj = {
        ticketId,
        eventId,
        tokenId,
        owner: ownerAddress,
        timestamp,
        signature,
      };

      setQrPayload(JSON.stringify(payloadObj));
      setTimeLeft(60); // 60 seconds validity
      setShowQR(true);
    } catch (err) {
      console.error("Signature failed:", err);
      setError(
        err instanceof Error ? err.message : "Người dùng từ chối ký xác nhận quyền sở hữu."
      );
      setShowQR(false);
    } finally {
      setLoading(false);
    }
  }

  function handleToggle() {
    if (showQR) {
      setShowQR(false);
      setQrPayload(null);
      setTimeLeft(0);
    } else {
      generateSignedQR();
    }
  }

  return (
    <div style={{ textAlign: "center" }}>
      <button
        className="btn-secondary"
        onClick={handleToggle}
        disabled={loading}
        type="button"
        style={{ width: "100%" }}
      >
        {loading ? "Đang xác thực..." : showQR ? "Ẩn QR" : "Hiện QR bảo mật"}
      </button>

      {error && (
        <p
          className="text-caption-md mt-sm"
          style={{ color: "var(--color-error)" }}
        >
          {error}
        </p>
      )}

      {showQR && qrPayload && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "var(--space-md)",
            marginTop: "var(--space-md)",
          }}
        >
          {timeLeft > 0 ? (
            <>
              <div style={{ position: "relative" }}>
                <canvas ref={canvasRef} />
              </div>
              <p
                className="text-body-sm-strong"
                style={{
                  color: timeLeft <= 10 ? "var(--color-error)" : "var(--color-accent-blue)",
                }}
              >
                Mã QR sẽ hết hạn sau: {timeLeft} giây
              </p>
              <p className="text-caption-md text-muted">
                Quét mã QR này tại cổng check-in. Mã sử dụng chữ ký ví để chống gian lận.
              </p>
            </>
          ) : (
            <div
              style={{
                width: 220,
                height: 220,
                backgroundColor: "var(--color-surface-soft)",
                borderRadius: "var(--radius-md)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "var(--space-md)",
              }}
            >
              <p className="text-body-sm" style={{ color: "var(--color-error)", fontWeight: "bold" }}>
                Mã QR đã hết hạn
              </p>
              <button
                className="btn-primary mt-sm"
                onClick={generateSignedQR}
                disabled={loading}
                type="button"
                style={{ fontSize: "13px", padding: "6px 16px" }}
              >
                Tải lại mã mới
              </button>
            </div>
          )}

          {timeLeft > 0 && (
            <button
              className="btn-primary"
              onClick={() => {
                navigator.clipboard.writeText(qrPayload);
                alert("Đã copy dữ liệu QR động (dùng để test Check-in)");
              }}
              type="button"
              style={{ fontSize: "12px", padding: "6px 16px" }}
            >
              Copy Payload (Test)
            </button>
          )}
        </div>
      )}
    </div>
  );
}

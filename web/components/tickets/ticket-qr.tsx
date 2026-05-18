"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";

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
  const [showQR, setShowQR] = useState(false);

  useEffect(() => {
    if (!showQR || !canvasRef.current) return;

    const payload = JSON.stringify({
      ticketId,
      eventId,
      tokenId,
      owner: ownerAddress,
      ts: Date.now(),
    });

    QRCode.toCanvas(canvasRef.current, payload, {
      width: 220,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#ffffff",
      },
    });
  }, [showQR, ticketId, eventId, tokenId, ownerAddress]);

  return (
    <div>
      <button
        className="btn-secondary"
        onClick={() => setShowQR(!showQR)}
        type="button"
      >
        {showQR ? "Ẩn QR" : "Hiện QR"}
      </button>

      {showQR && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "var(--space-3)",
            marginTop: "var(--space-4)",
          }}
        >
          <canvas ref={canvasRef} />
          <p className="text-caption-md text-muted">
            Quét mã QR này tại cổng check-in
          </p>
          <button
            className="btn-primary"
            onClick={() => {
              const payload = JSON.stringify({
                ticketId,
                eventId,
                tokenId,
                owner: ownerAddress,
                ts: Date.now(),
              });
              navigator.clipboard.writeText(payload);
              alert("Đã copy dữ liệu QR (dùng để test Check-in)");
            }}
            type="button"
            style={{ fontSize: "12px", padding: "6px 16px" }}
          >
            Copy Payload (Test)
          </button>
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";

type QRScannerProps = {
  onScanSuccess: (decodedText: string) => void;
};

export function QRScanner({ onScanSuccess }: QRScannerProps) {
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    const startScanner = async () => {
      try {
        const html5QrCode = new Html5Qrcode("qr-reader");
        scannerRef.current = html5QrCode;

        await html5QrCode.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
          },
          (decodedText) => {
            if (scannerRef.current?.isScanning) {
              scannerRef.current.pause();
            }
            onScanSuccess(decodedText);
          },
          () => {}, // Ignore scan errors
        );
      } catch (err) {
        setError(
          "Không thể khởi động camera. Vui lòng cấp quyền truy cập hoặc tải ảnh lên.",
        );
        console.error(err);

        // Still instantiate for file scanning even if camera fails
        if (!scannerRef.current) {
          scannerRef.current = new Html5Qrcode("qr-reader");
        }
      }
    };

    startScanner();

    return () => {
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(console.error);
      } else if (scannerRef.current) {
        scannerRef.current.clear();
      }
    };
  }, [onScanSuccess]);

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode("qr-reader");
      }

      const decodedText = await scannerRef.current.scanFile(file, true);
      onScanSuccess(decodedText);
    } catch (err) {
      setError("Không tìm thấy mã QR trong ảnh này. Vui lòng thử ảnh khác.");
      console.error(err);
    }
  };

  return (
    <div
      className="card-feature"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-4)",
      }}
    >
      {error && <p style={{ color: "var(--color-error)" }}>{error}</p>}

      <div
        id="qr-reader"
        style={{
          minHeight: "200px",
          borderRadius: "var(--radius-md)",
          overflow: "hidden",
        }}
      ></div>

      <div
        style={{
          textAlign: "center",
          padding: "var(--space-3) 0",
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-3)",
          alignItems: "center",
        }}
      >
        <p className="text-body-sm text-muted" style={{ margin: "0" }}>
          Các phương thức dự phòng (dành cho môi trường Test):
        </p>
        <div
          style={{
            display: "flex",
            gap: "var(--space-3)",
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          <label
            className="btn-primary"
            style={{ cursor: "pointer", display: "inline-block" }}
          >
            Tải ảnh QR
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              style={{ display: "none" }}
            />
          </label>

          <button
            className="btn-secondary"
            onClick={() => {
              const text = prompt(
                "Dán đoạn mã Payload đã copy từ trang My Tickets:",
              );
              if (text) onScanSuccess(text);
            }}
            type="button"
          >
            Dán Payload
          </button>
        </div>
      </div>
    </div>
  );
}

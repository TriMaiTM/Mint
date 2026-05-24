"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";

type QRScannerProps = {
  onScanSuccess: (decodedText: string) => void;
  isPaused: boolean;
};

export function QRScanner({ onScanSuccess, isPaused }: QRScannerProps) {
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isPausedRef = useRef(isPaused);

  // Sync isPaused to ref to avoid stale closure in main useEffect
  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  // Handle pause/resume dynamically without remounting
  useEffect(() => {
    const scanner = scannerRef.current;
    if (!scanner) return;

    if (isPaused) {
      if (scanner.isScanning) {
        try {
          scanner.pause();
        } catch (e) {
          console.warn("Dynamic pause failed:", e);
        }
      }
    } else {
      try {
        scanner.resume();
      } catch (e) {
        // Ignore if it was not paused
      }
    }
  }, [isPaused]);

  useEffect(() => {
    let isMounted = true;
    let html5QrCode: Html5Qrcode | null = null;
    let isStarting = false;
    let isStarted = false;
    let observer: MutationObserver | null = null;

    const container = containerRef.current;
    if (!container) return;

    // Create a dynamic div element inside the container to avoid ID conflicts
    const scannerId = `qr-reader-${Math.random().toString(36).substring(2, 9)}`;
    const scannerDiv = document.createElement("div");
    scannerDiv.id = scannerId;
    scannerDiv.style.width = "100%";
    scannerDiv.style.height = "100%";
    container.appendChild(scannerDiv);

    // Watch for <video> elements added by html5-qrcode and override play()
    observer = new MutationObserver((mutations) => {
      const video = scannerDiv.querySelector("video");
      if (video && !(video as any).__playPatched) {
        (video as any).__playPatched = true;
        const originalPlay = video.play;
        video.play = function (...args) {
          return originalPlay.apply(this, args).catch((err: any) => {
            if (
              err?.name === "AbortError" ||
              err?.message?.includes("media was removed") ||
              err?.message?.includes("interrupted")
            ) {
              console.warn("Caught play() interruption error safely.");
              return;
            }
            return Promise.reject(err);
          });
        };
      }
    });
    observer.observe(scannerDiv, { childList: true, subtree: true });

    const startScanner = async () => {
      try {
        if (!isMounted) return;
        isStarting = true;

        html5QrCode = new Html5Qrcode(scannerId);
        scannerRef.current = html5QrCode;

        const startPromise = html5QrCode.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
          },
          (decodedText) => {
            if (html5QrCode?.isScanning) {
              try {
                html5QrCode.pause();
              } catch (e) {
                console.warn("Callback pause failed:", e);
              }
            }
            onScanSuccess(decodedText);
          },
          () => {}, // Ignore scan errors
        );

        await startPromise;
        isStarted = true;
        isStarting = false;

        // If the scanner should be paused immediately after starting
        if (isMounted && isPausedRef.current && html5QrCode.isScanning) {
          try {
            html5QrCode.pause();
          } catch (e) {
            console.warn("Immediate start pause failed:", e);
          }
        }
      } catch (err) {
        isStarting = false;
        if (isMounted) {
          setError(
            "Không thể khởi động camera. Vui lòng cấp quyền truy cập hoặc tải ảnh lên.",
          );
          console.error("Camera start error:", err);
        }
      }
    };

    startScanner();

    return () => {
      isMounted = false;
      const cleanup = async () => {
        if (observer) {
          observer.disconnect();
        }

        // Wait if scanner is in the middle of starting up
        let attempts = 0;
        while (isStarting && attempts < 20) {
          await new Promise((resolve) => setTimeout(resolve, 100));
          attempts++;
        }

        if (html5QrCode) {
          try {
            if (html5QrCode.isScanning || isStarted) {
              await html5QrCode.stop();
            }
          } catch (e) {
            // Ignore stop errors during cleanup
          }

          try {
            html5QrCode.clear();
          } catch (clearErr) {
            // Ignore clear errors as the element is removed next anyway
          }
        }

        // Clean up the dynamic DOM element
        if (container.contains(scannerDiv)) {
          container.removeChild(scannerDiv);
        }
      };
      cleanup();
    };
  }, [onScanSuccess]);

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Create a temporary hidden div to scan the file without conflicting with the active camera scanner
    const tempId = `qr-file-scanner-${Math.random().toString(36).substring(2, 9)}`;
    const tempDiv = document.createElement("div");
    tempDiv.id = tempId;
    tempDiv.style.display = "none";
    document.body.appendChild(tempDiv);

    try {
      const fileScanner = new Html5Qrcode(tempId);
      const decodedText = await fileScanner.scanFile(file, true);
      
      try {
        fileScanner.clear();
      } catch (e) {}

      onScanSuccess(decodedText);
    } catch (err) {
      setError("Không tìm thấy mã QR trong ảnh này. Vui lòng thử ảnh khác.");
      console.error(err);
    } finally {
      if (document.body.contains(tempDiv)) {
        document.body.removeChild(tempDiv);
      }
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-md)",
        width: "100%",
        background: "transparent",
        padding: 0,
      }}
    >
      {error && (
        <p
          style={{
            color: "var(--color-error)",
            fontSize: "0.85rem",
            textAlign: "center",
            margin: 0,
          }}
        >
          {error}
        </p>
      )}

      <div
        ref={containerRef}
        className="scanner-container"
        style={{
          minHeight: "200px",
          borderRadius: "var(--radius-md)",
          overflow: "hidden",
        }}
      ></div>

      <div
        style={{
          textAlign: "center",
          padding: "var(--space-sm) 0 0 0",
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-sm)",
          alignItems: "center",
        }}
      >
        <p
          className="text-body-sm text-muted"
          style={{ margin: "0", color: "var(--color-mute)" }}
        >
          Các phương thức dự phòng (dành cho môi trường Test):
        </p>
        <div
          style={{
            display: "flex",
            gap: "var(--space-sm)",
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          <label
            className="btn-primary"
            style={{
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              fontSize: "0.8rem",
              height: "32px",
              padding: "4px 12px",
            }}
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
            style={{
              fontSize: "0.8rem",
              height: "32px",
              padding: "4px 12px",
            }}
          >
            Dán Payload
          </button>
        </div>
      </div>
    </div>
  );
}

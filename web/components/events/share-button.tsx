"use client";

import { useState } from "react";
import { useToast } from "@/components/ui/toast";

type ShareButtonProps = {
  eventTitle: string;
  eventUrl: string;
};

export function ShareButton({ eventTitle, eventUrl }: ShareButtonProps) {
  const { toast } = useToast();
  const [showSocial, setShowSocial] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(eventUrl);
    toast("Link copied!", "success");
  }

  function handleTwitter() {
    const text = encodeURIComponent(
      `Check out ${eventTitle} on TicketNFT!`,
    );
    const url = encodeURIComponent(eventUrl);
    window.open(
      `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
      "_blank",
      "noopener,noreferrer",
    );
  }

  function handleFacebook() {
    const url = encodeURIComponent(eventUrl);
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      "_blank",
      "noopener,noreferrer",
    );
  }

  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: "var(--space-sm)" }}>
      {/* Copy Link Button */}
      <button
        type="button"
        onClick={handleCopy}
        className="btn-secondary"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "var(--space-sm)",
        }}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>
        Share
      </button>

      {/* Toggle Social Buttons */}
      <button
        type="button"
        onClick={() => setShowSocial((prev) => !prev)}
        className="btn-icon-circular"
        title="Social share options"
        aria-label="Social share options"
        style={{
          width: "36px",
          height: "36px",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "16px",
          cursor: "pointer",
        }}
      >
        {showSocial ? "✕" : "⋯"}
      </button>

      {/* Social Share Links */}
      {showSocial && (
        <div
          style={{
            display: "flex",
            gap: "var(--space-sm)",
            animation: "fadeIn 0.15s ease",
          }}
        >
          <button
            type="button"
            onClick={handleTwitter}
            className="btn-pill-on-image"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "var(--space-xs)",
              cursor: "pointer",
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            Post
          </button>

          <button
            type="button"
            onClick={handleFacebook}
            className="btn-pill-on-image"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "var(--space-xs)",
              cursor: "pointer",
              backgroundColor: "#1877F2",
              color: "#fff",
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
            Share
          </button>
        </div>
      )}
    </div>
  );
}

"use client";

import Link from "next/link";

export function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-grid">
          {/* Col 1 — Brand */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
            <h4 className="footer-col-header" style={{ color: "var(--color-primary)", fontWeight: 800, fontSize: "16px" }}>TicketNFT</h4>
            <p className="text-body-sm text-muted" style={{ marginBottom: "var(--space-md)", maxWidth: "240px", fontSize: "13px", lineHeight: "1.5" }}>
              On-chain event tickets you truly own. Discover, buy, and check
              in — all secured by your wallet.
            </p>
            <div className="footer-status-pill">
              <span className="status-dot" />
              <span>Ethereum Sepolia Connected</span>
            </div>
          </div>

          {/* Col 2 — Platform */}
          <div>
            <h4 className="footer-col-header">Platform</h4>
            <nav
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "var(--space-xs)",
              }}
            >
              <Link href="/events" className="footer-link">
                Browse Events
              </Link>
              <Link href="/marketplace" className="footer-link">
                Marketplace
              </Link>
              <Link href="/organizer" className="footer-link">
                Organizer Dashboard
              </Link>
            </nav>
          </div>

          {/* Col 3 — Resources */}
          <div>
            <h4 className="footer-col-header">Resources</h4>
            <nav
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "var(--space-xs)",
              }}
            >
              <a href="#" className="footer-link">
                Documentation
              </a>
              <a href="#" className="footer-link">
                Smart Contracts
              </a>
              <a href="#" className="footer-link">
                API Reference
              </a>
            </nav>
          </div>

          {/* Col 4 — Legal */}
          <div>
            <h4 className="footer-col-header">Legal</h4>
            <nav
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "var(--space-xs)",
              }}
            >
              <a href="#" className="footer-link">
                Privacy Policy
              </a>
              <a href="#" className="footer-link">
                Terms of Service
              </a>
              <a href="#" className="footer-link">
                Cookie Policy
              </a>
            </nav>
          </div>
        </div>

        <p
          className="text-body-sm text-muted text-center"
          style={{
            marginTop: "var(--space-xxl)",
            paddingTop: "var(--space-lg)",
            borderTop: "1px solid var(--color-hairline)",
            fontSize: "12px",
          }}
        >
          © {new Date().getFullYear()} TicketNFT. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ConnectWalletButton } from "@/components/wallet/connect-wallet-button";
import { useWalletAuth } from "@/hooks/use-wallet-auth";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/events", label: "Events" },
  { href: "/marketplace", label: "Marketplace" },
  { href: "/my-tickets", label: "My Tickets" },
];

const ORGANIZER_LINKS = [
  { href: "/organizer", label: "Organizer" },
];

export function Nav() {
  const pathname = usePathname();
  const { user, isAuthenticated } = useWalletAuth();
  const isOrganizer =
    isAuthenticated && user?.role === "ORGANIZER";
  const isAdmin = isAuthenticated && user?.role === "ADMIN";

  const [alertText, setAlertText] = useState("");
  const [isMaintenance, setIsMaintenance] = useState(false);

  useEffect(() => {
    const checkConfig = () => {
      if (typeof window !== "undefined") {
        setAlertText(localStorage.getItem("ticketnft_alert_text") || "");
        setIsMaintenance(localStorage.getItem("ticketnft_maintenance") === "true");
      }
    };
    checkConfig();
    window.addEventListener("ticketnft-system-config-changed", checkConfig);
    return () => window.removeEventListener("ticketnft-system-config-changed", checkConfig);
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100%", position: "sticky", top: 0, zIndex: 100 }}>
      {/* Global Banner Tickers */}
      {isMaintenance && (
        <div
          style={{
            backgroundColor: "var(--color-primary)",
            color: "#ffffff",
            padding: "8px var(--space-md)",
            fontSize: "13px",
            fontWeight: 700,
            textAlign: "center",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: "8px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            zIndex: 1000
          }}
        >
          <span>⚠️ WARNING: System is currently undergoing scheduled maintenance. Some features may be read-only.</span>
        </div>
      )}
      {alertText && !isMaintenance && (
        <div
          style={{
            backgroundColor: "var(--color-accent-blue)",
            color: "#ffffff",
            padding: "8px var(--space-md)",
            fontSize: "13px",
            fontWeight: 700,
            textAlign: "center",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: "8px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
            zIndex: 1000
          }}
        >
          <span>📢 {alertText}</span>
        </div>
      )}

      <nav className="nav-primary" style={{ position: "relative", top: "auto" }}>
      <div className="nav-inner">
        <Link
          href="/"
          className="nav-logo"
          style={{
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            background: "none",
            WebkitTextFillColor: "unset",
          }}
        >
          <img
            src="/logo_mint_png.png"
            alt="TicketNFT"
            style={{
              height: "42px",
              width: "auto",
              objectFit: "contain",
            }}
          />
        </Link>

        <form action="/events" method="GET" className="nav-search-form" style={{ margin: 0, marginLeft: "var(--space-md)" }}>
          <span
            style={{
              position: "absolute",
              left: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--color-ash)",
              display: "flex",
              alignItems: "center",
              pointerEvents: "none",
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </span>
          <input
            type="text"
            name="q"
            placeholder="Search events..."
            className="nav-search-input"
          />
        </form>

        <div
          className="nav-links"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--space-xl)",
            flex: 1,
            justifyContent: "flex-start",
            marginLeft: "var(--space-xl)",
          }}
        >
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={isActive ? "nav-link nav-link-active" : "nav-link"}
                style={{ whiteSpace: "nowrap" }}
              >
                {link.label}
              </Link>
            );
          })}

          {isAuthenticated && !isOrganizer && !isAdmin && (
            <Link
              href="/request-organizer"
              className={pathname === "/request-organizer" ? "nav-link nav-link-active" : "nav-link"}
              style={{ whiteSpace: "nowrap" }}
            >
              Become Organizer
            </Link>
          )}

          {isOrganizer && (
            <span
              style={{
                width: "1px",
                height: "20px",
                background: "var(--color-hairline)",
              }}
            />
          )}

          {isOrganizer &&
            ORGANIZER_LINKS.map((link) => {
              const isActive = pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={isActive ? "nav-link nav-link-active" : "nav-link"}
                  style={{ whiteSpace: "nowrap" }}
                >
                  {link.label}
                </Link>
              );
            })}

          {isAdmin && (
            <Link
              href="/admin"
              className={pathname.startsWith("/admin") ? "nav-link nav-link-active" : "nav-link"}
              style={{ whiteSpace: "nowrap" }}
            >
              Admin
            </Link>
          )}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--space-md)",
            flexShrink: 0,
          }}
        >
          {isOrganizer && (
            <Link
              href="/organizer/events/new"
              className="btn-primary"
              style={{ textDecoration: "none" }}
            >
              Create Event
            </Link>
          )}
          <ConnectWalletButton />
        </div>
      </div>
      </nav>
    </div>
  );
}

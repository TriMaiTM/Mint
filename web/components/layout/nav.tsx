"use client";

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
  { href: "/organizer", label: "Organizer Panel" },
];

export function Nav() {
  const pathname = usePathname();
  const { user, isAuthenticated } = useWalletAuth();
  const isOrganizer =
    isAuthenticated && (user?.role === "ORGANIZER" || user?.role === "ADMIN");
  const isAdmin = isAuthenticated && user?.role === "ADMIN";
  return (
    <nav className="nav-primary">
      <div className="nav-inner">
        <Link href="/" className="nav-logo" style={{ flexShrink: 0 }}>
          TicketNFT
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
            justifyContent: "center",
            marginRight: "100px",
          }}
        >
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={isActive ? "nav-link nav-link-active" : "nav-link"}
              >
                {link.label}
              </Link>
            );
          })}

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
                >
                  {link.label}
                </Link>
              );
            })}

          {isAdmin && (
            <Link
              href="/admin"
              className={pathname.startsWith("/admin") ? "nav-link nav-link-active" : "nav-link"}
            >
              Admin Panel
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
  );}

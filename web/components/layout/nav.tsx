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
  { href: "/organizer/events", label: "My Events" },
  { href: "/organizer/check-in", label: "Check-in" },
];

export function Nav() {
  const pathname = usePathname();
  const { user, isAuthenticated } = useWalletAuth();
  const isOrganizer =
    isAuthenticated && (user?.role === "ORGANIZER" || user?.role === "ADMIN");

  return (
    <nav className="nav-primary">
      <div className="nav-inner">
        <Link
          href="/"
          style={{
            fontSize: "20px",
            fontWeight: 700,
            color: "var(--color-primary)",
            textDecoration: "none",
            letterSpacing: "-0.5px",
          }}
        >
          TicketNFT
        </Link>

        <div
          className="nav-links"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--space-xl)",
            flex: 1,
            justifyContent: "center",
          }}
        >
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                style={{
                  fontSize: "15px",
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? "var(--color-ink)" : "var(--color-mute)",
                  textDecoration: "none",
                  transition: "color 0.15s",
                }}
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
                  style={{
                    fontSize: "15px",
                    fontWeight: isActive ? 600 : 400,
                    color: isActive ? "var(--color-ink)" : "var(--color-mute)",
                    textDecoration: "none",
                    transition: "color 0.15s",
                  }}
                >
                  {link.label}
                </Link>
              );
            })}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--space-md)",
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
  );
}

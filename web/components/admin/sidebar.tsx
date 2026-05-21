"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/admin", label: "Dashboard", icon: "📊", exact: true },
  { href: "/admin/users", label: "Users", icon: "👥", exact: false },
  { href: "/admin/events", label: "Events", icon: "🎟️", exact: false },
  { href: "/admin/settings", label: "Settings", icon: "⚙️", exact: false },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside
      style={{
        width: "260px",
        flexShrink: 0,
        background: "var(--color-surface-soft)",
        borderRight: "1px solid var(--color-hairline)",
        padding: "var(--space-xl) var(--space-md)",
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-md)",
        height: "calc(100vh - 70px)",
        position: "sticky",
        top: "70px",
        zIndex: 10,
        backdropFilter: "blur(12px)",
      }}
    >
      <div style={{ padding: "0 var(--space-sm) var(--space-sm) var(--space-sm)" }}>
        <h3
          style={{
            fontSize: "12px",
            textTransform: "uppercase",
            letterSpacing: "1px",
            color: "var(--color-ash)",
            fontWeight: 600,
          }}
        >
          Admin Panel
        </h3>
      </div>
      <nav style={{ display: "flex", flexDirection: "column", gap: "var(--space-xs)" }}>
        {LINKS.map((link) => {
          const isActive = link.exact
            ? pathname === link.href
            : pathname.startsWith(link.href);

          return (
            <Link
              key={link.href}
              href={link.href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--space-md)",
                padding: "var(--space-md) var(--space-lg)",
                borderRadius: "var(--radius-md)",
                fontSize: "15px",
                fontWeight: isActive ? 600 : 500,
                color: isActive ? "var(--color-primary)" : "var(--color-ink)",
                background: isActive ? "rgba(230, 0, 35, 0.08)" : "transparent",
                textDecoration: "none",
                transition: "all 0.2s ease",
              }}
              className="sidebar-link-hover"
            >
              <span style={{ fontSize: "18px" }}>{link.icon}</span>
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

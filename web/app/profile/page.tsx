import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getSessionCookieName, verifySessionToken } from "@/lib/auth";
import { Nav } from "@/components/layout/nav";
import { CopyAddressButton } from "./copy-address-button";
import { EmailSettings } from "@/components/profile/email-settings";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function truncateAddress(addr: string): string {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function formatDate(value: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

function shortenTx(hash: string): string {
  return `${hash.slice(0, 10)}…${hash.slice(-6)}`;
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default async function ProfilePage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(getSessionCookieName())?.value;
  const session = verifySessionToken(token);

  /* ── Sign-in required ── */
  if (!session) {
    return (
      <>
        <Nav />

        <main className="container section-gap">
          <div
            className="card-feature-soft text-center"
            style={{
              maxWidth: 480,
              margin: "0 auto",
              padding: "var(--space-xxl)",
            }}
          >
            <h1 className="text-heading-lg">Sign in required</h1>
            <p className="text-body-md text-muted mt-md">
              Please connect your wallet and sign in to view your profile.
            </p>
            <Link
              href="/"
              className="btn-primary mt-lg"
              style={{ display: "inline-flex" }}
            >
              Go to Homepage
            </Link>
          </div>
        </main>
      </>
    );
  }

  /* ── Fetch user with tickets & orders ── */
  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    include: {
      tickets: {
        include: {
          event: { select: { title: true, startDate: true, venue: true } },
          tier: { select: { name: true, price: true } },
        },
        orderBy: { createdAt: "desc" },
      },
      orders: {
        include: { event: { select: { title: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!user) {
    redirect("/");
  }

  const isOrganizer = user.role === "ORGANIZER" || user.role === "ADMIN";

  /* ── Compute stats ── */
  const totalTickets = user.tickets.length;
  const totalSpent = user.orders.reduce(
    (sum, order) => sum + Number(order.totalAmount),
    0,
  );
  const uniqueEvents = new Set(user.tickets.map((t) => t.eventId)).size;

  return (
    <>
      <Nav />

      <main className="container section-gap">
        {/* ── Profile Header ── */}
        <header className="mb-xl">
          <h1 className="text-display-lg">My Profile</h1>
          <p className="text-body-md text-muted mt-sm">
            Your account overview and purchase history.
          </p>
        </header>

        {/* ── Wallet & Role Card ── */}
        <div className="card" style={{ padding: "var(--space-xl)" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "var(--space-md)",
            }}
          >
            <div>
              <p
                className="text-caption-md text-muted"
                style={{ textTransform: "uppercase", letterSpacing: "0.05em" }}
              >
                Wallet Address
              </p>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--space-md)",
                  marginTop: "var(--space-xs)",
                }}
              >
                <p
                  className="text-heading-lg"
                  style={{ fontFamily: "monospace" }}
                >
                  {truncateAddress(user.walletAddress)}
                </p>
                <CopyAddressButton address={user.walletAddress} />
              </div>
              <p
                className="text-body-sm text-muted mt-sm"
                style={{ fontFamily: "monospace", wordBreak: "break-all" }}
              >
                {user.walletAddress}
              </p>
            </div>

            <span
              className={
                isOrganizer
                  ? "wallet-dropdown-badge-organizer"
                  : "wallet-dropdown-badge-user"
              }
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "var(--space-xs)",
                padding: "var(--space-xs) var(--space-md)",
                borderRadius: "var(--radius-full)",
                fontSize: "13px",
                fontWeight: 600,
              }}
            >
              {isOrganizer ? "🎯 ORGANIZER" : "👤 USER"}
            </span>
          </div>

          {user.name && <p className="text-body-md mt-md">{user.name}</p>}
        </div>

        {/* ── Stats Row ── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "var(--space-lg)",
            marginTop: "var(--space-xl)",
          }}
        >
          <div
            className="card-feature-soft"
            style={{ padding: "var(--space-xl)", textAlign: "center" }}
          >
            <p
              className="text-display-lg"
              style={{ color: "var(--color-primary)" }}
            >
              {totalTickets}
            </p>
            <p className="text-caption-md text-muted mt-sm">Tickets Owned</p>
          </div>

          <div
            className="card-feature-soft"
            style={{ padding: "var(--space-xl)", textAlign: "center" }}
          >
            <p
              className="text-display-lg"
              style={{ color: "var(--color-primary)" }}
            >
              {totalSpent.toFixed(3)}
            </p>
            <p className="text-caption-md text-muted mt-sm">POL Spent</p>
          </div>

          <div
            className="card-feature-soft"
            style={{ padding: "var(--space-xl)", textAlign: "center" }}
          >
            <p
              className="text-display-lg"
              style={{ color: "var(--color-primary)" }}
            >
              {uniqueEvents}
            </p>
            <p className="text-caption-md text-muted mt-sm">Events Attended</p>
          </div>
        </div>

        {/* ── Quick Links ── */}
        <div
          style={{
            display: "flex",
            gap: "var(--space-md)",
            marginTop: "var(--space-xl)",
            flexWrap: "wrap",
          }}
        >
          <Link
            href="/my-tickets"
            className="btn-primary"
            style={{ textDecoration: "none" }}
          >
            🎟️ My Tickets
          </Link>
          {isOrganizer && (
            <Link
              href="/organizer/events"
              className="btn-secondary"
              style={{ textDecoration: "none" }}
            >
              🎯 My Events
            </Link>
          )}
          {isOrganizer && (
            <Link
              href="/organizer/analytics"
              className="btn-secondary"
              style={{ textDecoration: "none" }}
            >
              📊 Analytics
            </Link>
          )}
        </div>

        {/* ── Email Settings ── */}
        <EmailSettings currentEmail={user.email} />

        {/* ── Purchase History ── */}
        <section style={{ marginTop: "var(--space-section)" }}>
          <h2 className="text-heading-xl mb-xl">Purchase History</h2>

          {user.orders.length === 0 ? (
            <div
              className="card-feature-soft text-center"
              style={{ padding: "var(--space-xxl)" }}
            >
              <p className="text-heading-md">No purchases yet</p>
              <p className="text-body-md text-muted mt-md">
                Your purchase history will appear here after you buy your first
                ticket.
              </p>
              <Link
                href="/events"
                className="btn-primary mt-lg"
                style={{ display: "inline-flex" }}
              >
                Browse Events
              </Link>
            </div>
          ) : (
            <div className="card" style={{ overflow: "hidden" }}>
              <div style={{ overflowX: "auto" }}>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    minWidth: 640,
                  }}
                >
                  <thead>
                    <tr
                      style={{
                        borderBottom: "1px solid var(--color-hairline)",
                      }}
                    >
                      <th
                        className="text-caption-md text-muted"
                        style={{
                          textAlign: "left",
                          padding: "var(--space-md) var(--space-lg)",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                        }}
                      >
                        Event
                      </th>
                      <th
                        className="text-caption-md text-muted"
                        style={{
                          textAlign: "left",
                          padding: "var(--space-md) var(--space-lg)",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                        }}
                      >
                        Tier
                      </th>
                      <th
                        className="text-caption-md text-muted"
                        style={{
                          textAlign: "left",
                          padding: "var(--space-md) var(--space-lg)",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                        }}
                      >
                        Date
                      </th>
                      <th
                        className="text-caption-md text-muted"
                        style={{
                          textAlign: "left",
                          padding: "var(--space-md) var(--space-lg)",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                        }}
                      >
                        Tx Hash
                      </th>
                      <th
                        className="text-caption-md text-muted"
                        style={{
                          textAlign: "left",
                          padding: "var(--space-md) var(--space-lg)",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                        }}
                      >
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {user.orders.map((order) => {
                      /* Find the matching ticket for tier info */
                      const ticket = user.tickets.find(
                        (t) => t.eventId === order.eventId,
                      );

                      return (
                        <tr
                          key={order.id}
                          style={{
                            borderBottom:
                              "1px solid var(--color-hairline-soft)",
                          }}
                        >
                          <td
                            className="text-body-sm"
                            style={{
                              padding: "var(--space-md) var(--space-lg)",
                            }}
                          >
                            {order.event.title}
                          </td>
                          <td
                            className="text-body-sm"
                            style={{
                              padding: "var(--space-md) var(--space-lg)",
                            }}
                          >
                            {ticket?.tier.name ?? "—"}
                          </td>
                          <td
                            className="text-body-sm text-muted"
                            style={{
                              padding: "var(--space-md) var(--space-lg)",
                            }}
                          >
                            {formatDate(order.createdAt)}
                          </td>
                          <td
                            style={{
                              padding: "var(--space-md) var(--space-lg)",
                              fontFamily: "monospace",
                              fontSize: "13px",
                            }}
                          >
                            {order.txHash ? (
                              <a
                                href={`https://sepolia.etherscan.io/tx/${order.txHash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-link-md"
                                style={{ color: "var(--color-primary)" }}
                              >
                                {shortenTx(order.txHash)}
                              </a>
                            ) : (
                              <span className="text-body-sm text-muted">—</span>
                            )}
                          </td>
                          <td
                            style={{
                              padding: "var(--space-md) var(--space-lg)",
                            }}
                          >
                            <span
                              className="chip"
                              style={{
                                backgroundColor:
                                  order.status === "CONFIRMED"
                                    ? "var(--color-success-pale)"
                                    : order.status === "FAILED"
                                      ? "var(--color-error)"
                                      : "var(--color-surface-card)",
                                color:
                                  order.status === "FAILED"
                                    ? "#fff"
                                    : "var(--color-ink)",
                                fontSize: "12px",
                                fontWeight: 600,
                              }}
                            >
                              {order.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="footer" style={{ marginTop: "var(--space-section)" }}>
        <div className="footer-grid">
          <div>
            <p className="footer-col-header">TicketNFT</p>
            <p className="text-body-sm text-muted">
              NFT-based event ticketing on Polygon.
            </p>
          </div>
          <div>
            <p className="footer-col-header">Explore</p>
            <Link href="/events" className="footer-link">
              Events
            </Link>
            <Link href="/marketplace" className="footer-link">
              Marketplace
            </Link>
          </div>
          <div>
            <p className="footer-col-header">Account</p>
            <Link href="/my-tickets" className="footer-link">
              My Tickets
            </Link>
            <Link href="/profile" className="footer-link">
              Profile
            </Link>
          </div>
          <div>
            <p className="footer-col-header">Info</p>
            <p className="text-body-sm text-muted">
              Built with smart contracts for transparent, verifiable tickets.
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}

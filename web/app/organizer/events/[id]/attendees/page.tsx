import Link from "next/link";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getSessionCookieName, verifySessionToken } from "@/lib/auth";
import { Nav } from "@/components/layout/nav";
import { CheckInButton } from "./check-in-button";
import { ExportCsvButton } from "@/components/organizer/export-csv-button";

type AttendeesPageProps = {
  params: Promise<{ id: string }>;
};

export default async function AttendeesPage({ params }: AttendeesPageProps) {
  const { id } = await params;
  const cookieStore = await cookies();
  const session = verifySessionToken(
    cookieStore.get(getSessionCookieName())?.value,
  );

  if (!session) {
    return (
      <>
        <Nav />
        <main className="container section-gap" style={{ textAlign: "center" }}>
          <h1 className="text-heading-xl mb-md">Attendees</h1>
          <p className="text-body-md text-muted mb-lg">
            Please sign in with your organizer wallet to continue.
          </p>
          <Link href="/" className="btn-secondary">
            Back to Home
          </Link>
        </main>
      </>
    );
  }

  const me = await prisma.user.findUnique({
    where: { id: session.sub },
    select: { id: true, role: true },
  });

  if (!me || (me.role !== "ORGANIZER" && me.role !== "ADMIN")) {
    return (
      <>
        <Nav />
        <main className="container section-gap" style={{ textAlign: "center" }}>
          <h1 className="text-heading-xl mb-md">Access Denied</h1>
          <p className="text-body-md text-muted mb-lg">
            This account does not have organizer permission.
          </p>
          <Link href="/events" className="btn-secondary">
            Browse Events
          </Link>
        </main>
      </>
    );
  }

  // Verify the event belongs to this organizer
  const event = await prisma.event.findFirst({
    where: { id, organizerId: me.id },
    select: { id: true, title: true },
  });

  if (!event) {
    notFound();
  }

  const tickets = await prisma.ticket.findMany({
    where: { eventId: id },
    include: {
      tier: { select: { name: true, price: true } },
      owner: { select: { walletAddress: true, name: true, email: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  const totalTickets = tickets.length;
  const checkedIn = tickets.filter(
    (t: (typeof tickets)[number]) => t.isUsed,
  ).length;
  const remaining = totalTickets - checkedIn;

  return (
    <>
      <Nav />

      <main className="container section-gap">
        {/* ── Header ── */}
        <header style={{ marginBottom: "var(--space-xxl)", display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "var(--space-md)" }}>
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--space-sm)",
                marginBottom: "var(--space-md)",
              }}
            >
              <Link
                href={`/organizer/events/${id}`}
                className="text-body-sm text-muted"
                style={{ textDecoration: "none" }}
              >
                ← Back to Event
              </Link>
            </div>
            <h1 className="text-display-lg">Attendees</h1>
            <p className="text-body-md text-muted mt-sm">
              {event.title} — Manage ticket holders and check-in status.
            </p>
          </div>
          <div>
            <ExportCsvButton tickets={tickets} eventTitle={event.title} />
          </div>
        </header>

        {/* ── Stats ── */}
        <div
          className="masonry-grid"
          style={{
            gridTemplateColumns: "repeat(3, 1fr)",
            marginBottom: "var(--space-xxl)",
          }}
        >
          <div
            className="card card-feature-soft"
            style={{ padding: "var(--space-xl)" }}
          >
            <p className="text-caption-md text-muted">Total Tickets</p>
            <p
              className="text-heading-xl"
              style={{ marginTop: "var(--space-xxs)" }}
            >
              {totalTickets}
            </p>
          </div>
          <div
            className="card card-feature-soft"
            style={{ padding: "var(--space-xl)" }}
          >
            <p className="text-caption-md text-muted">Checked In</p>
            <p
              className="text-heading-xl"
              style={{
                marginTop: "var(--space-xxs)",
                color: "var(--color-success-deep)",
              }}
            >
              {checkedIn}
            </p>
          </div>
          <div
            className="card card-feature-soft"
            style={{ padding: "var(--space-xl)" }}
          >
            <p className="text-caption-md text-muted">Remaining</p>
            <p
              className="text-heading-xl"
              style={{ marginTop: "var(--space-xxs)" }}
            >
              {remaining}
            </p>
          </div>
        </div>

        {/* ── Attendee List ── */}
        {tickets.length === 0 ? (
          <div
            className="card-feature-soft"
            style={{ textAlign: "center", padding: "var(--space-xxl)" }}
          >
            <p className="text-heading-lg mb-md">No tickets sold yet</p>
            <p className="text-body-md text-muted">
              Attendees will appear here once tickets are purchased.
            </p>
          </div>
        ) : (
          <div className="card" style={{ overflow: "hidden" }}>
            {/* Table Header */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "2.5fr 1fr 1fr 1fr 1.5fr 140px",
                gap: "var(--space-md)",
                padding: "var(--space-md) var(--space-xl)",
                background: "var(--color-surface-soft)",
                borderBottom: "1px solid var(--color-hairline)",
              }}
            >
              <span className="text-body-sm-strong text-muted">Khách hàng</span>
              <span className="text-body-sm-strong text-muted">Tier</span>
              <span className="text-body-sm-strong text-muted">Token ID</span>
              <span className="text-body-sm-strong text-muted">Status</span>
              <span className="text-body-sm-strong text-muted">Purchased</span>
              <span className="text-body-sm-strong text-muted">Action</span>
            </div>

            {/* Rows */}
            {tickets.map((ticket: (typeof tickets)[number]) => (
              <div
                key={ticket.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "2.5fr 1fr 1fr 1fr 1.5fr 140px",
                  gap: "var(--space-md)",
                  padding: "var(--space-md) var(--space-xl)",
                  alignItems: "center",
                  borderBottom: "1px solid var(--color-hairline-soft)",
                }}
              >
                {/* Wallet & Owner Info */}
                <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                  {ticket.owner.name && (
                    <span className="text-body-sm-strong">{ticket.owner.name}</span>
                  )}
                  {ticket.owner.email && (
                    <span className="text-body-xs text-muted" style={{ fontSize: "12px" }}>{ticket.owner.email}</span>
                  )}
                  <span
                    className="text-body-xs text-muted"
                    style={{
                      fontFamily: "monospace",
                      wordBreak: "break-all",
                      fontSize: "11px",
                      opacity: 0.8
                    }}
                  >
                    {ticket.owner.walletAddress}
                  </span>
                </div>

                {/* Tier */}
                <span className="text-body-sm">{ticket.tier.name}</span>

                {/* Token ID */}
                <span
                  className="text-body-sm"
                  style={{ fontFamily: "monospace" }}
                >
                  #{ticket.tokenId}
                </span>

                {/* Status */}
                <span>
                  {ticket.isUsed ? (
                    <span className="chip chip-active">Used</span>
                  ) : (
                    <span className="chip">{ticket.status}</span>
                  )}
                </span>

                {/* Purchase Date */}
                <span className="text-body-sm text-muted">
                  {ticket.createdAt.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>

                {/* Check-in Action */}
                <CheckInButton
                  ticketId={ticket.id}
                  eventId={id}
                  tokenId={ticket.tokenId}
                  isUsed={ticket.isUsed}
                />
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}

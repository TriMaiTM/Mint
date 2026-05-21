import Link from "next/link";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getSessionCookieName, verifySessionToken } from "@/lib/auth";
import { Nav } from "@/components/layout/nav";
import { TicketQR } from "@/components/tickets/ticket-qr";
import { ListTicketButton } from "@/components/tickets/list-ticket-button";
import { TransferTicketButton } from "@/components/tickets/transfer-ticket-button";

function formatDate(value: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

export default async function MyTicketsPage() {
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
              Please connect your wallet and sign in to view your tickets.
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

  const tickets = await prisma.ticket.findMany({
    where: { ownerId: session.sub },
    include: {
      event: {
        select: {
          title: true,
          venue: true,
          startDate: true,
          chainId: true,
          contractAddress: true,
          bannerImage: true,
        },
      },
      tier: {
        select: {
          name: true,
          price: true,
          benefits: true,
        },
      },
      owner: {
        select: {
          walletAddress: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <>
      {/* ── Sticky Navigation ── */}
      <Nav />

      <main className="container section-gap">
        {/* ── Header ── */}
        <header className="mb-xl">
          <h1 className="text-display-lg">My Tickets</h1>
          <p className="text-body-md text-muted mt-sm">
            View and manage all your NFT event tickets in one place.
          </p>
        </header>

        {tickets.length === 0 ? (
          /* ── Empty State ── */
          <div
            className="card-feature-soft text-center"
            style={{ padding: "var(--space-xxl) var(--space-xl)" }}
          >
            <p className="text-heading-md">No tickets yet</p>
            <p className="text-body-md text-muted mt-md">
              You haven&apos;t purchased any tickets yet. Browse events to get
              started.
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
          /* ── Tickets Grid ── */
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
              gap: "var(--space-lg)",
            }}
          >
            {tickets.map((ticket) => {
              const isListed = ticket.status === "LISTED";
              const isUsed = ticket.isUsed;

              return (
                <article className="card" key={ticket.id}>
                  {/* ── Event Banner ── */}
                  {ticket.event.bannerImage && (
                    <div className="event-card-image">
                      <img
                        src={ticket.event.bannerImage}
                        alt={ticket.event.title}
                      />
                      <span
                        className="event-card-badge"
                        style={{
                          backgroundColor: isListed
                            ? "var(--color-accent-purple)"
                            : isUsed
                              ? "var(--color-ash)"
                              : "var(--color-canvas)",
                          color:
                            isListed || isUsed ? "#fff" : "var(--color-ink)",
                        }}
                      >
                        {isListed ? "Listed" : isUsed ? "Used" : ticket.status}
                      </span>
                    </div>
                  )}

                  {/* ── Card Body ── */}
                  <div style={{ padding: "var(--space-lg)" }}>
                    <p className="event-card-date">
                      {formatDate(ticket.event.startDate)}
                    </p>
                    <h3 className="event-card-title">{ticket.event.title}</h3>

                    <div
                      style={{
                        display: "flex",
                        gap: "var(--space-md)",
                        flexWrap: "wrap",
                        marginTop: "var(--space-md)",
                      }}
                    >
                      <span className="chip">{ticket.tier.name}</span>
                      <span className="chip">Token #{ticket.tokenId}</span>
                    </div>

                    {/* ── Event Meta ── */}
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "var(--space-md)",
                        marginTop: "var(--space-md)",
                        paddingTop: "var(--space-md)",
                        borderTop: "1px solid var(--color-hairline-soft)",
                      }}
                    >
                      <div>
                        <p className="text-caption-md text-muted">Venue</p>
                        <p className="text-body-sm-strong">
                          {ticket.event.venue ?? "TBA"}
                        </p>
                      </div>
                      <div>
                        <p className="text-caption-md text-muted">Chain</p>
                        <p className="text-body-sm-strong">
                          {ticket.event.chainId ?? "Unknown"}
                        </p>
                      </div>
                      <div>
                        <p className="text-caption-md text-muted">Price</p>
                        <p className="text-body-sm-strong">
                          {Number(ticket.tier.price).toFixed(3)} POL
                        </p>
                      </div>
                      <div>
                        <p className="text-caption-md text-muted">Status</p>
                        <p className="text-body-sm-strong">
                          {isListed
                            ? "On Marketplace"
                            : isUsed
                              ? "Checked In"
                              : "Valid"}
                        </p>
                      </div>
                    </div>

                    {/* ── QR or Listed State ── */}
                    <div style={{ marginTop: "var(--space-lg)" }}>
                      {isListed ? (
                        <div
                          style={{
                            padding: "var(--space-lg)",
                            backgroundColor: "var(--color-surface-card)",
                            borderRadius: "var(--radius-md)",
                            textAlign: "center",
                          }}
                        >
                          <p className="text-body-sm-strong">
                            Listed on Marketplace
                          </p>
                          <p className="text-caption-md text-muted mt-sm">
                            QR code is unavailable while listed.
                          </p>
                        </div>
                      ) : (
                        <>
                          <TicketQR
                            ticketId={ticket.id}
                            eventId={ticket.eventId}
                            tokenId={ticket.tokenId}
                            ownerAddress={ticket.owner.walletAddress}
                          />

                          {ticket.status === "MINTED" &&
                            !isUsed &&
                            ticket.event.contractAddress && (
                              <div style={{ marginTop: "var(--space-md)" }}>
                                <ListTicketButton
                                  ticketId={ticket.id}
                                  tokenId={ticket.tokenId}
                                  contractAddress={ticket.event.contractAddress}
                                  tierPrice={ticket.tier.price.toString()}
                                  tierName={ticket.tier.name}
                                />
                                <div style={{ marginTop: "var(--space-sm)" }}>
                                  <TransferTicketButton
                                    ticketId={ticket.id}
                                    tokenId={ticket.tokenId}
                                    contractAddress={ticket.event.contractAddress}
                                    tierName={ticket.tier.name}
                                  />
                                </div>
                              </div>
                            )}
                        </>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
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

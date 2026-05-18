import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatEther } from "viem";
import { BuyListedTicket } from "@/components/marketplace/buy-listed-ticket";
import { cookies } from "next/headers";
import { getSessionCookieName, verifySessionToken } from "@/lib/auth";
import { Nav } from "@/components/layout/nav";

export const dynamic = "force-dynamic";

function formatDate(value: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

function formatAddress(addr: string): string {
  return `${addr.substring(0, 6)}...${addr.substring(38)}`;
}

export default async function MarketplacePage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(getSessionCookieName())?.value;
  const session = verifySessionToken(token);

  const listings = await prisma.listing.findMany({
    where: { status: "ACTIVE" },
    include: {
      ticket: {
        include: {
          tier: true,
        },
      },
      event: true,
      seller: true,
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
          <h1 className="text-display-lg">Ticket Marketplace</h1>
          <p className="text-body-md text-muted mt-sm">
            Buy and sell verified NFT tickets securely via smart contracts.
          </p>
        </header>

        {listings.length === 0 ? (
          /* ── Empty State ── */
          <div
            className="card-feature-soft text-center"
            style={{ padding: "var(--space-xxl) var(--space-xl)" }}
          >
            <p className="text-heading-md">No listings yet</p>
            <p className="text-body-md text-muted mt-md">
              There are currently no tickets listed for sale on the marketplace.
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
          /* ── Listings Grid ── */
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap: "var(--space-lg)",
            }}
          >
            {listings.map((listing) => {
              const isSeller = session?.sub === listing.sellerId;
              const formattedPrice = formatEther(BigInt(listing.price));

              return (
                <article className="card" key={listing.id}>
                  {/* ── Event Image ── */}
                  {listing.event.bannerImage && (
                    <div className="event-card-image">
                      <img
                        src={listing.event.bannerImage}
                        alt={listing.event.title}
                      />
                      <span className="event-card-badge">For Sale</span>
                    </div>
                  )}

                  {/* ── Card Body ── */}
                  <div
                    className="event-card-body"
                    style={{ padding: "var(--space-lg)" }}
                  >
                    <p className="event-card-date">
                      {formatDate(listing.event.startDate)}
                    </p>
                    <h3 className="event-card-title">{listing.event.title}</h3>
                    <p className="event-card-meta">
                      {listing.ticket.tier.name} · Token #
                      {listing.ticket.tokenId}
                    </p>

                    {/* ── Price & Seller ── */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginTop: "var(--space-md)",
                        paddingTop: "var(--space-md)",
                        borderTop: "1px solid var(--color-hairline-soft)",
                      }}
                    >
                      <div>
                        <p className="text-body-sm-strong">
                          {formattedPrice} POL
                        </p>
                        <p className="text-caption-md text-muted">
                          {isSeller
                            ? "Your listing"
                            : `Seller: ${formatAddress(listing.seller.walletAddress)}`}
                        </p>
                      </div>
                      {listing.event.venue && (
                        <p
                          className="text-caption-md text-muted"
                          style={{ textAlign: "right" }}
                        >
                          📍 {listing.event.venue}
                        </p>
                      )}
                    </div>

                    {/* ── Action ── */}
                    <div style={{ marginTop: "var(--space-lg)" }}>
                      {isSeller ? (
                        <div
                          style={{
                            padding: "var(--space-md)",
                            backgroundColor: "var(--color-surface-card)",
                            borderRadius: "var(--radius-md)",
                            textAlign: "center",
                          }}
                        >
                          <p className="text-body-sm text-muted">
                            This is your listing
                          </p>
                        </div>
                      ) : (
                        <BuyListedTicket
                          ticketId={listing.ticketId}
                          tokenId={listing.ticket.tokenId}
                          contractAddress={listing.event.contractAddress!}
                          priceWei={listing.price}
                        />
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

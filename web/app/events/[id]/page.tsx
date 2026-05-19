import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatEther } from "viem";
import { Nav } from "@/components/layout/nav";
import { BuyTicketButton } from "@/components/tickets/buy-ticket-button";
import { ShareButton } from "@/components/events/share-button";

type EventDetailPageProps = {
  params: Promise<{ id: string }>;
};

function formatDate(value: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(value);
}

function formatAddress(addr: string): string {
  return `${addr.substring(0, 6)}...${addr.substring(38)}`;
}

export default async function EventDetailPage({
  params,
}: EventDetailPageProps) {
  const { id } = await params;

  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      organizer: {
        select: {
          walletAddress: true,
          name: true,
        },
      },
      ticketTiers: {
        orderBy: { price: "asc" },
      },
    },
  });

  if (!event) {
    notFound();
  }

  const remainingTiers = event.ticketTiers.map((tier) => ({
    ...tier,
    remaining: tier.maxQuantity - tier.soldCount,
  }));

  return (
    <>
      {/* ── Sticky Navigation ── */}
      <Nav />

      <main className="container section-gap">
        {/* ── Hero Banner ── */}
        {event.bannerImage && (
          <div className="event-card-image mb-xl">
            <img src={event.bannerImage} alt={event.title} />
          </div>
        )}

        {/* ── Event Info ── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 320px",
            gap: "var(--space-xxl)",
            alignItems: "start",
          }}
        >
          <div>
            <p className="event-card-date">{formatDate(event.startDate)}</p>
            <h1 className="text-heading-xl mt-sm">{event.title}</h1>

            {event.venue && (
              <p className="text-body-md text-muted mt-sm">📍 {event.venue}</p>
            )}

            <p
              className="text-body-md mt-lg"
              style={{ color: "var(--color-body)", lineHeight: 1.6 }}
            >
              {event.description ??
                "The organizer will update event details soon."}
            </p>

            {/* ── Share Button ── */}
            <div className="mt-lg">
              <ShareButton
                eventTitle={event.title}
                eventUrl={`${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/events/${event.id}`}
              />
            </div>

            {/* ── Organizer Info ── */}
            <div className="card-feature-soft mt-xl">
              <p
                className="text-caption-md text-muted"
                style={{ textTransform: "uppercase", letterSpacing: "0.05em" }}
              >
                Organized by
              </p>
              <p className="text-body-strong mt-sm">
                {event.organizer.name ?? "Event Organizer"}
              </p>
              <p
                className="text-body-sm text-muted mt-sm"
                style={{ fontFamily: "monospace" }}
              >
                {formatAddress(event.organizer.walletAddress)}
              </p>
            </div>

            {/* ── Contract Notice ── */}
            {!event.contractAddress && (
              <div
                className="mt-xl"
                style={{
                  padding: "var(--space-lg)",
                  backgroundColor: "var(--color-surface-card)",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--color-hairline)",
                }}
              >
                <p
                  className="text-body-sm"
                  style={{ color: "var(--color-error)" }}
                >
                  ⏳ Tickets will be available once the organizer publishes the
                  event on-chain.
                </p>
              </div>
            )}
          </div>

          {/* ── Sidebar ── */}
          <aside>
            <div className="card-feature-soft">
              <p
                className="text-caption-md text-muted"
                style={{ textTransform: "uppercase", letterSpacing: "0.05em" }}
              >
                Chain
              </p>
              <p className="text-body-strong mt-sm">
                {event.chainId ?? "Unknown"}
              </p>
              <div
                style={{
                  height: "1px",
                  backgroundColor: "var(--color-hairline)",
                  margin: "var(--space-lg) 0",
                }}
              />
              <p
                className="text-caption-md text-muted"
                style={{ textTransform: "uppercase", letterSpacing: "0.05em" }}
              >
                Ticket Tiers
              </p>
              <p className="text-heading-lg mt-sm">
                {event.ticketTiers.length}
              </p>
            </div>
          </aside>
        </div>

        {/* ── Location Map ── */}
        {event.venue && (
          <section style={{ marginBottom: "var(--space-xxl)" }}>
            <h2 className="text-heading-xl mb-lg">Location</h2>
            <div
              style={{
                display: "flex",
                gap: "var(--space-xl)",
                alignItems: "flex-start",
                flexWrap: "wrap",
              }}
            >
              <div style={{ flex: "1 1 300px" }}>
                <p className="text-heading-md">{event.venue}</p>
                <p className="text-body-sm text-muted mt-sm">{event.title}</p>
              </div>
              <div
                style={{
                  flex: "0 0 auto",
                  width: "min(400px, 100%)",
                }}
              >
                <iframe
                  src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${encodeURIComponent(event.venue)}`}
                  width="100%"
                  height="300"
                  style={{
                    border: 0,
                    borderRadius: "var(--radius-md)",
                  }}
                  allowFullScreen
                  loading="lazy"
                />
              </div>
            </div>
          </section>
        )}

        {/* ── Ticket Tiers ── */}
        <section style={{ marginTop: "var(--space-section)" }}>
          <h2 className="text-heading-lg mb-xl">Available Tickets</h2>

          {event.contractAddress ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                gap: "var(--space-lg)",
              }}
            >
              {remainingTiers.map((tier) => (
                <div className="tier-card" key={tier.id}>
                  <p className="tier-card-name">{tier.name}</p>
                  <p className="tier-card-price">
                    {Number(tier.price).toFixed(3)} POL
                  </p>
                  <p className="tier-card-benefits">
                    {tier.benefits ?? "Standard event access"}
                  </p>
                  <p className="tier-card-stock">
                    {tier.remaining > 0
                      ? `${tier.remaining} of ${tier.maxQuantity} remaining`
                      : "Sold out"}
                  </p>
                  <div style={{ marginTop: "var(--space-lg)" }}>
                    <BuyTicketButton
                      tierId={tier.id}
                      tierName={tier.name}
                      tierPrice={tier.price.toString()}
                      onchainTierId={tier.onchainTierId}
                      eventContractAddress={event.contractAddress}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div
              className="card-feature-soft text-center"
              style={{ padding: "var(--space-xxl)" }}
            >
              <p className="text-body-md text-muted">
                Ticket tiers will appear here once the event is deployed
                on-chain.
              </p>
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

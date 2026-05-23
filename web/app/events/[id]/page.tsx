import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatEther } from "viem";
import { Nav } from "@/components/layout/nav";
import { Footer } from "@/components/layout/footer";
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
      agenda: {
        orderBy: { createdAt: "asc" },
      },
      faqs: {
        orderBy: { createdAt: "asc" },
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
        {/* ── Event Detail Hero Section ── */}
        <div className="event-detail-hero">
          {event.bannerImage && (
            <div
              className="event-detail-hero-blur-bg"
              style={{ backgroundImage: `url(${event.bannerImage})` }}
            />
          )}
          <div className="event-detail-hero-content">
            <div className="event-detail-hero-info">
              {event.category && (
                <span className="event-detail-hero-badge">
                  {event.category}
                </span>
              )}
              <p className="event-detail-hero-date">{formatDate(event.startDate)}</p>
              <h1 className="event-detail-hero-title">{event.title}</h1>
              {event.venue && (
                <p className="event-detail-hero-venue">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ color: "var(--color-primary)" }}
                  >
                    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  <span>{event.venue}</span>
                </p>
              )}
              
              <div className="event-detail-hero-actions">
                <a
                  href="#tickets"
                  className="btn-primary"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    textDecoration: "none",
                  }}
                >
                  Get Tickets
                </a>
                <ShareButton
                  eventTitle={event.title}
                  eventUrl={`${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/events/${event.id}`}
                />
              </div>
            </div>
            
            <div className="event-detail-hero-image-wrapper">
              {event.bannerImage ? (
                <img
                  src={event.bannerImage}
                  alt={event.title}
                  className="event-detail-hero-image"
                />
              ) : (
                <div className="event-detail-hero-placeholder">
                  🎫
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Event Info & Sidebar ── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 340px",
            gap: "var(--space-xxl)",
            alignItems: "start",
            marginTop: "var(--space-xl)",
          }}
          className="event-detail-layout"
        >
          <div>
            {/* Description Card */}
            <div className="card-feature-soft" style={{ padding: "var(--space-xl)" }}>
              <h2 className="text-heading-md" style={{ marginBottom: "var(--space-md)", color: "var(--color-ink)" }}>
                About Event
              </h2>
              <p
                className="text-body-md"
                style={{ color: "var(--color-body)", lineHeight: 1.7, whiteSpace: "pre-line" }}
              >
                {event.description ?? "The organizer will update event details soon."}
              </p>
            </div>

            {/* Organizer Info */}
            <div className="card-feature-soft mt-xl" style={{ padding: "var(--space-xl)" }}>
              <p
                className="text-caption-md text-muted"
                style={{ textTransform: "uppercase", letterSpacing: "0.05em", fontSize: "11px", fontWeight: "700" }}
              >
                Organized by
              </p>
              <h3 className="text-heading-md mt-sm" style={{ margin: "var(--space-xxs) 0" }}>
                {event.organizer.name ?? "Event Organizer"}
              </h3>
              <p
                className="text-body-sm text-muted"
                style={{ fontFamily: "monospace", wordBreak: "break-all", fontSize: "13px", margin: 0 }}
              >
                {formatAddress(event.organizer.walletAddress)}
              </p>
            </div>
          </div>

          {/* Sidebar */}
          <aside style={{ display: "flex", flexDirection: "column", gap: "var(--space-lg)" }}>
            {/* Contract Notice */}
            {!event.contractAddress && (
              <div
                style={{
                  padding: "var(--space-lg)",
                  backgroundColor: "rgba(230, 0, 35, 0.08)",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--color-error)",
                }}
              >
                <p
                  className="text-body-sm"
                  style={{ color: "var(--color-error)", margin: 0, fontWeight: "600" }}
                >
                  Tickets will be available once the organizer publishes the event on-chain.
                </p>
              </div>
            )}

            {/* Summary details card */}
            <div
              className="card-feature-soft"
              style={{
                padding: "var(--space-xl)",
                display: "flex",
                flexDirection: "column",
                gap: "var(--space-md)",
              }}
            >
              <div>
                <p
                  className="text-caption-md text-muted"
                  style={{ textTransform: "uppercase", fontSize: "11px", fontWeight: "700", letterSpacing: "0.05em", margin: 0 }}
                >
                  Chain Network
                </p>
                <p className="text-body-strong" style={{ fontSize: "16px", fontWeight: "600", margin: "4px 0 0" }}>
                  {event.chainId ?? "Unknown"}
                </p>
              </div>
              <div style={{ height: "1px", backgroundColor: "var(--color-hairline-soft)" }} />
              <div>
                <p
                  className="text-caption-md text-muted"
                  style={{ textTransform: "uppercase", fontSize: "11px", fontWeight: "700", letterSpacing: "0.05em", margin: 0 }}
                >
                  Ticket Tiers
                </p>
                <p className="text-body-strong" style={{ fontSize: "16px", fontWeight: "600", margin: "4px 0 0" }}>
                  {event.ticketTiers.length} category
                  {event.ticketTiers.length !== 1 ? "s" : ""}
                </p>
              </div>
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

        {/* ── Lịch trình sự kiện (Event Agenda) ── */}
        {event.agenda && event.agenda.length > 0 && (
          <section style={{ marginBottom: "var(--space-xxl)", borderTop: "1px solid var(--color-hairline)", paddingTop: "var(--space-xl)" }}>
            <h2 className="text-heading-xl mb-lg">Lịch trình sự kiện</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "0", position: "relative", paddingLeft: "24px", borderLeft: "2px solid var(--color-hairline-soft)" }}>
              {event.agenda.map((item) => (
                <div key={item.id} style={{ position: "relative", marginBottom: "var(--space-xl)" }}>
                  {/* Circle Indicator on the line */}
                  <div style={{
                    position: "absolute",
                    left: "-31px",
                    top: "4px",
                    width: "12px",
                    height: "12px",
                    borderRadius: "50%",
                    backgroundColor: "var(--color-primary)",
                    border: "2px solid var(--color-canvas)",
                    boxShadow: "0 0 0 2px var(--color-hairline-soft)"
                  }} />
                  
                  <div>
                    <span style={{ fontSize: "14px", fontWeight: "600", color: "var(--color-primary)", textTransform: "uppercase" }}>
                      {item.time}
                    </span>
                    <h3 className="text-heading-md" style={{ marginTop: "4px" }}>
                      {item.title}
                    </h3>
                    {item.speaker && (
                      <span className="chip" style={{ display: "inline-block", fontSize: "11px", padding: "2px 8px", marginTop: "var(--space-xs)" }}>
                        Diễn giả: {item.speaker}
                      </span>
                    )}
                    {item.description && (
                      <p className="text-body-sm text-muted mt-sm" style={{ lineHeight: 1.5, whiteSpace: "pre-line" }}>
                        {item.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Câu hỏi thường gặp (FAQs) ── */}
        {event.faqs && event.faqs.length > 0 && (
          <section style={{ marginBottom: "var(--space-xxl)", borderTop: "1px solid var(--color-hairline)", paddingTop: "var(--space-xl)" }}>
            <h2 className="text-heading-xl mb-lg">Câu hỏi thường gặp (FAQ)</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-md)" }}>
              {event.faqs.map((faq) => (
                <details key={faq.id} className="card-feature-soft" style={{
                  padding: "var(--space-md) var(--space-lg)",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--color-hairline)",
                  cursor: "pointer",
                }}>
                  <summary style={{
                    fontWeight: "600",
                    fontSize: "16px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    listStyle: "none",
                    outline: "none",
                  }}>
                    <span>{faq.question}</span>
                    <span style={{ fontSize: "12px", transition: "transform 0.2s" }}>▼</span>
                  </summary>
                  <p className="text-body-sm text-muted mt-md" style={{
                    lineHeight: 1.6,
                    whiteSpace: "pre-line",
                    borderTop: "1px solid var(--color-hairline)",
                    paddingTop: "var(--space-md)",
                    cursor: "default"
                  }}>
                    {faq.answer}
                  </p>
                </details>
              ))}
            </div>
          </section>
        )}

        {/* ── Ticket Tiers ── */}
        <section style={{ marginTop: "var(--space-section)" }}>
          <h2 className="text-heading-lg mb-xl">Available Tickets</h2>

          {event.contractAddress ? (
            <div className="ticket-tiers-grid">
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
                      eventId={event.id}
                      tierId={tier.id}
                      tierName={tier.name}
                      tierPrice={tier.price.toString()}
                      onchainTierId={tier.onchainTierId}
                      eventContractAddress={event.contractAddress}
                      organizerWalletAddress={event.organizer.walletAddress}
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
      <Footer />
    </>
  );
}

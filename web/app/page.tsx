import { prisma } from "@/lib/prisma";
import { Nav } from "@/components/layout/nav";
import Link from "next/link";

/* ------------------------------------------------------------------ */
/*  Data fetching                                                      */
/* ------------------------------------------------------------------ */

async function getFeaturedEvents() {
  try {
    const events = await prisma.event.findMany({
      where: { contractAddress: { not: null } },
      orderBy: { createdAt: "desc" },
      take: 4,
      include: {
        ticketTiers: {
          select: {
            id: true,
            name: true,
            price: true,
            maxQuantity: true,
            soldCount: true,
          },
          orderBy: { price: "asc" },
          take: 1,
        },
      },
    });
    return events;
  } catch {
    console.error("Failed to fetch featured events");
    return [];
  }
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatDate(iso: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(iso));
}

function lowestPrice(tiers: { price: unknown }[]) {
  if (!tiers.length) return null;
  const num = Number(tiers[0].price);
  return isNaN(num) ? null : `$${num.toFixed(2)}`;
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default async function HomePage() {
  const events = await getFeaturedEvents();

  return (
    <>
      {/* ============================================================ */}
      {/*  Navigation                                                   */}
      {/* ============================================================ */}
      <Nav />

      {/* ============================================================ */}
      {/*  Hero Section                                                 */}
      {/* ============================================================ */}
      <section className="hero-section">
        <div className="container text-center">
          <h1 className="hero-title">Discover Events Near You</h1>
          <p className="hero-subtitle">
            Find concerts, meetups, conferences and more — secured on-chain with
            NFT tickets.
          </p>

          {/* Search bar */}
          <form
            action="/events"
            method="GET"
            className="search-wrapper"
            style={{ maxWidth: 560, margin: "0 auto" }}
          >
            <span className="search-icon" aria-hidden="true">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
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
              className="input-search"
              placeholder="Search events, artists, venues…"
              aria-label="Search events"
            />
          </form>

          <div
            className="mt-md"
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "var(--space-md)",
            }}
          >
            <Link href="/events" className="btn-primary">
              Browse All Events
            </Link>
            <Link href="/marketplace" className="btn-secondary">
              Explore Marketplace
            </Link>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  Featured Events                                              */}
      {/* ============================================================ */}
      <section className="section-gap">
        <div className="container">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
            }}
          >
            <h2 className="text-heading-xl">Featured Events</h2>
            <Link
              href="/events"
              className="text-link-md"
              style={{ color: "var(--color-primary)" }}
            >
              See all →
            </Link>
          </div>

          {events.length === 0 ? (
            <p className="text-body-md text-muted mt-lg">
              No published events yet. Check back soon!
            </p>
          ) : (
            <div className="masonry-grid mt-lg">
              {events.map((evt) => (
                <Link
                  key={evt.id}
                  href={`/events/${evt.id}`}
                  style={{ textDecoration: "none", color: "inherit" }}
                >
                  <article className="card">
                    {/* Image */}
                    <div className="event-card-image">
                      {evt.bannerImage ? (
                        <img src={evt.bannerImage} alt={evt.title} />
                      ) : (
                        <div
                          style={{
                            width: "100%",
                            height: "100%",
                            background: "var(--color-surface-hover)",
                          }}
                        />
                      )}
                    </div>

                    {/* Badge */}
                    <span className="event-card-badge">Live</span>

                    {/* Body */}
                    <div className="event-card-body">
                      <time
                        className="event-card-date"
                        dateTime={new Date(evt.startDate).toISOString()}
                      >
                        {formatDate(evt.startDate)}
                      </time>
                      <h3 className="event-card-title">{evt.title}</h3>
                      <p className="event-card-meta">
                        {evt.venue ?? "Online event"}
                      </p>
                      <p className="event-card-price">
                        {evt.ticketTiers.length > 0
                          ? `From ${lowestPrice(evt.ticketTiers) ?? "Free"}`
                          : "Free"}
                      </p>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ============================================================ */}
      {/*  Category Grid                                                */}
      {/* ============================================================ */}
      <section className="section-gap">
        <div className="container">
          <h2 className="text-heading-xl text-center mb-lg">
            Explore by Category
          </h2>

          <div className="category-grid">
            {[
              { name: "Music", emoji: "🎵", bg: "#fef3c7" },
              { name: "Tech", emoji: "💻", bg: "#dbeafe" },
              { name: "Food", emoji: "🍕", bg: "#fce7f3" },
              { name: "Sports", emoji: "⚽", bg: "#d1fae5" },
            ].map((cat) => (
              <Link
                key={cat.name}
                href={`/events?category=${cat.name.toLowerCase()}`}
                className="category-tile"
                style={{ textDecoration: "none", color: "inherit" }}
              >
                <div
                  style={{
                    width: "100%",
                    aspectRatio: "4/3",
                    background: cat.bg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "3rem",
                  }}
                >
                  {cat.emoji}
                </div>
                <span className="category-tile-label">{cat.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  How It Works                                                 */}
      {/* ============================================================ */}
      <section className="section-gap">
        <div className="container">
          <h2 className="text-heading-xl text-center mb-xl">How It Works</h2>

          {/* Step 1 */}
          <div className="feature-row mb-xl">
            <div
              className="card-feature-soft"
              style={{ flex: 1, padding: "var(--space-xl)" }}
            >
              <span
                className="text-body-strong"
                style={{ color: "var(--color-primary)" }}
              >
                Step 1
              </span>
              <h3 className="text-heading-lg mt-sm">Browse Events</h3>
              <p className="text-body-md text-muted mt-sm">
                Discover curated events across music, tech, food, sports and
                more. Filter by date, location, or category to find exactly what
                you want.
              </p>
              <Link href="/events" className="btn-tertiary mt-md">
                Explore events →
              </Link>
            </div>
            <div
              style={{
                flex: 1,
                background: "var(--color-surface-hover)",
                borderRadius: "var(--radius-lg)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: 240,
                fontSize: "4rem",
              }}
            >
              🔍
            </div>
          </div>

          {/* Step 2 */}
          <div className="feature-row-reverse mb-xl">
            <div
              className="card-feature-soft"
              style={{ flex: 1, padding: "var(--space-xl)" }}
            >
              <span
                className="text-body-strong"
                style={{ color: "var(--color-primary)" }}
              >
                Step 2
              </span>
              <h3 className="text-heading-lg mt-sm">Buy Your Ticket</h3>
              <p className="text-body-md text-muted mt-sm">
                Choose your tier and purchase with your connected wallet. Your
                ticket is minted as an NFT — verifiable and tamper-proof.
              </p>
              <Link href="/marketplace" className="btn-tertiary mt-md">
                Visit marketplace →
              </Link>
            </div>
            <div
              style={{
                flex: 1,
                background: "var(--color-surface-hover)",
                borderRadius: "var(--radius-lg)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: 240,
                fontSize: "4rem",
              }}
            >
              🎟️
            </div>
          </div>

          {/* Step 3 */}
          <div className="feature-row">
            <div
              className="card-feature-soft"
              style={{ flex: 1, padding: "var(--space-xl)" }}
            >
              <span
                className="text-body-strong"
                style={{ color: "var(--color-primary)" }}
              >
                Step 3
              </span>
              <h3 className="text-heading-lg mt-sm">Check In</h3>
              <p className="text-body-md text-muted mt-sm">
                Show your QR code at the door. The organizer scans it, verifies
                on-chain ownership, and you&apos;re in — no paper, no hassle.
              </p>
            </div>
            <div
              style={{
                flex: 1,
                background: "var(--color-surface-hover)",
                borderRadius: "var(--radius-lg)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: 240,
                fontSize: "4rem",
              }}
            >
              ✅
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  Footer                                                       */}
      {/* ============================================================ */}
      <footer className="footer">
        <div className="container">
          <div className="footer-grid">
            {/* Col 1 — Brand */}
            <div>
              <h4 className="footer-col-header">TicketNFT</h4>
              <p className="text-body-sm text-muted">
                On-chain event tickets you truly own. Discover, buy, and check
                in — all through your wallet.
              </p>
            </div>

            {/* Col 2 — Platform */}
            <div>
              <h4 className="footer-col-header">Platform</h4>
              <nav
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "var(--space-xs)",
                }}
              >
                <Link href="/events" className="footer-link">
                  Browse Events
                </Link>
                <Link href="/marketplace" className="footer-link">
                  Marketplace
                </Link>
                <Link href="/organizer" className="footer-link">
                  Organizer Dashboard
                </Link>
              </nav>
            </div>

            {/* Col 3 — Resources */}
            <div>
              <h4 className="footer-col-header">Resources</h4>
              <nav
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "var(--space-xs)",
                }}
              >
                <a href="#" className="footer-link">
                  Documentation
                </a>
                <a href="#" className="footer-link">
                  Smart Contracts
                </a>
                <a href="#" className="footer-link">
                  API Reference
                </a>
              </nav>
            </div>

            {/* Col 4 — Legal */}
            <div>
              <h4 className="footer-col-header">Legal</h4>
              <nav
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "var(--space-xs)",
                }}
              >
                <a href="#" className="footer-link">
                  Privacy Policy
                </a>
                <a href="#" className="footer-link">
                  Terms of Service
                </a>
                <a href="#" className="footer-link">
                  Cookie Policy
                </a>
              </nav>
            </div>
          </div>

          <p
            className="text-body-sm text-muted text-center"
            style={{
              marginTop: "var(--space-xl)",
              paddingTop: "var(--space-lg)",
              borderTop: "1px solid var(--color-border-subtle)",
            }}
          >
            © {new Date().getFullYear()} TicketNFT. All rights reserved.
          </p>
        </div>
      </footer>
    </>
  );
}

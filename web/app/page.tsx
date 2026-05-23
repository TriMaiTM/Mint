import { prisma } from "@/lib/prisma";
import { Nav } from "@/components/layout/nav";
import { Footer } from "@/components/layout/footer";
import { FeaturedCarousel } from "@/components/events/featured-carousel";
import Link from "next/link";

/* ------------------------------------------------------------------ */
/*  Data fetching                                                      */
/* ------------------------------------------------------------------ */

async function getFeaturedEvents() {
  try {
    const events = await prisma.event.findMany({
      where: { contractAddress: { not: null } },
      orderBy: { createdAt: "desc" },
      take: 3,
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
    return events.map((event) => ({
      ...event,
      ticketTiers: event.ticketTiers.map((tier) => ({
        ...tier,
        price: tier.price.toString(),
      })),
    }));
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
      {/*  Hero Carousel                                                */}
      {/* ============================================================ */}
      <section style={{ paddingTop: "var(--space-lg)" }}>
        <div className="container">
          <FeaturedCarousel events={events} />
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
            <div
              className="events-grid-3 mt-lg"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "var(--space-xl)",
              }}
            >
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
                      {/* Badge */}
                      <span className="event-card-badge">Live</span>
                    </div>

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

          <div className="categories-container">
            {[
              {
                name: "Music",
                slug: "music",
                icon: (
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                    <path d="M19 10v1a7 7 0 0 1-14 0v-1" />
                    <line x1="12" x2="12" y1="19" y2="22" />
                  </svg>
                )
              },
              {
                name: "Tech",
                slug: "tech",
                icon: (
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="16" height="16" x="4" y="4" rx="2" />
                    <rect width="6" height="6" x="9" y="9" rx="1" />
                    <path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 15h3M1 9h3M1 15h3" />
                  </svg>
                )
              },
              {
                name: "Food",
                slug: "food",
                icon: (
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
                    <line x1="7" x2="7" y1="11" y2="22" />
                    <path d="M21 15V2v5h-4V2v13" />
                    <line x1="19" x2="19" y1="15" y2="22" />
                  </svg>
                )
              },
              {
                name: "Sports",
                slug: "sports",
                icon: (
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
                    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                    <path d="M4 22h16" />
                    <path d="M10 14.66V17c0 .55-.45 1-1 1H4v2h16v-2h-5c-.55 0-1-.45-1-1v-2.34" />
                    <path d="M12 2a6 6 0 0 1 6 6v1H6V8a6 6 0 0 1 6-6Z" />
                  </svg>
                )
              },
              {
                name: "Art",
                slug: "art",
                icon: (
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22C17.5228 22 22 17.5228 22 12C22 9.5 20 7.5 17.5 7.5H16.5C15.9477 7.5 15.5 7.05228 15.5 6.5V5.5C15.5 3 13.5 2 11 2C5.47715 2 1 6.47715 1 12C1 17.5228 5.47715 22 12 22Z" />
                    <circle cx="7.5" cy="10.5" r="1.5" fill="currentColor" />
                    <circle cx="11.5" cy="7.5" r="1.5" fill="currentColor" />
                    <circle cx="16.5" cy="11.5" r="1.5" fill="currentColor" />
                  </svg>
                )
              },
              {
                name: "Business",
                slug: "business",
                icon: (
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 2H9a2 2 0 0 0-2 2v2H3a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-4V4a2 2 0 0 0-2-2z" />
                    <path d="M7 6h10V4H7v2z" />
                    <path d="M3 11h18" />
                  </svg>
                )
              },
              {
                name: "General",
                slug: "general",
                icon: (
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="20" height="12" x="2" y="6" rx="2" />
                    <path d="M9 12h6" />
                    <path d="M12 9v6" />
                    <path d="M6 6v12M18 6v12" />
                  </svg>
                )
              },
            ].map((cat) => (
              <Link
                key={cat.name}
                href={`/events/category/${cat.slug}`}
                className="category-circle-link"
              >
                <div className="category-circle-inner">
                  {cat.icon}
                </div>
                <span className="category-circle-label">{cat.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  How It Works                                                 */}
      {/* ============================================================ */}
      <section className="section-gap" style={{ paddingBottom: 0 }}>
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: "var(--space-xxl)" }}>
            <h2 className="text-display-lg">How It Works</h2>
            <p className="text-body-md text-muted mt-sm" style={{ maxWidth: 600, margin: "var(--space-xs) auto 0" }}>
              Experience the future of event ticketing in three simple, secure steps powered by blockchain technology.
            </p>
          </div>

          <div className="steps-container">
            {/* Step 1 */}
            <div className="step-card">
              <div className="step-card-number-bg">01</div>
              <div className="step-card-icon-wrapper">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </div>
              <div>
                <span className="text-body-strong" style={{ color: "var(--color-primary)", textTransform: "uppercase", fontSize: "12px", letterSpacing: "0.5px" }}>Step 1</span>
                <h3 className="text-heading-md mt-xxs" style={{ margin: "2px 0 0" }}>Browse Events</h3>
              </div>
              <p className="text-body-sm text-muted" style={{ margin: 0, zIndex: 1 }}>
                Discover concerts, hackathons, and local meetups. Search and filter by category or date to find your next experience.
              </p>
              <Link href="/events" className="text-link-md mt-auto" style={{ color: "var(--color-primary)", fontWeight: 600, zIndex: 1 }}>
                Explore Events →
              </Link>
            </div>

            {/* Step 2 */}
            <div className="step-card">
              <div className="step-card-number-bg">02</div>
              <div className="step-card-icon-wrapper">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="5" width="20" height="14" rx="2" ry="2" />
                  <line x1="2" y1="10" x2="22" y2="10" />
                </svg>
              </div>
              <div>
                <span className="text-body-strong" style={{ color: "var(--color-primary)", textTransform: "uppercase", fontSize: "12px", letterSpacing: "0.5px" }}>Step 2</span>
                <h3 className="text-heading-md mt-xxs" style={{ margin: "2px 0 0" }}>Claim NFT Ticket</h3>
              </div>
              <p className="text-body-sm text-muted" style={{ margin: 0, zIndex: 1 }}>
                Purchase directly using your wallet. Your ticket is minted instantly on-chain as a unique, verifiable NFT.
              </p>
              <Link href="/marketplace" className="text-link-md mt-auto" style={{ color: "var(--color-primary)", fontWeight: 600, zIndex: 1 }}>
                View Marketplace →
              </Link>
            </div>

            {/* Step 3 */}
            <div className="step-card">
              <div className="step-card-number-bg">03</div>
              <div className="step-card-icon-wrapper">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <rect x="7" y="7" width="3" height="3" />
                  <rect x="14" y="7" width="3" height="3" />
                  <rect x="7" y="14" width="3" height="3" />
                  <rect x="14" y="14" width="3" height="3" />
                </svg>
              </div>
              <div>
                <span className="text-body-strong" style={{ color: "var(--color-primary)", textTransform: "uppercase", fontSize: "12px", letterSpacing: "0.5px" }}>Step 3</span>
                <h3 className="text-heading-md mt-xxs" style={{ margin: "2px 0 0" }}>Seamless Check-in</h3>
              </div>
              <p className="text-body-sm text-muted" style={{ margin: 0, zIndex: 1 }}>
                Present your secure QR code at the door. The organizer scans it to instantly verify dynamic ownership status.
              </p>
              <span className="text-body-sm-strong mt-auto" style={{ color: "var(--color-ash)", zIndex: 1 }}>
                Fast & Secure
              </span>
            </div>
          </div>

          {/* ── Web3 Benefits Grid ── */}
          <div className="benefits-section">
            <div style={{ textAlign: "center", marginBottom: "var(--space-xl)" }}>
              <h2 className="text-heading-xl" style={{ margin: 0 }}>Why TicketNFT?</h2>
              <p className="text-body-md text-muted mt-xs" style={{ margin: "var(--space-xxs) 0 0" }}>
                Eliminate fraud and take true ownership of your event experiences.
              </p>
            </div>

            <div className="benefits-grid">
              <div className="benefit-card">
                <div className="benefit-card-icon">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                </div>
                <h3 className="text-heading-md" style={{ margin: 0 }}>100% Fraud Protection</h3>
                <p className="text-body-sm text-muted" style={{ margin: 0 }}>
                  Blockchain verification ensures every ticket is authentic. Never worry about duplicate or counterfeit tickets again.
                </p>
              </div>

              <div className="benefit-card">
                <div className="benefit-card-icon">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <line x1="3" y1="9" x2="21" y2="9" />
                    <line x1="9" y1="21" x2="9" y2="9" />
                  </svg>
                </div>
                <h3 className="text-heading-md" style={{ margin: 0 }}>Dynamic Collectibles</h3>
                <p className="text-body-sm text-muted" style={{ margin: 0 }}>
                  After check-in, your NFT ticket transforms into a unique digital keepsake to showcase your attendance history.
                </p>
              </div>

              <div className="benefit-card">
                <div className="benefit-card-icon">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                </div>
                <h3 className="text-heading-md" style={{ margin: 0 }}>Secure Secondary Market</h3>
                <p className="text-body-sm text-muted" style={{ margin: 0 }}>
                  Can't make it? Sell your ticket safely on our built-in secondary marketplace with secure automated payouts.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  Footer                                                       */}
      {/* ============================================================ */}
      <Footer />
    </>
  );
}

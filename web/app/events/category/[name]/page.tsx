import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Nav } from "@/components/layout/nav";
import { Footer } from "@/components/layout/footer";

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  music: "Concerts, festivals, and live performances",
  tech: "Conferences, hackathons, and meetups",
  food: "Tastings, food festivals, and cooking classes",
  sports: "Tournaments, matches, and fitness events",
  art: "Exhibitions, galleries, and workshops",
  business: "Networking, seminars, and conferences",
  general: "Everything else",
};

const VALID_CATEGORIES = [
  "music",
  "tech",
  "food",
  "sports",
  "art",
  "business",
  "general",
];

const CATEGORY_VISUALS: Record<
  string,
  {
    gradient: string;
    slogan: string;
    graphic: React.ReactNode;
  }
> = {
  music: {
    gradient: "linear-gradient(135deg, #FF0844 0%, #FFB199 100%)",
    slogan: "Feel the beat with live concerts, festivals, and musical performances.",
    graphic: (
      <svg width="140" height="140" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" opacity="0.2" style={{ color: "#fff" }}>
        <path d="M9 18V5l12-2v13" />
        <circle cx="6" cy="18" r="3" />
        <circle cx="18" cy="16" r="3" />
      </svg>
    ),
  },
  tech: {
    gradient: "linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)",
    slogan: "Innovate and connect with coding meetups, panels, and hackathons.",
    graphic: (
      <svg width="140" height="140" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" opacity="0.2" style={{ color: "#fff" }}>
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
        <line x1="14" y1="4" x2="10" y2="20" />
      </svg>
    ),
  },
  food: {
    gradient: "linear-gradient(135deg, #F83600 0%, #FE9F00 100%)",
    slogan: "Savor the flavors at local tastings, culinary showcases, and food trucks.",
    graphic: (
      <svg width="140" height="140" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" opacity="0.2" style={{ color: "#fff" }}>
        <circle cx="12" cy="12" r="10" />
        <path d="M12 2a10 10 0 0 0-8.66 5M12 22a10 10 0 0 0 8.66-5" />
        <path d="M9 10v4M12 8v6M15 10v4" />
      </svg>
    ),
  },
  sports: {
    gradient: "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)",
    slogan: "Get active with high-energy matches, tournaments, and races.",
    graphic: (
      <svg width="140" height="140" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" opacity="0.2" style={{ color: "#fff" }}>
        <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
        <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
        <path d="M4 22h16" />
        <path d="M10 14.66V17c0 .55-.45 1-1 1H4v2h16v-2h-5c-.55 0-1-.45-1-1v-2.34" />
        <path d="M12 2a6 6 0 0 1 6 6v1H6V8a6 6 0 0 1 6-6Z" />
      </svg>
    ),
  },
  art: {
    gradient: "linear-gradient(135deg, #b00979 0%, #ff5252 100%)",
    slogan: "Ignite your imagination at gallery showings, art galleries, and workshops.",
    graphic: (
      <svg width="140" height="140" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" opacity="0.2" style={{ color: "#fff" }}>
        <path d="M12 22C17.5228 22 22 17.5228 22 12C22 9.5 20 7.5 17.5 7.5H16.5C15.9477 7.5 15.5 7.05228 15.5 6.5V5.5C15.5 3 13.5 2 11 2C5.47715 2 1 6.47715 1 12C1 17.5228 5.47715 22 12 22Z" />
        <circle cx="7.5" cy="10.5" r="1.5" fill="#fff" />
        <circle cx="11.5" cy="7.5" r="1.5" fill="#fff" />
        <circle cx="16.5" cy="11.5" r="1.5" fill="#fff" />
      </svg>
    ),
  },
  business: {
    gradient: "linear-gradient(135deg, #2c3e50 0%, #3498db 100%)",
    slogan: "Grow your career with industry events, masterclasses, and panels.",
    graphic: (
      <svg width="140" height="140" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" opacity="0.2" style={{ color: "#fff" }}>
        <path d="M15 2H9a2 2 0 0 0-2 2v2H3a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-4V4a2 2 0 0 0-2-2z" />
        <path d="M7 6h10V4H7v2z" />
        <path d="M3 11h18" />
      </svg>
    ),
  },
  general: {
    gradient: "linear-gradient(135deg, #434343 0%, #000000 100%)",
    slogan: "Explore a diverse selection of upcoming events and gatherings.",
    graphic: (
      <svg width="140" height="140" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" opacity="0.2" style={{ color: "#fff" }}>
        <rect width="20" height="12" x="2" y="6" rx="2" />
        <path d="M6 12h12" />
        <circle cx="10" cy="12" r="1" />
        <circle cx="14" cy="12" r="1" />
      </svg>
    ),
  },
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function formatDate(iso: Date) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(iso));
}

function lowestPrice(tiers: { price: unknown }[]): string | null {
  if (!tiers.length) return null;
  const prices = tiers.map((t) => Number(t.price)).filter((n) => !isNaN(n));
  if (!prices.length) return null;
  const min = Math.min(...prices);
  return min === 0 ? "Free" : `${min.toFixed(4)} ETH`;
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

type CategoryPageProps = {
  params: Promise<{ name: string }>;
};

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { name: rawName } = await params;
  const categoryName = decodeURIComponent(rawName).toLowerCase();

  if (!VALID_CATEGORIES.includes(categoryName)) {
    notFound();
  }

  const displayName = capitalize(categoryName);
  const visuals = CATEGORY_VISUALS[categoryName] || CATEGORY_VISUALS.general;
  const description = CATEGORY_DESCRIPTIONS[categoryName] ?? "Explore events in this category";

  const events = await prisma.event.findMany({
    where: {
      contractAddress: { not: null },
      category: { equals: displayName, mode: "insensitive" },
    },
    include: {
      ticketTiers: {
        select: { price: true },
        orderBy: { price: "asc" },
        take: 1,
      },
    },
    orderBy: { startDate: "asc" },
  });

  return (
    <>
      {/* ── Navigation ── */}
      <Nav />

      <main
        style={{
          paddingTop: "var(--space-xl)",
          paddingBottom: "var(--space-section)",
        }}
      >
        <div className="container">
          {/* Breadcrumbs */}
          <div className="category-detail-breadcrumbs">
            <Link href="/">Home</Link>
            <span>/</span>
            <Link href="/events">Events</Link>
            <span>/</span>
            <span style={{ color: "var(--color-ink)" }}>{displayName}</span>
          </div>

          {/* ── Category Banner ── */}
          <section
            className="category-banner"
            style={{ background: visuals.gradient }}
          >
            <div className="category-banner-content">
              <h1 className="category-banner-title">{displayName} Events</h1>
              <p className="category-banner-subtitle">
                {visuals.slogan} {description}
              </p>
            </div>
            <div className="category-banner-graphic">
              {visuals.graphic}
            </div>
          </section>

          {events.length === 0 ? (
            /* ── Empty State ── */
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "var(--space-section) var(--space-lg)",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: "var(--radius-full)",
                  background: "var(--color-surface-card)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "var(--space-xl)",
                  fontSize: 28,
                }}
                aria-hidden="true"
              >
                🎫
              </div>
              <h2
                className="text-heading-md"
                style={{ color: "var(--color-ink)" }}
              >
                No {displayName.toLowerCase()} events yet
              </h2>
              <p
                className="text-body-md"
                style={{
                  color: "var(--color-mute)",
                  marginTop: "var(--space-sm)",
                  maxWidth: 400,
                }}
              >
                There are no published events in this category. Check back soon
                or browse all events.
              </p>
              <Link
                href="/events"
                className="btn-secondary"
                style={{ marginTop: "var(--space-xl)" }}
              >
                Browse all events
              </Link>
            </div>
          ) : (
            /* ── Event Grid ── */
            <>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "var(--space-lg)",
                  borderBottom: "1px solid var(--color-hairline-soft)",
                  paddingBottom: "var(--space-sm)",
                }}
              >
                <p className="text-body-md text-muted" style={{ margin: 0 }}>
                  {events.length} event{events.length !== 1 ? "s" : ""} found
                </p>
                <Link
                  href={`/events?category=${categoryName}`}
                  className="text-link-md"
                  style={{ color: "var(--color-primary)", fontWeight: 500 }}
                >
                  View with filters
                </Link>
              </div>
              <div
                className="events-grid-3"
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: "var(--space-xl)",
                }}
              >
                {events.map((event) => (
                  <Link
                    key={event.id}
                    href={`/events/${event.id}`}
                    style={{ textDecoration: "none", color: "inherit" }}
                  >
                    <div className="card">
                      <div className="event-card-image">
                        {event.bannerImage ? (
                          <img
                            src={event.bannerImage}
                            alt={event.title}
                            loading="lazy"
                          />
                        ) : (
                          <div
                            style={{
                              width: "100%",
                              height: "100%",
                              background: "var(--color-surface-card)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 32,
                              color: "var(--color-ash)",
                            }}
                            aria-hidden="true"
                          >
                            <span
                              style={{
                                fontSize: "24px",
                                color: "var(--color-stone)",
                              }}
                            >
                              🎫
                            </span>
                          </div>
                        )}
                        <span className="event-card-badge">{displayName}</span>
                      </div>
                      <div className="event-card-body">
                        <p className="event-card-date">
                          {formatDate(event.startDate)}
                        </p>
                        <h3 className="event-card-title">{event.title}</h3>
                        <p className="event-card-meta">
                          {event.venue ?? "TBA"}
                        </p>
                        <p className="event-card-price">
                          {event.ticketTiers.length > 0
                            ? `From ${lowestPrice(event.ticketTiers) ?? "Free"}`
                            : "Free"}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}


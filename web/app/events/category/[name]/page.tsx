import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Nav } from "@/components/layout/nav";

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
  const description =
    CATEGORY_DESCRIPTIONS[categoryName] ?? "Explore events in this category";

  const events = await prisma.event.findMany({
    where: {
      contractAddress: { not: null },
      category: displayName,
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
        {/* ── Category Banner ── */}
        <section
          className="hero-section"
          style={{ marginBottom: "var(--space-xxl)" }}
        >
          <div className="container text-center">
            <h1 className="text-display-lg">{displayName}</h1>
            <p className="text-body-md text-muted mt-sm">{description}</p>
          </div>
        </section>

        <div className="container">
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
              <p
                className="text-body-md text-muted mb-lg"
              >
                {events.length} event{events.length !== 1 ? "s" : ""} found
              </p>
              <div className="masonry-grid">
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
    </>
  );
}

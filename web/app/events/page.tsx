import { prisma } from "@/lib/prisma";
import { Nav } from "@/components/layout/nav";
import Link from "next/link";

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const PAGE_SIZE = 20;

const CATEGORIES = [
  { label: "All", value: "all" },
  { label: "Music", value: "music" },
  { label: "Tech", value: "tech" },
  { label: "Food", value: "food" },
  { label: "Sports", value: "sports" },
  { label: "Art", value: "art" },
  { label: "Business", value: "business" },
] as const;

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

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

interface Props {
  searchParams: Promise<{ q?: string; category?: string; page?: string }>;
}

export default async function EventsPage({ searchParams }: Props) {
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const activeCategory = params.category ?? "all";
  const currentPage = Math.max(1, Number(params.page) || 1);

  /* ── Build Prisma where clause ── */
  const where: Record<string, unknown> = {
    contractAddress: { not: null },
  };

  if (query) {
    where.title = { contains: query, mode: "insensitive" };
  }

  // NOTE: The Event model currently has no `category` field.
  // When added, uncomment the block below to enable DB-level filtering:
  //
  // if (activeCategory !== "all") {
  //   where.category = activeCategory;
  // }

  /* ── Fetch one extra page to know if "Load more" should show ── */
  const events = await prisma.event.findMany({
    where,
    orderBy: { startDate: "asc" },
    skip: (currentPage - 1) * PAGE_SIZE,
    take: PAGE_SIZE + 1,
    include: {
      ticketTiers: {
        select: {
          price: true,
          maxQuantity: true,
        },
        orderBy: { price: "asc" },
      },
    },
  });

  const hasMore = events.length > PAGE_SIZE;
  const pageEvents = events.slice(0, PAGE_SIZE);

  /* ── Map to display shapes ── */
  const mapped = pageEvents.map((event) => {
    const price = lowestPrice(event.ticketTiers);
    return {
      id: event.id,
      title: event.title,
      venue: event.venue ?? "TBA",
      bannerImage: event.bannerImage,
      startDate: event.startDate,
      price,
    };
  });

  /* ── Build base href for pagination / filters (preserves ?q=) ── */
  function buildHref(overrides: Record<string, string | undefined>) {
    const sp = new URLSearchParams();
    if (overrides.q ?? query) sp.set("q", (overrides.q ?? query)!);
    if (overrides.category && overrides.category !== "all")
      sp.set("category", overrides.category);
    if (overrides.page && overrides.page !== "1")
      sp.set("page", overrides.page);
    const qs = sp.toString();
    return `/events${qs ? `?${qs}` : ""}`;
  }

  return (
    <>
      {/* ============================================================ */}
      {/*  Sticky Navigation                                            */}
      {/* ============================================================ */}
      <Nav />

      {/* ============================================================ */}
      {/*  Main Content                                                 */}
      {/* ============================================================ */}
      <main
        style={{
          paddingTop: "var(--space-xl)",
          paddingBottom: "var(--space-section)",
        }}
      >
        <div className="container">
          {/* ── Page Header ── */}
          <header style={{ marginBottom: "var(--space-xl)" }}>
            <h1
              className="text-heading-xl"
              style={{ color: "var(--color-ink)" }}
            >
              Browse Events
            </h1>
            <p
              className="text-body-md"
              style={{
                color: "var(--color-mute)",
                marginTop: "var(--space-sm)",
              }}
            >
              Discover upcoming events and secure your NFT ticket.
            </p>
          </header>

          {/* ── Search Bar ── */}
          <form
            action="/events"
            method="GET"
            className="search-wrapper"
            style={{ maxWidth: "100%", marginBottom: "var(--space-lg)" }}
          >
            {activeCategory !== "all" && (
              <input type="hidden" name="category" value={activeCategory} />
            )}
            <svg
              className="search-icon"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              name="q"
              className="input-search"
              placeholder="Search events by title..."
              defaultValue={query}
              aria-label="Search events"
            />
          </form>

          {/* ── Filter Chips ── */}
          <div className="filter-bar">
            {CATEGORIES.map((cat) => {
              const isActive = activeCategory === cat.value;
              return (
                <Link
                  key={cat.value}
                  href={buildHref({ category: cat.value, page: "1" })}
                  className={isActive ? "chip chip-active" : "chip"}
                  aria-current={isActive ? "true" : undefined}
                >
                  {cat.label}
                </Link>
              );
            })}
          </div>

          {/* ── Results ── */}
          {mapped.length === 0 ? (
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
                No events found
              </h2>
              <p
                className="text-body-md"
                style={{
                  color: "var(--color-mute)",
                  marginTop: "var(--space-sm)",
                  maxWidth: 400,
                }}
              >
                {query
                  ? `No results for "${query}". Try a different search term or clear filters.`
                  : "There are no published events yet. Check back soon!"}
              </p>
              {(query || activeCategory !== "all") && (
                <Link
                  href="/events"
                  className="btn-secondary"
                  style={{ marginTop: "var(--space-xl)" }}
                >
                  Clear all filters
                </Link>
              )}
            </div>
          ) : (
            <>
              {/* ── Event Grid ── */}
              <div className="masonry-grid">
                {mapped.map((event) => (
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
                        <span className="event-card-badge">Event</span>
                      </div>
                      <div className="event-card-body">
                        <p className="event-card-date">
                          {formatDate(event.startDate)}
                        </p>
                        <h3 className="event-card-title">{event.title}</h3>
                        <p className="event-card-meta">{event.venue}</p>
                        <p className="event-card-price">
                          {event.price ?? "Price TBA"}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {/* ── Load More ── */}
              {hasMore && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    marginTop: "var(--space-xxl)",
                  }}
                >
                  <Link
                    href={buildHref({ page: String(currentPage + 1) })}
                    className="btn-primary"
                    style={{ minWidth: 180, textAlign: "center" }}
                  >
                    Load more events
                  </Link>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </>
  );
}

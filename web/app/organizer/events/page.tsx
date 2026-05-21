import Link from "next/link";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getSessionCookieName, verifySessionToken } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function OrganizerEventsPage() {
  const cookieStore = await cookies();
  const session = verifySessionToken(
    cookieStore.get(getSessionCookieName())?.value,
  );

  if (!session) {
    redirect("/");
  }

  const me = await prisma.user.findUnique({
    where: { id: session.sub },
    select: {
      id: true,
      role: true,
      walletAddress: true,
    },
  });

  if (!me || (me.role !== "ORGANIZER" && me.role !== "ADMIN")) {
    redirect("/");
  }

  const events = await prisma.event.findMany({
    where: { organizerId: me.id },
    orderBy: { createdAt: "desc" },
    include: {
      ticketTiers: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  return (
    <>
      {/* ── Page Content ── */}
      <div style={{ maxWidth: "1200px" }}>
        <header style={{ marginBottom: "var(--space-xxl)" }}>
          <h1 className="text-display-lg">My Events</h1>
          <p className="text-body-md text-muted mt-sm">
            Manage your events, publish them on-chain, and monitor ticket
            inventory.
          </p>
        </header>

        {events.length === 0 ? (
          <div
            className="card-feature-soft"
            style={{ textAlign: "center", padding: "var(--space-xxl)" }}
          >
            <p className="text-heading-lg mb-md">No events yet</p>
            <p className="text-body-md text-muted mb-lg">
              Create your first event to start selling NFT tickets.
            </p>
            <Link href="/organizer/events/new" className="btn-primary">
              Create Event
            </Link>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))",
              gap: "var(--space-xl)",
              alignItems: "stretch",
            }}
          >
            {events.map((event) => {
              const totalQty = event.ticketTiers.reduce(
                (sum, tier) => sum + tier.maxQuantity,
                0,
              );
              const soldQty = event.ticketTiers.reduce(
                (sum, tier) => sum + tier.soldCount,
                0,
              );
              const isOnChain = !!event.contractAddress;

              return (
                <article className="card" key={event.id}>
                  {/* Banner Image */}
                  {event.bannerImage && (
                    <div className="event-card-image">
                      <img src={event.bannerImage} alt={event.title} />
                    </div>
                  )}

                  <div
                    style={{
                      padding: "var(--space-lg)",
                      display: "flex",
                      flexDirection: "column",
                      flex: 1,
                    }}
                  >
                    {/* Status Row */}
                    <div
                      style={{
                        display: "flex",
                        gap: "var(--space-sm)",
                        marginBottom: "var(--space-md)",
                      }}
                    >
                      <span
                        className={
                          event.status === "PUBLISHED"
                            ? "chip chip-active"
                            : "chip"
                        }
                      >
                        {event.status}
                      </span>
                      <span className={isOnChain ? "chip chip-active" : "chip"}>
                        {isOnChain ? "On-chain" : "Draft"}
                      </span>
                    </div>

                    {/* Title & Description */}
                    <h3 className="event-card-title">{event.title}</h3>
                    <p
                      className="text-body-sm text-muted mt-sm"
                      style={{
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {event.description ?? "No description"}
                    </p>

                    {/* Meta Grid */}
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "var(--space-sm)",
                        marginTop: "var(--space-lg)",
                      }}
                    >
                      <div>
                        <p className="text-body-sm text-muted">Venue</p>
                        <p className="text-body-strong">
                          {event.venue ?? "TBA"}
                        </p>
                      </div>
                      <div>
                        <p className="text-body-sm text-muted">Date</p>
                        <p className="text-body-strong">
                          {event.startDate.toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                      <div>
                        <p className="text-body-sm text-muted">Tickets Sold</p>
                        <p className="text-body-strong">
                          {soldQty} / {totalQty}
                        </p>
                      </div>
                      <div>
                        <p className="text-body-sm text-muted">Tiers</p>
                        <p className="text-body-strong">
                          {event.ticketTiers.length}
                        </p>
                      </div>
                    </div>

                    {/* Manage Button */}
                    <div
                      style={{
                        marginTop: "auto",
                        paddingTop: "var(--space-lg)",
                      }}
                    >
                      <Link
                        href={`/organizer/events/${event.id}`}
                        className="btn-primary"
                        style={{
                          display: "block",
                          textAlign: "center",
                          textDecoration: "none",
                          padding: "10px var(--space-lg)",
                        }}
                      >
                        Manage Event
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}

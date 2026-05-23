import Link from "next/link";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getSessionCookieName, verifySessionToken } from "@/lib/auth";
import { Nav } from "@/components/layout/nav";
import { Footer } from "@/components/layout/footer";
import { MyTicketsContainer } from "@/components/tickets/my-tickets-container";

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
          <MyTicketsContainer
            tickets={tickets.map((t) => ({
              ...t,
              tier: {
                ...t.tier,
                price: t.tier.price.toString(),
              },
            }))}
          />
        )}
      </main>

      {/* ── Footer ── */}
      <Footer />
    </>
  );
}

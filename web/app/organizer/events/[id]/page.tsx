import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getSessionCookieName, verifySessionToken } from "@/lib/auth";
import { EventSettingsForm } from "@/components/organizer/event-settings-form";
import { EventEditForm } from "@/components/organizer/event-edit-form";
import { PublishEventButton } from "@/components/organizer/publish-event-button";
import { WithdrawButton } from "@/components/organizer/withdraw-button";
import { CouponsManager } from "@/components/organizer/coupons-manager";
import { AgendaManager } from "@/components/organizer/agenda-manager";
import { FaqManager } from "@/components/organizer/faq-manager";
import { ToastProvider } from "@/components/ui/toast";

type Props = { params: Promise<{ id: string }> };

export default async function ManageEventPage({ params }: Props) {
  const { id } = await params;
  const cookieStore = await cookies();
  const session = verifySessionToken(
    cookieStore.get(getSessionCookieName())?.value,
  );

  if (!session) {
    redirect("/");
  }

  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      organizer: { select: { id: true, walletAddress: true } },
      ticketTiers: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!event || event.organizerId !== session.sub) {
    notFound();
  }

  const totalQty = event.ticketTiers.reduce((s, t) => s + t.maxQuantity, 0);
  const soldQty = event.ticketTiers.reduce((s, t) => s + t.soldCount, 0);
  const isOnChain = !!event.contractAddress;

  // Format dates for datetime-local input (YYYY-MM-DDTHH:MM)
  function toLocalDatetimeString(date: Date): string {
    const pad = (n: number) => n.toString().padStart(2, "0");
    return (
      date.getFullYear() +
      "-" +
      pad(date.getMonth() + 1) +
      "-" +
      pad(date.getDate()) +
      "T" +
      pad(date.getHours()) +
      ":" +
      pad(date.getMinutes())
    );
  }

  return (
    <ToastProvider>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        {/* Header */}
        <header style={{ marginBottom: "var(--space-xxl)" }}>
          <Link
            href="/organizer/events"
            className="text-body-sm text-muted"
            style={{
              textDecoration: "none",
              display: "inline-block",
              marginBottom: "var(--space-md)",
            }}
          >
            ← My Events
          </Link>
          <h1 className="text-display-lg">{event.title}</h1>
          <p className="text-body-md text-muted mt-sm">
            {event.description ?? "No description"}
          </p>
        </header>

        {/* Banner */}
        {event.bannerImage && (
          <div
            className="event-card-image"
            style={{ marginBottom: "var(--space-xxl)", aspectRatio: "21/9" }}
          >
            <img src={event.bannerImage} alt={event.title} />
          </div>
        )}

        {/* Stats Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
            gap: "var(--space-lg)",
            marginBottom: "var(--space-xxl)",
          }}
        >
          {[
            { label: "Status", value: event.status },
            { label: "Chain", value: isOnChain ? "On-chain" : "Draft" },
            { label: "Venue", value: event.venue ?? "TBA" },
            {
              label: "Date",
              value: event.startDate.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              }),
            },
            { label: "Tickets Sold", value: `${soldQty} / ${totalQty}` },
            { label: "Tiers", value: String(event.ticketTiers.length) },
          ].map((item) => (
            <div
              key={item.label}
              className="card"
              style={{ padding: "var(--space-lg)" }}
            >
              <p className="text-caption-md text-muted">{item.label}</p>
              <p className="text-body-strong mt-sm">{item.value}</p>
            </div>
          ))}
        </div>

        {/* Edit Form */}
        <section style={{ marginBottom: "var(--space-xxl)" }}>
          <h2 className="text-heading-xl mb-lg">Edit Event Details</h2>
          <div className="card" style={{ padding: "var(--space-xxl)" }}>
            <EventEditForm
              eventId={event.id}
              initialData={{
                title: event.title,
                description: event.description,
                venue: event.venue,
                bannerImage: event.bannerImage,
                startDate: toLocalDatetimeString(event.startDate),
                endDate: toLocalDatetimeString(event.endDate),
                maxAttendees: event.maxAttendees,
              }}
            />
          </div>
        </section>

        {/* Contract Address */}
        {event.contractAddress && (
          <div
            className="card"
            style={{
              padding: "var(--space-lg)",
              marginBottom: "var(--space-xxl)",
            }}
          >
            <p className="text-caption-md text-muted">Contract Address</p>
            <p
              className="text-body-sm mt-sm"
              style={{ fontFamily: "monospace", wordBreak: "break-all" }}
            >
              {event.contractAddress}
            </p>
          </div>
        )}

        {/* Tiers */}
        <section style={{ marginBottom: "var(--space-xxl)" }}>
          <h2 className="text-heading-xl mb-lg">Ticket Tiers</h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: "var(--space-lg)",
            }}
          >
            {event.ticketTiers.map((tier) => (
              <div key={tier.id} className="tier-card">
                <p className="tier-card-name">{tier.name}</p>
                <p className="tier-card-price">
                  {Number(tier.price).toFixed(4)} ETH
                </p>
                <p className="tier-card-benefits">
                  {tier.benefits ?? "Standard access"}
                </p>
                <p className="tier-card-stock">
                  {tier.soldCount} / {tier.maxQuantity} sold
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Coupons */}
        <section style={{ marginBottom: "var(--space-xxl)" }}>
          <h2 className="text-heading-xl mb-lg">Coupons Management</h2>
          <CouponsManager eventId={event.id} />
        </section>

        {/* Agenda */}
        <section style={{ marginBottom: "var(--space-xxl)" }}>
          <h2 className="text-heading-xl mb-lg">Lịch trình sự kiện (Agenda)</h2>
          <AgendaManager eventId={event.id} />
        </section>

        {/* FAQs */}
        <section style={{ marginBottom: "var(--space-xxl)" }}>
          <h2 className="text-heading-xl mb-lg">Câu hỏi thường gặp (FAQs)</h2>
          <FaqManager eventId={event.id} />
        </section>

        {/* Actions */}
        <section style={{ marginBottom: "var(--space-xxl)" }}>
          <h2 className="text-heading-xl mb-lg">Actions</h2>
          <div className="card" style={{ padding: "var(--space-xl)" }}>
            {/* Publish / Withdraw */}
            {!isOnChain ? (
              <div style={{ marginBottom: "var(--space-lg)" }}>
                <p className="text-body-sm text-muted mb-md">
                  Publish this event to the blockchain to start selling tickets.
                </p>
                <PublishEventButton
                  eventId={event.id}
                  eventTitle={event.title}
                  organizerWalletAddress={event.organizer.walletAddress}
                  tiers={event.ticketTiers.map((tier) => ({
                    id: tier.id,
                    name: tier.name,
                    price: tier.price.toString(),
                    maxQuantity: tier.maxQuantity,
                  }))}
                  contractAddress={event.contractAddress}
                />
              </div>
            ) : (
              <div style={{ marginBottom: "var(--space-lg)" }}>
                <p className="text-body-sm text-muted mb-md">
                  Withdraw ticket revenue from the smart contract.
                </p>
                <WithdrawButton contractAddress={event.contractAddress!} />
              </div>
            )}

            {/* Links */}
            <div
              style={{
                display: "flex",
                gap: "var(--space-md)",
                flexWrap: "wrap",
                borderTop: "1px solid var(--color-hairline)",
                paddingTop: "var(--space-lg)",
              }}
            >
              {isOnChain && (
                <Link
                  href={`/organizer/events/${id}/attendees`}
                  className="btn-secondary"
                >
                  View Attendees
                </Link>
              )}
              <Link href={`/events/${id}`} className="btn-tertiary">
                View Public Page
              </Link>
            </div>
          </div>
        </section>

        {/* Settings */}
        {isOnChain && (
          <section>
            <h2 className="text-heading-xl mb-lg">On-chain Settings</h2>
            <EventSettingsForm
              contractAddress={event.contractAddress!}
              isEnded={event.status === "ENDED" || event.status === "CANCELLED"}
              eventId={event.id}
            />
          </section>
        )}
      </div>
    </ToastProvider>
  );
}

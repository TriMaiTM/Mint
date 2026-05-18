"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useWalletAuth } from "@/hooks/use-wallet-auth";
import { Nav } from "@/components/layout/nav";

type TierForm = {
  name: string;
  price: string;
  maxQuantity: number;
  benefits: string;
};

type CreatePayload = {
  title: string;
  description: string;
  venue: string;
  startDate: string;
  endDate: string;
  maxAttendees: number;
  bannerImage: string;
  tiers: TierForm[];
};

function createDefaultTier(index: number): TierForm {
  if (index === 0) {
    return {
      name: "General",
      price: "0.05",
      maxQuantity: 500,
      benefits: "General admission",
    };
  }

  return {
    name: "",
    price: "0.08",
    maxQuantity: 100,
    benefits: "",
  };
}

export default function OrganizerCreateEventPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoadingSession } = useWalletAuth();

  const isOrganizer = useMemo(
    () => user?.role === "ORGANIZER" || user?.role === "ADMIN",
    [user?.role],
  );

  const [form, setForm] = useState<CreatePayload>({
    title: "",
    description: "",
    venue: "",
    startDate: "",
    endDate: "",
    maxAttendees: 500,
    bannerImage: "",
    tiers: [createDefaultTier(0)],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  function updateTier(index: number, patch: Partial<TierForm>) {
    setForm((value) => ({
      ...value,
      tiers: value.tiers.map((tier, tierIndex) =>
        tierIndex === index ? { ...tier, ...patch } : tier,
      ),
    }));
  }

  function addTier() {
    setForm((value) => ({
      ...value,
      tiers: [...value.tiers, createDefaultTier(value.tiers.length)],
    }));
  }

  function removeTier(index: number) {
    setForm((value) => ({
      ...value,
      tiers: value.tiers.filter((_, tierIndex) => tierIndex !== index),
    }));
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage(null);
    setIsError(false);

    try {
      if (form.tiers.length === 0) {
        throw new Error("Add at least one ticket tier.");
      }

      const response = await fetch("/api/organizer/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });

      const payload = (await response.json()) as {
        data?: { id: string };
        error?: string;
      };

      if (!response.ok || !payload.data?.id) {
        throw new Error(payload.error ?? "Failed to create event");
      }

      setMessage("Event created successfully!");
      router.push(`/events/${payload.data.id}`);
      router.refresh();
    } catch (error) {
      const text =
        error instanceof Error ? error.message : "Failed to create event";
      setIsError(true);
      setMessage(text);
    } finally {
      setIsSubmitting(false);
    }
  }

  /* ── Shared nav ── */
  const nav = <Nav />;

  /* ── Loading state ── */
  if (isLoadingSession) {
    return (
      <>
        {nav}
        <main className="container section-gap" style={{ textAlign: "center" }}>
          <p className="text-body-md text-muted">Loading wallet session...</p>
        </main>
      </>
    );
  }

  /* ── Not authenticated ── */
  if (!isAuthenticated) {
    return (
      <>
        {nav}
        <main className="container section-gap" style={{ textAlign: "center" }}>
          <h1 className="text-heading-xl mb-md">Create Event</h1>
          <p className="text-body-md text-muted mb-lg">
            Please connect and sign in with your wallet first.
          </p>
          <Link href="/" className="btn-secondary">
            Back to Home
          </Link>
        </main>
      </>
    );
  }

  /* ── Not organizer ── */
  if (!isOrganizer) {
    return (
      <>
        {nav}
        <main className="container section-gap" style={{ textAlign: "center" }}>
          <h1 className="text-heading-xl mb-md">Access Denied</h1>
          <p className="text-body-md text-muted mb-lg">
            This account does not have organizer permission.
          </p>
          <Link href="/events" className="btn-secondary">
            Browse Events
          </Link>
        </main>
      </>
    );
  }

  /* ── Main form ── */
  return (
    <>
      {nav}

      <main className="container section-gap" style={{ maxWidth: "720px" }}>
        <header style={{ marginBottom: "var(--space-xxl)" }}>
          <h1 className="text-display-lg">Create Event</h1>
          <p className="text-body-md text-muted mt-sm">
            Define event info and ticket tiers in draft mode, then publish the
            NFT sale on-chain from My Events.
          </p>
        </header>

        <form onSubmit={onSubmit}>
          {/* ── Event Details Card ── */}
          <div
            className="card-feature"
            style={{ marginBottom: "var(--space-xl)" }}
          >
            <h2 className="text-heading-lg mb-lg">Event Details</h2>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "var(--space-lg)",
              }}
            >
              <div>
                <label
                  className="text-body-strong"
                  style={{ display: "block", marginBottom: "var(--space-xs)" }}
                  htmlFor="title"
                >
                  Event title
                </label>
                <input
                  id="title"
                  className="input-text"
                  value={form.title}
                  onChange={(e) =>
                    setForm((v) => ({ ...v, title: e.target.value }))
                  }
                  placeholder="My Awesome Event"
                  required
                />
              </div>

              <div>
                <label
                  className="text-body-strong"
                  style={{ display: "block", marginBottom: "var(--space-xs)" }}
                  htmlFor="description"
                >
                  Description
                </label>
                <textarea
                  id="description"
                  className="input-text"
                  value={form.description}
                  onChange={(e) =>
                    setForm((v) => ({ ...v, description: e.target.value }))
                  }
                  placeholder="Tell attendees what to expect..."
                  rows={4}
                  style={{ height: "auto", resize: "vertical" }}
                />
              </div>

              <div>
                <label
                  className="text-body-strong"
                  style={{ display: "block", marginBottom: "var(--space-xs)" }}
                  htmlFor="venue"
                >
                  Venue
                </label>
                <input
                  id="venue"
                  className="input-text"
                  value={form.venue}
                  onChange={(e) =>
                    setForm((v) => ({ ...v, venue: e.target.value }))
                  }
                  placeholder="Convention Center, Ho Chi Minh City"
                />
              </div>

              <div>
                <label
                  className="text-body-strong"
                  style={{ display: "block", marginBottom: "var(--space-xs)" }}
                  htmlFor="bannerImage"
                >
                  Banner Image URL{" "}
                  <span className="text-body-sm text-muted">(optional)</span>
                </label>
                <input
                  id="bannerImage"
                  className="input-text"
                  value={form.bannerImage}
                  onChange={(e) =>
                    setForm((v) => ({ ...v, bannerImage: e.target.value }))
                  }
                  placeholder="https://example.com/banner.jpg"
                />
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "var(--space-lg)",
                }}
              >
                <div>
                  <label
                    className="text-body-strong"
                    style={{
                      display: "block",
                      marginBottom: "var(--space-xs)",
                    }}
                    htmlFor="startDate"
                  >
                    Start date/time
                  </label>
                  <input
                    id="startDate"
                    type="datetime-local"
                    className="input-text"
                    value={form.startDate}
                    onChange={(e) =>
                      setForm((v) => ({ ...v, startDate: e.target.value }))
                    }
                    required
                  />
                </div>
                <div>
                  <label
                    className="text-body-strong"
                    style={{
                      display: "block",
                      marginBottom: "var(--space-xs)",
                    }}
                    htmlFor="endDate"
                  >
                    End date/time
                  </label>
                  <input
                    id="endDate"
                    type="datetime-local"
                    className="input-text"
                    value={form.endDate}
                    onChange={(e) =>
                      setForm((v) => ({ ...v, endDate: e.target.value }))
                    }
                    required
                  />
                </div>
              </div>

              <div>
                <label
                  className="text-body-strong"
                  style={{ display: "block", marginBottom: "var(--space-xs)" }}
                  htmlFor="maxAttendees"
                >
                  Max attendees
                </label>
                <input
                  id="maxAttendees"
                  type="number"
                  className="input-text"
                  min="1"
                  step="1"
                  value={form.maxAttendees}
                  onChange={(e) =>
                    setForm((v) => ({
                      ...v,
                      maxAttendees: Number(e.target.value),
                    }))
                  }
                />
              </div>
            </div>
          </div>

          {/* ── Ticket Tiers Section ── */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "var(--space-lg)",
            }}
          >
            <h2 className="text-heading-lg">Ticket Tiers</h2>
            <button className="btn-secondary" type="button" onClick={addTier}>
              + Add Tier
            </button>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "var(--space-lg)",
            }}
          >
            {form.tiers.map((tier, index) => (
              <div className="card-feature-soft" key={`tier-${index}`}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "var(--space-lg)",
                  }}
                >
                  <span className="chip">Tier {index + 1}</span>
                  {form.tiers.length > 1 ? (
                    <button
                      className="btn-tertiary"
                      type="button"
                      onClick={() => removeTier(index)}
                      style={{ color: "var(--color-error)" }}
                    >
                      Remove
                    </button>
                  ) : (
                    <span className="text-body-sm text-muted">Required</span>
                  )}
                </div>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "var(--space-md)",
                  }}
                >
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr 1fr",
                      gap: "var(--space-md)",
                    }}
                  >
                    <div>
                      <label
                        className="text-body-sm-strong"
                        style={{
                          display: "block",
                          marginBottom: "var(--space-xs)",
                        }}
                      >
                        Tier name
                      </label>
                      <input
                        className="input-text"
                        value={tier.name}
                        onChange={(e) =>
                          updateTier(index, { name: e.target.value })
                        }
                        placeholder="VIP, Early Bird..."
                        required
                      />
                    </div>
                    <div>
                      <label
                        className="text-body-sm-strong"
                        style={{
                          display: "block",
                          marginBottom: "var(--space-xs)",
                        }}
                      >
                        Price (POL)
                      </label>
                      <input
                        type="number"
                        className="input-text"
                        min="0.000001"
                        step="0.000001"
                        value={tier.price}
                        onChange={(e) =>
                          updateTier(index, { price: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div>
                      <label
                        className="text-body-sm-strong"
                        style={{
                          display: "block",
                          marginBottom: "var(--space-xs)",
                        }}
                      >
                        Quantity
                      </label>
                      <input
                        type="number"
                        className="input-text"
                        min="1"
                        step="1"
                        value={tier.maxQuantity}
                        onChange={(e) =>
                          updateTier(index, {
                            maxQuantity: Number(e.target.value),
                          })
                        }
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      className="text-body-sm-strong"
                      style={{
                        display: "block",
                        marginBottom: "var(--space-xs)",
                      }}
                    >
                      Benefits
                    </label>
                    <input
                      className="input-text"
                      value={tier.benefits}
                      onChange={(e) =>
                        updateTier(index, { benefits: e.target.value })
                      }
                      placeholder="Backstage access, free drinks..."
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ── Submit ── */}
          <div style={{ marginTop: "var(--space-xxl)" }}>
            <button
              className="btn-primary"
              type="submit"
              disabled={isSubmitting}
              style={{ width: "100%", height: "48px" }}
            >
              {isSubmitting ? "Creating..." : "Create Event"}
            </button>

            {message && (
              <p
                className="text-body-md mt-md"
                style={{
                  textAlign: "center",
                  color: isError
                    ? "var(--color-error)"
                    : "var(--color-success-deep)",
                }}
              >
                {message}
              </p>
            )}
          </div>
        </form>
      </main>
    </>
  );
}

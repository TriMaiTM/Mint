"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/toast";

type AgendaItem = {
  id: string;
  time: string;
  title: string;
  description: string | null;
  speaker: string | null;
};

type AgendaManagerProps = {
  eventId: string;
};

export function AgendaManager({ eventId }: AgendaManagerProps) {
  const { toast } = useToast();
  const [agenda, setAgenda] = useState<AgendaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [time, setTime] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [speaker, setSpeaker] = useState("");

  useEffect(() => {
    fetchAgenda();
  }, [eventId]);

  async function fetchAgenda() {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/organizer/events/${eventId}/agenda`);
      const payload = await res.json();
      if (res.ok && payload.data) {
        setAgenda(payload.data);
      } else {
        toast(payload.error ?? "Error loading agenda", "error");
      }
    } catch (err) {
      console.error(err);
      toast("Network error while loading agenda", "error");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!time.trim() || !title.trim()) {
      toast("Please enter time and title", "error");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch(`/api/organizer/events/${eventId}/agenda`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          time: time.trim(),
          title: title.trim(),
          description: description.trim() || null,
          speaker: speaker.trim() || null,
        }),
      });

      const payload = await res.json();
      if (res.ok && payload.data) {
        toast("Agenda item added successfully!", "success");
        setAgenda([...agenda, payload.data]);
        // Reset form
        setTime("");
        setTitle("");
        setDescription("");
        setSpeaker("");
      } else {
        toast(payload.error ?? "Error creating agenda item", "error");
      }
    } catch (err) {
      console.error(err);
      toast("Network error while adding agenda item", "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(agendaId: string) {
    if (!confirm("Are you sure you want to delete this agenda item?")) return;

    try {
      const res = await fetch(`/api/organizer/events/${eventId}/agenda?agendaId=${agendaId}`, {
        method: "DELETE",
      });

      const payload = await res.json();
      if (res.ok) {
        toast("Agenda item deleted!", "success");
        setAgenda(agenda.filter((item) => item.id !== agendaId));
      } else {
        toast(payload.error ?? "Error deleting agenda item", "error");
      }
    } catch (err) {
      console.error(err);
      toast("Network error while deleting agenda item", "error");
    }
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "var(--space-xxl)" }}>
      {/* Creation Form */}
      <div className="card" style={{ padding: "var(--space-xl)" }}>
        <h3 className="text-heading-lg mb-md">Add Event Agenda</h3>
        <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: "var(--space-md)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "var(--space-md)" }}>
            <div>
              <label className="text-caption-md text-muted" style={{ display: "block", marginBottom: "var(--space-xs)" }}>
                Time Slot (e.g. "09:00 - 10:30" or "09:00 AM")
              </label>
              <input
                type="text"
                placeholder="09:00 AM - 10:30 AM"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                style={{
                  width: "100%",
                  padding: "var(--space-sm) var(--space-md)",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--color-hairline)",
                  background: "var(--color-canvas)",
                  color: "inherit",
                }}
                required
              />
            </div>

            <div>
              <label className="text-caption-md text-muted" style={{ display: "block", marginBottom: "var(--space-xs)" }}>
                Activity Title
              </label>
              <input
                type="text"
                placeholder="Opening & Check-in"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={{
                  width: "100%",
                  padding: "var(--space-sm) var(--space-md)",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--color-hairline)",
                  background: "var(--color-canvas)",
                  color: "inherit",
                }}
                required
              />
            </div>

            <div>
              <label className="text-caption-md text-muted" style={{ display: "block", marginBottom: "var(--space-xs)" }}>
                Speaker / Host (Optional)
              </label>
              <input
                type="text"
                placeholder="CEO Tri Mai"
                value={speaker}
                onChange={(e) => setSpeaker(e.target.value)}
                style={{
                  width: "100%",
                  padding: "var(--space-sm) var(--space-md)",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--color-hairline)",
                  background: "var(--color-canvas)",
                  color: "inherit",
                }}
              />
            </div>
          </div>

          <div>
            <label className="text-caption-md text-muted" style={{ display: "block", marginBottom: "var(--space-xs)" }}>
              Detailed Description (Optional)
            </label>
            <textarea
              placeholder="Welcome guests, check NFT tickets, distribute event materials, and assist with seating..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              style={{
                width: "100%",
                padding: "var(--space-sm) var(--space-md)",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--color-hairline)",
                background: "var(--color-canvas)",
                color: "inherit",
                resize: "vertical",
              }}
            />
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={isSubmitting}
            style={{ alignSelf: "flex-start", marginTop: "var(--space-xs)" }}
          >
            {isSubmitting ? "Adding..." : "➕ Add Agenda Item"}
          </button>
        </form>
      </div>

      {/* List */}
      <div className="card" style={{ padding: "var(--space-xl)" }}>
        <h3 className="text-heading-lg mb-md">Current Agenda</h3>

        {isLoading ? (
          <p className="text-body-md text-muted">Loading agenda...</p>
        ) : agenda.length === 0 ? (
          <p className="text-body-md text-muted">No agenda items have been set up for this event yet.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-md)" }}>
            {agenda.map((item) => (
              <div
                key={item.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  padding: "var(--space-md)",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--color-hairline-soft)",
                  background: "var(--color-surface-soft)",
                  gap: "var(--space-md)"
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--space-sm)", flexWrap: "wrap" }}>
                    <span className="text-body-sm-strong" style={{ color: "var(--color-primary)", fontWeight: "600" }}>{item.time}</span>
                    <span className="text-body-strong">{item.title}</span>
                    {item.speaker && (
                      <span className="chip" style={{ fontSize: "11px", padding: "2px 8px" }}>🎙️ Speaker: {item.speaker}</span>
                    )}
                  </div>
                  {item.description && (
                    <p className="text-body-sm text-muted mt-xs" style={{ whiteSpace: "pre-line" }}>
                      {item.description}
                    </p>
                  )}
                </div>
                <button
                  className="btn-tertiary"
                  onClick={() => handleDelete(item.id)}
                  style={{
                    color: "var(--color-error-deep)",
                    padding: "var(--space-xs)",
                    fontSize: "13px",
                  }}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

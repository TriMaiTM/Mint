"use client";

import { useState, FormEvent } from "react";
import { useToast } from "@/components/ui/toast";

type EventEditFormProps = {
  eventId: string;
  initialData: {
    title: string;
    description: string | null;
    venue: string | null;
    bannerImage: string | null;
    startDate: string;
    endDate: string;
    maxAttendees: number | null;
  };
};

export function EventEditForm({ eventId, initialData }: EventEditFormProps) {
  const { toast } = useToast();

  const [title, setTitle] = useState(initialData.title);
  const [description, setDescription] = useState(initialData.description ?? "");
  const [venue, setVenue] = useState(initialData.venue ?? "");
  const [bannerImage, setBannerImage] = useState(initialData.bannerImage ?? "");
  const [startDate, setStartDate] = useState(initialData.startDate);
  const [endDate, setEndDate] = useState(initialData.endDate);
  const [maxAttendees, setMaxAttendees] = useState(
    initialData.maxAttendees?.toString() ?? "",
  );
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setIsSaving(true);

    try {
      const response = await fetch(`/api/events/${eventId}/edit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title,
          description: description || undefined,
          venue: venue || undefined,
          bannerImage: bannerImage || undefined,
          startDate,
          endDate,
          maxAttendees: maxAttendees ? parseInt(maxAttendees, 10) : null,
        }),
      });

      const payload = (await response.json()) as {
        data?: unknown;
        error?: string;
      };

      if (!response.ok || !payload.data) {
        throw new Error(payload.error ?? "Failed to save changes");
      }

      toast("Event details updated successfully!", "success");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to save changes";
      toast(message, "error");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-lg)",
        }}
      >
        {/* Title */}
        <div>
          <label
            className="text-body-sm-strong"
            style={{
              display: "block",
              marginBottom: "var(--space-sm)",
              color: "var(--color-ink)",
            }}
            htmlFor="edit-title"
          >
            Event Title
          </label>
          <input
            id="edit-title"
            type="text"
            className="input-text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter event title"
            required
          />
        </div>

        {/* Description */}
        <div>
          <label
            className="text-body-sm-strong"
            style={{
              display: "block",
              marginBottom: "var(--space-sm)",
              color: "var(--color-ink)",
            }}
            htmlFor="edit-description"
          >
            Description
          </label>
          <textarea
            id="edit-description"
            className="input-text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe your event"
            rows={4}
            style={{ resize: "vertical", minHeight: "100px" }}
          />
        </div>

        {/* Venue */}
        <div>
          <label
            className="text-body-sm-strong"
            style={{
              display: "block",
              marginBottom: "var(--space-sm)",
              color: "var(--color-ink)",
            }}
            htmlFor="edit-venue"
          >
            Venue
          </label>
          <input
            id="edit-venue"
            type="text"
            className="input-text"
            value={venue}
            onChange={(e) => setVenue(e.target.value)}
            placeholder="Event location"
          />
        </div>

        {/* Banner Image URL */}
        <div>
          <label
            className="text-body-sm-strong"
            style={{
              display: "block",
              marginBottom: "var(--space-sm)",
              color: "var(--color-ink)",
            }}
            htmlFor="edit-banner"
          >
            Banner Image URL
          </label>
          <input
            id="edit-banner"
            type="url"
            className="input-text"
            value={bannerImage}
            onChange={(e) => setBannerImage(e.target.value)}
            placeholder="https://example.com/banner.jpg"
          />
        </div>

        {/* Date row */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "var(--space-lg)",
          }}
        >
          <div>
            <label
              className="text-body-sm-strong"
              style={{
                display: "block",
                marginBottom: "var(--space-sm)",
                color: "var(--color-ink)",
              }}
              htmlFor="edit-start"
            >
              Start Date
            </label>
            <input
              id="edit-start"
              type="datetime-local"
              className="input-text"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </div>
          <div>
            <label
              className="text-body-sm-strong"
              style={{
                display: "block",
                marginBottom: "var(--space-sm)",
                color: "var(--color-ink)",
              }}
              htmlFor="edit-end"
            >
              End Date
            </label>
            <input
              id="edit-end"
              type="datetime-local"
              className="input-text"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
            />
          </div>
        </div>

        {/* Max Attendees */}
        <div>
          <label
            className="text-body-sm-strong"
            style={{
              display: "block",
              marginBottom: "var(--space-sm)",
              color: "var(--color-ink)",
            }}
            htmlFor="edit-maxattendees"
          >
            Max Attendees
          </label>
          <input
            id="edit-maxattendees"
            type="number"
            className="input-text"
            value={maxAttendees}
            onChange={(e) => setMaxAttendees(e.target.value)}
            placeholder="Leave empty for unlimited"
            min={1}
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="btn-primary"
          disabled={isSaving}
          style={{ alignSelf: "flex-start" }}
        >
          {isSaving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </form>
  );
}

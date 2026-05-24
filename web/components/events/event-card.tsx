import Link from "next/link";

type EventCardProps = {
  id: string;
  title: string;
  description: string | null;
  venue: string | null;
  startDate: Date;
  status: "DRAFT" | "PUBLISHED" | "ONGOING" | "ENDED" | "CANCELLED";
  chainId: string | null;
  bannerImage?: string | null;
  ticketSummary: {
    minPrice: number | null;
    maxPrice: number | null;
    totalQuantity: number;
  };
};

function formatDate(value: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

function formatPrice(value: number | null): string {
  if (value === null) {
    return "TBA";
  }
  return `${value.toFixed(3)} POL`;
}

export function EventCard({
  id,
  title,
  description,
  venue,
  startDate,
  status,
  chainId,
  bannerImage,
  ticketSummary,
}: EventCardProps) {
  return (
    <article className="card">
      {bannerImage && (
        <div
          style={{
            width: "100%",
            height: "160px",
            overflow: "hidden",
            borderRadius: "var(--radius-md)",
            marginBottom: "var(--space-md)",
          }}
        >
          <img
            src={bannerImage}
            alt={title}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </div>
      )}
      <div
        style={{
          display: "flex",
          gap: "var(--space-xs)",
          flexWrap: "wrap",
          marginBottom: "var(--space-sm)",
        }}
      >
        <span className="chip">{status}</span>
        <span className="chip">{chainId ?? "Unknown chain"}</span>
      </div>

      <h3 className="text-heading-md">{title}</h3>
      <p className="text-body-sm text-muted">
        {description ??
          "No description yet. Organizer will publish details soon."}
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "var(--space-sm)",
          marginTop: "var(--space-sm)",
        }}
      >
        <div>
          <p className="text-caption-md text-muted">Venue</p>
          <p className="text-body-sm">{venue ?? "TBA"}</p>
        </div>
        <div>
          <p className="text-caption-md text-muted">Start</p>
          <p className="text-body-sm">{formatDate(startDate)}</p>
        </div>
        <div>
          <p className="text-caption-md text-muted">Tickets</p>
          <p className="text-body-sm">{ticketSummary.totalQuantity}</p>
        </div>
        <div>
          <p className="text-caption-md text-muted">Price Range</p>
          <p className="text-body-sm">
            {formatPrice(ticketSummary.minPrice)} -{" "}
            {formatPrice(ticketSummary.maxPrice)}
          </p>
        </div>
      </div>

      <Link
        href={`/events/${id}`}
        className="btn-primary"
        style={{ marginTop: "var(--space-md)" }}
      >
        View Tickets
      </Link>
    </article>
  );
}

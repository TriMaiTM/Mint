export function SkeletonCard() {
  return (
    <div
      style={{
        background: "var(--color-surface-card)",
        borderRadius: "var(--radius-md)",
        padding: "var(--space-xl)",
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-md)",
      }}
    >
      {/* Image placeholder */}
      <div
        className="skeleton"
        style={{
          width: "100%",
          height: "180px",
          borderRadius: "var(--radius-sm)",
        }}
      />
      {/* Title placeholder */}
      <div
        className="skeleton"
        style={{ width: "75%", height: "20px", borderRadius: "var(--radius-sm)" }}
      />
      {/* Subtitle placeholder */}
      <div
        className="skeleton"
        style={{ width: "50%", height: "16px", borderRadius: "var(--radius-sm)" }}
      />
      {/* Body lines */}
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-sm)" }}>
        <div
          className="skeleton"
          style={{ width: "100%", height: "14px", borderRadius: "var(--radius-sm)" }}
        />
        <div
          className="skeleton"
          style={{ width: "90%", height: "14px", borderRadius: "var(--radius-sm)" }}
        />
        <div
          className="skeleton"
          style={{ width: "60%", height: "14px", borderRadius: "var(--radius-sm)" }}
        />
      </div>
    </div>
  );
}

export function SkeletonText({ width = "100%" }: { width?: string }) {
  return (
    <div
      className="skeleton"
      style={{
        width,
        height: "14px",
        borderRadius: "var(--radius-sm)",
      }}
    />
  );
}

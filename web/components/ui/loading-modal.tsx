"use client";

type LoadingModalProps = {
  show: boolean;
  message: string;
};

export function LoadingModal({ show, message }: LoadingModalProps) {
  if (!show) return null;

  return (
    <div className="modal-overlay">
      <div
        className="modal-card"
        style={{ textAlign: "center", maxWidth: "360px" }}
      >
        <div className="spinner" />
        <p
          className="text-body-md"
          style={{
            marginTop: "var(--space-lg)",
            color: "var(--color-ink)",
          }}
        >
          {message}
        </p>
      </div>
    </div>
  );
}

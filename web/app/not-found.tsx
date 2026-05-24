import Link from "next/link";
import { Nav } from "@/components/layout/nav";
import { Footer } from "@/components/layout/footer";

export default function NotFound() {
  return (
    <>
      <Nav />
      <main
        className="container"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "60vh",
          textAlign: "center",
          padding: "var(--space-section) var(--space-lg)",
        }}
      >
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: "var(--radius-full)",
            background: "var(--color-surface-card)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "var(--space-xl)",
            fontSize: 36,
          }}
          aria-hidden="true"
        >
          🔍
        </div>
        <h1
          className="text-heading-xl"
          style={{ color: "var(--color-ink)", marginBottom: "var(--space-md)" }}
        >
          Page Not Found
        </h1>
        <p
          className="text-body-md"
          style={{
            color: "var(--color-body)",
            maxWidth: 440,
            marginBottom: "var(--space-xxl)",
          }}
        >
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div style={{ display: "flex", gap: "var(--space-md)" }}>
          <Link
            href="/"
            className="btn-primary"
            style={{ textDecoration: "none" }}
          >
            Go Home
          </Link>
          <Link
            href="/events"
            className="btn-secondary"
            style={{ textDecoration: "none" }}
          >
            Browse Events
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}

import { cookies } from "next/headers";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSessionCookieName, verifySessionToken } from "@/lib/auth";
import { Nav } from "@/components/layout/nav";
import { AdminSidebar } from "@/components/admin/sidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const session = verifySessionToken(
    cookieStore.get(getSessionCookieName())?.value
  );

  if (!session) {
    return (
      <>
        <Nav />
        <main
          className="container section-gap"
          style={{
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "60vh",
          }}
        >
          <div
            className="card-feature-soft"
            style={{
              maxWidth: "500px",
              padding: "var(--space-xxl)",
              background: "var(--color-surface-soft)",
              borderRadius: "var(--radius-lg)",
              border: "1px solid var(--color-hairline)",
            }}
          >
            <h1 className="text-heading-xl mb-md">Admin Portal</h1>
            <p className="text-body-md text-muted mb-lg">
              Please sign in with your administrator wallet to access this panel.
            </p>
            <Link href="/" className="btn-secondary" style={{ display: "inline-block" }}>
              Back to Home
            </Link>
          </div>
        </main>
      </>
    );
  }

  const me = await prisma.user.findUnique({
    where: { id: session.sub },
    select: {
      id: true,
      role: true,
      walletAddress: true,
    },
  });

  if (!me || me.role !== "ADMIN") {
    return (
      <>
        <Nav />
        <main
          className="container section-gap"
          style={{
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "60vh",
          }}
        >
          <div
            className="card-feature-soft"
            style={{
              maxWidth: "500px",
              padding: "var(--space-xxl)",
              background: "var(--color-surface-soft)",
              borderRadius: "var(--radius-lg)",
              border: "1px solid var(--color-hairline)",
            }}
          >
            <h1 className="text-heading-xl mb-md" style={{ color: "var(--color-error)" }}>
              Access Denied
            </h1>
            <p className="text-body-md text-muted mb-lg">
              This account does not have administrator permissions.
            </p>
            <div style={{ display: "flex", gap: "var(--space-md)", justifyContent: "center" }}>
              <Link href="/events" className="btn-primary" style={{ display: "inline-block" }}>
                Browse Events
              </Link>
              <Link href="/" className="btn-secondary" style={{ display: "inline-block" }}>
                Back to Home
              </Link>
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Nav />
      <div style={{ display: "flex", flex: 1 }}>
        <AdminSidebar />
        <main
          style={{
            flex: 1,
            padding: "var(--space-xl) var(--space-xxl)",
            background: "var(--color-canvas)",
            overflowY: "auto",
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}

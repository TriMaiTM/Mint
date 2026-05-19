"use client";

import { useState } from "react";

interface EmailSettingsProps {
  currentEmail?: string | null;
  onEmailUpdated?: (email: string) => void;
}

export function EmailSettings({ currentEmail, onEmailUpdated }: EmailSettingsProps) {
  const [email, setEmail] = useState(currentEmail || "");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSave = async () => {
    // Validate email
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email || null }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update email");
      }

      setSuccess(true);
      setIsEditing(false);
      onEmailUpdated?.(email);

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="card"
      style={{
        padding: "var(--space-xl)",
        marginTop: "var(--space-xl)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "var(--space-md)",
        }}
      >
        <div>
          <h3 className="text-heading-md">📧 Email Notifications</h3>
          <p className="text-body-sm text-muted mt-xs">
            Receive ticket confirmations and event reminders
          </p>
        </div>
        {!isEditing && (
          <button
            className="btn-secondary"
            onClick={() => setIsEditing(true)}
            style={{ fontSize: "14px" }}
          >
            {currentEmail ? "Edit" : "Add Email"}
          </button>
        )}
      </div>

      {isEditing ? (
        <div>
          <div
            style={{
              display: "flex",
              gap: "var(--space-md)",
              alignItems: "flex-start",
            }}
          >
            <div style={{ flex: 1 }}>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError(null);
                }}
                placeholder="your@email.com"
                style={{
                  width: "100%",
                  padding: "var(--space-md)",
                  borderRadius: "var(--radius-md)",
                  border: error
                    ? "2px solid #ef4444"
                    : "1px solid var(--color-border)",
                  fontSize: "16px",
                  fontFamily: "inherit",
                  backgroundColor: "var(--color-canvas)",
                  color: "var(--color-text)",
                }}
              />
              {error && (
                <p
                  className="text-body-sm"
                  style={{ color: "#ef4444", marginTop: "var(--space-xs)" }}
                >
                  {error}
                </p>
              )}
            </div>
            <div style={{ display: "flex", gap: "var(--space-sm)" }}>
              <button
                className="btn-primary"
                onClick={handleSave}
                disabled={isSaving}
                style={{ opacity: isSaving ? 0.7 : 1 }}
              >
                {isSaving ? "Saving..." : "Save"}
              </button>
              <button
                className="btn-secondary"
                onClick={() => {
                  setIsEditing(false);
                  setEmail(currentEmail || "");
                  setError(null);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
          <p className="text-body-sm text-muted mt-md">
            We'll send ticket confirmations and event reminders to this email.
            Your email is private and won't be shared.
          </p>
        </div>
      ) : (
        <div>
          {currentEmail ? (
            <p className="text-body-md" style={{ fontWeight: 500 }}>
              {currentEmail}
            </p>
          ) : (
            <p className="text-body-md text-muted">
              No email added yet. Add one to receive notifications.
            </p>
          )}
        </div>
      )}

      {success && (
        <div
          style={{
            marginTop: "var(--space-md)",
            padding: "var(--space-md)",
            backgroundColor: "#ecfdf5",
            borderRadius: "var(--radius-md)",
            color: "#10b981",
          }}
        >
          ✓ Email updated successfully!
        </div>
      )}
    </div>
  );
}

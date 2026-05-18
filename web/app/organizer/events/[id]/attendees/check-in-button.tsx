"use client";

import { useState } from "react";
import { useToast } from "@/components/ui/toast";

type CheckInButtonProps = {
  ticketId: string;
  eventId: string;
  tokenId: number;
  isUsed: boolean;
};

export function CheckInButton({
  ticketId,
  eventId,
  tokenId,
  isUsed,
}: CheckInButtonProps) {
  const [loading, setLoading] = useState(false);
  const [checkedIn, setCheckedIn] = useState(isUsed);
  const { toast } = useToast();

  if (checkedIn) {
    return (
      <span
        className="chip chip-active"
        style={{ cursor: "default", userSelect: "none" }}
      >
        ✓ Checked in
      </span>
    );
  }

  async function handleCheckIn() {
    setLoading(true);
    try {
      const res = await fetch("/api/tickets/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketId, eventId, tokenId }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast(data.error || "Check-in failed", "error");
        return;
      }

      setCheckedIn(true);
      toast(
        data.warning
          ? `Checked in — ${data.warning}`
          : "Attendee checked in successfully",
        data.warning ? "info" : "success",
      );
    } catch {
      toast("Network error — please try again", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      className="btn-primary"
      onClick={handleCheckIn}
      disabled={loading}
      style={{ minWidth: "110px" }}
    >
      {loading ? "Checking in…" : "Check In"}
    </button>
  );
}

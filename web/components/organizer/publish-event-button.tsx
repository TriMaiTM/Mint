"use client";

import { useState } from "react";
import { LoadingModal } from "@/components/ui/loading-modal";

type PublishTierInput = {
  id: string;
  name: string;
  price: string;
  maxQuantity: number;
};

type PublishEventButtonProps = {
  eventId: string;
  eventTitle: string;
  organizerWalletAddress: string;
  tiers: PublishTierInput[];
  contractAddress: string | null;
};

export function PublishEventButton({
  eventId,
  eventTitle,
  organizerWalletAddress,
  tiers,
  contractAddress,
}: PublishEventButtonProps) {
  const [isPublishing, setIsPublishing] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handlePublish() {
    setIsPublishing(true);
    setLoadingMessage(null);
    setError(null);

    try {
      if (contractAddress) {
        throw new Error("Sự kiện đã được đưa lên blockchain rồi.");
      }
      if (tiers.length === 0) {
        throw new Error("Vui lòng thêm ít nhất một hạng vé trước khi publish.");
      }

      setLoadingMessage("Publishing to blockchain...");

      const response = await fetch("/api/organizer/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          eventId,
          tiers: tiers.map((tier, index) => ({
            tierId: tier.id,
            onchainTierId: index,
            price: tier.price,
            maxQuantity: tier.maxQuantity,
          })),
        }),
      });

      const payload = (await response.json()) as {
        data?: { contractAddress: string; txHash: string };
        error?: string;
      };

      if (!response.ok || !payload.data) {
        throw new Error(payload.error ?? "Publish failed");
      }

      setLoadingMessage(null);

      // Reload to show updated state
      setTimeout(() => window.location.reload(), 1500);
    } catch (error) {
      const raw =
        error instanceof Error
          ? error.message
          : "Failed to publish event. Please try again.";
      setLoadingMessage(null);
      setError(raw);
    } finally {
      setIsPublishing(false);
    }
  }

  return (
    <div>
      <button
        className="btn-primary"
        onClick={handlePublish}
        type="button"
        disabled={isPublishing || !!contractAddress}
        style={{ width: "100%" }}
      >
        {isPublishing
          ? "Publishing..."
          : contractAddress
            ? "Published"
            : "Publish On-chain"}
      </button>

      {error ? (
        <p
          style={{
            marginTop: "var(--space-sm)",
            color: "var(--color-error)",
          }}
        >
          {error}
        </p>
      ) : null}

      <LoadingModal show={!!loadingMessage} message={loadingMessage ?? ""} />
    </div>
  );
}

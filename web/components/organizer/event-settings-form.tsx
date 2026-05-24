"use client";

import { useState } from "react";
import {
  useWalletClient,
  usePublicClient,
  useAccount,
  useReadContract,
} from "wagmi";
import { useRouter } from "next/navigation";
import { eventTicketNftAbi } from "@/lib/contracts";

type EventSettingsFormProps = {
  contractAddress: string;
  isEnded: boolean;
  eventId?: string;
};

export function EventSettingsForm({
  contractAddress,
  isEnded: isEndedProp,
  eventId,
}: EventSettingsFormProps) {
  const router = useRouter();
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  const { data: isTransferable, refetch: refetchTransferable } =
    useReadContract({
      address: contractAddress as `0x${string}`,
      abi: eventTicketNftAbi,
      functionName: "transferable",
    });

  async function handleEndEvent() {
    if (!walletClient || !publicClient || !address) return;
    setIsSubmitting(true);
    setMessage(null);
    setIsError(false);

    try {
      if (
        !confirm(
          "Are you sure you want to end this event? This action cannot be undone and will prevent further ticket transfers and sales.",
        )
      ) {
        setIsSubmitting(false);
        return;
      }

      // 1. Call Smart Contract setEventEnded(true)
      const hash = await walletClient.writeContract({
        address: contractAddress as `0x${string}`,
        abi: eventTicketNftAbi,
        functionName: "setEventEnded",
        args: [true],
        account: address,
      });

      setMessage("Ending event on-chain... Please wait.");
      await publicClient.waitForTransactionReceipt({ hash });

      // 2. Sync Database
      const res = await fetch(`/api/events/${eventId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ENDED" }),
      });

      if (!res.ok) {
        throw new Error("Failed to sync database status");
      }

      setMessage("Event has been permanently ended.");
      router.refresh();
    } catch (error) {
      setIsError(true);
      setMessage(
        error instanceof Error ? error.message : "Failed to end event",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleToggleTransfers(enabled: boolean) {
    if (!walletClient || !publicClient || !address) return;
    setIsSubmitting(true);
    setMessage(null);
    setIsError(false);

    try {
      const confirmMsg = enabled
        ? "Enable secondary market transfers?"
        : "Disable secondary market transfers? Users will not be able to sell or transfer tickets.";
      if (!confirm(confirmMsg)) {
        setIsSubmitting(false);
        return;
      }

      const hash = await walletClient.writeContract({
        address: contractAddress as `0x${string}`,
        abi: eventTicketNftAbi,
        functionName: "setTransferable",
        args: [enabled],
        account: address,
      });

      setMessage("Updating transferability on-chain...");
      await publicClient.waitForTransactionReceipt({ hash });

      setMessage(`Transfers are now ${enabled ? "Enabled" : "Disabled"}.`);
      refetchTransferable();
    } catch (error) {
      setIsError(true);
      setMessage(
        error instanceof Error ? error.message : "Failed to toggle transfers",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const isEnded = isEndedProp;

  return (
    <div className="card">
      <h3 className="text-heading-md">Event Settings</h3>
      <p className="text-body-sm text-muted">
        Manage on-chain settings for this event.
      </p>

      {message && (
        <p
          style={{
            marginBottom: "var(--space-md)",
            color: isError ? "var(--color-error)" : "var(--color-success-deep)",
          }}
        >
          {message}
        </p>
      )}

      <div
        style={{
          display: "flex",
          gap: "var(--space-md)",
          flexWrap: "wrap",
          marginTop: "var(--space-lg)",
        }}
      >
        <button
          className="btn-secondary"
          onClick={() => handleToggleTransfers(!isTransferable)}
          disabled={isSubmitting || isEnded || isTransferable === undefined}
        >
          {isTransferable === undefined
            ? "Loading..."
            : isTransferable
              ? "Disable Transfers"
              : "Enable Transfers"}
        </button>

        <button
          className="btn-primary"
          onClick={handleEndEvent}
          disabled={isSubmitting || isEnded}
        >
          {isEnded ? "Event Ended" : "End Event Permanently"}
        </button>
      </div>
    </div>
  );
}

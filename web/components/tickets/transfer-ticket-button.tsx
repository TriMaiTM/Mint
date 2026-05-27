"use client";

import { useState } from "react";
import { encodeFunctionData } from "viem";
import { useAccount, usePublicClient } from "wagmi";
import { eventTicketNftAbi } from "@/lib/contracts";
import { LoadingModal } from "@/components/ui/loading-modal";

type TransferTicketButtonProps = {
  ticketId: string;
  tokenId: number;
  contractAddress: string;
  tierName: string;
};

export function TransferTicketButton({
  ticketId,
  tokenId,
  contractAddress,
  tierName,
}: TransferTicketButtonProps) {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const [isTransferring, setIsTransferring] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [toAddress, setToAddress] = useState("");

  const isValidAddress = /^0x[a-fA-F0-9]{40}$/.test(toAddress.trim());

  function openModal() {
    setToAddress("");
    setError(null);
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setError(null);
  }

  async function handleConfirm() {
    if (!address || !publicClient) {
      setError("Please connect your wallet.");
      return;
    }
    const cleanToAddress = toAddress.trim();
    if (!isValidAddress) {
      setError("Invalid recipient wallet address. Please enter a valid EVM address (0x...).");
      return;
    }
    if (cleanToAddress.toLowerCase() === address.toLowerCase()) {
      setError("You cannot gift a ticket to yourself.");
      return;
    }

    setIsTransferring(true);
    setError(null);
    setLoadingMessage("Sending ticket transfer transaction...");

    try {
      const ethereum = (window as any).ethereum;
      if (!ethereum) throw new Error("MetaMask not found");

      const transferData = encodeFunctionData({
        abi: eventTicketNftAbi,
        functionName: "safeTransferFrom",
        args: [
          address as `0x${string}`,
          cleanToAddress as `0x${string}`,
          BigInt(tokenId),
        ],
      });

      const txHash = await ethereum.request({
        method: "eth_sendTransaction",
        params: [
          {
            from: address,
            to: contractAddress,
            data: transferData,
            gas: "0x493E0", // ~300k gas limit
          },
        ],
      });

      setLoadingMessage("Waiting for blockchain transaction confirmation...");
      await publicClient.waitForTransactionReceipt({ hash: txHash });

      setLoadingMessage("Syncing ticket information...");
      const res = await fetch("/api/tickets/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ticketId,
          toAddress: cleanToAddress,
          txHash,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update ticket transfer details in the database");
      }

      setLoadingMessage(null);
      closeModal();
      window.location.reload();
    } catch (err) {
      console.error("Transfer ticket error:", err);
      setError(err instanceof Error ? err.message : "Ticket transfer failed");
    } finally {
      setIsTransferring(false);
      setLoadingMessage(null);
    }
  }

  return (
    <>
      <div>
        <button
          className="btn-secondary"
          onClick={openModal}
          style={{ width: "100%" }}
        >
          Gift Ticket
        </button>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "400px" }}
          >
            {/* Header */}
            <div style={{ marginBottom: "var(--space-xl)" }}>
              <h3
                className="text-heading-lg"
                style={{ color: "var(--color-ink)" }}
              >
                Gift NFT Ticket
              </h3>
              <p
                className="text-body-sm"
                style={{
                  color: "var(--color-mute)",
                  marginTop: "var(--space-xxs)",
                }}
              >
                {tierName} · Token #{tokenId}
              </p>
            </div>

            {/* Warning alert */}
            <div
              style={{
                background: "rgba(224, 86, 36, 0.08)",
                borderLeft: "4px solid var(--color-accent-orange, #e05624)",
                borderRadius: "var(--radius-sm)",
                padding: "var(--space-md)",
                marginBottom: "var(--space-xl)",
              }}
            >
              <p
                className="text-body-sm"
                style={{ color: "var(--color-accent-orange, #e05624)", fontWeight: "bold" }}
              >
                Important Warning:
              </p>
              <p
                className="text-caption-md text-muted mt-xxs"
                style={{ lineHeight: "1.4" }}
              >
                This action will permanently transfer this ticket NFT to another wallet address on the blockchain. You will no longer own this ticket, and this action cannot be undone.
              </p>
            </div>

            {/* Input address */}
            <label
              style={{ display: "block", marginBottom: "var(--space-lg)" }}
            >
              <span
                className="text-body-sm-strong"
                style={{ display: "block", marginBottom: "var(--space-sm)" }}
              >
                Recipient Wallet Address (0x...)
              </span>
              <input
                type="text"
                value={toAddress}
                onChange={(e) => setToAddress(e.target.value)}
                placeholder="0x..."
                className="input-text"
              />
              {toAddress && !isValidAddress && (
                <span
                  className="text-caption-md"
                  style={{
                    color: "var(--color-error)",
                    marginTop: "var(--space-xxs)",
                    display: "block",
                  }}
                >
                  Recipient address must start with 0x and be exactly 42 characters
                </span>
              )}
            </label>

            {/* Error message */}
            {error && (
              <div
                style={{
                  background: "rgba(158,10,10,0.08)",
                  borderRadius: "var(--radius-sm)",
                  padding: "var(--space-md)",
                  marginBottom: "var(--space-lg)",
                }}
              >
                <span
                  className="text-body-sm"
                  style={{ color: "var(--color-error)" }}
                >
                  {error}
                </span>
              </div>
            )}

            {/* Actions */}
            <div style={{ display: "flex", gap: "var(--space-md)" }}>
              <button
                className="btn-secondary"
                onClick={closeModal}
                disabled={isTransferring}
                style={{ flex: 1 }}
              >
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={handleConfirm}
                disabled={isTransferring || !isValidAddress}
                style={{ flex: 1 }}
              >
                {isTransferring ? "Processing..." : "Confirm Gift"}
              </button>
            </div>
          </div>
        </div>
      )}

      <LoadingModal show={!!loadingMessage} message={loadingMessage ?? ""} />
    </>
  );
}

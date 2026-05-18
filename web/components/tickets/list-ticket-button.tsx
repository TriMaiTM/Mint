"use client";

import { useState } from "react";
import { encodeFunctionData, parseEther } from "viem";
import { useAccount, usePublicClient } from "wagmi";
import { eventTicketNftAbi, TicketMarketplaceAbi } from "@/lib/contracts";

type ListTicketButtonProps = {
  ticketId: string;
  tokenId: number;
  contractAddress: string;
  tierPrice: string;
  tierName: string;
};

const MAX_MULTIPLIER = 3;

export function ListTicketButton({
  ticketId,
  tokenId,
  contractAddress,
  tierPrice,
  tierName,
}: ListTicketButtonProps) {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const [isListing, setIsListing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [priceInput, setPriceInput] = useState("");

  const marketplaceAddress = process.env.NEXT_PUBLIC_MARKETPLACE_ADDRESS;
  const originalPrice = parseFloat(tierPrice);
  const maxPrice = originalPrice * MAX_MULTIPLIER;
  const minPrice = 0.001;
  const priceNum = parseFloat(priceInput) || 0;
  const isValidPrice = priceNum >= minPrice && priceNum <= maxPrice;
  const estimatedReceive = ((priceNum * 92.5) / 100).toFixed(4);

  function openModal() {
    setPriceInput((originalPrice * 2).toFixed(4));
    setError(null);
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setError(null);
  }

  async function handleConfirm() {
    if (!address || !publicClient || !marketplaceAddress) {
      setError("Please connect your wallet.");
      return;
    }
    if (!isValidPrice) {
      setError(
        `Price must be between ${minPrice} and ${maxPrice.toFixed(4)} ETH`,
      );
      return;
    }

    setIsListing(true);
    setError(null);

    try {
      const ethereum = (window as any).ethereum;
      if (!ethereum) throw new Error("MetaMask not found");

      const approved = await publicClient.readContract({
        address: contractAddress as `0x${string}`,
        abi: eventTicketNftAbi,
        functionName: "getApproved",
        args: [BigInt(tokenId)],
      });

      if (approved.toLowerCase() !== marketplaceAddress.toLowerCase()) {
        const approveData = encodeFunctionData({
          abi: eventTicketNftAbi,
          functionName: "approve",
          args: [marketplaceAddress as `0x${string}`, BigInt(tokenId)],
        });
        const approveHash = await ethereum.request({
          method: "eth_sendTransaction",
          params: [
            {
              from: address,
              to: contractAddress,
              data: approveData,
              gas: "0x30D40",
            },
          ],
        });
        await publicClient.waitForTransactionReceipt({ hash: approveHash });
      }

      const priceWei = parseEther(priceInput);
      const listData = encodeFunctionData({
        abi: TicketMarketplaceAbi,
        functionName: "listTicket",
        args: [contractAddress as `0x${string}`, BigInt(tokenId), priceWei],
      });
      const listHash = await ethereum.request({
        method: "eth_sendTransaction",
        params: [
          {
            from: address,
            to: marketplaceAddress,
            data: listData,
            gas: "0x493E0",
          },
        ],
      });
      await publicClient.waitForTransactionReceipt({ hash: listHash });

      const res = await fetch("/api/marketplace/list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ticketId, price: priceWei.toString() }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to sync listing");
      }

      closeModal();
      window.location.reload();
    } catch (err) {
      console.error("List ticket error:", err);
      setError(err instanceof Error ? err.message : "Failed to list ticket");
    } finally {
      setIsListing(false);
    }
  }

  return (
    <>
      <div style={{ marginTop: "var(--space-lg)" }}>
        <button
          className="btn-secondary"
          onClick={openModal}
          style={{ width: "100%" }}
        >
          Resale Ticket
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
                Resale Ticket
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

            {/* Price summary */}
            <div
              style={{
                background: "var(--color-surface-soft)",
                borderRadius: "var(--radius-md)",
                padding: "var(--space-lg)",
                marginBottom: "var(--space-xl)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "var(--space-sm)",
                }}
              >
                <span
                  className="text-body-sm"
                  style={{ color: "var(--color-mute)" }}
                >
                  Original price
                </span>
                <span className="text-body-sm-strong">
                  {originalPrice.toFixed(4)} ETH
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span
                  className="text-body-sm"
                  style={{ color: "var(--color-mute)" }}
                >
                  Max resale ({MAX_MULTIPLIER}x)
                </span>
                <span
                  className="text-body-sm-strong"
                  style={{ color: "var(--color-success-deep)" }}
                >
                  {maxPrice.toFixed(4)} ETH
                </span>
              </div>
            </div>

            {/* Input */}
            <label
              style={{ display: "block", marginBottom: "var(--space-lg)" }}
            >
              <span
                className="text-body-sm-strong"
                style={{ display: "block", marginBottom: "var(--space-sm)" }}
              >
                Selling price (ETH)
              </span>
              <input
                type="number"
                min={minPrice}
                max={maxPrice}
                step="0.001"
                value={priceInput}
                onChange={(e) => setPriceInput(e.target.value)}
                placeholder={`${minPrice} – ${maxPrice.toFixed(4)}`}
                className="input-text"
              />
              {priceInput && !isValidPrice && (
                <span
                  className="text-caption-md"
                  style={{
                    color: "var(--color-error)",
                    marginTop: "var(--space-xxs)",
                    display: "block",
                  }}
                >
                  Must be between {minPrice} and {maxPrice.toFixed(4)} ETH
                </span>
              )}
            </label>

            {/* Estimate */}
            {priceInput && isValidPrice && (
              <div
                style={{
                  background: "var(--color-success-pale)",
                  borderRadius: "var(--radius-sm)",
                  padding: "var(--space-md)",
                  marginBottom: "var(--space-xl)",
                }}
              >
                <span
                  className="text-body-sm"
                  style={{ color: "var(--color-success-deep)" }}
                >
                  You receive: ~{estimatedReceive} ETH (after 2.5% platform fee
                  + 5% royalty)
                </span>
              </div>
            )}

            {/* Error */}
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

            {/* Buttons */}
            <div style={{ display: "flex", gap: "var(--space-md)" }}>
              <button
                className="btn-secondary"
                onClick={closeModal}
                disabled={isListing}
                style={{ flex: 1 }}
              >
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={handleConfirm}
                disabled={isListing || !isValidPrice}
                style={{ flex: 1 }}
              >
                {isListing ? "Processing..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

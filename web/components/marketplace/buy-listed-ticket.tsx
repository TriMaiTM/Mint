"use client";

import { useState } from "react";
import { encodeFunctionData } from "viem";
import { useAccount, usePublicClient } from "wagmi";
import { TicketMarketplaceAbi } from "@/lib/contracts";
import { LoadingModal } from "@/components/ui/loading-modal";

type BuyListedTicketProps = {
  ticketId: string;
  tokenId: number;
  contractAddress: string;
  priceWei: string;
};

export function BuyListedTicket({
  ticketId,
  tokenId,
  contractAddress,
  priceWei,
}: BuyListedTicketProps) {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const [isBuying, setIsBuying] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const marketplaceAddress = process.env.NEXT_PUBLIC_MARKETPLACE_ADDRESS;

  const handleBuy = async () => {
    if (!address || !publicClient || !marketplaceAddress) {
      setError("Please connect your wallet.");
      return;
    }

    setIsBuying(true);
    setError(null);
    setLoadingMessage("Processing transaction...");

    try {
      const ethereum = (window as any).ethereum;
      if (!ethereum) throw new Error("MetaMask not found");

      // 1. Buy on-chain
      const buyData = encodeFunctionData({
        abi: TicketMarketplaceAbi,
        functionName: "buyTicket",
        args: [contractAddress as `0x${string}`, BigInt(tokenId)],
      });

      const priceHex = "0x" + BigInt(priceWei).toString(16);

      const buyHash = await ethereum.request({
        method: "eth_sendTransaction",
        params: [
          {
            from: address,
            to: marketplaceAddress,
            data: buyData,
            value: priceHex,
            gas: "0x493E0", // 300000
          },
        ],
      });

      await publicClient.waitForTransactionReceipt({ hash: buyHash });

      setLoadingMessage("Syncing purchase...");

      // 2. Sync with DB
      const res = await fetch("/api/marketplace/buy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ticketId, txHash: buyHash }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to sync purchase");
      }

      setLoadingMessage(null);
      window.location.href = "/my-tickets";
    } catch (err) {
      console.error("Buy listed ticket error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "An error occurred while purchasing the ticket",
      );
    } finally {
      setIsBuying(false);
      setLoadingMessage(null);
    }
  };

  return (
    <div style={{ marginTop: "var(--space-lg)" }}>
      {error && (
        <p
          style={{
            marginBottom: "var(--space-sm)",
            color: "var(--color-error)",
          }}
        >
          {error}
        </p>
      )}
      <button
        className="btn-secondary"
        onClick={handleBuy}
        disabled={isBuying}
        style={{ width: "100%" }}
      >
        {isBuying ? "Processing transaction..." : "Buy this ticket"}
      </button>

      <LoadingModal show={!!loadingMessage} message={loadingMessage ?? ""} />
    </div>
  );
}

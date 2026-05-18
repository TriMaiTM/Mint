"use client";

import { useState, useEffect, useCallback } from "react";
import { formatEther } from "viem";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { eventTicketNftAbi } from "@/lib/contracts";
import { LoadingModal } from "@/components/ui/loading-modal";
import { useToast } from "@/components/ui/toast";

type WithdrawButtonProps = {
  contractAddress: string;
};

export function WithdrawButton({ contractAddress }: WithdrawButtonProps) {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const { toast } = useToast();

  const [balance, setBalance] = useState<string | null>(null);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const fetchBalance = useCallback(async () => {
    if (!publicClient) return;
    try {
      const raw = await publicClient.getBalance({
        address: contractAddress as `0x${string}`,
      });
      setBalance(formatEther(raw));
    } catch {
      setBalance(null);
    }
  }, [publicClient, contractAddress]);

  useEffect(() => {
    fetchBalance();
    const interval = setInterval(fetchBalance, 15_000);
    return () => clearInterval(interval);
  }, [fetchBalance]);

  async function handleWithdraw() {
    setIsWithdrawing(true);

    try {
      if (!walletClient || !publicClient || !address) {
        throw new Error("Please connect your wallet first.");
      }

      const owner = await publicClient.readContract({
        address: contractAddress as `0x${string}`,
        abi: eventTicketNftAbi,
        functionName: "owner",
      });

      if ((owner as string).toLowerCase() !== address.toLowerCase()) {
        throw new Error("Only the organizer can withdraw funds.");
      }

      const hash = await walletClient.writeContract({
        address: contractAddress as `0x${string}`,
        abi: eventTicketNftAbi,
        functionName: "withdraw",
        account: address,
      });

      await publicClient.waitForTransactionReceipt({ hash });
      toast("Withdrawal successful!", "success");
      fetchBalance();
    } catch (error) {
      const raw = error instanceof Error ? error.message : "Withdrawal failed.";
      if (raw.toLowerCase().includes("no funds")) {
        toast("No funds available to withdraw.", "error");
      } else if (
        raw.toLowerCase().includes("user rejected") ||
        raw.toLowerCase().includes("user denied")
      ) {
        toast("Transaction cancelled.", "info");
      } else {
        toast(raw, "error");
      }
    } finally {
      setIsWithdrawing(false);
    }
  }

  const hasBalance = balance && parseFloat(balance) > 0;
  const balanceDisplay =
    balance !== null ? `${parseFloat(balance).toFixed(6)} ETH` : "—";

  return (
    <>
      <LoadingModal show={isWithdrawing} message="Withdrawing funds..." />

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "var(--space-lg)",
        }}
      >
        <div>
          <p className="text-caption-md text-muted">Contract Balance</p>
          <p
            className="text-heading-lg"
            style={{
              color: hasBalance
                ? "var(--color-success-deep)"
                : "var(--color-mute)",
              marginTop: "var(--space-xxs)",
            }}
          >
            {balanceDisplay}
          </p>
        </div>

        <button
          className="btn-primary"
          onClick={handleWithdraw}
          type="button"
          disabled={isWithdrawing || !hasBalance}
          style={{ minWidth: "140px" }}
        >
          {isWithdrawing ? "Withdrawing..." : "Withdraw"}
        </button>
      </div>
    </>
  );
}

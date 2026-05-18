"use client";

import { useState, useEffect, useCallback } from "react";
import { formatEther } from "viem";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { eventTicketNftAbi } from "@/lib/contracts";

type WithdrawButtonProps = {
  contractAddress: string;
};

export function WithdrawButton({ contractAddress }: WithdrawButtonProps) {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();

  const [balance, setBalance] = useState<string | null>(null);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

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
    const interval = setInterval(fetchBalance, 10_000);
    return () => clearInterval(interval);
  }, [fetchBalance]);

  async function handleWithdraw() {
    setIsWithdrawing(true);
    setMessage(null);
    setIsSuccess(false);

    try {
      if (!walletClient || !publicClient || !address) {
        throw new Error("Vui lòng kết nối ví trước.");
      }

      const owner = await publicClient.readContract({
        address: contractAddress as `0x${string}`,
        abi: eventTicketNftAbi,
        functionName: "owner",
      });

      if ((owner as string).toLowerCase() !== address.toLowerCase()) {
        throw new Error("Chỉ organizer mới có quyền rút tiền.");
      }

      const hash = await walletClient.writeContract({
        address: contractAddress as `0x${string}`,
        abi: eventTicketNftAbi,
        functionName: "withdraw",
        account: address,
      });

      await publicClient.waitForTransactionReceipt({ hash });
      setIsSuccess(true);
      setMessage("Rút tiền thành công!");
      fetchBalance();
    } catch (error) {
      const raw =
        error instanceof Error ? error.message : "Không thể rút tiền.";
      if (raw.toLowerCase().includes("no funds")) {
        setMessage("Không có tiền để rút.");
      } else if (
        raw.toLowerCase().includes("user rejected") ||
        raw.toLowerCase().includes("user denied")
      ) {
        setMessage("Bạn đã huỷ giao dịch.");
      } else {
        setMessage(raw);
      }
    } finally {
      setIsWithdrawing(false);
    }
  }

  const hasBalance = balance && parseFloat(balance) > 0;

  return (
    <div>
      <div style={{ marginBottom: "var(--space-4)" }}>
        <span
          className="text-caption-md text-muted"
          style={{ display: "block" }}
        >
          Doanh thu
        </span>
        <span
          className="text-body-md"
          style={{ display: "block", marginTop: "var(--space-1)" }}
        >
          {balance !== null ? `${balance} ETH` : "—"}
        </span>
      </div>

      {hasBalance && (
        <button
          className="btn-primary"
          onClick={handleWithdraw}
          type="button"
          disabled={isWithdrawing}
        >
          {isWithdrawing ? "Đang rút..." : "Rút tiền"}
        </button>
      )}

      {message && (
        <p
          style={{
            marginTop: "var(--space-3)",
            color: isSuccess
              ? "var(--color-success-deep)"
              : "var(--color-error)",
          }}
        >
          {message}
        </p>
      )}
    </div>
  );
}

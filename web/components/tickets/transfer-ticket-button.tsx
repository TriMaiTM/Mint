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
      setError("Vui lòng kết nối ví của bạn.");
      return;
    }
    const cleanToAddress = toAddress.trim();
    if (!isValidAddress) {
      setError("Địa chỉ ví nhận không hợp lệ. Vui lòng nhập địa chỉ ví EVM hợp lệ (0x...).");
      return;
    }
    if (cleanToAddress.toLowerCase() === address.toLowerCase()) {
      setError("Bạn không thể tặng vé cho chính mình.");
      return;
    }

    setIsTransferring(true);
    setError(null);
    setLoadingMessage("Đang gửi giao dịch tặng vé...");

    try {
      const ethereum = (window as any).ethereum;
      if (!ethereum) throw new Error("Không tìm thấy MetaMask");

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

      setLoadingMessage("Đang chờ xác nhận giao dịch trên blockchain...");
      await publicClient.waitForTransactionReceipt({ hash: txHash });

      setLoadingMessage("Đang đồng bộ thông tin vé...");
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
        throw new Error(data.error || "Không thể cập nhật thông tin chuyển vé vào database");
      }

      setLoadingMessage(null);
      closeModal();
      window.location.reload();
    } catch (err) {
      console.error("Transfer ticket error:", err);
      setError(err instanceof Error ? err.message : "Chuyển vé thất bại");
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
          Tặng vé
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
                Tặng vé NFT
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
                Cảnh báo quan trọng:
              </p>
              <p
                className="text-caption-md text-muted mt-xxs"
                style={{ lineHeight: "1.4" }}
              >
                Hành động này sẽ chuyển nhượng vĩnh viễn NFT vé này sang địa chỉ ví khác trên blockchain. Bạn sẽ không còn quyền sở hữu vé này nữa và hành động này không thể hoàn tác.
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
                Địa chỉ ví nhận (Address)
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
                  Địa chỉ ví nhận phải bắt đầu bằng 0x và có đúng 42 ký tự
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
                Hủy
              </button>
              <button
                className="btn-primary"
                onClick={handleConfirm}
                disabled={isTransferring || !isValidAddress}
                style={{ flex: 1 }}
              >
                {isTransferring ? "Đang xử lý..." : "Xác nhận gửi"}
              </button>
            </div>
          </div>
        </div>
      )}

      <LoadingModal show={!!loadingMessage} message={loadingMessage ?? ""} />
    </>
  );
}

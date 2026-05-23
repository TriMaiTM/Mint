"use client";

import { useState } from "react";
import { encodeFunctionData, parseEther, parseEventLogs } from "viem";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { eventTicketNftAbi, mapLegacyTierNameToId } from "@/lib/contracts";
import { LoadingModal } from "@/components/ui/loading-modal";

type BuyTicketButtonProps = {
  eventId: string;
  tierId: string;
  tierName: string;
  tierPrice: string;
  onchainTierId: number | null;
  eventContractAddress: string | null;
  organizerWalletAddress: string;
};

type CouponData = {
  couponId: string;
  isValid: boolean;
  originalPrice: number;
  discountAmount: number;
  discountedPrice: number;
  discountType: "PERCENTAGE" | "FIXED";
  discountValue: number;
};

export function BuyTicketButton({
  eventId,
  tierId,
  tierName,
  tierPrice,
  onchainTierId,
  eventContractAddress,
  organizerWalletAddress,
}: BuyTicketButtonProps) {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();

  const [isBuying, setIsBuying] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Coupon states
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [couponData, setCouponData] = useState<CouponData | null>(null);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);

  async function handleApplyCoupon() {
    if (!couponInput.trim()) return;
    setIsValidatingCoupon(true);
    setCouponError(null);
    try {
      const res = await fetch("/api/tickets/validate-coupon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId,
          tierId,
          code: couponInput.trim(),
        }),
      });
      const payload = await res.json();
      if (res.ok && payload.data?.isValid) {
        setCouponData(payload.data);
        setAppliedCoupon(couponInput.trim().toUpperCase());
      } else {
        setCouponError(payload.error ?? "Invalid coupon code");
        setCouponData(null);
        setAppliedCoupon(null);
      }
    } catch (err) {
      console.error(err);
      setCouponError("Error validating coupon");
    } finally {
      setIsValidatingCoupon(false);
    }
  }

  function handleRemoveCoupon() {
    setCouponInput("");
    setAppliedCoupon(null);
    setCouponData(null);
    setCouponError(null);
  }

  async function handleFreeMint() {
    setError(null);

    setIsBuying(true);
    setLoadingMessage("Processing free ticket claim...");
    try {
      const response = await fetch("/api/tickets/mint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tierId,
          couponCode: appliedCoupon,
        }),
      });

      const payload = await response.json();
      if (!response.ok || !payload.data) {
        throw new Error(payload.error ?? "Không thể nhận vé miễn phí.");
      }

      setLoadingMessage(null);
      setSuccess("Claimed free ticket successfully! Redirecting...");
      setTimeout(() => window.location.reload(), 1500);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to claim free ticket");
      setLoadingMessage(null);
    } finally {
      setIsBuying(false);
    }
  }

  async function handleBuy() {
    setError(null);

    setIsBuying(true);
    setLoadingMessage(null);

    try {
      if (!walletClient || !publicClient || !address) {
        throw new Error("Vui lòng kết nối ví trước khi mua vé.");
      }
      if (!eventContractAddress) {
        throw new Error("Sự kiện chưa được đưa lên blockchain.");
      }
      if (!organizerWalletAddress) {
        throw new Error("Không tìm thấy địa chỉ ví của ban tổ chức.");
      }

      const targetTierId = onchainTierId ?? mapLegacyTierNameToId(tierName);
      const isDiscounted = couponData && couponData.discountedPrice > 0;

      // Ensure MetaMask uses Sepolia
      const ethereum = (window as any).ethereum;
      if (!ethereum) {
        throw new Error("MetaMask not found");
      }

      try {
        await ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: "0xAA36A7" }],
        });
      } catch {
        try {
          await ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: "0xAA36A7",
                chainName: "Sepolia",
                nativeCurrency: {
                  name: "SepoliaETH",
                  symbol: "ETH",
                  decimals: 18,
                },
                rpcUrls: ["https://eth-sepolia.g.alchemy.com/v2/" + (process.env.NEXT_PUBLIC_ALCHEMY_KEY ?? "")],
                blockExplorerUrls: ["https://sepolia.etherscan.io"],
              },
            ],
          });
        } catch {}
      }

      let txHash: `0x${string}`;
      let tokenURI = `ipfs://ticketnft/${tierId}/${Date.now()}`;

      if (isDiscounted) {
        // Send native tokens directly to the organizer
        setLoadingMessage("Vui lòng xác nhận giao dịch chuyển tiền trực tiếp trong MetaMask...");
        const sendAmount = couponData.discountedPrice.toString();
        txHash = await ethereum.request({
          method: "eth_sendTransaction",
          params: [
            {
              from: address,
              to: organizerWalletAddress,
              value: "0x" + parseEther(sendAmount).toString(16),
              gas: "0x5208", // 21000 gas for simple transfer
            },
          ],
        });
      } else {
        // Prepare metadata first on IPFS
        setLoadingMessage("Đang chuẩn bị metadata vé trên IPFS...");
        try {
          const prepareRes = await fetch("/api/tickets/prepare-metadata", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tierId }),
          });
          if (prepareRes.ok) {
            const result = await prepareRes.json();
            if (result.data?.tokenURI) {
              tokenURI = result.data.tokenURI;
            }
          }
        } catch (err) {
          console.error("Failed to prepare IPFS metadata, falling back to mock URI:", err);
        }

        // Encode function call for standard mint
        setLoadingMessage("Vui lòng xác nhận giao dịch mua vé trong MetaMask...");
        const callData = encodeFunctionData({
          abi: eventTicketNftAbi,
          functionName: "mint",
          args: [targetTierId, tokenURI],
        });

        txHash = await ethereum.request({
          method: "eth_sendTransaction",
          params: [
            {
              from: address,
              to: eventContractAddress,
              data: callData,
              value: "0x" + parseEther(tierPrice).toString(16),
              gas: "0x493E0", // 300000
            },
          ],
        });
      }

      setLoadingMessage("Đang chờ xác nhận từ blockchain...");

      const receipt = await publicClient.waitForTransactionReceipt({
        hash: txHash,
      });

      if (isDiscounted) {
        setLoadingMessage("Đang hoàn tất cấp vé từ hệ thống...");
        // Call server-side mint with txHash
        const response = await fetch("/api/tickets/mint", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tierId,
            couponCode: appliedCoupon,
            txHash,
          }),
        });

        const payload = (await response.json()) as {
          data?: { tokenId: number };
          error?: string;
        };

        if (!response.ok || !payload.data) {
          throw new Error(payload.error ?? "Không thể lưu thông tin vé sau khi thanh toán.");
        }
      } else {
        // Parse TicketMinted event
        const mintedLogs = parseEventLogs({
          abi: eventTicketNftAbi,
          eventName: "TicketMinted",
          logs: receipt.logs,
        });

        const minted = mintedLogs.find((log) =>
          log.args?.to ? log.args.to.toLowerCase() === address.toLowerCase() : false
        );

        const tokenId = minted?.args?.tokenId ? Number(minted.args.tokenId) : undefined;

        if (!tokenId) {
          throw new Error("Không thể xác nhận tokenId từ blockchain.");
        }

        // Sync with DB
        const response = await fetch("/api/tickets/buy", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            tierId,
            txHash,
            tokenId,
            onchainTierId: targetTierId,
            tokenURI,
          }),
        });

        const payload = (await response.json()) as {
          data?: { tokenId: number };
          error?: string;
        };

        if (!response.ok || !payload.data) {
          throw new Error(payload.error ?? "Không thể lưu thông tin vé.");
        }
      }

      setLoadingMessage(null);
      setSuccess("Mua vé thành công! Đang chuyển hướng...");
      setTimeout(() => window.location.reload(), 1500);
    } catch (error) {
      console.error("Buy ticket error:", error);
      const raw = error instanceof Error ? error.message : "Không thể mua vé.";
      setLoadingMessage(null);
      setError(raw);
    } finally {
      setIsBuying(false);
    }
  }

  const isFree = couponData && couponData.discountedPrice === 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-md)" }}>
      {/* Coupon input */}
      {!appliedCoupon ? (
        <div style={{ display: "flex", gap: "var(--space-xs)" }}>
          <input
            type="text"
            placeholder="Mã giảm giá"
            value={couponInput}
            onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
            style={{
              flex: 1,
              padding: "8px 12px",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--color-hairline)",
              fontSize: "0.85rem",
              background: "var(--color-canvas)",
              color: "inherit",
              height: "38px",
            }}
          />
          <button
            type="button"
            onClick={handleApplyCoupon}
            disabled={isValidatingCoupon || !couponInput.trim()}
            style={{
              padding: "0 16px",
              fontSize: "0.85rem",
              borderRadius: "var(--radius-md)",
              whiteSpace: "nowrap",
              flexShrink: 0,
              height: "38px",
              backgroundColor: "var(--color-primary)",
              color: "var(--color-on-primary)",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {isValidatingCoupon ? "..." : "Áp dụng"}
          </button>
        </div>
      ) : (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "6px 12px",
            backgroundColor: "rgba(46, 125, 50, 0.1)",
            borderRadius: "var(--radius-md)",
            border: "1px solid rgba(46, 125, 50, 0.3)",
            fontSize: "0.85rem",
          }}
        >
          <span style={{ color: "green", fontWeight: "bold" }}>
            {appliedCoupon} (-
            {couponData?.discountType === "PERCENTAGE"
              ? `${couponData.discountValue}%`
              : `${couponData?.discountValue} POL`}
            )
          </span>
          <button
            type="button"
            onClick={handleRemoveCoupon}
            style={{
              background: "none",
              border: "none",
              color: "var(--color-error)",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            Gỡ
          </button>
        </div>
      )}

      {couponError && (
        <p style={{ fontSize: "0.8rem", color: "var(--color-error)", margin: 0 }}>{couponError}</p>
      )}

      {/* Pricing info display if coupon applied */}
      {couponData && (
        <div style={{ fontSize: "0.9rem", color: "var(--color-text-body)" }}>
          {isFree ? (
            <p style={{ color: "green", fontWeight: "bold", margin: 0 }}>Vé hoàn toàn miễn phí! 🎉</p>
          ) : (
            <p style={{ margin: 0 }}>
              Giá sau giảm: <strong>{couponData.discountedPrice.toFixed(4)} POL</strong> (Giảm {couponData.discountAmount.toFixed(4)} POL)
            </p>
          )}
        </div>
      )}

      {/* Main Action Button */}
      {isFree ? (
        <button
          className="btn-primary"
          onClick={handleFreeMint}
          type="button"
          disabled={isBuying}
          style={{ width: "100%", backgroundColor: "green" }}
        >
          {isBuying ? "Processing..." : "Claim Free Ticket"}
        </button>
      ) : (
        <button
          className="btn-primary"
          onClick={handleBuy}
          type="button"
          disabled={isBuying || !eventContractAddress}
          style={{ width: "100%" }}
        >
          {isBuying ? "Processing..." : eventContractAddress ? "Buy Ticket" : "Not on sale"}
        </button>
      )}

      {/* Display messages */}
      {error && (
        <p style={{ marginTop: "var(--space-xs)", color: "var(--color-error)", fontSize: "0.85rem" }}>
          {error}
        </p>
      )}
      {success && (
        <p style={{ marginTop: "var(--space-xs)", color: "green", fontSize: "0.85rem", fontWeight: "bold" }}>
          {success}
        </p>
      )}



      <LoadingModal show={!!loadingMessage} message={loadingMessage ?? ""} />
    </div>
  );
}

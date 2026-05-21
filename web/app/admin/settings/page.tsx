"use client";

import { useState, useEffect } from "react";
import { useAccount, usePublicClient } from "wagmi";
import { encodeFunctionData } from "viem";
import { TicketMarketplaceAbi, eventTicketNftAbi } from "@/lib/contracts";

export default function AdminSettingsPage() {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();

  // Marketplace states
  const [contractOwner, setContractOwner] = useState<string>("");
  const [feeBps, setFeeBps] = useState<number>(0);
  const [recipient, setRecipient] = useState<string>("");
  
  // Form input states
  const [newFeeBps, setNewFeeBps] = useState<string>("");
  const [newRecipient, setNewRecipient] = useState<string>("");
  
  // Event transferability states
  const [eventAddress, setEventAddress] = useState<string>("");
  const [isEventTransferable, setIsEventTransferable] = useState<boolean | null>(null);
  
  // Loading & status states
  const [loading, setLoading] = useState(false);
  const [txMessage, setTxMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const marketplaceAddress = process.env.NEXT_PUBLIC_MARKETPLACE_ADDRESS;

  // Load marketplace data
  const loadMarketplaceData = async () => {
    if (!publicClient || !marketplaceAddress) return;
    try {
      setLoading(true);
      setError(null);

      const [ownerRes, feeRes, recipientRes] = await Promise.all([
        publicClient.readContract({
          address: marketplaceAddress as `0x${string}`,
          abi: TicketMarketplaceAbi,
          functionName: "owner",
        }),
        publicClient.readContract({
          address: marketplaceAddress as `0x${string}`,
          abi: TicketMarketplaceAbi,
          functionName: "platformFeeBps",
        }),
        publicClient.readContract({
          address: marketplaceAddress as `0x${string}`,
          abi: TicketMarketplaceAbi,
          functionName: "feeRecipient",
        }),
      ]);

      setContractOwner(ownerRes as string);
      setFeeBps(Number(feeRes));
      setRecipient(recipientRes as string);
      
      setNewFeeBps(Number(feeRes).toString());
      setNewRecipient(recipientRes as string);
    } catch (err) {
      console.error("Error reading marketplace contract:", err);
      setError("Failed to fetch marketplace details from blockchain. Check contract address or network.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isConnected && publicClient && marketplaceAddress) {
      loadMarketplaceData();
    }
  }, [isConnected, publicClient, marketplaceAddress]);

  // Check transferable status on target event NFT contract
  const checkEventTransferability = async () => {
    if (!publicClient || !eventAddress) {
      setError("Please input a valid event contract address.");
      return;
    }
    if (!/^0x[a-fA-F0-9]{40}$/.test(eventAddress)) {
      setError("Invalid contract address format.");
      return;
    }
    try {
      setError(null);
      setTxMessage("Querying transferability status...");
      const status = await publicClient.readContract({
        address: eventAddress as `0x${string}`,
        abi: eventTicketNftAbi,
        functionName: "transferable",
      });
      setIsEventTransferable(status as boolean);
      setTxMessage(null);
    } catch (err) {
      console.error("Error checking transferability:", err);
      setError("Failed to read transferability. Ensure it is a valid event ticket NFT contract.");
      setIsEventTransferable(null);
      setTxMessage(null);
    }
  };

  // On-chain write helper
  const sendContractTransaction = async (toAddress: string, dataPayload: string, gasLimit = "0x493E0") => {
    const ethereum = (window as any).ethereum;
    if (!ethereum || !address) {
      throw new Error("MetaMask not connected");
    }
    
    setTxMessage("Awaiting signature in wallet...");
    const hash = await ethereum.request({
      method: "eth_sendTransaction",
      params: [
        {
          from: address,
          to: toAddress,
          data: dataPayload,
          gas: gasLimit,
        },
      ],
    });

    setTxMessage("Transaction submitted! Waiting for confirmation...");
    if (publicClient) {
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      if (receipt.status !== "success") {
        throw new Error("Transaction execution failed on-chain.");
      }
    }
    return hash;
  };

  const handleUpdateFee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!marketplaceAddress) return;
    const bpsValue = parseInt(newFeeBps, 10);
    if (isNaN(bpsValue) || bpsValue < 0 || bpsValue > 10000) {
      setError("BPS must be between 0 and 10000 (0% - 100%)");
      return;
    }

    try {
      setError(null);
      const data = encodeFunctionData({
        abi: TicketMarketplaceAbi,
        functionName: "setPlatformFee",
        args: [BigInt(bpsValue)],
      });
      await sendContractTransaction(marketplaceAddress, data);
      setTxMessage("Platform fee updated successfully!");
      loadMarketplaceData();
    } catch (err) {
      console.error("Error setting platform fee:", err);
      setError(err instanceof Error ? err.message : "Failed to execute transaction");
    } finally {
      setTimeout(() => setTxMessage(null), 5000);
    }
  };

  const handleUpdateRecipient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!marketplaceAddress) return;
    if (!/^0x[a-fA-F0-9]{40}$/.test(newRecipient)) {
      setError("Invalid recipient address format.");
      return;
    }

    try {
      setError(null);
      const data = encodeFunctionData({
        abi: TicketMarketplaceAbi,
        functionName: "setFeeRecipient",
        args: [newRecipient as `0x${string}`],
      });
      await sendContractTransaction(marketplaceAddress, data);
      setTxMessage("Platform fee recipient updated successfully!");
      loadMarketplaceData();
    } catch (err) {
      console.error("Error setting recipient:", err);
      setError(err instanceof Error ? err.message : "Failed to execute transaction");
    } finally {
      setTimeout(() => setTxMessage(null), 5000);
    }
  };

  const handleToggleTransferable = async (enable: boolean) => {
    if (!eventAddress) return;
    try {
      setError(null);
      const data = encodeFunctionData({
        abi: eventTicketNftAbi,
        functionName: "setTransferable",
        args: [enable],
      });
      await sendContractTransaction(eventAddress, data);
      setTxMessage(`Successfully ${enable ? "enabled" : "disabled"} ticket transfers!`);
      checkEventTransferability();
    } catch (err) {
      console.error("Error setting transferable:", err);
      setError(err instanceof Error ? err.message : "Failed to execute transaction");
    } finally {
      setTimeout(() => setTxMessage(null), 5000);
    }
  };

  if (!isConnected) {
    return (
      <div style={{ textAlign: "center", padding: "var(--space-xxl) 0" }}>
        <h1 className="text-heading-xl mb-md">Contract Settings</h1>
        <p className="text-body-md text-muted mb-lg">
          Please connect your wallet to access platform smart contract settings.
        </p>
      </div>
    );
  }

  const isUserContractOwner = address && contractOwner && address.toLowerCase() === contractOwner.toLowerCase();

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto" }}>
      {/* Header */}
      <header style={{ marginBottom: "var(--space-xxl)" }}>
        <h1 className="text-display-lg">Contract Settings</h1>
        <p className="text-body-md text-muted mt-sm">
          Modify on-chain configuration for the Ticket Marketplace and Event contracts.
        </p>
      </header>

      {/* Status messages */}
      {txMessage && (
        <div
          style={{
            padding: "var(--space-md) var(--space-lg)",
            backgroundColor: "rgba(99, 102, 241, 0.15)",
            border: "1px solid rgba(99, 102, 241, 0.3)",
            color: "#a5b4fc",
            borderRadius: "var(--radius-md)",
            marginBottom: "var(--space-xl)",
            fontSize: "14px",
            fontWeight: 600,
          }}
        >
          🔄 {txMessage}
        </div>
      )}

      {error && (
        <div
          style={{
            padding: "var(--space-md) var(--space-lg)",
            backgroundColor: "rgba(239, 68, 68, 0.1)",
            border: "1px solid rgba(239, 68, 68, 0.2)",
            color: "var(--color-error)",
            borderRadius: "var(--radius-md)",
            marginBottom: "var(--space-xl)",
            fontSize: "14px",
          }}
        >
          ⚠️ {error}
        </div>
      )}

      {/* Contract Ownership Info */}
      <section style={{ marginBottom: "var(--space-xxl)" }}>
        <div 
          className="card" 
          style={{ 
            padding: "var(--space-lg)", 
            background: "var(--color-surface-soft)",
            border: isUserContractOwner ? "1px solid rgba(16, 185, 129, 0.2)" : "1px solid rgba(239, 68, 68, 0.2)"
          }}
        >
          <h3 style={{ margin: "0 0 var(--space-sm) 0", fontSize: "16px" }}>Marketplace Owner Status</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <div style={{ fontSize: "14px" }}>
              <span className="text-muted">Marketplace Contract:</span>{" "}
              <span style={{ fontFamily: "monospace" }}>{marketplaceAddress || "Not configured"}</span>
            </div>
            <div style={{ fontSize: "14px" }}>
              <span className="text-muted">Contract Owner Address:</span>{" "}
              <span style={{ fontFamily: "monospace" }}>{contractOwner || "Loading..."}</span>
            </div>
            <div style={{ fontSize: "14px" }}>
              <span className="text-muted">Your Connected Wallet:</span>{" "}
              <span style={{ fontFamily: "monospace" }}>{address}</span>
            </div>
            {contractOwner && (
              <div 
                style={{ 
                  marginTop: "var(--space-xs)", 
                  fontSize: "14px", 
                  fontWeight: 600,
                  color: isUserContractOwner ? "#10b981" : "#ef4444" 
                }}
              >
                {isUserContractOwner 
                  ? "✓ You are the Owner of this contract. You can execute configuration updates."
                  : "✕ You are NOT the Owner of this contract. On-chain changes will fail."}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Platform Fees & Recipient Forms */}
      <section style={{ marginBottom: "var(--space-xxl)" }}>
        <h2 className="text-heading-lg mb-lg">Marketplace Configuration</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-lg)" }}>
          
          {/* Fee Bps Form */}
          <div className="card" style={{ padding: "var(--space-lg)", background: "var(--color-surface-soft)" }}>
            <h3 style={{ margin: "0 0 var(--space-md) 0", fontSize: "16px" }}>Platform Fee Rate</h3>
            <p className="text-body-sm text-muted mb-md">
              Current Fee Rate: <strong>{(feeBps / 100).toFixed(2)}%</strong> ({feeBps} BPS)
            </p>
            <form onSubmit={handleUpdateFee} style={{ display: "flex", gap: "var(--space-sm)" }}>
              <input
                type="number"
                min="0"
                max="10000"
                placeholder="New Fee BPS (e.g. 250 for 2.5%)"
                value={newFeeBps}
                onChange={(e) => setNewFeeBps(e.target.value)}
                disabled={loading || !isUserContractOwner}
                style={{
                  flex: 1,
                  padding: "8px 12px",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--color-hairline)",
                  backgroundColor: "var(--color-surface-card)",
                  color: "var(--color-ink)",
                }}
              />
              <button 
                type="submit" 
                className="btn-primary" 
                disabled={loading || !isUserContractOwner}
              >
                Update Fee
              </button>
            </form>
          </div>

          {/* Recipient Form */}
          <div className="card" style={{ padding: "var(--space-lg)", background: "var(--color-surface-soft)" }}>
            <h3 style={{ margin: "0 0 var(--space-md) 0", fontSize: "16px" }}>Platform Fee Recipient</h3>
            <p className="text-body-sm text-muted mb-md">
              Current Recipient: <strong style={{ fontFamily: "monospace" }}>{recipient}</strong>
            </p>
            <form onSubmit={handleUpdateRecipient} style={{ display: "flex", gap: "var(--space-sm)" }}>
              <input
                type="text"
                placeholder="New Recipient Address (0x...)"
                value={newRecipient}
                onChange={(e) => setNewRecipient(e.target.value)}
                disabled={loading || !isUserContractOwner}
                style={{
                  flex: 1,
                  padding: "8px 12px",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--color-hairline)",
                  backgroundColor: "var(--color-surface-card)",
                  color: "var(--color-ink)",
                  fontFamily: "monospace",
                }}
              />
              <button 
                type="submit" 
                className="btn-primary" 
                disabled={loading || !isUserContractOwner}
              >
                Update Recipient
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Event Ticket Transferability Toggle */}
      <section style={{ marginBottom: "var(--space-xxl)" }}>
        <h2 className="text-heading-lg mb-lg">Event Contract Controls</h2>
        <div className="card" style={{ padding: "var(--space-lg)", background: "var(--color-surface-soft)" }}>
          <h3 style={{ margin: "0 0 var(--space-sm) 0", fontSize: "16px" }}>Ticket Transfer Locks</h3>
          <p className="text-body-sm text-muted mb-md">
            Query and toggle the transferability setting on specific deployed event ticket NFT contracts.
          </p>
          
          <div style={{ display: "flex", gap: "var(--space-sm)", marginBottom: "var(--space-lg)" }}>
            <input
              type="text"
              placeholder="Event Ticket NFT Contract Address (0x...)"
              value={eventAddress}
              onChange={(e) => setEventAddress(e.target.value)}
              style={{
                flex: 1,
                padding: "8px 12px",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--color-hairline)",
                backgroundColor: "var(--color-surface-card)",
                color: "var(--color-ink)",
                fontFamily: "monospace",
              }}
            />
            <button 
              type="button" 
              className="btn-secondary" 
              onClick={checkEventTransferability}
            >
              Check Status
            </button>
          </div>

          {isEventTransferable !== null && (
            <div 
              style={{ 
                display: "flex", 
                justifyContent: "space-between", 
                alignItems: "center",
                padding: "var(--space-md)",
                backgroundColor: "var(--color-surface-card)",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--color-hairline)"
              }}
            >
              <div>
                <span className="text-muted">Transferability Status:</span>{" "}
                <span 
                  style={{ 
                    fontWeight: 600, 
                    color: isEventTransferable ? "#10b981" : "#ef4444" 
                  }}
                >
                  {isEventTransferable ? "Enabled (Transferable)" : "Disabled (Locked)"}
                </span>
              </div>
              <div style={{ display: "flex", gap: "var(--space-sm)" }}>
                <button
                  type="button"
                  className="btn-primary"
                  style={{ 
                    backgroundColor: "#10b981", 
                    borderColor: "#10b981", 
                    padding: "6px 14px", 
                    fontSize: "13px" 
                  }}
                  onClick={() => handleToggleTransferable(true)}
                >
                  Enable Transfers
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  style={{ 
                    backgroundColor: "#ef4444", 
                    borderColor: "#ef4444", 
                    padding: "6px 14px", 
                    fontSize: "13px" 
                  }}
                  onClick={() => handleToggleTransferable(false)}
                >
                  Lock Transfers
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

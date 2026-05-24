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

  // Platform admin configuration states
  const [maintenanceMode, setMaintenanceMode] = useState<boolean>(false);
  const [alertBannerText, setAlertBannerText] = useState<string>("");
  const [maxTickets, setMaxTickets] = useState<number>(5);
  const [allowEventCreation, setAllowEventCreation] = useState<boolean>(true);
  const [allowUserRegistration, setAllowUserRegistration] = useState<boolean>(true);
  const [allowSecondaryMarketplace, setAllowSecondaryMarketplace] = useState<boolean>(true);
  const [blockedWallets, setBlockedWallets] = useState<string[]>([]);
  const [newBlockedWallet, setNewBlockedWallet] = useState<string>("");

  useEffect(() => {
    fetch("/api/admin/platform-config")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.config) {
          const cfg = data.config;
          setMaintenanceMode(cfg.maintenanceMode);
          setAlertBannerText(cfg.alertBannerText || "");
          setMaxTickets(cfg.maxTickets || 5);
          setAllowEventCreation(cfg.allowEventCreation !== false);
          setAllowUserRegistration(cfg.allowUserRegistration !== false);
          setAllowSecondaryMarketplace(cfg.allowSecondaryMarketplace !== false);
          setBlockedWallets(Array.isArray(cfg.blockedWallets) ? cfg.blockedWallets : []);

          if (typeof window !== "undefined") {
            localStorage.setItem("ticketnft_maintenance", String(cfg.maintenanceMode));
            localStorage.setItem("ticketnft_alert_text", cfg.alertBannerText || "");
            localStorage.setItem("ticketnft_max_tickets", String(cfg.maxTickets || 5));
            window.dispatchEvent(new Event("ticketnft-system-config-changed"));
          }
        }
      })
      .catch((err) => console.error("Error loading config:", err));
  }, []);

  const handleSavePlatformConfig = async () => {
    try {
      setError(null);
      setTxMessage("Saving configuration...");

      const payload = {
        maintenanceMode,
        allowEventCreation,
        allowUserRegistration,
        allowSecondaryMarketplace,
        blockedWallets,
        alertBannerText,
        maxTickets,
      };

      const res = await fetch("/api/admin/platform-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error ?? "Failed to save configuration");
      }

      if (typeof window !== "undefined") {
        localStorage.setItem("ticketnft_maintenance", String(maintenanceMode));
        localStorage.setItem("ticketnft_alert_text", alertBannerText);
        localStorage.setItem("ticketnft_max_tickets", String(maxTickets));
        window.dispatchEvent(new Event("ticketnft-system-config-changed"));
      }

      setTxMessage("Platform configurations saved successfully!");
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Error saving configurations");
    } finally {
      setTimeout(() => setTxMessage(null), 5000);
    }
  };

  const handleAddBlockedWallet = () => {
    const clean = newBlockedWallet.trim().toLowerCase();
    if (!clean) return;
    if (!/^0x[a-fA-F0-9]{40}$/.test(clean)) {
      setError("Invalid wallet address format. Must be a valid 42-character hex address starting with 0x.");
      setTimeout(() => setError(null), 5000);
      return;
    }
    if (blockedWallets.map(w => w.toLowerCase()).includes(clean)) {
      setError("This wallet is already in the blocklist.");
      setTimeout(() => setError(null), 5000);
      return;
    }
    setBlockedWallets((prev) => [...prev, clean]);
    setNewBlockedWallet("");
  };

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

  const handleWithdrawFunds = async () => {
    if (!eventAddress) {
      setError("Please input a valid event contract address first.");
      return;
    }
    try {
      setError(null);
      const data = encodeFunctionData({
        abi: eventTicketNftAbi,
        functionName: "withdraw",
        args: [],
      });
      await sendContractTransaction(eventAddress, data);
      setTxMessage("Ticket sale proceeds successfully withdrawn from event contract!");
    } catch (err) {
      console.error("Error withdrawing funds:", err);
      setError(err instanceof Error ? err.message : "Failed to execute withdraw transaction");
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

              {/* Withdraw controls */}
              <div 
                style={{ 
                  display: "flex", 
                  gap: "var(--space-sm)", 
                  marginTop: "var(--space-md)", 
                  borderTop: "1px solid var(--color-hairline)", 
                  paddingTop: "var(--space-md)" 
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", flexWrap: "wrap", gap: "10px" }}>
                  <div>
                    <span className="text-muted" style={{ fontSize: "14px", fontWeight: 600 }}>Withdraw Sales proceeds:</span>
                    <p style={{ fontSize: "12px", color: "var(--color-mute)", margin: "2px 0 0 0" }}>
                      Retrieve accumulated ticket sales revenue from this event contract to the owner's wallet.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="btn-secondary"
                    style={{ 
                      padding: "8px 16px", 
                      fontSize: "13px",
                      borderColor: "#10b981",
                      color: "#10b981",
                      fontWeight: 600
                    }}
                    onClick={handleWithdrawFunds}
                  >
                    💰 Withdraw Proceeds
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Platform Configuration & System Broadcasts */}
      <section style={{ marginBottom: "var(--space-xxl)" }}>
        <h2 className="text-heading-lg mb-lg">Global Platform Settings</h2>
        <div className="card" style={{ padding: "var(--space-lg)", background: "var(--color-surface-soft)" }}>
          <h3 style={{ margin: "0 0 var(--space-sm) 0", fontSize: "16px" }}>Platform Admin Controls & Broadcasts</h3>
          <p className="text-body-sm text-muted mb-md">
            Manage system-wide states, announcement tickers, toggles and wallet blocklists.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-md)" }}>
            {/* Global Alert Banner Input */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "14px", fontWeight: 600 }}>Global Announcement Banner</label>
              <div style={{ display: "flex", gap: "var(--space-sm)" }}>
                <input
                  type="text"
                  placeholder="Enter system announcement text (e.g. Polygon Sepolia Network upgrade...)"
                  value={alertBannerText}
                  onChange={(e) => setAlertBannerText(e.target.value)}
                  style={{
                    flex: 1,
                    padding: "8px 12px",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--color-hairline)",
                    backgroundColor: "var(--color-surface-card)",
                    color: "var(--color-ink)",
                  }}
                />
                {alertBannerText && (
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setAlertBannerText("")}
                    style={{ fontSize: "13px" }}
                  >
                    Clear Banner
                  </button>
                )}
              </div>
            </div>

            {/* Ticket Booking Limit */}
            <div 
              style={{ 
                display: "flex", 
                justifyContent: "space-between", 
                alignItems: "center", 
                backgroundColor: "var(--color-surface-card)", 
                padding: "var(--space-md)", 
                borderRadius: "var(--radius-sm)", 
                border: "1px solid var(--color-hairline)" 
              }}
            >
              <div>
                <strong style={{ fontSize: "14px", display: "block" }}>Max Tickets Per Purchase Order</strong>
                <span style={{ fontSize: "12px", color: "var(--color-mute)" }}>
                  Enforces a default limit on checkout cart quantities.
                </span>
              </div>
              <input
                type="number"
                min="1"
                max="50"
                value={maxTickets}
                onChange={(e) => setMaxTickets(Number(e.target.value))}
                style={{
                  width: "70px",
                  padding: "6px 10px",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--color-hairline)",
                  backgroundColor: "var(--color-surface-soft)",
                  color: "var(--color-ink)",
                  fontWeight: 600,
                  textAlign: "center"
                }}
              />
            </div>

            {/* Platform Toggles */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "var(--space-xs)" }}>
              <label style={{ fontSize: "14px", fontWeight: 600 }}>Feature Status Toggles</label>
              
              <div 
                style={{ 
                  display: "grid", 
                  gridTemplateColumns: "1fr 1fr", 
                  gap: "var(--space-md)"
                }}
              >
                {/* Maintenance Mode Toggle */}
                <div 
                  style={{ 
                    display: "flex", 
                    justifyContent: "space-between", 
                    alignItems: "center", 
                    backgroundColor: "var(--color-surface-card)", 
                    padding: "var(--space-md)", 
                    borderRadius: "var(--radius-sm)", 
                    border: "1px solid var(--color-hairline)" 
                  }}
                >
                  <div>
                    <strong style={{ fontSize: "14px", display: "block" }}>Maintenance Mode</strong>
                    <span style={{ fontSize: "12px", color: "var(--color-mute)" }}>
                      Under scheduled maintenance mode.
                    </span>
                  </div>
                  <label style={{ position: "relative", display: "inline-block", width: "48px", height: "24px" }}>
                    <input
                      type="checkbox"
                      checked={maintenanceMode}
                      onChange={(e) => setMaintenanceMode(e.target.checked)}
                      style={{ opacity: 0, width: 0, height: 0 }}
                    />
                    <span 
                      style={{
                        position: "absolute",
                        cursor: "pointer",
                        top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: maintenanceMode ? "var(--color-primary)" : "var(--color-hairline)",
                        transition: "0.2s",
                        borderRadius: "24px"
                      }}
                    >
                      <span 
                        style={{
                          position: "absolute",
                          content: '""',
                          height: "18px", width: "18px",
                          left: maintenanceMode ? "27px" : "3px",
                          bottom: "3px",
                          backgroundColor: "#fff",
                          transition: "0.2s",
                          borderRadius: "50%"
                        }}
                      />
                    </span>
                  </label>
                </div>

                {/* Event Creation Toggle */}
                <div 
                  style={{ 
                    display: "flex", 
                    justifyContent: "space-between", 
                    alignItems: "center", 
                    backgroundColor: "var(--color-surface-card)", 
                    padding: "var(--space-md)", 
                    borderRadius: "var(--radius-sm)", 
                    border: "1px solid var(--color-hairline)" 
                  }}
                >
                  <div>
                    <strong style={{ fontSize: "14px", display: "block" }}>Allow Event Creation</strong>
                    <span style={{ fontSize: "12px", color: "var(--color-mute)" }}>
                      Enable organizers creating new events.
                    </span>
                  </div>
                  <label style={{ position: "relative", display: "inline-block", width: "48px", height: "24px" }}>
                    <input
                      type="checkbox"
                      checked={allowEventCreation}
                      onChange={(e) => setAllowEventCreation(e.target.checked)}
                      style={{ opacity: 0, width: 0, height: 0 }}
                    />
                    <span 
                      style={{
                        position: "absolute",
                        cursor: "pointer",
                        top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: allowEventCreation ? "var(--color-primary)" : "var(--color-hairline)",
                        transition: "0.2s",
                        borderRadius: "24px"
                      }}
                    >
                      <span 
                        style={{
                          position: "absolute",
                          content: '""',
                          height: "18px", width: "18px",
                          left: allowEventCreation ? "27px" : "3px",
                          bottom: "3px",
                          backgroundColor: "#fff",
                          transition: "0.2s",
                          borderRadius: "50%"
                        }}
                      />
                    </span>
                  </label>
                </div>

                {/* User Registration Toggle */}
                <div 
                  style={{ 
                    display: "flex", 
                    justifyContent: "space-between", 
                    alignItems: "center", 
                    backgroundColor: "var(--color-surface-card)", 
                    padding: "var(--space-md)", 
                    borderRadius: "var(--radius-sm)", 
                    border: "1px solid var(--color-hairline)" 
                  }}
                >
                  <div>
                    <strong style={{ fontSize: "14px", display: "block" }}>Allow User Registrations</strong>
                    <span style={{ fontSize: "12px", color: "var(--color-mute)" }}>
                      Allow new account creations.
                    </span>
                  </div>
                  <label style={{ position: "relative", display: "inline-block", width: "48px", height: "24px" }}>
                    <input
                      type="checkbox"
                      checked={allowUserRegistration}
                      onChange={(e) => setAllowUserRegistration(e.target.checked)}
                      style={{ opacity: 0, width: 0, height: 0 }}
                    />
                    <span 
                      style={{
                        position: "absolute",
                        cursor: "pointer",
                        top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: allowUserRegistration ? "var(--color-primary)" : "var(--color-hairline)",
                        transition: "0.2s",
                        borderRadius: "24px"
                      }}
                    >
                      <span 
                        style={{
                          position: "absolute",
                          content: '""',
                          height: "18px", width: "18px",
                          left: allowUserRegistration ? "27px" : "3px",
                          bottom: "3px",
                          backgroundColor: "#fff",
                          transition: "0.2s",
                          borderRadius: "50%"
                        }}
                      />
                    </span>
                  </label>
                </div>

                {/* Secondary Marketplace Toggle */}
                <div 
                  style={{ 
                    display: "flex", 
                    justifyContent: "space-between", 
                    alignItems: "center", 
                    backgroundColor: "var(--color-surface-card)", 
                    padding: "var(--space-md)", 
                    borderRadius: "var(--radius-sm)", 
                    border: "1px solid var(--color-hairline)" 
                  }}
                >
                  <div>
                    <strong style={{ fontSize: "14px", display: "block" }}>Secondary Marketplace</strong>
                    <span style={{ fontSize: "12px", color: "var(--color-mute)" }}>
                      Allow ticket listing and resale trading.
                    </span>
                  </div>
                  <label style={{ position: "relative", display: "inline-block", width: "48px", height: "24px" }}>
                    <input
                      type="checkbox"
                      checked={allowSecondaryMarketplace}
                      onChange={(e) => setAllowSecondaryMarketplace(e.target.checked)}
                      style={{ opacity: 0, width: 0, height: 0 }}
                    />
                    <span 
                      style={{
                        position: "absolute",
                        cursor: "pointer",
                        top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: allowSecondaryMarketplace ? "var(--color-primary)" : "var(--color-hairline)",
                        transition: "0.2s",
                        borderRadius: "24px"
                      }}
                    >
                      <span 
                        style={{
                          position: "absolute",
                          content: '""',
                          height: "18px", width: "18px",
                          left: allowSecondaryMarketplace ? "27px" : "3px",
                          bottom: "3px",
                          backgroundColor: "#fff",
                          transition: "0.2s",
                          borderRadius: "50%"
                        }}
                      />
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Blocked Wallets blacklist */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "var(--space-xs)" }}>
              <label style={{ fontSize: "14px", fontWeight: 600 }}>Blocked Wallets Blacklist</label>
              <p className="text-body-sm text-muted" style={{ margin: "0 0 6px 0" }}>
                Active restricted wallets barred from logging in or completing checkout.
              </p>

              {/* Chips container */}
              <div 
                style={{ 
                  display: "flex", 
                  flexWrap: "wrap", 
                  gap: "6px", 
                  padding: "var(--space-sm)", 
                  backgroundColor: "var(--color-surface-card)",
                  border: "1px solid var(--color-hairline)",
                  borderRadius: "var(--radius-sm)",
                  minHeight: "44px",
                  alignItems: "center"
                }}
              >
                {blockedWallets.length === 0 ? (
                  <span className="text-body-sm text-muted" style={{ paddingLeft: "4px" }}>No blocked wallets.</span>
                ) : (
                  blockedWallets.map((wallet) => (
                    <span 
                      key={wallet} 
                      style={{ 
                        display: "inline-flex", 
                        alignItems: "center", 
                        gap: "6px", 
                        padding: "4px 10px", 
                        backgroundColor: "rgba(239, 68, 68, 0.08)", 
                        border: "1px solid rgba(239, 68, 68, 0.2)",
                        color: "var(--color-error)",
                        borderRadius: "16px",
                        fontSize: "13px",
                        fontFamily: "monospace"
                      }}
                    >
                      {wallet.substring(0, 6)}...{wallet.substring(38)}
                      <button
                        type="button"
                        onClick={() => {
                          setBlockedWallets((prev) => prev.filter((w) => w !== wallet));
                        }}
                        style={{
                          background: "none",
                          border: "none",
                          color: "var(--color-error)",
                          cursor: "pointer",
                          fontWeight: "bold",
                          fontSize: "14px",
                          display: "flex",
                          alignItems: "center",
                          padding: 0
                        }}
                        title="Remove"
                      >
                        ×
                      </button>
                    </span>
                  ))
                )}
              </div>

              {/* Input for new blocked wallet */}
              <div style={{ display: "flex", gap: "var(--space-sm)", marginTop: "4px" }}>
                <input
                  type="text"
                  placeholder="Paste wallet address (0x...) to block"
                  value={newBlockedWallet}
                  onChange={(e) => setNewBlockedWallet(e.target.value)}
                  style={{
                    flex: 1,
                    padding: "8px 12px",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--color-hairline)",
                    backgroundColor: "var(--color-surface-card)",
                    color: "var(--color-ink)",
                    fontFamily: "monospace",
                    fontSize: "13px"
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddBlockedWallet();
                    }
                  }}
                />
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleAddBlockedWallet}
                  style={{ fontSize: "13px", padding: "0 16px", height: "36px" }}
                >
                  Add Wallet
                </button>
              </div>
            </div>

            {/* Save Platform Config Button */}
            <div style={{ marginTop: "var(--space-md)", borderTop: "1px solid var(--color-hairline-soft)", paddingTop: "var(--space-md)" }}>
              <button
                type="button"
                className="btn-primary"
                onClick={handleSavePlatformConfig}
                style={{ width: "100%", height: "42px" }}
              >
                Save Platform Configurations
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

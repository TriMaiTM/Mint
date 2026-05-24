"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useWalletAuth } from "@/hooks/use-wallet-auth";

function truncateAddress(address: string): string {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function CopyIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

export function ConnectWalletButton() {
  const {
    user,
    isAuthenticated,
    isLoadingSession,
    isSigningIn,
    error,
    signIn,
    signOut,
  } = useWalletAuth();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  async function handleSignIn() {
    await signIn();
    window.dispatchEvent(new Event("ticketnft-auth-changed"));
  }

  async function handleSignOut() {
    await signOut();
    setDropdownOpen(false);
    window.dispatchEvent(new Event("ticketnft-auth-changed"));
    window.location.href = "/";
  }

  const handleCopyAddress = useCallback(async () => {
    if (!user?.walletAddress) return;
    try {
      await navigator.clipboard.writeText(user.walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = user.walletAddress;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [user?.walletAddress]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }

    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownOpen]);

  // Close dropdown on Escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setDropdownOpen(false);
      }
    }

    if (dropdownOpen) {
      document.addEventListener("keydown", handleEscape);
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [dropdownOpen]);

  const roleBadgeClass =
    user?.role === "ORGANIZER"
      ? "wallet-dropdown-badge wallet-dropdown-badge-organizer"
      : "wallet-dropdown-badge wallet-dropdown-badge-user";

  const networkName = "Sepolia"; // Default network for this project

  return (
    <div className="wallet-actions">
      <ConnectButton.Custom>
        {({
          account,
          chain,
          openAccountModal,
          openChainModal,
          openConnectModal,
          mounted,
        }) => {
          const ready = mounted;
          const connected = ready && !!account && !!chain;

          if (!ready || isLoadingSession) {
            return (
              <button className="btn-secondary" type="button" disabled>
                Loading...
              </button>
            );
          }

          if (!connected) {
            return (
              <button
                className="btn-secondary"
                onClick={openConnectModal}
                type="button"
              >
                Connect Wallet
              </button>
            );
          }

          if (chain.unsupported) {
            return (
              <button
                className="btn-secondary"
                onClick={openChainModal}
                type="button"
              >
                Wrong Network
              </button>
            );
          }

          if (
            !isAuthenticated ||
            user?.walletAddress !== account.address.toLowerCase()
          ) {
            return (
              <button
                className="btn-secondary"
                onClick={handleSignIn}
                type="button"
              >
                {isSigningIn ? "Signing In..." : "Sign In Wallet"}
              </button>
            );
          }

          // Authenticated — show dropdown trigger
          const displayAddr = account.address;
          const initial = displayAddr.slice(2, 4).toUpperCase();

          return (
            <div className="wallet-dropdown-wrapper" ref={dropdownRef}>
              <button
                className="wallet-dropdown-trigger"
                onClick={() => setDropdownOpen((prev) => !prev)}
                type="button"
                aria-expanded={dropdownOpen}
                aria-haspopup="true"
              >
                <span className="wallet-dropdown-avatar">{initial}</span>
                <span className="wallet-dropdown-address">
                  {truncateAddress(displayAddr)}
                </span>
                <ChevronIcon />
              </button>

              {dropdownOpen && (
                <div className="wallet-dropdown-panel" role="menu">
                  {/* Header: full address */}
                  <div className="wallet-dropdown-header">
                    <span
                      className="text-body-sm-strong"
                      style={{ color: "var(--color-ink)" }}
                    >
                      Wallet
                    </span>
                    <button
                      className="wallet-dropdown-full-address"
                      onClick={handleCopyAddress}
                      title="Click to copy"
                      type="button"
                    >
                      {copied ? (
                        <span style={{ color: "var(--color-success-deep)" }}>
                          Copied!
                        </span>
                      ) : (
                        <>
                          {user?.walletAddress ?? displayAddr.toLowerCase()}{" "}
                          <CopyIcon />
                        </>
                      )}
                    </button>
                  </div>

                  {/* Info rows */}
                  <div className="wallet-dropdown-info">
                    <div className="wallet-dropdown-row">
                      <span
                        className="text-caption-md"
                        style={{ color: "var(--color-mute)" }}
                      >
                        Role
                      </span>
                      <span className={roleBadgeClass}>
                        {user?.role ?? "USER"}
                      </span>
                    </div>
                    <div className="wallet-dropdown-row">
                      <span
                        className="text-caption-md"
                        style={{ color: "var(--color-mute)" }}
                      >
                        Network
                      </span>
                      <span
                        className="text-body-sm"
                        style={{ color: "var(--color-ink)" }}
                      >
                        {chain?.name ?? networkName}
                      </span>
                    </div>
                  </div>

                  {/* Links */}
                  <div className="wallet-dropdown-info">
                    <a
                      href="/profile"
                      className="wallet-dropdown-row"
                      style={{
                        color: "var(--color-ink)",
                        textDecoration: "none",
                        padding: "var(--space-xs) 0",
                      }}
                    >
                      <span className="text-body-sm">Profile</span>
                    </a>
                    <a
                      href="/my-tickets"
                      className="wallet-dropdown-row"
                      style={{
                        color: "var(--color-ink)",
                        textDecoration: "none",
                        padding: "var(--space-xs) 0",
                      }}
                    >
                      <span className="text-body-sm">My Tickets</span>
                    </a>
                  </div>

                  {/* Sign out */}
                  <div className="wallet-dropdown-footer">
                    <button
                      className="btn-secondary"
                      onClick={handleSignOut}
                      type="button"
                      style={{ width: "100%" }}
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        }}
      </ConnectButton.Custom>

      {error ? <p className="wallet-error">{error}</p> : null}
    </div>
  );
}

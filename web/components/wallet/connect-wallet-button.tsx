"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useWalletAuth } from "@/hooks/use-wallet-auth";

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

  async function handleSignIn() {
    await signIn();
    window.dispatchEvent(new Event("ticketnft-auth-changed"));
  }

  async function handleSignOut() {
    await signOut();
    window.dispatchEvent(new Event("ticketnft-auth-changed"));
  }

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

          return (
            <button
              className="btn-secondary"
              onClick={openAccountModal}
              type="button"
            >
              {account.displayName}
            </button>
          );
        }}
      </ConnectButton.Custom>

      {isAuthenticated ? (
        <button
          className="wallet-signout"
          onClick={handleSignOut}
          type="button"
        >
          Sign out
        </button>
      ) : null}

      {error ? <p className="wallet-error">{error}</p> : null}
    </div>
  );
}

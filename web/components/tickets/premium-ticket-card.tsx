"use client";

import { useState } from "react";
import { TicketQR } from "@/components/tickets/ticket-qr";
import { ListTicketButton } from "@/components/tickets/list-ticket-button";
import { TransferTicketButton } from "@/components/tickets/transfer-ticket-button";

type PremiumTicketCardProps = {
  ticket: {
    id: string;
    eventId: string;
    tokenId: number;
    status: string;
    isUsed: boolean;
    seatCode?: string | null;
    event: {
      title: string;
      venue: string | null;
      startDate: Date;
      chainId: string | null;
      contractAddress: string | null;
      bannerImage: string | null;
    };
    tier: {
      name: string;
      price: string | number;
      benefits: string | null;
    };
    owner: {
      walletAddress: string;
    };
  };
};

function formatDate(value: Date): string {
  return new Intl.DateTimeFormat("vi-VN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function PremiumTicketCard({ ticket }: PremiumTicketCardProps) {
  const isListed = ticket.status === "LISTED";
  const isUsed = ticket.isUsed;

  return (
    <div
      style={{
        position: "relative",
        background: "linear-gradient(135deg, rgba(20, 20, 25, 0.96) 0%, rgba(10, 10, 12, 0.99) 100%)",
        backdropFilter: "blur(20px)",
        borderRadius: "20px",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        boxShadow: "0 20px 40px -15px rgba(0, 0, 0, 0.6)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        width: "100%",
      }}
    >

      {/* ── Event Banner (Top Section) ── */}
      <div style={{ position: "relative", height: "160px", overflow: "hidden" }}>
        {ticket.event.bannerImage ? (
          <img
            src={ticket.event.bannerImage}
            alt={ticket.event.title}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg, #1f1f1f 0%, #3a3a3a 100%)" }} />
        )}
        
        {/* Glow behind title */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "80px", background: "linear-gradient(0deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 100%)", zIndex: 1 }} />
        
        {/* Ticket Status Badge */}
        <span
          style={{
            position: "absolute",
            top: "12px",
            right: "12px",
            fontSize: "0.75rem",
            fontWeight: "700",
            padding: "4px 10px",
            borderRadius: "20px",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            zIndex: 2,
            backgroundColor: isListed
              ? "rgba(168, 85, 247, 0.25)"
              : isUsed
              ? "rgba(255, 255, 255, 0.1)"
              : "rgba(236, 72, 153, 0.25)",
            color: isListed
              ? "#d8b4fe"
              : isUsed
              ? "rgba(255,255,255,0.6)"
              : "#fbcfe8",
            border: isListed
              ? "1px solid rgba(168, 85, 247, 0.4)"
              : isUsed
              ? "1px solid rgba(255, 255, 255, 0.15)"
              : "1px solid rgba(236, 72, 153, 0.4)",
            backdropFilter: "blur(4px)",
          }}
        >
          {isListed ? "Listed" : isUsed ? "Checked In" : "Valid"}
        </span>
      </div>

      {/* ── Main Details Section ── */}
      <div style={{ padding: "20px", flexGrow: 1, zIndex: 2 }}>
        <p style={{ fontSize: "0.75rem", color: "var(--color-primary, #ec4899)", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          {formatDate(ticket.event.startDate)}
        </p>
        
        <h3 style={{ fontSize: "1.2rem", fontWeight: "700", color: "#ffffff", marginTop: "4px", lineHeight: "1.3" }}>
          {ticket.event.title}
        </h3>

        {/* Chips */}
        <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
          <span style={{ fontSize: "0.75rem", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", padding: "2px 8px", borderRadius: "12px", color: "rgba(255,255,255,0.8)" }}>
            Tier: {ticket.tier.name}
          </span>
          <span style={{ fontSize: "0.75rem", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", padding: "2px 8px", borderRadius: "12px", color: "rgba(255,255,255,0.8)" }}>
            ID #{ticket.tokenId}
          </span>
        </div>

        {/* Info Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "12px",
            marginTop: "16px",
            paddingTop: "16px",
            borderTop: "1px solid rgba(255, 255, 255, 0.05)",
          }}
        >
          <div>
            <p style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.4)", textTransform: "uppercase" }}>Venue</p>
            <p style={{ fontSize: "0.8rem", fontWeight: "600", color: "#ffffff", marginTop: "2px" }}>
              {ticket.event.venue ?? "TBA"}
            </p>
          </div>
          <div>
            <p style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.4)", textTransform: "uppercase" }}>Blockchain</p>
            <p style={{ fontSize: "0.8rem", fontWeight: "600", color: "#ffffff", marginTop: "2px" }}>
              {ticket.event.chainId && Number(ticket.event.chainId) === 11155111 ? "Sepolia Testnet" : `Chain ID: ${ticket.event.chainId ?? "Unknown"}`}
            </p>
          </div>
          <div>
            <p style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.4)", textTransform: "uppercase" }}>Value</p>
            <p style={{ fontSize: "0.8rem", fontWeight: "600", color: "#ffffff", marginTop: "2px" }}>
              {Number(ticket.tier.price).toFixed(3)} POL
            </p>
          </div>
        </div>
      </div>

      {/* ── Perforation (Skeuomorphic Dashed Line + Side Notches) ── */}
      <div style={{ position: "relative", width: "100%", height: "2px", margin: "4px 0" }}>
        {/* Left Notch Punch */}
        <div
          style={{
            position: "absolute",
            left: "-10px",
            top: "-9px",
            width: "20px",
            height: "20px",
            borderRadius: "50%",
            backgroundColor: "var(--color-canvas)", // Page background color
            borderRight: "1px solid rgba(255, 255, 255, 0.08)",
            boxShadow: "inset -4px 0 6px -4px rgba(0,0,0,0.8)",
            zIndex: 10,
          }}
        />
        
        {/* Perforated Dashed Line */}
        <div
          style={{
            width: "calc(100% - 20px)",
            margin: "0 auto",
            borderTop: "2.5px dashed rgba(255, 255, 255, 0.15)",
            height: "1px",
          }}
        />

        {/* Right Notch Punch */}
        <div
          style={{
            position: "absolute",
            right: "-10px",
            top: "-9px",
            width: "20px",
            height: "20px",
            borderRadius: "50%",
            backgroundColor: "var(--color-canvas)", // Page background color
            borderLeft: "1px solid rgba(255, 255, 255, 0.08)",
            boxShadow: "inset 4px 0 6px -4px rgba(0,0,0,0.8)",
            zIndex: 10,
          }}
        />
      </div>

      {/* ── Ticket Stub Section (Bottom) ── */}
      <div
        style={{
          padding: "20px",
          background: "rgba(255, 255, 255, 0.01)",
          borderBottomLeftRadius: "20px",
          borderBottomRightRadius: "20px",
          zIndex: 2,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {isListed ? (
          <div
            style={{
              padding: "20px",
              backgroundColor: "rgba(0, 0, 0, 0.2)",
              borderRadius: "12px",
              border: "1px solid rgba(255, 255, 255, 0.05)",
              width: "100%",
              textAlign: "center",
            }}
          >
            <p style={{ fontSize: "0.85rem", fontWeight: "600", color: "#a855f7" }}>
              Listed on Marketplace
            </p>
            <p style={{ fontSize: "0.75rem", color: "rgba(255, 255, 255, 0.4)", marginTop: "4px" }}>
              QR code hidden while ticket is listed for sale.
            </p>
          </div>
        ) : (
          <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div
              style={{
                background: "#ffffff",
                padding: "10px",
                borderRadius: "12px",
                boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
                display: "inline-block",
                opacity: isUsed ? 0.3 : 1,
                filter: isUsed ? "grayscale(100%)" : "none",
                transition: "all 0.3s ease",
              }}
            >
              <TicketQR
                ticketId={ticket.id}
                eventId={ticket.eventId}
                tokenId={ticket.tokenId}
                ownerAddress={ticket.owner.walletAddress}
              />
            </div>

            {isUsed && (
              <div
                style={{
                  marginTop: "-90px",
                  marginBottom: "40px",
                  transform: "rotate(-12deg)",
                  border: "3px solid #ef4444",
                  borderRadius: "8px",
                  padding: "4px 12px",
                  color: "#ef4444",
                  fontSize: "1.1rem",
                  fontWeight: "900",
                  textTransform: "uppercase",
                  backgroundColor: "rgba(13, 13, 15, 0.95)",
                  boxShadow: "0 0 15px rgba(239, 68, 68, 0.3)",
                  zIndex: 10,
                  letterSpacing: "0.1em",
                }}
              >
                USED / CLAIMED
              </div>
            )}

            {ticket.status === "MINTED" && !isUsed && ticket.event.contractAddress && (
              <div style={{ marginTop: "16px", width: "100%", display: "flex", flexDirection: "column", gap: "8px" }}>
                <ListTicketButton
                  ticketId={ticket.id}
                  tokenId={ticket.tokenId}
                  contractAddress={ticket.event.contractAddress}
                  tierPrice={ticket.tier.price.toString()}
                  tierName={ticket.tier.name}
                />
                <TransferTicketButton
                  ticketId={ticket.id}
                  tokenId={ticket.tokenId}
                  contractAddress={ticket.event.contractAddress}
                  tierName={ticket.tier.name}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

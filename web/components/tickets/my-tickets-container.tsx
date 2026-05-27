"use client";

import { useState } from "react";
import { PremiumTicketCard } from "./premium-ticket-card";
import Link from "next/link";

type TicketData = {
  id: string;
  eventId: string;
  tokenId: number;
  status: string;
  isUsed: boolean;
  seatCode?: string | null;
  createdAt: Date;
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

type MyTicketsContainerProps = {
  tickets: TicketData[];
};

type TabType = "upcoming" | "past" | "listed";

export function MyTicketsContainer({ tickets }: MyTicketsContainerProps) {
  const [activeTab, setActiveTab] = useState<TabType>("upcoming");

  const now = new Date();

  // Categorize tickets
  const upcomingTickets = tickets.filter(
    (t) => !t.isUsed && t.status !== "LISTED" && new Date(t.event.startDate) >= now
  );

  const pastTickets = tickets.filter(
    (t) => t.isUsed || (t.status !== "LISTED" && new Date(t.event.startDate) < now)
  );

  const listedTickets = tickets.filter((t) => t.status === "LISTED");

  const getFilteredTickets = () => {
    switch (activeTab) {
      case "upcoming":
        return upcomingTickets;
      case "past":
        return pastTickets;
      case "listed":
        return listedTickets;
      default:
        return [];
    }
  };

  const filteredTickets = getFilteredTickets();

  const tabItems = [
    { id: "upcoming", label: "Upcoming", count: upcomingTickets.length },
    { id: "past", label: "Past & Collectibles", count: pastTickets.length },
    { id: "listed", label: "Listed", count: listedTickets.length },
  ];

  return (
    <div>
      {/* Tab Navigation */}
      <div
        style={{
          display: "flex",
          gap: "10px",
          marginBottom: "30px",
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          paddingBottom: "12px",
          flexWrap: "wrap",
        }}
      >
        {tabItems.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              style={{
                background: isActive
                  ? "linear-gradient(90deg, rgba(236, 72, 153, 0.15) 0%, rgba(168, 85, 247, 0.15) 100%)"
                  : "transparent",
                border: isActive ? "1px solid rgba(236, 72, 153, 0.4)" : "1px solid transparent",
                borderRadius: "30px",
                padding: "8px 18px",
                color: isActive ? "var(--color-ink)" : "var(--color-mute)",
                fontWeight: isActive ? "600" : "500",
                fontSize: "0.9rem",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                transition: "all 0.2s ease",
                boxShadow: isActive ? "0 0 15px rgba(236, 72, 153, 0.15)" : "none",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.color = "var(--color-ink)";
                  e.currentTarget.style.background = "var(--color-secondary-bg)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.color = "var(--color-mute)";
                  e.currentTarget.style.background = "transparent";
                }
              }}
            >
              <span>{tab.label}</span>
              <span
                style={{
                  fontSize: "0.75rem",
                  background: isActive ? "rgba(236, 72, 153, 0.15)" : "var(--color-secondary-bg)",
                  padding: "2px 8px",
                  borderRadius: "10px",
                  color: isActive ? "var(--color-primary, #e60023)" : "var(--color-mute)",
                  fontWeight: "bold",
                }}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Grid Display */}
      {filteredTickets.length === 0 ? (
        <div
          style={{
            background: "var(--color-surface-soft)",
            border: "1px dashed var(--color-hairline)",
            borderRadius: "16px",
            padding: "60px 20px",
            textAlign: "center",
            color: "var(--color-mute)",
          }}
        >
          <p style={{ fontSize: "1.2rem", fontWeight: "600", color: "var(--color-ink)" }}>
            No tickets found in this section
          </p>
          <p style={{ fontSize: "0.9rem", marginTop: "8px", maxWidth: "400px", margin: "8px auto 0" }}>
            {activeTab === "upcoming" && "You don't have any upcoming tickets yet. Explore events now to grab your first ticket!"}
            {activeTab === "past" && "Used or expired tickets will be displayed here as digital collectibles."}
            {activeTab === "listed" && "Tickets currently listed for sale on the Marketplace will appear here."}
          </p>
          {activeTab === "upcoming" && (
            <Link
              href="/events"
              className="btn-primary"
              style={{ display: "inline-flex", marginTop: "20px", padding: "8px 24px" }}
            >
              Explore Events
            </Link>
          )}
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: "24px",
          }}
        >
          {filteredTickets.map((ticket) => (
            <PremiumTicketCard key={ticket.id} ticket={ticket} />
          ))}
        </div>
      )}
    </div>
  );
}

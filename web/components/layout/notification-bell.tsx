"use client";

import { useState, useEffect, useRef } from "react";
import { useWalletAuth } from "@/hooks/use-wallet-auth";

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
};

export function NotificationBell() {
  const { isAuthenticated } = useWalletAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    if (!isAuthenticated) return;
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const payload = await res.json();
        if (payload.data) {
          setNotifications(payload.data);
          const unread = payload.data.filter((n: NotificationItem) => !n.isRead).length;
          setUnreadCount(unread);
        }
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      fetchNotifications();
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const res = await fetch("/api/notifications/read-all", {
        method: "POST",
      });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);
      }
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      const res = await fetch(`/api/notifications/${id}/read`, {
        method: "POST",
      });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Vừa xong";
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;
    return date.toLocaleDateString("vi-VN", { month: "short", day: "numeric" });
  };

  // Modern modern line-art SVG icons in Ionicon style
  const renderIcon = (type: string) => {
    switch (type) {
      case "PURCHASE":
        return (
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
            <path d="M13 5v2" />
            <path d="M13 17v2" />
            <path d="M13 11v2" />
          </svg>
        );
      case "SALE":
        return (
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect width="20" height="14" x="2" y="5" rx="2" />
            <line x1="2" x2="22" y1="10" y2="10" />
            <path d="M12 13v2" />
          </svg>
        );
      case "TRANSFER":
        return (
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M17 3 21 7 17 11" />
            <path d="M3 7h18" />
            <path d="M7 21 3 17 7 13" />
            <path d="M21 17H3" />
          </svg>
        );
      default:
        return (
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" x2="12" y1="16" y2="12" />
            <line x1="12" x2="12.01" y1="8" y2="8" />
          </svg>
        );
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div ref={dropdownRef} style={{ position: "relative", display: "inline-block" }}>
      {/* Bell Icon Trigger */}
      <button
        onClick={handleToggle}
        style={{
          background: "var(--color-surface-card)",
          border: "1px solid var(--color-hairline)",
          borderRadius: "50%",
          width: "40px",
          height: "40px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: isOpen ? "var(--color-primary)" : "var(--color-mute)",
          cursor: "pointer",
          transition: "all 0.2s ease",
          outline: "none",
          position: "relative",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "var(--color-secondary-bg)";
          e.currentTarget.style.color = "var(--color-ink)";
        }}
        onMouseLeave={(e) => {
          if (!isOpen) {
            e.currentTarget.style.background = "var(--color-surface-card)";
            e.currentTarget.style.color = "var(--color-mute)";
          }
        }}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>

        {unreadCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: "-2px",
              right: "-2px",
              backgroundColor: "var(--color-primary, #e60023)",
              color: "var(--color-on-primary, #ffffff)",
              borderRadius: "50%",
              fontSize: "10px",
              fontWeight: "bold",
              minWidth: "18px",
              height: "18px",
              padding: "0 4px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 0 0 2px var(--color-canvas)",
            }}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Container */}
      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "50px",
            right: "0",
            width: "360px",
            maxHeight: "480px",
            background: "var(--color-surface-elevated)",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--color-hairline)",
            boxShadow: "0 8px 30px rgba(0, 0, 0, 0.08)",
            zIndex: 1000,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "16px",
              borderBottom: "1px solid var(--color-hairline-soft)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <h4 style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: "var(--color-ink)" }}>
              Thông báo
            </h4>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--color-primary, #e60023)",
                  fontSize: "13px",
                  fontWeight: "600",
                  cursor: "pointer",
                  padding: "0",
                  outline: "none",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.textDecoration = "underline";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.textDecoration = "none";
                }}
              >
                Đánh dấu đã đọc
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div
            style={{
              flexGrow: 1,
              overflowY: "auto",
              maxHeight: "360px",
            }}
          >
            {notifications.length === 0 ? (
              <div
                style={{
                  padding: "40px 20px",
                  textAlign: "center",
                  color: "var(--color-ash)",
                }}
              >
                <div style={{ fontSize: "1.5rem", marginBottom: "8px" }}>🔔</div>
                <p style={{ fontSize: "14px", margin: 0 }}>Không có thông báo nào</p>
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() => !item.isRead && handleMarkAsRead(item.id)}
                  style={{
                    padding: "14px 16px",
                    borderBottom: "1px solid var(--color-hairline-soft)",
                    backgroundColor: item.isRead ? "transparent" : "var(--color-surface-soft)",
                    display: "flex",
                    gap: "12px",
                    cursor: item.isRead ? "default" : "pointer",
                    transition: "background 0.2s ease",
                    position: "relative",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "var(--color-secondary-bg)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = item.isRead
                      ? "transparent"
                      : "var(--color-surface-soft)";
                  }}
                >
                  {/* Unread indicator dot */}
                  {!item.isRead && (
                    <div
                      style={{
                        position: "absolute",
                        left: "6px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        width: "6px",
                        height: "6px",
                        borderRadius: "50%",
                        backgroundColor: "var(--color-primary, #e60023)",
                      }}
                    />
                  )}

                  {/* Icon */}
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "50%",
                      backgroundColor: "var(--color-secondary-bg)",
                      border: "1px solid var(--color-hairline)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "var(--color-mute)",
                      flexShrink: 0,
                    }}
                  >
                    {renderIcon(item.type)}
                  </div>

                  {/* Body */}
                  <div style={{ flexGrow: 1, display: "flex", flexDirection: "column", gap: "2px" }}>
                    <div
                      style={{
                        fontSize: "14px",
                        fontWeight: item.isRead ? "500" : "600",
                        color: "var(--color-ink)",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "baseline",
                        gap: "8px",
                      }}
                    >
                      <span>{item.title}</span>
                    </div>
                    <p
                      style={{
                        fontSize: "13px",
                        color: "var(--color-body)",
                        margin: 0,
                        lineHeight: "1.4",
                        wordBreak: "break-word",
                      }}
                    >
                      {item.message}
                    </p>
                    <span
                      style={{
                        fontSize: "11px",
                        color: "var(--color-ash)",
                        marginTop: "4px",
                      }}
                    >
                      {formatTime(item.createdAt)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

        </div>
      )}
    </div>
  );
}

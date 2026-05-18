"use client";

import {
  useState,
  useEffect,
  useCallback,
  createContext,
  useContext,
} from "react";

type ToastType = "success" | "error" | "info";

type Toast = {
  id: string;
  message: string;
  type: ToastType;
};

type ToastContextValue = {
  toast: (message: string, type?: ToastType) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a <ToastProvider>");
  }
  return ctx;
}

const TYPE_STYLES: Record<ToastType, { bg: string; color: string; icon: string }> = {
  success: {
    bg: "var(--color-success-deep)",
    color: "var(--color-on-primary)",
    icon: "✓",
  },
  error: {
    bg: "var(--color-error)",
    color: "var(--color-on-primary)",
    icon: "✕",
  },
  info: {
    bg: "var(--color-canvas)",
    color: "var(--color-ink)",
    icon: "ℹ",
  },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, type: ToastType = "info") => {
      const id = crypto.randomUUID();
      setToasts((prev) => [...prev, { id, message, type }]);
    },
    [],
  );

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}

      {/* Toast stack — bottom-right */}
      <div
        aria-live="polite"
        style={{
          position: "fixed",
          bottom: "var(--space-xl)",
          right: "var(--space-xl)",
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-sm)",
          maxWidth: "380px",
          width: "100%",
          pointerEvents: "none",
        }}
      >
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={remove} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: (id: string) => void;
}) {
  const [exiting, setExiting] = useState(false);
  const style = TYPE_STYLES[toast.type];

  useEffect(() => {
    const timer = setTimeout(() => {
      setExiting(true);
      setTimeout(() => onDismiss(toast.id), 300);
    }, 3000);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  return (
    <div
      role="alert"
      onClick={() => {
        setExiting(true);
        setTimeout(() => onDismiss(toast.id), 300);
      }}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "var(--space-md)",
        padding: "var(--space-md) var(--space-lg)",
        background: style.bg,
        color: style.color,
        borderRadius: "var(--radius-md)",
        boxShadow: "0 4px 24px rgba(0,0,0,0.15)",
        fontSize: "14px",
        fontWeight: 500,
        lineHeight: 1.4,
        cursor: "pointer",
        pointerEvents: "auto",
        opacity: exiting ? 0 : 1,
        transform: exiting ? "translateX(100%)" : "translateX(0)",
        transition: "opacity 0.3s ease, transform 0.3s ease",
      }}
    >
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: "22px",
          height: "22px",
          borderRadius: "var(--radius-full)",
          background: "rgba(255,255,255,0.2)",
          fontSize: "12px",
          fontWeight: 700,
          flexShrink: 0,
        }}
      >
        {style.icon}
      </span>
      <span style={{ flex: 1 }}>{toast.message}</span>
    </div>
  );
}

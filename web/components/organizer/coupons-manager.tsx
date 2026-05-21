"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/toast";

type Coupon = {
  id: string;
  code: string;
  discountType: "PERCENTAGE" | "FIXED";
  discountValue: string;
  maxUses: number | null;
  usedCount: number;
  expiresAt: string | null;
  isActive: boolean;
};

type CouponsManagerProps = {
  eventId: string;
};

export function CouponsManager({ eventId }: CouponsManagerProps) {
  const { toast } = useToast();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState<"PERCENTAGE" | "FIXED">("PERCENTAGE");
  const [discountValue, setDiscountValue] = useState("");
  const [maxUses, setMaxUses] = useState("");
  const [expiresAt, setExpiresAt] = useState("");

  useEffect(() => {
    fetchCoupons();
  }, [eventId]);

  async function fetchCoupons() {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/organizer/events/${eventId}/coupons`);
      const payload = await res.json();
      if (res.ok && payload.data) {
        setCoupons(payload.data);
      } else {
        toast(payload.error ?? "Failed to fetch coupons", "error");
      }
    } catch (err) {
      console.error(err);
      toast("Network error fetching coupons", "error");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim() || !discountValue) {
      toast("Please fill in code and discount value", "error");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch(`/api/organizer/events/${eventId}/coupons`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: code.trim(),
          discountType,
          discountValue: Number(discountValue),
          maxUses: maxUses ? Number(maxUses) : null,
          expiresAt: expiresAt || null,
        }),
      });

      const payload = await res.json();
      if (res.ok && payload.data) {
        toast("Coupon created successfully!", "success");
        setCoupons([payload.data, ...coupons]);
        // Reset form
        setCode("");
        setDiscountValue("");
        setMaxUses("");
        setExpiresAt("");
      } else {
        toast(payload.error ?? "Failed to create coupon", "error");
      }
    } catch (err) {
      console.error(err);
      toast("Network error creating coupon", "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(couponId: string) {
    if (!confirm("Are you sure you want to delete this coupon?")) return;

    try {
      const res = await fetch(`/api/organizer/events/${eventId}/coupons?couponId=${couponId}`, {
        method: "DELETE",
      });

      const payload = await res.json();
      if (res.ok) {
        toast("Coupon deleted!", "success");
        setCoupons(coupons.filter((c) => c.id !== couponId));
      } else {
        toast(payload.error ?? "Failed to delete coupon", "error");
      }
    } catch (err) {
      console.error(err);
      toast("Network error deleting coupon", "error");
    }
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "var(--space-xxl)" }}>
      {/* Creation Form */}
      <div className="card" style={{ padding: "var(--space-xl)" }}>
        <h3 className="text-heading-lg mb-md">Create Coupon</h3>
        <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: "var(--space-md)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "var(--space-md)" }}>
            <div>
              <label className="text-caption-md text-muted" style={{ display: "block", marginBottom: "var(--space-xs)" }}>
                Coupon Code (e.g. EARLYBIRD)
              </label>
              <input
                type="text"
                placeholder="PROMO20"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                style={{
                  width: "100%",
                  padding: "var(--space-sm) var(--space-md)",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--color-hairline)",
                  background: "var(--color-canvas)",
                  color: "inherit",
                }}
                required
              />
            </div>

            <div>
              <label className="text-caption-md text-muted" style={{ display: "block", marginBottom: "var(--space-xs)" }}>
                Discount Type
              </label>
              <select
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value as any)}
                style={{
                  width: "100%",
                  padding: "var(--space-sm) var(--space-md)",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--color-hairline)",
                  background: "var(--color-canvas)",
                  color: "inherit",
                }}
              >
                <option value="PERCENTAGE">Percentage (%)</option>
                <option value="FIXED">Fixed Amount (ETH)</option>
              </select>
            </div>

            <div>
              <label className="text-caption-md text-muted" style={{ display: "block", marginBottom: "var(--space-xs)" }}>
                Discount Value {discountType === "PERCENTAGE" ? "(%)" : "(ETH)"}
              </label>
              <input
                type="number"
                step="any"
                placeholder={discountType === "PERCENTAGE" ? "20" : "0.01"}
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                style={{
                  width: "100%",
                  padding: "var(--space-sm) var(--space-md)",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--color-hairline)",
                  background: "var(--color-canvas)",
                  color: "inherit",
                }}
                required
              />
            </div>

            <div>
              <label className="text-caption-md text-muted" style={{ display: "block", marginBottom: "var(--space-xs)" }}>
                Max Usage (Optional)
              </label>
              <input
                type="number"
                placeholder="Unlimited"
                value={maxUses}
                onChange={(e) => setMaxUses(e.target.value)}
                style={{
                  width: "100%",
                  padding: "var(--space-sm) var(--space-md)",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--color-hairline)",
                  background: "var(--color-canvas)",
                  color: "inherit",
                }}
              />
            </div>

            <div>
              <label className="text-caption-md text-muted" style={{ display: "block", marginBottom: "var(--space-xs)" }}>
                Expiry Date (Optional)
              </label>
              <input
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                style={{
                  width: "100%",
                  padding: "var(--space-sm) var(--space-md)",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--color-hairline)",
                  background: "var(--color-canvas)",
                  color: "inherit",
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={isSubmitting}
            style={{ alignSelf: "flex-end", marginTop: "var(--space-sm)" }}
          >
            {isSubmitting ? "Creating..." : "Create Coupon"}
          </button>
        </form>
      </div>

      {/* Coupons List */}
      <div>
        <h3 className="text-heading-lg mb-md">Active Coupons</h3>
        {isLoading ? (
          <p className="text-body-md text-muted">Loading coupons...</p>
        ) : coupons.length === 0 ? (
          <p className="text-body-md text-muted">No coupons created yet for this event.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-md)" }}>
            {coupons.map((coupon) => (
              <div
                key={coupon.id}
                className="card"
                style={{
                  padding: "var(--space-md) var(--space-lg)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "var(--space-md)",
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <span
                    style={{
                      fontFamily: "monospace",
                      fontWeight: "bold",
                      fontSize: "1.1rem",
                      backgroundColor: "rgba(230, 0, 35, 0.1)",
                      color: "var(--color-primary)",
                      padding: "4px 8px",
                      borderRadius: "6px",
                      marginRight: "var(--space-md)",
                    }}
                  >
                    {coupon.code}
                  </span>
                  <span className="text-body-sm" style={{ marginRight: "var(--space-md)" }}>
                    Discount:{" "}
                    <strong>
                      {coupon.discountType === "PERCENTAGE"
                        ? `${coupon.discountValue}%`
                        : `${Number(coupon.discountValue).toFixed(4)} ETH`}
                    </strong>
                  </span>
                  <span className="text-body-sm text-muted">
                    Usage:{" "}
                    <strong>
                      {coupon.usedCount} / {coupon.maxUses ?? "∞"}
                    </strong>
                  </span>
                  {coupon.expiresAt && (
                    <span className="text-body-sm text-muted" style={{ marginLeft: "var(--space-md)" }}>
                      Expires: {new Date(coupon.expiresAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(coupon.id)}
                  className="btn-secondary"
                  style={{
                    padding: "4px 12px",
                    color: "var(--color-error)",
                    borderColor: "var(--color-error)",
                    borderRadius: "8px",
                    fontSize: "0.85rem",
                  }}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

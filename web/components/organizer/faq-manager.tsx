"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/toast";

type FAQItem = {
  id: string;
  question: string;
  answer: string;
};

type FaqManagerProps = {
  eventId: string;
};

export function FaqManager({ eventId }: FaqManagerProps) {
  const { toast } = useToast();
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");

  useEffect(() => {
    fetchFaqs();
  }, [eventId]);

  async function fetchFaqs() {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/organizer/events/${eventId}/faq`);
      const payload = await res.json();
      if (res.ok && payload.data) {
        setFaqs(payload.data);
      } else {
        toast(payload.error ?? "Error loading FAQ list", "error");
      }
    } catch (err) {
      console.error(err);
      toast("Network error while loading FAQ", "error");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!question.trim() || !answer.trim()) {
      toast("Please fill in both question and answer", "error");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch(`/api/organizer/events/${eventId}/faq`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: question.trim(),
          answer: answer.trim(),
        }),
      });

      const payload = await res.json();
      if (res.ok && payload.data) {
        toast("FAQ added successfully!", "success");
        setFaqs([...faqs, payload.data]);
        // Reset form
        setQuestion("");
        setAnswer("");
      } else {
        toast(payload.error ?? "Error creating FAQ", "error");
      }
    } catch (err) {
      console.error(err);
      toast("Network error while adding FAQ", "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(faqId: string) {
    if (!confirm("Are you sure you want to delete this FAQ?")) return;

    try {
      const res = await fetch(`/api/organizer/events/${eventId}/faq?faqId=${faqId}`, {
        method: "DELETE",
      });

      const payload = await res.json();
      if (res.ok) {
        toast("FAQ deleted successfully!", "success");
        setFaqs(faqs.filter((item) => item.id !== faqId));
      } else {
        toast(payload.error ?? "Error deleting FAQ", "error");
      }
    } catch (err) {
      console.error(err);
      toast("Network error while deleting FAQ", "error");
    }
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "var(--space-xxl)" }}>
      {/* Creation Form */}
      <div className="card" style={{ padding: "var(--space-xl)" }}>
        <h3 className="text-heading-lg mb-md">Add Frequently Asked Question (FAQ)</h3>
        <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: "var(--space-md)" }}>
          <div>
            <label className="text-caption-md text-muted" style={{ display: "block", marginBottom: "var(--space-xs)" }}>
              Question (e.g. "Is parking available at the venue?")
            </label>
            <input
              type="text"
              placeholder="Can I refund or transfer my ticket to someone else?"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
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
              Answer
            </label>
            <textarea
              placeholder="You cannot get a cash refund, but you can easily transfer or gift your NFT ticket directly from 'My Tickets' via MetaMask..."
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              rows={4}
              style={{
                width: "100%",
                padding: "var(--space-sm) var(--space-md)",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--color-hairline)",
                background: "var(--color-canvas)",
                color: "inherit",
                resize: "vertical",
              }}
              required
            />
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={isSubmitting}
            style={{ alignSelf: "flex-start", marginTop: "var(--space-xs)" }}
          >
            {isSubmitting ? "Adding..." : "➕ Add FAQ"}
          </button>
        </form>
      </div>

      {/* List */}
      <div className="card" style={{ padding: "var(--space-xl)" }}>
        <h3 className="text-heading-lg mb-md">Current FAQ List</h3>

        {isLoading ? (
          <p className="text-body-md text-muted">Loading FAQs...</p>
        ) : faqs.length === 0 ? (
          <p className="text-body-md text-muted">No FAQs have been set up for this event yet.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-md)" }}>
            {faqs.map((item) => (
              <div
                key={item.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  padding: "var(--space-md)",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--color-hairline-soft)",
                  background: "var(--color-surface-soft)",
                  gap: "var(--space-md)"
                }}
              >
                <div style={{ flex: 1 }}>
                  <p className="text-body-strong" style={{ fontWeight: "600" }}>❓ {item.question}</p>
                  <p className="text-body-sm text-muted mt-xs" style={{ whiteSpace: "pre-line", paddingLeft: "18px" }}>
                    {item.answer}
                  </p>
                </div>
                <button
                  className="btn-tertiary"
                  onClick={() => handleDelete(item.id)}
                  style={{
                    color: "var(--color-error-deep)",
                    padding: "var(--space-xs)",
                    fontSize: "13px",
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

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
        toast(payload.error ?? "Lỗi khi tải danh sách FAQ", "error");
      }
    } catch (err) {
      console.error(err);
      toast("Lỗi kết nối mạng khi tải FAQ", "error");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!question.trim() || !answer.trim()) {
      toast("Vui lòng điền đầy đủ câu hỏi và câu trả lời", "error");
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
        toast("Thêm câu hỏi FAQ thành công!", "success");
        setFaqs([...faqs, payload.data]);
        // Reset form
        setQuestion("");
        setAnswer("");
      } else {
        toast(payload.error ?? "Lỗi khi tạo FAQ", "error");
      }
    } catch (err) {
      console.error(err);
      toast("Lỗi kết nối mạng khi thêm FAQ", "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(faqId: string) {
    if (!confirm("Bạn có chắc chắn muốn xóa câu hỏi này không?")) return;

    try {
      const res = await fetch(`/api/organizer/events/${eventId}/faq?faqId=${faqId}`, {
        method: "DELETE",
      });

      const payload = await res.json();
      if (res.ok) {
        toast("Đã xóa câu hỏi FAQ!", "success");
        setFaqs(faqs.filter((item) => item.id !== faqId));
      } else {
        toast(payload.error ?? "Lỗi khi xóa FAQ", "error");
      }
    } catch (err) {
      console.error(err);
      toast("Lỗi kết nối mạng khi xóa FAQ", "error");
    }
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "var(--space-xxl)" }}>
      {/* Creation Form */}
      <div className="card" style={{ padding: "var(--space-xl)" }}>
        <h3 className="text-heading-lg mb-md">Thêm câu hỏi thường gặp (FAQ)</h3>
        <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: "var(--space-md)" }}>
          <div>
            <label className="text-caption-md text-muted" style={{ display: "block", marginBottom: "var(--space-xs)" }}>
              Câu hỏi (Ví dụ: "Sự kiện có bãi đỗ xe không?")
            </label>
            <input
              type="text"
              placeholder="Tôi có thể hoàn vé hoặc chuyển nhượng cho người khác không?"
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
              Câu trả lời
            </label>
            <textarea
              placeholder="Bạn không thể hoàn trả tiền mặt nhưng hoàn toàn có thể chuyển nhượng/tặng vé NFT trực tiếp trên trang 'Vé của tôi' thông qua ví điện tử MetaMask..."
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
            {isSubmitting ? "Đang xử lý..." : "➕ Thêm FAQ"}
          </button>
        </form>
      </div>

      {/* List */}
      <div className="card" style={{ padding: "var(--space-xl)" }}>
        <h3 className="text-heading-lg mb-md">Danh sách FAQs hiện tại</h3>

        {isLoading ? (
          <p className="text-body-md text-muted">Đang tải FAQ...</p>
        ) : faqs.length === 0 ? (
          <p className="text-body-md text-muted">Chưa có câu hỏi thường gặp nào được thiết lập cho sự kiện này.</p>
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
                  Xóa
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

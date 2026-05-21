"use client";

import { useToast } from "@/components/ui/toast";

type TicketData = {
  tokenId: number;
  status: string;
  isUsed: boolean;
  createdAt: string | Date;
  tier: {
    name: string;
    price: any;
  };
  owner: {
    walletAddress: string;
    name: string | null;
    email: string | null;
  };
};

type ExportCsvButtonProps = {
  tickets: TicketData[];
  eventTitle: string;
};

export function ExportCsvButton({ tickets, eventTitle }: ExportCsvButtonProps) {
  const { toast } = useToast();

  function handleExport() {
    try {
      if (tickets.length === 0) {
        toast("Không có vé nào để xuất", "error");
        return;
      }

      // CSV Headers
      const headers = [
        "Token ID",
        "Hạng vé (Tier)",
        "Giá vé (POL)",
        "Địa chỉ ví (Wallet)",
        "Họ tên (Name)",
        "Email",
        "Trạng thái (Status)",
        "Đã check-in (Checked In)",
        "Ngày mua (Purchase Date)"
      ];

      // CSV Rows
      const rows = tickets.map((t) => [
        t.tokenId,
        t.tier.name,
        Number(t.tier.price).toFixed(4),
        t.owner.walletAddress,
        t.owner.name ?? "",
        t.owner.email ?? "",
        t.status,
        t.isUsed ? "Yes" : "No",
        new Date(t.createdAt).toLocaleString("vi-VN")
      ]);

      // Combine headers and rows
      const csvContent = [
        headers.join(","),
        ...rows.map((row) =>
          row
            .map((val) => {
              const strVal = String(val).replace(/"/g, '""');
              return `"${strVal}"`;
            })
            .join(",")
        )
      ].join("\n");

      // Create blob with UTF-8 BOM (0xEF, 0xBB, 0xBF) to support Vietnamese diacritics in Excel
      const bom = new Uint8Array([0xef, 0xbb, 0xbf]);
      const blob = new Blob([bom, csvContent], {
        type: "text/csv;charset=utf-8;",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      
      const cleanTitle = eventTitle.toLowerCase().replace(/[^a-z0-9]+/g, "_");
      link.setAttribute("download", `attendees_${cleanTitle}_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast("Xuất danh sách CSV thành công!", "success");
    } catch (err) {
      console.error("CSV Export error:", err);
      toast("Lỗi khi xuất danh sách CSV", "error");
    }
  }

  return (
    <button className="btn-secondary" onClick={handleExport} style={{ display: "inline-flex", alignItems: "center", gap: "var(--space-xs)" }}>
    Xuất danh sách (CSV)
    </button>
  );
}

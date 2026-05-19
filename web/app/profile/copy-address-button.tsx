"use client";

import { useToast } from "@/components/ui/toast";

type CopyAddressButtonProps = {
  address: string;
};

export function CopyAddressButton({ address }: CopyAddressButtonProps) {
  const { toast } = useToast();

  function handleCopy() {
    navigator.clipboard.writeText(address);
    toast("Address copied to clipboard!", "success");
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="btn-icon-circular"
      title="Copy wallet address"
      aria-label="Copy wallet address"
      style={{
        width: "32px",
        height: "32px",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "14px",
        cursor: "pointer",
      }}
    >
      📋
    </button>
  );
}

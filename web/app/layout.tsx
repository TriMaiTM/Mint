import type { Metadata } from "next";
import "@rainbow-me/rainbowkit/styles.css";
import "./globals.css";
import { Providers } from "./providers";
import { ToastProvider } from "@/components/ui/toast";

export const metadata: Metadata = {
  title: "TicketNFT | Web3 Event Ticketing",
  description:
    "Discover events, buy NFT tickets, and trade on the marketplace.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <ToastProvider>{children}</ToastProvider>
        </Providers>
      </body>
    </html>
  );
}

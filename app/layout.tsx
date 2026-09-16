import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pulsar Bridge",
  description: "Wallet-connected dashboard for tracking fiat-to-Stellar deposit transactions in real time.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

import type { Metadata } from "next";
import "./globals.css";
import "@rainbow-me/rainbowkit/styles.css";
import Providers from "@/components/Providers";

export const metadata: Metadata = {
  title: "CrowdFund | Decentralized Crowdfunding on Ethereum",
  description: "A premium, trustless crowdfunding protocol. Launch campaigns, raise funds, and contribute globally with zero fees.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
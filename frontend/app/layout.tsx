import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";

const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Markout — MEV protection by mean reversion",
  description:
    "Uniswap v4 hook: swaps fill at 3 bps while a 20 bps bond is escrowed for 21 s. Price reverts → bond refunded. Price sustains → bond donated to LPs. Live on Sepolia.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={mono.variable}>
      <body>{children}</body>
    </html>
  );
}

import type { Metadata } from "next";
import { Fraunces, Hanken_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { MarkoutProvider } from "@/lib/markout";

const display = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "900"],
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});

const sans = Hanken_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://markout-nine.vercel.app"),
  title: "Markout: the pool that remembers",
  description:
    "A Uniswap v4 hook on the canonical Sepolia PoolManager. Each swap is marked 24 s later: if ≥50% of its own impact reverted, the 20 bps bond returns to the trader at settle; if it stayed, in-range LPs keep it. Any router. No partner integrations.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable} ${mono.variable}`}>
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          backgroundColor: "#faf8f2",
          color: "#191710",
          fontFamily: "var(--font-sans), system-ui, sans-serif",
        }}
      >
        <MarkoutProvider>{children}</MarkoutProvider>
      </body>
    </html>
  );
}

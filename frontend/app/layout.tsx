import type { Metadata } from "next";
import { IBM_Plex_Mono, Manrope, Newsreader } from "next/font/google";
import "./globals.css";
import { MarkoutProvider } from "@/lib/markout";

const display = Newsreader({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});

const sans = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-sans",
  display: "swap",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://markout-nine.vercel.app"),
  title: "Markout: the pool that remembers",
  description:
    "A Uniswap v4 hook on the canonical Sepolia PoolManager. Two lanes on one hook-local 24 s memory: instant spot swaps with a live-quoted reversion-insurance premium (settled history prices it), and opt-in 24 s batch epochs that net opposing orders at the epoch TWAP. If ≥50% of a swap's own impact reverted, the premium returns at settle; if it stayed, in-range LPs keep it. Any router. No partner integrations.",
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
          backgroundColor: "#f7f6f2",
          color: "#181817",
          fontFamily: "var(--font-sans), system-ui, sans-serif",
        }}
      >
        <MarkoutProvider>{children}</MarkoutProvider>
      </body>
    </html>
  );
}

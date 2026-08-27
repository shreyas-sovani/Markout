"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useMarkout } from "@/lib/markout";

/**
 * Injected-wallet connect control built on lib/wallet.ts (no wagmi). Renders
 * the plain disconnected button until mount so SSR and the first client
 * render agree, then flips to the address pill once a wallet reconnects.
 */
export function Connect() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const { address, onConnect, connBusy } = useMarkout();
  const short = address ? `${address.slice(0, 6)}…${address.slice(-4)}` : "";

  if (!mounted || !address) {
    return (
      <Button size="sm" disabled={connBusy || !mounted} onClick={() => void onConnect()}>
        {connBusy ? "Connecting…" : "Connect Wallet"}
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" title="Connected">
        <span className="h-1.5 w-1.5 rounded-full bg-brand animate-pulseSoft" />
        <span className="font-mono text-[12.5px] tabular-nums">{short}</span>
      </Button>
    </div>
  );
}

/** Full disconnect lives with the wallet extension; the pill is enough here. */
export function Disconnect() {
  const { address } = useMarkout();
  if (!address) return null;
  return null;
}

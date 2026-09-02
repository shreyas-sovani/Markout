"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useMarkout } from "@/lib/markout";

/**
 * Injected-wallet connect control built on lib/wallet.ts (no wagmi). Renders
 * the plain disconnected button until mount so SSR and the first client
 * render agree, then flips to an address pill with a dropdown: copy address,
 * change wallet (extension account switcher), disconnect.
 */
export function Connect() {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  const { address, onConnect, connBusy, onDisconnect, onSwitchAccount } = useMarkout();
  const short = address ? `${address.slice(0, 6)}…${address.slice(-4)}` : "";

  if (!mounted || !address) {
    return (
      <Button size="sm" disabled={connBusy || !mounted} onClick={() => void onConnect()}>
        {connBusy ? "Connecting…" : "Connect Wallet"}
      </Button>
    );
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <div ref={menuRef} className="relative">
      <Button
        variant="outline"
        size="sm"
        title="Wallet"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="size-1.5 rounded-full bg-sage animate-pulseSoft" />
        <span className="font-mono text-[12.5px] tabular-nums">{short}</span>
        <span className="text-[9px] text-faint">{open ? "↑" : "↓"}</span>
      </Button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-xl2 border border-line bg-card p-1.5 shadow-lift"
        >
          <div className="truncate border-b border-line px-3 py-2.5 font-mono text-[10px] tabular-nums text-muted">
            {address}
          </div>
          <button
            role="menuitem"
            className="block w-full rounded-lg px-3 py-2.5 text-left font-sans text-[12.5px] text-ink transition-colors hover:bg-secondary"
            onClick={() => void copy()}
          >
            {copied ? "Copied ✓" : "Copy address"}
          </button>
          <button
            role="menuitem"
            className="block w-full rounded-lg px-3 py-2.5 text-left font-sans text-[12.5px] text-ink transition-colors hover:bg-secondary"
            onClick={() => {
              setOpen(false);
              void onSwitchAccount();
            }}
          >
            Change wallet…
          </button>
          <button
            role="menuitem"
            className="block w-full rounded-lg px-3 py-2.5 text-left font-sans text-[12.5px] text-rose transition-colors hover:bg-secondary"
            onClick={() => {
              setOpen(false);
              onDisconnect();
            }}
          >
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
}

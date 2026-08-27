"use client";

import { useMarkout } from "@/lib/markout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

/**
 * Prompt to switch the wallet to Sepolia, shown only when a wallet is
 * connected on another chain. Reads still work (they use the fixed RPC
 * fallback transport, not the wallet); writes would land on the wrong chain.
 */
export function NetworkBanner() {
  const { wrongChain, switchNetwork } = useMarkout();
  if (!wrongChain) return null;

  return (
    <Card className="mb-6 animate-rise border-rose/40 bg-rose/[0.06]">
      <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="text-[13.5px] leading-relaxed text-ink-soft">
          <span className="font-semibold text-rose">Wrong network.</span> Your wallet is on a
          different chain. Switch to <span className="font-semibold text-ink">Sepolia</span> to
          swap, settle, or claim; the readings below are already live.
        </div>
        <Button size="sm" className="shrink-0" onClick={() => void switchNetwork()}>
          Switch to Sepolia
        </Button>
      </CardContent>
    </Card>
  );
}

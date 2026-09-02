"use client";

import { useMarkout } from "@/lib/markout";
import { MemoryTape } from "@/components/MemoryTape";
import { Badge } from "@/components/ui/badge";
import { formatTokens } from "@/lib/contracts";

/**
 * The landing centerpiece: the live memory tape, no wallet needed. Reads
 * slot0 + the trace recorder from the provider against the canonical Sepolia
 * pool — the product itself, not a picture of it.
 */
export function LandingTape() {
  const m = useMarkout();
  const hasTrace = m.trace.length > 1;

  return (
    <div className="overflow-hidden rounded-[1.75rem] border border-line bg-card shadow-lift">
      <div className="flex items-center justify-between border-b border-line bg-ink px-5 py-3.5">
        <span className="font-mono text-[9.5px] font-medium uppercase tracking-[0.14em] text-canvas/60">
          Live memory / MDA · MDB
        </span>
        <Badge variant="brand" className="border-white/10 bg-white/[0.06] text-brand-bright">
          <span className={`size-1 rounded-full ${m.rpcOk ? "bg-brand-bright animate-pulseSoft" : "bg-rose"}`} />
          {m.rpcOk ? "REC · Sepolia" : "RPC degraded"}
        </Badge>
      </div>

      <div className="surface-grid px-3 pb-3 pt-4 md:px-5">
        {hasTrace ? (
          <MemoryTape
            trace={m.trace}
            chainNow={m.chainNow}
            pre={null}
            post={null}
            windowAvg={null}
            bondTime={0n}
            settleAfter={0n}
            outcome={-1}
          />
        ) : (
          <div className="grid h-[220px] place-items-center">
            <span className="font-mono text-[11.5px] text-faint">
              {m.rpcOk ? "warming up — reading slot0 from Sepolia…" : "waiting for an RPC…"}
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-2 border-t border-line bg-secondary/55 px-5 py-4 font-mono text-[10px] tabular-nums text-ink-soft md:grid-cols-4">
        <span>
          price {m.price ? m.price.toFixed(5) : "…"} <span className="text-faint">MDA/MDB</span>
        </span>
        <span>
          tick {m.liveTick !== null ? m.liveTick : "…"}
        </span>
        <span className="text-brand-dim">
          {m.traction
            ? `${formatTokens(m.traction.a0 + m.traction.a1, 3)} paid to LPs`
            : "LP dividend…"}
        </span>
        <span className="text-faint">
          {m.traction ? `${m.traction.events} flush${m.traction.events === 1 ? "" : "es"}` : ""}
        </span>
      </div>
    </div>
  );
}

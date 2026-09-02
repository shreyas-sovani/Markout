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
    <div className="panel overflow-hidden bg-card">
      <div className="flex items-center justify-between border-b border-edge px-4 py-2.5">
        <span className="font-sans text-[11px] font-bold uppercase tracking-[0.16em] text-muted">
          Live memory tape · MDA / MDB
        </span>
        <Badge variant="brand" className="gap-1 px-1.5 py-0 text-[9px]">
          <span className={`h-1 w-1 rounded-full ${m.rpcOk ? "bg-brand animate-pulseSoft" : "bg-rose"}`} />
          {m.rpcOk ? "REC · Sepolia" : "RPC degraded"}
        </Badge>
      </div>

      <div className="px-3 pb-2 pt-3">
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

      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-t border-edge bg-secondary/40 px-4 py-2.5 font-mono text-[10.5px] tabular-nums text-ink-soft">
        <span>
          price {m.price ? m.price.toFixed(5) : "…"} <span className="text-faint">MDA/MDB</span>
        </span>
        <span>
          tick {m.liveTick !== null ? m.liveTick : "…"}
        </span>
        <span className="text-brand">
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

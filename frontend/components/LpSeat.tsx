"use client";

import { useMarkout } from "@/lib/markout";
import { Button } from "@/components/ui/button";
import { formatTokens, HOOK, POOL_MANAGER } from "@/lib/contracts";

/**
 * The LP seat: what a liquidity provider in this pool actually receives.
 * Pool-wide, read-only except the permissionless flush — in-range liquidity
 * (PoolManager extsload), the pending donation bucket, and total flushed.
 */
export function LpSeat() {
  const m = useMarkout();
  const hasPending = m.pending0 !== null && (m.pending0 > 0n || (m.pending1 ?? 0n) > 0n);

  return (
    <div className="panel mt-5 overflow-hidden bg-card">
      <div className="tape flex flex-wrap items-center justify-between gap-2 border-b border-edge px-6 py-3">
        <span>The LP seat — this is the dividend</span>
        <span className="font-mono text-[10.5px] text-faint">
          sustained moves pay whoever is in range
        </span>
      </div>

      <div className="grid gap-px bg-edge sm:grid-cols-2 lg:grid-cols-4">
        <SeatStat
          label="in-range liquidity"
          value={m.poolLiquidity !== null ? formatTokens(m.poolLiquidity, 0) : "…"}
          sub="pool-wide L · live from the PoolManager"
        />
        <SeatStat
          label="pending dividend"
          value={
            m.pending0 !== null
              ? hasPending
                ? `${formatTokens(m.pending0, 3)} MDB${(m.pending1 ?? 0n) > 0n ? ` + ${formatTokens(m.pending1!, 3)} MDA` : ""}`
                : "0 — nothing waiting"
              : "…"
          }
          sub="forfeited bonds, waiting for a flush"
          accent={hasPending}
        />
        <SeatStat
          label="flushed to LPs · all time"
          value={m.traction ? formatTokens(m.traction.a0 + m.traction.a1, 3) : "…"}
          sub={m.traction ? `${m.traction.events} donation${m.traction.events === 1 ? "" : "s"} settled in` : "reading…"}
        />
        <SeatStat
          label="current tick"
          value={m.liveTick !== null ? String(m.liveTick) : "…"}
          sub={`price ${m.price ? m.price.toFixed(5) : "…"} MDA/MDB`}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4">
        <p className="max-w-xl font-sans text-[12.5px] leading-relaxed text-muted">
          Every sustained one-shot move forfeits its premium — credited to in-range LPs in the settle transaction itself while liquidity exists; this bucket only holds the L = 0 deferral.{" "}
          <span className="text-ink">
            <code className="font-mono text-[11.5px]">flushDonation</code> pays it to in-range
            liquidity through v4&apos;s own donate path
          </span>{" "}
          — permissionless, so anyone can trigger it. Honest limit: the flush pays whoever is in
          range at that moment, not the LPs who carried the inventory through the move.
        </p>
        {m.address && !m.wrongChain ? (
          <Button
            variant={hasPending ? "default" : "outline"}
            disabled={m.busy !== null || !hasPending}
            onClick={() => void m.onFlush()}
          >
            {m.busy === "flush" ? "Flushing…" : hasPending ? "Flush pending → in-range LPs" : "Nothing to flush"}
          </Button>
        ) : (
          <span className="font-mono text-[10.5px] text-faint">
            hook {HOOK.slice(0, 6)}…{HOOK.slice(-4)} · PM {POOL_MANAGER.slice(0, 6)}…{POOL_MANAGER.slice(-4)}
          </span>
        )}
      </div>
    </div>
  );
}

function SeatStat({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub: string;
  accent?: boolean;
}) {
  return (
    <div className="bg-card px-6 py-4">
      <div className="font-sans text-[10px] font-bold uppercase tracking-[0.14em] text-muted">
        {label}
      </div>
      <div
        className={`mt-1.5 font-mono text-[17px] font-semibold tabular-nums ${accent ? "text-brand" : "text-ink"}`}
      >
        {value}
      </div>
      <div className="mt-0.5 font-sans text-[10.5px] text-faint">{sub}</div>
    </div>
  );
}

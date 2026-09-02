"use client";

import { useState } from "react";
import { useMarkout } from "@/lib/markout";
import { Button } from "@/components/ui/button";
import { formatTokens } from "@/lib/contracts";

/**
 * The batch lane: opt-in 24-second epochs on the SAME clock the oracle
 * uses. Orders take explicit custody in the hook (cancellable until
 * clear); anyone clears after the epoch ends; opposing orders net and the
 * residual executes as one bonded spot swap; every order on a side fills
 * at one uniform price — the epoch TWAP clamped by realized execution.
 */
export function BatchPanel() {
  const m = useMarkout();
  const [amtStr, setAmtStr] = useState("0.5");
  const a = m.address;
  const b = m.batch;

  const amt = (() => {
    try {
      const v = BigInt(Math.round(parseFloat(amtStr || "0") * 1e18));
      return v > 0n ? v : null;
    } catch {
      return null;
    }
  })();

  const secondsLeft =
    b && m.chainNow > 0n && b.endsAt > m.chainNow ? Number(b.endsAt - m.chainNow) : 0;
  const epochDone = b !== null && secondsLeft === 0;

  if (!a || m.wrongChain) return null;

  const clearableEpoch = b ? b.epoch - 1n : null;

  return (
    <div id="batch-panel" className="panel mt-5 overflow-hidden bg-card p-0">
      <div className="tape flex flex-wrap items-center justify-between gap-2 border-b border-line px-6 py-3.5">
        <span>Batch lane — one 24 s epoch, one price</span>
        <span className="font-mono text-[10.5px] text-faint">
          opt-in · nets opposing orders · not an order book auction
        </span>
      </div>

      <div className="grid gap-px bg-line sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="epoch"
          value={b ? `#${b.epoch.toString()}` : "…"}
          sub={epochDone ? "closed — clearable" : `closes in ${secondsLeft}s · chain time`}
          accent={epochDone}
        />
        <Stat label="queued buys (MDB in)" value={b ? formatTokens(b.buy0, 3) : "…"} sub="want MDA out" />
        <Stat label="queued sells (MDA in)" value={b ? formatTokens(b.sell1, 3) : "…"} sub="want MDB out" />
        <Stat label="orders" value={b ? b.count.toString() : "…"} sub={`cap 100 · your live: ${m.myOrders.length}`} />
      </div>

      <div className="grid gap-8 px-6 py-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:px-8 lg:py-8">
        <div>
          <div className="eyebrow">Queue an order (explicit custody)</div>
          <input
            className="mt-2 w-full rounded-xl border border-line bg-secondary/55 px-4 py-3 font-mono text-[20px] tabular-nums text-ink outline-none placeholder:text-faint focus:border-brand focus:bg-card focus:ring-4 focus:ring-brand/10"
            value={amtStr}
            onChange={(e) => setAmtStr(e.target.value)}
            placeholder="0.5"
            inputMode="decimal"
            aria-label="batch order size"
          />
          <div className="mt-3 grid grid-cols-2 gap-2.5">
            <Button
              variant="outline"
              disabled={m.busy !== null || !amt || epochDone}
              onClick={() => amt && void m.onBatchPlace(true, amt)}
            >
              Buy MDA (queue MDB)
            </Button>
            <Button
              variant="outline"
              disabled={m.busy !== null || !amt || epochDone}
              onClick={() => amt && void m.onBatchPlace(false, amt)}
            >
              Buy MDB (queue MDA)
            </Button>
          </div>
          <Button className="mt-2.5 w-full" disabled={m.busy !== null} onClick={() => void m.demoBatchNet()}>
            {m.pilot === "batch" || m.busy === "demo" ? "Running…" : "Demo: net a buy + paired sell"}
          </Button>
          <p className="note mt-3">
            Deposit leaves your wallet into the hook until the epoch clears; cancel any time
            before clear. Everyone on a side gets the SAME rate. Honest limits: a lone order is a
            one-epoch TWAP, not a CoW auction; unmatched leftover is still a sandwichable spot
            swap with an unbounded price limit. Cancelled orders do not move the TWAP.
          </p>
        </div>

        <div>
          <div className="eyebrow">Your live orders this epoch</div>
          {m.myOrders.length === 0 ? (
            <p className="mt-2 font-sans text-[12.5px] text-muted">None queued.</p>
          ) : (
            <ul className="mt-2 space-y-1.5">
              {m.myOrders.map((o) => (
                <li
                  key={o.index.toString()}
                  className="flex items-center justify-between rounded-xl border border-line bg-secondary/55 px-3 py-2.5 font-mono text-[12px] tabular-nums text-ink"
                >
                  <span>
                    {o.zeroForOne ? "buy MDA" : "buy MDB"} {formatTokens(o.amountIn, 3)}{" "}
                    {o.zeroForOne ? "MDB" : "MDA"}
                  </span>
                  <button
                    className="font-sans text-[11px] text-rose underline-offset-2 hover:underline"
                    disabled={m.busy !== null}
                    onClick={() => void m.onBatchCancel(o.epoch, o.index)}
                  >
                    cancel
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-2.5">
            <Button
              disabled={m.busy !== null || clearableEpoch === null || clearableEpoch < 0n}
              onClick={() => clearableEpoch !== null && void m.onClearEpoch(clearableEpoch)}
            >
              {m.busy === "batch-clear" ? "Clearing…" : `Clear epoch #${clearableEpoch?.toString() ?? "—"} — anyone can`}
            </Button>
            {epochDone && (
              <Button
                variant="outline"
                disabled={m.busy !== null}
                onClick={() => b && void m.onClearEpoch(b.epoch - 1n)}
              >
                Clear previous epoch
              </Button>
            )}
          </div>
          <p className="note mt-2">
            Clearing is permissionless and identical whenever it runs — the epoch TWAP is
            immutable in the append-only accumulator. Correctness never needs a keeper.
          </p>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, sub, accent }: { label: string; value: string; sub: string; accent?: boolean }) {
  return (
    <div className="bg-card px-6 py-4">
      <div className="font-sans text-[10px] font-bold uppercase tracking-[0.14em] text-muted">{label}</div>
      <div className={`mt-1.5 font-mono text-[17px] font-semibold tabular-nums ${accent ? "text-brand" : "text-ink"}`}>
        {value}
      </div>
      <div className="mt-0.5 font-sans text-[10.5px] text-faint">{sub}</div>
    </div>
  );
}

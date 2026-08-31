"use client";

import { useState } from "react";
import { useMarkout } from "@/lib/markout";
import { Button } from "@/components/ui/button";
import { formatTokens } from "@/lib/contracts";

/**
 * The personal LP seat: add or remove full-range liquidity in the live pool
 * through the OFFICIAL canonical-Sepolia PositionManager + Permit2 — the
 * same periphery era as the deployment script. Exact approvals only; every
 * write simulated first; the position NFT tokenId is parsed from the mint
 * receipt's own Transfer event.
 */
export function LpPanel() {
  const m = useMarkout();
  const a = m.address;
  const hasPosition = m.lpTokenId !== null && (m.lpLiquidity ?? 0n) > 0n;

  const defaultAmt = (() => {
    const bal = m.sellBal ?? 0n;
    return bal > 10n * 10n ** 18n ? 10n * 10n ** 18n : bal === 0n ? 1n * 10n ** 18n : bal / 2n;
  })();
  const [amt0Str, setAmt0Str] = useState<string>("");
  const [amt1Str, setAmt1Str] = useState<string>("");
  const [touched1, setTouched1] = useState(false);

  const amt0 = (() => {
    try {
      const v = amt0Str === "" ? defaultAmt : BigInt(Math.round(parseFloat(amt0Str) * 1e18));
      return v > 0n ? v : null;
    } catch {
      return null;
    }
  })();
  // Suggest the value-paired second leg from the live price until edited.
  const suggested1 = amt0 && m.price ? BigInt(Math.round(Number(amt0) * m.price)) : null;
  const amt1 = (() => {
    if (touched1 && amt1Str !== "") {
      try {
        const v = BigInt(Math.round(parseFloat(amt1Str) * 1e18));
        return v > 0n ? v : null;
      } catch {
        return null;
      }
    }
    return suggested1;
  })();

  const bal0 = m.sellBal ?? 0n;
  const bal1 = m.buyBal ?? 0n;
  const enough = amt0 !== null && amt1 !== null && amt0 <= bal0 && amt1 <= bal1;

  if (!a || m.wrongChain) return null;

  const busyLabel =
    m.lpBusy === "setup"
      ? "Preparing…"
      : m.lpBusy?.startsWith("approve")
        ? "Approving Permit2…"
        : m.lpBusy?.startsWith("permit2")
          ? "Setting allowance…"
          : m.lpBusy === "mint"
            ? "Minting position…"
            : m.lpBusy === "remove"
              ? "Removing…"
              : null;

  return (
    <div id="lp-panel" className="panel mt-5 overflow-hidden bg-card">
      <div className="tape flex flex-wrap items-center justify-between gap-2 border-b border-edge px-6 py-3">
        <span>Your LP seat — official PositionManager</span>
        <span className="font-mono text-[10.5px] text-faint">full range · Permit2 · 3 bps fees + forfeited bonds</span>
      </div>

      {hasPosition ? (
        <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-5">
          <div>
            <div className="eyebrow">Your position</div>
            <div className="mt-1 font-mono text-[19px] font-semibold tabular-nums text-ink">
              L {formatTokens(m.lpLiquidity ?? 0n, 3)}
            </div>
            <div className="mt-0.5 font-sans text-[12px] text-muted">
              full range −887220 … 887220 · NFT #{m.lpTokenId?.toString()} · flushes and the 3 bps fee accrue here
            </div>
          </div>
          <Button
            variant="outline"
            disabled={m.lpBusy !== null}
            onClick={() => void m.onLpRemoveAll()}
          >
            {busyLabel ?? "Remove all liquidity"}
          </Button>
        </div>
      ) : (
        <div className="px-6 py-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <LpAmount
              label="MDA in"
              value={amt0Str || (amt0 ? (Number(amt0) / 1e18).toString() : "")}
              onChange={setAmt0Str}
              balance={bal0}
            />
            <LpAmount
              label="MDB in (paired)"
              value={
                touched1
                  ? amt1Str
                  : amt1
                    ? (Number(amt1) / 1e18).toFixed(4).replace(/\.?0+$/, "")
                    : ""
              }
              onChange={(v) => {
                setAmt1Str(v);
                setTouched1(true);
              }}
              balance={bal1}
            />
          </div>

          {!enough && amt0 !== null && amt1 !== null && (
            <p className="mt-2 font-sans text-[12px] text-rose">
              Not enough tokens — mint demo tokens first, or lower the amounts.
            </p>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button disabled={m.lpBusy !== null || !enough} onClick={() => amt0 && amt1 && void m.onLpAdd(amt0, amt1)}>
              {busyLabel ?? "Add liquidity"}
            </Button>
            <span className="font-sans text-[11.5px] text-faint">
              up to 3 approval txs + 1 mint · exact amounts only · every step simulated first
            </span>
          </div>
          <p className="note mt-3">
            You provide both sides full-range through the official v4 PositionManager (Permit2
            allowances, 1-hour expiry). When toxic one-shot flow forfeits its 20 bps bond, the
            flush pays in-range liquidity — that is you while this position is live.
          </p>
        </div>
      )}
    </div>
  );
}

function LpAmount({
  label,
  value,
  onChange,
  balance,
}: {
  label: string;
  value: string;
  onChange: (s: string) => void;
  balance: bigint;
}) {
  return (
    <div className="rounded-xl border border-line bg-canvas p-4">
      <div className="flex items-baseline justify-between">
        <span className="font-sans text-[10.5px] font-bold uppercase tracking-[0.16em] text-muted">{label}</span>
        <span className="font-sans text-[11px] text-muted">balance {formatTokens(balance, 2)}</span>
      </div>
      <input
        className="mt-1 w-full bg-transparent font-mono text-[20px] font-medium tabular-nums text-ink outline-none placeholder:text-faint"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="0.0"
        inputMode="decimal"
        aria-label={label}
      />
    </div>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Toaster } from "sonner";
import { Connect } from "@/components/Connect";
import { SiteNav } from "@/components/SiteNav";
import { Pipeline } from "@/components/Pipeline";
import { NetworkBanner } from "@/components/NetworkBanner";
import { MemoryTape } from "@/components/MemoryTape";
import { LpSeat } from "@/components/LpSeat";
import { LpPanel } from "@/components/LpPanel";
import { BatchPanel } from "@/components/BatchPanel";
import { useMarkout } from "@/lib/markout";
import { formatTokens, TOKEN0, TOKEN1 } from "@/lib/contracts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function AppPage() {
  const m = useMarkout();
  const connected = !!m.address;
  const [lpSkipped, setLpSkipped] = useState(false);

  useEffect(() => {
    const read = () => {
      if (m.address) {
        setLpSkipped(
          window.localStorage.getItem(`markout:lpSkipped:${m.address.toLowerCase()}`) === "1",
        );
      } else {
        setLpSkipped(false);
      }
    };
    read();
    window.addEventListener("markout:lp-skipped", read);
    return () => window.removeEventListener("markout:lp-skipped", read);
  }, [m.address]);

  const lpDone = m.lpTokenId !== null || lpSkipped;
  const step = !connected
    ? 0
    : (m.sellBal ?? 0n) === 0n && (m.buyBal ?? 0n) === 0n
      ? 1
      : !lpDone
        ? 2
        : m.trades.length === 0
          ? 3
          : 4;

  return (
    <div className="relative z-10">
      <Toaster theme="light" position="bottom-right" />
      <SiteNav
        sub="The memory console"
        links={[
          { href: "/", label: "Home" },
          { href: "/docs", label: "Docs" },
          { href: "/app", label: "App" },
        ]}
        rightSlot={<Connect />}
      />

      <main className="mx-auto max-w-content px-5 py-10 pb-28 md:px-8">
        <div className="mb-8">
          <h1 className="font-display text-[34px] font-semibold tracking-tight text-ink md:text-[40px]">
            The memory console
          </h1>
          <p className="mt-2 font-sans text-[14.5px] text-muted">
            You are the LP here: seed liquidity, then trade the spot lane (instant fill,{" "}
            {m.premiumBps.toString()} bps live premium) and/or the batch lane (24 s epochs) —{" "}
            {m.traction
              ? `${formatTokens(m.traction.a0 + m.traction.a1, 4)} paid to LPs so far`
              : "returned-to-LPs reading…"}
            .
          </p>
        </div>

        <div className="mb-6 animate-rise">
          <Pipeline step={step} />
        </div>

        <NetworkBanner />

        <GuideBanner step={step} />

        <div className="grid gap-5 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
          {/* ── Spot lane ── */}
          <SwapPanel />

          {/* ── Memory tape panel ── */}
          <MemoryPanel />
        </div>

        {/* ── Batch lane ── */}
        <BatchPanel />

        {/* ── Personal LP seat (add/remove through official PositionManager) ── */}
        <LpPanel />

        {/* ── LP seat (pool-wide) ── */}
        <LpSeat />

        {/* ── Ledger ── */}
        <Ledger />
      </main>
    </div>
  );
}

/* ───────────────────────── swap ───────────────────────── */

function SwapPanel() {
  const m = useMarkout();
  const connected = !!m.address;

  return (
    <Card className="overflow-hidden">
      <div className="tape flex flex-wrap items-center justify-between gap-2 border-b border-edge px-6 py-3">
        <span>Spot lane · instant fill at 3 bps</span>
        <span className="font-mono text-[10.5px] text-faint">
          premium {m.premiumBps.toString()} bps · live from settle history
        </span>
        {m.address && (m.sellBal ?? 0n) > 0n && (m.buyBal ?? 0n) > 0n && (
          <span className="rounded-full bg-canvas/15 px-2 py-0.5 text-[10px] tracking-[0.14em]">STEP 3 HERE ↓</span>
        )}
      </div>
      <CardContent className="p-6 pt-5">
        {!connected ? (
          <ConnectCall />
        ) : m.wrongChain ? (
          <div className="py-10 text-center">
            <p className="note mb-4">Switch your wallet to Sepolia to swap.</p>
            <Button size="sm" onClick={() => void m.switchNetwork()}>
              Switch to Sepolia
            </Button>
          </div>
        ) : (
          <>
            <FaucetBlock />
            <Field
              label="You sell"
              value={m.amountStr}
              onChange={m.setAmountStr}
              token={m.zeroForOne ? "MDA" : "MDB"}
              addr={m.zeroForOne ? TOKEN0 : TOKEN1}
              balance={m.sellBal}
              secondary={
                <Button variant="ghost" size="sm" className="h-7 px-2.5 text-[11.5px]" disabled={m.busy !== null} onClick={() => void m.onMint()}>
                  {m.busy === "mint" ? "Minting…" : "Get tokens"}
                </Button>
              }
            />

            <div className="my-3 flex justify-center">
              <button
                onClick={() => m.setZeroForOne(!m.zeroForOne)}
                aria-label="Flip direction"
                className="grid h-8 w-8 place-items-center rounded-full border border-edge bg-card font-sans text-[13px] text-ink transition-colors hover:bg-secondary"
              >
                ↕
              </button>
            </div>

            <Field
              label="You buy (est.)"
              value={m.estOut ? formatTokens(m.estOut, 4) : "—"}
              token={m.zeroForOne ? "MDB" : "MDA"}
              addr={m.zeroForOne ? TOKEN1 : TOKEN0}
              balance={m.buyBal}
              readOnly
            />

            <div className="mt-5">
              <Stat label="min out (slippage-protected)" value={`≥ ${m.estOut ? formatTokens(m.minOut, 4) : "—"}`} />
              <div className="stat-row">
                <span className="stat-key">slippage tolerance %</span>
                <input
                  className="w-16 rounded-md border border-line bg-canvas px-2 py-1 font-mono text-[13px] tabular-nums text-ink focus:border-brand/60 focus:outline-none"
                  value={m.slippagePct}
                  onChange={(e) => m.setSlippagePct(e.target.value)}
                  inputMode="decimal"
                  aria-label="slippage tolerance percent"
                />
              </div>
              <Stat label={`premium escrowed 24 s (${m.premiumBps.toString()} bps)`} value={m.amountIn ? formatTokens(m.bond, 6) : "—"} mono />
              <Stat label="deadline" value="+5 min" />
            </div>

            {m.tooSmall && (
              <p className="mt-3 font-sans text-[12px] text-rose">
                Swap too small — the premium (min 5 bps) would round to zero (SwapTooSmall).
              </p>
            )}

            <div className="mt-5 grid gap-2.5">
              {m.needApprove && !m.tooSmall && (
                <Button disabled={m.busy !== null || !m.amountIn} onClick={() => void m.onApproveExact()}>
                  {m.busy === "approve" ? "Approving…" : "Approve exact (input + bond)"}
                </Button>
              )}
              <Button
                disabled={m.busy !== null || !m.amountIn || m.tooSmall || m.needApprove}
                onClick={() => void m.onSwap()}
              >
                {m.busy === "swap" ? "Signing…" : `Swap + post ${m.premiumBps.toString()} bps premium`}
              </Button>
              <div className="grid grid-cols-2 gap-2.5">
                <Button variant="outline" disabled={m.busy !== null} onClick={() => void m.demoRefund()}>
                  {m.pilot === "refund" ? "Running…" : "Demo: refund"}
                </Button>
                <Button variant="outline" disabled={m.busy !== null} onClick={() => void m.demoDonate()}>
                  {m.pilot === "donate" ? "Running…" : "Demo: donate"}
                </Button>
              </div>
            </div>

            <p className="note mt-4">
              Exact approvals only · every write simulated first · refunds paid at settle · net
              cost for organic flow is the 3 bps fee.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function ConnectCall() {
  const m = useMarkout();
  return (
    <div className="py-12 text-center">
      <p className="note mx-auto mb-5 max-w-xs">
        Connect an injected wallet on Sepolia. One click for capped demo tokens, one for a
        slippage-protected swap — then watch the memory settle it.
      </p>
      <Button onClick={() => void m.onConnect()} disabled={m.connBusy}>
        {m.connBusy ? "Connecting…" : "Connect Wallet"}
      </Button>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  token,
  addr,
  balance,
  readOnly,
  secondary,
}: {
  label: string;
  value: string;
  onChange?: (s: string) => void;
  token: string;
  addr: string;
  balance: bigint | undefined;
  readOnly?: boolean;
  secondary?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-line bg-canvas p-4">
      <div className="flex items-baseline justify-between gap-3">
        <span className="font-sans text-[10.5px] font-bold uppercase tracking-[0.16em] text-muted">
          {label}
        </span>
        <span className="font-display text-[16px] font-semibold italic text-ink">{token}</span>
      </div>
      <div className="mt-1.5 flex items-center justify-between gap-3">
        {readOnly ? (
          <span className="font-mono text-[22px] font-medium tabular-nums text-ink">{value}</span>
        ) : (
          <input
            className="w-full bg-transparent font-mono text-[22px] font-medium tabular-nums text-ink outline-none placeholder:text-faint"
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            placeholder="0.0"
            inputMode="decimal"
            aria-label={label}
          />
        )}
        <span className="font-mono text-[9.5px] text-faint">{addr.slice(0, 6)}…{addr.slice(-4)}</span>
      </div>
      <div className="mt-1.5 flex items-center justify-between">
        <span className="font-sans text-[11.5px] text-muted">
          balance {formatTokens(balance ?? 0n)}
        </span>
        {secondary}
      </div>
    </div>
  );
}

function Stat({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="stat-row">
      <span className="stat-key">{label}</span>
      <span className={mono ? "stat-val text-brand" : "stat-val"}>{value}</span>
    </div>
  );
}

/* ───────────────────────── memory ───────────────────────── */

function MemoryPanel() {
  const m = useMarkout();
  const a = m.active;

  return (
    <Card className="overflow-hidden">
      <div className="tape flex items-center justify-between border-b border-edge px-6 py-3">
        <span>The 24-second memory</span>
        {m.active && m.active.outcome === 0 && (
          <span className="rounded-full bg-gold px-2 py-0.5 text-[10px] tracking-[0.14em] text-canvas animate-pulseSoft">
            STEP 4 · SETTLE ↓
          </span>
        )}
      </div>
      <CardContent className="p-6 pt-5">
        <div className="mb-4 grid grid-cols-3 gap-3">
          <Kpi label="pool" value={m.price ? m.price.toFixed(5) : "…"} sub="MDB / MDA" />
          <Kpi label="tick" value={m.liveTick !== null ? String(m.liveTick) : "…"} sub="slot0 live" />
          <Kpi
            label="returned to LPs"
            value={m.traction ? formatTokens(m.traction.a0 + m.traction.a1, 3) : "…"}
            sub={m.traction ? `${m.traction.events} flush${m.traction.events === 1 ? "" : "es"}` : "reading…"}
            accent
          />
        </div>

        <MemoryTape
          trace={m.trace}
          chainNow={m.chainNow}
          pre={m.preview ? m.preview.pre : a ? a.preTick : null}
          post={m.preview ? m.preview.post : a ? a.postTick : null}
          windowAvg={m.preview ? m.preview.windowAvg : null}
          bondTime={a ? a.bondTime : 0n}
          settleAfter={a ? a.settleAfter : 0n}
          outcome={a ? a.outcome : -1}
        />

        {a ? (
          <div aria-live="polite" className="mt-5">
            {a.outcome === 0 && !m.windowOpen && (
              <div className="mb-4 rounded-xl border border-gold/40 bg-gold/[0.07] px-4 py-3 text-center font-sans text-[13px] font-semibold text-ink">
                Window closed — press the big Settle button below.
              </div>
            )}
            {a.outcome === 0 && m.windowOpen && (
              <div className="mb-4 rounded-xl border border-line bg-secondary px-4 py-3 text-center font-sans text-[12.5px] text-muted">
                Recording… the countdown below reaches zero, then anyone may settle.
              </div>
            )}
            <div className="text-center">
              <div className="font-display text-[44px] font-semibold leading-none tracking-tight tabular-nums text-ink">
                {a.outcome === 1 ? (
                  <span className="text-brand">Refunded</span>
                ) : a.outcome === 2 ? (
                  <span className="text-gold">Claimable</span>
                ) : a.outcome === 3 ? (
                  <span className="text-ink">Donated</span>
                ) : m.remaining > 0 ? (
                  `${m.remaining}s`
                ) : (
                  <span className="text-brand">Settleable</span>
                )}
              </div>
              <div className="mt-1.5 font-sans text-[10.5px] uppercase tracking-[0.18em] text-faint">
                {a.outcome === 0
                  ? m.windowOpen
                    ? "fixed window — price decides the bond"
                    : "window closed — anyone may settle"
                  : a.outcome === 2
                    ? "refund verdict — delivery failed, claim retries"
                    : "terminal"}
              </div>
            </div>

            {m.preview && a.outcome === 0 && (
              <div className="mt-4">
                <Stat
                  label="reversion of own impact"
                  value={`${(Number(m.preview.reversionBps) / 100).toFixed(1)}%`}
                  mono={Number(m.preview.reversionBps) >= 5000}
                />
                <Stat
                  label="projected verdict if settled now"
                  value={m.preview.expected === 1 ? "REFUND" : "DONATE"}
                  mono={m.preview.expected === 1}
                />
              </div>
            )}

            <div className="mt-5 grid gap-2.5">
              {a.outcome === 0 && (
                <Button disabled={m.busy !== null || m.windowOpen} onClick={() => void m.onSettle(a.id)}>
                  {m.busy === "settle" ? "Settling…" : m.windowOpen ? `Wait ${m.remaining}s` : "Settle — anyone can"}
                </Button>
              )}
              {a.outcome === 2 && !a.refundClaimed && (
                <Button disabled={m.busy !== null} onClick={() => void m.onClaim(a.id)}>
                  {m.busy === "claim" ? "Claiming…" : "Claim refund — retry"}
                </Button>
              )}
              {a.outcome === 3 && (
                <Button variant="outline" disabled={m.busy !== null} onClick={() => void m.onFlush()}>
                  {m.busy === "flush" ? "Flushing…" : "Flush donation → LPs"}
                </Button>
              )}
              <a
                href={`https://sepolia.etherscan.io/tx/${a.txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-center font-sans text-[12px] text-muted underline-offset-2 hover:text-brand hover:underline"
              >
                swap tx ↗
              </a>
            </div>

            <p className="note mt-3 text-center">
              bond {formatTokens(a.bondAmount, 6)}{" "}
              {a.bondCurrency.toLowerCase() === TOKEN0.toLowerCase() ? "MDA" : "MDB"} · trade{" "}
              {a.id.slice(0, 8)}…{a.id.slice(-4)}
            </p>
          </div>
        ) : (
          <p className="note py-8 text-center">
            Swap to record a trade — refresh-safe, recovered from your own receipts.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function Kpi({ label, value, sub, accent }: { label: string; value: string; sub: string; accent?: boolean }) {
  return (
    <div className="rounded-xl border border-line bg-canvas px-3.5 py-3">
      <div className="font-sans text-[10px] font-bold uppercase tracking-[0.14em] text-muted">{label}</div>
      <div className={`mt-1 font-mono text-[16px] font-semibold tabular-nums ${accent ? "text-brand" : "text-ink"}`}>
        {value}
      </div>
      <div className="mt-0.5 font-sans text-[10px] text-faint">{sub}</div>
    </div>
  );
}

/* ───────────────────────── ledger ───────────────────────── */

function Ledger() {
  const m = useMarkout();
  return (
    <Card className="mt-5 overflow-hidden">
      <div className="tape border-b border-edge px-6 py-3">Ledger · your bonded trades</div>
      {m.trades.length === 0 ? (
        <div className="px-6 py-10 text-center font-sans text-[13px] text-muted">
          {m.address
            ? "No SwapBonded events for this wallet in recent blocks."
            : "Connect a wallet to load your trade history."}
        </div>
      ) : (
        <table className="w-full border-collapse font-sans text-[12.5px]">
          <thead>
            <tr className="bg-secondary">
              {["Trade", "Bond", "Status", "Actions", "Tx"].map((h) => (
                <th
                  key={h}
                  className="border-b border-edge px-5 py-2.5 text-left text-[10px] font-semibold uppercase tracking-[0.1em] text-muted"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {m.trades.map((r) => (
              <tr
                key={r.id}
                onClick={() => m.setActiveId(r.id)}
                className={`cursor-pointer transition-colors hover:bg-secondary/60 ${r.id === m.activeId ? "bg-brand/5" : ""}`}
              >
                <td className="px-5 py-3 font-mono text-[12px] tabular-nums text-ink">
                  {r.id.slice(0, 8)}…{r.id.slice(-4)}
                </td>
                <td className="px-5 py-3 font-mono text-[12px] tabular-nums text-ink-soft">
                  {formatTokens(r.bondAmount, 6)}
                </td>
                <td className="px-5 py-3">
                  <OutcomeBadge outcome={r.outcome} claimed={r.refundClaimed} />
                </td>
                <td className="px-5 py-3">
                  <div className="flex gap-2">
                    {r.outcome === 0 && m.chainNow >= r.settleAfter && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 px-2.5 text-[11.5px]"
                        disabled={m.busy !== null}
                        onClick={(e) => {
                          e.stopPropagation();
                          void m.onSettle(r.id);
                        }}
                      >
                        settle
                      </Button>
                    )}
                    {r.outcome === 2 && !r.refundClaimed && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 px-2.5 text-[11.5px]"
                        disabled={m.busy !== null}
                        onClick={(e) => {
                          e.stopPropagation();
                          void m.onClaim(r.id);
                        }}
                      >
                        claim
                      </Button>
                    )}
                  </div>
                </td>
                <td className="px-5 py-3">
                  <a
                    href={`https://sepolia.etherscan.io/tx/${r.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    ↗
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Card>
  );
}

function OutcomeBadge({ outcome, claimed }: { outcome: number; claimed: boolean }) {
  if (outcome === 1) return <Badge variant="brand">Refunded</Badge>;
  if (outcome === 2)
    return <Badge variant={claimed ? "outline" : "brand"}>{claimed ? "Claimed" : "RefundPending"}</Badge>;
  if (outcome === 3) return <Badge variant="gold">Donated</Badge>;
  return <Badge variant="outline">window open</Badge>;
}


/* ───────────────────────── guided CTA banner ───────────────────────── */

function GuideBanner({ step }: { step: number }) {
  const m = useMarkout();
  const skipLp = () => {
    if (m.address) {
      window.localStorage.setItem(`markout:lpSkipped:${m.address.toLowerCase()}`, "1");
      window.dispatchEvent(new Event("markout:lp-skipped"));
    }
  };
  if (step > 2) return null; // past the LP choice — the panels themselves guide

  return (
    <Card className="mb-5 animate-rise overflow-hidden border-brand/30 bg-brand/[0.04]">
      <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
        <div className="flex items-center gap-4">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gold font-mono text-[16px] font-semibold text-canvas shadow-[0_0_0_6px_rgba(214,162,63,0.18)] animate-pulseSoft">
            {step + 1}
          </span>
          <div>
            <div className="font-display text-[19px] font-semibold tracking-tight text-ink">
              {step === 0 ? "Connect your wallet to begin" : step === 1 ? "Get demo tokens" : "Provide liquidity — or skip to the swap"}
            </div>
            <div className="font-sans text-[13px] text-muted">
              {step === 0
                ? "Chrome desktop + MetaMask (or any injected wallet) on Sepolia"
                : step === 1
                  ? "One click mints 100 MDA + 100 MDB — capped faucet, no seed phrase, no faucet site"
                  : "Be an LP in this pool through the official v4 PositionManager — forfeited bonds flush to in-range liquidity"}
            </div>
          </div>
        </div>
        {step === 0 ? (
          <Button size="lg" onClick={() => void m.onConnect()} disabled={m.connBusy}>
            {m.connBusy ? "Connecting…" : "Connect Wallet"}
          </Button>
        ) : step === 1 ? (
          <Button size="lg" onClick={() => void m.onMint()} disabled={m.busy !== null}>
            {m.busy === "mint" ? "Minting…" : "Get 100 MDA + 100 MDB"}
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            <Button size="lg" variant="outline" onClick={skipLp}>
              Skip LP
            </Button>
            <Button
              size="lg"
              onClick={() =>
                document.getElementById("lp-panel")?.scrollIntoView({ behavior: "smooth", block: "center" })
              }
            >
              Add liquidity ↓
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ───────────────────────── faucet block ───────────────────────── */

function FaucetBlock() {
  const m = useMarkout();
  const empty = (m.sellBal ?? 0n) === 0n && (m.buyBal ?? 0n) === 0n;
  if (!empty) return null;

  return (
    <div className="mb-4 rounded-xl border border-gold/40 bg-gold/[0.07] p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="eyebrow text-gold">Demo tokens</div>
          <div className="mt-0.5 font-sans text-[12.5px] text-ink-soft">
            This pool runs on capped faucet tokens — mint yours below.
          </div>
        </div>
        <Button onClick={() => void m.onMint()} disabled={m.busy !== null}>
          {m.busy === "mint" ? "Minting…" : "Mint 100 + 100"}
        </Button>
      </div>
    </div>
  );
}

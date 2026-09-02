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

      <main className="pb-28">
        <section className="border-b border-line bg-card">
          <div className="section-shell py-10 md:py-14">
            <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-end">
              <div>
                <span className="section-kicker">Live protocol workspace</span>
                <h1 className="mt-4 font-display text-[44px] font-normal leading-none tracking-[-0.045em] text-ink md:text-[58px]">
                  The memory console
                </h1>
                <p className="mt-4 max-w-2xl font-sans text-[14px] leading-relaxed text-muted">
                  Seed liquidity, choose spot or batch, then watch the same 24-second memory
                  settle the result. Every control below writes to the live Sepolia deployment.
                </p>
              </div>
              <div className="grid grid-cols-3 overflow-hidden rounded-xl border border-line bg-secondary/50">
                <ConsoleFact label="premium" value={`${m.premiumBps.toString()} bps`} />
                <ConsoleFact label="window" value="24 s" />
                <ConsoleFact
                  label="paid to LPs"
                  value={m.traction ? formatTokens(m.traction.a0 + m.traction.a1, 3) : "…"}
                />
              </div>
            </div>
          </div>
        </section>

        <div className="section-shell pt-8 md:pt-10">
          <div className="mb-6">
            <div className="mb-3 flex items-center justify-between gap-3">
              <span className="eyebrow">Your path through the pool</span>
              <span className="font-mono text-[9.5px] text-faint">Current step {step + 1} / 5</span>
            </div>
            <Pipeline step={step} />
          </div>

          <NetworkBanner />

          <GuideBanner step={step} />

          <section className="chapter-rule mt-8">
            <ChapterHeader
              n="01"
              label="Trade"
              title="Choose immediate execution or coordinated flow."
              body="Spot fills now and posts the live premium. Batch waits one epoch so opposing orders can meet at one price."
            />
            <div className="mt-7 grid gap-5 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
              <SwapPanel />
              <MemoryPanel />
            </div>
            <BatchPanel />
          </section>

          <section className="chapter-rule mt-16">
            <ChapterHeader
              n="02"
              label="Liquidity"
              title="Take a seat in the pool."
              body="Add a full-range position through the official PositionManager, then inspect what active liquidity receives."
            />
            <LpPanel />
            <LpSeat />
          </section>

          <section className="chapter-rule mt-16">
            <ChapterHeader
              n="03"
              label="History"
              title="Every premium has a terminal outcome."
              body="Select a trade to return it to the memory tape, settle an expired window, or retry a pending refund."
            />
            <Ledger />
          </section>
        </div>
      </main>
    </div>
  );
}

function ConsoleFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-24 border-r border-line px-4 py-3 last:border-r-0">
      <div className="font-mono text-[8.5px] uppercase tracking-[0.1em] text-faint">{label}</div>
      <div className="mt-1 font-mono text-[12px] font-medium tabular-nums text-ink">{value}</div>
    </div>
  );
}

function ChapterHeader({
  n,
  label,
  title,
  body,
}: {
  n: string;
  label: string;
  title: string;
  body: string;
}) {
  return (
    <div className="grid gap-5 md:grid-cols-[80px_1fr_1fr] md:items-end">
      <span className="font-mono text-[11px] text-brand">{n}</span>
      <div>
        <div className="eyebrow">{label}</div>
        <h2 className="mt-2 font-display text-[29px] font-normal leading-tight tracking-[-0.03em] text-ink">{title}</h2>
      </div>
      <p className="font-sans text-[12.5px] leading-relaxed text-muted">{body}</p>
    </div>
  );
}

/* ───────────────────────── swap ───────────────────────── */

function SwapPanel() {
  const m = useMarkout();
  const connected = !!m.address;

  return (
    <Card className="overflow-hidden border-line">
      <div className="tape flex flex-wrap items-center justify-between gap-2 border-b border-line px-6 py-3.5">
        <span>Spot lane · instant fill at 3 bps</span>
        <span className="font-mono text-[10.5px] text-faint">
          premium {m.premiumBps.toString()} bps · live from settle history
        </span>
        {m.address && (m.sellBal ?? 0n) > 0n && (m.buyBal ?? 0n) > 0n && (
          <span className="rounded-full bg-brand/10 px-2 py-0.5 text-[9px] tracking-[0.1em] text-brand-dim">STEP 3 HERE ↓</span>
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
              token={m.zeroForOne ? "MDB" : "MDA"}
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
                className="grid size-9 place-items-center rounded-xl border border-line bg-card font-sans text-[13px] text-ink shadow-[0_1px_0_rgba(24,24,23,0.05)] transition-colors hover:bg-secondary"
              >
                ↕
              </button>
            </div>

            <Field
              label="You buy (est.)"
              value={m.estOut ? formatTokens(m.estOut, 4) : "—"}
              token={m.zeroForOne ? "MDA" : "MDB"}
              addr={m.zeroForOne ? TOKEN1 : TOKEN0}
              balance={m.buyBal}
              readOnly
            />

            <div className="mt-5">
              <Stat label="min out (slippage-protected)" value={`≥ ${m.estOut ? formatTokens(m.minOut, 4) : "—"}`} />
              <div className="stat-row">
                <span className="stat-key">slippage tolerance %</span>
                <input
                  className="w-16 rounded-lg border border-line bg-card px-2 py-1 font-mono text-[13px] tabular-nums text-ink focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10"
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
                  {m.busy === "approve" ? "Approving…" : "Approve exact (input + premium)"}
                </Button>
              )}
              <Button
                disabled={m.busy !== null || !m.amountIn || m.tooSmall || m.needApprove}
                onClick={() => void m.onSwap()}
              >
                {m.busy === "swap" ? "Signing…" : `Swap + post ${m.premiumBps.toString()} bps premium`}
              </Button>
              <div className="grid grid-cols-3 gap-2.5">
                <Button variant="outline" disabled={m.busy !== null} onClick={() => void m.demoRefund()}>
                  {m.pilot === "refund" ? "Running…" : "Demo: refund"}
                </Button>
                <Button variant="outline" disabled={m.busy !== null} onClick={() => void m.demoDonate()}>
                  {m.pilot === "donate" ? "Running…" : "Demo: donate"}
                </Button>
                <Button variant="outline" disabled={m.busy !== null} onClick={() => void m.demoBatchNet()}>
                  {m.pilot === "batch" ? "Running…" : "Demo: batch net"}
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
    <div className="rounded-xl2 border border-line bg-secondary/55 p-[18px] transition-colors focus-within:border-brand/60 focus-within:bg-card">
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
    <Card className="overflow-hidden border-line">
      <div className="tape flex items-center justify-between border-b border-line px-6 py-3.5">
        <span>The 24-second memory</span>
        {m.active && m.active.outcome === 0 && (
          <span className="rounded-full bg-brand px-2 py-0.5 text-[9px] tracking-[0.1em] text-canvas animate-pulseSoft">
            STEP 4 · SETTLE ↓
          </span>
        )}
      </div>
      <CardContent className="p-6 pt-5">
        <div className="mb-4 grid grid-cols-3 gap-3">
          <Kpi label="pool" value={m.price ? m.price.toFixed(5) : "…"} sub="MDA / MDB" />
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
              <div className="font-display text-[48px] font-normal leading-none tracking-[-0.035em] tabular-nums text-ink">
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
              {a.bondCurrency.toLowerCase() === TOKEN0.toLowerCase() ? "MDB" : "MDA"} · trade{" "}
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
    <div className="rounded-xl border border-line bg-secondary/55 px-3.5 py-3">
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
    <Card className="mt-7 overflow-hidden border-line">
      <div className="tape border-b border-line px-6 py-3.5">Ledger · your bonded trades</div>
      {m.trades.length === 0 ? (
        <div className="px-6 py-10 text-center font-sans text-[13px] text-muted">
          {m.address
            ? "No SwapBonded events for this wallet in recent blocks."
            : "Connect a wallet to load your trade history."}
        </div>
      ) : (
        <table className="ledger-table w-full border-collapse font-sans text-[12.5px]">
          <thead>
            <tr className="bg-secondary/65">
              {["Trade", "Bond", "Status", "Actions", "Tx"].map((h) => (
                <th
                  key={h}
                  className="border-b border-line px-5 py-3 text-left font-mono text-[9px] font-medium uppercase tracking-[0.1em] text-muted"
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
                className={`cursor-pointer border-b border-line/70 transition-colors last:border-b-0 hover:bg-secondary/60 ${r.id === m.activeId ? "bg-brand/[0.07]" : ""}`}
              >
                <td data-label="Trade" className="px-5 py-3 font-mono text-[12px] tabular-nums text-ink">
                  {r.id.slice(0, 8)}…{r.id.slice(-4)}
                </td>
                <td data-label="Bond" className="px-5 py-3 font-mono text-[12px] tabular-nums text-ink-soft">
                  {formatTokens(r.bondAmount, 6)}
                </td>
                <td data-label="Status" className="px-5 py-3">
                  <OutcomeBadge outcome={r.outcome} claimed={r.refundClaimed} />
                </td>
                <td data-label="Actions" className="px-5 py-3">
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
                <td data-label="Transaction" className="px-5 py-3">
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
  if (step > 3) return null; // past swap — settle is on the tape

  return (
    <Card className="mb-7 animate-rise overflow-hidden border-brand/25 bg-brand/[0.065] shadow-none">
      <CardContent className="flex flex-wrap items-center justify-between gap-5 p-5 md:p-6">
        <div className="flex items-center gap-4">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand font-mono text-[14px] font-semibold text-canvas shadow-[0_0_0_6px_rgba(217,119,87,0.12)]">
            {step + 1}
          </span>
          <div>
            <div className="font-display text-[22px] font-medium tracking-[-0.02em] text-ink">
              {step === 0
                ? "Connect your wallet to begin"
                : step === 1
                  ? "Get demo tokens"
                  : step === 2
                    ? "Add liquidity — or skip to the swap"
                    : "Spot or batch, then settle"}
            </div>
            <div className="font-sans text-[13px] text-muted">
              {step === 0
                ? "Chrome desktop + MetaMask (or any injected wallet) on Sepolia"
                : step === 1
                  ? "One click mints 100 MDA + 100 MDB — capped faucet, no seed phrase, no faucet site"
                    : step === 2
                    ? "Be an LP here through the official v4 PositionManager — forfeited premium credits in-range liquidity at settle"
                    : "One-shot donate into your seat on spot, or net a buy against a sell in the batch lane. Residuals are still a spot swap."}
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
        ) : step === 3 ? (
          <div className="flex items-center gap-2">
            <Button
              size="lg"
              variant="outline"
              onClick={() =>
                document.getElementById("batch-panel")?.scrollIntoView({ behavior: "smooth", block: "center" })
              }
            >
              Batch lane ↓
            </Button>
            <Button size="lg" disabled={m.busy !== null} onClick={() => void m.demoDonate()}>
              {m.pilot === "donate" ? "Running…" : "Demo: donate into seat"}
            </Button>
          </div>
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
    <div className="mb-4 rounded-xl border border-gold/30 bg-gold/[0.07] p-4">
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

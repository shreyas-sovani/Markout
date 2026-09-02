import Link from "next/link";
import { Seal } from "@/components/Brand";
import { LandingTape } from "@/components/LandingTape";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { APP_URL, BATCH_ROUTER, HOOK, ROUTER, TOKEN0, TOKEN1, POOL_MANAGER, PROOFS, explorerTx } from "@/lib/contracts";

/** Markout landing: a light research notebook for a live market memory. */
export default function Landing() {
  return (
    <div className="relative z-10">
      <Ticker />
      <SiteNav
        sub="The pool that remembers"
        links={[
          { href: "#how", label: "How it works" },
          { href: "#live", label: "Live on testnet" },
          { href: "/docs", label: "Docs" },
        ]}
        rightSlot={
          <Button asChild size="sm">
            <Link href="/app">Launch App →</Link>
          </Button>
        }
      />
      <Hero />
      <HowItWorks />
      <Comparison />
      <InkBand />
      <HonestLimits />
      <LiveOnTestnet />
      <FinalCta />
      <SiteFooter />
    </div>
  );
}

/* ───────────────────────── protocol rail ───────────────────────── */

const TICKER = [
  "Live on the canonical Sepolia PoolManager",
  "Any v4 router can pay the live premium — no allowlist, no settleFor",
  "Two lanes on one 24 s clock: spot insurance + batch TWAP netting",
  "Foundry suites incl. canonical fork and batch-custody invariant",
  "Toxic one-shot flow pays in-range LPs",
];

function Ticker() {
  return (
    <div className="border-b border-line bg-ink text-canvas">
      <div className="section-shell flex min-h-9 items-center justify-between gap-6 overflow-hidden">
        <span className="shrink-0 font-mono text-[9.5px] uppercase tracking-[0.12em] text-brand-bright">
          Markout / Sepolia
        </span>
        <div className="flex min-w-0 items-center gap-7 overflow-hidden">
          {TICKER.slice(0, 3).map((t, i) => (
            <span key={t} className="hidden shrink-0 items-center gap-2 font-sans text-[10.5px] text-canvas/60 sm:flex">
              <span className={i === 0 ? "size-1.5 rounded-full bg-sage" : "size-1 rounded-full bg-canvas/30"} />
              {t}
            </span>
          ))}
        </div>
        <span className="shrink-0 font-mono text-[9.5px] text-canvas/45">24 s memory</span>
      </div>
    </div>
  );
}

/* ───────────────────────── hero ───────────────────────── */

function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-line">
      <div className="section-shell relative py-14 md:py-20 lg:py-24">
        <div className="grid items-end gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16">
          <div>
            <Badge variant="brand" className="animate-rise">
              <span className="size-1.5 rounded-full bg-brand animate-pulseSoft" />
              Uniswap Hookathon · UHI10
            </Badge>

            <h1 className="mt-8 max-w-[760px] animate-rise font-display text-[52px] font-normal leading-[0.94] tracking-[-0.055em] text-ink [animation-delay:60ms] md:text-[76px] lg:text-[88px]">
              Liquidity with a{" "}
              <span className="italic text-brand">short memory.</span>
            </h1>

            <p className="mt-7 max-w-[640px] animate-rise font-sans text-[17px] leading-[1.65] text-ink-soft [animation-delay:120ms] md:text-[18px]">
              Two lanes share one 24-second view of price. Spot fills now and insures its own
              impact. Batch lets opposing orders meet at the same TWAP. When a move holds,{" "}
              <strong className="font-semibold text-ink">the premium goes to in-range LPs.</strong>
            </p>

            <div className="mt-9 flex animate-rise flex-wrap items-center gap-3 [animation-delay:180ms]">
              <Button asChild size="lg">
                <Link href="/app">Open the live console <span aria-hidden>↗</span></Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/docs">Understand the mechanism</Link>
              </Button>
            </div>
          </div>

          <div className="animate-rise border-l border-line pl-6 [animation-delay:220ms] lg:pb-2 lg:pl-9">
            <div className="section-kicker">The thesis</div>
            <p className="mt-5 font-display text-[28px] font-normal leading-[1.12] tracking-[-0.025em] text-ink md:text-[34px]">
              A volatile pool should not make every trader pay for the few who move first.
            </p>
            <div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-5 border-t border-line pt-5">
              <HeroFact value="3 bps" label="instant spot fee" />
              <HeroFact value="5–60" label="live premium, bps" />
              <HeroFact value="24 s" label="immutable memory" />
              <HeroFact value="≥ 50%" label="reversion refunds" />
            </div>
          </div>
        </div>

        <div className="mt-14 animate-rise [animation-delay:280ms] md:mt-20">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">Live pool instrument</span>
            <span className="font-mono text-[10px] text-faint">
              No wallet needed · streaming canonical Sepolia slot0
            </span>
          </div>
          <LandingTape />
        </div>

        <p className="mt-5 animate-rise font-mono text-[10px] text-faint [animation-delay:340ms]">
          live at <a className="text-brand-dim underline-offset-4 hover:underline" href={APP_URL} target="_blank" rel="noopener noreferrer">{APP_URL.replace("https://", "")}</a> · Chrome + MetaMask on Sepolia
        </p>
      </div>
    </section>
  );
}

function HeroFact({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="font-mono text-[17px] font-medium tabular-nums text-ink">{value}</div>
      <div className="mt-1 font-sans text-[10.5px] text-muted">{label}</div>
    </div>
  );
}

/* ───────────────────────── how it works ───────────────────────── */

function HowItWorks() {
  const steps = [
    {
      n: "①",
      place: "The swap",
      title: "Premium posted",
      body: "Spot swaps fill instantly at 3 bps. The hook charges a live-quoted reversion-insurance premium — priced from this pool's own settle history (starts at 20 bps, clamps 5–60) — onto the swap caller's own PoolManager delta. Any router that can settle a normal v4 swap pays it.",
      badge: "Any router · canonical PM",
      kind: "brand" as const,
      mini: <SwapMini />,
    },
    {
      n: "②",
      place: "The window",
      title: "24-second memory",
      body: "A hook-local previous-tick accumulator records the pool's memory over an immutable [bond, settleAfter] window. Settling late interpolates the same endpoint — verdicts never change with timing, and nothing can freeze escrow.",
      badge: "Append-only history",
      kind: "brand" as const,
      mini: <MemoryMini />,
    },
    {
      n: "③",
      place: "The verdict",
      title: "Refund or Donate",
      body: "Revert past half your own impact and the premium is refunded in the settlement transaction. Sustain, and in-range LPs are credited in that same settle tx (deferred only if L = 0). One claim path exists, only for failed delivery.",
      badge: "Refund paid at settle",
      kind: "gold" as const,
      mini: <VerdictMini />,
    },
    {
      n: "④",
      place: "The batch",
      title: "Net at the TWAP",
      body: "Opt-in 24 s epochs on the same clock. Opposing orders net without touching the AMM. Unmatched size is one bonded residual — a spot swap with an unbounded price limit, named on the honest-limits row.",
      badge: "Two-sided nets skip the curve",
      kind: "brand" as const,
      mini: <BatchMini />,
    },
  ];
  return (
    <section id="how" className="border-b border-line bg-card">
      <div className="section-shell py-16 md:py-24">
        <div className="grid gap-8 md:grid-cols-[0.8fr_1.2fr] md:gap-16">
          <div>
            <Eyebrow>How it works</Eyebrow>
            <h2 className="mt-4 max-w-sm font-display text-[40px] font-normal leading-[1.02] tracking-[-0.04em] text-ink md:text-[54px]">
              One clock. Two ways through.
            </h2>
          </div>
          <p className="max-w-xl self-end font-sans text-[15.5px] leading-relaxed text-muted">
            Spot users get immediate execution with reversion insurance. Batch users opt into
            an epoch where opposing flow can meet before any residual reaches the curve.
          </p>
        </div>

        <div className="mt-14 grid border-t border-line md:grid-cols-2">
          {steps.map((s) => (
            <article
              key={s.place}
              className="grid gap-6 border-b border-line py-8 md:px-8 md:odd:border-r md:odd:pl-0 md:even:pr-0 lg:grid-cols-[1fr_0.8fr] lg:gap-8"
            >
              <div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[10px] text-brand">{s.n}</span>
                  <span className="font-mono text-[9.5px] font-medium uppercase tracking-[0.14em] text-muted">{s.place}</span>
                </div>
                <h3 className="mt-3 font-display text-[28px] font-medium leading-tight tracking-[-0.025em] text-ink">{s.title}</h3>
                <p className="mt-3 font-sans text-[12.5px] leading-relaxed text-muted">{s.body}</p>
                <Badge variant={s.kind} className="mt-5 w-fit">
                  <span className={`size-1.5 rounded-full ${s.kind === "brand" ? "bg-brand" : "bg-gold"}`} />
                  {s.badge}
                </Badge>
              </div>
              <div className="self-center">{s.mini}</div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function SwapMini() {
  return (
    <div className="overflow-hidden rounded-md border border-edge bg-secondary/40 font-mono text-[11px] leading-snug text-ink-soft">
      <div className="flex items-center gap-2 border-b border-edge/40 bg-background/60 px-3 py-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-brand animate-pulseSoft" />
        <span className="font-sans text-[10px] font-bold uppercase tracking-[0.14em] text-muted">
          afterSwap · hook delta
        </span>
      </div>
      <pre className="overflow-hidden px-3 py-2.5 text-[11px]">
        <span className="text-brand">premium</span> <span className="text-faint">=</span>{" "}
        <span className="text-ink">amountIn × live bps</span>
        {"\n→ charged to the swap caller"}
        {"\n→ escrowed by the hook"}
      </pre>
    </div>
  );
}

function MemoryMini() {
  return (
    <div className="overflow-hidden rounded-md border border-edge bg-secondary/40">
      <div className="flex items-center gap-2 border-b border-edge/40 bg-background/60 px-3 py-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-brand animate-pulseSoft" />
        <span className="font-sans text-[10px] font-bold uppercase tracking-[0.14em] text-muted">
          fixed window · ticks
        </span>
      </div>
      <div className="px-3 py-3">
        <div className="relative h-5">
          <div className="absolute left-[10%] right-[10%] top-1/2 h-px -translate-y-1/2 bg-edge/30" />
          <span className="absolute top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand shadow-[0_0_0_3px_rgba(181,39,111,0.18)] animate-flowX" />
          <div className="relative flex h-full items-center justify-between">
            {["bond", "now", "settleAfter"].map((n) => (
              <span
                key={n}
                className="rounded-full border border-edge bg-card px-1.5 py-0.5 font-mono text-[9.5px] text-ink"
              >
                {n}
              </span>
            ))}
          </div>
        </div>
        <div className="mt-2 font-mono text-[11px] text-ink-soft">
          avg tick <span className="text-brand">immutable</span>
          <span className="text-faint"> · </span>
          <span className="tabular-nums">T = 24 s</span>
        </div>
      </div>
    </div>
  );
}

function VerdictMini() {
  return (
    <div className="overflow-hidden rounded-md border border-edge bg-secondary/40 font-mono text-[11px] leading-snug">
      <div className="flex items-center gap-2 border-b border-edge/40 bg-background/60 px-3 py-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-gold" />
        <span className="font-sans text-[10px] font-bold uppercase tracking-[0.14em] text-muted">
          settle · permissionless
        </span>
      </div>
      <pre className="overflow-hidden px-3 py-2.5 text-[11px] text-ink-soft">
        reverted ≥ 50% <span className="text-faint">→</span> <span className="text-brand">REFUND</span>
        {"\nsustained       "}
        <span className="text-faint">→</span> <span className="text-gold">DONATE → LPs</span>
      </pre>
    </div>
  );
}

function BatchMini() {
  return (
    <div className="overflow-hidden rounded-md border border-edge bg-secondary/40 font-mono text-[11px] leading-snug text-ink-soft">
      <div className="flex items-center gap-2 border-b border-edge/40 bg-background/60 px-3 py-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-brand animate-pulseSoft" />
        <span className="font-sans text-[10px] font-bold uppercase tracking-[0.14em] text-muted">
          clearBatch · uniform TWAP
        </span>
      </div>
      <pre className="overflow-hidden px-3 py-2.5 text-[11px]">
        two-sided <span className="text-faint">→</span> <span className="text-brand">net, no AMM</span>
        {"\nlone / leftover "}
        <span className="text-faint">→</span> <span className="text-ink">bonded residual</span>
      </pre>
    </div>
  );
}

/* ───────────────────────── comparison ledgers ───────────────────────── */

function Comparison() {
  return (
    <section className="border-b border-line bg-secondary/55">
      <div className="section-shell py-16 md:py-24">
        <div className="grid gap-8 lg:grid-cols-[0.7fr_1.3fr] lg:gap-16">
          <div>
            <Eyebrow>The trade-off</Eyebrow>
            <h2 className="mt-4 font-display text-[40px] font-normal leading-[1.02] tracking-[-0.04em] text-ink md:text-[52px]">
              Tight quotes without pretending toxic flow is free.
            </h2>
            <p className="mt-5 font-sans text-[14px] leading-relaxed text-muted">
              A volatile pool either charges everyone enough to cover informed flow, or it
              bleeds. Markout asks the move that stays to fund the difference.
            </p>
          </div>

          <div className="grid overflow-hidden rounded-xl2 border border-line bg-card shadow-card md:grid-cols-2">
            <div className="p-6 md:border-r md:border-line md:p-8">
              <div className="flex items-center gap-2 font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-muted">
                <span className="size-2 rounded-full bg-rose" /> Vanilla AMM LP
              </div>
              <div className="mt-6">
              <Ledger
                rows={[
                  ["Advertised fee", "high, to cover toxicity", "text-ink"],
                  ["Single-shot arb", "extracted, free", "text-rose"],
                  ["Organic flow", "pays the high fee too", "text-rose"],
                  ["LP dividend", "none — losses only", "text-rose"],
                ]}
                foot={["Net", "tight quotes impossible", "text-rose"]}
              />
              </div>
            </div>
            <div className="border-t border-line bg-secondary/45 p-6 md:border-t-0 md:p-8">
              <div className="flex items-center gap-2 font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-brand-dim">
                <Seal size={20} /> Markout LP
              </div>
              <div className="mt-6">
              <Ledger
                rows={[
                  ["Advertised fee", "3 bps", "text-ink"],
                  ["Single-shot arb", "premium → LPs", "text-brand"],
                  ["Organic flow", "premium refunded at settle", "text-brand"],
                  ["LP dividend", "forfeited premium, credited at settle", "text-brand"],
                ]}
                foot={["Net", "tight quotes, toxic flow pays", "text-brand"]}
              />
              </div>
            </div>
          </div>
        </div>
        <p className="mt-5 font-mono text-[10px] text-faint lg:ml-[calc(35%+2rem)]">
          3 bps fill and the 24 s clock are constants. The premium is live-quoted (default 20, clamp 5–60).
        </p>
      </div>
    </section>
  );
}

function Ledger({
  rows,
  foot,
}: {
  rows: [string, string, string][];
  foot: [string, string, string];
}) {
  return (
    <div>
      {rows.map(([k, v, c]) => (
        <div
          key={k}
          className="flex items-baseline justify-between border-b border-dashed border-line py-2.5"
        >
          <span className="font-sans text-[13.5px] text-muted">{k}</span>
          <span className={`font-mono text-[14px] tabular-nums ${c}`}>{v}</span>
        </div>
      ))}
      <Separator className="my-3 bg-line" />
      <div className="flex items-baseline justify-between">
        <span className="font-sans text-[13.5px] font-semibold text-ink">{foot[0]}</span>
        <span className={`font-mono text-[16px] font-semibold tabular-nums ${foot[2]}`}>
          {foot[1]}
        </span>
      </div>
    </div>
  );
}

/* ─────────────── full-bleed ink: the differentiator ─────────────── */

function InkBand() {
  const points: [string, string][] = [
    [
      "Canonical, not private",
      "Deployed against the shared canonical Sepolia PoolManager — a standard v4 hook, not a vanity deployment.",
    ],
    [
      "Any router, no allowlist",
      "The premium rides the swap caller's own delta. Universal Router, your contract, v4's own test routers — all pay it unchanged.",
    ],
    [
      "Toxic flow pays into the pool",
      "Sustained one-shot moves forfeit their premium to in-range liquidity on-chain — credited at settle when L > 0. No off-chain component, no private orderflow, no keepers required for correctness.",
    ],
    [
      "No partner integrations",
      "The oracle is entirely hook-local: pool ticks plus the hook's own accumulator. No Chainlink, no Pyth, nothing external.",
    ],
  ];
  return (
    <section className="border-b border-ink bg-ink text-canvas">
      <div className="memory-ribbon opacity-80" aria-hidden />
      <div className="section-shell py-16 md:py-24">
        <span className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-brand-bright">
          The differentiator
        </span>
        <h2 className="mt-5 max-w-3xl font-display text-[42px] font-normal leading-[1.02] tracking-[-0.04em] text-canvas md:text-[58px]">
          The move that stays pays the liquidity it used.
        </h2>
        <p className="mt-6 max-w-2xl font-sans text-[15px] leading-relaxed text-canvas/65">
          Directional fees in{" "}
          <code className="rounded-md border border-white/15 bg-white/[0.06] px-1.5 py-0.5 font-mono text-[12.5px] text-brand-bright">
            beforeSwap
          </code>{" "}
          are common. Markout taxes the informed move itself: it forfeits its premium into the pool
          it tried to exploit, on the same shared infrastructure every v4 pool uses.
        </p>

        <div className="mt-12 grid border-t border-white/15 sm:grid-cols-2">
          {points.map(([t, b], i) => (
            <div key={t} className="border-b border-white/15 py-7 sm:px-7 sm:odd:border-r sm:odd:pl-0 sm:even:pr-0">
                <div className="font-mono text-[9.5px] text-brand-bright">0{i + 1}</div>
                <div className="mt-3 font-sans text-[14px] font-semibold text-canvas">{t}</div>
                <p className="mt-2 font-sans text-[12.5px] leading-relaxed text-canvas/55">
                  {b}
                </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────────────────── honest limits ───────────────────── */

function HonestLimits() {
  const limits: [string, string][] = [
    [
      "Atomic same-block sandwiches pass",
      "The front leg and the victim refund — the backrun leg, unreversed, is what donates. A same-block rule cannot tell an atomic front from a 1:1 next-block organic reversion, so this limit ships named, not hidden.",
    ],
    [
      "The premium is a tax, not an LVR hedge",
      "The measured edge over a vanilla 3 bps pool after identical toxic flow is exactly the forfeited premium — no more. Slow trend that never reverts in-window keeps the LP's inventory risk. Dust donates can walk the quote toward 60 bps; refunds walk it back 1 bp at a time.",
    ],
    [
      "LPs are credited at settle, not “later”",
      "While the pool has liquidity, a donate verdict pays in-range LPs inside the settlement transaction itself. Only at zero liquidity does value wait for a permissionless flush — and settle is a call someone must send, never automatic.",
    ],
    [
      "A lone batch order is a TWAP, not CoW",
      "Two-sided epochs net at the TWAP and never touch the curve. An empty epoch with one order is honestly a one-epoch TWAP fill — no auction, no solver, no partner.",
    ],
    [
      "Batch leftover is still a spot swap",
      "Unmatched size clears as one bonded residual with an unbounded price limit. Cancelled orders cannot move the TWAP; a live residual can be sandwiched like any spot trade. Use two-sided netting when you care.",
    ],
  ];
  return (
    <section className="border-b border-line bg-card">
      <div className="section-shell py-16 md:py-24">
        <div className="grid gap-8 md:grid-cols-[0.7fr_1.3fr] md:gap-16">
          <div>
            <Eyebrow>Honest limits</Eyebrow>
            <h2 className="mt-4 font-display text-[38px] font-normal leading-[1.04] tracking-[-0.035em] text-ink md:text-[48px]">
              Named boundaries, not hidden caveats.
            </h2>
            <p className="mt-5 font-sans text-[13px] leading-relaxed text-muted">
              Markout is a precise mechanism with precise edges. These are part of the product,
              not fine print.
            </p>
          </div>
          <div className="border-t border-line">
            {limits.map(([t, b], i) => (
              <div key={t} className="grid gap-3 border-b border-line py-6 sm:grid-cols-[36px_0.65fr_1.35fr] sm:gap-6">
                <span className="font-mono text-[10px] text-rose">0{i + 1}</span>
                <div className="font-sans text-[13.5px] font-semibold text-ink">{t}</div>
                <p className="font-sans text-[12.5px] leading-relaxed text-muted">{b}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────── live on testnet ───────────────────────── */

const DEPLOYS: { name: string; chain: string; addr: string; href: string }[] = [
  {
    name: "MarkoutHook",
    chain: "Sepolia · canonical PM",
    addr: HOOK,
    href: `https://sepolia.etherscan.io/address/${HOOK.toLowerCase()}`,
  },
  {
    name: "MarkoutRouter",
    chain: "Sepolia · convenience",
    addr: ROUTER,
    href: `https://sepolia.etherscan.io/address/${ROUTER.toLowerCase()}`,
  },
  {
    name: "MarkoutBatchRouter",
    chain: "Sepolia · residual child",
    addr: BATCH_ROUTER,
    href: `https://sepolia.etherscan.io/address/${BATCH_ROUTER.toLowerCase()}`,
  },
  {
    name: "PoolManager",
    chain: "Sepolia · canonical, shared",
    addr: POOL_MANAGER,
    href: `https://sepolia.etherscan.io/address/${POOL_MANAGER.toLowerCase()}`,
  },
  {
    name: "Faucet MDB · token0",
    chain: "Sepolia · currency0",
    addr: TOKEN0,
    href: `https://sepolia.etherscan.io/address/${TOKEN0.toLowerCase()}`,
  },
  {
    name: "Faucet MDA · token1",
    chain: "Sepolia · currency1",
    addr: TOKEN1,
    href: `https://sepolia.etherscan.io/address/${TOKEN1.toLowerCase()}`,
  },
];

function LiveOnTestnet() {
  return (
    <section id="live" className="border-b border-line bg-secondary/55">
      <div className="section-shell py-16 md:py-24">
        <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <Eyebrow>Live on testnet</Eyebrow>
            <h2 className="mt-4 max-w-2xl font-display text-[40px] font-normal leading-[1.04] tracking-[-0.04em] text-ink md:text-[52px]">
              Read the proof, then use the pool.
            </h2>
          </div>
          <Badge variant="brand">
            <span className="h-1.5 w-1.5 rounded-full bg-brand animate-pulseSoft" />
            Sepolia · source-verified
          </Badge>
        </div>

        <Card className="mt-10 overflow-hidden border-line">
          <div className="grid divide-y divide-line sm:grid-cols-2 sm:divide-x lg:grid-cols-3">
            {DEPLOYS.map((d) => (
              <a
                key={d.name}
                href={d.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex min-h-24 items-center justify-between gap-4 p-5 transition-colors hover:bg-secondary/70"
              >
                <span>
                  <span className="block font-sans text-[13px] font-semibold text-ink">
                    {d.name}
                  </span>
                  <span className="block font-sans text-[11.5px] text-faint">{d.chain}</span>
                </span>
                <span className="addr rounded-lg border border-line bg-secondary/50 px-2 py-1">{short(d.addr)}</span>
              </a>
            ))}
          </div>
          <div className="border-t border-line bg-ink px-5 py-4 font-sans text-[11.5px] leading-relaxed text-canvas/60">
            Proof pack (2026-09-02): next-block reversion{" "}
            <a
              className="text-brand-bright underline-offset-4 hover:underline"
              href={explorerTx(PROOFS.refundSettle)}
              target="_blank"
              rel="noopener noreferrer"
            >
              refunded at settle ↗
            </a>
            {" "}· unreversed swap{" "}
            <a
              className="text-brand-bright underline-offset-4 hover:underline"
              href={explorerTx(PROOFS.donateSettleCredited)}
              target="_blank"
              rel="noopener noreferrer"
            >
              donated + credited in settle ↗
            </a>
            {" "}· two-sided batch{" "}
            <a
              className="text-brand-bright underline-offset-4 hover:underline"
              href={explorerTx(PROOFS.batchClear)}
              target="_blank"
              rel="noopener noreferrer"
            >
              cleared at one TWAP ↗
            </a>
            . Open the{" "}
            <a className="text-brand-bright underline-offset-4 hover:underline" href={APP_URL} target="_blank" rel="noopener noreferrer">
              hosted app ↗
            </a>{" "}
            · demo video — coming, human-recorded.
          </div>
        </Card>
      </div>
    </section>
  );
}

function short(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

/* ───────────────────────── final CTA ───────────────────────── */

function FinalCta() {
  return (
    <section className="border-b border-line bg-card">
      <div className="section-shell py-20 md:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mx-auto mb-7 w-40 memory-ribbon" aria-hidden />
          <h2 className="font-display text-[46px] font-normal leading-[0.98] tracking-[-0.045em] text-ink md:text-[64px]">
            Make a move. Let the next 24 seconds answer.
          </h2>
          <p className="mx-auto mt-6 max-w-xl font-sans text-[14px] leading-relaxed text-muted">
            Mint capped demo tokens, trade the live Sepolia pool, and settle the verdict
            yourself. Best in Chrome with MetaMask or another injected wallet.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg">
              <Link href="/app">Open the console <span aria-hidden>↗</span></Link>
          </Button>
          <Button asChild size="lg" variant="outline">
              <Link href="/docs">Read the mechanism</Link>
          </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <span className="eyebrow">{children}</span>;
}

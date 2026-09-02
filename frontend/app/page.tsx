import Link from "next/link";
import { Seal } from "@/components/Brand";
import { LandingTape } from "@/components/LandingTape";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { APP_URL, HOOK, ROUTER, TOKEN0, TOKEN1, POOL_MANAGER } from "@/lib/contracts";

/**
 * Markout landing: cream paper, ink text, magenta brand, hatch strip + facts
 * ticker, editorial sections with hairline rules, and a full-bleed ink band
 * for the differentiator.
 */
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

/* ───────────────────────── top ticker ───────────────────────── */

const TICKER = [
  "Live on the canonical Sepolia PoolManager",
  "Any v4 router can pay the bond — no allowlist, no settleFor",
  "24-second fixed window: verdicts can't change with delay",
  "55 passing Foundry tests incl. canonical fork",
  "Toxic one-shot flow pays in-range LPs",
];

function Ticker() {
  return (
    <>
      <div className="hatch h-6 border-b border-edge" />
      <div className="overflow-hidden border-b border-edge bg-background">
        <div className="flex w-max animate-marquee">
          {[0, 1].map((copy) => (
            <div key={copy} aria-hidden={copy === 1} className="flex shrink-0 items-center">
              {TICKER.map((t) => (
                <span
                  key={t}
                  className="flex items-center gap-2 px-5 py-1.5 font-sans text-[12px] text-ink-soft"
                >
                  <span className="text-[13px] leading-none text-gold animate-spinSlow">M</span>
                  {t}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

/* ───────────────────────── hero ───────────────────────── */

function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-edge">
      <div
        className="pointer-events-none absolute inset-x-0 -top-24 h-80 opacity-70"
        style={{ background: "radial-gradient(680px 280px at 68% 0%, rgba(181,39,111,0.12), transparent 70%)" }}
      />
      <div className="relative mx-auto grid max-w-content items-center gap-10 px-5 pb-14 pt-14 md:px-8 md:pt-20 lg:grid-cols-[1.05fr_1fr]">
        <div className="text-center lg:text-left">
          <Badge variant="brand" className="animate-rise">
            <span className="h-1.5 w-1.5 rounded-full bg-brand animate-pulseSoft" />
            Uniswap Hookathon · UHI10 · Sustainable Liquidity &amp; MEV Protection
          </Badge>

          <h1 className="mt-6 animate-rise font-display text-[40px] font-semibold leading-[1.04] tracking-tightest text-ink [animation-delay:60ms] md:text-[60px] lg:text-[64px]">
            The pool that remembers,{" "}
            <span className="text-brand">and makes toxic flow pay.</span>
          </h1>

          <p className="mx-auto mt-6 max-w-xl animate-rise font-sans text-[16px] leading-relaxed text-ink-soft [animation-delay:120ms] lg:mx-0">
            Each swap is marked 24 seconds later. If at least half of that swap&apos;s own price
            impact reverted, the bond returns to the trader at settle. If it stayed,{" "}
            <strong className="font-semibold text-ink">in-range LPs keep it</strong> — so a
            volatile pool can quote 3 bps without farming its own liquidity.
          </p>

          <div className="mt-8 flex animate-rise flex-wrap items-center justify-center gap-3 [animation-delay:180ms] lg:justify-start">
            <Button asChild size="lg">
              <Link href="/app">Launch App →</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/docs">Read the docs</Link>
            </Button>
          </div>

          <p className="mx-auto mt-6 animate-rise font-mono text-[11px] text-faint [animation-delay:240ms] lg:mx-0">
            live at <a className="text-brand underline-offset-2 hover:underline" href={APP_URL} target="_blank" rel="noopener noreferrer">{APP_URL.replace("https://", "")}</a> · Chrome + MetaMask on Sepolia
          </p>
        </div>

        <div className="animate-rise [animation-delay:300ms]">
          <LandingTape />
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────── how it works ───────────────────────── */

function HowItWorks() {
  const steps = [
    {
      n: "①",
      place: "The swap",
      title: "Bond posted",
      body: "Swaps fill instantly at 3 bps. The hook charges a live-quoted reversion-insurance premium — priced from this pool's own settle history (starts at 20 bps, clamps 5–60) — straight onto the swap caller's own PoolManager delta. Any router that can settle a normal v4 swap pays it; no Markout-specific step.",
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
      body: "Revert past half your own impact and the bond is refunded in the settlement transaction. Sustain, and it's forfeited to in-range LPs — flushed permissionlessly whenever liquidity exists. One claim path exists, only for failed delivery.",
      badge: "Refund paid at settle",
      kind: "gold" as const,
      mini: <VerdictMini />,
    },
  ];
  return (
    <section id="how" className="border-b border-edge">
      <div className="mx-auto max-w-content px-5 py-14 md:px-8">
        <Eyebrow>How it works</Eyebrow>
        <h2 className="mt-3 max-w-2xl font-display text-[28px] font-semibold tracking-tight text-ink md:text-[38px]">
          Bond, memory, verdict.
        </h2>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {steps.map((s) => (
            <Card key={s.place} className="flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <span className="font-display text-[26px] text-gold">{s.n}</span>
                  <span className="font-sans text-[11px] font-bold uppercase tracking-[0.18em] text-muted">
                    {s.place}
                  </span>
                </div>
                <CardTitle className="pt-1 text-[20px]">{s.title}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col">
                <p className="note flex-1">{s.body}</p>
                <div className="mt-4">{s.mini}</div>
                <Badge variant={s.kind} className="mt-4 w-fit">
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${s.kind === "brand" ? "bg-brand animate-pulseSoft" : "bg-gold"}`}
                  />
                  {s.badge}
                </Badge>
              </CardContent>
            </Card>
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
        <span className="text-brand">bond</span> <span className="text-faint">=</span>{" "}
        <span className="text-ink">amountIn × 20 bps</span>
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

/* ───────────────────────── comparison ledgers ───────────────────────── */

function Comparison() {
  return (
    <section className="border-b border-edge">
      <div className="mx-auto max-w-content px-5 py-14 md:px-8">
        <Eyebrow>The trade-off</Eyebrow>
        <h2 className="mt-3 max-w-2xl font-display text-[28px] font-semibold tracking-tight text-ink md:text-[38px]">
          Vanilla AMM vs Markout LP.
        </h2>
        <p className="mt-4 max-w-2xl prose-doc">
          A volatile pool either charges enough fee to cover toxic flow, or it bleeds. Markout
          makes the toxic flow itself pay, so the advertised fee can stay tight.
        </p>

        <div className="mt-10 grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[13px] font-semibold text-muted">
                <span className="h-2 w-2 rounded-full bg-rose" /> Vanilla AMM LP
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Ledger
                rows={[
                  ["Advertised fee", "high, to cover toxicity", "text-ink"],
                  ["Single-shot arb", "extracted, free", "text-rose"],
                  ["Organic flow", "pays the high fee too", "text-rose"],
                  ["LP dividend", "none — losses only", "text-rose"],
                ]}
                foot={["Net", "tight quotes impossible", "text-rose"]}
              />
            </CardContent>
          </Card>
          <Card className="bg-secondary/40">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[13px] font-semibold text-brand">
                <Seal size={20} /> Markout LP
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Ledger
                rows={[
                  ["Advertised fee", "3 bps", "text-ink"],
                  ["Single-shot arb", "premium → LPs", "text-brand"],
                  ["Organic flow", "bond refunded at settle", "text-brand"],
                  ["LP dividend", "forfeited bonds, flushed in", "text-brand"],
                ]}
                foot={["Net", "tight quotes, toxic flow pays", "text-brand"]}
              />
            </CardContent>
          </Card>
        </div>
        <p className="mt-4 font-sans text-[12px] text-faint">
          3 / 20 bps and the 24 s window are demo constants, each a one-line change in the hook.
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
      "The bond rides the swap caller's own delta. Universal Router, your contract, v4's own test routers — all pay it unchanged.",
    ],
    [
      "Toxic flow pays into the pool",
      "Sustained one-shot moves forfeit their bond to in-range liquidity on-chain — no off-chain component, no private orderflow, no keepers required for correctness.",
    ],
    [
      "No partner integrations",
      "The oracle is entirely hook-local: pool ticks plus the hook's own accumulator. No Chainlink, no Pyth, nothing external.",
    ],
  ];
  return (
    <section className="border-b border-edge bg-foreground text-background">
      <div className="mx-auto max-w-content px-5 py-16 md:px-8">
        <span className="font-sans text-[11px] font-bold uppercase tracking-[0.22em] text-gold-bright">
          The differentiator
        </span>
        <h2 className="mt-3 max-w-2xl font-display text-[28px] font-semibold tracking-tight text-background md:text-[40px]">
          Toxic flow pays in-range LPs. On the canonical pool.
        </h2>
        <p className="mt-4 max-w-2xl font-sans text-[15.5px] leading-relaxed text-background/75">
          Directional fees in{" "}
          <code className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[13.5px] text-gold-bright">
            beforeSwap
          </code>{" "}
          are common. Markout taxes the informed move itself: it forfeits its bond into the pool
          it tried to exploit, on the same shared infrastructure every v4 pool uses.
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {points.map(([t, b]) => (
            <Card key={t} className="border-white/15 bg-white/[0.04]">
              <CardContent className="p-6">
                <div className="font-sans text-[15px] font-semibold text-background">{t}</div>
                <p className="mt-1.5 font-sans text-[13px] leading-relaxed text-background/65">
                  {b}
                </p>
              </CardContent>
            </Card>
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
      "20 bps is a tax, not an LVR hedge",
      "The measured edge over a vanilla 3 bps pool after identical toxic flow is exactly the forfeited bond — no more. Slow trend flow that never reverts in-window keeps the LP's inventory risk.",
    ],
    [
      "LPs are credited at settle, not “later”",
      "While the pool has liquidity, a donate verdict pays in-range LPs inside the settlement transaction itself. Only at zero liquidity does value wait for a permissionless flush — and settle is a call someone must send, never automatic.",
    ],
    [
      "A lone batch order is a TWAP, not CoW",
      "The opt-in batch lane nets opposing orders in a 24 s epoch and clears everyone at one uniform price. An empty epoch with one order is honestly a one-epoch TWAP fill — no auction, no solver, no partner.",
    ],
  ];
  return (
    <section className="border-b border-edge bg-secondary/30">
      <div className="mx-auto max-w-content px-5 py-12 md:px-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <Eyebrow>Honest limits</Eyebrow>
            <h2 className="mt-3 font-display text-[24px] font-semibold tracking-tight text-ink md:text-[30px]">
              What this hook does not do.
            </h2>
          </div>
        </div>
        <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {limits.map(([t, b]) => (
            <div key={t} className="rounded-xl border border-line bg-card p-5">
              <div className="flex items-start gap-2.5">
                <span className="mt-0.5 font-mono text-[13px] text-rose">✕</span>
                <div>
                  <div className="font-sans text-[13.5px] font-semibold text-ink">{t}</div>
                  <p className="mt-1.5 font-sans text-[12.5px] leading-relaxed text-muted">{b}</p>
                </div>
              </div>
            </div>
          ))}
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
    name: "PoolManager",
    chain: "Sepolia · canonical, shared",
    addr: POOL_MANAGER,
    href: `https://sepolia.etherscan.io/address/${POOL_MANAGER.toLowerCase()}`,
  },
  {
    name: "Faucet MDA",
    chain: "Sepolia · capped (MDB sibling)",
    addr: TOKEN0,
    href: `https://sepolia.etherscan.io/address/${TOKEN0.toLowerCase()}`,
  },
];

function LiveOnTestnet() {
  return (
    <section id="live" className="border-b border-edge">
      <div className="mx-auto max-w-content px-5 py-14 md:px-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <Eyebrow>Live on testnet</Eyebrow>
            <h2 className="mt-3 font-display text-[28px] font-semibold tracking-tight text-ink md:text-[36px]">
              Deployed, and verifiable on-chain.
            </h2>
          </div>
          <Badge variant="brand">
            <span className="h-1.5 w-1.5 rounded-full bg-brand animate-pulseSoft" />
            Sepolia · source-verified
          </Badge>
        </div>

        <Card className="mt-8 overflow-hidden">
          <div className="grid divide-y divide-edge sm:grid-cols-2 sm:divide-x">
            {DEPLOYS.map((d) => (
              <a
                key={d.name}
                href={d.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center justify-between gap-4 p-5 transition-colors hover:bg-secondary/50"
              >
                <span>
                  <span className="block font-sans text-[14px] font-semibold text-ink">
                    {d.name}
                  </span>
                  <span className="block font-sans text-[11.5px] text-faint">{d.chain}</span>
                </span>
                <span className="addr">{short(d.addr)}</span>
              </a>
            ))}
          </div>
          <div className="border-t border-edge px-5 py-3 font-sans text-[12px] text-muted">
            Fresh proof pack (2026-08-31): a reversion that landed in{" "}
            <strong>exactly the next block</strong>{" "}
            <a
              className="text-brand underline-offset-2 hover:underline"
              href="https://sepolia.etherscan.io/tx/0x3e229140155705e5bfc46deb33ce4699c187603b940bd1b0fb504da7fb3d33b1"
              target="_blank"
              rel="noopener noreferrer"
            >
              refunded at settlement ↗
            </a>{" "}
            and an unreversed single-shot swap{" "}
            <a
              className="text-brand underline-offset-2 hover:underline"
              href="https://sepolia.etherscan.io/tx/0xf5834a3db146d8de0c218e0034a4fe4c298a9af4879ee2bd569f8fe8b2538031"
              target="_blank"
              rel="noopener noreferrer"
            >
              donated + flushed ↗
            </a>
            . Open the{" "}
            <a className="text-brand underline-offset-2 hover:underline" href={APP_URL} target="_blank" rel="noopener noreferrer">
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
    <section className="border-b border-edge">
      <div className="mx-auto max-w-content px-5 py-16 text-center md:px-8">
        <h2 className="font-display text-[28px] font-semibold tracking-tight text-ink md:text-[36px]">
          Post a bond. Watch the memory decide.
        </h2>
        <p className="mx-auto mt-3 max-w-xl font-sans text-[15px] leading-relaxed text-muted">
          Mint capped demo tokens, swap through any router you like, and settle the verdict
          yourself. Best in Chrome desktop with MetaMask (or any injected wallet) on Sepolia —
          no faucet site, no partner keys.
        </p>
        <div className="mt-7 flex justify-center gap-3">
          <Button asChild size="lg">
            <Link href="/app">Launch App →</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/docs">Read the docs</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <span className="eyebrow">{children}</span>;
}

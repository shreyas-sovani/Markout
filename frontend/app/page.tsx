import Link from "next/link";
import { Seal } from "@/components/Brand";
import { HeroVisual } from "@/components/HeroVisual";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { HOOK, ROUTER, TOKEN0, TOKEN1, POOL_MANAGER } from "@/lib/contracts";

/**
 * Markout landing on Lambda's shell: cream paper, ink text, magenta brand,
 * hatch strip + facts ticker, editorial sections with hairline rules, and a
 * full-bleed ink band for the differentiator.
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
  "43 passing Foundry tests incl. canonical fork",
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
            A Uniswap v4 hook that lets a volatile pool quote tight and stay solvent: one-shot
            arbitrage posts a bond it forfeits to in-range liquidity, and organic flow gets it{" "}
            <strong className="font-semibold text-brand">refunded at settlement</strong> the
            moment the price reverts behind it.
          </p>

          <div className="mt-8 flex animate-rise flex-wrap items-center justify-center gap-3 [animation-delay:180ms] lg:justify-start">
            <Button asChild size="lg">
              <Link href="/app">Launch App →</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/docs">Read the docs</Link>
            </Button>
          </div>

          <dl className="mx-auto mt-9 grid max-w-md animate-rise grid-cols-3 divide-x divide-edge overflow-hidden rounded-lg border border-edge [animation-delay:240ms] lg:mx-0">
            {[
              ["3 bps", "fill fee"],
              ["24 s", "fixed window"],
              ["43", "tests passing"],
            ].map(([v, k]) => (
              <div key={k} className="bg-card px-2 py-4 text-center">
                <dt className="font-display text-[20px] font-semibold tabular-nums tracking-tight text-ink">
                  {v}
                </dt>
                <dd className="mt-1 font-sans text-[11px] leading-snug text-muted">{k}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="hidden animate-rise [animation-delay:300ms] lg:block">
          <HeroVisual />
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
      body: "Swaps fill instantly at 3 bps. The hook charges a 20 bps input bond straight onto the swap caller's own PoolManager delta — any router that can settle a normal v4 swap pays it, no Markout-specific step.",
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
                  ["Single-shot arb", "20 bps bond → LPs", "text-brand"],
                  ["Organic flow", "bond refunded at settle", "text-brand"],
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
      "MEV internalized on-chain",
      "Toxic flow pays LPs inside the pool, with no off-chain component, no private orderflow, and no keepers required for correctness.",
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
          Toxic flow pays the LPs. On the canonical pool.
        </h2>
        <p className="mt-4 max-w-2xl font-sans text-[15.5px] leading-relaxed text-background/75">
          Directional fees in{" "}
          <code className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[13.5px] text-gold-bright">
            beforeSwap
          </code>{" "}
          are common. Markout internalizes the MEV itself: the informed move forfeits its bond
          into the pool it tried to exploit, on the same shared infrastructure every v4 pool
          uses.
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
            Fresh proof pack: a 1:1 next-block reversion{" "}
            <a
              className="text-brand underline-offset-2 hover:underline"
              href="https://sepolia.etherscan.io/tx/0xda16e75a54e340692774f1405158a5870737b6e33df6400835db1fa6600ddc49"
              target="_blank"
              rel="noopener noreferrer"
            >
              refunded at settlement ↗
            </a>{" "}
            and the reversal trade{" "}
            <a
              className="text-brand underline-offset-2 hover:underline"
              href="https://sepolia.etherscan.io/tx/0xbda1222053c34f4b281082df0b139c04668d8fe8f15238d490d288bc277bfe66"
              target="_blank"
              rel="noopener noreferrer"
            >
              donated + flushed ↗
            </a>
            .
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
          yourself — the runbook is four commands.
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

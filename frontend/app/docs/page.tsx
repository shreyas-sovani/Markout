import type { Metadata } from "next";
import Link from "next/link";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "How Markout works · docs",
  description:
    "The logic behind Markout: the live-quoted reversion-insurance premium, the 24-second fixed window, the 50% reversion frontier, the opt-in batch lane, outcomes, the any-router hook-delta charge, and why there are no partner integrations.",
};

export default function Docs() {
  return (
    <div className="relative z-10">
      <SiteNav
        sub="Docs"
        links={[
          { href: "/", label: "Home" },
          { href: "/docs", label: "Docs" },
          { href: "/app", label: "App" },
        ]}
        rightSlot={
          <Button asChild size="sm">
            <Link href="/app">Launch App →</Link>
          </Button>
        }
      />

      <main className="mx-auto max-w-3xl px-5 py-14 pb-28 md:px-8">
        <span className="eyebrow">Documentation</span>
        <h1 className="mt-3 font-display text-[40px] font-semibold leading-tight tracking-tightest text-ink md:text-[52px]">
          How Markout works
        </h1>
        <p className="mt-4 max-w-2xl font-sans text-[17px] leading-relaxed text-ink-soft">
          Markout makes toxic one-shot flow pay in-range LPs and refunds organic flow when the
          price reverts behind it. Here is the whole mechanism — the bond, the window, the
          frontier, and why any router can pay it.
        </p>

        <Toc />

        <article className="mt-6 prose-doc">
          <section id="problem">
            <h2>The problem: one-shot arbitrage</h2>
            <p>
              MEV-protection hooks that analyze <em>continuation</em> flow miss the most dangerous
              case: an arbitrageur that executes <strong>exactly one trade</strong> to snap the AMM
              to the global price and leaves. There is no continuation to analyze. So Markout
              doesn&apos;t look at what the trader did — it looks at{" "}
              <strong>what the pool&apos;s price did after them</strong>.
            </p>
            <Callout>
              Informed flow moves the pool <em>to</em> the global price and it stays. Uninformed
              flow moves the pool <em>away</em>, and natural arbitrageurs push it back within
              seconds.
            </Callout>
          </section>

          <section id="bond">
            <h2>The premium, payable through any router</h2>
            <p>
              Every swap fills immediately at the pool&apos;s 3 bps fee. On top, the hook charges a{" "}
              <strong>reversion-insurance premium</strong> — a live-quoted bps rate of the realized input taken from
              the post-swap <code>balanceDelta</code>, never a <code>slot0</code> estimate, for
              exact-in and exact-out alike. Dust swaps whose bond would round to zero revert with{" "}
              <code>SwapTooSmall</code>.
            </p>
            <p>
              The charge rides v4&apos;s hook-delta mechanism: for exact-in swaps the hook returns
              it on the <em>specified</em> delta in <code>beforeSwap</code>; for exact-out swaps on
              the <em>unspecified</em> delta in <code>afterSwap</code>. Either way it lands in the{" "}
              <strong>swap caller&apos;s own PoolManager delta</strong> — so any router that can
              settle a normal v4 swap (Universal Router, your own contract, v4&apos;s test routers)
              pays it with zero Markout-specific code. No allowlist, no <code>settleFor</code>, no{" "}
              <code>initializeRouter</code>.
            </p>
            <Formula>premium = amountIn × premiumBps(pool) · donate +3 bps, refund −1 bps · clamp 5–60</Formula>
            <p>
              The rate is <strong>live-quoted from this pool&apos;s own settle history</strong>: every
              donate verdict raises it 3 bps, every refund verdict lowers it 1 bp, and it clamps at
              5 bps (dust swaps can never bypass) and 60 bps (no runaway). The only way to pump the
              rate is to actually donate real premia to LPs, so the grief is self-funding for the
              pool — poke spam and token gifts cannot move it. <code>premiumQuoteFor</code> is the
              exact rate the next swap charges.
            </p>
          </section>

          <section id="window">
            <h2>The 24-second fixed window</h2>
            <p>
              Each trade records its own immutable window{" "}
              <code>[bondTime, bondTime + 24 s]</code>. The hook maintains a{" "}
              <strong>previous-tick accumulator</strong> (Uniswap-V2-style attribution: elapsed time
              accrues to the tick held <em>before</em> each update), stored as an{" "}
              <strong>append-only history</strong> that nothing ever prunes. Settlement computes the
              window&apos;s average tick by binary-searching that history — so settling at window
              close, an hour late, or after heavy churn produces the <em>identical</em> verdict, and
              permissionless pokes or later swaps can never freeze escrow.
            </p>
            <p>
              24 s ≈ two 12 s blocks: a full 1:1 reversion landing <strong>one block after the
              trade</strong> sits exactly on the 50% frontier and refunds — no overshoot needed.
            </p>
            <Formula>T = 24 s · avgTick = (Σ tick_held × Δt) / T over the immutable window</Formula>
          </section>

          <section id="frontier">
            <h2>The 50% reversion frontier</h2>
            <p>
              The classifier is <strong>normalized</strong>: it compares the reversion to the
              trade&apos;s <em>own</em> impact, measured in tick space, not to an absolute bps band.
              A 2-tick trade and a 2000-tick trade face the same frontier.
            </p>
            <Formula>
              impact = post − pre · residual = avg − pre · refund ⟺ residual × 2 ≤ impact
            </Formula>
            <p>
              Zero-impact trades refund. Overshoot past <code>pre</code> refunds. Movement further
              away donates. In plain English: <strong>if at least half of your own price impact
              came back, you were organic and the bond returns — in the settlement transaction
              itself.</strong>
            </p>
          </section>

          <section id="outcomes">
            <h2>Outcomes 1 / 2 / 3</h2>
            <p>
              Settlement is permissionless — anyone calls <code>settle(tradeId)</code> after the
              window — and terminal: the verdict is recorded before any value moves, and{" "}
              <code>settle</code> credits in-range LPs in the same transaction whenever liquidity exists.
            </p>
            <Step n="①" place="outcome 1 · Refunded">
              The oracle said refund and the token delivered. The bond is paid to the trader{" "}
              <strong>inside the settlement transaction</strong>. No claim transaction exists on
              this path.
            </Step>
            <Step n="②" place="outcome 2 · RefundPending">
              The oracle said refund but delivery failed (blacklist-style tokens). The verdict
              survives; <code>claimRefund</code> retries it, marking claimed before the transfer so
              reentrancy and replay are impossible. A failed retry resets and stays retryable —
              settlement can never brick.
            </Step>
            <Step n="③" place="outcome 3 · Donated">
              The price sustained. The premium is forfeited — and whenever the pool has active
              liquidity, <strong>in-range LPs are credited inside the settlement transaction
              itself</strong> through v4&apos;s <code>donate()</code>. Only at zero liquidity does
              the value wait in a per-pool pending bucket for the permissionless{" "}
              <code>flushDonation(poolId)</code>; the settle itself still succeeds and can never
              brick.
            </Step>
          </section>

          <section id="batch">
            <h2>The opt-in batch lane</h2>
            <p>
              The SAME 24-second clock runs a second, opt-in lane. A trader enqueues one side of a
              24 s epoch by calling <code>placeBatchOrder</code> directly — no router needed — and
              the full deposit moves into explicit custody in the hook, cancellable any time
              before the epoch clears. When the epoch ends, <strong>anyone</strong> calls{" "}
              <code>clearBatch</code>: opposing orders net at the epoch&apos;s accumulator TWAP,
              the dust-bounded residual executes as <strong>one normal bonded spot swap</strong>{" "}
              (through an immutable hook-owned child router — v4-core skips hook callbacks on
              self-calls, so the hook cannot dodge its own premium lane), and every order on a
              side fills at the <strong>same uniform price</strong>: the TWAP clamped by realized
              execution, so the hook never subsidizes a fill.
            </p>
            <Callout>
              Honest limits of the batch lane: a lone order in an empty epoch is a one-epoch TWAP
              fill — not a CoW-style auction. Cancelled orders cannot move the TWAP (the price is
              time-weighted, not book-ordered). Unmatched leftover still clears as one bonded
              residual with an unbounded price limit — that path is a spot swap and can be
              sandwiched like any other. Two-sided exact nets never hit the curve. Clearing late
              is identical because the epoch TWAP is immutable in the append-only accumulator.
            </Callout>
          </section>

          <section id="any-router">
            <h2>Why any router works</h2>
            <p>
              Because the premium is part of the swap caller&apos;s own delta, a router settles it the
              way it settles every other wei it owes: pay your own delta, done. The provided{" "}
              <code>MarkoutRouter</code> is convenience, not a gate — it adds a deadline, exact-in
              minimum output, exact-out maximum input (bond included), strict transfer checks, and
              native support, and declares the human beneficiary in <code>hookData</code> so
              refunds route to the end user.
            </p>
            <p>
              The beneficiary rule is exact: only a 32-byte <code>hookData</code> holding a{" "}
              <strong>nonzero</strong> address declares a beneficiary. Empty payloads,
              arbitrary-length payloads, and a zeroed 32-byte word all fall back to the direct
              swap caller — no revert mid-swap, and no refund can ever be sent to{" "}
              <code>address(0)</code>. <strong>Universal Router integrators: pass exactly{" "}
              <code>abi.encode(endUser)</code></strong> as <code>hookData</code>; a router that
              declares nothing receives its own refunds.
            </p>
            <Formula>
              swapDelta(caller) = poolDelta − hookDelta(bond) · settle your delta, that&apos;s it
            </Formula>
          </section>

          <section id="no-partners">
            <h2>No partner integrations</h2>
            <p>
              The toxicity oracle is <strong>entirely hook-local</strong>: pre/post swap ticks plus
              the hook&apos;s own accumulator. No Chainlink, no Pyth, no off-chain component, no
              private orderflow, and no keepers required for correctness — the optional{" "}
              <code>keeper.sh</code> just pokes, settles, retries claims, and flushes on a timer.
              The deployment targets the <strong>canonical Sepolia PoolManager</strong>, so the
              hook is a standard v4 citizen on shared infrastructure.
            </p>
            <Callout>
              What the oracle honestly does not catch: slow trend flow that never reverts
              in-window, the front leg of an atomic <em>spot</em> sandwich (the backrun&apos;s
              reversion refunds it — the backrun leg is what donates), a live batch residual
              (unmatched size is an unbounded-limit spot swap), and donations go to whoever is
              in range at credit time (settle), not the specific LPs who carried the inventory.
              Dust donates can walk the live quote toward 60 bps. The premium is a deterrent tax
              on one-shot toxicity, not an LVR hedge — and settle is a transaction someone must
              send: permissionless, never automatic.
            </Callout>
          </section>

          <section id="try">
            <h2>Try it</h2>
            <p>
              Hosted at{" "}
              <a href="https://markout-nine.vercel.app" className="text-brand underline-offset-2 hover:underline" target="_blank" rel="noopener noreferrer">
                markout-nine.vercel.app
              </a>{" "}
              — best in Chrome desktop with MetaMask (or any injected wallet) on Sepolia. The{" "}
              <Link href="/app" className="text-brand underline-offset-2 hover:underline">app</Link>{" "}
              runs the whole loop against the live deployment, with one-click deterministic demos
              for both verdicts; the landing page streams the live tape with no wallet at all.
              The terminal runbook in <code>demo.md</code> is copy-pasteable on the current ABI —
              including the pre-signed back-to-back swap pair that lands the reversion one block
              after the buy. Demo video: coming, human-recorded.
            </p>
          </section>
        </article>
      </main>

      <SiteFooter />
    </div>
  );
}

/* ── docs chrome ── */

function Toc() {
  const items: [string, string][] = [
    ["problem", "The problem"],
    ["bond", "The premium"],
    ["window", "The 24 s window"],
    ["frontier", "The 50% frontier"],
    ["outcomes", "Outcomes 1 / 2 / 3"],
    ["batch", "The batch lane"],
    ["any-router", "Any router"],
    ["no-partners", "No partner integrations"],
    ["try", "Try it"],
  ];
  return (
    <Card className="mt-8">
      <CardContent className="p-5">
        <div className="eyebrow">Contents</div>
        <ul className="mt-3 grid gap-x-6 gap-y-1.5 font-sans text-[13.5px] sm:grid-cols-2">
          {items.map(([id, label]) => (
            <li key={id}>
              <a href={`#${id}`} className="text-ink-soft transition-colors hover:text-brand">
                {label}
              </a>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function Formula({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-5 rounded-xl border border-line bg-secondary px-5 py-4 font-mono text-[14px] tabular-nums text-brand">
      {children}
    </div>
  );
}

function Callout({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-5 rounded-xl border border-brand/25 bg-brand/[0.05] px-5 py-4 font-sans text-[14.5px] leading-relaxed text-ink-soft">
      {children}
    </div>
  );
}

function Step({ n, place, children }: { n: string; place: string; children: React.ReactNode }) {
  return (
    <div className="my-4 flex gap-4">
      <span className="font-display text-[24px] leading-none text-gold">{n}</span>
      <div>
        <div className="font-sans text-[11px] font-bold uppercase tracking-[0.18em] text-muted">
          {place}
        </div>
        <p className="mt-1 text-[15px] leading-relaxed text-ink-soft">{children}</p>
      </div>
    </div>
  );
}

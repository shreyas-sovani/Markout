import type { Metadata } from "next";
import Link from "next/link";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "How Markout works · docs",
  description:
    "The logic behind Markout: the live-quoted reversion-insurance premium, the 24-second fixed window, the 50% reversion frontier, the opt-in batch lane, outcomes, and the any-router hook-delta charge.",
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

      <main className="pb-28">
        <header className="border-b border-line bg-card">
          <div className="section-shell py-14 md:py-20">
            <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
              <div>
                <span className="section-kicker">Protocol documentation</span>
                <h1 className="mt-5 max-w-3xl font-display text-[52px] font-normal leading-[0.96] tracking-[-0.05em] text-ink md:text-[72px]">
                  A short memory for a precise market question.
                </h1>
              </div>
              <p className="max-w-xl border-l border-line pl-6 font-sans text-[15px] leading-relaxed text-ink-soft">
                Markout asks what the pool&apos;s price did after a trade. If the move reverted,
                the premium returns. If it held, active liquidity receives it. This is the
                mechanism from first swap to terminal verdict.
              </p>
            </div>
          </div>
        </header>

        <div className="section-shell grid gap-10 py-12 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-16 lg:py-16">
          <aside className="lg:sticky lg:top-28 lg:self-start">
            <Toc />
            <div className="mt-5 hidden border-t border-line pt-5 lg:block">
              <div className="font-mono text-[9px] uppercase tracking-[0.12em] text-faint">Reading note</div>
              <p className="mt-2 font-sans text-[11.5px] leading-relaxed text-muted">
                All timing is chain time. All addresses and proof transactions refer to the live
                canonical Sepolia deployment.
              </p>
            </div>
          </aside>

          <article className="prose-doc min-w-0 max-w-3xl">
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
            <Callout>
              The premium is a deterrent tax on one-shot toxicity, not a complete LVR hedge.
              Slow trend that never reverts inside the window still leaves LPs with inventory
              risk. Dust donations can walk the quote toward 60 bps; refunds move it back one
              basis point at a time.
            </Callout>
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
            <Callout>
              An atomic spot sandwich remains an honest boundary: the front leg and victim can
              refund because the backrun restores price; the unreversed backrun leg is what
              donates. A same-block rule cannot distinguish that front leg from a legitimate
              one-block reversion.
            </Callout>
          </section>

          <section id="outcomes">
            <h2>Outcomes 1 / 2 / 3</h2>
            <p>
              Settlement is permissionless — anyone calls <code>settle(tradeId)</code> after the
              window — and terminal: the verdict is recorded before any value moves, and{" "}
              <code>settle</code> credits in-range LPs in the same transaction whenever liquidity
              exists. Permissionless does not mean automatic: someone still has to send the
              settlement transaction.
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
              brick. Credit goes to whoever is in range at settlement or flush time, not
              specifically to the LPs who carried inventory through the original move.
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
        </div>
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
    ["try", "Try it"],
  ];
  return (
    <nav aria-label="On this page" className="rounded-xl2 border border-line bg-secondary/55 p-5 lg:rounded-none lg:border-0 lg:bg-transparent lg:p-0">
        <div className="eyebrow">On this page</div>
        <ul className="mt-4 grid gap-x-6 gap-y-1 font-sans text-[12.5px] sm:grid-cols-2 lg:grid-cols-1">
          {items.map(([id, label], i) => (
            <li key={id}>
              <a href={`#${id}`} className="group flex items-center gap-3 rounded-lg px-2 py-2 text-muted transition-colors hover:bg-card hover:text-ink">
                <span className="font-mono text-[9px] text-faint group-hover:text-brand">0{i + 1}</span>
                <span>{label}</span>
              </a>
            </li>
          ))}
        </ul>
    </nav>
  );
}

function Formula({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-7 overflow-hidden rounded-xl2 border border-line bg-ink shadow-card">
      <div className="memory-ribbon opacity-80" aria-hidden />
      <div className="px-5 py-5 font-mono text-[13px] leading-relaxed tabular-nums text-brand-bright md:px-6">
        {children}
      </div>
    </div>
  );
}

function Callout({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-7 border-l-2 border-brand bg-brand/[0.055] px-5 py-4 font-sans text-[14px] leading-relaxed text-ink-soft">
      {children}
    </div>
  );
}

function Step({ n, place, children }: { n: string; place: string; children: React.ReactNode }) {
  return (
    <div className="my-4 grid gap-3 rounded-xl border border-line bg-card p-5 shadow-[0_1px_0_rgba(24,24,23,0.04)] sm:grid-cols-[42px_1fr]">
      <span className="font-mono text-[10px] leading-none text-brand">{n}</span>
      <div>
        <div className="font-mono text-[9.5px] font-medium uppercase tracking-[0.12em] text-muted">
          {place}
        </div>
        <p className="mb-0 mt-2 text-[14px] leading-relaxed text-ink-soft">{children}</p>
      </div>
    </div>
  );
}

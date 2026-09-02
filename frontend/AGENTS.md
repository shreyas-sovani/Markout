# AGENTS.md — frontend/

## Ownership

The live browser UI for the Markout protocol — the demo surface judges and traders actually touch. Owns nothing on-chain; every transaction it sends targets the immutable Sepolia deployment described in the root README.

## Purpose
Markout's face: warm-paper light theme — cream canvas #faf8f2, ink text, magenta brand #B5276F, gold accent — Fraunces display + Hanken Grotesk UI + JetBrains Mono for addresses/amounts, Tailwind + shadcn/ui new-york primitives, sticky `SiteNav` with mobile Sheet drawer, hatch strip + marquee facts ticker, `.tape` / `.panel` / `.eyebrow` / `.stat-row` / `.addr` vocabulary, `max-w-content` editorial rhythm, and a full-bleed ink differentiator band. Three routes: `/` landing (hero with the **live `LandingTape`** — the real MemoryTape streaming slot0 with no wallet, no KPI strip in the hero — how-it-works cards, vanilla-vs-Markout LP ledgers with the dividend row, ink band, live-on-testnet address grid + hosted-URL line + video hole, final CTA with the Chrome+MetaMask+Sepolia judge note), `/app` memory console (Pipeline Connect→Mint→Swap→Settle, swap panel, paper MemoryTape, **`LpSeat`** — pool-wide in-range liquidity, pending donation bucket, all-time flush total, permissionless flush button — settle/claim/flush, recovered-trade ledger), `/docs` (TOC, Formula/Callout/Step chrome, honest-limits callout incl. sandwich hole + 20 bps-is-a-tax). All wallet/tx wiring lives in `lib/markout.tsx` (MarkoutProvider) so pages stay in sync. Hosted at https://markout-nine.vercel.app (also in README, footer, docs, `layout.tsx` metadataBase).
## What This Controls

Nothing in the protocol — the UI is read/write over existing contracts. What breaks if it's wrong: judges can't complete the demo flow (approve gating, tradeId capture, settle timing), or see a wrong outcome. Value movement is gated on-chain, not here; a UI bug can confuse but cannot misappropriate funds.

## Connections

- Depends on: `viem` (public client + wallet client), Sepolia RPC fallback (`NEXT_PUBLIC_SEPOLIA_RPC` env override first, then **tenderly** — publicnode prunes ~day-old logs/receipts and returns empty arrays viem won't fail over on — then publicnode/drpc/1rpc), the deployed contracts in `lib/contracts.ts` (addresses mirror the README table — keep them in sync), `sonner` toasts.
- Depended on by: nothing; entry points are `npm run dev` / `npm run build`; Vercel deploys `main` to markout-nine.vercel.app.
- External systems: Sepolia (11155111), Etherscan links, `window.ethereum` (injected wallets only — no WalletConnect/Coinbase SDK, no project IDs).

## Current State

Working: `next build` passes; SSR verified for all three routes. Tailwind is CJS `tailwind.config.js` + ESM `postcss.config.mjs` (do not restore `tailwind.config.ts` with `require()` inside `export default` — that skips PostCSS on some Node/Vercel paths and the page renders as raw Times HTML). Read/tx pipelines unchanged. Constants point at the **2026-09-02 deployment** (hook `0x1e9A03…`, batch router `0xC9aaB8…`, router `0xF06737…`, tokens `0x41a9c2…`(MDB, c0)/`0xae0FE2…`(MDA, c1), pool `0xa6a2c6…`; variable premium 5–60 bps polled live; batch epochs on the same 24 s clock; outcome enum 1=Refunded/2=RefundPending/3=Donated; at-settle refunds AND at-settle LP credit; hookData zero-guard live). `src/` === live bytecode — no drift. Stale `markout:lpTokenId`/`lpSkipped` localStorage entries read 0 on the new pool and safely fall back.

## Decision Log

### 2026-09-02 — wallet menu: disconnect / change wallet / copy
- **Change**: the nav address pill is now a dropdown (Connect.tsx): full address, Copy address, Change wallet… (`wallet_requestPermissions` eth_accounts re-prompt — the standard extension account switcher; falls back to `eth_requestAccounts` where unsupported), and Disconnect (clears local state; full provider disconnect stays with the extension). Outside-click and Escape close the menu. `useWallet` grew `switchAccount`; MarkoutProvider exposes `onDisconnect`/`onSwitchAccount`.
- **Reasoning**: judges switch accounts mid-demo; a dead-end address pill forced wallet-extension digging.
- **Task/session**: user request, 2026-09-02.

### 2026-09-01 — two-lane surface: premium, batch panel, honest demos
- **Change**: spot panel shows the live premium (`premiumBps` poll) and derives the bond from it; new `BatchPanel` (epoch countdown on chain time, queued sides, place/cancel/clear, one-wallet netting demo via `demoBatchNet` — real on-chain opposing orders, waits the epoch on chain time, clears, toasts uniform fill); pipeline stage 4 is "Swap · spot or batch"; landing/docs/LP copy reframed to premium-not-tax, credit-at-settle, batch-empty-epoch honesty ("a lone order is a one-epoch TWAP, not CoW"); demoRefund toasts success only on outcome 1, warns on 3; killed every "zero external calls" claim; RPC order env → tenderly → publicnode unchanged.
- **Reasoning**: directive — premium visible live, batch epoch + clearing visible, demos cannot lie, judge sees two lanes and is the LP.
- **Rejected alternative(s)**: two-wallet batch demo (one browser, one wallet, real opposing orders is simpler and just as on-chain); recovering batch orders from logs (current-epoch `batchOrders` walk is cheaper and refresh-safe enough).
- **Task/session**: two-lane directive step 4, 2026-09-01.


### 2026-08-31 — LP write path (official PositionManager + Permit2) + 2026-08-31 constants
- **Change**: `LpPanel.tsx` gives every connected wallet a real add/remove liquidity seat against the live canonical pool: full-range MINT_POSITION + SETTLE_PAIR via the official Sepolia PositionManager (`0x429ba701…`), funded by exact ERC20→Permit2 approvals + `permit2.approve` (1 h expiry, topped up only when short), liquidity computed by a BigInt port of `LiquidityAmounts.getLiquidityForAmounts` (`liquidityForAmounts` in contracts.ts, bounds ±887220 = `TickMath.minUsableTick(60)`, sqrt constants printed from the pinned core); remove = DECREASE_LIQUIDITY + CLOSE_CURRENCY ×2 + TAKE_PAIR with the position NFT's tokenId (parsed from the mint receipt's own Transfer event, persisted per-wallet in localStorage, validated by `ownerOf`), live liquidity read by extsload at the position's storage slot (`positionIdOf`/`positionLiquiditySlot` — position key `keccak(abi.encodePacked(poolId, owner, tickLower, tickUpper, tokenId))`, `Pool.State.positions` at base+6). Pipeline now Connect→Mint→LP-or-skip→Swap→Settle; `/app` header + `GuideBanner` carry the LP step (skippable via localStorage flag). MINT encoding was proven byte-identical to a foundry `abi.encode`; the remove encoding is fork-proven (`test_canonical_removeLiquidity_decreaseCloseTake`). Constants repointed to the 2026-08-31 deployment with the new proof pack.
- **Reasoning**: the judge must be an LP, not a spectator — and the write path must be provably the canonical-periphery one. Direct `permit2.approve` calls (3-4 setup txs) cost more clicks than signed permits but keep exact-amount discipline and avoid wiring EIP-712 signing into the injected-wallet flow. PosM decodes DECREASE liquidity as uint256 and negates internally — passing a negative int256 two's-complement overflows `SafeCast` (found by the fork test).
- **Rejected alternative(s)**: signed Permit2 permits folded into one tx (PosM's `modifyLiquidities(bytes,uint256)` signature has no permit field — that's the universal Router, not PosM); tracking position liquidity client-side only (drifts from fees/increases); a StateView dependency for reads (PositionManager has no `positionsOf`, and the extsload path needs no extra deployment address).
- **Task/session**: LP-user directive step 2 + redeploy 4d, 2026-08-31.

### 2026-08-31 — judge surface: live landing tape, LP seat, chain-keyed demos, RPC order
- **Change**: (1) `components/LandingTape.tsx` — the hero centerpiece is now the REAL tape (provider trace + slot0, no wallet) with a quiet status row (price/tick/flushed-to-LPs); the CSS collage `HeroVisual.tsx` deleted; hero KPI strip (3 bps/24 s/43) removed, hosted URL + Chrome+MetaMask+Sepolia line under the CTAs; hero copy reframed to "each swap is marked 24 s later…". (2) `components/LpSeat.tsx` on `/app` — pool-wide in-range liquidity (`extsload` of `pools[poolId]+3`), `pendingDonation(0/1)` bucket, all-time `DonationFlushed` traction, permissionless flush; provider gained `poolLiquidity/pending0/pending1` polls (8 s) and `refreshAll` refreshes them. (3) Demo pilots keyed to the trade's own `settleAfter` read from `trades()` after the receipt (never `Date.now()`); the refund reverse publishes immediately after the buy's inclusion (next-block 1:1, no `sleep(1500)`); donate demo gained a balance guard + a "not a donate this run" warning if pool flow interferes. (4) `RPC_URLS` reordered: env → tenderly → publicnode → drpc → 1rpc. (5) Video hole + hosted URL in landing proof card, docs Try-it, footer, README, `metadataBase`; test count 43→47 everywhere; `TradeRow.outcome` comment fixed to the real enum.
- **Reasoning**: a judge in 15 seconds must feel a live venue: the tape itself (not a picture) is the product; LPs must appear as a user, not a slogan; demos must not lie about timing; and publicnode's silent log pruning made trade recovery + traction reads return empty on the hosted site (viem doesn't fail over on empty arrays — an empty result is a success). Tenderly's public Sepolia gateway serves 45k-block ranges and multi-day history.
- **Rejected alternative(s)**: LP write path via official PositionManager/Permit2 on this pin (era-mismatched periphery risked a broken button; read-only truth + flush instead); pre-signing both demo swaps raw (MetaMask doesn't expose `eth_signTransaction` reliably — wait-inclusion + immediate publish achieves the same next-block landing); scanning traction from the deploy block via 1rpc (its `eth_getLogs` caps at 50-block windows — 3k calls).
- **Task/session**: judge-site directive steps 1–3 + 5, 2026-08-31.

### 2026-08-27 — unstyled /app was missing compiled CSS
- **Change**: dropped dual Tailwind/PostCSS configs (`tailwind.config.ts` + `postcss.config.js`) for a single CJS `tailwind.config.js` (plugin via `require`) and ESM `postcss.config.mjs`. `globals.css` body paint is raw CSS, not `@apply`. Root layout + Wordmark/SiteNav carry inline cream/ink/flex so a CSS 404 still isn't Times-on-white jammed "MMarkout". `frontend/vercel.json` only sets `"framework": "nextjs"` (no `outputDirectory`).
- **Reasoning**: the Times / "HomeDocsApp" screenshot is Tailwind never applying. Two `next dev` processes (3000 + 3001) plus `next build` into the same `.next` deletes `app/layout.css` and leaves hashed production CSS, so the HTML still asks for a file that 404s. `require()` inside ESM `tailwind.config.ts` is a second way PostCSS silently skips.
- **Rejected alternative(s)**: Tailwind v4 `@tailwindcss/postcss` (this app is Tailwind 3.4); setting Vercel `outputDirectory: ".next"` (that turns the Next builder into a static dump); restyling `/app` (Claude's guided-flow JSX was fine — CSS never loaded).
- **Task/session**: fix /app rendering as unstyled HTML, 2026-08-27.

### 2026-08-27 — GitHub remote renamed to Markout
- **Change**: footer GitHub link now `https://github.com/shreyas-sovani/Markout`. Local `origin` points at the same URL. Hackathon badge still says UHI10 (event name, not the repo).
- **Reasoning**: the public repo was renamed; in-app clone/source links have to match or they 404.
- **Rejected alternative(s)**: rewriting every "UHI10" string (that's the Hookathon track id on the landing badge and colophon).
- **Task/session**: repo rename, 2026-08-27.

### 2026-08-27 — cream-paper multi-page shell
- **Change**: the hydrographic dark one-pager was replaced with Markout's light editorial product: tailwind.config.ts / postcss / components.json / globals.css / lib/utils.ts / ui primitives (button, card, badge, separator, sheet); Brand (magenta "M" seal), SiteNav, SiteFooter, Connect + NetworkBanner on `lib/wallet.ts` (no wagmi), Pipeline (Connect→Mint→Swap→Settle), HeroVisual (paper collage: bonded swap / memory tape / verdict route), MemoryTape (the 24 s tape on cream paper: ink dashed pre, ink post, gold frontier, magenta trace + window shade + sweep, verdict captions). The god-page was split into `lib/markout.tsx` (MarkoutProvider: all polls, recovery, previews, actions, demos) + three routes. Facts ticker, `.tape` headers, ledger table with outcome badges, and docs Formula/Callout/Step chrome.
- **Reasoning**: the product should read as a light venue, not a dark instrument; keep tx wiring intact (exact approvals, simulate-first, receipt-parsed tradeId, chunked getLogs, chain-time countdown) while splitting routes so landing / console / docs stay in sync.
- **Rejected alternative(s)**: keeping the dark hydrographic look; a forest sidebar app chrome; wagmi for the nav Connect (must use `lib/wallet.ts`).
- **Task/session**: cream-paper frontend rebuild, 2026-08-27.

### 2026-08-27 — surface redesign: hydrographic chart-recorder
- **Change**: full visual rebuild on identical wiring — fonts swapped to Fraunces (editorial display) + IBM Plex Mono (instrument); palette moved to abyssal slate with faint cyan graph-paper ground, tide-teal (refund/organic) and phosphor-amber (trace/donate) accents. New structure: instrument-rail header, product hero (LP-first headline, no numbers in the H1), two-seat cards (LP / trader), a QUIET traction strip (cumulative `DonationFlushed` value, RPC, pool state — never the headline), the centerpiece **Memory Tape** instrument (live rolling tick trace from the slot0 poll, fixed-window shade that slides with chain time, a sweep line while the window runs, pre/post/50%-frontier overlays, window-average marker, verdict text), console + settlement deck, serif-titled ledger, and a colophon with explicit `coming — human-owned` holes for video and hosted URL. Motion: staggered hero rise, recording-dot pulse, 24 s sweep, verdict flash; all disabled under `prefers-reduced-motion`.
- **Reasoning**: directive — make the 24 s memory the memorable artifact, LP the hero of the story, keep numbers out of the headline, leave holes for human-owned video/URL. Chart-recorder fits a hook whose whole job is recording price memory; committed to one aesthetic rather than sprinkling effects on the old terminal layout.
- **Rejected alternative(s)**: glassmorphism on the previous terminal skin (explicitly out); a marketing landing bolted in front of the old console (one product, not two); KPI-row hero with 3/20/50/24/43 (directive: never in title); Space Grotesk / Inter / purple-gradient DEX clichés (banned); Space Mono (too adjacent to the banned Grotesk default).
- **Task/session**: product-polish directive, 2026-08-27.

### 2026-08-27 — track the overhaul cut
- **Change**: constants repointed to the 2026-08-27 deployment (canonical PM unchanged; hook `0x027C6cfd…`, router `0x41Fd0B2B…`, tokens `0x7B0B…`/`0xf3df…`); SETTLEMENT_DELAY 24; outcome semantics remapped (1 Refunded / 2 RefundPending / 3 Donated) across countdown, history badges, tape verdicts, and toasts; settle messaging now "REFUND — paid at settlement" with claim shown only for outcome 2; the refund demo pilot uses a 1:1 next-block reverse (no overshoot) and auto-settles + only claims if delivery failed; live-check dropped the deleted trustedRouter probe for bondFor; proof pack swapped for the 2026-08-27 run.
- **Reasoning**: ABI, addresses, and constants must match the deployed cut exactly; receipts already came from the user's own transactions (no last-trade pointer) and required no change; no restyle.
- **Task/session**: overhaul directive, 2026-08-27.

### 2026-08-25 — v2 rebuild for the hardened protocol
- **Change**: rewired to the canonical deployment (canonical PM `0xE03A…`, hook `0xAe5A…`, router `0x378f…`, capped faucet tokens). Deterministic receipts: tradeId/verdicts parsed from the tx's own logs (topic constants in `TOPICS`), no `lastTradeId`. Every write simulated first (`simulateContract`) with revert-reason toasts; exact approvals (`amountIn + bond`, never unlimited); user-editable slippage → `minAmountOut`, 5-minute deadline. Refresh recovery: on connect, SwapBonded logs + `trades()` multicall rebuild every open/claimable/settled trade; settle/claim buttons live on both panel and history rows. Price Memory Tape (SVG) plots pre/post/live ticks, the fixed-window average from `previewTrade`, the 50% frontier, and the bond destination after verdict. Deterministic pilots: REFUND = swap + 2.2× overshoot reversal + auto settle/claim; DONATE = single swap + auto settle/flush. RPC fallback (publicnode/drpc/1rpc) with health chip; `wallet_switchEthereumChain` prompt; aria-live countdown/verdict; history collapses to labeled cards under 680px.
- **Reasoning**: lastTradeId races with other users' swaps; unlimited approvals and unsimulated writes are the two biggest dApp footguns; refresh used to strand in-flight trades; the 50% frontier is the product thesis and deserves the visual centerpiece.
- **Rejected alternative(s)**: wagmi/redux state layers (dependency weight, no added correctness); estimating the window average client-side (previewTrade is authoritative); auto-flush timers in the panel (flush is permissionless and keeper-covered).
- **Task/session**: prize hardening, 2026-08-25.

### 2026-08-25 — viem-only, no wagmi
- **Change**: built initially with wagmi + react-query; replaced both with a ~60-line `lib/wallet.ts` (EIP-1193 `window.ethereum` hook) and `lib/usePoll.ts` after wagmi's connector barrel dragged the Coinbase SDK (`@x402/evm`) into the webpack graph and broke the build with an unresolvable import.
- **Reasoning**: only injected connectors were needed anyway; two fewer dependencies, smaller bundle, full control of polling.
- **Rejected alternative(s)**: installing `@x402/evm` to satisfy the optional dep (bloat); deep-importing `@wagmi/connectors` internals (unsupported).
- **Task/session**: judge-presentation push, 2026-08-25.

### 2026-08-25 — chunked getLogs + viem tuple decoding
- **Change**: history fetch goes through `getLogsChunked` (≤49k-block windows); all `trades()` reads use property access (`t.bondAmount`, `t.settleAfter`, `results[i].outcome`), not index access.
- **Reasoning**: publicnode caps `eth_getLogs` at 50k blocks (a flat 150k range 422s); viem decodes named struct outputs as objects, so `[3]`/`[7]` indexing returned `undefined` — found by running the exact pipeline in `scripts/history-check.mjs` before shipping.
- **Rejected alternative(s)**: narrowing the history window to one chunk (older trades vanish); casting through `unknown[]` and hoping (the bug this fixed).
- **Task/session**: judge-presentation push, 2026-08-25.

### 2026-08-25 — design + token faucet
- **Change**: terminal-ledger aesthetic (near-black green ground, hairline rules, JetBrains Mono, tabular numerals, green=refund / amber=donate) instead of a gradient DEX look; `+100 each` mint button calls the demo tokens' permissionless `mint(address,uint256)` directly.
- **Reasoning**: "markout" is a trading term — the UI should read like a trading terminal, and the one-click faucet removes the biggest judge demo blocker (no tokens). The MockERC20 deployed on Sepolia has no access control on mint; no faucet contract needed.
- **Rejected alternative(s)**: purple-gradient Uniswap clone (generic); a dedicated faucet contract (unnecessary surface).
- **Task/session**: judge-presentation push, 2026-08-25.

## Known Gotchas

- **Chain clock must be monotonic**: the fallback RPC pool can return lagging blocks; ingest `getBlock().timestamp` only if it advances, extrapolate at most 18 s between polls, and never let the smoothed `chainNow` move backward — otherwise the countdown visibly jumps (12 → 9 → 12) and re-opens.
- **MemoryTape geometry**: clamp every x into the frame, build the y-domain from the union of all drawn series (plus 15% pad), and keep the window rendered after settlement for context; `now` falls back to the newest trace point until a chain timestamp arrives.
- **publicnode silently prunes history**: `eth_getLogs`/`eth_getTransactionReceipt` return `[]`/`null` for ~day-old data — not errors, so viem's fallback never rotates. Any historical read (trade recovery, traction) must go through tenderly-first ordering in `RPC_URLS`. 1rpc serves old data but caps `eth_getLogs` at 50-block ranges — never use it for chunked scans.
- **LP seat slot math**: pool-wide in-range liquidity = `extsload(pools[poolId] base + 3)` (`LIQUIDITY_SLOT` in contracts.ts) — Pool.State order is slot0, feeGrowth0, feeGrowth1, liquidity per the pinned v4-core; verify against `lib/v4-core/src/libraries/Pool.sol` if the submodule moves.

- Never run `next build` while `next dev` is up, and never run two `next dev` processes against `frontend/`. They share `frontend/.next`. After a production build, that folder has hashed CSS (`*_*.css`) and no `app/layout.css`; the dev HTML still links `/_next/static/css/app/layout.css` → 404 → Times, "MMarkoutThe memory console", "HomeDocsApp". Fix: kill extra Next PIDs, `rm -rf frontend/.next`, one `npm run dev`. Port 3000 in use → Next silently binds 3001, so you may be looking at the zombie on 3000.
- Addresses in `lib/contracts.ts` must be EIP-55 checksummed — viem rejects bad checksums (the README's original hook/PoolManager casing was wrong; corrected everywhere 2026-08-25).
- `sqrtPriceLimitX96` is `uint160`; `MIN_SQRT_PRICE+1` / `MAX_SQRT_PRICE-1` constants live in `lib/contracts.ts`.
- `trades(bytes32)` returns a named struct → viem gives an object with `key` as a nested object. Never index numerically.
- Pool state slot = `keccak256(abi.encodePacked(poolId, bytes32(uint256(6))))`; slot0 packs sqrtPrice (low 160 bits) then int24 tick (sign-extend it). Cross-checked against `lib/v4-core/src/libraries/StateLibrary.sol` and a live call.
- Countdown truth is chain time (`getBlock().timestamp` polled every 3 s), not `Date.now()` — the settle button unlocks on `settleAfter`, matching the hook's guard.
- `scripts/live-check.mjs` and `scripts/history-check.mjs` are plain-node sanity harnesses for the read pipeline; keep them working when contracts.ts changes.
- Demo pool drifted slightly off 1:1 from the live proofs (tick ≈ 180) — expected, not a bug.

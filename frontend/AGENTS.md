# AGENTS.md — frontend/

## Ownership

The live browser UI for the Markout protocol — the demo surface judges and traders actually touch. Owns nothing on-chain; every transaction it sends targets the immutable Sepolia deployment described in the root README.

## Purpose
Markout's face: warm-paper light theme — cream canvas #faf8f2, ink text, magenta brand #B5276F, gold accent — Fraunces display + Hanken Grotesk UI + JetBrains Mono for addresses/amounts, Tailwind + shadcn/ui new-york primitives, sticky `SiteNav` with mobile Sheet drawer, hatch strip + marquee facts ticker, `.tape` / `.panel` / `.eyebrow` / `.stat-row` / `.addr` vocabulary, `max-w-content` editorial rhythm, and a full-bleed ink differentiator band. Three routes: `/` landing (hero + KPI strip, how-it-works cards, vanilla-vs-Markout ledgers, ink band, live-on-testnet address grid, final CTA), `/app` memory console (Pipeline Connect→Mint→Swap→Settle, swap panel, paper MemoryTape, settle/claim/flush, recovered-trade ledger), `/docs` (TOC, Formula/Callout/Step chrome). All wallet/tx wiring lives in `lib/markout.tsx` (MarkoutProvider) so pages stay in sync.
## What This Controls

Nothing in the protocol — the UI is read/write over existing contracts. What breaks if it's wrong: judges can't complete the demo flow (approve gating, tradeId capture, settle timing), or see a wrong outcome. Value movement is gated on-chain, not here; a UI bug can confuse but cannot misappropriate funds.

## Connections

- Depends on: `viem` (public client + wallet client), Sepolia RPC (`NEXT_PUBLIC_SEPOLIA_RPC` env override, default publicnode), the deployed contracts in `lib/contracts.ts` (addresses mirror the README table — keep them in sync), `sonner` toasts.
- Depended on by: nothing; entry points are `npm run dev` / `npm run build`.
- External systems: Sepolia (11155111), Etherscan links, `window.ethereum` (injected wallets only — no WalletConnect/Coinbase SDK, no project IDs).

## Current State

Working: `next build` passes (`/` 130 kB, `/app` 244 kB, `/docs` 130 kB first load); SSR verified for all three routes (hero/ticker/ledgers/ink band on `/`, console + tape + ledger on `/app`, TOC + Formula/Callout/Step on `/docs`). Read pipeline (poolId, slot0 extsload, chunked logs, trades multicall, previewTrade, traction) and tx pipeline (mint → exact approve → simulated swap → settle → flush) carried over unchanged from the previous single-page app and validated against live canonical-Sepolia state on 2026-08-27. Constants point at the 2026-08-27 deployment (hook `0x027C…`, 24 s window, outcome enum 1=Refunded/2=RefundPending/3=Donated, at-settle refunds). The 2026-08-25 addresses are stale.

## Decision Log

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

- Addresses in `lib/contracts.ts` must be EIP-55 checksummed — viem rejects bad checksums (the README's original hook/PoolManager casing was wrong; corrected everywhere 2026-08-25).
- `sqrtPriceLimitX96` is `uint160`; `MIN_SQRT_PRICE+1` / `MAX_SQRT_PRICE-1` constants live in `lib/contracts.ts`.
- `trades(bytes32)` returns a named struct → viem gives an object with `key` as a nested object. Never index numerically.
- Pool state slot = `keccak256(abi.encodePacked(poolId, bytes32(uint256(6))))`; slot0 packs sqrtPrice (low 160 bits) then int24 tick (sign-extend it). Cross-checked against `lib/v4-core/src/libraries/StateLibrary.sol` and a live call.
- Countdown truth is chain time (`getBlock().timestamp` polled every 3 s), not `Date.now()` — the settle button unlocks on `settleAfter`, matching the hook's guard.
- `scripts/live-check.mjs` and `scripts/history-check.mjs` are plain-node sanity harnesses for the read pipeline; keep them working when contracts.ts changes.
- Demo pool drifted slightly off 1:1 from the live proofs (tick ≈ 180) — expected, not a bug.

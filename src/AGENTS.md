# AGENTS.md — src/

## Ownership

Core Markout protocol contracts: the Uniswap v4 hook, its normalized reversion engine, the convenience router, the capped faucet token, and the local BaseHook base. This is the entire on-chain product.

## Purpose

Implements the PRD thesis: swaps fill immediately at 3 bps while a 20 bps input bond — charged to the swap caller's own PoolManager delta, payable through ANY v4 router — is escrowed; over the trade's **immutable** [bondTime, settleAfter] window (24 s ≈ two blocks) an append-only previous-tick accumulator measures the time-weighted average tick, and the **normalized reversion classifier** refunds (paid at settlement) when ≥50% of the trade's own tick impact reverted or donates to in-range LPs when it sustained.

## What This Controls

If any contract here is wrong: traders lose bonds incorrectly, LPs lose the MEV dividend, swaps revert outright, or verdicts become manipulable. Specifically:

- `MarkoutEngine.decide` — mis-classification flips refunds ↔ donations.
- `MarkoutHook` — delta-charged bond math, the append-only observation history (fixed-window integrity), terminal settlement (verdict-before-value, at-settle refund payment, retry-only claims), deferred donations, escrow liability accounting.
- `MarkoutRouter` — convenience only: deadline, exact-in min-out / exact-out max-in, native + ERC-20 settlement, strict transfers, self-encoded beneficiary.
- `FaucetToken` — demo-asset integrity (capped, un-sabotageable).

## Connections

- Depends on: `lib/v4-core` (PoolManager, Hooks, StateLibrary, TickMath), Permit2 + canonical periphery (deploy path only).
- Depended on by: `test/` (all four suites), `script/` deploy + keeper, `frontend/` ABIs.
- External systems: canonical Sepolia v4 (`0xE03A…3543`).

## Current State

Compiles (`forge build`, solc 0.8.26, cancun, via_ir, **optimizer_runs = 20000** — 44M inflated the two-lane hook past EIP-170's 24,576-byte limit; 20k fits at 23,970 and keeps v4-core's `Pool.swap` compiles). 55/55 tests green across four suites. **Deployed live 2026-09-01 (two-lane cut)** against the canonical Sepolia PoolManager: hook `0x3ebC0b015e971d881C84aA62EE976285A05070Cc`, batch-router child `0x5f0c6f2B8d2550043316840d473010273eCAb880`, router `0x6e1A2746237deCb8Dd5aFD38E382fBbC6d0a5e7A`, tokens `0x452cbB…`(MDA)/`0x7cd6E8…`(MDB), pool `0xa40dab…`, all Etherscan-verified, seeded 10e18 via the official PositionManager. Live proof pack: exact next-block (Δ12 s) reversion refunded at settle; unreversed swap donated AND credited LPs inside the settle tx; two-sided batch epoch cleared at one uniform TWAP with dust-bounded residual. Live bytecode === this source — no drift. All earlier deployments are stale.

## Decision Log

### 2026-09-01 — two-lane cut: variable premium, batch epochs, credit-at-settle
- **Change**: (1) SPOT premium is pool-local and history-driven: `premiumBps` starts 20, donate verdict +3, refund verdict −1, clamped [5, 60]; charged identically in beforeSwap/afterSwap; `premiumQuoteFor` == exact charge (exact-in full fills charge bps × specified — no bps² shrink; partial fills re-size to realized). (2) BATCH lane: `placeBatchOrder` takes explicit ERC-20 custody (cap 100/epoch), `cancelBatchOrder` before clear, permissionless `clearBatch` after the epoch ends — clearing tick is the epoch TWAP from the append-only accumulator (`cumulativeAt` now back-extrapolates before the first observation so epoch-0 clears work); opposing orders net, the residual runs as ONE bonded spot swap through `MarkoutBatchRouter` (v4-core's `Hooks` dispatchers skip hook callbacks when `msg.sender == address(self)` — a hook cannot swap through its own lane, and a premium-free residual is banned, so an immutable hook-owned child executes it as an ordinary caller with the hook declared beneficiary); per-side uniform rates = TWAP clamped by realized execution (hook never subsidizes); batch escrow accounting uses MEASURED balance deltas around the residual; dust (spread + rounding + premium mechanics) is released and emitted. (3) LP credit at settle: a donate verdict calls `flushDonation` inline whenever L > 0 (verdict recorded first; PM-locked or delivery failure falls back to the already-tested pending bucket).
- **Reasoning**: directive — premium must be quoted-from-history and grief-priced (pumping requires actually donating), batch must be uniform-price TWAP netting on the SAME 24 s clock, LPs must be paid at settle, and the residual must not bypass the hook's own lane.
- **Rejected alternative(s)**: hook-as-caller residual (impossible — v4 self-call guard, proven by trace); privileged premium-free clearer (banned); TWAP-or-better fills (hook would subsidize one-sided epochs — griefable); splitting batch state into the child (storage reads through two contracts for every settle; state stays in the hook, the child is execution-only plumbing).
- **Task/session**: two-lane directive, 2026-09-01.


### 2026-08-31 — deployed: the hookData guard is live
- **Change**: redeployed the full stack so the zero-declaration `hookData` guard ships on-chain. New pool `0x8a6c41ea…`, seeded via official PositionManager, all contracts Etherscan-verified. Beneficiary rule live: 32-byte nonzero declaration honored; everything else falls back to the direct swap caller.
- **Reasoning**: src/behavior drift vs live bytecode is banned by the repo's honesty rules; the guard closes the silent `address(0)` refund burn for UR-style integrators.
- **Rejected alternative(s)**: leaving the guard undeployed with a README note (drift); changing the rule further (no-allowlist optimum already reached).
- **Task/session**: redeploy directive 4b/4d, 2026-08-31.

### 2026-08-31 — hookData zero-declaration guard (tested, not yet deployed)
- **Change**: `_afterSwap` beneficiary derivation changed from `hookData.length == 32 ? abi.decode(hookData, (address)) : sender` to: only a 32-byte payload decoding to a **nonzero** address declares a beneficiary; empty payloads, arbitrary-length payloads, and a 32-byte zero word all fall back to the direct swap caller. Behavior spec'd by `test_hookData_beneficiaryRules` (four sub-cases).
- **Reasoning**: the old rule sent refunds to `address(0)` when a router forwarded a zeroed 32-byte payload — a silent burn. The direct-caller fallback is deterministic, never reverts mid-swap, and adds no trust assumption (still no allowlist; a router that deliberately declares a user keeps that power).
- **Rejected alternative(s)**: reverting on zero declarations (breaks generic routers mid-swap for no security gain); an allowlist of beneficiary-declaring routers (banned by the product story).
- **Task/session**: protocol-holes directive 4a, 2026-08-31.

### 2026-08-27 — overhaul: allowlist-free bond, 24 s window, trap-free history, PM-only callbacks
- **Change**: (1) Bond charged via v4 hook-deltas — exact-in on the specified delta in `beforeSwap`, exact-out on the unspecified delta in `afterSwap` (input-side in both modes) — landing in the swap caller's own PoolManager delta; partial-fill overcharge returned in-swap. Router lock, `initializeRouter`, and deployer/tx.origin identity deleted; `MarkoutRouter` reduced to a one-arg convenience contract (deadline, exact-in min-out, exact-out max-in incl. bond, strict transfers, native, beneficiary declaration). (2) Window 21 s → **24 s** (two 12 s blocks): a 1:1 next-block reversion sits exactly at the 50% frontier and refunds — no overshoot. (3) Observation ring (64, prunable) → **append-only unbounded history with binary-searched `cumulativeAt`**: nothing is ever pruned, so pokes/swaps can never freeze escrow or change a verdict (`SettlementHistoryPruned` deleted). (4) Outcomes renumbered None/Refunded/RefundPending/Donated; `settle` **pays deliverable refunds immediately** (zero PM interaction — hook holds the bond tokens), `claimRefund` exists only for failed delivery. (5) `BaseHook` guards every external callback with `msg.sender == poolManager`.
- **Reasoning**: the 2026-08-25 cut failed four review points — the bond was only payable through a Markout-settling router (an allowlist in effect), a 21 s window with 12 s blocks made next-block reversions donate without overshoot, the prunable ring let poke spam trap bonds behind `SettlementHistoryPruned`, and callbacks lacked explicit access control; `tx.origin` deployer identity was a footgun of its own.
- **Rejected alternative(s)**: hook-minted PM 6909 claims for the bond (swapper never pays); beforeSwap-only charging (cannot know exact-out input); pruning with a Donate-on-pruned fallback (changes the verdict); T=21 with a 40% frontier (weaker toxic signal than aligning the window to block cadence).
- **Task/session**: overhaul directive, 2026-08-27.

### 2026-08-25 — fixed-window previous-tick oracle + normalized classifier
- **Change**: `MarkoutEngine.decide(int24 pre, int24 post, int24 windowAvg)` refunds iff ≥50% of the signed impact reverted (zero impact refunds; overshoot refunds; away donates); `reversionBps` preview helper. Hook keeps a 64-entry per-pool observation ring of `(timestamp, cumulative, tick)` with previous-tick attribution (elapsed time accrues to the tick held *before* the update); `cumulativeAt(poolId, t)` interpolates any past or projected-future point; `settle`/`previewTrade` always evaluate over `[bondTime, settleAfter]` regardless of settle time. Same-block beforeSwap→afterSwap updates rewrite the held tick in place (no accrual).
- **Reasoning**: the old [bond, settleTime] window + absolute 5 bps band let a last-look attacker shove price right before settlement, and mis-sized verdicts for tiny/huge trades. The immutable window kills timing manipulation; normalizing by the trade's own impact makes the verdict scale-free.
- **Rejected alternative(s)**: spot-at-settle (single-instant griefing); avg-vs-pre absolute band (tiny trades never cross it, huge trades cross on noise); unbounded observation history (storage growth); silently guessing when retention is lost (settles revert `SettlementHistoryPruned` — explicit refusal, never a different verdict).
- **Task/session**: prize hardening, 2026-08-25.

### 2026-08-25 — terminal settlement: immutable verdicts, pull refunds, deferred donations
- **Change**: `settle` performs zero external calls and records the outcome before any value moves. Outcomes: `None → RefundPending | Donated`. Refunds are pull-based: `claimRefund` marks `refundClaimed` *before* the transfer; on delivery failure it resets and stays retryable (`RefundDeliveryFailed`). Donations accumulate per pool/currency in `pendingDonation`; `flushDonation(poolId)` pays them into the pool via `donate()` only when `getLiquidity > 0` (zero-liquidity settle succeeds and defers). `escrowLiability[currency]` tracks open+refund+donation value; hook balances must cover it (invariant-tested). Native support end-to-end: hook `take`s native bonds physically, `claimRefund` sends ETH, flush pays in via `settle{value}`; `receive()` accepts only the PoolManager. The pseudo-ERC-6909 receipt ledger was removed entirely — events + `Trade` state are the record.
- **Reasoning**: external-call-first refunds reentered and could brick; blacklist tokens previously forced donate-fallthrough, destroying the refund verdict — now the verdict survives and delivery retries; donations at zero liquidity previously had no outlet, now they wait.
- **Rejected alternative(s)**: fall-through donate on failed delivery (the old v1 behavior — loses the verdict); a shared donation sweep inside `settle` (breaks zero-liquidity safety); burning receipts on settle (no receipts exist anymore).
- **Task/session**: prize hardening, 2026-08-25.

### 2026-08-25 — locked router, pool config validation, full flag checks
- **Change**: `initializeRouter` (deployer-only, one-time, permanent) locks the only allowed direct swap caller; `beforeSwap`/`afterSwap` revert `NotTrustedRouter` otherwise, and `hookData` must be the 32-byte beneficiary the trusted router encodes. `_beforeInitialize` enforces fee 300 + tickSpacing 60 (`UnsupportedPool`). `BaseHook` validates **all 14** v4 permission flags and its internal hooks are `virtual` with relaxed mutability.
- **Reasoning**: only the Markout-aware router pays the hook's `settleFor` bond debt and truthfully declares the beneficiary; arbitrary callers could otherwise strand the hook's debt and spoof refund recipients.
- **Task/session**: prize hardening, 2026-08-25.

### 2026-08-25 — MarkoutRouter v2 + FaucetToken
- **Change**: router takes `minAmountOut` + `deadline` (deadline checked outside unlock; slippage inside unlock before settlement), settles native via `settle{value}`/`settleFor{value}` and ERC-20 via strict-checked `transferFrom` (`TransferFromFailed`), returns leftover ETH, and always encodes `msg.sender` as beneficiary (no caller hookData). `FaucetToken`: fixed caps (total + per-address cumulative), `mint` to the PoolManager rejected, standard ERC-20 otherwise — no owner/pause/blacklist/tax.
- **Reasoning**: unenforced deadlines/slippage made the reference integrator unsafe to copy; caller-chosen hookData let anyone redirect refunds under the old model; the old MockERC20's permissionless blacklist made the demo pool sabotagable.
- **Task/session**: prize hardening, 2026-08-25.

### Earlier history (condensed)
- 2026-08-24: settlement-unbrickle `_tryTransfer` + `bondFor` view (superseded by pull refunds). 2026-08-23: permissionless time-gated settle + hook-native TWAP (superseded by the fixed-window ring). 2026-08-17: initial build — bond escrow via `take` + router `settleFor`, transient pre-tick via tstore, Q128.128 engine math (superseded by tick-space), local BaseHook.

## Known Gotchas

- `via_ir = true` + `optimizer_runs = 44444444` are required (v4-core `Pool.swap` stack-too-deep otherwise) — and they push periphery PositionManager/PositionDescriptor past EIP-170, hence official-canonical seeding in `script/`.
- v4 `getTickAtSqrtPrice` floors: an infinitesimal downward move reports tick −1; zero-impact tests must buy (upward) — see `test_zeroImpact_refunds`.
- Solidity tuple destructuring must match component count exactly; `trades()` returns 11 components (the key tuple counts as one slot).
- `settle`/`previewTrade` divide by `settleAfter − bondTime` (always 24 s); the observation history is append-only and never pruned, so any open trade's window stays readable no matter how much churn follows — delayed settles produce the identical verdict (`test_delayedSettlement_matchesWindowClose`).
- Native bonds: hook physically holds ETH after afterSwap `take`; the flush path must NOT `take` again (double-count leaves the hook short — found via a CurrencyNotSettled in the native test).
- `receive()` gating means plain ETH transfers to the hook revert; only the PoolManager pays in.
- No router/deployer identity exists anywhere in the hook: any router swaps, the beneficiary comes only from a 32-byte nonzero `hookData` declaration, else the direct caller.

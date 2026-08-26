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

Compiles (`forge build`, solc 0.8.26, cancun, via_ir, optimizer_runs 44444444). 43/43 tests green across four suites (unit / integration-attack / fuzz-invariant / canonical-fork). Deployed live against the canonical Sepolia PoolManager 2026-08-27 (hook `0x027C6cfD540f0446641846cd004b41561EEd70cC`, router `0x41Fd0B2B581C5F59d468D272dbfcc26e595383CF`, tokens `0x7B0B…`/`0xf3df…`), Etherscan-verified, with a fresh Refund-at-settle + Donate proof pack. The 2026-08-25 deployment (`0xAe5A…` hook, 21 s window, router lock) is STALE — superseded by this cut.

## Decision Log

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
- `settle`/`previewTrade` divide by `settleAfter − bondTime` (always 21); `cumulativeAt` reverts `SettlementHistoryPruned` when the ring (64 obs) no longer covers the window — honest refusal, not a wrong verdict.
- Native bonds: hook physically holds ETH after afterSwap `take`; the flush path must NOT `take` again (double-count leaves the hook short — found via a CurrencyNotSettled in the native test).
- `receive()` gating means plain ETH transfers to the hook revert; only the PoolManager pays in.
- Deployer identity for `initializeRouter`: `tx.origin` under the canonical CREATE2 proxy, `msg.sender` otherwise.

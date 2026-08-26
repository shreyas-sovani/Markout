# AGENTS.md — src/

## Ownership

Core Markout protocol contracts: the Uniswap v4 hook, its normalized reversion engine, the trusted router, the capped faucet token, and the local BaseHook base. This is the entire on-chain product.

## Purpose

Implements the hardened PRD thesis: swaps fill immediately at 3 bps while a 20 bps input bond is escrowed; over the trade's **immutable** [bondTime, settleAfter] window (21 s) a hook-maintained previous-tick accumulator measures the time-weighted average tick, and the **normalized reversion classifier** refunds when ≥50% of the trade's own tick impact reverted (organic flow) or donates to in-range LPs when it sustained (informed flow).

## What This Controls

If any contract here is wrong: traders lose bonds incorrectly, LPs lose the MEV dividend, swaps revert outright, or verdicts become manipulable. Specifically:

- `MarkoutEngine.decide` — mis-classification flips refunds ↔ donations.
- `MarkoutHook` — bond math, the observation ring (fixed-window integrity), settlement state machine (verdict-before-value), pull refunds, deferred donations, escrow liability accounting.
- `MarkoutRouter` — deadline/slippage enforcement, native + ERC-20 settlement, strict transfers, self-encoded beneficiary.
- `FaucetToken` — demo-asset integrity (capped, un-sabotageable).

## Connections

- Depends on: `lib/v4-core` (PoolManager, Hooks, StateLibrary, TickMath), Permit2 + canonical periphery (deploy path only).
- Depended on by: `test/` (all four suites), `script/` deploy + keeper, `frontend/` ABIs.
- External systems: canonical Sepolia v4 (`0xE03A…3543`).

## Current State

Compiles (`forge build`, solc 0.8.26, cancun, via_ir, optimizer_runs 44444444). 43/43 tests green across four suites (unit / integration-attack / fuzz-invariant / canonical-fork). Deployed live against the canonical Sepolia PoolManager 2026-08-25 (hook `0xAe5A786094a36475EF619956bb6F1C6089Def0c0`, router `0x378f4E63f8aFf6e771EAfa95BCAf0Df6571a5ec8`), Etherscan-verified, with a fresh Refund + Donate proof pack (pull-claim and donation-flush included).

## Decision Log

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

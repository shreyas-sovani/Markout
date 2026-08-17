# AGENTS.md — src/

## Ownership

Core Markout protocol contracts: the Uniswap v4 hook, its settlement engine, the Reactive Smart Contract, the destination executor, and the reference router. This is the entire on-chain product.

## Purpose

Implements the PRD at `docs/prd/markout.md`: swaps fill immediately at 3 bps while the hook escrows a 20 bps input bond; a Reactive Network Cron1-driven oracle settles each trade ~21 s later — refund if the pool price mean-reverted >5 bps (benign), donate to LPs if it sustained (toxic).

## What This Controls

If any contract here is wrong, traders lose bonds incorrectly, LPs lose the MEV dividend, or swaps revert outright. Specifically:

- `MarkoutEngine.decide` mis-classification flips refunds ↔ donations (direct value misallocation).
- `MarkoutHook.afterSwap` bond math controls what traders are charged; `settle` moves escrowed value.
- `MarkoutReactive` timing controls when settlement happens; wrong tick count changes P_T and thus outcomes.
- `MarkoutExecutor` authorization gates who can trigger settlement (griefing vector if open).

## Connections

- Depends on: `lib/v4-core` (PoolManager, Hooks, StateLibrary, FullMath, TickMath), `lib/v4-periphery` (test-only: HookMiner), `lib/reactive-lib` (AbstractReactive, AbstractCallback v0.2.0).
- Depended on by: `test/Markout.t.sol`, `test/MarkoutEngine.t.sol`; future `script/` deploy scripts.
- External systems: Sepolia (11155111) origin+destination, Reactive Lasna (5318007) ReactVM, Lasna system contract `0x…fffFfF` (Cron1 emitter), Sepolia Callback Proxy `0xc9f36411C9897e7F959D99ffca2a0Ba7ee0D7bDA`.

## Current State

Compiles (`forge build`, solc 0.8.26, cancun, via_ir, optimizer_runs 44444444). All behavior covered by `test/` — 11/11 passing. Not yet deployed anywhere.

## Decision Log

### 2026-08-17 — initial implementation of all five contracts
- **Change**: MarkoutEngine, BaseHook, MarkoutHook, MarkoutRouter, MarkoutReactive, MarkoutExecutor written from scratch; Foundry scaffolded with v4-core v4.0.0, v4-periphery, reactive-lib v0.2.0.
- **Reasoning / rejected alternatives**:
  - **Bond escrow = `poolManager.take` + router `settleFor(hook)`**. The hook pulls real input tokens during afterSwap; its pool debt is paid by the router on the swapper's behalf. Rejected: v4's own ERC-6909 claims (`poolManager.mint`) — in v4.0.0 minting claims requires posting an equal amount of the real currency (flash-accounted, `NonzeroDeltaCount` checked at unlock end), which doubles the escrow cost and cannot be funded from within afterSwap.
  - **Hook-native minimal ERC-6909 receipt minted to the trader** (id = uint256(tradeId)) instead of PoolManager 6909. The v4 PoolManager cannot burn trader-held claims without an operator approval flow, which would break refund UX. The receipt is a record; value flow is governed by `Trade.outcome` + the `Settled` event. Rejected: minting the receipt to the hook itself (weaker story for routers/explorers).
  - **Trader identity in `hookData` (32-byte address)**. The direct `manager.swap` caller is the router, so `sender` in hook callbacks is the router, not the human. `MarkoutRouter` injects `msg.sender` into hookData; the hook falls back to `sender` for raw callers.
  - **P_pre via transient storage** keyed by (poolId, sender) with `tstore`/`tload` (cancun). Rejected: persistent storage (gas + stale-state risk on reorgs).
  - **Engine compares price-space ratio `(sqrtT/sqrtPost)^2` in Q128.128 via FullMath** against ±5 bps thresholds; strict inequality (exactly 5 bps = donate). Squaring raw sqrtPriceX96 would overflow uint256, so the ratio is built with two fixed-point divisions instead. Initial version compared the sqrt-ratio against a price-space threshold — space mismatch caught by `test_thresholdBoundary`.
  - **`MarkoutExecutor` adds explicit `msg.sender == Sepolia Callback Proxy`** on top of reactive-lib v0.2.0's `rvmIdOnly`. v0.2.0's AbstractCallback does not verify the caller, so `rvmIdOnly` alone would let anyone replay `settleMarkout` with a known RVM id and grief settlement timing.
  - **BaseHook written locally** — v4-periphery v4.0.0 no longer ships `src/base/BaseHook.sol` (PRD assumed it existed). Same standard no-op pattern as upstream v4-examples.
  - **Donate path inside `hook.unlockCallback`**: `sync(currency) → transfer → settle() → donate(key, amounts, "")`. The `sync` before transfer is mandatory: `settle()` derives "paid" from the synced-reserves delta, and without a fresh sync the credit reads as 0 and the unlock ends with `CurrencyNotSettled`.
- **Task/session**: initial build session, 2026-08-17.

## Known Gotchas

- `remappings.txt` maps `@uniswap/v4-core/` and `reactive-lib/` at **repo root**, not their `src/` — imports must be `@uniswap/v4-core/src/...` and `reactive-lib/src/...`. Double-`src` paths are the failure symptom.
- `via_ir = true` + `optimizer_runs = 44444444` are required: v4-core's `Pool.swap` hits "stack too deep" Yul errors at lower runs.
- Swap `sqrtPriceLimitX96: 0` reverts (`PriceLimitOutOfBounds`); always pass `MIN_SQRT_PRICE + 1` / `MAX_SQRT_PRICE - 1`.
- v4.0.0 `StateLibrary.getSlot0` returns **4** values (sqrtPriceX96, tick, protocolFee, lpFee).
- Hook reverts inside afterSwap get wrapped (ERC-7751) by v4's CustomRevert; tests can't match the bare selector — use generic `expectRevert()`.
- `SwapBonded` topic0 hash `0x0d39a536aa19156d3df8b040edbfea1a971c7c4f0ce06729f3af7e589d7e6a14` is hard-coded in `MarkoutReactive`; if the event signature in MarkoutHook changes, recompute with `cast keccak "SwapBonded(bytes32,address,uint160,uint160,uint256)"` and update both sides.
- Transient P_pre keying by (poolId, sender) breaks if the same sender does two swaps in the same pool in one tx (LIFO violation). Accepted MVP limitation.
- The hook's own ERC-6909 receipts are never burned on settlement — they remain as trade records. Intentional; no approval flow exists to burn trader-held tokens.

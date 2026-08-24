# AGENTS.md — src/

## Ownership

Core Markout protocol contracts: the Uniswap v4 hook, its settlement engine, and the reference router. This is the entire on-chain product.

## Purpose

Implements the PRD at `docs/prd/markout.md`: swaps fill immediately at 3 bps while the hook escrows a 20 bps input bond; after a 21 s window, a time-weighted mean-reversion oracle settles each trade — refund if the pool price reverted >5 bps toward its pre-swap level (benign flow), donate to LPs if it sustained (informed flow).

## What This Controls

If any contract here is wrong, traders lose bonds incorrectly, LPs lose the MEV dividend, or swaps revert outright. Specifically:

- `MarkoutEngine.decide` mis-classification flips refunds ↔ donations (direct value misallocation).
- `MarkoutHook.afterSwap` bond math controls what traders are charged; `settle` moves escrowed value; the TWAP accumulator quality controls outcome integrity.
- `MarkoutRouter` settlement order controls whether swaps complete at all (`CurrencyNotSettled` if the hook's bond debt isn't paid).

## Connections

- Depends on: `lib/v4-core` (PoolManager, Hooks, StateLibrary, TickMath, FullMath), `lib/v4-periphery` (test-only: HookMiner).
- Depended on by: `test/Markout.t.sol`, `test/MarkoutEngine.t.sol`, `script/` deploy + keeper.
- External systems: Sepolia (11155111).

## Current State

Compiles (`forge build`, solc 0.8.26, cancun, via_ir, optimizer_runs 44444444). 16/16 tests passing. Deployed live on Sepolia 2026-08-24 and live-proven end-to-end (refund + donate hashes in README); all sources Etherscan-verified.

## Decision Log

### 2026-08-24 — settlement cannot brick; public quoting view
- **Change**: refund delivery uses a strict-checked low-level `_tryTransfer` (no-revert AND empty-or-true returndata); on failure the bond falls through to the donate path and the outcome records `Donate`. Added `bondFor(uint256) external pure` quoting view (exact 20 bps floored; 0 ⇒ `SwapTooSmall`).
- **Reasoning**: a plain CurrencyLibrary transfer on the refund path would revert the whole settle forever for blacklist-style tokens that reject transfers to the trader but allow transfers to the pool — settlement must be unbrickle. `bondFor` gives routers/UIs the bond math without re-deriving it.
- **Rejected alternative(s)**: recording `Refund` while the transfer failed (event would lie about value flow — outcome records where value went); leaving escrow stuck for later retry (adds states for an edge case donate already handles).
- **Task/session**: hardening session 2026-08-24.

### 2026-08-23 — permissionless settlement + hook-native TWAP
- **Change**: `settle(bytes32)` is permissionless after a 21 s window (`SettlementWindowOpen` before, `AlreadySettled` after, `UnknownTrade` guard); P_T is the time-weighted average tick over the window from a hook-maintained per-pool accumulator (`Observation{lastTimestamp, tickCumulative}`, advanced by swaps, public `poke()`, and settle itself); Trade struct carries `bondTime`/`settleAfter`/`tickCumulativeAtBond`. Constructor is `(IPoolManager)` only.
- **Reasoning**: an on-chain timestamp gate replaces any external clock. TWAP replaces spot-at-settle because a thin pool's price can be shoved across the 5 bps band for one instant cheaply — the window average makes manipulation cost scale with holding time. v4.0.0 core ships no oracle, so the hook accumulates ticks itself (Uniswap-V2-style attribution-at-update).
- **Rejected alternative(s)**: spot-at-settle (cheap single-instant griefing); avg-vs-pre threshold (organic refunds become sensitive to sub-second reversion delay); avg-vs-post with a "tail shove must not flip" expectation — rejected the *test*, not the code: a shove that dominates the window average IS a sustained reversion by definition.
- **Task/session**: hardening session 2026-08-23.

### 2026-08-17 — initial implementation
- **Change**: MarkoutEngine, BaseHook, MarkoutHook, MarkoutRouter written from scratch; Foundry scaffolded with v4-core v4.0.0 + v4-periphery.
- **Reasoning / rejected alternatives**:
  - **Bond escrow = `poolManager.take` + router `settleFor(hook)`**. The hook pulls real input tokens during afterSwap; its pool debt is paid by the router on the swapper's behalf. Rejected: v4's own ERC-6909 claims (`poolManager.mint`) — in v4.0.0 minting claims requires posting an equal amount of the real currency (flash-accounted, `NonzeroDeltaCount` checked at unlock end), which doubles the escrow cost and cannot be funded from within afterSwap.
  - **Hook-native minimal ERC-6909 receipt minted to the trader** (id = uint256(tradeId)) instead of PoolManager 6909. The v4 PoolManager cannot burn trader-held claims without an operator approval flow, which would break refund UX. The receipt is a record; value flow is governed by `Trade.outcome` + the `Settled` event.
  - **Trader identity in `hookData` (32-byte address)**. The direct `manager.swap` caller is the router, so `sender` in hook callbacks is the router, not the human. `MarkoutRouter` injects `msg.sender` into hookData; the hook falls back to `sender` for raw callers.
  - **P_pre via transient storage** keyed by (poolId, sender) with `tstore`/`tload` (cancun). Rejected: persistent storage (gas + stale-state risk).
  - **Engine compares price-space ratio `(sqrtT/sqrtPost)^2` in Q128.128 via FullMath** against ±5 bps thresholds; strict inequality (exactly 5 bps = donate). Squaring raw sqrtPriceX96 would overflow uint256, so the ratio is built with two fixed-point divisions instead.
  - **BaseHook written locally** — v4-periphery v4.0.0 no longer ships `src/base/BaseHook.sol`. Same standard no-op pattern as upstream v4-examples.
  - **Donate path inside `hook.unlockCallback`**: `sync(currency) → transfer → settle() → donate(key, amounts, "")`. The `sync` before transfer is mandatory: `settle()` derives "paid" from the synced-reserves delta, and without a fresh sync the credit reads as 0 and the unlock ends with `CurrencyNotSettled`.
- **Task/session**: initial build session, 2026-08-17.

## Known Gotchas

- `remappings.txt` maps `@uniswap/v4-core/` at **repo root**, not its `src/` — imports must be `@uniswap/v4-core/src/...`. Double-`src` paths are the failure symptom.
- `via_ir = true` + `optimizer_runs = 44444444` are required: v4-core's `Pool.swap` hits "stack too deep" Yul errors at lower runs.
- Swap `sqrtPriceLimitX96: 0` reverts (`PriceLimitOutOfBounds`); always pass `MIN_SQRT_PRICE + 1` / `MAX_SQRT_PRICE - 1`. And it is **uint160** in the signature — encode `uint256` and cast builds a different selector silently.
- v4.0.0 `StateLibrary.getSlot0` returns **4** values (sqrtPriceX96, tick, protocolFee, lpFee).
- Hook reverts inside afterSwap get wrapped (ERC-7751) by v4's CustomRevert; tests can't match the bare selector — use generic `expectRevert()`.
- `SwapBonded` topic0 `0x0d39a536aa19156d3df8b040edbfea1a971c7c4f0ce06729f3af7e589d7e6a14` — recompute with `cast keccak "SwapBonded(bytes32,address,uint160,uint160,uint256)"` if the event signature changes.
- Transient P_pre keying by (poolId, sender) breaks if the same sender does two swaps in the same pool in one tx (LIFO violation). Accepted limitation.
- The hook's ERC-6909 receipts are never burned on settlement — they remain as trade records. Intentional; no approval flow exists to burn trader-held tokens.

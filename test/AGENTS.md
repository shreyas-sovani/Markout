# AGENTS.md — test/

## Ownership

Verification suite for the Markout protocol contracts in `src/`.

## Purpose

Two suites:

- `MarkoutEngine.t.sol` — pure unit tests of the mean-reversion classifier (refund/donate boundaries in price space).
- `Markout.t.sol` — full-stack integration tests: real `PoolManager`, CREATE2-mined hook address, real swaps through `MarkoutRouter`, permissionless third-party settlement past the time window, and TWAP integrity tests (spot-game immunity, held reversion).

## What This Controls

These tests are the only executable spec of the behavioral guarantees (bond = 20 bps of balanceDelta-derived amountIn, refund on reversion, donate on sustain, window/replay guards, SwapTooSmall, oracle manipulation resistance). Regressions in `src/` surface here.

## Connections

- Depends on: everything in `src/`, `lib/v4-core` (`PoolManager`, `PoolModifyLiquidityTest`, `TickMath`, `Hooks`, `StateLibrary`), `lib/v4-periphery/test/shared/HookMiner.sol`, `test/mocks/MockERC20.sol`.
- Depended on by: nothing; entry point is `forge test`.

## Current State

16/16 passing (`forge test`): 6 engine + 10 integration.

## Decision Log

### 2026-08-24 — undeliverable-refund + quoting tests
- **Change**: `refundUndeliverable_donates` (MockERC20 gained a per-recipient `setBlocked`; blocked trader ⇒ refund verdict but bond lands in the PoolManager, escrow 0) and `bondFor_quotes` (1e18→2e15, 499→0, 500→1).
- **Reasoning**: one observable behavior per test, public interface only. First attempt used a global transfer freeze — wrong model: a globally frozen token blocks the donate pay-in too, so nothing sane can happen; the real vector is recipient blacklists (trader blocked, pool not).
- **Task/session**: hardening session 2026-08-24.

### 2026-08-23 — suite for permissionless settlement + TWAP
- **Change**: settlement invoked by a random third party (`settler`) with `vm.warp` past the window; new tests `settleWindowOpen_reverts`, `settle_replay_reverts`, `spotGames_ignored` (micro shove+restore in one block after a poke — invisible to the accumulator), `twap_honorsSustainedReversion` (early reversion held across the window ⇒ Refund).
- **Reasoning**: tests must assert the trust model — anyone settles, only after T, and only time-weighted state matters.
- **Rejected alternative(s)**: an "instant tail-shove must not flip" test — it failed *correctly*: a shove that dominates the window average is a sustained reversion by definition. Replaced with the honest spot-game/held-reversion pair.
- **Task/session**: hardening session 2026-08-23.

### 2026-08-17 — initial suite
- **Change**: engine unit tests + integration suite + `mocks/MockERC20.sol`.
- **Reasoning / rejected alternatives**:
  - Test names follow root AGENTS.md §4 conventions (`organicQuiet_refundsBond`, `exactOut_chargesInputBondAndFillsOutput`, `swapTooSmall_reverts`).
  - Hook deployed via CREATE2 with HookMiner salt carrying permission bits.
  - `test_swapTooSmall_reverts` uses generic `expectRevert()` because v4 wraps hook reverts (ERC-7751). Rejected: matching the wrapped selector (brittle).
  - Boundary test computes integer sqrt via inline Newton iteration — v4.0.0 ships no sqrt helper (checked).
- **Task/session**: initial build session, 2026-08-17.

## Known Gotchas

- `sqrtPriceLimitX96` must be `MIN_SQRT_PRICE+1` (zeroForOne) or `MAX_SQRT_PRICE-1` — zero reverts with `PriceLimitOutOfBounds`.
- Refund-expected swaps must move the price by ≫5 bps and the reverse swap must restore it beyond 5 bps from post; near-threshold sizes flake on fee rounding.
- `hook.trades(tradeId)` getter destructure: 10 components, last is `MarkoutHook.Outcome` (cast to uint8 for assertEq).
- The arbitrageur's reverse swap also bonds — assert only on the first trade's outcome, and remember the arber's bond sits in the *opposite* currency.
- Warp past the window before any settle; use an unrelated `settler` address to prove permissionlessness.

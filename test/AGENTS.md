# AGENTS.md — test/

## Ownership

Verification suite for the Markout protocol contracts in `src/`.

## Purpose

Two suites:

- `MarkoutEngine.t.sol` — pure unit tests of the mean-reversion classifier (refund/donate boundaries in price space).
- `Markout.t.sol` — full-stack integration tests: real `PoolManager`, mined hook address (CREATE2 via HookMiner), real swaps through `MarkoutRouter`, executor-guarded settlement, and a synthetic ReactVM test that feeds `MarkoutReactive` fake `SwapBonded` + `Cron1` `LogRecord`s and asserts the emitted `Callback`.

## What This Controls

These tests are the only executable spec of the PRD's behavioral guarantees (bond = 20 bps of balanceDelta-derived amountIn, refund on reversion, donate on sustain, SwapTooSmall, 3-tick cron aging). Regressions in `src/` surface here.

## Connections

- Depends on: everything in `src/`, `lib/v4-core` (`PoolManager`, `PoolModifyLiquidityTest`, `TickMath`, `Hooks`), `lib/v4-periphery/test/shared/HookMiner.sol`, `lib/reactive-lib` (`IReactive.LogRecord`), `test/mocks/MockERC20.sol`.
- Depended on by: nothing; CI entry point is `forge test`.

## Current State

14/14 passing (`forge test`): 6 engine + 8 integration. Integration suite covers the permissionless-settlement world: window-open revert, replay revert, intra-block spot-game immunity, TWAP-honored reversion.

## Decision Log

### 2026-08-23 — suite rewritten for permissionless settlement + TWAP
- **Change**: executor/Reactscan scaffolding removed from setUp (hook ctor is now just the PoolManager). New tests: `settleWindowOpen_reverts`, `settle_replay_reverts`, `spotGames_ignored` (micro shove+restore in one block after a poke — invisible to the accumulator), `twap_honorsSustainedReversion` (early reversion held across the window ⇒ Refund). Settles now invoked by a random third party (`settler`) with `vm.warp` past the window.
- **Reasoning**: tests must assert the new trust model — anyone settles, only after T, and only time-weighted state matters.
- **Rejected alternative(s)**: an "instant tail-shove must not flip" test was written first and failed — correctly: a tail shove that dominates the window average IS a sustained reversion by definition (the attacker genuinely moved and held the price). Replaced with the honest pair of spot-game and held-reversion tests.
- **Task/session**: pivot session 2026-08-23.

### 2026-08-17 — initial suite
- **Change**: wrote both suites plus `mocks/MockERC20.sol`.
- **Reasoning / rejected alternatives**:
  - Test names follow the root AGENTS.md §4 convention (`organicQuiet_refundsBond`, `exactOut_chargesInputBondAndFillsOutput`, `swapTooSmall_reverts`) plus the PRD's `reactive_cron_callback`.
  - Executor deployed via CREATE1 at a predicted address *before* the hook so the hook's `executor` immutable can point at it; hook deployed via CREATE2 with HookMiner salt carrying permission bits (BEFORE_SWAP|AFTER_SWAP = bottom-14-bit flags).
  - Settlement simulated with `vm.prank(SEPOLIA_CALLBACK_PROXY)` + `rvm_id = address(this)` (matches AbstractCallback's `rvm_id = msg.sender` at deploy).
  - `test_swapTooSmall_reverts` uses generic `expectRevert()` because v4 wraps hook reverts (ERC-7751). Rejected: matching the wrapped selector (brittle).
  - Boundary test computes integer sqrt via inline Newton iteration — v4.0.0 ships no `SqrtMath`/`sqrt` helper (checked).
- **Task/session**: initial build session, 2026-08-17.

## Known Gotchas

- `sqrtPriceLimitX96` must be `MIN_SQRT_PRICE+1` (zeroForOne) or `MAX_SQRT_PRICE-1` — zero reverts with `PriceLimitOutOfBounds`.
- Refund-expected swaps must move the price by ≫5 bps and the reverse swap must restore it beyond 5 bps from post; near-threshold sizes will flake on fee rounding.
- `hook.trades(tradeId)` getter destructure: 7 components, last is `MarkoutHook.Outcome` (cast to uint8 for assertEq).
- The arbitrageur's reverse swap also bonds (every swap bonds) — assert only on the first trade's outcome, and remember the arber's bond sits in the *opposite* currency.

# AGENTS.md — test/

## Ownership

Verification suites for the Markout protocol contracts in `src/`.

## Purpose

Four suites, 43 tests total:

- `MarkoutEngine.t.sol` (10) — unit + fuzz tests of the normalized reversion classifier: 50% frontier boundaries in both directions, zero impact, overshoot, tiny fully-reverted trades, large-trade noise, `reversionBps`, formula-vs-reference fuzz, monotonicity-toward-pre fuzz.
- `Markout.t.sol` (27) — integration + attack tests on a real `PoolManager` with a CREATE2-mined hook: golden refund/donate paths (settle → claim / settle → flush), window + replay + claim guards, spot games, held reversion, zero impact, last-look post-window shove, delayed-settlement outcome equality (refund and donate, with heavy accumulator churn between), history pruning, zero-liquidity donation deferral + reseed + flush, claim reentrancy (`ReenterRefundToken`), spoofed-router + router-lock, hostile-token retryable refunds, native-currency end-to-end (bond escrow, claim, donate flush), router deadline/slippage, exact-out bond math, preview projection/finalization, pool-config rejection, receipt-surface removal.
- `MarkoutFuzz.t.sol` (4 invariants, 256 runs × 500 calls) — handler-based economic invariants: escrow conservation (balances == liabilities per currency), liability identity (open + unclaimed-refund + pending-donation), verdict immutability, bounded per-trade release.
- `MarkoutFork.t.sol` (2) — canonical-Sepolia fork: full lifecycle (init via official PositionManager, Permit2-funded MINT_POSITION + SETTLE_PAIR seeding, exact-in and exact-out swaps, Refund settle + claim, Donate settle + flush) against the real canonical PoolManager `0xE03A…3543` and official PositionManager `0x429ba7…09b4`.

## What This Controls

These tests are the only executable spec of the behavioral guarantees. Regressions in `src/` surface here; the fork suite specifically guards canonical-integration truth (action encodings, Permit2 flow, currency ordering).

## Connections

- Depends on: everything in `src/`, `lib/v4-core` (PoolManager, `PoolModifyLiquidityTest`, TickMath, Hooks, StateLibrary), `test/shared/HookMiner.sol` (vendored), `test/mocks/{MockERC20,ReenterRefundToken}.sol`, canonical Sepolia RPC (fork, default publicnode, override `SEP_RPC_URL`).
- Depended on by: nothing; entry point is `forge test`.

## Current State

43/43 passing (`forge test`), including invariants (256 runs) and the canonical fork suite.

## Decision Log

### 2026-08-25 — full rewrite for the hardened protocol
- **Change**: all four suites written for the v2 protocol (fixed-window oracle, normalized classifier, pull refunds, deferred donations, locked router, native support). New mocks: `ReenterRefundToken` (reenters `claimRefund` mid-transfer). HookMiner vendored to `test/shared/` after the periphery submodule was pinned back to `4d85e04` (era-matched to v4-core v4.0.0; upstream had deleted the file).
- **Reasoning**: every hardening claim needs a witness: last-look equality, delayed-settlement equality, reentrancy-blocked claims, spoofed-router rejection, hostile-token retry, zero-liquidity deferral, native paths, escrow conservation.
- **Rejected alternative(s)**: keeping the v1 suite shape (asserted push-refunds and 6909 receipts — both removed); invariant handlers that catch expected reverts (poisons runs — guards skip pruned-history settles and unripe windows instead).
- **Task/session**: prize hardening, 2026-08-25.

### Earlier history (condensed)
- 2026-08-24: undeliverable-refund + quoting tests (superseded by hostile-token retry test). 2026-08-23: permissionless-settle + TWAP tests (superseded). 2026-08-17: initial engine + integration suites, `mocks/MockERC20.sol`, CREATE2 hook via HookMiner, wrapped-revert matching (ERC-7751).

## Known Gotchas

- **`vm.warp(block.timestamp + n)` inside loops does not accumulate** in this forge version — `block.timestamp` in the argument stays stale, so every iteration warps to the same timestamp. Keep a local `t` accumulator and `vm.warp(t)`; this silently neutered the delayed-settlement and pruning tests until caught.
- v4 `getTickAtSqrtPrice` floors: sub-tick *downward* moves report −1; zero-tick-impact setups must swap upward (see `test_zeroImpact_refunds`), and the pool must be deepened first (`_seedLiquidity(key, 9999e18)`).
- `_seedLiquidity` mints `liquidity + 1e18` per side — pass large liquidity values safely.
- `trades()` destructuring = exactly 11 slots; nested `key` counts as one.
- forge-std here: `FuzzSelector{addr, selectors}` (array, not single `selector`); handlers extending only `StdUtils` need their own `Vm` constant (`makeAddr` also unavailable there — use literal addresses).
- Struct-returning external getters (`hook.trades`) decode as named objects through viem but as tuples in Solidity — property access in TS, positional slots in .t.sol.
- Old-periphery PositionManager needs an explicit `SETTLE_PAIR` action after `MINT_POSITION` (newer periphery auto-settles — action encodings differ across eras; the fork suite pins the official Sepolia deployment's behavior empirically).
- Fork tests need network; `SEP_RPC_URL` overrides the default publicnode endpoint.
- Warp-past-window before settling; use an unrelated `settler` to prove permissionlessness; the arber's reverse swap also bonds (in the *opposite* currency).

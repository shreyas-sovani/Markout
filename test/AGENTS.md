# AGENTS.md — test/

## Ownership

Verification suites for the Markout protocol contracts in `src/`.

## Purpose

Four suites, 55 tests total:

- `MarkoutEngine.t.sol` (9) — unit + fuzz tests of the normalized reversion classifier: 50% frontier boundaries in both directions, zero impact, overshoot, tiny fully-reverted trades, large-trade noise, `reversionBps`, formula-vs-reference fuzz, monotonicity-toward-pre fuzz.
- `Markout.t.sol` (38) — integration + attack tests on a real `PoolManager` with a CREATE2-mined hook: golden refund/donate paths (settle → claim / settle → flush), window + replay + claim guards, spot games, held reversion, zero impact, last-look post-window shove, delayed-settlement outcome equality (refund and donate, with heavy accumulator churn between), history pruning, zero-liquidity donation deferral + reseed + flush, claim reentrancy (`ReenterRefundToken`), spoofed-router + router-lock, hostile-token retryable refunds, native-currency end-to-end (bond escrow, claim, donate flush), router deadline/slippage, exact-out bond math, preview projection/finalization, pool-config rejection, receipt-surface removal, `hookData` beneficiary rules, batched same-unlock swaps (`BatchRouter`), the named atomic-sandwich limit, LP dividend vs a vanilla pool, batch exact-net/partial-net/lone-TWAP, sandwich positioning empty, cancel/guards, late-clear immutability, premium quote==charge with clamps and poke-inertness, LPs credited at settle.
- `MarkoutFuzz.t.sol` (4 invariants, 256 runs × 500 calls) — handler-based economic invariants: escrow conservation (balances == liabilities per currency), liability identity (open + unclaimed-refund + pending-donation), verdict immutability, bounded per-trade release.
- `MarkoutFork.t.sol` (3) — canonical-Sepolia fork: full lifecycle (init via official PositionManager, Permit2-funded MINT_POSITION + SETTLE_PAIR seeding, exact-in and exact-out swaps, Refund settle + claim, Donate settle + flush) and the frontend's remove path (MINT then DECREASE + CLOSE_CURRENCY ×2 + TAKE_PAIR in one modifyLiquidities) against the real canonical PoolManager `0xE03A…3543` and official PositionManager `0x429ba7…09b4`.

## What This Controls

These tests are the only executable spec of the behavioral guarantees. Regressions in `src/` surface here; the fork suite specifically guards canonical-integration truth (action encodings, Permit2 flow, currency ordering).

## Connections

- Depends on: everything in `src/`, `lib/v4-core` (PoolManager, `PoolModifyLiquidityTest`, TickMath, Hooks, StateLibrary), `test/shared/HookMiner.sol` (vendored), `test/mocks/{MockERC20,ReenterRefundToken}.sol`, canonical Sepolia RPC (fork, default publicnode, override `SEP_RPC_URL`).
- Depended on by: nothing; entry point is `forge test`.

## Current State

55/55 passing (`forge test`), including invariants (256 runs) and the canonical fork suite. Rewritten 2026-08-27 for the overhaul cut; every directive guarantee has a test named after its behavior (`test_bondPayable_genericRouter`, `test_bondPayable_attackerAuthoredRouter`, `test_fullReverseNextBlock_refunds`, `test_reverseAfterWindow_donates`, `test_delayedSettlement_matchesWindowClose`, `test_hookCallbacks_rejectNonPoolManager`, `test_noRouterLock_surface`, `test_faucetMint_doesNotBreakEscrow`, `test_claimExistsOnlyWhenDeliveryFailed`, `test_hookData_beneficiaryRules`, `test_batchedSwaps_sameUnlock_preTicksNotClobbered`, `test_atomicSandwich_sameBlock_frontLegRefunds_honestLimit`, `test_lpDividend_beatsVanillaSameFee`); brick-as-success tests (`historyPruned`, `spoofedRouter`, `initializeRouter_locksForever`) removed.

## Decision Log

### 2026-08-31 — protocol-holes suite: hookData rules, batch keying, sandwich limit, LP dividend
- **Change**: four tests + a `BatchRouter` mock. `test_hookData_beneficiaryRules` specs the new beneficiary rule (empty/junk/zero → direct caller; nonzero 32 B honored). `test_batchedSwaps_sameUnlock_preTicksNotClobbered` runs two swaps from one router in a single unlock and asserts trade 2's pre == trade 1's post plus independent verdicts — the transient `(poolId, sender)` slot is written/consumed twice back-to-back. `test_atomicSandwich_sameBlock_frontLegRefunds_honestLimit` names the documented limit: all three legs share one timestamp, the window average reads the post-backrun tick, the front leg refunds, the backrun donates. `test_lpDividend_beatsVanillaSameFee` withdraws identical LP positions from a hook pool and a hookless 3 bps control pool after the same toxic swap; the hook LP ends ~the 20 bps bond ahead.
- **Reasoning**: directive asked for each hole either fixed-with-proof or named-as-limit. Batched-swap keying turned out already correct (needed the test, not a fix). A same-block anti-sandwich rule was rejected after analysis: an atomic front leg and a 1:1 NEXT-block organic reversion are indistinguishable by window average in tick space (zero intra-block time attribution), so the honest limit ships in code, tests, and site copy.
- **Rejected alternative(s)**: dwell-time-at-post heuristics (the accumulator cannot distinguish 0 s vs 12 s dwell for same-block legs, and any threshold at 12 s granularity risks the canonical next-block refund); valuing the LP dividend in a single token (the bond rides the specified delta, so the pool executes on input−bond and the dividend lands via flush across both tokens — terminal-wealth comparison across both tokens is the only faithful measure; swap size kept small relative to liquidity so the 1:1 token sum is a fair valuation).
- **Task/session**: protocol-holes directive 4a–4d, 2026-08-31.

### 2026-08-27 — overhaul suite
- **Change**: integration suite rewritten for the allowlist-free cut: PoolSwapTest (`genericRouter`) and an attacker-authored `FakeRouter` prove the bond is payable by any v4 router; 1:1 next-block reversion refunds at exactly the 50% frontier of the 24 s window; delayed-settlement equality now runs 50 swaps + 200 pokes + 1 day between settle points with NO retention guard (append-only history); callback rejections asserted on four externals; faucet-gift balances no longer break accounting; exact-out probes read the pool delta through PoolSwapTest and assert `paid == amountIn + bond`. Fuzz invariants moved from balance==liability to balance>=liability (gifts allowed). Fork suite: one-arg router ctor, flags `0x30CC`, refund asserted PAID at settle.
- **Reasoning**: name tests after the guarantees they witness; remove tests that treated a revert-and-lock as success.
- **Task/session**: overhaul directive, 2026-08-27.

### 2026-08-25 — full rewrite for the hardened protocol
- **Change**: all four suites written for the v2 protocol (fixed-window oracle, normalized classifier, pull refunds, deferred donations, locked router, native support). New mocks: `ReenterRefundToken` (reenters `claimRefund` mid-transfer). HookMiner vendored to `test/shared/` after the periphery submodule was pinned back to `4d85e04` (era-matched to v4-core v4.0.0; upstream had deleted the file).
- **Reasoning**: every hardening claim needs a witness: last-look equality, delayed-settlement equality, reentrancy-blocked claims, spoofed-router rejection, hostile-token retry, zero-liquidity deferral, native paths, escrow conservation.
- **Rejected alternative(s)**: keeping the v1 suite shape (asserted push-refunds and 6909 receipts — both removed); invariant handlers that catch expected reverts (poisons runs — guards skip pruned-history settles and unripe windows instead).
- **Task/session**: prize hardening, 2026-08-25.

### Earlier history (condensed)
- 2026-08-24: undeliverable-refund + quoting tests (superseded by hostile-token retry test). 2026-08-23: permissionless-settle + TWAP tests (superseded). 2026-08-17: initial engine + integration suites, `mocks/MockERC20.sol`, CREATE2 hook via HookMiner, wrapped-revert matching (ERC-7751).

## Known Gotchas

- **`vm.warp(block.timestamp + n)` goes stale** in this forge version: after any external call between warps, `block.timestamp` read in the argument returns the pre-warp value, making the next warp a no-op. Compute every warp target into a local `t` BEFORE external calls and `vm.warp(t)`. This silently broke three window-geometry tests until probed.
- v4 `getTickAtSqrtPrice` floors: sub-tick *downward* moves report −1; zero-tick-impact setups must swap upward (see `test_zeroImpact_refunds`), and the pool must be deepened first (`_seedLiquidity(key, 9999e18)`).
- `_seedLiquidity` mints `liquidity + 1e18` per side — pass large liquidity values safely.
- `trades()` destructuring = exactly 11 slots; nested `key` counts as one.
- forge-std here: `FuzzSelector{addr, selectors}` (array, not single `selector`); handlers extending only `StdUtils` need their own `Vm` constant (`makeAddr` also unavailable there — use literal addresses).
- Struct-returning external getters (`hook.trades`) decode as named objects through viem but as tuples in Solidity — property access in TS, positional slots in .t.sol.
- Old-periphery PositionManager needs an explicit `SETTLE_PAIR` action after `MINT_POSITION` (newer periphery auto-settles — action encodings differ across eras; the fork suite pins the official Sepolia deployment's behavior empirically).
- Fork tests need network; `SEP_RPC_URL` overrides the default publicnode endpoint.
- Warp-past-window before settling; use an unrelated `settler` to prove permissionlessness; the arber's reverse swap also bonds (in the *opposite* currency).

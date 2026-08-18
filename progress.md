# Markout — Build Progress

Living log of what is done and what is next. Update at the end of every working session.

## Status snapshot (2026-08-17)

| Task | Component | Status |
| --- | --- | --- |
| TSK-01 | Foundry scaffold + v4-core/v4-periphery/reactive-lib deps | ✅ Done |
| TSK-02 | `MarkoutEngine` mean-reversion math | ✅ Done, unit-tested |
| TSK-03 | `MarkoutHook` (beforeSwap/afterSwap, 6909 bond, SwapBonded) | ✅ Done, integration-tested |
| TSK-04 | `MarkoutReactive` (Cron1 queue, 3-tick aging, callbacks) | ✅ Done, synthetic-tested |
| TSK-05 | `MarkoutExecutor` (AbstractCallback, settleMarkout) | ✅ Done |
| TSK-06 | Foundry test suite | ✅ 11/11 passing |
| TSK-07 | Deploy to Sepolia/Lasna + `depositTo` funding + LiveProofPack | ⬜ Not started |
| TSK-08 | README, demo video, LiveProofPack hashes | ⬜ Not started |

## Test results

`forge test`: 11 passed, 0 failed.

- `MarkoutEngineTest` (6): up/down reversion refund, sustain donate, price-space bps boundary (4 bps donates / 6 bps refunds), zero-impact donates.
- `MarkoutTest` (5): `organicQuiet_refundsBond`, `arbSustains_donates`, `exactOut_chargesInputBondAndFillsOutput`, `swapTooSmall_reverts`, `reactive_cron_callback`.

## What exists

- `src/MarkoutEngine.sol` — pure mean-reversion classifier. Compares `(sqrtT/sqrtPost)^2` in Q128.128 against a ±5 bps price-space threshold (strict inequality: exactly 5 bps = sustain = donate).
- `src/BaseHook.sol` — minimal IHooks base with no-op defaults (v4-periphery v4.0.0 ships no BaseHook).
- `src/MarkoutHook.sol` — the hook. beforeSwap stores P_pre in transient storage keyed by (poolId, sender); afterSwap computes bond = 20 bps of the |input side| of the post-swap `balanceDelta` (slot0 never used for sizing), `take`s the bond into escrow, records the trade, mints a hook-native ERC-6909 receipt to the trader (id = uint256(tradeId)), emits `SwapBonded`. `settle(tradeId)` (executor-gated) reads live slot0 as P_T, runs the engine, then refunds escrow to the trader or pays it into the pool and `donate()`s it. Trader identity rides in `hookData` (32-byte address) because the router is the direct PoolManager caller.
- `src/MarkoutRouter.sol` — reference router. Settles the router's own swap deltas, then covers the hook's bond debt via `settleFor(hook)`, pulling from the swapper. Any real router integrating Markout must reproduce this step.
- `src/MarkoutReactive.sol` — RSC for Lasna. Subscribes to `SwapBonded` on Sepolia (11155111) and `Cron1` from the Lasna system contract (5318007). Trades age 3 Cron ticks (~21 s) then emit `Callback(11155111, executor, 1M gas, settleMarkout(address(0), tradeId))`.
- `src/MarkoutExecutor.sol` — Sepolia destination. `settleMarkout(rvm_id, tradeId)` guarded by `rvmIdOnly` plus an explicit `msg.sender == Sepolia Callback Proxy` check (reactive-lib v0.2.0's AbstractCallback alone does not check the sender).
- `test/` — engine unit tests + full-stack integration tests; `test/mocks/MockERC20.sol`.

## Next session should pick up

1. TSK-07: deploy scripts (`script/Deploy.s.sol`) for Sepolia + Lasna, `depositTo` both proxies, verify on Reactscan/ESepolia.
2. Live demo path: real tx hashes → `LiveProofPack`.
3. TSK-08: README + 5-min video.

## Session log

- **2026-08-18 (session 2)**: Wrote `todo.md` (manual end-to-end runbook: wallets/faucets, deploy scripts to write, Sepolia + Lasna deployment, `depositTo` funding of both proxies, live refund/donate demo runs, LiveProofPack collection, video + submission). Replaced the Foundry boilerplate `README.md` with the real project README (architecture, contract table, TBD address/proof placeholders). No code changes; suite still 11/11.
- **2026-08-17 (session 1)**: Scaffolded repo, implemented all five contracts, full test suite green. Key in-flight discovery: AGENTS.md Section 0 was replaced mid-session by an external edit (now a pointer to the PRD); flag left for the human. Nothing else in flux.

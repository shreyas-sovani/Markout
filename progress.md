# Markout — Build Progress

Living log of what is done and what is next. Update at the end of every working session.

## Status snapshot (2026-08-23)

| Task | Component | Status |
| --- | --- | --- |
| Core contracts (hook, engine, router) | ✅ Shipped — permissionless settlement + hook-native TWAP |
| Test suite | ✅ 14/14 passing |
| Sepolia deployment | ✅ Live + Etherscan-verified (addresses in README) |
| LiveProofPack | ✅ Real Refund + Donate settlement hashes in README |
| Reactive Network integration | 🗑 Removed 2026-08-23 (not judged; RVM never activated — record in `blockers.md`) |
| Demo video | ⬜ Human |
| Final push / submission | 🟡 Push done through 2026-08-23; re-push after any doc edits |

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

- **2026-08-23 (session 6 — pivot: drop Reactive, ship permissionless)**: Human confirmed Reactive Network is not a sponsor/judge for this cohort and green-lit the turnaround. Rewrote `MarkoutHook` for permissionless settlement (21 s on-chain window, anyone can settle, `SettlementWindowOpen`/`AlreadySettled`/`UnknownTrade` guards) and replaced spot-at-settle with a hook-maintained TWAP accumulator (per-pool V2-style tick cumulative, advanced by swaps/public `poke()`/settle). Deleted `MarkoutReactive`, `MarkoutExecutor`, `InstantSettleReactive`, `Deploy.Lasna.s.sol`, and the stale `ForkDemo.t.sol`. Suite rewritten: 14/14 green, including the honest manipulation-semantics tests (`spotGames_ignored`, `twap_honorsSustainedReversion`) — an earlier "tail shove must not flip" test was correctly failing because a window-dominating shove IS a sustained reversion. Redeployed to Sepolia (hook `0xF51b4DD1…0000c0` etc.), Etherscan-verified everything, and ran the live end-to-end proof: organic pair settled **Refund** (`0x567fa241…`), sustained trade settled **Donate** (`0xac947b0f…`); trader balance +2e15 exactly, escrow zeroed, donation in the PoolManager. Added `script/keeper.sh`, rewrote README (theme-forward, real LiveProofPack) and `demo.md`, marked the Reactive blocker resolved.
- **2026-08-19 (session 5 — live demo bring-up)**: Sepolia demo path now fully live: router approved, four real swaps mined (`0x18a1f8f6…`, `0x2820be29…`, `0x47325c9e…`, `0x378b4386…`), bonds escrowed, `SwapBonded` events confirmed on-chain. Root-caused a day-long "empty revert" ghost: the cast swap signature used `uint256` for `sqrtPriceLimitX96` where the router takes `uint160` — silently different selector (`0x0b0b1345` vs `0xf3cd914c`), reverting in 152 gas of dispatch. Also confirmed deployed pool ordering: currency0 = 0x144A…, currency1 = 0x91C7…. Lasna side wedged twice: RSC went Inactive again (debt auto-settle deadlocks once processing stops — `depositTo` alone stops working), recovered once via direct ETH transfer + `coverDebt()` (debt → 0), but settlements still not dispatching; a later Lasna gas spike (112 gwei, ~0.17 REACT/deploy) blocked the RSC-v2 redeploy with the EOA at 0.135 REACT. Four bonded trades were made while inactive and will never settle — fresh swaps required post-revival. Wrote `demo.md` (run commands, expected outcomes, verification, full troubleshooting incl. selector/ordering/funding traps). **Blocked on manual input: Lasna REACT faucet top-up + Reactscan visual check of RSC status/RVM count.**
- **2026-08-18 (session 4 — ops fix + verification)**: Diagnosed Reactscan `Inactive`: Cron1-driven RVM processing (140 txs) drained the 0.5 REACT deposit in ~3 h (~0.18 REACT/h burn rate — permanent while subscribed); system `debt()` showed 0.0038 REACT unpaid. Fixed with 2 REACT `depositTo` (tx `0xc0df35b2…728d`), debt → 0, runway ≈ 11 h; burn-rate reminder added to `todo.md`. Verified all 7 Sepolia contracts on Etherscan (Pass - Verified) — note Etherscan V1 status endpoint is dead, poll via `api.etherscan.io/v2/api?chainid=11155111&...`.
- **2026-08-18 (session 3 — deployment, todo Phases 0–4)**: Env verified (operator `0xFeAf…690A`, both RPCs). Sepolia stack deployed via `script/Deploy.Sepolia.s.sol` (hook `0x1Db65C7e…0000C0` with correct permission bits; pool initialized at 1:1 with 10e18 liquidity/side). RSC deployed to Lasna at `0x6719F298F544c688999819d13A34E871E723f4d9` — via `forge create`, because forge script's local simulation cannot execute the Lasna system-contract subscription precompile and reverts "Failure" even for control subscriptions (proved not-a-funding bug). Funded: RSC 0.5 REACT (system `depositTo`), executor 0.02 SEP (Callback Proxy `depositTo`). Sourcify verify blocked by endpoint TLS outage; Etherscan verify pending user API key. Operator EOA low on SEP (~0.019) — top up before demo swaps. README addresses filled.
- **2026-08-18 (session 2)**: Wrote `todo.md` (manual end-to-end runbook: wallets/faucets, deploy scripts to write, Sepolia + Lasna deployment, `depositTo` funding of both proxies, live refund/donate demo runs, LiveProofPack collection, video + submission). Replaced the Foundry boilerplate `README.md` with the real project README (architecture, contract table, TBD address/proof placeholders). No code changes; suite still 11/11.
- **2026-08-17 (session 1)**: Scaffolded repo, implemented all five contracts, full test suite green. Key in-flight discovery: AGENTS.md Section 0 was replaced mid-session by an external edit (now a pointer to the PRD); flag left for the human. Nothing else in flux.

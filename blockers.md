# Blockers

## RESOLVED 2026-08-23 — Reactive dependency dropped

Reactive Network is not a sponsor/judge of this cohort. The Lasna RVM-never-activates issue below is therefore **moot for the submission**: the hook now settles permissionlessly on-chain after a 21 s window (see README), the Reactive contracts were removed from the tree (preserved in git history), and the full demo — including live Refund and Donate settlements with real hashes — runs on Sepolia alone. The investigation below is kept for the record.

## Sepolia side: none

Pool, hook, router, executor live and verified. Swaps work, bonds escrow correctly. 5 trades bonded and awaiting settlement.

## Lasna side: RVM never activates — BLOCKED

**What's wrong:** Reactive contracts deploy on RNK fine (subscriptions accepted, debt 0, funds deposited), but the private ReactVM that should run `react()` never starts. Reactscan shows **0 RVM transactions, 0 RNK transactions, 0 contracts** for every RSC we deployed (0x6719F2…, 0x7B3378…, 0xEA48ad…). Since react() never runs, no events are processed and no settlement callbacks are ever dispatched to Sepolia. This is not a funding or debt issue — those were checked and cleared repeatedly.

**What we ruled out:** funding (deposits + coverDebt, debt = 0), subscription params (topic/contract/chain verified against on-chain logs — Cron1 and SwapBonded both exist), our contract code (an instant-settle probe RSC with no aging logic shows the same zero activity), and Sepolia-side callback reception (executor proxy funded, debt 0).

**Most likely cause (unconfirmed):** the Reactive Network is not spawning an RVM for our deployer address (0xFeAf…690A). Possible reasons: RVM creation requires something not documented in our copy of the docs, a per-deployer activation step, or a Lasna-side service issue.

**What is needed to unblock (one of):**

1. Reactscan → check the deployer's dedicated **RVM page** (deployer address 0xFeAf5C921996FC53f4DEf35e181E766e6D74690A). If the RVM itself is missing/erroring there, that page usually names the reason (status, error, required action).
2. Compare with a KNOWN-WORKING demo: deploy any official Reactive demo contract (e.g. from reactive-smart-contract-demos) from this same wallet. If the demo also shows 0 RVM activity → account/network-level problem → ask in Reactive Telegram (t.me/reactivedevs) with our deployer address + RSC addresses.
3. If the demo DOES work → the difference is in our contract setup → diff our constructor against theirs and fix.

**Cost so far / state:** ~3.4 lREACT spent across deposits on dead/wedged RSCs; ~9 lREACT + 0.46 Sepolia ETH remaining. All Sepolia contracts verified and demo-ready the moment settlement dispatch works.

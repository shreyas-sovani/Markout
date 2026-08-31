# Product Requirements Document: Markout

**Product:** Markout

**Track:** UHI10 — Sustainable Liquidity & MEV Protection

**Chain:** Ethereum Sepolia (`11155111`), **canonical Uniswap v4 PoolManager** (`0xE03A1074c86CFeDd5C142C4F04F1a1536e203543`), for all contracts.

---

## 1. Problem Statement

Volatile Uniswap v4 pairs struggle to advertise competitive, low fees because Liquidity Providers (LPs) constantly leak value to informed order flow (Maximal Extractable Value, MEV, and Loss-Versus-Rebalancing, LVR). Conventional hook solutions attempt to mitigate this by relying on external oracles, delaying execution, or analyzing subsequent "continuation" swaps.

However, from a first-principles perspective, toxic single-shot arbitrageurs execute exactly *one* trade to snap the AMM to the global CEX equilibrium. There is zero continuation. Relying on continuation flow to measure toxicity automatically misclassifies the most dangerous MEV flow as benign.

To solve this sustainably without degrading UX or relying on synchronous external oracles, we rely on a fundamental truth of Automated Market Makers:

* **Informed Flow (Toxic):** The trader moves the AMM price to match the global market. The price *sustains* at this new level because no rational actor will arbitrage it backward.
* **Uninformed Flow (Benign):** The trader moves the AMM price away from the global market. Within seconds, an arbitrageur executes a reverse swap to bring the AMM back to equilibrium. The price *reverts*.

## 2. Solution: Normalized Mean-Reversion Oracle

**Markout** is an autonomous Uniswap v4 hook that fills organic swaps immediately at 3 bps, escrows a 20 bps input bond, and settles it with a **normalized mean-reversion oracle** that lives entirely inside the hook.

Over each trade's **immutable** settlement window — `[bondTime, bondTime + 24 s]`, two 12 s blocks:

* **Reversion (Benign):** If at least **50% of the trade's own price impact** (measured in tick space, time-weighted) reverted back toward the pre-swap price, the trade was uninformed. The bond is **refunded — delivered to the trader in the settlement transaction itself**. A separate claim exists only when token delivery failed and remains retryable.
* **Sustain (Toxic):** If the time-weighted price sustained (residual impact above the 50% frontier, or moved further away), the trade was informed price discovery. The bond is **donated to in-range LPs** as a socialized dividend, deferred through a pending bucket and flushed whenever the pool has active liquidity.

This architecture penalizes single-shot arbitrage, natively protects organic flow — a full 1:1 reversion landing one block after the trade already refunds — and operates entirely on-chain with no external oracles and no keeper dependency for correctness.

**Honest scope:** the oracle does not catch slow trend flow (no reversion within the window), the front leg of an atomic sandwich (the backrun's reversion refunds it — the backrun leg itself donates), and donations go to whoever is in range at flush, not the specific LPs who carried the toxic inventory.

## 3. Settlement Architecture

### Bond Payable Through Any Router

The bond is charged via v4's hook-delta mechanism: for exact-in swaps the hook returns it on the *specified* delta in `beforeSwap`; for exact-out swaps on the *unspecified* delta in `afterSwap`. It lands in the **swap caller's own PoolManager delta**, so any router that can settle a normal v4 swap can pay it — Universal Router, `PoolSwapTest`, or an integrator's own contract. The provided `MarkoutRouter` is convenience (deadline, exact-in minimum output, exact-out maximum input including the bond, strict ERC-20 handling, native support, beneficiary declaration in `hookData`), never a gate.

### Fixed-Window Previous-Tick Oracle

Uniswap v4 core ships no oracle, so the hook maintains one per pool:

* A **previous-tick accumulator**: on every update, elapsed time is attributed to the tick held *before* the update; same-block beforeSwap→afterSwap transitions rewrite the held tick in place.
* Observations are **append-only** — an unbounded, binary-searched history. Nothing is ever pruned: permissionless pokes and later swaps can never freeze escrow or alter a verdict.
* The settlement price is the average tick over the immutable `[bondTime, settleAfter]` window, computed by interpolation regardless of when settlement runs. Settling at close, one day late, or after heavy churn produces the identical verdict.

### Terminal Settlement

* `settle(bytes32 tradeId)` is callable by **anyone** after the window; before it reverts `SettlementWindowOpen`, after settlement `AlreadySettled`, unknown ids `UnknownTrade`.
* The verdict is recorded **before any value moves**; `settle` performs zero external calls.
* Successful refunds are **paid at settlement** from the hook's physically-held escrow. Only a failed token delivery (e.g. blacklist) leaves `RefundPending` with a retryable `claimRefund` — settlement can never brick.
* Donate verdicts accumulate in a per-pool pending bucket; `flushDonation(poolId)` is permissionless once the pool has active liquidity and defers while it doesn't.

## 4. Hook Mechanics & Constraints

* **Exact bond, both directions:** the bond is exactly 20 bps of the realized input taken from the post-swap `balanceDelta`; `slot0` is never used for sizing. Exact-in charges are reconciled to realized fills (partial-fill overcharge is returned to the trader in the same swap).
* **Immediate fill:** swaps execute on the AMM curve in the origin transaction.
* **No dust bypasses:** bonds that round to zero revert `SwapTooSmall`.
* **Strict escrow accounting:** `escrowLiability[currency]` tracks open + refund-pending + donation-pending value; hook balances must cover it (invariant-tested). Gratuitous deposits are gifts and never create obligations.
* **Callback access control:** every external hook callback rejects callers other than the PoolManager; the `sender` argument is data, not access control.
* **Pool configuration:** initialization enforces the supported fee tier (3 bps) and tick spacing (60).

## 5. User Stories

1. **As an LP**, I want toxic single-shot arbitrage detected via sustained price impact, so MEV value is captured and donated to the pool.
2. **As an organic trader**, I want my uninformed swap verified by natural arbitrageurs reverting the price behind me, with my 20 bps bond **paid back in the settlement transaction**.
3. **As a router integrator**, I want to pay the bond with nothing beyond normal v4 settlement — no Markout allowlist, no special call — so my existing router works unchanged.
4. **As a keeper operator**, I want to poke the oracle, settle due trades, retry failed deliveries, and flush donations permissionlessly — while knowing correctness never depends on me.
5. **As a trader**, I want settlement callable by anyone after the window and immune to late-settlement manipulation, so I never depend on anyone's infrastructure or timing.

## 6. Major Modules

1. **MarkoutEngine (Pure Library):** normalized reversion — `decide(pre, post, windowAvg) → {Refund, Donate}` in tick space with a 50% frontier; `reversionBps` preview helper.
2. **MarkoutHook (BaseHook):** delta-charged bond escrow, previous-tick accumulator with append-only history, permissionless terminal settlement (at-settle refund payment, retryable claim), deferred LP donations, strict escrow accounting.
3. **MarkoutRouter (Convenience Integrator):** deadline, exact-in min-out / exact-out max-in (bond included), strict ERC-20 handling, native support, beneficiary declaration. Not a gate.
4. **FaucetToken:** capped, unsabotageable demo asset (no blacklist, hard supply cap, per-wallet cap, no direct mints to the PoolManager).
5. **Keeper (script/keeper.sh):** optional automation — poke, settle, retry-claim, flush.
6. **Frontend (frontend/):** live UI — deterministic receipt parsing, simulation-first writes, exact approvals, refresh-safe trade recovery, Price Memory Tape, deterministic Refund/Donate demos.

## 7. Testing Strategy

All logic verified via Foundry — 48/48 passing across four suites.

* **Engine (unit + fuzz):** 50% frontier boundaries in both directions, zero impact, overshoot, tiny fully-reverted swaps, large trades with noise, formula-vs-reference and monotonicity fuzzing.
* **Integration + attack:** `test_bondPayable_genericRouter` (v4's own PoolSwapTest pays the bond), `test_bondPayable_attackerAuthoredRouter`, `test_fullReverseNextBlock_refunds` (1:1, no overshoot), `test_delayedSettlement_matchesWindowClose` (identical verdicts after 50 swaps + 200 pokes + 1 day), `test_hookData_beneficiaryRules` (empty/junk/zero hookData fall back to the caller; only a nonzero 32-byte declaration is honored), `test_batchedSwaps_sameUnlock_preTicksNotClobbered` (two swaps, one unlock, one router: transient pre-tick keying holds), `test_atomicSandwich_sameBlock_frontLegRefunds_honestLimit` (the named, documented limit), `test_lpDividend_beatsVanillaSameFee` (hook LP ends ~the 20 bps bond ahead of a vanilla 3 bps LP after identical toxic flow), `test_hookCallbacks_rejectNonPoolManager`, `test_faucetMint_doesNotBreakEscrow`, `test_claimExistsOnlyWhenDeliveryFailed`, `test_noRouterLock_surface`, reentrancy-blocked claims, zero-liquidity donation deferral, native-currency end-to-end, exact-in/out slippage + deadline, window/replay guards, `SwapTooSmall`, spot-game immunity, `bondFor` quoting.
* **Invariant fuzz (handler-based, 256 runs × 500 calls):** escrow coverage, liability identity, verdict immutability, bounded per-trade release.
* **Canonical fork:** pool initialization and Permit2-funded liquidity through the **official Sepolia PositionManager**, exact-in and exact-out swaps, Refund-paid-at-settle, Donate + deferred flush — against the real canonical PoolManager state.

## 8. Development Backlog

| Task ID | Component | Status |
| --- | --- | --- |
| **TSK-01** | Repository: Foundry + v4-core/v4-periphery | Done |
| **TSK-02** | `MarkoutEngine` normalized reversion math | Done, unit + fuzz tested |
| **TSK-03** | `MarkoutHook`: delta-charged bond, append-only oracle, terminal settlement | Done, integration tested |
| **TSK-04** | `MarkoutRouter` convenience integrator + `FaucetToken` | Done |
| **TSK-05** | Foundry suites (48/48 incl. fork + invariants) | Done |
| **TSK-06** | Deploy to canonical Sepolia + Etherscan verification | Done |
| **TSK-07** | LiveProofPack: real Refund-at-settle + Donate hashes | Done (README) |
| **TSK-08** | Live browser UI (frontend/) against the deployment | Done |
| **TSK-09** | Demo video | Pending (human) |

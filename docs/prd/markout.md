# Product Requirements Document: Markout

**Product:** Markout (The Fair Flow Frontier)

**Track:** UHI10 — Sustainable Liquidity & MEV Protection

**Chain:** Ethereum Sepolia (`11155111`) for all contracts.

---

## 1. Problem Statement

Volatile Uniswap v4 pairs struggle to advertise competitive, low fees because Liquidity Providers (LPs) constantly leak value to informed order flow (Maximal Extractable Value, MEV, and Loss-Versus-Rebalancing, LVR). Conventional hook solutions attempt to mitigate this by relying on external oracles, delaying execution, or analyzing subsequent "continuation" swaps.

However, from a first-principles perspective, toxic single-shot arbitrageurs execute exactly *one* trade to snap the AMM to the global CEX equilibrium. There is zero continuation. Relying on continuation flow to measure toxicity automatically misclassifies the most dangerous MEV flow as benign.

To solve this sustainably without degrading UX or relying on synchronous external oracles, we rely on a fundamental truth of Automated Market Makers:

* **Informed Flow (Toxic):** The trader moves the AMM price to match the global market. The price *sustains* at this new level because no rational actor will arbitrage it backward.
* **Uninformed Flow (Benign):** The trader moves the AMM price away from the global market. Within seconds, an arbitrageur will execute a reverse swap to bring the AMM back to equilibrium. The price *reverts*.

## 2. Solution: Mean-Reversion Oracle

**Markout** is an autonomous Uniswap v4 hook that fills organic swaps immediately at 3 bps, escrows a 20 bps input bond, and settles it with a **Mean-Reversion Oracle** that lives entirely inside the hook.

At a settlement window $T$ (21 seconds):

* **Reversion (Benign):** If the time-weighted pool price has reverted toward the pre-swap price by more than 5 bps, the original trade was uninformed. The bond is **Refunded** to the user.
* **Sustain (Toxic):** If the time-weighted price at settlement remains within 5 bps of the post-swap price (or drifted further), the original trade was informed price discovery. The bond is **Donated** to the pool as a socialized dividend for in-range LPs.

This architecture penalizes single-shot arbitrage, natively protects organic flow, and operates entirely on-chain with no external oracles and no keeper dependency for correctness.

## 3. Settlement Architecture

### Permissionless Time-Gated Settlement

* Every bonded trade records `bondTime` and `settleAfter = bondTime + 21 s` on-chain.
* `settle(bytes32 tradeId)` is callable by **anyone** once the window elapses. Before the window it reverts with `SettlementWindowOpen`; after settlement it reverts with `AlreadySettled`; unknown ids revert with `UnknownTrade`.
* Outcomes depend only on pool state, so adversarial or self-interested settles are harmless: an early settle is impossible and a repeated settle is a no-op.
* A convenience keeper (`script/keeper.sh`) pokes the oracle and settles due trades, but correctness never depends on it.

### Hook-Native Time-Weighted Price

Uniswap v4 core ships no oracle, so the hook maintains one per pool, Uniswap-V2-style:

* A tick accumulator (`tickCumulative`) advances by `currentTick × elapsedSeconds` on every update.
* Updates happen on **every swap** (in `afterSwap`), on a **permissionless `poke()`**, and at **settlement** itself.
* The settlement price $P_T$ is the average tick over the trade's window: `(tickCumulativeNow − tickCumulativeAtBond) / elapsed`, converted via `TickMath.getSqrtPriceAtTick`.
* Attribution-at-update semantics: between two updates, elapsed time is attributed to the price observed at the next update. Intra-block spot games between pokes are therefore invisible; only prices that are *held* move the average. Manipulation cost scales with holding time.

## 4. Hook Mechanics & Constraints

* **Exact-Out Precision:** Bonds for exact-out swaps (`amountSpecified > 0`) are computed as exactly 20 bps of the absolute `amountIn` derived directly from the post-swap AMM `balanceDelta`. `slot0` estimations are strictly forbidden to prevent mathematical skew.
* **Immediate Fill:** Swaps are executed on the AMM curve in the origin transaction. There are no delays or asynchronous routing bypasses.
* **No Dust Bypasses:** Swaps generating a bond of 0 due to decimal truncation explicitly revert with a `SwapTooSmall` error.
* **Socialized Donation:** Because permanent price discovery inherently leaves swap-time LPs out-of-range, confiscated bonds are immediately routed to standard v4 `donate()`. This is documented as a pool-wide socialized MEV dividend.
* **Bond Receipts:** Each trade mints a minimal ERC-6909 receipt (id = `uint256(tradeId)`) to the trader as an on-chain record; value flow is governed by the trade's outcome and the `Settled` event.

## 5. User Stories

1. **As an LP**, I want toxic single-shot arbitrages detected via sustained price impact (lack of mean reversion), so MEV value is captured and donated to the pool.
2. **As an organic trader**, I want my uninformed swap verified by natural arbitrageurs reverting the price behind me, ensuring my 20 bps bond is reliably refunded.
3. **As a router integrator**, I want exact-out quoting to mathematically reflect the exact 20 bps input bond charged against the actual `balanceDelta`, so routing math does not systematically undercharge.
4. **As a hook developer**, I want to execute a single, immediate v4 `donate` at settlement time, so gas is minimized and LPs receive a socialized dividend for permanent price shocks.
5. **As a keeper operator**, I want to poke the oracle and settle due trades permissionlessly, so settlement happens promptly — while knowing the system stays correct even if my keeper stops.
6. **As a trader**, I want settlement callable by anyone after the window, so I never depend on the hook team's infrastructure to get my refund.

## 6. Major Modules

1. **MarkoutEngine (Pure Library):**
   * The mathematical implementation of the Mean-Reversion logic.
   * Interface: `decide(P_pre, P_post, P_T) -> { Refund, Donate }`, in Q128.128 price space with a strict 5 bps threshold.

2. **MarkoutHook (BaseHook):**
   * `beforeSwap`: captures $P_{pre}$.
   * `afterSwap`: mints the precise ERC-6909 bond against `balanceDelta`, captures $P_{post}$, checkpoints the tick accumulator, emits `SwapBonded(tradeId, trader, P_pre, P_post, bondAmount)`.
   * TWAP accumulator + public `poke()`.
   * `settle`: permissionless after the window; refunds the escrowed bond or pays it into the pool and `donate()`s it to LPs; emits `Settled`.

3. **MarkoutRouter (Reference Integrator):**
   * Executes the swap, settles the swapper's deltas, then pays the hook's bond escrow debt via `settleFor`. Router integrators must reproduce this last step.

4. **Keeper (script/keeper.sh):**
   * Optional automation: pokes the accumulator and settles due trades.

## 7. Testing Strategy

All logic verified via Foundry — 16/16 passing.

* `organicQuiet_refundsBond`: large swap followed by a reversion swap ⇒ `Refund`, bond returned, net cost = fee only.
* `arbSustains_donates`: swap with zero reversion ⇒ `Donate`, `Donate` event on PoolManager, escrow released.
* `exactOut_chargesInputBondAndFillsOutput`: exact-out fills exactly; bond = 20 bps of realized `balanceDelta` input.
* `swapTooSmall_reverts`: dust swaps revert.
* `settleWindowOpen_reverts` / `settle_replay_reverts`: window and idempotency guards.
* `spotGames_ignored`: intra-block shove-and-restore between pokes cannot flip an outcome.
* `twap_honorsSustainedReversion`: reversion held across the window ⇒ `Refund`.
* `refundUndeliverable_donates`: a blacklist-blocked refund never bricks settlement — the bond falls through to LPs.
* `bondFor_quotes`: the public quoting view matches the charged bond exactly (dust included).
* Engine unit tests: up/down reversion, sustain, 4-vs-6 bps price-space boundary, zero-impact donate.

## 8. Development Backlog

| Task ID | Component | Status |
| --- | --- | --- |
| **TSK-01** | Repository: Foundry + v4-core/v4-periphery | Done |
| **TSK-02** | `MarkoutEngine` mean-reversion math | Done, unit-tested |
| **TSK-03** | `MarkoutHook`: bond escrow, receipts, TWAP, permissionless settle | Done, integration-tested |
| **TSK-04** | `MarkoutRouter` reference integrator | Done |
| **TSK-05** | Foundry suite (16/16) | Done |
| **TSK-06** | Deploy to Sepolia + Etherscan verification | Done |
| **TSK-07** | LiveProofPack: real Refund + Donate settlement hashes | Done (README) |
| **TSK-08** | Demo video | Pending (human) |

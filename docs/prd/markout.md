# Product Requirements Document: Markout

**Product:** Markout (The Fair Flow Frontier)

**Tracks:** UHI10 Theme + Reactive Network (Dual-Track)

**Demo Chain:** Ethereum Sepolia (`11155111`) as origin and destination. Reactive Lasna (`5318007`) for the Reactive Smart Contract (RSC).

**Callback Proxies:** Sepolia (`0xc9f36411C9897e7F959D99ffca2a0Ba7ee0D7bDA`), Lasna (`0x0000000000000000000000000000000000fffFfF`).

---

## 1. Problem Statement

Volatile Uniswap v4 pairs struggle to advertise competitive, low fees because Liquidity Providers (LPs) constantly leak value to informed order flow (Maximal Extractable Value, or MEV, and Loss-Versus-Rebalancing, LVR). Conventional hook solutions attempt to mitigate this by relying on external oracles, delaying execution, or analyzing subsequent "continuation" swaps.

However, from a first-principles perspective, toxic single-shot arbitrageurs execute exactly *one* trade to snap the AMM to the global CEX equilibrium. There is zero continuation. Relying on continuation flow to measure toxicity automatically misclassifies the most dangerous MEV flow as benign.

To solve this sustainably without degrading UX or relying on synchronous external oracles, we must rely on a fundamental truth of Automated Market Makers:

* **Informed Flow (Toxic):** The trader moves the AMM price to match the global market. The price *sustains* at this new level because no rational actor will arbitrage it backward.
* **Uninformed Flow (Benign):** The trader moves the AMM price away from the global market. Within seconds, an arbitrageur will execute a reverse swap to bring the AMM back to equilibrium. The price *reverts*.

## 2. Solution: Mean-Reversion Oracle

**Markout** is an autonomous Uniswap v4 hook that fills organic swaps immediately at 3 bps, escrows a 20 bps input bond, and utilizes a **Mean-Reversion Oracle** driven entirely by the Reactive Network's `Cron1` event timing engine.

At a settlement window $T$ (approx. 21 seconds):

* **Reversion (Benign):** If the spot price has reverted toward the pre-swap price by more than 5 bps, the original trade was uninformed. The bond is **Refunded** to the user.
* **Sustain (Toxic):** If the absolute difference between post-swap price and the price at $T$ is less than 5 bps (or drifts further), the original trade was informed price discovery. The bond is **Donated** to the current pool as a socialized dividend.

This architecture perfectly penalizes single-shot arbitrages, natively protects organic flow, and operates entirely on-chain without human keepers.

---

## 3. Reactive Network Architecture

The Reactive Network (RN) provides the Inversion of Control required to settle trades autonomously. The architecture requires three contracts: an origin hook (Sepolia), a Reactive Smart Contract (Lasna ReactVM), and a destination executor (Sepolia).

### Dual-State Execution

The RSC inherits from `AbstractReactive` and operates in a dual-state environment.

* **Context Detection:** The RSC uses the `detectVm()` function with inline assembly `extcodesize(0x0000000000000000000000000000000000fffFfF)` to determine if it is executing on the public Reactive Network or within the isolated ReactVM.


* **Access Control:** Operations are strictly gated using `rnOnly` (for configuring subscriptions) and `vmOnly` (for event-reaction logic inside the ReactVM).



### Subscriptions & The `Cron1` Engine

* **Event Listening:** In the `rnOnly` constructor, the contract calls `service.subscribe()` to listen for the hook's `SwapBonded` event on Sepolia.


* **Wildcard Filtering:** We use the `REACTIVE_IGNORE` constant (`0xa65f96fc951c35ead38878e0f0b7a3c744a6f5ccc1476b313353ce31712313ad`) to apply wildcards to any unused event topics.


* **Automation:** The contract subscribes to `Cron1`, an event emitted by the Lasna system contract every block (approx. 7 seconds) with `topic_0` hash `0xf02d6ea5c22a71cffe930a4523fcb4f129be6c804db50e4202fb4e0b07ccb514`. This guarantees time passes reliably.



### ReactVM Processing & Callbacks

Within the ReactVM, the `react(LogRecord calldata log)` function processes the events:

* `SwapBonded` events push the Trade ID to a pending queue.
* `Cron1` events increment a tick counter. When a trade ages 3 ticks ($T \approx 21$ seconds), the ReactVM emits a `Callback` event.


* **Payload Authorization:** The `Callback` payload is encoded with `address(0)` as the first argument. The Reactive Network overwrites these first 160 bits with the RVM ID (the deployer's address) to guarantee authorized execution on the destination chain.


* **Gas Constraints:** The callback `gas_limit` is set well above the 100,000 minimum required by RN, and the `react()` logic is optimized to remain under the 900,000 ReactVM transaction maximum.



### Economy & Funding

To prevent silent failures, operators must manage Reactive Network debt.

* **Active Status:** We must maintain `Active` contract status on Reactscan, as unpaid debt results in blocklisting (`Inactive`).


* **Deposits:** We utilize the `depositTo(address)` method on the Lasna System Contract (funding the RSC in REACT) and on the Sepolia Callback Proxy (funding the executor in SepETH).



---

## 4. Hook Mechanics & Constraints

* **Exact-Out Precision:** Bonds for exact-out swaps (`amountSpecified > 0`) are computed as exactly 20 bps of the absolute `amountIn` derived directly from the post-swap AMM `balanceDelta`. `slot0` estimations are strictly forbidden to prevent mathematical skew.
* **Immediate Fill:** Swaps are executed on the AMM curve in the origin transaction. There are no delays or asynchronous routing bypasses.
* **No Dust Bypasses:** Swaps generating a bond of 0 due to decimal truncation explicitly revert with a `SwapTooSmall` error.
* **Socialized Donation:** Because permanent price discovery inherently leaves swap-time LPs out-of-range, confiscated bonds are immediately routed to standard v4 `donate()`. This is documented as a pool-wide socialized MEV dividend.

---

## 5. User Stories

1. **As an LP**, I want toxic single-shot arbitrages to be detected via sustained price impact (lack of mean reversion), so that MEV value is correctly captured and donated to the pool.
2. **As an organic trader**, I want my uninformed swap to be verified by natural arbitrageurs reverting the price behind me, ensuring my 20 bps bond is reliably refunded.
3. **As a router integrator**, I want exact-out quoting to mathematically reflect the exact 20 bps input bond charged against the actual `balanceDelta`, so routing math does not systematically undercharge.
4. **As a hook developer**, I want to execute a single, immediate v4 `donate` at settlement time, so gas is minimized and LPs receive a socialized dividend for permanent price shocks.
5. **As a Reactive developer**, I want to rely on the `Cron1` event for settlement timing, so callbacks fire autonomously even if no subsequent swaps occur on the AMM.


6. **As a destination executor**, I want the first parameter of my settlement function to be `address rvm_id`, so the Reactive Network can securely overwrite `address(0)` to authorize the transaction.


7. **As a demo operator**, I want to actively monitor Reactscan and call `depositTo` on both proxies, ensuring my contracts remain `Active` and avoid debt blocklisting.



---

## 6. Major Modules

1. **MarkoutEngine (In-Process):**
* Contains the mathematical implementation of the Mean-Reversion logic.
* Interface: `decide(P_pre, P_post, P_T) -> { Refund, Donate }`.


2. **MarkoutHook (BaseHook):**
* `beforeSwap`: Captures $P_{pre}$, enforces `SwapTooSmall` limit.
* `afterSwap`: Mints the precise ERC-6909 bond against `balanceDelta`, captures $P_{post}$, emits `SwapBonded(tradeId, P_pre, P_post)`.


3. **MarkoutReactive (Lasna ReactVM):**
* Inherits `AbstractReactive`.


* Subscribes to `SwapBonded` and `Cron1` events.


* Maintains a queue of pending trades. Emits `Callback` payloads after 3 `Cron1` ticks.




4. **MarkoutExecutor (Sepolia):**
* Inherits `AbstractCallback`.


* Executes `settleMarkout(address rvm_id, bytes32 tradeId)` strictly authorized by the Sepolia Callback Proxy.




5. **LiveProofPack:**
* Operational checklist: Validating Reactscan for `Active` contract status, ensuring the `Callbacks` column registers $>0$, and providing live Sepolia settlement hashes.





---

## 7. Testing Strategy

All logic must be rigorously verified via Foundry.

* `test_organic_reverts_refunds`: Simulates a large swap ($P_{pre} \rightarrow P_{post}$), followed by a reverse swap (simulating an arbitrageur reverting the price). Validates the engine triggers a `Refund`.
* `test_arb_sustains_donates`: Simulates a swap ($P_{pre} \rightarrow P_{post}$) with zero subsequent trades during window $T$. Validates the engine recognizes the sustained price impact and triggers a `Donate`.
* `test_exact_out_delta_precision`: Validates that positive `amountSpecified` correctly computes a 20 bps bond off the exact `amountIn` derived from the AMM curve, completely ignoring `slot0` spot conversions.
* `test_reactive_cron_callback`: Synthetic test matching `Cron1` topic `0xf02d6ea5c22a71cffe930a4523fcb4f129be6c804db50e4202fb4e0b07ccb514` to ensure the ReactVM correctly emits a `Callback` event after 3 blocks.



---

## 8. Development Backlog

| Task ID | Component | Description | Status |
| --- | --- | --- | --- |
| **TSK-01** | Repository | Initialize Foundry project and install `v4-core`, `v4-periphery`, and `reactive-lib`. | To Do |
| **TSK-02** | Engine | Implement `MarkoutEngine` containing mean-reversion math ($P_{pre}$, $P_{post}$, $P_T$ deltas). | To Do |
| **TSK-03** | Hook | Build `MarkoutHook` with BaseHook overrides, 6909 minting, exact-out handling, and `SwapBonded` event. | To Do |
| **TSK-04** | Reactive | Develop `MarkoutReactive.sol` with dual-state architecture, `Cron1` subscription, and 3-tick queue logic. | To Do |
| **TSK-05** | Executor | Develop `MarkoutExecutor.sol` inheriting `AbstractCallback` for `settleMarkout` processing. | To Do |
| **TSK-06** | Testing | Write Foundry suite for `test_organic_reverts_refunds`, `test_arb_sustains_donates`, and `test_exact_out_delta_precision`. | To Do |
| **TSK-07** | Ops | Deploy to Sepolia/Lasna testnets. Call `depositTo` on both networks to ensure `Active` status. | To Do |
| **TSK-08** | Docs | Write README and assemble `LiveProofPack` with valid Reactscan hashes. Record 5-minute demo video. | To Do |
---

## Addendum (2026-08-23) — shipped architecture delta

The Reactive Network is not a sponsor/judge of this cohort, so the settlement mechanism was replaced with an on-chain equivalent that preserves every behavioral guarantee:

- The `Cron1`-driven 3-tick window is now an on-chain timestamp gate: `settle(tradeId)` is callable by **anyone** once `block.timestamp >= bondTime + 21 s`. Early settles revert (`SettlementWindowOpen`); replays revert (`AlreadySettled`). No keeper is required for correctness.
- P_T is the **time-weighted average tick** over the window from a hook-maintained accumulator (v4.0.0 ships no oracle), advanced on every swap, by a public permissionless `poke()`, and at settlement — replacing spot-at-settle so that single-instant price shoves cannot decide a bond.
- All PRD hard constraints still hold: immediate fill on the AMM curve, bond = exactly 20 bps of the `balanceDelta`-derived `amountIn` (never `slot0`), no external oracles, dust swaps revert.
- The Reactive contracts (RSC, executor) were removed from the tree; their story and the investigation that led here are in `blockers.md`.

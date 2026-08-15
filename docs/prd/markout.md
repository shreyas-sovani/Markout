# PRD: Markout

**Product:** Markout  
**Context:** UHI10 Hookathon — The Fair Flow Frontier (Sustainable Liquidity & MEV Protection)  
**Status:** Draft for triage (`needs-triage`)  
**Tracks:** UHI10 theme + Reactive Network (dual-track). Unichain “best innovation of any kind” is a later same-bytecode deploy, not a third product.  
**Team:** 2 experienced builders  
**Window:** Hookathon Mon 17 Aug → Thu 3 Sep 2026 · Demo Day Fri 11 Sep 2026  
**Repo state at PRD time:** greenfield (Request for Hooks only)

**Primary demo chain (Reactive-documented):** Ethereum Sepolia (`11155111`) as **origin and destination**. Reactive Lasna (`5318007`) for the Reactive Smart Contract.  
**Sepolia Callback Proxy:** `0xc9f36411C9897e7F959D99ffca2a0Ba7ee0D7bDA`  
**Lasna system contract / callback proxy:** `0x0000000000000000000000000000000000fffFfF`  
**Sepolia PoolManager:** `0xE03A1074c86CFeDd5C142C4F04F1a1536e203543`

---

## Problem Statement

Volatile Uniswap v4 pairs cannot advertise CEX-like fees. Liquidity providers leak value to informed flow (adverse selection / LVR). The usual answers make the problem worse for UHI10:

- Raising fees when volatility is high taxes **everyone**, including organic flow (Aegis-style weather tax).
- Delaying or NoOp’ing the swap copies curriculum async-swap and hostage-takes UX.
- Same-transaction oracle skims (TAKEBACK / Mayk / Detox) can settle in `afterSwap`, so a Reactive callback is a sticker — Unique Execution and the Reactive prize collapse.
- Unichain already mitigated in-block sandwiches (encrypted mempool, priority ordering, Flashblocks). Sandwich-delay hooks fight last year’s war.

UHI10’s theme sentence is: reduce LP value leakage and make volatile-pair liquidity **sustainable at low fees**. The RFH also asks for fee rebates **tied to order-flow quality** and on-chain recapture of extracted value. Reactive’s job is time-based automation when a hook is asleep: monitor events on chain A, submit a callback on chain B (or A), by deploying **two additional** contracts (RSC + destination).

Judges will not score theoretical integrations. A mock labeled as Chainlink is a lie. A README that lists Reactive without a Reactscan callback that actually fired is a lie.

---

## Solution

**Markout** is a Uniswap v4 hook that fills the swap **immediately** at an advertised **3 bps** LP fee, escrows a **capped refundable toxicity bond** (~20 bps of exact-in notional), and true-ups that bond **after window T** using **realized TWAP markout** versus execution price.

- **Benign markout** (no informed continuation over T): refund the bond to the trader. Effective fee ≈ 3 bps.
- **Toxic markout** (continuation moves TWAP against LPs): `donate` the bond to in-range LPs.

The markout random variable is TWAP over `[t0, t0+T]`. It **does not exist** in the swap transaction. `afterSwap` must not read it. `settle` reverts until T. That is why Reactive is load-bearing: subscribe to the hook’s `SwapBonded` event **and** to **Cron1** (~7s), wait three ticks (~21s), emit `Callback` to the destination executor. No later user swap. No human keeper. No bot.

Pitch: *Aegis taxes the weather. Angstrom taxes urgency. We tax whether this fill was toxic over T.*

### Dual-track proof (the only Reactive pass)

Three transactions, in order:

1. **Origin (Sepolia):** user swap fills in this tx. Pool advertised 3 bps. Bond escrowed.
2. **RSC (Lasna):** `react()` tx on Reactscan with **Callbacks ≠ N/A**.
3. **Destination (Sepolia):** settlement tx **from the Callback Proxy** — refund or donate.

Anvil `settle()` is Functionality, not the partner integration. If the live callback is not firing, **do not list Reactive in the README**.

### Chain rule (from Reactive origin/destination table)

- Mainnets and testnets must not be mixed.
- **Unichain Sepolia (`1301`) is not a Reactive origin or destination** in the official table, even though Uniswap v4 is deployed there. Do not build the dual-track demo there.
- **Unichain mainnet (`130`)** is origin and destination (Callback Proxy `0x9299472A6399Fd1027ebF067571Eb3e3D7837FC4`) **only** paired with Reactive mainnet (`1597`), after Sepolia+Lasna is proven. Optional Unichain prize, not MVP.
- Hyperlane is not used.

---

## User Stories

1. As a volatile-pair LP, I want the pool to advertise a low LP fee, so that the pool can compete for organic flow instead of pricing like a volatility tax.
2. As a volatile-pair LP, I want toxic flow to compensate me on-chain after the fill, so that I am not the exit liquidity for informed traders at 3 bps.
3. As a volatile-pair LP, I want recapture to be a capped slice of notional, so that I do not expect a fake 100% LVR insurance product.
4. As an in-range LP at donate time, I want `donate` of the bond currency, so that fee growth increases without a second swap in the callback.
5. As an LP who jitters around donate, I want the README to disclose that v4 donate pays in-range liquidity at donate time, so that I am not promised swap-time LP snapshots.
6. As an organic trader, I want my swap to fill in the same transaction, so that I am not waiting on VRF, async fill, or a delayed AMM.
7. As an organic trader, I want my toxicity bond refunded after T when markout is benign, so that my effective fee stays near the advertised 3 bps.
8. As an organic trader, I want the refund sent to an address I pass in hook data, so that tokens do not stick on the Universal Router.
9. As a trader, I want exact-out swaps to revert, so that bond accounting stays one exact-in path.
10. As a trader, I want dust swaps that compute a zero bond to skip escrow and skip callbacks, so that tiny trades are not bricked.
11. As a trader, I want the bond capped so it cannot equal or exceed the specified amount, so that the pool never hits hook-delta-exceeds-swap-amount.
12. As a trader, I want permissionless settle after T if Reactive is late, so that my escrow is not hostage to one RSC.
13. As a trader, I want a one-hour fail-open expiry refund if nobody settled, so that silent Lasna cannot strand my bond.
14. As a trader, I want settle to be impossible before T, so that nobody confiscates or refunds using a spot that did not exist yet.
15. As a searcher, I want continuation swaps during T to be the toxicity signal, so that I cannot `setPrice` a mock to steal bonds.
16. As a searcher, I want markout to be a closed-interval TWAP identical for every caller, so that racing settle-time spot is useless.
17. As a searcher, I want settle to never swap, so that the true-up cannot be sandwiched as a price-moving callback.
18. As a Uniswap router integrator, I want the hook to accept Universal Router / PoolSwapTest as `sender` and still refund the user, so that production routing works.
19. As a Uniswap router integrator, I want hook data to encode only the refund recipient, so that the swap call stays small.
20. As a pool operator, I want a dynamic-fee pool whose stored fee is fixed at 3 bps, so that we use v4 fee override infrastructure without shipping a volatility-fee product.
21. As a pool operator, I want `afterInitialize` to set that 3 bps fee, so that the pool cannot launch with an accidental default fee.
22. As a pool operator, I want a pending-trade cap per pool, so that bond-queue griefing cannot unbounded-grow hook storage.
23. As a pool operator, I want exact-in only, so that specified-delta bond math has one sign convention (v4: exact-in is negative `amountSpecified`).
24. As a hook developer, I want bond escrow via PoolManager ERC-6909 `mint` in `beforeSwap`, so that `take` does not revert before the router has settled.
25. As a hook developer, I want a positive specified `BeforeSwapDelta` equal to the bond, so that the user pays the bond and the AMM still fills (not AsyncSwap’s full-input NoOp).
26. As a hook developer, I want `afterSwap` to record execution sqrt price, direction, bond, timestamp, and refund recipient, so that settle has a frozen trade record.
27. As a hook developer, I want `afterSwap` to append a TWAP observation and emit `SwapBonded`, so that Reactive can subscribe without reading markout in the swap tx.
28. As a hook developer, I want settle to run inside a fresh PoolManager `unlock`, so that `burn` / `take` / `donate` do not revert outside the original swap lock.
29. As a hook developer, I want checks-effects-interactions on settle (mark Settled before external effects), so that re-entrancy cannot double-pay the bond.
30. As a hook developer, I want donate with zero in-range liquidity to fail closed into a deferred state rather than refund toxic flow, so that LPs walking cannot convert toxicity into a trader rebate.
31. As a hook developer, I want HookMiner flags to include after-initialize, before-swap, after-swap, and before-swap-return-delta, so that the CREATE2 address matches permissions.
32. As a Markout engine, I want toxicity defined as TWAP moving against LPs given trade direction, so that “quality” is realized adverse selection, not volume VIP and not volatility.
33. As a Markout engine, I want insufficient or stale observations to fail-open refund, so that a broken oracle cannot seize user funds.
34. As a Markout engine, I want any adverse TWAP move to count as toxic in the demo (threshold zero), so that the organic vs toxic legs are camera-clear.
35. As an oracle port, I want a tiny `twap(pool, t0, t1)` interface, so that a later feed adapter can be swapped without changing the hook.
36. As an oracle port, I want the demo adapter to be hook-local observations plus real continuation swaps, so that we never claim Chainlink, Pyth, or a CEX.
37. As a README author, I want unused oracles omitted entirely, so that theoretical integrations are not mentioned for judging.
38. As a Reactive contract, I want constructor subscriptions only when not in ReactVM, so that ReactVM deploy does not revert on a missing system contract.
39. As a Reactive contract, I want a subscription to `SwapBonded` on Sepolia plus Cron1 on Lasna, so that time passes even if nobody swaps again.
40. As a Reactive contract, I want a FIFO delay of three Cron1 ticks after `SwapBonded`, so that T ≈ 21 seconds fits a live demo.
41. As a Reactive contract, I want `react` to be `vmOnly`, so that EOAs cannot drive ReactVM logic on the RN copy.
42. As a Reactive contract, I want `emit Callback(sepoliaId, executor, gasLimit, payload)` after the delay, so that the network submits the destination tx.
43. As a Reactive contract, I want payload first argument to be `address(0)` as a placeholder, so that the network can overwrite the first 160 bits with the ReactVM id.
44. As a destination executor, I want to inherit AbstractCallback with the Sepolia Callback Proxy as vendor, so that `authorizedSenderOnly` matches Reactive’s proxy.
45. As a destination executor, I want `settleMarkout(rvm, tradeId)` to be the only callback entry, so that payload encoding stays one function.
46. As a destination executor, I want not to block launch on a brittle `rvmIdOnly` mismatch (constructor `rvm_id = msg.sender` may not equal live ReactVM), so that Day-1 ping can succeed with proxy auth plus hook-side T.
47. As a destination executor, I want `receive()` and `pay()` from AbstractPayer, so that destination gas debt can be settled.
48. As a demo operator, I want `depositTo(rsc)` on Lasna with REACT, so that RVM execution is funded without a mystery inactive contract.
49. As a demo operator, I want `depositTo(executor)` on the Sepolia Callback Proxy with SepETH, so that destination callbacks do not revert for unpaid gas.
50. As a demo operator, I want the Lasna faucet path (SepETH to `0x9b9BB25f1A81078C544C829c5EB7822d747Cf434`, max 5 SepETH per request), so that we can get REACT on day one.
51. As a demo operator, I want a stock Reactive ping callback live before wiring markout, so that dual-track is de-risked by Wednesday 19 August.
52. As a demo operator, I want Reactscan Callbacks ≠ N/A as the ping pass condition, so that a subscribe-only RSC cannot be called a win.
53. As a hackathon judge, I want the victim swap to receive output in the sandwich test’s same transaction, so that I see this is not curriculum async.
54. As a hackathon judge, I want Foundry organic-refund and toxic-donate tests, so that Functionality is provable without a frontend.
55. As a hackathon judge, I want a human-voice video ≤ 5 minutes, so that the submission is not binary-DQ’d for AI voice.
56. As a hackathon judge, I want the README partner table to name Reactive with locations in code and live hashes, so that Unique Execution is reviewable.
57. As a hackathon judge, I want an honest disclosure that the TWAP adapter is a demo fixture, so that I do not score a fake oracle partner.
58. As a hackathon judge, I want a public GitHub on the correct branch, so that binary qualifications pass.
59. As a returning UHI team (if applicable), I want only new Hookathon-period code submitted, so that past curriculum is not re-judged.
60. As a theme judge, I want the pitch to quote low-fee LP leakage and fee-rebate-for-quality, so that sandwich-delay clichés are not the story.
61. As a Reactive judge, I want settlement to be impossible in `afterSwap`, so that I believe the callback is not bolted on.
62. As Builder A, I want hook accounting tests that prank the Callback Proxy, so that I can ship Functionality without Lasna.
63. As Builder B, I want ownership of RSC, executor, funding, explorers, README, and video, so that the prize path has a single owner.
64. As Builder B, I want a Friday 21 August go/no-go: if ping is dead, drop Reactive from the README, so that we do not fail the theoretical-integration rule.
65. As a security reviewer, I want bond math to multiply before dividing in basis points, so that truncation cannot zero the tax.
66. As a security reviewer, I want USDC 6-decimal awareness in tests and sizing, so that 1e18 assumptions do not brick the demo pair.
67. As a security reviewer, I want no approval/router custom token pulls in the hook, so that SafeERC20 quirks stay in the PoolManager path.
68. As a future maintainer, I want vocabulary aligned with PoolManager, donate, ERC-6909, BeforeSwapDelta, RSC, ReactVM, Callback Proxy, Cron1, and markout, so that the PRD and code stay navigable.
69. As a product owner, I want Sieve, TAKEBACK-as-product, CoW, FHE, Across, Paymaster, perps, and EigenLayer auctions out of MVP, so that two builders finish in three weeks.
70. As a pitch presenter, I want a 90-second cold open (1 bp/3 bps pool, immediate fill, explorer callback, organic refund, toxic donate) and a 5-minute submission cut, so that Demo Day and the portal both have artifacts.

---

## Implementation Decisions

### Locked product rules

- Immediate fill. Never NoOp, delay, or randomize the swap.
- Advertised LP fee is fixed 3 bps (v4 fee units 300) on a dynamic-fee pool. Per-swap override may restamp 3 bps. This is not a volatility-fee product.
- Bond is 20 bps of exact-in specified amount, hard-capped below 2% and strictly less than specified amount.
- Markout oracle is forbidden until `t0+T`. Settle reverts early.
- Markout = TWAP(`[t0,t0+T]`) vs execution sqrt price, signed by `zeroForOne`. Demo threshold = 0 (any adverse move is toxic).
- Toxicity demo = real continuation swap in the same direction, not an owner `setPrice`.
- Reactive Cron is the automation path. Permissionless `settle(tradeId)` after T computes the **same** TWAP. One-hour `expireRefund` is fail-open insurance.
- Stale/empty TWAP → fail-open refund. Donate with no in-range liquidity → defer, do not refund toxic flow.
- README partner: Reactive only, and only after a live callback exists. No Chainlink, Across, Circle, Fhenix, EigenLayer, Stylus, Brevis, Hyperlane.
- Swaps for tests/demo go through Uniswap v4 PoolSwapTest / PoolManager unlock (Uniswap swap-integration skill: do not make Trading API or UniswapX PRIORITY the product). `hookData` carries `refundTo` because the router is `sender`.

### Architecture

```
Trader → Uniswap v4 swap (exact-in, hookData=refundTo)
  → MarkoutHook.beforeSwap: mint ERC-6909 bond, return specified delta, fee override 3 bps
  → AMM fills immediately
  → MarkoutHook.afterSwap: record trade, write observation, emit SwapBonded (no markout read)
  → MarkoutReactive (Lasna): SwapBonded + Cron1 × 3 → emit Callback
  → Callback Proxy (Sepolia) → MarkoutExecutor.settleMarkout
  → MarkoutHook.settle in unlock: TWAP vs exec → refund trader OR donate to LPs
```

### Major modules (deep modules, small interfaces)

Proposed for confirmation (to-prd):

1. **MarkoutEngine** (deep, in-process)  
   - **Interface:** `decide(trade, twap, now) → { Refund, Donate, TooEarly, FailOpenRefund }`  
   - Encapsulates: T gate, direction-signed comparison, threshold, stale handling. No PoolManager.

2. **BondEscrow** (deep, PoolManager-backed)  
   - **Interface:** `lockBond`, `refundTo`, `donateBond`, `hookClaimBalance`  
   - Encapsulates: ERC-6909 mint in beforeSwap, burn+take refund, burn+donate, cap vs specified amount. Never `take` in beforeSwap.

3. **ObservationOracle** (deep; real seam — two adapters)  
   - **Port:** `twap(poolId, t0, t1) → { sqrtPriceX96, updatedAt, stale }`  
   - **Adapter A (demo):** hook-local observation ring written on every swap (including continuations).  
   - **Adapter B (unclaimed):** future external feed with the same port. Must not be named in README until it exists.

4. **MarkoutHook** (thin composition)  
   - Wires BaseHook permissions, `refundTo` decode, exact-in gate, pending-queue cap, `SwapBonded` event, unlock callback for settle.

5. **SettlementGate** (deep)  
   - **Interface:** `settle(tradeId)`, `expireRefund(tradeId)`  
   - Permissionless after T; executor is one caller among many. CEI. Same TWAP for all callers. No swap in callback.

6. **MarkoutReactive** (Lasna)  
   - AbstractReactive. Subscribe `SwapBonded` (Sepolia, hook address, topic0) and Cron1 (Lasna system contract, Cron1 topic0 `0xf02d6ea5c22a71cffe930a4523fcb4f129be6c804db50e4202fb4e0b07ccb514`). FIFO delay. `vmOnly react`. Emit Callback. Fund via `depositTo`.

7. **MarkoutExecutor** (Sepolia destination)  
   - AbstractCallback(Sepolia Callback Proxy). `authorizedSenderOnly`. Forwards to SettlementGate. Fund via Callback Proxy `depositTo`.

8. **LiveProofPack** (ops, not on-chain)  
   - Three explorer URLs, Reactscan Callbacks column, README partner table. If hashes do not exist, partner section is `No partner integrations`.

### Hook permissions (behavioral)

Enable: after initialize, before swap, after swap, before-swap return delta.  
Disable: liquidity hooks, donate hooks, after-swap return delta. We **call** donate; we are not a donate hook.

### Accounting clarifications (Uniswap v4)

- v4 exact-in uses negative `amountSpecified`. Treat the opposite sign as exact-out and revert.
- A specified BeforeSwapDelta **shrinks** the AMM fill by the bond (~0.20%). Accepted. This is not AsyncSwap (which mints the entire input and skips the curve).
- Bond lives as ERC-6909 claims on the PoolManager, not raw ERC-20 on the hook.
- `sender` is the router; refund recipient is hook data.
- Settle is a **new** transaction; PoolManager is locked unless the hook unlocks.

### Reactive clarifications (official docs)

- Two extra contracts: RSC on Lasna, executor on Sepolia.
- ReactVM copy cannot access arbitrary externals; it processes logs and emits Callback.
- First callback argument is always overwritten with ReactVM id.
- Cron1 is ~7 seconds (Lasna blocks), not Unichain Flashblocks. Never pitch 200ms native settlement.
- Failed destination callbacks still consume destination gas; keep the executor funded.
- Do not call `subscribe` from ReactVM; subscribe in the RN constructor (`if (!vm)`).

### Constants

| Knob | Value |
|---|---|
| LP fee | 3 bps |
| Bond | 20 bps of exact-in, cap ≤ 2% and < specified |
| T | 3 × Cron1 ≈ 21s (can drop to 1 tick for video) |
| Expiry | swap timestamp + 1 hour |
| Pending cap | 128 trades / pool |
| Callback gas limit | 1,000,000 (RVM max 900,000 is for the Lasna react tx, not destination) |
| Pair | one test pair, full-range liquidity in tests |
| Threshold | 0 (any adverse TWAP move is toxic) |

### Two-person split

- **A:** MarkoutEngine, BondEscrow, ObservationOracle, MarkoutHook, SettlementGate, Foundry suite.  
- **B:** MarkoutReactive, MarkoutExecutor, funding, live ping by **Wed 19 Aug**, full live settlement by **Wed 26 Aug**, README, human-voice video.  
- **Fri 21 Aug:** if ping is dead, stop listing Reactive.

### Cut order if slipping

1. Deferred-donate retry UX  
2. Frontend  
3. Second pool / Unichain mainnet  
4. Reputation / repeat-offender multipliers  
5. Never cut: live ping, organic+toxic tests, immediate fill, honest README

---

## Testing Decisions

**What a good test is:** assert observable outcomes through module interfaces (balances, fee growth, events, reverts, explorer-level Callback emission in the RSC harness). Do not assert internal storage layout. Do not test that Solidity assignment works. Foundry is the product; there is no frontend gate.

**Prior art:** Uniswap v4-template `PoolSwapTest` / `deployCodeTo` hook-flag mining; Uniswap docs ERC-6909 mint-in-beforeSwap; Uniswap async-swap docs as the **anti-pattern** (we must prove we did not skip the AMM); Reactive Basic Demo + Uniswap Stop Order demo for subscribe / Callback payload; ethskills testing skill (invariants, fuzz, fail-mode names).

### Modules that must have tests (proposed)

1. **MarkoutEngine** — unit: too-early, benign, toxic, stale fail-open, both swap directions.  
2. **BondEscrow + MarkoutHook** — integration via PoolManager test harness:  
   - organic refund restores trader claim and does not donate  
   - toxic donate increases in-range fee growth; trader does not receive bond  
   - sandwich/backrun does not delay or NoOp the victim fill  
   - exact-out reverts  
   - bond cap / dust skip  
   - escrow invariant: hook 6909 == sum of pending bonds until settle; never both refunded and donated  
3. **SettlementGate** — too-early reverts from anyone including executor; double-settle reverts; permissionless settle after T matches executor path; 1h expiry refunds; executor auth reverts for random EOAs.  
4. **ObservationOracle** — continuation swap moves TWAP; quiet window keeps TWAP ≈ execution; owner cannot inject a price except by swapping.  
5. **MarkoutReactive harness** — synthetic LogRecords: SwapBonded then 3× Cron1 emits Callback; too few crons does not. This does **not** replace the live Reactscan check.  
6. **Fuzz / invariant** — random exact-in sizes and continuation sequences: escrow conservation; settle idempotence; advertised fee never changes.

Fork tests against Sepolia PoolManager are optional after Anvil template tests are green. Do not mock PoolManager if the template harness is available.

Named tests (behavior, not files):  
`organicSwap_refundsBondToTrader` · `toxicSwap_donatesBondToInRangeLps` · `sandwichDoesNotDelayOrNoOpVictimSwap` · `settleRevertsBeforeT` · `settleRevertsIfNotCallbackProxyOnExecutor` · `escrowInvariant_bondConservedUntilSettle` · `oracleStale_failOpenRefundsBond` · `permissionlessExpiry_refundsIfReactiveSilent` · `exactOut_reverts`

---

## Out of Scope

- Sieve (CoW + delay-the-swap + traffic-light classifier)  
- TAKEBACK as the product (same-tx oracle skim)  
- Curriculum resubmits: gas-price fees, JIT rebalancing, Nezlobin directional fee as the product, CSMM, LAMMBert, async swap + VRF, CoW matching  
- Sandwich-neutralizing delay / randomized ordering  
- IL insurance, delta-neutral hedges, YieldBasis/Pendle, UHI9 leftovers  
- Circle Paymaster, CCTP, Fhenix FHE, Across, Flaunch, Ink KYC, Stylus rewrite, Brevis VIP volume fees (ineligible), EigenLayer LVR auction (already won)  
- Unichain Sepolia as Reactive destination  
- Mixing Lasna with any mainnet  
- Hyperlane transport  
- Trading API / UniswapX PRIORITY / Dutch auction as the execution path  
- Custom frontend, analytics dashboard, multi-hop, exact-out, native ETH as bond, per-tick LP snapshots, JIT-donate protection, governance, upgradeable hook, Unichain Flashblock-native T  
- Claiming unused sponsors or “we’ll add Chainlink after”

---

## Further Notes

### Glossary

- **Markout:** realized adverse selection of a fill over horizon T (TWAP vs execution), not an insurance premium.  
- **LVR:** loss-versus-rebalancing; the economic leak this hook recaptures a **slice** of, not 100%.  
- **Hook:** Uniswap v4 contract whose address flags select callbacks into PoolManager.  
- **BeforeSwapDelta / ERC-6909:** how a hook takes a specified-amount cut without `take` before router settle.  
- **donate:** PoolManager credit to in-range LPs at donate time.  
- **RSC / ReactVM:** Reactive contract has an RN copy (subscriptions) and an isolated ReactVM copy (`react`).  
- **Callback Proxy:** destination-chain contract that must be `msg.sender` of the settlement tx.  
- **Cron1:** system-contract event every Lasna block (~7s).  
- **Fee-rebate for quality:** RFH bullet; quality here is realized markout, not volume tiers.

### Why this scores

Original Idea ~4 (ex-post per-swap true-up; RFH already named rebates, so not a 5). Unique Execution depends on a **live** callback. Impact is the theme sentence. Functionality is the Foundry pair of legs. Presentation is human voice + explorers.

### Anti-patterns from Uniswap docs

The official async-swap hook mints the **entire** exact-in amount and skips the v3-style swap. Markout must mint **only the bond** and still run the AMM. A test must show the victim received output in the swap transaction.

### Skills / docs used to write this PRD

- Conversation lock: patched Markout, dual-track, 2 builders, mock-honest TWAP  
- Uniswap swap-integration skill (author Uniswap): routers are `sender`; do not productize Trading API  
- ethskills building-blocks / testing / security: BaseHook permissions, invariants, CEI, decimals, bps math  
- Uniswap v4 docs: beforeSwap delta, ERC-6909 mint, dynamic fees, deployments (Sepolia PoolManager; Unichain Sepolia exists but is not a Reactive destination)  
- Reactive Network docs copy: origins/destinations, AbstractCallback / AbstractReactive, Cron1, Callback first-arg overwrite, `depositTo`, faucet, no mainnet/testnet mix  
- `npx skills find uniswap` returned no extra ecosystem skill; local Uniswap skill + ethskills used instead

### Modules checklist (confirm)

| Module | Build | Tests |
|---|---|---|
| MarkoutEngine | yes | yes |
| BondEscrow | yes | yes (via hook integration) |
| ObservationOracle | yes | yes |
| MarkoutHook | yes | yes |
| SettlementGate | yes | yes |
| MarkoutReactive | yes | harness + live ping |
| MarkoutExecutor | yes | auth tests + live callback |
| LiveProofPack | yes | manual explorer checklist |
| Frontend | no | n/a |

No Linear/GitHub/matt-pocock backlog backend is configured in this workspace. This file is the canonical PRD; the backlog stub carries `needs-triage`.

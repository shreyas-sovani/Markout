# Markout — Live Demo Runbook

How to run the demo end-to-end, what to expect at each step, how to verify each stage, and how to fix everything that has already gone wrong once. Read the "Known traps" section before your first run — every item there burned real time.

## Prerequisites (state as of 2026-08-19)

Deployed and working:

| Piece | Address | State |
| --- | --- | --- |
| Pool (currency0 = 0x144A…, currency1 = 0x91C7…, 3 bps, tickSpacing 60) | `0x7A1087753d33B928c2FEa8eFaFbC23BddCb4cc53` | live, 10e18 liquidity/side |
| MarkoutHook | `0x1DB65c7efD46a7d663d05C7Bc61Bb88f116000c0` | live, verified |
| MarkoutExecutor | `0x1D054cd08CD007748602B7C116042f4c0534E1dD` | live, verified, proxy-funded |
| MarkoutRouter | `0x63634289880D5ab9D74f43FA7Dc196c1F0605989` | live, verified |
| token0 (0x144A…) | `0x144ABA252550ea7fbe7c487B8d153815097a1f15` | EOA holds 90e18, router approved |
| token1 (0x91C7…) | `0x91C7d1f821B30B76e6E47fE51243B75fb2F5938e` | EOA holds ~89e18, router approved |
| MarkoutReactive | `0x6719F298F544c688999819d13A34E871E723f4d9` | subscribed, but funding-wedge prone (see traps) |

Env:

```bash
source .env   # ACC3_PRIV_KEY (operator EOA 0xFeAf…690A), ETHERSCAN_API_KEY
export SEP=https://ethereum-sepolia-rpc.publicnode.com
export LASNA=https://lasna-rpc.rnk.dev/
```

## Pre-flight (2 minutes, do every time)

1. **RSC debt must be 0** or the RVM is/will be `Inactive` and nothing settles:
   ```bash
   cast call 0x0000000000000000000000000000000000fffFfF "debt(address)(uint256)" \
     0x6719F298F544c688999819d13A34E871E723f4d9 --rpc-url $LASNA
   ```
2. **Operator EOA funded on both chains.**
   ```bash
   cast balance 0xFeAf5C921996FC53f4DEf35e181E766e6D74690A --rpc-url $SEP    # want > 0.05 SEP
   cast balance 0xFeAf5C921996FC53f4DEf35e181E766e6D74690A --rpc-url $LASNA  # want > 0.3 REACT (Lasna gas spikes to 100+ gwei)
   ```
3. If debt > 0 (see "Reviving the RSC" below) before running the demo.

## The demo

All swaps go through the router from the operator EOA. Exact command templates (note `uint160` in the signature — see trap #1):

```bash
K="(0x144ABA252550ea7fbe7c487B8d153815097a1f15,0x91C7d1f821B30B76e6E47fE51243B75fb2F5938e,300,60,0x1DB65c7efD46a7d663d05C7Bc61Bb88f116000c0)"

# Buy: sell 1 token0 for token1 (exact-in)
cast send 0x63634289880D5ab9D74f43FA7Dc196c1F0605989 \
  "swap((address,address,uint24,int24,address),(bool,int256,uint160),bytes)" \
  "$K" "(true,-1000000000000000000,4295128740)" 0x \
  --private-key $ACC3_PRIV_KEY --rpc-url $SEP
```

### Run 1 — organic flow → REFUND

1. Swap **buy** 1e18 (command above). ~2% price impact, way beyond the 5 bps threshold.
2. Within the same minute, swap **sell** 1e18 (the "arbitrageur" reverting the price):
   ```bash
   cast send 0x63634289880D5ab9D74f43FA7Dc196c1F0605989 \
     "swap((address,address,uint24,int24,address),(bool,int256,uint160),bytes)" \
     "$K" "(false,-1000000000000000000,1461446703485210103287273052203988822378723970341)" 0x \
     --private-key $ACC3_PRIV_KEY --rpc-url $SEP
   ```
3. Wait 21 s (3 Cron1 ticks) + dispatch latency — realistically **1–3 minutes**.

**Expected:** the Reactive Network delivers a transaction to the executor (from the Sepolia Callback Proxy `0xc9f36411…7bDA`), which calls `settleMarkout` → `MarkoutHook.settle` → outcome `Refund` → the 20 bps bond (2e15 wei of the input token) transfers back to the trader.

**Verify:**

```bash
# Settlement events (outcome 1 = Refund, 2 = Donate)
cast logs "Settled(bytes32,uint8,uint160,uint256)" \
  --address 0x1DB65c7efD46a7d663d05C7Bc61Bb88f116000c0 \
  --from-block $(( $(cast block-number --rpc-url $SEP) - 200 )) --rpc-url $SEP

# Executor activity (txs from 0xc9f36411… = callback deliveries)
# https://sepolia.etherscan.io/address/0x1d054cd08cd007748602b7c116042f4c0534e1dd
```

Accounting sanity: trader's net cost for run 1 ≈ swap fee (3 bps) only — the bond comes back.

### Run 2 — toxic flow → DONATE

1. Swap **buy** 1e18. Do nothing else. Let the price sustain.
2. Wait 1–3 minutes.

**Expected:** `Settled(…, outcome=2 …)`, plus a `Donate(poolId, hook, 2e15, 0)` event on the PoolManager. The bond is socialized to LPs.

**Verify:** the `Settled` log shows outcome `2`; hook's token balance for that currency drops to 0; PoolManager token balance grew by the bond.

### Run 3 — exact-out precision (optional, PRD story 3)

```bash
cast send 0x63634289880D5ab9D74f43FA7Dc196c1F0605989 \
  "swap((address,address,uint24,int24,address),(bool,int256,uint160),bytes)" \
  "$K" "(true,100000000000000000,4295128740)" 0x \
  --private-key $ACC3_PRIV_KEY --rpc-url $SEP
```

Output filled = exactly 1e17; bond = 20 bps of the realized input amount read off the balance delta (compare hook's token balance against `amountIn`).

## Troubleshooting

### Swaps revert instantly (~27k gas, empty data)

**Cause #1 (hit us):** wrong selector. `sqrtPriceLimitX96` is **uint160** — if you encode the signature with `uint256`, `cast` silently builds a different selector (`0x0b0b1345` vs the real `0xf3cd914c`) and the router reverts in ~152 gas of dispatch. Always use:

```
swap((address,address,uint24,int24,address),(bool,int256,uint160),bytes)
```

**Cause #2:** wrong currency ordering. The deployed pool has `currency0 = 0x144ABA…` (0x14 < 0x91). Swap params must use that ordering or you get `PoolNotInitialized`.

**Cause #3:** `sqrtPriceLimitX96: 0` reverts `PriceLimitOutOfBounds`. Buy → `4295128740` (MIN+1); sell → `1461446703485210103287273052203988822378723970341` (MAX-1).

### Swaps succeed but nothing ever settles

Check in order:

1. **RSC debt** (pre-flight command). Non-zero → RVM going/gone `Inactive` → revive (below).
2. **Reactscan** (https://lasna.reactscan.net/address/0x6719F2…3f4d9): contract status must be **Active**, RVM transaction count should be climbing every ~7 s (the Cron1 subscription processes every Lasna block).
3. **Executor activity** on Etherscan: no txs from the Callback Proxy = the Reactive Network never dispatched. That is always an RSC-side (funding/status) problem, never a Sepolia problem.

### Reviving the RSC (the wedge we actually hit)

The RVM pays per processed event. When its system balance empties, debt accrues, status flips `Inactive`, and processing stops — including auto-settlement of that debt via `depositTo` (deadlock: no processing → no auto-pay). Recovery sequence that worked:

```bash
# 1. Direct ETH to the RSC (the network intercepts plain transfers to RCs and
#    credits them; you'll see a system DepositTo event on the tx):
cast send 0x6719F298F544c688999819d13A34E871E723f4d9 --value 0.01ether \
  --private-key $ACC3_PRIV_KEY --rpc-url $LASNA

# 2. Then make the contract pay its own debt from that balance:
cast send 0x6719F298F544c688999819d13A34E871E723f4d9 "coverDebt()" \
  --private-key $ACC3_PRIV_KEY --rpc-url $LASNA

# 3. Confirm zero:
cast call 0x0000000000000000000000000000000000fffFfF "debt(address)(uint256)" \
  0x6719F298F544c688999819d13A34E871E723f4d9 --rpc-url $LASNA
```

`coverDebt()` fails with `Insufficient funds` if the RSC's own ETH < debt — repeat step 1 with more.

If debt is 0 and RVM count is still not climbing on Reactscan: trades bonded while the contract was Inactive are **lost** (the RVM never saw the events) — run a *fresh* swap and watch that one settle.

If the wedge persists: redeploy the RSC (subscriptions re-register in the constructor; hook/executor unchanged):

```bash
forge create src/MarkoutReactive.sol:MarkoutReactive \
  --rpc-url $LASNA --private-key $ACC3_PRIV_KEY --broadcast --value 0.005ether \
  --constructor-args 0x1db65c7efd46a7d663d05c7bc61bb88f116000c0 0x1d054cd08cd007748602b7c116042f4c0534e1dd
```

…then immediately `depositTo(newRsc, 0.1ether)` on the system contract. Watch Lasna gas price first — it spikes to 100+ gwei and a redeploy can cost 0.17 REACT.

### Lasna transactions stuck / "replacement transaction underpriced"

The Lasna RPC pair occasionally wedges. `txpool` access is blocked so you can't inspect. Retry the send unchanged after a minute; check `cast nonce` first; if a nonce is genuinely stuck, rebuild the tx with `--nonce N` and a gas price ≥ 2× current.

## Recording the LiveProofPack

For each run capture: (1) the swap tx hash (Sepolia), (2) the executor settle tx hash (Sepolia, from the Callback Proxy), (3) the `Settled` event args, (4) a Reactscan screenshot of the RSC showing `Active` + climbing RVM count + `Callbacks > 0`. Paste into README's LiveProofPack section.

## Proof cycle from 2026-08-19

- Organic pair swaps: `0x18a1f8f62d6b2b4b5933affddd8b29c638c0bd39b1cf131edb6e09f4d3b116a5` (buy) + `0x2820be296853fc2e849b368739914ceb62d3b215e3c6752810e3adfb03c48d1d` (reverse) — bonds escrowed, settlement pending RSC revival.
- Second organic pair: `0x47325c9e277a6ad49d37277cb34a1125cc29cb17023b6b8aa2bdcb23d167e458` + `0x378b43863cb785b3fde5ff8f403bd9c7e42e8b4e04c056e2bb7a9e3c4a3a4166` — same status.
- These four trades will NOT settle retroactively (bonded while RSC inactive). Run fresh swaps for the demo video.

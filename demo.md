# Markout — Live Demo Runbook

Everything needed to run the demo end-to-end against the deployed Sepolia stack, verify each step, and fix the known traps.

## Prerequisites

```bash
source .env   # ACC3_PRIV_KEY (operator 0xFeAf…690A), ETHERSCAN_API_KEY
export SEP=https://ethereum-sepolia-rpc.publicnode.com
```

Operator EOA holds demo tokens and has approved the router. Addresses in README.

## Constants

```bash
HOOK=0xE79B7Ef0Bb9984BDB614f58d2C8000ce98b180C0
ROUTER=0xCeBe3Ce43Db694F2313445999648b1FBBBf20890
K="(0x7e80764a88133cfc3da52b7305044da782904667,0xcbbe82f3b6331dbe9faead19d3757371b059bdae,300,60,0xe79b7ef0bb9984bdb614f58d2c8000ce98b180c0)"
```

Note the `uint160` in the swap signature — see traps.

## Run 1 — organic flow → REFUND

```bash
# 1. Organic buy: sell 1 token0, price moves ~20% (far beyond 5 bps).
cast send $ROUTER "swap((address,address,uint24,int24,address),(bool,int256,uint160),bytes)" \
  "$K" "(true,-1000000000000000000,4295128740)" 0x \
  --private-key $ACC3_PRIV_KEY --rpc-url $SEP

# 2. "Arbitrageur" reverts the price in the next tx.
cast send $ROUTER "swap((address,address,uint24,int24,address),(bool,int256,uint160),bytes)" \
  "$K" "(false,-1000000000000000000,1461446703485210103287273052203988822378723970341)" 0x \
  --private-key $ACC3_PRIV_KEY --rpc-url $SEP

# 3. Wait ≥ 21 s (settlement window), then anyone settles:
cast send $HOOK "settle(bytes32)" $TRADE_ID \
  --private-key $ACC3_PRIV_KEY --rpc-url $SEP
```

Get `$TRADE_ID` from the hook's `SwapBonded` event (`cast logs "SwapBonded(bytes32,address,uint160,uint160,uint256)" --address $HOOK --from-block <block> --json --rpc-url $SEP`, `topics[1]` of the first swap).

**Expected:** `Settled(outcome=1)` — trader's token0 balance increases by exactly the bond (20 bps of amountIn, e.g. 2e15 for a 1e18 swap). Net cost of the round trip ≈ swap fees only.

## Run 2 — toxic flow → DONATE

```bash
# Single-shot "arbitrage": buy and walk away.
cast send $ROUTER "swap((address,address,uint24,int24,address),(bool,int256,uint160),bytes)" \
  "$K" "(true,-1000000000000000000,4295128740)" 0x \
  --private-key $ACC3_PRIV_KEY --rpc-url $SEP
# wait 21 s, settle that trade id
```

**Expected:** `Settled(outcome=2)` plus a `Donate` event on the PoolManager; the hook's escrow for that currency drops to 0; the bond lands in the pool for in-range LPs.

## Run 3 — exact-out precision (optional)

```bash
cast send $ROUTER "swap((address,address,uint24,int24,address),(bool,int256,uint160),bytes)" \
  "$K" "(true,100000000000000000,4295128740)" 0x \
  --private-key $ACC3_PRIV_KEY --rpc-url $SEP
```

Output filled exactly 1e17; bond = 20 bps of the realized input (compare hook token balance vs the swap's input leg).

## Hands-free mode

`script/keeper.sh` pokes the oracle every loop and settles every due trade automatically:

```bash
RPC=$SEP PK=$ACC3_PRIV_KEY ./script/keeper.sh
```

## Verification cheatsheet

```bash
# Outcomes (1 = Refund, 2 = Donate)
cast logs "Settled(bytes32,uint8,uint160,uint256)" --address $HOOK \
  --from-block $(( $(cast block-number --rpc-url $SEP) - 300 )) --json --rpc-url $SEP

# Escrow held by the hook
cast call 0x7e80764a88133cFc3dA52b7305044dA782904667 "balanceOf(address)(uint256)" $HOOK --rpc-url $SEP
cast call 0xCBbe82f3B6331dbE9fAEAD19D3757371b059BDAe "balanceOf(address)(uint256)" $HOOK --rpc-url $SEP

# Receipts (id = uint256(tradeId))
cast call $HOOK "balanceOf(address,uint256)(uint256)" <trader> <tradeId-as-uint> --rpc-url $SEP
```

## Traps (each one cost real time — read before hacking)

1. **`uint160`, not `uint256`.** The swap signature's `sqrtPriceLimitX96` is `uint160`. Encode it as `uint256` and `cast` silently produces a different selector; the router reverts in ~152 gas with empty data.
2. **Pool currency ordering.** currency0 = `0x7e80…` (numerically smaller). Swap params must match or you get `PoolNotInitialized`.
3. **Price limits can't be zero.** Buy → `4295128740` (MIN+1); sell → `1461446703485210103287273052203988822378723970341` (MAX−1).
4. **Settlement before 21 s reverts** with `SettlementWindowOpen(settleAfter, now)` — by design.
5. **A poke before manipulation.** The TWAP attributes the time since the last poke to the price observed at the next update. If you're testing manipulation resistance in a fork test, poke before the shoves or the elapsed time lands on the shoved price (that's oracle semantics, not a bug).
6. **Dust swaps revert** (`SwapTooSmall`) once bond = 20 bps of amountIn rounds to zero — amounts below 500 wei of input.

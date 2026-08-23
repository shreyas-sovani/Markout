# Markout — Live Demo Runbook

Everything needed to run the demo end-to-end against the deployed Sepolia stack, verify each step, and fix the known traps. The Reactive Network variant was parked (see `blockers.md`); everything below is pure Sepolia.

## Prerequisites

```bash
source .env   # ACC3_PRIV_KEY (operator 0xFeAf…690A), ETHERSCAN_API_KEY
export SEP=https://ethereum-sepolia-rpc.publicnode.com
```

Operator EOA holds demo tokens and has approved the router. Addresses in README.

## Constants

```bash
HOOK=0xF51b4DD1e87D786fE7F3dFAAD29b754F11CdC0c0
ROUTER=0x9640D3679c4440Cc7B1d56D7617f078c196BA7cC
K="(0x3b05a2ff8351ca6d8782e892a55e616a7f41e6a8,0x94e7f1324d87ba28d8fc556bd5c9be9e598680c0,300,60,0xf51b4dd1e87d786fe7f3dfaad29b754f11cdc0c0)"
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
cast call 0x3b05a2fF8351CA6D8782E892a55e616A7F41E6A8 "balanceOf(address)(uint256)" $HOOK --rpc-url $SEP
cast call 0x94E7F1324D87BA28D8Fc556BD5C9be9E598680c0 "balanceOf(address)(uint256)" $HOOK --rpc-url $SEP

# Receipts (id = uint256(tradeId))
cast call $HOOK "balanceOf(address,uint256)(uint256)" <trader> <tradeId-as-uint> --rpc-url $SEP
```

## Traps (each one cost real time — read before hacking)

1. **`uint160`, not `uint256`.** The swap signature's `sqrtPriceLimitX96` is `uint160`. Encode it as `uint256` and `cast` silently produces a different selector; the router reverts in ~152 gas with empty data.
2. **Pool currency ordering.** currency0 = `0x3b05…` (numerically smaller). Swap params must match or you get `PoolNotInitialized`.
3. **Price limits can't be zero.** Buy → `4295128740` (MIN+1); sell → `1461446703485210103287273052203988822378723970341` (MAX−1).
4. **Settlement before 21 s reverts** with `SettlementWindowOpen(settleAfter, now)` — by design.
5. **A poke before manipulation.** The TWAP attributes the time since the last poke to the price observed at the next update. If you're testing manipulation resistance in a fork test, poke before the shoves or the elapsed time lands on the shoved price (that's oracle semantics, not a bug).
6. **Dust swaps revert** (`SwapTooSmall`) once bond = 20 bps of amountIn rounds to zero — amounts below 500 wei of input.

# Markout — Live Demo Runbook

The pool that pays LPs when the price stays — and pays traders back when it doesn't. Everything below runs the demo end-to-end against the canonical Sepolia v4 deployment, verifies each step, and fixes the known traps. All commands are copy-pasteable on the current ABI.

## Prerequisites

```bash
source .env   # ACC3_PRIV_KEY (operator 0xFeAf…690A), ETHERSCAN_API_KEY
export SEP=https://ethereum-sepolia-rpc.publicnode.com
```

Operator EOA holds faucet tokens and has approved the router. Addresses in README.

## Constants

```bash
HOOK=0x1e9A034b21aB19D00556b429C281f9B29d8BB0Cc
ROUTER=0xF06737dCbA252D276deCC0f6F0f2102AD20c7535
PM=0xE03A1074c86CFeDd5C142C4F04F1a1536e203543   # canonical PoolManager
T0=0x41a9c2D06770375A41b94aBC94Bcf0CD14320060   # MDB (currency0)
T1=0xae0FE2707a76Ec31aB64Dc29557BdBEe9f1a5F5A   # MDA (currency1)
K="(0x41a9c2d06770375a41b94abc94bcf0cd14320060,0xae0fe2707a76ec31ab64dc29557bdbee9f1a5f5a,300,60,0x1e9a034b21ab19d00556b429c281f9b29d8bb0cc)"
POOL_ID=0xa6a2c65eeeb6c7d5ada5a00cb42c9b2831795a171331e3c186c8eab9e387937f
MAX=0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff
DL=$(($(date +%s)+3600))
```

Note the `uint160` in the swap signature — see traps. The router signature is
`swap(key, params, limit, deadline)` where `limit` = min-out for exact-in and
max-total-input (bond included) for exact-out.

## Run 0 — faucet (any wallet)

```bash
cast send $T0 "mint(address,uint256)" <your-address> 100000000000000000000 \
  --private-key <any-key> --rpc-url $SEP
cast send $T1 "mint(address,uint256)" <your-address> 100000000000000000000 \
  --private-key <any-key> --rpc-url $SEP
# capped: 100_000 per wallet total, 10_000_000 supply, mints to $PM rejected
```

## Run 1 — organic flow → REFUND (paid at settle)

The 24 s window ≈ two 12 s blocks: a full 1:1 reversion landing **one block
later** already sits at the 50% frontier and refunds. To land the reversion in
the next block, pre-sign both swaps and publish back-to-back:

```bash
# approve once
cast send $T0 "approve(address,uint256)" $ROUTER $MAX --private-key $ACC3_PRIV_KEY --rpc-url $SEP
cast send $T1 "approve(address,uint256)" $ROUTER $MAX --private-key $ACC3_PRIV_KEY --rpc-url $SEP

N=$(cast nonce 0xFeAf5C921996FC53f4DEf35e181E766e6D74690A --rpc-url $SEP)
RAW1=$(cast calldata "swap((address,address,uint24,int24,address),(bool,int256,uint160),uint256,uint256)" \
  "$K" "(true,-1000000000000000000,4295128740)" 0 $DL)
RAW2=$(cast calldata "swap((address,address,uint24,int24,address),(bool,int256,uint160),uint256,uint256)" \
  "$K" "(false,-1000000000000000000,1461446703485210103287273052203988822378723970340)" 0 $DL)
TX1=$(cast mktx --gas-limit 2000000 --nonce $N     --private-key $ACC3_PRIV_KEY --rpc-url $SEP $ROUTER $RAW1)
TX2=$(cast mktx --gas-limit 2000000 --nonce $((N+1)) --private-key $ACC3_PRIV_KEY --rpc-url $SEP $ROUTER $RAW2)
cast publish --rpc-url $SEP $TX1 >/dev/null && cast publish --rpc-url $SEP $TX2 >/dev/null
```

Grab the first trade id from the buy receipt's `SwapBonded` topic1, wait out
the window, then anyone settles. The gate is chain time — `settle` reverts
`SettlementWindowOpen` until `block.timestamp >= trade.settleAfter` — so a
30 s wall sleep then retry-on-revert is fine:

```bash
BUY=<buy-tx-hash>
TRADE1=$(cast receipt $BUY --rpc-url $SEP --json | python3 -c "
import json,sys
for l in json.load(sys.stdin)['logs']:
    if l['address'].lower()=='$HOOK'.lower(): print(l['topics'][1]); break")
sleep 30
cast send $HOOK "settle(bytes32)" $TRADE1 --private-key $ACC3_PRIV_KEY --rpc-url $SEP
```

**Expected:** one transaction containing `Settled(outcome=1 Refunded)` AND
`RefundClaimed` — the live premium (bps × realized input, e.g. ~0.002 MDB for a
1 MDB swap at 20 bps genesis) is delivered to the trader **at settlement**. No claim
transaction exists on this path. Net round-trip cost ≈ the 3 bps swap fees.

If the reversion landed ≥2 blocks late (check block timestamps: Δ > 18 s),
residual exceeds 50% and the trade donates — that is the oracle working, not
a bug. Retry the pair; next-block landings are the common case with
back-to-back publishes.

## Run 2 — toxic flow → DONATE (single-shot, unreversed)

```bash
cast send $ROUTER "swap((address,address,uint24,int24,address),(bool,int256,uint160),uint256,uint256)" \
  "$K" "(true,-1000000000000000000,4295128740)" 0 $DL \
  --private-key $ACC3_PRIV_KEY --rpc-url $SEP
# wait ≥ 24 s, settle that trade id (SwapBonded topic1 of this tx)
cast send $HOOK "flushDonation(bytes32)" $POOL_ID --private-key $ACC3_PRIV_KEY --rpc-url $SEP
```

**Expected:** `Settled(outcome=3 Donated)`, escrow deferred into the pending
bucket, then `flushDonation` moves it into the pool for in-range LPs (a
`Donate` event on the canonical PoolManager).

## Run 3 — generic router (no Markout allowlist)

The bond rides the swap caller's own PoolManager delta, so **any** v4 router
works. From a contract (or an integrator's router): call
`manager.swap(key, params, hookData)` inside `unlock` and settle your own
delta — it already includes the bond. There is no `settleFor(hook)` step, no
allowlist, no initializeRouter.

## Run 4 — exact-out with max input

```bash
# output 0.1 MDB, cap total input (amountIn + bond) at 0.2 MDA
cast send $ROUTER "swap((address,address,uint24,int24,address),(bool,int256,uint160),uint256,uint256)" \
  "$K" "(true,100000000000000000,4295128740)" 200000000000000000 $DL \
  --private-key $ACC3_PRIV_KEY --rpc-url $SEP
```

Reverts `TooMuchIn(amountIn, cap)` when the realized input (bond included)
exceeds the cap.

## Hands-free mode

`script/keeper.sh` pokes the accumulator, settles due trades, retry-claims
failed refund deliveries, and flushes donations:

```bash
RPC=$SEP PK=$ACC3_PRIV_KEY ./script/keeper.sh
```

## Verification cheatsheet

```bash
# Outcomes: 0 open, 1 refunded, 2 refund-pending (delivery failed), 3 donated
cast logs "Settled(bytes32,uint8,int24,uint256)" --address $HOOK \
  --from-block $(( $(cast block-number --rpc-url $SEP) - 300 )) --json --rpc-url $SEP

# Refunds paid at settle or claimed later
cast logs "RefundClaimed(bytes32,address,uint256)" --address $HOOK \
  --from-block $(( $(cast block-number --rpc-url $SEP) - 300 )) --json --rpc-url $SEP

# Escrow + strict liability accounting (hook balance must cover, may exceed)
cast call $T0 "balanceOf(address)(uint256)" $HOOK --rpc-url $SEP
cast call $HOOK "escrowLiability(address)(uint256)" $T0 --rpc-url $SEP

# Pending LP donations
cast call $HOOK "pendingDonation(bytes32,uint8)(uint256)" $POOL_ID 0 --rpc-url $SEP
```

## Traps (each one cost real time — read before hacking)

1. **`uint160`, not `uint256`.** `sqrtPriceLimitX96` is `uint160`; encode it
   as `uint256` and `cast` silently builds a different selector.
2. **Block-time geometry.** The window is 24 s and Sepolia blocks are 12 s:
   a 1:1 reversion refunds iff it lands ≤ 18 s after the trade (next block =
   exactly the 50% frontier). Send swap pairs with pre-signed back-to-back
   publishes (`cast mktx --gas-limit 2000000` + explicit nonces) — sequential
   `cast send` calls land 2-3 blocks apart, and under-set mktx gas reverts
   OutOfGas.
3. **Pool currency ordering.** currency0 = `0x41a9…` (MDB — numerically smaller this cut).
4. **Price limits can't be zero.** Buy → `4295128740` (MIN+1); sell →
   `1461446703485210103287273052203988822378723970340` (MAX−1).
5. **Settlement before 24 s reverts** `SettlementWindowOpen` — by design.
6. **Dust swaps revert** (`SwapTooSmall`) once the live premium (min 5 bps)
   rounds to zero.
7. **`cast send` takes `0xfff…f`, not `max`.**


## Run 5 — batch lane: one epoch, one price

```bash
# approve hook custody, then pre-sign BOTH orders back-to-back so they land
# in the SAME 24 s epoch (sequential cast sends can straddle the boundary)
cast send $T0 "approve(address,uint256)" $HOOK 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff --private-key $ACC3_PRIV_KEY --rpc-url $SEP
cast send $T1 "approve(address,uint256)" $HOOK 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff --private-key $ACC3_PRIV_KEY --rpc-url $SEP
N=$(cast nonce $(cast wallet address $ACC3_PRIV_KEY) --rpc-url $SEP)
RAWA=$(cast mktx --gas-limit 300000 --nonce $N     --private-key $ACC3_PRIV_KEY --rpc-url $SEP --gas-price 3000000000 $HOOK "placeBatchOrder((address,address,uint24,int24,address),bool,uint256)" "$K" true  500000000000000000)
RAWB=$(cast mktx --gas-limit 300000 --nonce $((N+1)) --private-key $ACC3_PRIV_KEY --rpc-url $SEP --gas-price 3000000000 $HOOK "placeBatchOrder((address,address,uint24,int24,address),bool,uint256)" "$K" false 500000000000000000)
cast publish --rpc-url $SEP $RAWA >/dev/null && cast publish --rpc-url $SEP $RAWB >/dev/null
EPOCH=$(cast call $HOOK "epochOf(uint256)(uint256)" $(cast block latest --rpc-url $SEP -f timestamp) --rpc-url $SEP | awk '{print $1}')
sleep 30
cast send $HOOK "clearBatch((address,address,uint24,int24,address),uint256)" "$K" $((EPOCH)) --gas-limit 3000000 --private-key $ACC3_PRIV_KEY --rpc-url $SEP
```

**Expected:** `BatchCleared` with one `buyRateX96` and one `sellRateX96` —
every order on a side filled at the same price, the epoch TWAP clamped by
realized execution. `settle`-style gas note: pass an explicit `--gas-limit`;
the inline LP credit inside settle is an external self-call that a bare
estimate can starve (the permissionless flush covers it either way).

## Batch traps

1. **Epochs are 24 s and cast sends are slow** — two sequential sends can
   straddle a boundary. Pre-sign both orders with adjacent nonces.
2. **Value-pair the opposing size at the live price** or the epoch leaves a
   larger residual swap (which simply pays the premium like any spot swap).
3. **A lone order is a one-epoch TWAP** — not an auction. That is the
   product, stated.

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
HOOK=0x027C6cfD540f0446641846cd004b41561EEd70cC
ROUTER=0x41Fd0B2B581C5F59d468D272dbfcc26e595383CF
PM=0xE03A1074c86CFeDd5C142C4F04F1a1536e203543   # canonical PoolManager
T0=0x7B0B6aF2271Cb2f7500365f5a80dB18F9666c315   # MDA
T1=0xf3df97cf05D6eFc92cF211440381586b8B86eD76   # MDB
K="(0x7b0b6af2271cb2f7500365f5a80db18f9666c315,0xf3df97cf05d6efc92cf211440381586b8b86ed76,300,60,0x027c6cfd540f0446641846cd004b41561eed70cc)"
POOL_ID=0x9e96a56f2809fdcbfc05649349d50d3faad51f4b5da6cdb14ce58f602324ed1c
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
the window, then anyone settles:

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
`RefundClaimed` — the bond (20 bps of realized input, e.g. 0.001996 MDA for a
1 MDA swap) is delivered to the trader **at settlement**. No claim
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
3. **Pool currency ordering.** currency0 = `0x7B0B…` (numerically smaller).
4. **Price limits can't be zero.** Buy → `4295128740` (MIN+1); sell →
   `1461446703485210103287273052203988822378723970340` (MAX−1).
5. **Settlement before 24 s reverts** `SettlementWindowOpen` — by design.
6. **Dust swaps revert** (`SwapTooSmall`) once the 20 bps bond rounds to
   zero — inputs below 500 wei.
7. **`cast send` takes `0xfff…f`, not `max`.**

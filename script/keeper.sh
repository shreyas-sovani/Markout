#!/usr/bin/env bash
# Markout settlement keeper.
#
# Two permissionless jobs, both callable by anyone — this script just does
# them reliably:
#   1. poke() the hook's TWAP accumulator every loop (oracle cadence)
#   2. settle() every bonded trade whose 21 s window has elapsed
#
# Usage: RPC=... PK=... ./script/keeper.sh
# Requires: cast, python3. Tune POKE_EVERY for accumulator cadence.

set -euo pipefail

: "${RPC:?set RPC}"
: "${PK:?set PK}"

HOOK=0xF51b4DD1e87D786fE7F3dFAAD29b754F11CdC0c0
POOL_ID=0x$(cast keccak "$(cast abi-encode "f((address,address,uint24,int24,address))" \
  "(0x3b05a2ff8351ca6d8782e892a55e616a7f41e6a8,0x94e7f1324d87ba28d8fc556bd5c9be9e598680c0,300,60,0xf51b4dd1e87d786fe7f3dfaad29b754f11cdc0c0)")")
SETTLE_AFTER=21
LOOP_SECS=15
FROM_BLOCK=$(( $(cast block-number --rpc-url "$RPC") - 200 ))

seen=" "

log() { echo "[keeper $(date +%H:%M:%S)] $*"; }

while true; do
  # 1. Oracle cadence.
  cast send "$HOOK" "poke(bytes32)" "$POOL_ID" \
    --rpc-url "$RPC" --private-key "$PK" --gas-limit 120000 >/dev/null 2>&1 || true

  # 2. Settle due trades.
  now=$(cast block-timestamp "$(cast block-number --rpc-url "$RPC")" --rpc-url "$RPC" 2>/dev/null || echo 0)
  now=$(( now == 0 ? $(date +%s) : now ))

  while read -r txhash block trade_id; do
    [[ " $seen " == *" $trade_id "* ]] && continue
    seen="$seen $trade_id "
    ts=$(cast block-timestamp "$block" --rpc-url "$RPC")
    if (( now - ts >= SETTLE_AFTER )); then
      log "settling ${trade_id:0:18}… (bonded $((now - ts))s ago, tx ${txhash:0:12}…)"
      cast send "$HOOK" "settle(bytes32)" "$trade_id" \
        --rpc-url "$RPC" --private-key "$PK" >/dev/null && log "settled ${trade_id:0:18}…"
    fi
  done < <(cast logs "SwapBonded(bytes32,address,uint160,uint160,uint256)" \
      --address "$HOOK" --from-block "$FROM_BLOCK" --to-block latest --json --rpc-url "$RPC" 2>/dev/null | \
    python3 -c "
import json,sys
try:
    for l in json.load(sys.stdin):
        print(l['transactionHash'], int(l['blockNumber'],16), l['topics'][1])
except Exception:
    pass
")

  sleep "$LOOP_SECS"
done

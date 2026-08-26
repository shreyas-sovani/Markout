#!/usr/bin/env bash
# Markout settlement keeper.
#
# Permissionless jobs, all callable by anyone — this script just does them
# reliably:
#   1. poke() the hook's previous-tick accumulator every loop (oracle cadence)
#   2. settle() every bonded trade whose 21 s window has elapsed
#   3. claimRefund() settled-but-unclaimed refunds (pull-based; anyone may call)
#   4. flushDonation() accumulated donations into the pool
#
# Usage: RPC=... PK=... ./script/keeper.sh
# Requires: cast, python3. Tune LOOP_SECS for accumulator cadence.

set -euo pipefail

: "${RPC:?set RPC}"
: "${PK:?set PK}"

HOOK=0xAe5A786094a36475EF619956bb6F1C6089Def0c0
POOL_ID=0x$(cast keccak "$(cast abi-encode "f((address,address,uint24,int24,address))" \
  "(0x333acc2e37a1a1bc7ef27362eb86bac9a44b2d60,0xcf2c78dc09ad87c61d179e36a42adcc208eb8b73,300,60,0xae5a786094a36475ef619956bb6f1c6089def0c0)")")
SETTLE_AFTER=21
LOOP_SECS=15
FROM_BLOCK=$(( $(cast block-number --rpc-url "$RPC") - 200 ))

seen=" "

log() { echo "[keeper $(date +%H:%M:%S)] $*"; }

while true; do
  # 1. Oracle cadence.
  cast send "$HOOK" "poke(bytes32)" "$POOL_ID" \
    --rpc-url "$RPC" --private-key "$PK" --gas-limit 200000 >/dev/null 2>&1 || true

  # 2-3. Settle due trades and claim their refunds.
  now=$(cast block-timestamp "$(cast block-number --rpc-url "$RPC")" --rpc-url "$RPC" 2>/dev/null || echo 0)
  now=$(( now == 0 ? $(date +%s) : now ))

  while read -r txhash block trade_id; do
    [[ " $seen " == *" $trade_id "* ]] && continue
    seen="$seen $trade_id "
    ts=$(cast block-timestamp "$block" --rpc-url "$RPC")
    if (( now - ts >= SETTLE_AFTER )); then
      log "settling ${trade_id:0:18}… (bonded $((now - ts))s ago, tx ${txhash:0:12}…)"
      if cast send "$HOOK" "settle(bytes32)" "$trade_id" \
        --rpc-url "$RPC" --private-key "$PK" >/dev/null 2>&1; then
        log "settled ${trade_id:0:18}…"
        # Pull-based refund: delivered to the recorded trader; anyone may call.
        if cast send "$HOOK" "claimRefund(bytes32)" "$trade_id" \
          --rpc-url "$RPC" --private-key "$PK" >/dev/null 2>&1; then
          log "refunded ${trade_id:0:18}…"
        fi
      fi
    fi
  done < <(cast logs "SwapBonded(bytes32,address,int24,int24,uint256)" \
      --address "$HOOK" --from-block "$FROM_BLOCK" --to-block latest --json --rpc-url "$RPC" 2>/dev/null | \
    python3 -c "
import json,sys
try:
    for l in json.load(sys.stdin):
        print(l['transactionHash'], int(l['blockNumber'],16), l['topics'][1])
except Exception:
    pass
")

  # 4. Flush accumulated LP donations (NothingToFlush is skipped silently).
  cast send "$HOOK" "flushDonation(bytes32)" "$POOL_ID" \
    --rpc-url "$RPC" --private-key "$PK" >/dev/null 2>&1 || true

  sleep "$LOOP_SECS"
done

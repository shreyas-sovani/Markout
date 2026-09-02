# AGENTS.md — script/

## Ownership

Deployment entry point and settlement keeper for the Markout stack.

## Purpose

- `Deploy.Sepolia.s.sol` — deploys the stack against the **canonical Sepolia v4 deployment**: two capped `FaucetToken`s (no blacklist, hard supply cap, per-wallet mint cap, mints to the PoolManager rejected), CREATE2-mined `MarkoutHook` (flags `0x30CC` = init + swap + both delta-return flags, mined against the canonical CREATE2 deployer `0x4e59b44847b379578588920cA78FbF26c0B4956C`), one-arg convenience `MarkoutRouter` (no lock — the bond rides the swap delta), pool initialization + full-range liquidity (10e18) seeded through the **officially deployed canonical PositionManager** (`0x429ba70129df741B2Ca2a85BC3A2a3328e5c09b4`) using Permit2 allowances, then an operator demo float.
- `keeper.sh` — optional automation: pokes the previous-tick accumulator, settles due trades, pull-claims their refunds, and flushes LP donations. All actions permissionless; correctness never depends on the keeper.

## What This Controls

Wrong addresses/args = broken pool wiring. The `require(address(hook) == predictedHook)` guard fails safely if the mined address doesn't land. The canonical-PM constant must match `0xE03A1074c86CFeDd5C142C4F04F1a1536e203543` — a wrong value deploys against nothing.

## Connections

- Depends on: all of `src/`, `test/shared/HookMiner.sol`, canonical Sepolia v4 + Permit2 (`0x000000000022D473030F116dDEE9F6B43aC78BA3`), `.env` (`ACC3_PRIV_KEY`).
- Depended on by: README deployment section, `demo.md`, `frontend/` address constants.
- External: Sepolia RPC.

## Current State

Executed successfully 2026-09-02 (coverage-compatible refactor) via `--broadcast --slow` in ONE pass: tokens `0x41a9c2…`(MDB, c0)/`0xae0FE2…`(MDA, c1), hook `0x1e9A03…` (immutable `MarkoutBatchRouter` child `0xC9aaB8…`), router `0xF06737…`; all five contracts Etherscan-verified; pool id `0xa6a2c65eeeb6c7d5ada5a00cb42c9b2831795a171331e3c186c8eab9e387937f` seeded 10e18 full-range through the official PositionManager. Proof pack lives in `frontend/lib/contracts.ts` `PROOFS` (refund settle `0xe354716c…`, donate+credit `0xda709887…`, batch clear `0xdb3a18f6…`). All earlier deployments stale. This honesty cut did not redeploy.

## Decision Log

### 2026-09-02 — Current State pool id corrected (no redeploy)
- **Change**: Current State pool id `0xa40dab…` (stale 09-01) → live `0xa6a2c6…`. No script change.
- **Reasoning**: agents reading this file would talk to the wrong pool.
- **Rejected alternative(s)**: another broadcast (src === bytecode already holds).
- **Task/session**: critique implementation after two-lane ship.


### 2026-09-02 — coverage-driven redeploy
- **Change**: `forge coverage` force-disables optimizer/via_ir; `--ir-minimum` (its suggested workaround) stack-overflowed `clearBatch`. Refactored `clearBatch` into three internal helpers (netting / uniform rates / payout) — behavior identical, suites green, hook size 24,226. Redeployed + reverified + regenerated all three proofs. New gotcha recorded: when pairing a batch sell at the live price, read the SLOT0 base slot for sqrt — reading the liquidity slot (+3) silently produces a ~0 sell amount and the order reverts `SwapTooSmall`.
- **Task/session**: coverage fix, 2026-09-02.


### 2026-09-01 — two-lane deploy: size crisis + gas footgun
- **Change**: redeployed the two-lane hook. Two new war stories: (1) **EIP-170** — at `optimizer_runs = 44444444` the two-lane hook compiled to 26,825 bytes > 24,576 and forge REFUSED to send ("Unknown2 above the contract size limit") while still printing simulated addresses — always `cast code` the printed addresses before trusting a "successful" run. Fix: `optimizer_runs = 20000` (hook 23,970; 400/100k break v4-core's `Pool.swap` stack). (2) **settle gas** — the inline LP credit is an external self-call inside try/catch; a bare `cast send` estimate can underfund it so the catch silently defers to the pending bucket. The permissionless flush covers the value either way, but proof runs pass `--gas-limit 3000000` explicitly. Also: batch proof orders must be PRE-SIGNED with adjacent nonces — sequential `cast send`s straddle 24 s epoch boundaries.
- **Reasoning**: `--slow` (sequential sends) now works end-to-end for the 7702-delegated operator; no manual completion needed this time.
- **Task/session**: two-lane redeploy, 2026-09-01.


### 2026-08-31 — explicit operator + delegated-EOA deploy war stories
- **Change**: mints/position-owner now use `address operator = vm.addr(pk)` explicitly instead of `msg.sender`. The broadcast was completed MANUALLY after two environment failures: (1) newer forge routes `msg.sender` to `DefaultSender (0x1804…)` during simulation while Permit2 pulls from the broadcaster — the seed reverted `TRANSFER_FROM_FAILED` until recipients were made explicit; (2) the operator EOA carries an **EIP-7702 delegation** (`cast code` shows `0xef0100…`), so publicnode/ethpandaops reject forge's concurrent nonce fan-out with `gapped-nonce tx from delegated accounts` — sequential single txs (or `--slow`) are required. Tokens+hook+router landed via partial forge runs; the remainder (mints, ERC20+Permit2 approvals, PositionManager seed, operator float) ran as sequential `cast send`s, each receipt verified status 0x1.
- **Reasoning**: forge `--resume` kept re-syncing nonces against the delegated account and aborting; manual completion was deterministic and each step proved itself on-chain before the next.
- **Rejected alternative(s)**: `--slow` alone (still re-simulated and aborted on nonce resync); deactivating the 7702 delegation (type-4 authorization, not signable cleanly from CLI).
- **Task/session**: redeploy directive, 2026-08-31.

### 2026-08-27 — overhaul deploy
- **Change**: redeployed the allowlist-free cut against the canonical PM (hook flags now `0x30CC` incl. both delta-return flags; one-arg router; no `initializeRouter` — the tx.origin deployer hack died with it). Proof pack regenerated with a retry loop that pre-signs buy+reverse and republishes until the reversion lands ≤ 18 s after the buy (next-block landed on attempt 1: Δ = 12 s, refunded at settle).
- **Reasoning**: constants must match the live deployment; proofs must be our own transactions; 12 s blocks make back-to-back `cast send` pairs land 2-3 blocks apart, so pre-signed publishes + a landing-time retry loop are required for the 1:1 refund proof.
- **Task/session**: overhaul directive, 2026-08-27.

### 2026-08-25 — canonical deployment, official periphery
- **Change**: deploy retargeted from a private PoolManager to canonical Sepolia PM `0xE03A…3543`; PositionManager/PositionDescriptor no longer self-deployed — seeding goes through the official canonical PositionManager `0x429ba7…09b4` with Permit2 allowances (MINT_POSITION + SETTLE_PAIR actions). Demo tokens replaced by capped `FaucetToken`s.
- **Reasoning**: judging rewards canonical-integration truth; also, our compile profile (via_ir + 44M runs) pushes PositionDescriptor/PositionManager past the 24,576-byte EIP-170 limit, so self-deploying canonical periphery is impossible without a second compiler profile.
- **Rejected alternative(s)**: deploying our own PositionManager (size limit + less canonical); a size-optimized second forge profile (via_ir is required for v4-core's Pool.swap in this repo's pin); seeding via `PoolModifyLiquidityTest` (test contract, not canonical periphery).
- **Task/session**: prize hardening, 2026-08-25.

### 2026-08-25 — hook deployer via tx.origin under CREATE2
- **Change**: `MarkoutHook` records `deployer = msg.sender == CREATE2_DEPLOYER ? tx.origin : msg.sender` so the deployer-only `initializeRouter` works when the hook is CREATE2-mined (msg.sender is the proxy).
- **Reasoning**: without this, `initializeRouter` from the broadcasting EOA reverts `NotTrustedRouter` — observed live on the first deploy attempt.
- **Task/session**: prize hardening, 2026-08-25.

### 2026-08-23 — keeper script
- **Change**: added `script/keeper.sh` — loop that pokes the hook oracle and settles due trades parsed from `SwapBonded` logs. Extended 2026-08-25 with `claimRefund` (pull refunds) and `flushDonation`.
- **Reasoning**: settlement, claiming, poking, and flushing are permissionless; a dumb loop is enough automation. No contracts depend on it.
- **Rejected alternative(s)**: an on-chain auto-settle mechanism — adds surface for zero correctness gain.

### 2026-08-18 — initial deployment script
- **Change**: `Deploy.Sepolia.s.sol` written and executed (hook CREATE2-mined; `HookMiner.find` supplies the salt — a vanity fixed salt lands the hook at an address without permission bits and the BaseHook constructor guard reverts, which the first attempt hit).
- **Task/session**: deployment session.

## Known Gotchas

- Hook must deploy with the **mined salt from HookMiner.find**, never a vanity salt. Flags are `0x30CC` (init + swap + beforeSwapReturnDelta + afterSwapReturnDelta).
- `address(this)` is banned inside broadcast scripts (forge guard) — and `msg.sender` is now ALSO unsafe (forge sim routes it to DefaultSender): use `vm.addr(pk)` explicitly.
- The operator EOA (`0xFeAf…690A`) is **EIP-7702-delegated** — forge's concurrent broadcast sends fail with `gapped-nonce tx from delegated accounts`. Send sequentially (one `cast send` at a time, wait for receipt).
- The old periphery submodule is checked out at `4d85e04` (2025-01-20, era-matched to v4-core v4.0.0); its `test/shared/HookMiner.sol` was deleted upstream, so HookMiner is vendored at `test/shared/HookMiner.sol`.
- Refund-demo pairs: pre-sign both txs with `cast mktx --gas-limit 2000000` + explicit nonces and publish back-to-back (1:1 size; next-block = the exact 50% frontier). `cast send` twice lands 2-3 blocks apart, and an under-set mktx gas limit reverts OutOfGas.
- `.env` keys: `ACC3_PRIV_KEY=0x…`, `ETHERSCAN_API_KEY` (no spaces around `=` — a stray space makes zsh drop the var); gitignored. `cast send` takes `0xfff…f`, not `max`. `cast max-uint160` doesn't exist: uint160 max is `0xff…f` ×40.

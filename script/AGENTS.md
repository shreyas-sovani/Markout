# AGENTS.md — script/

## Ownership

Deployment entry point and settlement keeper for the Markout stack.

## Purpose

- `Deploy.Sepolia.s.sol` — deploys the hardened stack against the **canonical Sepolia v4 deployment**: two capped `FaucetToken`s (no blacklist, hard supply cap, per-wallet mint cap, mints to the PoolManager rejected), CREATE2-mined `MarkoutHook` (flags `0x30C0` = beforeInitialize|afterInitialize|beforeSwap|afterSwap, mined against the canonical CREATE2 deployer `0x4e59b44847b379578588920cA78FbF26c0B4956C`), `MarkoutRouter` permanently locked into the hook via `initializeRouter`, pool initialization + full-range liquidity (10e18) seeded through the **officially deployed canonical PositionManager** (`0x429ba70129df741B2Ca2a85BC3A2a3328e5c09b4`) using Permit2 allowances, then an operator demo float.
- `keeper.sh` — optional automation: pokes the previous-tick accumulator, settles due trades, pull-claims their refunds, and flushes LP donations. All actions permissionless; correctness never depends on the keeper.

## What This Controls

Wrong addresses/args = broken pool wiring. The `require(address(hook) == predictedHook)` guard fails safely if the mined address doesn't land. The canonical-PM constant must match `0xE03A1074c86CFeDd5C142C4F04F1a1536e203543` — a wrong value deploys against nothing.

## Connections

- Depends on: all of `src/`, `test/shared/HookMiner.sol`, canonical Sepolia v4 + Permit2 (`0x000000000022D473030F116dDEE9F6B43aC78BA3`), `.env` (`ACC3_PRIV_KEY`).
- Depended on by: README deployment section, `demo.md`, `frontend/` address constants.
- External: Sepolia RPC.

## Current State

Executed successfully 2026-08-25 (hardening deploy): tokens `0x333ACc…`/`0xcf2C78…`, hook `0xAe5A78…`, router `0x378f4E…`, all Etherscan-verified; fresh Refund/Donate proof pack recorded. `keeper.sh` updated for pull-claims + donation flush.

## Decision Log

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

- Hook must deploy with the **mined salt from HookMiner.find**, never a vanity salt. Flags are now `0x30C0`, not the old `0xC0`.
- `address(this)` is banned inside broadcast scripts (forge guard) — use `msg.sender`.
- The old periphery submodule is checked out at `4d85e04` (2025-01-20, era-matched to v4-core v4.0.0); its `test/shared/HookMiner.sol` was deleted upstream, so HookMiner is vendored at `test/shared/HookMiner.sol`.
- Same-block swap pairs for refund demos: pre-sign both txs with `cast mktx --gas-limit 2000000` + explicit nonces and publish back-to-back — `cast send` twice lands them a block apart on Sepolia (12 s), and an under-set mktx gas limit reverts OutOfGas.
- Deterministic live refund without same-block luck: reverse with a 2.2× overshoot so the window average crosses `pre` even when the reversion lands one block late.
- `.env` keys: `ACC3_PRIV_KEY=0x…`, `ETHERSCAN_API_KEY`; gitignored. `cast send` takes `0xfff…f`, not `max`.

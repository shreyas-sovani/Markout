# AGENTS.md — script/

## Ownership

Deployment entry point and settlement keeper for the Markout stack.

## Purpose

- `Deploy.Sepolia.s.sol` — full Sepolia stack: MockERC20 pair, PoolManager, PoolModifyLiquidityTest (LP helper), CREATE2-mined MarkoutHook (permission bits via HookMiner against the canonical CREATE2 deployer `0x4e59b44847b379578588920cA78FbF26c0B4956C`), MarkoutRouter, pool init at 1:1 (3 bps fee, tick spacing 60), full-range liquidity 10e18/side seeded from the deploying EOA.
- `keeper.sh` — optional automation: pokes the hook's TWAP accumulator every loop and settles every bonded trade whose 21 s window has elapsed. Both actions are permissionless; correctness never depends on the keeper.

## What This Controls

Wrong addresses/args in the deploy script = broken pool wiring. The `require(address(hook) == predictedHook)` guard fails safely if the mined address doesn't land.

## Connections

- Depends on: all of `src/`, `test/mocks/MockERC20.sol`, v4-core test helpers, HookMiner (v4-periphery test), `.env` (`ACC3_PRIV_KEY`).
- Depended on by: README deployment section, `demo.md`.
- External: Sepolia RPC.

## Current State

Executed successfully 2026-08-23; deployed addresses in README, all Etherscan-verified. `keeper.sh` functional.

## Decision Log

### 2026-08-23 — keeper script
- **Change**: added `script/keeper.sh` — loop that pokes the hook oracle and settles due trades parsed from `SwapBonded` logs.
- **Reasoning**: settlement and poking are permissionless; a dumb loop is enough automation. No contracts depend on it.
- **Rejected alternative(s)**: an on-chain auto-settle mechanism — adds surface for zero correctness gain.

### 2026-08-18 — initial deployment script
- **Change**: `Deploy.Sepolia.s.sol` written and executed (hook CREATE2-mined; `HookMiner.find` supplies the salt — a vanity fixed salt lands the hook at an address without permission bits and the BaseHook constructor guard reverts, which the first attempt hit).
- **Task/session**: deployment session.

## Known Gotchas

- Hook must deploy with the **mined salt from HookMiner.find**, never a vanity salt.
- The EOA nonce doesn't matter for this script (hook is CREATE2); reruns are safe.
- `.env` keys: `ACC3_PRIV_KEY=0x…`, `ETHERSCAN_API_KEY`; gitignored.

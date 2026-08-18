# AGENTS.md — script/

## Ownership

Deployment entry points for the Markout stack: one script per chain.

## Purpose

- `Deploy.Sepolia.s.sol` — full Sepolia stack: MockERC20 pair, PoolManager, PoolModifyLiquidityTest (LP helper), nonce-predicted MarkoutExecutor (CREATE1), CREATE2-mined MarkoutHook (permission bits via HookMiner against the canonical CREATE2 deployer `0x4e59b44847b379578588920cA78FbF26c0B4956C`), MarkoutRouter, pool init at 1:1 (3 bps fee, tick spacing 60), full-range liquidity 10e18/side seeded from the deploying EOA.
- `Deploy.Lasna.s.sol` — MarkoutReactive deployment (constructor subscribes to `SwapBonded` + `Cron1`). See its header for the critical `forge create` deployment requirement.

## What This Controls

Wrong addresses/args here = broken cross-chain wiring (RSC subscribing to the wrong hook, executor pointing at the wrong hook, hook settling through the wrong executor). The `require` address-prediction guards fail safely if the EOA nonce moves.

## Connections

- Depends on: all of `src/`, `test/mocks/MockERC20.sol`, v4-core test helpers, HookMiner (v4-periphery test), `.env` (`ACC3_PRIV_KEY`, `SEPOLIA_HOOK`, `SEPOLIA_EXECUTOR`).
- Depended on by: README deployment section; `todo.md` Phases 2–3.
- External: Sepolia RPC, Lasna RPC.

## Current State

Both executed successfully 2026-08-18 (see README address table). Sepolia via `forge script … --broadcast`; Lasna via `forge create` (see gotcha #1).

## Decision Log

### 2026-08-18 — initial deployment scripts + live deployment
- **Change**: wrote both scripts; deployed to Sepolia + Lasna; funded RSC (0.5 REACT via system `depositTo`) and executor (0.02 SEP via Sepolia Callback Proxy `depositTo`).
- **Reasoning / rejected alternatives**:
  - Executor CREATE1 at a nonce-predicted address + hook CREATE2-mined — same pattern as `test/Markout.t.sol` setUp. A both-CREATE2 design is impossible while both constructors embed each other's address (genuine fixed-point deadlock).
  - Hook deployed with the **mined salt from HookMiner.find**, not a vanity salt — first broadcast attempt used a fixed `HOOK_SALT` and the hook landed at an address without permission bits, reverting in the BaseHook constructor. Guarded by `require(address(hook) == predictedHook)`.
  - Lasna deploy via `forge create`, not `forge script`: local forge simulation of the Lasna system contract's `subscribe()` always reverts "Failure" because the internal precompile at `0x64` depends on node-side state that an off-node EVM cannot provide. Verified not-a-funding-issue by (a) pre-funding the predicted RSC address twice, (b) a control RSC subscribing to old well-indexed Sepolia WETH events (also "failed" in sim), (c) raw `cast call` of `subscribe` against the node succeeding. `--skip-simulation` on forge script did not skip (forge 1.5.1 still simulated); `forge create --broadcast` executes on-node and worked first try.
  - Sourcify verification of the RSC attempted and failed: `https://sourcify.rnk.dev/` currently returns a TLS `UnrecognisedName` error — server-side outage, retry later.
- **Task/session**: deployment session 2026-08-18 (todo.md Phases 0–4).

## Known Gotchas

- **Never deploy MarkoutReactive via `forge script` on Lasna** — simulation cannot execute the system precompile; use the `forge create` command embedded in `Deploy.Lasna.s.sol`'s header comment.
- Sepolia deploy script's executor address prediction depends on the EOA nonce — if any tx moves the nonce between sim and broadcast, the `require` fires and nothing is sent; just rerun.
- Operator EOA Sepolia balance is low (~0.019 SEP after funding the executor); top up before demo swaps.
- `.env` key was normalized to `ACC3_PRIV_KEY=0x…` (was unprefixed `acc3_priv_key`) for `vm.envUint` compatibility; file is gitignored.

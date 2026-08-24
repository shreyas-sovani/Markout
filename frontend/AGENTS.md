# AGENTS.md — frontend/

## Ownership

The live browser UI for the Markout protocol — the demo surface judges and traders actually touch. Owns nothing on-chain; every transaction it sends targets the immutable Sepolia deployment described in the root README.

## Purpose

One-page Next.js app (App Router, single client page) wired directly to the deployed `MarkoutRouter` + `MarkoutHook`: injected-wallet connect, one-click demo-token mint, approve → swap → 21 s countdown → permissionless settle → explicit REFUND/DONATE verdict, bonded-trade history with outcomes, live pool price/tick read from the PoolManager's `extsload` slot0, LiveProofPack links, and the honest-limitations footer.

## What This Controls

Nothing in the protocol — the UI is read/write over existing contracts. What breaks if it's wrong: judges can't complete the demo flow (approve gating, tradeId capture, settle timing), or see a wrong outcome. Value movement is gated on-chain, not here; a UI bug can confuse but cannot misappropriate funds.

## Connections

- Depends on: `viem` (public client + wallet client), Sepolia RPC (`NEXT_PUBLIC_SEPOLIA_RPC` env override, default publicnode), the deployed contracts in `lib/contracts.ts` (addresses mirror the README table — keep them in sync), `sonner` toasts.
- Depended on by: nothing; entry points are `npm run dev` / `npm run build`.
- External systems: Sepolia (11155111), Etherscan links, `window.ethereum` (injected wallets only — no WalletConnect/Coinbase SDK, no project IDs).

## Current State

Working: `next build` passes (static, ~211 kB first load); the full read pipeline (poolId derivation, slot0 extsload decode, SwapBonded log fetch, trades multicall) and the full tx pipeline (mint → approve → router.swap → settle) were validated against mainnet-Sepolia state on 2026-08-25, including a fresh Refund+Donate proof pair recorded in the README LiveProofPack.

## Decision Log

### 2026-08-25 — viem-only, no wagmi
- **Change**: built initially with wagmi + react-query; replaced both with a ~60-line `lib/wallet.ts` (EIP-1193 `window.ethereum` hook) and `lib/usePoll.ts` after wagmi's connector barrel dragged the Coinbase SDK (`@x402/evm`) into the webpack graph and broke the build with an unresolvable import.
- **Reasoning**: only injected connectors were needed anyway; two fewer dependencies, smaller bundle, full control of polling.
- **Rejected alternative(s)**: installing `@x402/evm` to satisfy the optional dep (bloat); deep-importing `@wagmi/connectors` internals (unsupported).
- **Task/session**: judge-presentation push, 2026-08-25.

### 2026-08-25 — chunked getLogs + viem tuple decoding
- **Change**: history fetch goes through `getLogsChunked` (≤49k-block windows); all `trades()` reads use property access (`t.bondAmount`, `t.settleAfter`, `results[i].outcome`), not index access.
- **Reasoning**: publicnode caps `eth_getLogs` at 50k blocks (a flat 150k range 422s); viem decodes named struct outputs as objects, so `[3]`/`[7]` indexing returned `undefined` — found by running the exact pipeline in `scripts/history-check.mjs` before shipping.
- **Rejected alternative(s)**: narrowing the history window to one chunk (older trades vanish); casting through `unknown[]` and hoping (the bug this fixed).
- **Task/session**: judge-presentation push, 2026-08-25.

### 2026-08-25 — design + token faucet
- **Change**: terminal-ledger aesthetic (near-black green ground, hairline rules, JetBrains Mono, tabular numerals, green=refund / amber=donate) instead of a gradient DEX look; `+100 each` mint button calls the demo tokens' permissionless `mint(address,uint256)` directly.
- **Reasoning**: "markout" is a trading term — the UI should read like a trading terminal, and the one-click faucet removes the biggest judge demo blocker (no tokens). The MockERC20 deployed on Sepolia has no access control on mint; no faucet contract needed.
- **Rejected alternative(s)**: purple-gradient Uniswap clone (generic); a dedicated faucet contract (unnecessary surface).
- **Task/session**: judge-presentation push, 2026-08-25.

## Known Gotchas

- Addresses in `lib/contracts.ts` must be EIP-55 checksummed — viem rejects bad checksums (the README's original hook/PoolManager casing was wrong; corrected everywhere 2026-08-25).
- `sqrtPriceLimitX96` is `uint160`; `MIN_SQRT_PRICE+1` / `MAX_SQRT_PRICE-1` constants live in `lib/contracts.ts`.
- `trades(bytes32)` returns a named struct → viem gives an object with `key` as a nested object. Never index numerically.
- Pool state slot = `keccak256(abi.encodePacked(poolId, bytes32(uint256(6))))`; slot0 packs sqrtPrice (low 160 bits) then int24 tick (sign-extend it). Cross-checked against `lib/v4-core/src/libraries/StateLibrary.sol` and a live call.
- Countdown truth is chain time (`getBlock().timestamp` polled every 3 s), not `Date.now()` — the settle button unlocks on `settleAfter`, matching the hook's guard.
- `scripts/live-check.mjs` and `scripts/history-check.mjs` are plain-node sanity harnesses for the read pipeline; keep them working when contracts.ts changes.
- Demo pool drifted slightly off 1:1 from the live proofs (tick ≈ 180) — expected, not a bug.

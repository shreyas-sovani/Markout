# AGENTS.md — frontend/lib/

## Ownership
Frontend protocol state, injected-wallet access, polling, contract constants, and viem client construction.

## Purpose
Provides the non-visual runtime layer consumed by all three Next.js routes. `markout.tsx` owns shared application/onchain state and actions, `wallet.ts` owns the minimal EIP-1193 connection lifecycle, `contracts.ts` owns deployed addresses/ABIs/client helpers, and `usePoll.ts` owns reusable polling.

## What This Controls
Errors here can prevent wallet connection, submit incorrect transactions, lose receipt-derived trade identity, show stale balances, or read the wrong deployment. These files are functional boundaries and must not be changed as part of visual-only work.

## Connections
- Depends on: viem, Sonner, React, `window.ethereum`, Sepolia RPC endpoints, and deployed contracts encoded in `contracts.ts`.
- Depended on by: `frontend/app/layout.tsx`, all route pages, and frontend components using `useMarkout()`.
- External systems touched: injected EIP-1193 wallets, Sepolia RPCs, canonical PoolManager, Markout hook/router/batch router, PositionManager, Permit2, and Etherscan links.

## Current State
Working against the 2026-09-02 Sepolia deployment. Wallet connection now reuses existing authorization, deduplicates concurrent prompts, performs one post-failure account recovery read, and translates MetaMask error codes/messages before they reach React. Account switching force-prompts only when the permissions API is unsupported; cancellation and pending-request errors are surfaced without retry.

## Decision Log

### 2026-09-02 — contain and recover MetaMask connection failures
- **Change**: added `connectInjectedWallet`, `walletConnectionErrorMessage`, and `shouldFallbackAccountSwitch` in `wallet.ts`; `useWallet.connect` now uses the helper; unsupported permission APIs use an explicit forced account request for account switching, while cancellation/pending errors do not retry; `MarkoutProvider` catches both connect and switch rejection into actionable toasts; added `wallet-connect.test.mjs` covering existing permission, concurrent request deduplication, forced switching, post-error recovery, error translation, and fallback policy.
- **Reasoning**: raw `eth_requestAccounts` rejection previously escaped a `try/finally` with no `catch`, producing a Next runtime overlay. MetaMask documents `-32002` as a pending request that the user must resolve in the extension, so the app must not retry it blindly.
- **Rejected alternative(s)**: replacing the minimal injected-wallet layer with wagmi (previously broke the build through optional Coinbase dependencies), automatically retrying `-32002` (creates more pending requests), and swallowing all errors without guidance.
- **Task/session**: fixing “Failed to connect to MetaMask” runtime error.

## Known Gotchas
MetaMask pending request error `-32002` cannot be cancelled programmatically; instruct the user to open the extension and approve or reject it. Do not remove the in-flight provider deduplication. Keep account and chain listeners registered before requesting access.

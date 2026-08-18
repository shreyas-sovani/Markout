# Markout — The Fair Flow Frontier

A Uniswap v4 hook that protects liquidity providers from MEV and LVR **without delaying trades or trusting external oracles**, settled autonomously by the **Reactive Network**.

Built for the UHI10 Hookathon (Dual-Track: Theme + Reactive Network).

## The idea in one paragraph

Toxic single-shot arbitrage moves an AMM to the global market price and *stays there* — there is no continuation flow to analyze. Organic flow moves the price *away* from the global market, and natural arbitrageurs push it back within seconds. So Markout classifies toxicity by **mean reversion**, not by looking at subsequent swaps in the same pool: every swap fills immediately at 3 bps, but escrows a 20 bps input bond. At a settlement window T (~21 s), a fully on-chain oracle checks the pool price: if it reverted toward the pre-swap price by more than 5 bps, the trade was organic and the bond is **refunded**; if it sustained (or drifted further), the trade was informed price discovery and the bond is **donated to the pool** as a socialized MEV dividend for LPs.

No keepers, no oracles, no delays — settlement timing comes from the Reactive Network's `Cron1` heartbeat event.

## Architecture

```
  Sepolia (11155111)                         Reactive Lasna (5318007)
 ┌──────────────────────────┐               ┌─────────────────────────────┐
 │ PoolManager + MarkoutHook│  SwapBonded   │ MarkoutReactive (RSC)       │
 │  beforeSwap: store P_pre │──────────────▶│  queue trade, age 3 Cron1   │
 │  afterSwap: 20bps bond   │               │  ticks (~21s)               │
 │   escrow + 6909 receipt  │               │        │ emits Callback     │
 │                          │               └────────┼────────────────────┘
 │ MarkoutExecutor          │  settleMarkout(rvm_id, tradeId)             │
 │  ← Callback Proxy        │◀──────────────────────┘ (1M gas, RVM-signed)
 │   → hook.settle(tradeId) │
 │ MarkoutHook.settle:      │
 │   refund trader   ── or ──▶ poolManager.donate() → LPs
 └──────────────────────────┘
```

| Contract | Chain | Role |
| --- | --- | --- |
| `src/MarkoutEngine.sol` | — (pure) | Mean-reversion classifier: `decide(P_pre, P_post, P_T)` in price-space Q128.128, strict >5 bps threshold. |
| `src/MarkoutHook.sol` | Sepolia | Bonds 20 bps of the exact `balanceDelta`-derived `amountIn` (never `slot0`), escrows via `take`, mints an ERC-6909 receipt, emits `SwapBonded`; `settle()` refunds or `donate()`s. |
| `src/MarkoutReactive.sol` | Lasna | Subscribes to `SwapBonded` (Sepolia) + `Cron1` (Lasna system contract); emits settlement `Callback`s after 3 ticks. |
| `src/MarkoutExecutor.sol` | Sepolia | Receives callbacks; `settleMarkout(address rvm_id, bytes32 tradeId)` guarded by RVM-ID injection **and** the Sepolia Callback Proxy sender check. |
| `src/MarkoutRouter.sol` | Sepolia | Reference router: settles the swap, then pays the hook's bond debt via `settleFor`. Integrating routers must do the same. |

## Getting started

```shell
forge build
forge test
```

Test suite (11/11): mean-reversion boundaries, organic refund, toxic donate, exact-out bond precision, dust-swap revert, synthetic Cron1 aging.

Deployment + live demo runbook: see [`todo.md`](./todo.md). Progress log: [`progress.md`](./progress.md).

## Deployed addresses

Deployed 2026-08-18 (see `todo.md` Phase 2–4 and `progress.md`):

| Contract | Chain | Address |
| --- | --- | --- |
| MarkoutHook | Sepolia | [0x1Db65C7eFd46A7D663D05C7Bc61Bb88f116000C0](https://sepolia.etherscan.io/address/0x1db65c7efd46a7d663d05c7bc61bb88f116000c0) |
| MarkoutExecutor | Sepolia | [0x1D054cd08CD007748602B7C116042f4c0534E1dD](https://sepolia.etherscan.io/address/0x1d054cd08cd007748602b7c116042f4c0534e1dd) |
| MarkoutRouter | Sepolia | [0x63634289880D5aB9D74f43Fa7DC196C1F0605989](https://sepolia.etherscan.io/address/0x63634289880d5ab9d74f43fa7dc196c1f0605989) |
| PoolManager | Sepolia | [0x7A1087753d33B928c2FEa8eFaFbC23BdDcb4cc53](https://sepolia.etherscan.io/address/0x7a1087753d33b928c2fea8efafbc23bddcb4cc53) |
| Demo token0 | Sepolia | [0x91C7d1f821B30B76e6E47fE51243B75fb2F5938e](https://sepolia.etherscan.io/address/0x91c7d1f821b30b76e6e47fe51243b75fb2f5938e) |
| Demo token1 | Sepolia | [0x144ABA252550ea7fBE7c487B8d153815097a1F15](https://sepolia.etherscan.io/address/0x144aba252550ea7fbe7c487b8d153815097a1f15) |
| MarkoutReactive | Reactive Lasna | [0x6719F298F544c688999819d13A34E871E723f4d9](https://lasna.reactscan.net/address/0x6719F298F544c688999819d13A34E871E723f4d9) |

The RSC is funded (0.5 REACT via system `depositTo`, tx `0x7c057feb…e48`) and the Sepolia executor is funded (0.02 SEP via Callback Proxy `depositTo`, tx `0xd94f00d9…83c`). Pool initialized at 1:1 with 10e18 full-range liquidity per side (init tx `0x4c4083ec…6b3`).

## LiveProofPack

_To be filled from the live demo runs (todo.md Phase 5):_

- Organic trade: `SwapBonded` → `Callback` → `Settled(Refund)` hashes — _TBD_
- Toxic trade: `SwapBonded` → `Callback` → `Settled(Donate)` hashes — _TBD_
- Reactscan: `Active` status + `Callbacks > 0` — _TBD_

## Disclosures

- The toxicity oracle is **entirely hook-local**: it compares the pool's own `sqrtPriceX96` before the swap, after the swap, and at window T. No Chainlink, no Pyth, no partner oracle.
- Settlement timing depends on the Reactive Network `Cron1` system event (~7 s/block on Reactive Lasna; 3 ticks ≈ 21 s).

## Repository layout

- `src/` — protocol contracts (see `src/AGENTS.md`)
- `test/` — Foundry suite (see `test/AGENTS.md`)
- `docs/prd/markout.md` — product requirements document
- `todo.md` — manual end-to-end runbook
- `progress.md` — build log

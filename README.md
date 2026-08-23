# Markout — The Fair Flow Frontier

A Uniswap v4 hook that makes liquidity sustainable under toxic flow: swaps fill **immediately at 3 bps**, while a **20 bps input bond** is escrowed and settled by a **mean-reversion oracle** ~21 seconds later. If the pool price reverted toward its pre-swap level, the trade was organic and the bond is **refunded**. If the price sustained — the signature of a single-shot arbitrage against the global market — the bond is **donated to LPs** as a socialized MEV dividend.

Built for the UHI10 Hookathon — **Sustainable Liquidity & MEV Protection** track.

## Why mean reversion

Toxic single-shot arbitrage moves an AMM to the global market price and *stays there* — there is no continuation flow to analyze. Organic flow moves the price *away* from the global market and natural arbitrageurs push it back within seconds. So toxicity is measured by **what the price did after the swap**, not by who swapped or what an oracle says:

- **Informed (toxic) flow** — price sustains at the new level; no rational actor arbitrages it back. Bond → LPs.
- **Uninformed (organic) flow** — price reverts toward the pre-swap level as arbitrageurs close the gap. Bond → trader.

## How it works

```
                swap (fills immediately, 3 bps)
  trader ─────────────────────────────────────────▶ Markout pool (Uniswap v4)
    │                                                     │
    │  20 bps input bond escrowed (balanceDelta-derived,  │
    │  never slot0); ERC-6909 receipt minted               │
    │                                                     ▼
    │                            time-weighted price (hook accumulator,
    │                              poked by swaps / anyone / settlement)
    │                                                     │
    │                        T = 21 s elapsed? ── anyone calls settle()
    │                                                     │
    ◀──── bond REFUNDED ◀─── reverted > 5 bps ──┤   └── sustained ──▶ bond DONATED
                                                                      to in-range LPs
```

- **Bond precision** — the bond is exactly 20 bps of the realized `amountIn` taken from the post-swap `balanceDelta`. Works identically for exact-in and exact-out; `slot0` is never used for sizing. Dust swaps (bond would round to 0) revert with `SwapTooSmall`.
- **Mean-reversion oracle** — the hook keeps its own time-weighted tick accumulator per pool (Uniswap-V2-style), advanced on every swap, every permissionless `poke()`, and at settlement. The settlement price P_T is the average tick over the window, so intra-block spot games between pokes are invisible and only genuinely-sustained or genuinely-reverted prices decide the bond. The threshold is a strict 5 bps in price space.
- **Permissionless settlement** — `settle(tradeId)` is callable by **anyone** once the 21 s window closes (`SettlementWindowOpen` before that; `AlreadySettled` after). Outcome depends only on pool state, so adversarial or self-interested settles are harmless. A convenience keeper (`script/keeper.sh`) pokes the oracle and settles due trades; correctness never depends on it.
- **Immediate fill** — no queues, no delays, no external oracles, no partner dependencies. Everything is hook-local.

## Contracts

| Contract | Purpose |
| --- | --- |
| `src/MarkoutHook.sol` | The v4 hook: bond escrow (`take`), ERC-6909 receipts, TWAP accumulator, permissionless settlement, refund / donate paths. |
| `src/MarkoutEngine.sol` | Pure mean-reversion classifier: `decide(P_pre, P_post, P_T)` in Q128.128 price space, strict 5 bps threshold. |
| `src/MarkoutRouter.sol` | Reference router: settles the swap and pays the hook's bond debt via `settleFor`. Integrating routers must do the same. |
| `src/BaseHook.sol` | Minimal IHooks base with no-op defaults (v4-periphery v4.0.0 ships none). |
| `script/keeper.sh` | Optional keeper: pokes the oracle and settles due trades. |

## Tests — 14/14 passing

```shell
forge build && forge test
```

Engine (6): up/down reversion refunds, sustain donates, 4-vs-6 bps price-space boundary, zero-impact donates.
Integration (8): `organicQuiet_refundsBond`, `arbSustains_donates`, `exactOut_chargesInputBondAndFillsOutput`, `swapTooSmall_reverts`, `settleWindowOpen_reverts`, `settle_replay_reverts`, `spotGames_ignored` (intra-block manipulation invisible to the TWAP), `twap_honorsSustainedReversion`.

## Deployed & proven on Sepolia (all source-verified on Etherscan)

| Contract | Address |
| --- | --- |
| MarkoutHook | [0xF51b4DD1e87D786fE7F3dFAAD29b754F11CdC0c0](https://sepolia.etherscan.io/address/0xf51b4dd1e87d786fe7f3dfaad29b754f11cdc0c0) |
| MarkoutRouter | [0x9640D3679c4440Cc7B1d56D7617f078c196BA7cC](https://sepolia.etherscan.io/address/0x9640d3679c4440cc7b1d56d7617f078c196ba7cc) |
| PoolManager | [0x160fF6871308D84089284A6aA1D357334575b03C](https://sepolia.etherscan.io/address/0x160ff6871308d84089284a6aa1d357334575b03c) |
| Demo token0 | [0x3b05a2fF8351CA6D8782E892a55e616A7F41E6A8](https://sepolia.etherscan.io/address/0x3b05a2ff8351ca6d8782e892a55e616a7f41e6a8) |
| Demo token1 | [0x94E7F1324D87BA28D8Fc556BD5C9be9E598680c0](https://sepolia.etherscan.io/address/0x94e7f1324d87ba28d8fc556bd5c9be9e598680c0) |

### LiveProofPack — real end-to-end run (2026-08-23)

Organic flow → **Refund**:

1. Organic buy (bond 2e15 escrowed): [`0x5d3a3e77…ebc9d`](https://sepolia.etherscan.io/tx/0x5d3a3e77a27472d4f1172663d0ef4b53745223d34dc76d214033985b7a1ebc9d)
2. Arbitrageur reverts the price: [`0x6ffa757c…191a5`](https://sepolia.etherscan.io/tx/0x6ffa757c2380aaf2325498d83786d6f4b827ea27de6f04afe2ab223674b191a5)
3. Permissionless settle → `Settled(outcome=Refund)`, bond returned to the trader: [`0x567fa241…88ac9b`](https://sepolia.etherscan.io/tx/0x567fa24109abe910b134fc5c58a78d41e2a040cf51b5265abc9c71ec9c88ac9b)

Toxic flow → **Donate** (the arbitrageur's own reversal trade, left unreversed):

4. Bonded in tx 2 above; price sustained → settle → `Settled(outcome=Donate)` + `Donate` on the PoolManager, bond socialized to LPs: [`0xac947b0f…d16389`](https://sepolia.etherscan.io/tx/0xac947b0fe194268cbddf1622a954d216e897413edad6bef168a8637fb9d16389)

Accounting checks out exactly: trader balance +2e15 on refund, hook escrow 0 after both settles, PoolManager holds the donated bond.

## Running a demo

Full runbook with commands, expected outcomes, and troubleshooting: [`demo.md`](./demo.md).

## Design notes & honest limitations

- The toxicity oracle is **entirely hook-local**: pre/post swap prices plus the hook's own time-weighted accumulator. No Chainlink, no Pyth, no off-chain component.
- The 21 s window and 5 bps threshold are constants tuned for the demo; both are single-line changes.
- Settlement price is a time-weighted average with attribution-at-update semantics: between two pokes, elapsed time is attributed to the price observed at the next update. Keeper cadence bounds the misattribution window (the on-chain settle and every swap also poke).
- The bond receipt is a minimal ERC-6909 ledger (transfer + operator approval) minted per trade as an on-chain record; it is not burned on settlement.
- Router trust: any router may swap through the pool; the trader identity it declares in `hookData` only affects where the receipt and any refund are sent, and the router's swapper always pays the bond. A production deployment would allowlist routers.
- An earlier iteration settled via the Reactive Network; that integration was parked after the network failed to activate any RVM for our deployer across three contracts (see `blockers.md` — Sepolia side worked throughout). The permissionless design shipped here is strictly simpler and has no external network dependency.

## Repository layout

- `src/` — protocol contracts (see `src/AGENTS.md`)
- `test/` — Foundry suite (see `test/AGENTS.md`)
- `script/` — deployment + keeper (see `script/AGENTS.md`)
- `docs/prd/markout.md` — original product requirements document
- `demo.md` — live demo runbook · `progress.md` — build log · `blockers.md` — parked Reactive investigation

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

## Tests — 16/16 passing

```shell
forge build && forge test
```

Engine (6): up/down reversion refunds, sustain donates, 4-vs-6 bps price-space boundary, zero-impact donates.
Integration (10): `organicQuiet_refundsBond`, `arbSustains_donates`, `exactOut_chargesInputBondAndFillsOutput`, `swapTooSmall_reverts`, `settleWindowOpen_reverts`, `settle_replay_reverts`, `spotGames_ignored` (intra-block manipulation invisible to the TWAP), `twap_honorsSustainedReversion`, `refundUndeliverable_donates` (a blacklisted refund never bricks settlement — the bond falls through to LPs), `bondFor_quotes` (public quoting view matches the charged bond).

## Deployed & proven on Sepolia (all source-verified on Etherscan)

| Contract | Address |
| --- | --- |
| MarkoutHook | [0xE79B7Ef0Bb9984BDB614f58d2C8000ce98b180C0](https://sepolia.etherscan.io/address/0xe79b7ef0bb9984bdb614f58d2c8000ce98b180c0) |
| MarkoutRouter | [0xCeBe3Ce43Db694F2313445999648b1FBBBf20890](https://sepolia.etherscan.io/address/0xcebe3ce43db694f2313445999648b1fbbbf20890) |
| PoolManager | [0xCC5795163c3E966074B3eF091a0580C96D16E5a2](https://sepolia.etherscan.io/address/0xcc5795163c3e966074b3ef091a0580c96d16e5a2) |
| Demo token0 | [0x7e80764a88133cFc3dA52b7305044dA782904667](https://sepolia.etherscan.io/address/0x7e80764a88133cfc3da52b7305044da782904667) |
| Demo token1 | [0xCBbe82f3B6331dbE9fAEAD19D3757371b059BDAe](https://sepolia.etherscan.io/address/0xcbbe82f3b6331dbe9faead19d3757371b059bdae) |

### LiveProofPack — real end-to-end run (2026-08-24)

Organic flow → **Refund**:

1. Organic buy (bond 2e15 escrowed): [`0xa6630ec4…8273b`](https://sepolia.etherscan.io/tx/0xa6630ec4a1bda38dad5b65b1b022faef678ceb813694a7ad2f7070ffe048273b)
2. Arbitrageur reverts the price: [`0x55d215f2…10a74`](https://sepolia.etherscan.io/tx/0x55d215f2f67fac2990bbc69bc13da95eb5b050dd005e22504556c843df410a74)
3. Permissionless settle → `Settled(outcome=Refund)`, bond returned to the trader: [`0x01c54182…bacda`](https://sepolia.etherscan.io/tx/0x01c541821d6fab93e4c299a677e4b9a96b0a188d653391ab361a7114b84bacda)

Toxic flow → **Donate** (the arbitrageur's own reversal trade, left unreversed):

4. Bonded in tx 2 above; price sustained → settle → `Settled(outcome=Donate)` + `Donate` on the PoolManager, bond socialized to LPs: [`0xf2dffadf…75f74`](https://sepolia.etherscan.io/tx/0xf2dffadf20c98ff941fc7ae301fa0412e1c54b919c3256e29554279f77d75f74)

Accounting checks out exactly: trader balance +2e15 on refund, hook escrow 0 after both settles, PoolManager holds the donated bond.

## Running a demo

Full runbook with commands, expected outcomes, and troubleshooting: [`demo.md`](./demo.md).

## Design notes & honest limitations

- The toxicity oracle is **entirely hook-local**: pre/post swap prices plus the hook's own time-weighted accumulator. No Chainlink, no Pyth, no off-chain component.
- The 21 s window and 5 bps threshold are constants tuned for the demo; both are single-line changes.
- Settlement price is a time-weighted average with attribution-at-update semantics: between two pokes, elapsed time is attributed to the price observed at the next update. Keeper cadence bounds the misattribution window (the on-chain settle and every swap also poke).
- The bond receipt is a minimal ERC-6909 ledger (transfer + operator approval) minted per trade as an on-chain record; it is not burned on settlement.
- **Settlement can never brick**: if the oracle orders a refund but the token cannot deliver it to the trader (e.g. blacklist-style tokens), the bond falls through to the LPs and the outcome records `Donate`.
- **Quoting surface**: `bondFor(amountIn)` is a public view returning the exact bond (20 bps floored); a result of 0 means the swap would revert `SwapTooSmall`.
- Router trust: any router may swap through the pool; the trader identity it declares in `hookData` only affects where the receipt and any refund are sent, and the router's swapper always pays the bond. A production deployment would allowlist routers.

## Repository layout

- `src/` — protocol contracts
- `test/` — Foundry suite
- `script/` — deployment + keeper
- `docs/prd/markout.md` — product requirements document
- `demo.md` — live demo runbook

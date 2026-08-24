# Markout

A Uniswap v4 hook that classifies swaps by **whether the price stays**: organic flow gets its bond refunded, single-shot arbitrage pays it to LPs. Built for the UHI10 Hookathon — **Sustainable Liquidity & MEV Protection** track. Deployed and proven live on Sepolia, with a browser UI you can trade from.

| | | | | | |
| --- | --- | --- | --- | --- | --- |
| **3 bps** fill fee | **20 bps** bond escrow | **5 bps** reversion threshold | **21 s** settlement window | **16/16** forge tests | **2 tx** [live proofs](#liveproofpack--real-end-to-end-run-2026-08-25) |

## The idea

Continuation-flow MEV filters miss the most dangerous flow of all: the **single-shot arbitrageur** who executes exactly *one* trade to snap the AMM to the global market price — there is no continuation to analyze. Markout doesn't look at what the trader did. It looks at **what the pool price did after them**:

- **Price reverts → the trade was organic.** An uninformed trader pushes the AMM away from the global market; natural arbitrageurs push it back within seconds. Bond **refunded**.
- **Price sustains → the trade was informed.** A toxic single-shot arb moves the AMM *to* the global price and it stays there — no rational actor trades it back. Bond **donated to in-range LPs** as a socialized MEV dividend.

No oracles, no queues, no delayed execution, no partner dependencies. The mean-reversion oracle is entirely hook-local: pre/post swap prices plus a hook-maintained time-weighted accumulator.

## How it works

```
swap ── fills immediately at 3 bps (no delay, no queue)
  │
  └─ 20 bps input bond escrowed (exact, from the post-swap balanceDelta)
     └─ ERC-6909 receipt minted to the trader
        └─ T = 21 s … anyone calls settle(tradeId)
           │
           ├─ TWAP reverted > 5 bps toward pre-swap price ──▶ REFUND bond → trader
           │
           └─ TWAP sustained within 5 bps of post-swap (or beyond) ──▶ DONATE bond → in-range LPs
```

- **Bond precision** — the bond is exactly 20 bps of the realized `amountIn` from the post-swap `balanceDelta`. Works identically for exact-in and exact-out; `slot0` is never used for sizing. Dust swaps (bond would round to 0) revert with `SwapTooSmall`.
- **Mean-reversion oracle** — the hook keeps a per-pool time-weighted tick accumulator (Uniswap-V2-style), advanced on every swap, every permissionless `poke()`, and at settlement. The settlement price P_T is the average tick over the window, so intra-block spot games between pokes are invisible and only genuinely-sustained or genuinely-reverted prices decide the bond.
- **Permissionless settlement** — `settle(tradeId)` is callable by **anyone** once the window closes (`SettlementWindowOpen` before, `AlreadySettled` after). The outcome depends only on pool state, so adversarial or self-interested settles are harmless. A convenience keeper (`script/keeper.sh`) exists; correctness never depends on it.

## Try it in the browser

A one-page live UI ships in [`frontend/`](./frontend) — terminal-ledger style, wired directly to the deployed Sepolia contracts:

```shell
cd frontend && npm install && npm run dev
```

Connect an injected wallet (MetaMask/Rabby) on Sepolia, **mint demo tokens with one click** (the demo ERC-20s have a permissionless mint), swap, watch the **21 s countdown**, settle, and see the **REFUND vs DONATE** verdict — plus live pool price/tick and your bonded-trade history with outcomes.

## Contracts

| Contract | Purpose |
| --- | --- |
| `src/MarkoutHook.sol` | The v4 hook: bond escrow (`take`), ERC-6909 receipts, TWAP accumulator, permissionless settlement, refund / donate paths. |
| `src/MarkoutEngine.sol` | Pure mean-reversion classifier: `decide(P_pre, P_post, P_T)` in Q128.128 price space, strict 5 bps threshold. |
| `src/MarkoutRouter.sol` | Reference router: settles the swap and pays the hook's bond debt via `settleFor`. Integrating routers must do the same. |
| `src/BaseHook.sol` | Minimal IHooks base with no-op defaults (v4-periphery v4.0.0 ships none). |
| `script/keeper.sh` | Optional keeper: pokes the oracle and settles due trades. |
| `frontend/` | Live browser UI against the deployment below. |

## Tests — 16/16 passing

```shell
forge build && forge test
```

Engine (6): up/down reversion refunds, sustain donates, 4-vs-6 bps price-space boundary, zero-impact donates.
Integration (10): `organicQuiet_refundsBond`, `arbSustains_donates`, `exactOut_chargesInputBondAndFillsOutput`, `swapTooSmall_reverts`, `settleWindowOpen_reverts`, `settle_replay_reverts`, `spotGames_ignored` (intra-block manipulation invisible to the TWAP), `twap_honorsSustainedReversion`, `refundUndeliverable_donates` (a blacklisted refund never bricks settlement — the bond falls through to LPs), `bondFor_quotes` (public quoting view matches the charged bond).

## Deployed & proven on Sepolia (all source-verified on Etherscan)

| Contract | Address |
| --- | --- |
| MarkoutHook | [0xe79B7Ef0Bb9984BDb614F58D2c8000CE98b180c0](https://sepolia.etherscan.io/address/0xe79b7ef0bb9984bdb614f58d2c8000ce98b180c0) |
| MarkoutRouter | [0xcEbe3CE43db694f2313445999648B1FbbBf20890](https://sepolia.etherscan.io/address/0xcebe3ce43db694f2313445999648b1fbbbf20890) |
| PoolManager | [0xCC5795163C3e966074b3ef091A0580C96D16E5A2](https://sepolia.etherscan.io/address/0xcc5795163c3e966074b3ef091a0580c96d16e5a2) |
| Demo token0 | [0x7e80764a88133cFC3Da52B7305044da782904667](https://sepolia.etherscan.io/address/0x7e80764a88133cfc3da52b7305044da782904667) |
| Demo token1 | [0xCbBE82f3B6331DbE9faeAd19d3757371b059BdaE](https://sepolia.etherscan.io/address/0xcbbe82f3b6331dbe9faead19d3757371b059bdae) |

### LiveProofPack — real end-to-end run (2026-08-25)

Organic flow → **Refund**:

1. Organic buy, 1 TOKEN0 (bond 0.002 escrowed): [`0xd1cd9b06…a288f`](https://sepolia.etherscan.io/tx/0xd1cd9b06caa0642db79f7f1803971d94eaa5c02b38d177973058718d94ea288f)
2. Arbitrageur reverts the price: [`0x9df51053…03165`](https://sepolia.etherscan.io/tx/0x9df51053a7d222a29f4dc7e98cb695236c70df3342abf0107f85828050203165)
3. Permissionless settle → `Settled(outcome=Refund)`, bond returned to the trader: [`0x4edcf5e5…c245`](https://sepolia.etherscan.io/tx/0x4edcf5e51fec6e978631faea923c2d61bf2573950001ec596c391621abd2c245)

Toxic flow → **Donate** (the arbitrageur's own reversal trade, left unreversed):

4. Bonded in tx 2 above; price sustained → settle → `Settled(outcome=Donate)` + `Donate` on the PoolManager, bond socialized to LPs: [`0xd0086426…b456`](https://sepolia.etherscan.io/tx/0xd008642604b9ae75178be4ffe033820f855e470d8dd3fe3f35fb214d4b5cb456)

## Running a demo

- Browser UI runbook: [`frontend/`](./frontend) (`npm install && npm run dev`).
- Terminal runbook with cast, expected outcomes, and troubleshooting: [`demo.md`](./demo.md).

## Design notes & honest limitations

- **Net cost framing** — organic traders post the 20 bps bond until T; after the refund their net cost is the 3 bps fee. Only sustained (informed) moves pay 20 bps.
- **Custom PoolManager** — the deployment uses this project's own v4 PoolManager instance, not the canonical shared Sepolia PoolManager. MarkoutHook is a standard Uniswap v4 hook against it; nothing about the hook assumes a private manager.
- **Donate is socialized** — confiscated bonds go to the LPs *currently in range* at settlement, not specifically to the LPs who took the toxic trade. This is deliberate: permanent price discovery inherently leaves swap-time LPs out of range, so the dividend is pool-wide.
- The 21 s window and 5 bps threshold are constants tuned for the demo; both are single-line changes.
- Settlement price is a time-weighted average with attribution-at-update semantics: between pokes, elapsed time is attributed to the price observed at the next update. Keeper cadence bounds the misattribution window (every swap and every settle also poke).
- **Settlement can never brick**: if the oracle orders a refund but the token cannot deliver it (e.g. blacklist-style tokens), the bond falls through to the LPs and the outcome records `Donate`.
- **Quoting surface**: `bondFor(amountIn)` is a public view returning the exact bond (20 bps floored); 0 means the swap would revert `SwapTooSmall`.
- The bond receipt is a minimal ERC-6909 ledger minted per trade as an on-chain record; it is not burned on settlement.
- Router trust: any router may swap through the pool; the trader identity it declares in `hookData` only affects where the receipt and any refund are sent, and the router's swapper always pays the bond. A production deployment would allowlist routers.
- The toxicity oracle is **entirely hook-local**: pre/post swap prices plus the hook's own accumulator. No Chainlink, no Pyth, no off-chain component.

## Repository layout

- `src/` — protocol contracts
- `test/` — Foundry suite
- `script/` — deployment + keeper
- `frontend/` — live browser UI (Next.js + viem)
- `docs/prd/markout.md` — product requirements document
- `demo.md` — terminal demo runbook

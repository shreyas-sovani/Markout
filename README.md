# Markout

A Uniswap v4 hook that classifies swaps by **whether the price stays**: organic flow gets its bond refunded at settlement, single-shot arbitrage pays it to LPs. Built for the UHI10 Hookathon — **Sustainable Liquidity & MEV Protection** track. Deployed against the **canonical Sepolia v4 PoolManager**, with a browser UI you can trade from.

| | | | | | |
| --- | --- | --- | --- | --- | --- |
| **3 bps** fill fee | **20 bps** bond | **50%** reversion frontier | **24 s** fixed window | **43/43** forge tests | **2 tx** [live proofs](#liveproofpack--2026-08-27-canonical-sepolia) |

## The idea

Continuation-flow MEV filters miss the most dangerous flow of all: the **single-shot arbitrageur** who executes exactly *one* trade to snap the AMM to the global market price — there is no continuation to analyze. Markout doesn't look at what the trader did. It looks at **what the pool price did after them**:

- **Price reverts → the trade was organic.** An uninformed trader pushes the AMM away from the global market; natural arbitrageurs push it back within seconds. Bond **refunded — paid at settlement, no claim transaction**.
- **Price sustains → the trade was informed.** A toxic single-shot arb moves the AMM *to* the global price and it stays there — no rational actor trades it back. Bond **donated to in-range LPs** as a socialized MEV dividend.

No oracles, no queues, no delayed execution. The oracle is entirely hook-local: pre/post swap ticks plus a hook-maintained previous-tick accumulator. What it does **not** catch: slow trend flow, the front leg of an atomic sandwich (the backrun reverts the price, so the front leg refunds), and donation goes to *whoever is in range* at flush, not the specific LPs who took the toxic trade.

## How it works

```
swap ── fills immediately at 3 bps, through ANY v4 router
  │      (the 20 bps bond is charged to the swap caller's own
  │       PoolManager delta — every generic router can pay it)
  └─ bond escrowed (20 bps of realized input, hook-held)
     └─ fixed window T = 24 s ≈ two 12 s blocks
        └─ anyone calls settle(tradeId), any time after T
           │   (verdict computed over the immutable [bond, T] window
           │    from an append-only tick history — settling late,
           │    adversarially, or after heavy activity changes nothing)
           ├─ ≥50% of the trade's own impact reverted ──▶ REFUND, paid here
           │      (a claim tx exists only if token delivery failed)
           └─ sustained ──▶ DONATE → deferred LP bucket
                  └─ flushDonation(poolId) → in-range LPs
                         (defers while pool liquidity is zero)
```

- **Bond rides the swap delta** — the hook returns the bond as a v4 hook-delta (specified-side for exact-in, unspecified for exact-out), so it lands in the swap caller's own PoolManager delta. Any router that can settle a normal v4 swap can pay it; the Markout router is convenience (deadline, min-out / max-in, beneficiary declaration), never a gate.
- **Normalized reversion classifier** — refund iff at least half of the trade's own tick-space impact reverted over the fixed window. Scale-free: a 2-tick trade and a 2000-tick trade face the same frontier. Zero impact refunds; overshoot past pre refunds.
- **24 s window ≈ two 12 s blocks** — a full 1:1 reversion landing one block after the trade already sits at the 50% frontier and refunds. Same window in contracts, tests, and frontend.
- **Append-only tick history** — previous-tick attribution, binary-searched reads. No pruning, no retention cap: permissionless pokes and later swaps can never freeze escrow or change a verdict.
- **Terminal settlement** — verdict recorded before any value moves; zero external calls in `settle`; refunds auto-paid with a retryable `claimRefund` only for failed delivery (e.g. blacklist tokens); donations deferred at zero liquidity and flushed later.

## Try it in the browser

A one-page live UI ships in [`frontend/`](./frontend) — terminal-ledger style, wired directly to the deployment below:

```shell
cd frontend && npm install && npm run dev
```

Connect an injected wallet (MetaMask/Rabby) on Sepolia, **mint demo tokens with one click** (capped faucet: fixed supply cap, per-wallet cap, no blacklist), swap with **slippage + deadline protection and exact approvals**, watch the **24 s countdown** and the **Price Memory Tape** (pre, post, live, window average, the 50% frontier, and the bond's destination), settle, and run the **one-click deterministic Refund / Donate demos**. Refresh-safe: open and claimable trades are recovered from your own receipts and chain state.

## Contracts

| Contract | Purpose |
| --- | --- |
| `src/MarkoutHook.sol` | The v4 hook: delta-charged bond escrow, previous-tick accumulator with append-only history, permissionless settlement with at-settle refund payment, deferred LP donations, strict escrow accounting. |
| `src/MarkoutEngine.sol` | Pure normalized-reversion classifier: `decide(pre, post, windowAvg)` in tick space, 50% frontier. |
| `src/MarkoutRouter.sol` | Convenience router (not a gate): deadline, exact-in min-out / exact-out max-input (bond included), safe token handling, native support, beneficiary declaration. |
| `src/BaseHook.sol` | Minimal IHooks base validating all 14 permission flags; every external callback rejects callers other than the PoolManager. |
| `src/FaucetToken.sol` | Capped demo asset: no owner/pause/blacklist/tax, hard supply cap, per-wallet mint cap, no direct mints to the PoolManager. |
| `script/keeper.sh` | Optional keeper: pokes the accumulator, settles due trades, retry-claims refunds, flushes donations. |
| `frontend/` | Live browser UI against the deployment below. |

## Tests — 43/43 passing

```shell
forge build && forge test
```

Four suites: engine unit + fuzz (50% frontier, zero impact, overshoot, tiny/huge trades, monotonicity), integration + attack (`test_bondPayable_genericRouter` through v4's own PoolSwapTest, `test_bondPayable_attackerAuthoredRouter`, `test_fullReverseNextBlock_refunds`, `test_delayedSettlement_matchesWindowClose` after 50 swaps + 200 pokes, `test_hookCallbacks_rejectNonPoolManager`, `test_faucetMint_doesNotBreakEscrow`, `test_claimExistsOnlyWhenDeliveryFailed`, reentrancy-blocked claims, zero-liquidity deferral, native end-to-end, exact-in/out slippage + deadline), handler-based invariant fuzz (escrow coverage, liability identity, verdict immutability, bounded release), and a **canonical-Sepolia fork suite** initializing and seeding through the official PositionManager + Permit2.

## Deployed & proven on Sepolia (canonical v4, all source-verified)

| Contract | Address |
| --- | --- |
| PoolManager | [0xE03A1074c86CFeDd5C142C4F04F1a1536e203543](https://sepolia.etherscan.io/address/0xe03a1074c86cfedd5c142c4f04f1a1536e203543) — **canonical, shared** |
| MarkoutHook | [0x027C6cfD540f0446641846cd004b41561EEd70cC](https://sepolia.etherscan.io/address/0x027c6cfd540f0446641846cd004b41561eed70cc) |
| MarkoutRouter | [0x41Fd0B2B581C5F59d468D272dbfcc26e595383CF](https://sepolia.etherscan.io/address/0x41fd0b2b581c5f59d468d272dbfcc26e595383cf) |
| Demo token0 (MDA) | [0x7B0B6aF2271Cb2f7500365f5a80dB18F9666c315](https://sepolia.etherscan.io/address/0x7b0b6af2271cb2f7500365f5a80db18f9666c315) |
| Demo token1 (MDB) | [0xf3df97cf05D6eFc92cF211440381586b8B86eD76](https://sepolia.etherscan.io/address/0xf3df97cf05d6efc92cf211440381586b8b86ed76) |

### LiveProofPack — 2026-08-27, canonical Sepolia

Organic flow → **Refund, paid at settlement** (1:1 reversion landed one block / 12 s later — no overshoot needed):

1. Organic buy, 1 MDA: [`0xb6308958…e903f`](https://sepolia.etherscan.io/tx/0xb6308958d2a9e6b37fcc433c63e37c2a5a73468ecb0d44d7a74018b992ee903f)
2. Arbitrageur's full 1:1 reversion, next block: [`0x530304aa…dc141`](https://sepolia.etherscan.io/tx/0x530304aac8bbc0997a96a3dab9e5a21923b30127793b4836c99e47de5f6dc141)
3. `Settled(outcome=Refunded)` + `RefundClaimed` **in the same tx** — bond 0.002 MDA delivered to the trader at settle, balance delta exact: [`0xda16e75a…ddc49`](https://sepolia.etherscan.io/tx/0xda16e75a54e340692774f1405158a5870737b6e33df6400835db1fa6600ddc49)

Toxic flow → **Donate** (the reversal trade itself, left unreversed):

4. Bonded in tx 2; price sustained → `Settled(outcome=Donated)`: [`0xbda12220…bfe66`](https://sepolia.etherscan.io/tx/0xbda1222053c34f4b281082df0b139c04668d8fe8f15238d490d288bc277bfe66)
5. `flushDonation` → LPs: [`0x064234ab…a3e5`](https://sepolia.etherscan.io/tx/0x064234ab4a6dbd357a674cc480e2de5fc1a4a2de83f4e4e3da7af5cd2c66a3e5)

## Running a demo

- Browser UI: [`frontend/`](./frontend) (`npm install && npm run dev`), including one-click deterministic Refund / Donate pilots.
- Terminal runbook, copy-pasteable on the current ABI: [`demo.md`](./demo.md).

## Design notes & honest limitations

- **Net cost framing** — organic traders post the 20 bps bond until T; after the at-settle refund their net cost is the 3 bps fee. Only sustained (informed) moves pay 20 bps.
- **What the oracle does not catch** — a slow trend that never reverts within 24 s donates even if "organic"; the front leg of an atomic sandwich refunds (its backrun reverts the price — the backrun leg itself is the one that donates); donations socialize to *whoever is in range at flush*, not the specific LPs who carried the toxic inventory.
- **Donation is socialized** — deliberate: permanent price discovery inherently leaves swap-time LPs out of range, so the dividend is pool-wide and deferred until in-range liquidity exists.
- The 24 s window, 50% frontier, and 20 bps bond are constants tuned for a 12 s chain; each is a single-line change in the hook (and mirrored in tests + frontend).
- **Settlement is terminal**: verdicts are recorded before value moves, `settle` makes no external calls, and the only retryable path is a failed token delivery (claim resets and stays retryable — settlement can never brick).
- **Router trust**: any router may swap; the beneficiary a router declares in `hookData` receives refunds, and the router's own swapper always pays the bond. Integrators should route through a router that declares their users (the provided one does).
- The oracle is **entirely hook-local**: pool ticks plus the hook's own accumulator. No Chainlink, no Pyth, no off-chain component.

## Repository layout

- `src/` — protocol contracts
- `test/` — Foundry suites (unit / attack / invariant fuzz / canonical fork)
- `script/` — deployment + keeper
- `frontend/` — live browser UI (Next.js + viem)
- `docs/prd/markout.md` — product requirements document
- `demo.md` — terminal demo runbook

# Markout

**The pool that pays LPs when the price stays — and pays traders back when it doesn't.**

A Uniswap v4 hook on the **canonical Sepolia PoolManager** that lets a volatile pool quote tight (3 bps) and stay solvent: toxic one-shot arbitrage posts a bond it forfeits to in-range liquidity, and organic flow gets that bond refunded automatically when the price reverts behind it. If a judge, an LP, or a trader can remember one sentence, it's that one.

- **Who it's for**
  - **LPs** — post competitive fees on a volatile pair without being farmed by single-shot arbs; sustained informed moves pay a dividend straight into the pool.
  - **Organic flow** — instant fill, no delays, no queues. Post a 20 bps bond for 24 seconds; revert past half your own price impact and it's refunded *in the settlement transaction*. Net cost: the 3 bps fee.
  - **Integrators** — the bond rides the swap caller's own PoolManager delta. Any router that can settle a normal v4 swap — Universal Router, your own contract, v4's test routers — pays it with zero Markout-specific code. `No partner integrations`: no oracle feeds, no private orderflow, no keepers required for correctness.
- **How it works (one line)** — continuation-flow filters miss the arb that trades exactly once; this hook watches whether the pool's price **stays**.

## The instrument: a 24-second memory

Every swap fills immediately at 3 bps and posts a 20 bps bond. The hook then records a **24-second memory** of the pool — a previous-tick accumulator with append-only history — and any trade's verdict is computed over its *own immutable window*, no matter when settlement runs:

- **≥50% of the trade's own impact reverted** → organic → bond refunded at settlement (a claim exists only if token delivery failed).
- **Price sustained** → informed → bond forfeited to in-range LPs, flushed permissionlessly whenever liquidity exists.
- **Window ≈ two 12 s blocks**: a full 1:1 reversion landing one block after the trade already sits exactly on the 50% frontier and refunds.

The oracle is **entirely hook-local** — pool ticks plus the hook's own accumulator. What it honestly does *not* catch: slow trend flow that never reverts in-window, the front leg of an atomic sandwich (the backrun's reversion refunds it — the backrun leg is what donates), and donations go to whoever is in range at flush, not the specific LPs who carried the inventory.

## Try it

```shell
cd frontend && npm install && npm run dev
```

One page, live against the deployment below: connect, mint capped demo tokens, swap with real slippage + deadline protection and exact approvals, then watch the **memory tape** record your trade — live price trace, your pre/post, the 50% frontier, the fixed window sweeping — and settle it from the panel or the ledger. Refresh-safe: open and claimable trades are recovered from your own receipts. Deterministic one-click demos run both verdicts end-to-end.

Terminal runbook (copy-pasteable on the current ABI): [`demo.md`](./demo.md).

## The numbers

| | | | | | |
| --- | --- | --- | --- | --- | --- |
| **3 bps** fill fee | **20 bps** bond | **50%** reversion frontier | **24 s** fixed window | **43/43** forge tests | **2 tx** [live proofs](#deployed--proven-on-canonical-sepolia) |

Four suites: engine unit + fuzz, integration + attack (bond payable through v4's own `PoolSwapTest` *and* an attacker-authored router; 1:1 next-block reversion refunds; delayed settlement across heavy churn produces the identical verdict; faucet gifts can't corrupt escrow), handler-based invariant fuzz, and a **canonical-Sepolia fork suite** that initializes and seeds through the official PositionManager.

## Deployed & proven on canonical Sepolia

All source-verified on Etherscan.

| Contract | Address |
| --- | --- |
| PoolManager | [0xE03A1074c86CFeDd5C142C4F04F1a1536e203543](https://sepolia.etherscan.io/address/0xe03a1074c86cfedd5c142c4f04f1a1536e203543) — canonical, shared |
| MarkoutHook | [0x027C6cfD540f0446641846cd004b41561EEd70cC](https://sepolia.etherscan.io/address/0x027c6cfd540f0446641846cd004b41561eed70cc) |
| MarkoutRouter | [0x41Fd0B2B581C5F59d468D272dbfcc26e595383CF](https://sepolia.etherscan.io/address/0x41fd0b2b581c5f59d468d272dbfcc26e595383cf) — convenience; any router works |
| Demo token0 (MDA) | [0x7B0B6aF2271Cb2f7500365f5a80dB18F9666c315](https://sepolia.etherscan.io/address/0x7b0b6af2271cb2f7500365f5a80db18f9666c315) |
| Demo token1 (MDB) | [0xf3df97cf05D6eFc92cF211440381586b8B86eD76](https://sepolia.etherscan.io/address/0xf3df97cf05d6efc92cf211440381586b8b86ed76) |

**Live proofs (2026-08-27, our own transactions):**

1. Organic buy [`0xb6308958…`](https://sepolia.etherscan.io/tx/0xb6308958d2a9e6b37fcc433c63e37c2a5a73468ecb0d44d7a74018b992ee903f)
2. Full 1:1 reversion, one block later [`0x530304aa…`](https://sepolia.etherscan.io/tx/0x530304aac8bbc0997a96a3dab9e5a21923b30127793b4836c99e47de5f6dc141)
3. `Settled(Refunded)` + `RefundClaimed` **in the same tx** — bond delivered at settlement, balance delta exact [`0xda16e75a…`](https://sepolia.etherscan.io/tx/0xda16e75a54e340692774f1405158a5870737b6e33df6400835db1fa6600ddc49)
4. The reversal trade itself, unreversed → `Settled(Donated)` [`0xbda12220…`](https://sepolia.etherscan.io/tx/0xbda1222053c34f4b281082df0b139c04668d8fe8f15238d490d288bc277bfe66), then `flushDonation` to LPs [`0x064234ab…`](https://sepolia.etherscan.io/tx/0x064234ab4a6dbd357a674cc480e2de5fc1a4a2de83f4e4e3da7af5cd2c66a3e5)

## Contracts

| Contract | Purpose |
| --- | --- |
| `src/MarkoutHook.sol` | The hook: delta-charged bond escrow, append-only previous-tick history, permissionless terminal settlement (refunds paid at settle), deferred LP donations, strict escrow accounting. |
| `src/MarkoutEngine.sol` | Pure normalized-reversion classifier: 50% frontier in tick space. |
| `src/MarkoutRouter.sol` | Convenience router: deadline, exact-in min-out / exact-out max-in (bond included), strict token handling, native support. Not a gate. |
| `src/BaseHook.sol` | IHooks base validating all 14 permission flags; every callback rejects non-PoolManager callers. |
| `src/FaucetToken.sol` | Capped demo asset: no owner/pause/blacklist/tax, hard supply cap, per-wallet cap, no mints to the PoolManager. |
| `script/keeper.sh` | Optional automation: poke, settle, retry-claim, flush. Correctness never depends on it. |
| `frontend/` | The live instrument — see *Try it*. |

## Design notes & honest limitations

- **Net cost framing** — organic traders post the 20 bps bond until settle; after the at-settle refund, net cost is the 3 bps fee. Only sustained (informed) moves pay 20 bps.
- **Terminal settlement** — verdicts recorded before value moves; `settle` makes zero external calls; the only retryable path is a failed token delivery. Delayed settlement interpolates the same historical endpoint — verdicts never change with timing, and nothing can freeze escrow.
- **Router trust** — any router may swap; the beneficiary a router declares in `hookData` receives refunds, and the router's swapper always pays the bond. Integrators should route through a router that declares their users (the provided one does).
- The 24 s window, 50% frontier, and 20 bps bond are single-line constants (mirrored in tests + frontend).

## Repository layout

- `src/` — protocol contracts
- `test/` — Foundry suites (unit / attack / invariant fuzz / canonical fork)
- `script/` — deployment + keeper
- `frontend/` — the live instrument
- `docs/prd/markout.md` — product requirements document
- `demo.md` — terminal runbook

# Markout

**The pool that pays LPs when the price stays — and pays traders back when it doesn't.**

A Uniswap v4 hook on the **canonical Sepolia PoolManager** where each swap is marked 24 seconds later: if at least half of that swap's own price impact reverted, the 20 bps bond returns to the trader at settle; if it stayed, in-range LPs keep it. A volatile pair can quote 3 bps while one-shot toxic flow pays a 20 bps tax into the pool — a tax, not an LVR hedge. If a judge, an LP, or a trader can remember one sentence, it's that one.

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

**Hosted: <https://markout-nine.vercel.app>** — Chrome desktop + MetaMask (or any injected wallet) on Sepolia. Demo video: coming, human-recorded.

Three routes, all live against the deployment below:

- `/` — the **live memory tape** streams the pool with no wallet at all: real price trace from `slot0`, the flush ledger, and the LP framing.
- `/app` — the memory console: connect, mint capped demo tokens, swap with real slippage + deadline protection and exact approvals, watch the tape record *your* trade (live trace, your pre/post, the 50% frontier, the fixed window sweeping), settle it from the panel or the ledger — and the **LP seat** shows in-range liquidity, the pending dividend bucket, and total flushed to LPs. Refresh-safe: open and claimable trades are recovered from your own receipts. One-click demos run both verdicts end-to-end.
- `/docs` — the whole mechanism, honest limits included.

Local fallback:

```shell
cd frontend && npm install && npm run dev
```

Terminal runbook (copy-pasteable on the current ABI): [`demo.md`](./demo.md).

## The numbers

| | | | | | |
| --- | --- | --- | --- | --- | --- |
| **3 bps** fill fee | **20 bps** bond | **50%** reversion frontier | **24 s** fixed window | **48/48** forge tests | **2 tx** [live proofs](#deployed--proven-on-canonical-sepolia) |

Four suites: engine unit + fuzz, integration + attack (bond payable through v4's own `PoolSwapTest` *and* an attacker-authored router; 1:1 next-block reversion refunds; delayed settlement across heavy churn produces the identical verdict; faucet gifts can't corrupt escrow; `hookData` beneficiary rules; two batched swaps in one unlock don't clobber the transient pre-tick; the atomic-sandwich limit is named in a test; the LP dividend vs a vanilla 3 bps pool is measured), handler-based invariant fuzz, and a **canonical-Sepolia fork suite** that initializes and seeds through the official PositionManager.

## Deployed & proven on canonical Sepolia

All source-verified on Etherscan. Current cut: **2026-08-31** (the 2026-08-27 deployment is stale).

| Contract | Address |
| --- | --- |
| PoolManager | [0xE03A1074c86CFeDd5C142C4F04F1a1536e203543](https://sepolia.etherscan.io/address/0xe03a1074c86cfedd5c142c4f04f1a1536e203543) — canonical, shared |
| MarkoutHook | [0x6432C6e932809499D4Ec267CC41FBE2AEFBa70CC](https://sepolia.etherscan.io/address/0x6432c6e932809499d4ec267cc41fbe2aefba70cc) |
| MarkoutRouter | [0x46415Ef59235f7Abd989E76a2A4952d02A22365e](https://sepolia.etherscan.io/address/0x46415ef59235f7abd989e76a2a4952d02a22365e) — convenience; any router works |
| Demo token0 (MDA) | [0x313edAdBF16371068c6b6C6Da89eCe18C6f1B2a4](https://sepolia.etherscan.io/address/0x313edadbf16371068c6b6c6da89ece18c6f1b2a4) |
| Demo token1 (MDB) | [0xA73AEC48FC2A73031e6Cc2c708Dc4a2a9aC86816](https://sepolia.etherscan.io/address/0xa73aec48fc2a73031e6cc2c708dc4a2a9ac86816) |

**Live proofs (2026-08-31, our own transactions):**

1. Organic buy, block 11607382 [`0xef59adf3…`](https://sepolia.etherscan.io/tx/0xef59adf354c0b1ad202c47800307d94f1a700688c8ad83e7262a9b7f3683c467)
2. Full 1:1 reversion pre-signed and published back-to-back — landed in **exactly the next block**, 11607383 [`0x709eecd2…`](https://sepolia.etherscan.io/tx/0x709eecd2f88ecc33d0e5d8f1d0a3745060e1b31658514ec7d71a330d9e8d472d)
3. `Settled(outcome 1 · Refunded)` with `RefundClaimed` **in the same tx** — bond delivered at settlement, balance delta exact [`0x3e229140…`](https://sepolia.etherscan.io/tx/0x3e229140155705e5bfc46deb33ce4699c187603b940bd1b0fb504da7fb3d33b1)
4. An unreversed single-shot swap → `Settled(outcome 3 · Donated)` [`0x757bbd24…`](https://sepolia.etherscan.io/tx/0x757bbd249ca6e9f2ca808df5ec96f6d603547339d09b0c4c7e590edaca8ed14a), then `flushDonation` to in-range LPs [`0xf5834a3d…`](https://sepolia.etherscan.io/tx/0xf5834a3db146d8de0c218e0034a4fe4c298a9af4879ee2bd569f8fe8b2538031) — its swap is [`0x9aa3159a…`](https://sepolia.etherscan.io/tx/0x9aa3159a59d3c622c0223bc48948fe1d787cdcdff85d813f2818adc7473e0e98)

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
- **Router trust** — any router may swap; the beneficiary rule is strict, tested, and live: only a 32-byte `hookData` holding a **nonzero** address declares a beneficiary — empty payloads, arbitrary-length payloads, and a zero declaration all fall back to the direct swap caller (no revert mid-swap, no refund can ever be sent to `address(0)`). **Universal Router / integrators: pass exactly `abi.encode(endUser)` (32 bytes, nonzero) as `hookData`** to route refunds to your swapper; a router that declares nothing receives its own refunds.
- The 24 s window, 50% frontier, and 20 bps bond are single-line constants (mirrored in tests + frontend).
- **Deploy state** — the live addresses above are the 2026-08-31 deployment running exactly the `src/` in this repo, with the `hookData` guard live; the hosted frontend's constants match. No pending redeploy.

## Repository layout

- `src/` — protocol contracts
- `test/` — Foundry suites (unit / attack / invariant fuzz / canonical fork)
- `script/` — deployment + keeper
- `frontend/` — the live instrument
- `docs/prd/markout.md` — product requirements document
- `demo.md` — terminal runbook

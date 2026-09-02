# Markout

**The pool that pays LPs when the price stays — and pays traders back when it doesn't.**

A two-lane Uniswap v4 hook on the **canonical Sepolia PoolManager**, run off one hook-local 24-second memory. SPOT lane: swaps fill instantly at 3 bps while a live-quoted reversion-insurance premium — priced from this pool's own settle history — is escrowed; if at least half of the swap's own impact reverted, the premium returns at settle, if it stayed, in-range LPs keep it. BATCH lane: opt-in 24-second epochs net opposing orders and clear everyone at the epoch TWAP. The premium is a tax, not an LVR hedge. If a judge, an LP, or a trader can remember one sentence, it's that one.

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
| **3 bps** fill fee | **20 bps** bond | **50%** reversion frontier | **24 s** fixed window | **55/55** forge tests | **2 tx** [live proofs](#deployed--proven-on-canonical-sepolia) |

Four suites: engine unit + fuzz, integration + attack (bond payable through v4's own `PoolSwapTest` *and* an attacker-authored router; 1:1 next-block reversion refunds; delayed settlement across heavy churn produces the identical verdict; faucet gifts can't corrupt escrow; `hookData` beneficiary rules; two batched swaps in one unlock don't clobber the transient pre-tick; the atomic-sandwich limit is named in a test; the LP dividend vs a vanilla 3 bps pool is measured), handler-based invariant fuzz, and a **canonical-Sepolia fork suite** that initializes and seeds through the official PositionManager.

## Deployed & proven on canonical Sepolia

All source-verified on Etherscan. Current cut: **2026-09-02 (two-lane, coverage-compatible)** — every earlier deployment is stale.

| Contract | Address |
| --- | --- |
| PoolManager | [0xE03A1074c86CFeDd5C142C4F04F1a1536e203543](https://sepolia.etherscan.io/address/0xe03a1074c86cfedd5c142c4f04f1a1536e203543) — canonical, shared |
| MarkoutHook | [0x1e9A034b21aB19D00556b429C281f9B29d8BB0Cc](https://sepolia.etherscan.io/address/0x1e9a034b21ab19d00556b429c281f9b29d8bb0cc) |
| MarkoutRouter | [0xF06737dCbA252D276deCC0f6F0f2102AD20c7535](https://sepolia.etherscan.io/address/0xf06737dcba252d276decc0f6f0f2102ad20c7535) — convenience; any router works |
| MarkoutBatchRouter | [0xC9aaB8CaD29bE99A36653eC5A6d78278C84D4067](https://sepolia.etherscan.io/address/0xc9aab8cad29be99a36653ec5a6d78278c84d4067) — immutable child that runs batch residuals through the full premium lane |
| MarkoutBatchRouter | [0x5f0c6f2B8d2550043316840d473010273eCAb880](https://sepolia.etherscan.io/address/0x5f0c6f2b8d2550043316840d473010273ecab880) — immutable child that runs batch residuals through the full premium lane |
| Demo token0 (MDB, currency0) | [0x41a9c2D06770375A41b94aBC94Bcf0CD14320060](https://sepolia.etherscan.io/address/0x41a9c2d06770375a41b94abc94bcf0cd14320060) |
| Demo token1 (MDA, currency1) | [0xae0FE2707a76Ec31aB64Dc29557BdBEe9f1a5F5A](https://sepolia.etherscan.io/address/0xae0fe2707a76ec31ab64dc29557bdbee9f1a5f5a) |

**Live proofs (2026-09-02, our own transactions):**

1. Spot buy, block 11616518 [`0x2636c8c8…`](https://sepolia.etherscan.io/tx/0x2636c8c8df9b1dc7ede26555362f61af41b54f8b3adecdb4705dedac8740f9ff); pre-signed 1.01× reversion landed in **exactly the next block**, Δ = 12 s [`0x0e76a1cc…`](https://sepolia.etherscan.io/tx/0x0e76a1cc0f05473be6c4f479d3fd103a21d297c9b5fc7db880df6d3174f89c60)
2. `Settled(outcome 1 · Refunded)` + `RefundClaimed` **in the same tx** — premium paid back at settlement [`0xe354716c…`](https://sepolia.etherscan.io/tx/0xe354716c3e82b3e3c20d4a99a69fe10683cc230d23f9cff4861180ed935a10ff)
3. Unreversed single-shot swap [`0x1491a672…`](https://sepolia.etherscan.io/tx/0x1491a672f945c1a8bed55619aa86fdddcb841dd944b600929b9950401a579a0a) → `Settled(outcome 3 · Donated)` with **`DonationFlushed` inside the settle tx** — in-range LPs credited at settlement [`0xda709887…`](https://sepolia.etherscan.io/tx/0xda7098878fae81aff0b38828ee8773baaa9069c6492ffb74867e66b46b95b189)
4. Batch lane: pre-signed buy order [`0x76ce04bf…`](https://sepolia.etherscan.io/tx/0x76ce04bf556e8c1c8d52021c27236c4827497121b5b94430cf509d87a45e275d) + value-paired sell order [`0x19f6b896…`](https://sepolia.etherscan.io/tx/0x19f6b89604b55ddfe4a88836168237fbc18faa1816e080332bd378f051d381c5) in one epoch → `clearBatch` settles both sides at ONE uniform TWAP price with a dust-bounded residual (0 on the buy side) [`0xdb3a18f6…`](https://sepolia.etherscan.io/tx/0xdb3a18f65e6207084b25c924082d21272c49228b3e2b018be01dc5d13ee30109)

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
- **Terminal settlement** — verdicts recorded before value moves; a donate verdict credits in-range LPs inside the settle transaction whenever liquidity exists (zero-liquidity defers to the permissionless flush); the only retryable path is a failed token delivery. Delayed settlement interpolates the same historical endpoint — verdicts never change with timing, and nothing can freeze escrow.
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

# Markout

**One 24-second memory. Two lanes. LPs underwrite the quote.**

A Uniswap v4 hook on the **canonical Sepolia PoolManager**. The pool records its own later price and uses that memory twice:

- **Spot** — swaps fill instantly at 3 bps. A live-quoted reversion-insurance premium (starts at 20 bps, steps from this pool's own settle history, clamps 5–60) is escrowed. If at least half of that swap's own impact reverted, the premium returns at settle. If it stayed, in-range LPs keep it — credited in the settlement transaction whenever liquidity exists.
- **Batch** — opt-in 24-second epochs on the same clock. Opposing orders net at the epoch TWAP and never touch the AMM. Unmatched size is one bonded spot swap. A lone order is a one-epoch TWAP, not a coincidence-of-wants auction.

The premium is a tax on one-shot toxicity, not an LVR hedge. `No partner integrations`: no oracle feeds, no private orderflow, no keepers required for correctness.

- **Who it's for**
  - **LPs** — be a user: add full-range liquidity through the official PositionManager. Sustained informed flow pays a dividend into in-range liquidity at settle.
  - **Organic flow** — instant fill on spot. Post the live premium for 24 seconds; revert past half your own price impact and it is refunded *in the settlement transaction*. Net cost: the 3 bps fee.
  - **Sandwich-sensitive flow** — use the batch lane when two-sided; exact nets never hit the curve. The leftover residual is still a spot swap (named limit).
  - **Integrators** — the premium rides the swap caller's own PoolManager delta. Any router that can settle a normal v4 swap pays it with zero Markout-specific code.

## The instrument: a 24-second memory

Every **spot** swap fills immediately at 3 bps and posts the **live premium**. The hook records a previous-tick accumulator with append-only history. Each trade's verdict is computed over its *own immutable window*:

- **≥50% of the trade's own impact reverted** → organic → premium refunded at settlement (a claim exists only if token delivery failed).
- **Price sustained** → informed → premium forfeited to in-range LPs, credited inside `settle` when L > 0 (deferred only at zero liquidity).
- **Window ≈ two 12 s blocks**: a full 1:1 reversion landing one block after the trade already sits exactly on the 50% frontier and refunds.

The **batch** lane reuses that clock: `placeBatchOrder` takes custody, `clearBatch` is permissionless, clearing tick is `cumulativeAt` over the epoch, residual runs through `MarkoutBatchRouter` because v4 skips hook callbacks on self-calls.

The oracle is **entirely hook-local**. What it honestly does *not* catch: slow trend flow that never reverts in-window; the front leg of an atomic **spot** sandwich; a **batch residual** (unmatched size is a spot swap with unbounded price limit — two-sided nets are the protected path); donations pay whoever is in range **at credit time** (settle), not the exact LP who carried that tick path. Dust-sized donates can walk the premium toward the 60 bps cap; organic refunds walk it back 1 bp at a time.

## Try it

**Hosted: <https://markout-nine.vercel.app>** — Chrome desktop + MetaMask (or any injected wallet) on Sepolia. Demo video: coming, human-recorded.

Three routes, all live against the deployment below:

- `/` — the **live memory tape** streams the pool with no wallet: real `slot0` trace plus honest limits (spot sandwich, tax-not-LVR, credit-at-settle, lone-order TWAP, residual-is-spot).
- `/app` — connect, mint capped demo tokens, **add or remove liquidity** through the official PositionManager + Permit2, then trade **spot and/or batch**. Watch the tape, settle from the panel or the ledger, run refund / donate / batch-net demos. Refresh-safe: open trades recover from your receipts.
- `/docs` — the whole mechanism, honest limits included.

Local fallback:

```shell
cd frontend && npm install && npm run dev
```

Terminal runbook (copy-pasteable on the current ABI): [`demo.md`](./demo.md).

## The numbers

| | | | | | |
| --- | --- | --- | --- | --- | --- |
| **3 bps** fill fee | **5–60 bps** live premium | **50%** reversion frontier | **24 s** clock (spot + batch) | **56** forge tests | **[live proofs](#deployed--proven-on-canonical-sepolia)** |

Four suites: engine unit + fuzz, integration + attack (any-router premium, 1:1 next-block refund, delayed settlement across churn, hookData rules, named spot-sandwich limit, LP dividend vs vanilla, batch exact-net / partial-net / lone-TWAP / cancelled-order irrelevance / residual-spot honest limit, credit-at-settle), handler-based invariant fuzz (incl. batch custody), and a **canonical-Sepolia fork suite** through the official PositionManager.

## Deployed & proven on canonical Sepolia

All source-verified on Etherscan. Current cut: **2026-09-02 (two-lane, coverage-compatible)** — every earlier deployment is stale. Live bytecode is this `src/`.

| Contract | Address |
| --- | --- |
| PoolManager | [0xE03A1074c86CFeDd5C142C4F04F1a1536e203543](https://sepolia.etherscan.io/address/0xe03a1074c86cfedd5c142c4f04f1a1536e203543) — canonical, shared |
| MarkoutHook | [0x1e9A034b21aB19D00556b429C281f9B29d8BB0Cc](https://sepolia.etherscan.io/address/0x1e9a034b21ab19d00556b429c281f9b29d8bb0cc) |
| MarkoutRouter | [0xF06737dCbA252D276deCC0f6F0f2102AD20c7535](https://sepolia.etherscan.io/address/0xf06737dcba252d276decc0f6f0f2102ad20c7535) — convenience; any router works |
| MarkoutBatchRouter | [0xC9aaB8CaD29bE99A36653eC5A6d78278C84D4067](https://sepolia.etherscan.io/address/0xc9aab8cad29be99a36653ec5a6d78278c84d4067) — immutable child; batch residuals pay the premium lane |
| Demo token0 (MDB, currency0) | [0x41A9c2d06770375a41b94aBC94bcf0CD14320060](https://sepolia.etherscan.io/address/0x41a9c2d06770375a41b94abc94bcf0cd14320060) |
| Demo token1 (MDA, currency1) | [0xae0FE2707a76Ec31aB64Dc29557BdBEe9f1a5F5A](https://sepolia.etherscan.io/address/0xae0fe2707a76ec31ab64dc29557bdbee9f1a5f5a) |

**Live proofs (2026-09-02, our own transactions):**

1. Spot buy, block 11616518 [`0x2636c8c8…`](https://sepolia.etherscan.io/tx/0x2636c8c8df9b1dc7ede26555362f61af41b54f8b3adecdb4705dedac8740f9ff); pre-signed 1.01× reversion landed in **exactly the next block**, Δ = 12 s [`0x0e76a1cc…`](https://sepolia.etherscan.io/tx/0x0e76a1cc0f05473be6c4f479d3fd103a21d297c9b5fc7db880df6d3174f89c60)
2. `Settled(outcome 1 · Refunded)` + `RefundClaimed` **in the same tx** — premium paid back at settlement [`0xe354716c…`](https://sepolia.etherscan.io/tx/0xe354716c3e82b3e3c20d4a99a69fe10683cc230d23f9cff4861180ed935a10ff)
3. Unreversed single-shot swap [`0x1491a672…`](https://sepolia.etherscan.io/tx/0x1491a672f945c1a8bed55619aa86fdddcb841dd944b600929b9950401a579a0a) → `Settled(outcome 3 · Donated)` with **`DonationFlushed` inside the settle tx** — in-range LPs credited at settlement [`0xda709887…`](https://sepolia.etherscan.io/tx/0xda7098878fae81aff0b38828ee8773baaa9069c6492ffb74867e66b46b95b189)
4. Batch lane: pre-signed buy order [`0x76ce04bf…`](https://sepolia.etherscan.io/tx/0x76ce04bf556e8c1c8d52021c27236c4827497121b5b94430cf509d87a45e275d) + value-paired sell order [`0x19f6b896…`](https://sepolia.etherscan.io/tx/0x19f6b89604b55ddfe4a88836168237fbc18faa1816e080332bd378f051d381c5) in one epoch → `clearBatch` settles both sides at ONE uniform TWAP with a dust-bounded residual (0 on the buy side) [`0xdb3a18f6…`](https://sepolia.etherscan.io/tx/0xdb3a18f65e6207084b25c924082d21272c49228b3e2b018be01dc5d13ee30109)

## Contracts

| Contract | Purpose |
| --- | --- |
| `src/MarkoutHook.sol` | Hook: live premium, append-only previous-tick history, at-settle refunds and LP credit, batch epochs, escrow accounting. |
| `src/MarkoutBatchRouter.sol` | Immutable child: executes batch residuals as ordinary bonded swaps (v4 self-call guard). |
| `src/MarkoutEngine.sol` | Pure normalized-reversion classifier: 50% frontier in tick space. |
| `src/MarkoutRouter.sol` | Convenience router: deadline, exact-in min-out / exact-out max-in (premium included), strict token handling, native support. Not a gate. |
| `src/BaseHook.sol` | IHooks base validating all 14 permission flags; every callback rejects non-PoolManager callers. |
| `src/FaucetToken.sol` | Capped demo asset: no owner/pause/blacklist/tax, hard supply cap, per-wallet cap, no mints to the PoolManager. |
| `script/keeper.sh` | Optional automation: poke, settle, retry-claim, flush. Correctness never depends on it. |
| `frontend/` | The live instrument — see *Try it*. |

## Design notes & honest limitations

- **Net cost framing** — organic traders post the live premium until settle; after the at-settle refund, net cost is the 3 bps fee. Only sustained (informed) moves pay the premium.
- **Terminal settlement** — verdicts recorded before value moves; a donate verdict credits in-range LPs inside the settle transaction whenever liquidity exists (zero-liquidity defers to the permissionless flush); the only retryable path is a failed token delivery. Delayed settlement interpolates the same historical endpoint.
- **Router trust** — any router may swap; only a 32-byte `hookData` holding a **nonzero** address declares a beneficiary. Empty / junk / zero-word fall back to the direct swap caller. **Universal Router / integrators: pass exactly `abi.encode(endUser)` (32 bytes, nonzero) as `hookData`.**
- **Batch residual** — unmatched size is a bonded spot swap (`sqrtPriceLimit` unbounded). Two-sided exact nets do not take this path. Cancelled orders cannot move the TWAP; a live residual can be sandwiched like any spot swap.
- The 24 s window and 50% frontier are constants; the premium is **not** — it is pool-local settle history, default 20, clamp 5–60.
- **Deploy state** — the live addresses above are the **2026-09-02** two-lane deployment running exactly the `src/` in this repo.

## Repository layout

- `src/` — protocol contracts
- `test/` — Foundry suites (unit / attack / invariant fuzz / canonical fork)
- `script/` — deployment + keeper
- `frontend/` — the live instrument
- `docs/prd/markout.md` — product requirements document
- `demo.md` — terminal runbook

# Markout — Manual End-to-End Task List

Everything a human must do by hand to take this repo from "tests green" to "judged submission". Work top to bottom. Check items off as you go. Commands assume Foundry installed and run from repo root.

**Status 2026-08-18: Phases 0–4 COMPLETE (see `progress.md` + README address table). Start at Phase 5.**

---

## Phase 0 — Environment ✅ DONE 2026-08-18

- [x] **0.1 Create/choose the operator EOA.** One key controls the whole demo. Fund it on both networks (next two items).
  ```bash
  cast wallet new   # or import your existing key into the shell for this session only
  export PK=0x...
  ```
- [x] **0.2 Fund it with Sepolia ETH.** Any Sepolia faucet (Alchemy, Google, ecosystem faucets). Need ~0.5–1 SEP: deploys + a few swaps + callback gas buffer.
- [x] **0.3 Fund it with Lasna REACT.** Reactscan Lasna (https://lasna.reactscan.net) faucet. Need ~1–2 REACT: RSC deployment + system-contract subscription fees + RVM processing debt.
- [x] **0.4 Export the RPC endpoints.**
  ```bash
  export SEPOLIA_RPC=https://ethereum-sepolia-rpc.publicnode.com   # or your Alchemy/Infura URL
  export LASNA_RPC=https://lasna-rpc.rnk.dev/
  ```
- [x] **0.5 Verify both connections before going further.**
  ```bash
  cast chain-id --rpc-url $SEPOLIA_RPC   # 11155111
  cast chain-id --rpc-url $LASNA_RPC     # 5318007
  ```

## Phase 1 — Write + dry-run the deploy scripts (code, but only you can validate)

- [x] **1.1 Create `script/Deploy.Sepolia.s.sol`**: deploy `MockERC20` ×2, `PoolManager`, `MarkoutExecutor` (CREATE2-mined hook address passed in), `MarkoutHook` at the mined address (flags `BEFORE_SWAP|AFTER_SWAP`, CREATE2 deployer `0x4e59b44847b379578588920cA78FbF26c0B4956C`), `MarkoutRouter`; then `initialize(pool)` at 1:1, add a full-range LP position, mint/approve trader tokens. Mirror the ordering used in `test/Markout.t.sol` setUp.
- [x] **1.2 Create `script/Deploy.Lasna.s.sol`**: deploy `MarkoutReactive(hookAddress, executorAddress)` with a small `--value` (e.g. 0.01 REACT). Constructor subscribes to `SwapBonded` + `Cron1` automatically (guarded by `!vm`).
- [x] **1.3 Dry-run both.**
  ```bash
  forge script script/Deploy.Sepolia.s.sol --rpc-url $SEPOLIA_RPC
  forge script script/Deploy.Lasna.s.sol   --rpc-url $LASNA_RPC
  ```
  Fix until simulation passes. Note: the two addresses cross-reference — run Sepolia first, feed the resulting hook/executor addresses into the Lasna script args.

## Phase 2 — Deploy Sepolia (origin + destination)

- [x] **2.1 Broadcast.**
  ```bash
  forge script script/Deploy.Sepolia.s.sol --rpc-url $SEPOLIA_RPC --private-key $PK --broadcast
  ```
- [x] **2.2 Record addresses**: token0, token1, poolManager, hook, executor, router, poolId (`cast call $POOL_MANAGER "getPoolId(...)"` or from the Initialize event log). Drop them into `.env` (gitignored) and into the README deploy section.
- [x] **2.3 Sanity-check the hook address.** Bottom 14 bits must equal `0xC0` (BEFORE_SWAP=1<<7, AFTER_SWAP=1<<6):
  ```bash
  cast to-unit $(cast to-hex $HOOK) ... # or just: printf '%x\n' $(( $((16#$(cast checksum-address $HOOK | tr -d '0x' | tail -c 4))) & 0x3FFF ))
  ```
  Simpler: confirm `getHookPermissions` view matches and the pool initialize tx did not revert `HookAddressNotValid`.
- [x] **2.4 Verify sources on Sepolia Etherscan** ✅ DONE 2026-08-18 — all 7 verified (Pass - Verified): MarkoutHook, MarkoutExecutor, MarkoutRouter, PoolManager, PoolModifyLiquidityTest, both MockERC20s. Status polling must use the **V2 API** (`https://api.etherscan.io/v2/api?chainid=11155111&...`) — the V1 endpoint is deprecated/dead.

## Phase 3 — Deploy Lasna (RSC)

- [x] **3.1 Broadcast.** DONE 2026-08-18 — but NOT via forge script: local forge simulation cannot execute the Lasna system contract's node-side subscription precompile (0x64) and always reverts "Failure" even though the real tx succeeds. Deployed via `forge create` instead (exact command documented in `script/Deploy.Lasna.s.sol` header). RSC: `0x6719F298F544c688999819d13A34E871E723f4d9`, both constructor subscriptions registered (deploy tx succeeded ⇒ subscriptions succeeded).
- [ ] **3.2 Confirm on Reactscan Lasna** — PENDING (browser task): https://lasna.reactscan.net/address/0x6719F298F544c688999819d13A34E871E723f4d9 — status should be **Active**, subscriptions visible. Sourcify verification attempt failed: `https://sourcify.rnk.dev/` currently serves a TLS error (UnrecognisedName) — endpoint down server-side; retry later or verify via Reactscan UI.

## Phase 4 — Fund the machines (both directions)

- [x] **4.1 Fund the RSC in REACT via the system contract.**
  ```bash
  cast send --rpc-url $LASNA_RPC --private-key $PK \
    0x0000000000000000000000000000000000fffFfF "depositTo(address)" $RSC_ADDR --value 0.1ether
  ```
- [x] **4.2 Fund the Sepolia executor via the callback proxy** (this both prepays gas and auto-settles debt).
  ```bash
  cast send --rpc-url $SEPOLIA_RPC --private-key $PK \
    0xc9f36411C9897e7F959D99ffca2a0Ba7ee0D7bDA "depositTo(address)" $EXECUTOR_ADDR --value 0.05ether
  ```
- [x] **4.3 Health check (repeat whenever things go quiet).** Reactscan → RSC must stay **Active** (unpaid debt ⇒ `Inactive` ⇒ blocklisted ⇒ callbacks stop). Executor balance on Sepolia must stay > 0.

**Phase 0–4 ledger (2026-08-18):** operator `0xFeAf5C921996FC53f4DEf35e181E766e6D74690A`; remaining balance ≈ 0.019 SEP / 4.02 REACT — **top up Sepolia ETH before Phase 5 demo swaps** (need ~0.01+ for swaps + refund gas). RSC funded 0.5 REACT (tx `0x7c057feb38358ed0878d016506788a1e3d1f5b8fd0a590d18f6c74631d712e48`); executor funded 0.02 SEP (tx `0xd94f00d9ffd5e9050aec45c22d38f1c58ff218b728aa71cf19d0633626b9883c`). Pool init tx `0x4c4083ec63d66848f39ec848a15c1f7e0cc1f5de1951b4523e0eed688aad56b3`; liquidity tx `0xc772cdbbd01c01c256b045d51e873baf85fb93448fe481cd7f38117df5cb189d`.

## Phase 5 — Live end-to-end demo

- [ ] **5.1 Organic refund run.** Swap on the Markout pool via the router (use a second funded wallet as the trader, approve router first). Then, from a third wallet, immediately reverse-swap to restore the price (the "arbitrageur"). Wait ~21 s (3 Cron1 ticks).
  - Watch: Sepolia tx → `SwapBonded` log → (Lasna Reactscan: RVM `react()` activity, then a `Callback` row, `Callbacks` count increments) → Sepolia executor tx calling `settleMarkout` → hook `Settled(…, Refund, …)`.
  - Assert bond tokens returned to trader.
- [ ] **5.2 Toxic donate run.** Swap, do nothing. Wait ~21 s. Expect `Settled(…, Donate, …)` + a `Donate` event on the poolManager + LP fees accrued.
- [ ] **5.3 Exact-out run.** Exact-out swap; verify output exact + bond = 20 bps of realized `amountIn`.
- [ ] **5.4 Collect tx hashes for every step above → these are the `LiveProofPack`.** Sepolia hashes + Lasna hashes + Reactscan `Callbacks > 0` screenshot.

## Phase 6 — README / submission

- [ ] **6.1 Paste real addresses + LiveProofPack links into README.**
- [ ] **6.2 Record the 5-minute demo video** (PRD TSK-08): problem → mechanism → the two live runs (refund + donate) with Reactscan side-by-side.
- [ ] **6.3 Push everything to the public GitHub repo on the correct branch** (binary qualification requirement — root AGENTS.md §4).
- [ ] **6.4 Checklist before submitting**: Reactscan `Active` + `Callbacks > 0`, live Sepolia settlement hashes in README, disclosure that mean-reversion oracle is hook-local (no oracle partner), Reactive integration present in README (the Aug 21 go/no-go item).

---

## Standing reminders

- **RSC burn rate is real: ~0.18 REACT/hour.** The Cron1 subscription processes every Lasna block (~7 s) forever — it drained the initial 0.5 REACT in under 3 h and flipped the RSC `Inactive` (subscriptions stop, callbacks stop). Fixed 2026-08-18 with a 2 REACT top-up (`depositTo` tx `0xc0df35b2…728d`, debt back to 0) ≈ 11 h runway. **Top up before any demo session and check `debt()` first when things go quiet:**
  ```bash
  cast call 0x0000000000000000000000000000000000fffFfF "debt(address)(uint256)" $RSC_ADDR --rpc-url $LASNA_RPC
  ```
- **Re-fund whenever debt appears.** `depositTo` on both proxies (Phase 4 commands) is idempotent — run it liberally.
- **If callbacks never arrive:** check RSC status first (Reactscan), then executor balance, then subscription existence. 95% of the time it's funding.
- **If Sepolia settle txs revert:** check executor gas limit vs `donate` path cost; the callback gas limit is 1,000,000 (`MarkoutReactive.CALLBACK_GAS_LIMIT`), which should be ample.

# Markout — Manual End-to-End Task List

Everything a human must do by hand to take this repo from "tests green" to "judged submission". Work top to bottom. Check items off as you go. Commands assume Foundry installed and run from repo root.

---

## Phase 0 — Environment

- [ ] **0.1 Create/choose the operator EOA.** One key controls the whole demo. Fund it on both networks (next two items).
  ```bash
  cast wallet new   # or import your existing key into the shell for this session only
  export PK=0x...
  ```
- [ ] **0.2 Fund it with Sepolia ETH.** Any Sepolia faucet (Alchemy, Google, ecosystem faucets). Need ~0.5–1 SEP: deploys + a few swaps + callback gas buffer.
- [ ] **0.3 Fund it with Lasna REACT.** Reactscan Lasna (https://lasna.reactscan.net) faucet. Need ~1–2 REACT: RSC deployment + system-contract subscription fees + RVM processing debt.
- [ ] **0.4 Export the RPC endpoints.**
  ```bash
  export SEPOLIA_RPC=https://ethereum-sepolia-rpc.publicnode.com   # or your Alchemy/Infura URL
  export LASNA_RPC=https://lasna-rpc.rnk.dev/
  ```
- [ ] **0.5 Verify both connections before going further.**
  ```bash
  cast chain-id --rpc-url $SEPOLIA_RPC   # 11155111
  cast chain-id --rpc-url $LASNA_RPC     # 5318007
  ```

## Phase 1 — Write + dry-run the deploy scripts (code, but only you can validate)

- [ ] **1.1 Create `script/Deploy.Sepolia.s.sol`**: deploy `MockERC20` ×2, `PoolManager`, `MarkoutExecutor` (CREATE2-mined hook address passed in), `MarkoutHook` at the mined address (flags `BEFORE_SWAP|AFTER_SWAP`, CREATE2 deployer `0x4e59b44847b379578588920cA78FbF26c0B4956C`), `MarkoutRouter`; then `initialize(pool)` at 1:1, add a full-range LP position, mint/approve trader tokens. Mirror the ordering used in `test/Markout.t.sol` setUp.
- [ ] **1.2 Create `script/Deploy.Lasna.s.sol`**: deploy `MarkoutReactive(hookAddress, executorAddress)` with a small `--value` (e.g. 0.01 REACT). Constructor subscribes to `SwapBonded` + `Cron1` automatically (guarded by `!vm`).
- [ ] **1.3 Dry-run both.**
  ```bash
  forge script script/Deploy.Sepolia.s.sol --rpc-url $SEPOLIA_RPC
  forge script script/Deploy.Lasna.s.sol   --rpc-url $LASNA_RPC
  ```
  Fix until simulation passes. Note: the two addresses cross-reference — run Sepolia first, feed the resulting hook/executor addresses into the Lasna script args.

## Phase 2 — Deploy Sepolia (origin + destination)

- [ ] **2.1 Broadcast.**
  ```bash
  forge script script/Deploy.Sepolia.s.sol --rpc-url $SEPOLIA_RPC --private-key $PK --broadcast
  ```
- [ ] **2.2 Record addresses**: token0, token1, poolManager, hook, executor, router, poolId (`cast call $POOL_MANAGER "getPoolId(...)"` or from the Initialize event log). Drop them into `.env` (gitignored) and into the README deploy section.
- [ ] **2.3 Sanity-check the hook address.** Bottom 14 bits must equal `0xC0` (BEFORE_SWAP=1<<7, AFTER_SWAP=1<<6):
  ```bash
  cast to-unit $(cast to-hex $HOOK) ... # or just: printf '%x\n' $(( $((16#$(cast checksum-address $HOOK | tr -d '0x' | tail -c 4))) & 0x3FFF ))
  ```
  Simpler: confirm `getHookPermissions` view matches and the pool initialize tx did not revert `HookAddressNotValid`.
- [ ] **2.4 Verify sources on Sepolia Etherscan** (not Sourcify — this is the destination chain):
  ```bash
  forge verify-contract --chain-id 11155111 --verifier etherscan \
    --etherscan-api-key $ETHERSCAN_KEY $HOOK_ADDR src/MarkoutHook.sol:MarkoutHook
  # repeat for executor, router, poolManager, tokens
  ```

## Phase 3 — Deploy Lasna (RSC)

- [ ] **3.1 Broadcast.**
  ```bash
  forge script script/Deploy.Lasna.s.sol --rpc-url $LASNA_RPC --private-key $PK --broadcast \
    --verify --verifier sourcify --verifier-url https://sourcify.rnk.dev/
  ```
- [ ] **3.2 Confirm on Reactscan Lasna** (https://lasna.reactscan.net): contract shows up, status **Active**, and both subscriptions exist (`SwapBonded` on 11155111 + `Cron1` on 5318007). The `Callbacks` column should read 0 for now.

## Phase 4 — Fund the machines (both directions)

- [ ] **4.1 Fund the RSC in REACT via the system contract.**
  ```bash
  cast send --rpc-url $LASNA_RPC --private-key $PK \
    0x0000000000000000000000000000000000fffFfF "depositTo(address)" $RSC_ADDR --value 0.1ether
  ```
- [ ] **4.2 Fund the Sepolia executor via the callback proxy** (this both prepays gas and auto-settles debt).
  ```bash
  cast send --rpc-url $SEPOLIA_RPC --private-key $PK \
    0xc9f36411C9897e7F959D99ffca2a0Ba7ee0D7bDA "depositTo(address)" $EXECUTOR_ADDR --value 0.05ether
  ```
- [ ] **4.3 Health check (repeat whenever things go quiet).** Reactscan → RSC must stay **Active** (unpaid debt ⇒ `Inactive` ⇒ blocklisted ⇒ callbacks stop). Executor balance on Sepolia must stay > 0.

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

- **Re-fund whenever debt appears.** `depositTo` on both proxies (Phase 4 commands) is idempotent — run it liberally.
- **If callbacks never arrive:** check RSC status first (Reactscan), then executor balance, then subscription existence. 95% of the time it's funding.
- **If Sepolia settle txs revert:** check executor gas limit vs `donate` path cost; the callback gas limit is 1,000,000 (`MarkoutReactive.CALLBACK_GAS_LIMIT`), which should be ample.

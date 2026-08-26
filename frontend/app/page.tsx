"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  parseAbiItem,
  parseEther,
  decodeEventLog,
  formatEther,
  type Hash,
  type Address,
} from "viem";
import { toast, Toaster } from "sonner";

import {
  BOND_BPS,
  ERC20_ABI,
  HOOK,
  HOOK_ABI,
  MAX_SQRT_PRICE,
  MIN_SQRT_PRICE,
  POOL_ID,
  POOL_KEY,
  POOL_MANAGER,
  POOL_MANAGER_ABI,
  PROOFS,
  ROUTER,
  ROUTER_ABI,
  RPC_URLS,
  SETTLEMENT_DELAY,
  SLOT0_SLOT,
  SWAP_FEE_BPS,
  TOKEN0,
  TOKEN1,
  TOPICS,
  explorerAddress,
  explorerTx,
  formatTokens,
  getLogsChunked,
  publicClient,
  sqrtX96ToPrice,
  tickToPrice,
  walletClientFrom,
  type TradeRow,
} from "@/lib/contracts";
import { useWallet, getEthereum } from "@/lib/wallet";
import { usePoll } from "@/lib/usePoll";

const SWAP_BONDED_EVENT = parseAbiItem(
  "event SwapBonded(bytes32 indexed tradeId, address indexed trader, int24 preTick, int24 postTick, uint256 bondAmount)",
);
const MINT_SIZE = 100n * 10n ** 18n;
const DEMO_BUY = 1n * 10n ** 18n;
const DEMO_OVERSHOOT = 22n * 10n ** 17n; // 2.2e18 — overshoot reversal

function short(addr: string, n = 4): string {
  return `${addr.slice(0, 2 + n)}…${addr.slice(-n)}`;
}

function revertReason(e: unknown): string {
  const err = e as { shortMessage?: string; message?: string; details?: string };
  return (
    err.shortMessage ||
    err.details ||
    (err.message ?? "reverted").replace(/^Execution reverted:\s*/, "").slice(0, 160)
  );
}

// ---------------------------------------------------------------------------

export default function Page() {
  const { address, chainId, connect, disconnect, hasProvider } = useWallet();

  const [zeroForOne, setZeroForOne] = useState(true);
  const [amountStr, setAmountStr] = useState("1");
  const [slippagePct, setSlippagePct] = useState("0.5");
  const [busy, setBusy] = useState<string | null>(null);
  const [connBusy, setConnBusy] = useState(false);
  const [activeId, setActiveId] = useState<`0x${string}` | null>(null);
  const [tradesVersion, setTradesVersion] = useState(0);
  const [pilot, setPilot] = useState<"refund" | "donate" | null>(null);
  const pilotAbort = useRef(false);

  // ---- live pool state ----
  const [price, setPrice] = useState<number | null>(null);
  const [liveTick, setLiveTick] = useState<number | null>(null);
  const [chainNow, setChainNow] = useState<bigint>(0n);
  const [rpcOk, setRpcOk] = useState(true);

  useEffect(() => {
    let alive = true;
    const poll = async () => {
      try {
        const raw = (await publicClient.readContract({
          address: POOL_MANAGER,
          abi: POOL_MANAGER_ABI,
          functionName: "extsload",
          args: [SLOT0_SLOT],
        })) as `0x${string}`;
        const value = BigInt(raw);
        const sqrt = value & ((1n << 160n) - 1n);
        const t = (value >> 160n) & 0xffffffn;
        const signed = t >= 1n << 23n ? t - (1n << 24n) : t;
        if (alive) {
          setPrice(sqrtX96ToPrice(sqrt));
          setLiveTick(Number(signed));
          setRpcOk(true);
        }
      } catch {
        if (alive) setRpcOk(false);
      }
    };
    poll();
    const iv = setInterval(poll, 4000);
    return () => {
      alive = false;
      clearInterval(iv);
    };
  }, []);

  useEffect(() => {
    let alive = true;
    const poll = async () => {
      try {
        const b = await publicClient.getBlock();
        if (alive) setChainNow(b.timestamp);
      } catch {
        /* keep last */
      }
    };
    poll();
    const iv = setInterval(poll, 3000);
    return () => {
      alive = false;
      clearInterval(iv);
    };
  }, []);

  // ---- balances + allowance ----
  const sellToken = zeroForOne ? TOKEN0 : TOKEN1;
  const bal0 = usePoll(
    async () =>
      address
        ? ((await publicClient.readContract({
            address: TOKEN0,
            abi: ERC20_ABI,
            functionName: "balanceOf",
            args: [address],
          })) as bigint)
        : undefined,
    [address],
    6000,
  );
  const bal1 = usePoll(
    async () =>
      address
        ? ((await publicClient.readContract({
            address: TOKEN1,
            abi: ERC20_ABI,
            functionName: "balanceOf",
            args: [address],
          })) as bigint)
        : undefined,
    [address],
    6000,
  );
  const sellBal = (zeroForOne ? bal0.data : bal1.data) as bigint | undefined;
  const buyBal = (zeroForOne ? bal1.data : bal0.data) as bigint | undefined;

  const allowance = usePoll(
    async () =>
      address
        ? ((await publicClient.readContract({
            address: sellToken,
            abi: ERC20_ABI,
            functionName: "allowance",
            args: [address, ROUTER],
          })) as bigint)
        : undefined,
    [address, sellToken],
    8000,
  );

  // ---- derived ----
  const amountIn = useMemo(() => {
    try {
      const v = parseEther(amountStr);
      return v > 0n ? v : null;
    } catch {
      return null;
    }
  }, [amountStr]);

  const bond = amountIn ? (amountIn * BOND_BPS) / 10000n : 0n;
  const tooSmall = amountIn !== null && bond === 0n;
  const needApprove = amountIn !== null && (allowance.data ?? 0n) < amountIn + bond;
  const estOut = useMemo(() => {
    if (price === null || !amountIn) return null;
    const gross = zeroForOne
      ? (amountIn * BigInt(Math.round(price * 1e6))) / 10n ** 6n
      : (amountIn * 10n ** 6n) / BigInt(Math.round(price * 1e6));
    return (gross * (10000n - SWAP_FEE_BPS)) / 10000n;
  }, [price, amountIn, zeroForOne]);
  const minOut = useMemo(() => {
    if (!estOut) return 0n;
    const slipBps = BigInt(Math.round(parseFloat(slippagePct || "0") * 100));
    return (estOut * (10000n - slipBps)) / 10000n;
  }, [estOut, slippagePct]);

  // ---- trade recovery: authoritative rows from logs + chain state ----
  const [trades, setTrades] = useState<TradeRow[]>([]);
  useEffect(() => {
    if (!address) {
      setTrades([]);
      return;
    }
    let alive = true;
    (async () => {
      try {
        const head = await publicClient.getBlockNumber();
        const from = head > 150000n ? head - 150000n : 0n;
        const logs = await getLogsChunked({
          address: HOOK,
          event: SWAP_BONDED_EVENT,
          args: { trader: address },
          fromBlock: from,
          toBlock: head,
        });
        const rows: TradeRow[] = [...logs]
          .sort((a, b) => Number(b.blockNumber - a.blockNumber))
          .slice(0, 12)
          .map((l) => {
            const d = decodeEventLog({
              abi: HOOK_ABI,
              data: l.data,
              topics: l.topics as never,
            }) as unknown as { args: { tradeId: `0x${string}`; preTick: number; postTick: number } };
            return {
              id: d.args.tradeId,
              trader: address,
              bondCurrency: "",
              bondAmount: 0n,
              preTick: d.args.preTick,
              postTick: d.args.postTick,
              bondTime: 0n,
              settleAfter: 0n,
              outcome: -1,
              refundClaimed: false,
              txHash: l.transactionHash,
            };
          });
        if (rows.length > 0) {
          const results = (await publicClient.multicall({
            contracts: rows.map((r) => ({
              address: HOOK,
              abi: HOOK_ABI,
              functionName: "trades",
              args: [r.id],
            })),
            allowFailure: false,
          })) as unknown as Record<string, never>[];
          rows.forEach((r, i) => {
            const t = results[i] as unknown as {
              trader: string;
              bondCurrency: string;
              bondAmount: bigint;
              bondTime: number;
              settleAfter: number;
              outcome: number;
              refundClaimed: boolean;
            };
            r.bondCurrency = t.bondCurrency;
            r.bondAmount = t.bondAmount;
            r.bondTime = BigInt(t.bondTime);
            r.settleAfter = BigInt(t.settleAfter);
            r.outcome = Number(t.outcome);
            r.refundClaimed = t.refundClaimed;
          });
        }
        if (alive) {
          setTrades(rows);
          // Recovery: auto-focus the most interesting unfinished trade.
          if (rows.length > 0) {
            const open = rows.find((r) => r.outcome === 0);
            const claimable = rows.find((r) => r.outcome === 1 && !r.refundClaimed);
            setActiveId((cur) => cur ?? (claimable ?? open ?? rows[0]).id);
          }
        }
      } catch {
        /* RPC degraded — retry next bump */
      }
    })();
    return () => {
      alive = false;
    };
  }, [address, tradesVersion]);

  const active = trades.find((t) => t.id === activeId) ?? null;

  // ---- live preview of the active trade (tape data) ----
  const [preview, setPreview] = useState<{
    pre: number;
    post: number;
    windowAvg: number;
    reversionBps: bigint;
    expected: number;
  } | null>(null);
  useEffect(() => {
    if (!active || active.outcome !== 0) {
      setPreview(null);
      return;
    }
    let alive = true;
    const poll = async () => {
      try {
        const p = (await publicClient.readContract({
          address: HOOK,
          abi: HOOK_ABI,
          functionName: "previewTrade",
          args: [active.id],
        })) as unknown as [number, number, number, bigint, number, number, boolean];
        if (alive) {
          setPreview({ pre: p[0], post: p[1], windowAvg: p[2], reversionBps: p[3], expected: p[4] });
        }
      } catch {
        /* ignore */
      }
    };
    poll();
    const iv = setInterval(poll, 2500);
    return () => {
      alive = false;
      clearInterval(iv);
    };
  }, [active?.id, active?.outcome]);

  const remaining =
    active && chainNow > 0n && active.settleAfter > chainNow
      ? Number(active.settleAfter - chainNow)
      : 0;
  const windowOpen = active !== null && active.outcome === 0 && remaining > 0;

  // ---- write helpers: simulate first, then send, parse deterministic receipts ----
  const refreshAll = useCallback(() => {
    bal0.refresh();
    bal1.refresh();
    allowance.refresh();
    setTradesVersion((v) => v + 1);
  }, [bal0, bal1, allowance]);

  const simulate = async (call: {
    address: `0x${string}`;
    abi: never;
    functionName: string;
    args: unknown[];
    account: Address;
  }) => {
    // eth_call via publicClient.simulateContract — surfaces revert reasons
    // before anything is signed.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (publicClient as any).simulateContract({ ...call, chain: null, account: call.account });
  };

  const onConnect = async () => {
    if (!hasProvider) {
      toast.error("No injected wallet found — install MetaMask or Rabby, then reload.");
      return;
    }
    setConnBusy(true);
    try {
      const a = await connect();
      if (!a) toast.error("Wallet connection rejected.");
    } finally {
      setConnBusy(false);
    }
  };

  const switchNetwork = async () => {
    const eth = getEthereum();
    if (!eth) return;
    try {
      await eth.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0xaa36a7" }],
      });
    } catch {
      toast.error("Switch your wallet to Sepolia (11155111) to continue.");
    }
  };

  const onMint = async () => {
    if (!address) return;
    const wallet = walletClientFrom(getEthereum());
    setBusy("mint");
    try {
      for (const token of [TOKEN0, TOKEN1]) {
        await simulate({
          address: token,
          abi: ERC20_ABI as never,
          functionName: "mint",
          args: [address, MINT_SIZE],
          account: address,
        });
        const h = await wallet.writeContract({
          address: token,
          abi: ERC20_ABI,
          functionName: "mint",
          args: [address, MINT_SIZE],
          account: address,
        });
        await publicClient.waitForTransactionReceipt({ hash: h });
      }
      toast.success("Minted 100 MDA + 100 MDB (capped faucet: no blacklist, supply-capped).");
      refreshAll();
    } catch (e) {
      toast.error(`Mint failed: ${revertReason(e)}`);
    } finally {
      setBusy(null);
    }
  };

  const onApproveExact = async () => {
    if (!address || !amountIn) return;
    const wallet = walletClientFrom(getEthereum());
    setBusy("approve");
    try {
      const exact = amountIn + bond;
      await simulate({
        address: sellToken,
        abi: ERC20_ABI as never,
        functionName: "approve",
        args: [ROUTER, exact],
        account: address,
      });
      const h = await wallet.writeContract({
        address: sellToken,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [ROUTER, exact],
        account: address,
      });
      await publicClient.waitForTransactionReceipt({ hash: h });
      toast.success(`Approved exactly ${formatEther(exact)} (input + bond) — no unlimited allowances.`);
      allowance.refresh();
    } catch (e) {
      toast.error(`Approve failed: ${revertReason(e)}`);
    } finally {
      setBusy(null);
    }
  };

  const doSwapTx = async (
    amount: bigint,
    dir: boolean,
    minAmountOut: bigint,
  ): Promise<{ tradeId: `0x${string}`; hash: Hash }> => {
    if (!address) throw new Error("connect first");
    const wallet = walletClientFrom(getEthereum());
    const args = [
      POOL_KEY,
      [dir, -amount, dir ? MIN_SQRT_PRICE : MAX_SQRT_PRICE],
      minAmountOut,
      BigInt(Math.floor(Date.now() / 1000) + 300),
    ];
    await simulate({
      address: ROUTER,
      abi: ROUTER_ABI as never,
      functionName: "swap",
      args,
      account: address,
    });
    const h = await wallet.writeContract({
      address: ROUTER,
      abi: ROUTER_ABI,
      functionName: "swap",
      args: args as never,
      account: address,
    });
    const rc = await publicClient.waitForTransactionReceipt({ hash: h });
    // Deterministic trade identity: parse the SwapBonded event from THIS
    // receipt — never a global "last trade" pointer.
    const log = rc.logs.find(
      (l) =>
        l.address.toLowerCase() === HOOK.toLowerCase() &&
        l.topics[0] === TOPICS.swapBonded,
    );
    if (!log) throw new Error("no SwapBonded in receipt");
    const d = decodeEventLog({
      abi: HOOK_ABI,
      data: log.data,
      topics: log.topics as never,
    }) as unknown as { args: { tradeId: `0x${string}` } };
    return { tradeId: d.args.tradeId, hash: h };
  };

  const onSwap = async () => {
    if (!address || !amountIn) return;
    if (needApprove) {
      toast.error("Approve the exact amount first (input + bond).");
      return;
    }
    if ((sellBal ?? 0n) < amountIn + bond) {
      toast.error(`Insufficient balance: need ${formatEther(amountIn + bond)} (input + bond).`);
      return;
    }
    setBusy("swap");
    try {
      const { tradeId, hash } = await doSwapTx(amountIn, zeroForOne, minOut);
      setActiveId(tradeId);
      toast.success("Swap filled at 3 bps — bond escrowed, 21 s window running.", {
        action: { label: "tx", onClick: () => window.open(explorerTx(hash), "_blank") },
      });
      refreshAll();
    } catch (e) {
      toast.error(`Swap failed: ${revertReason(e)}`);
    } finally {
      setBusy(null);
    }
  };

  const onSettle = async (tradeId: `0x${string}`) => {
    if (!address) return;
    const wallet = walletClientFrom(getEthereum());
    setBusy("settle");
    try {
      await simulate({
        address: HOOK,
        abi: HOOK_ABI as never,
        functionName: "settle",
        args: [tradeId],
        account: address,
      });
      const h = await wallet.writeContract({
        address: HOOK,
        abi: HOOK_ABI,
        functionName: "settle",
        args: [tradeId],
        account: address,
      });
      const rc = await publicClient.waitForTransactionReceipt({ hash: h });
      const log = rc.logs.find(
        (l) => l.address.toLowerCase() === HOOK.toLowerCase() && l.topics[0] === TOPICS.settled,
      );
      let outcome = 2;
      if (log) {
        const d = decodeEventLog({
          abi: HOOK_ABI,
          data: log.data,
          topics: log.topics as never,
        }) as unknown as { args: { outcome: number } };
        outcome = d.args.outcome;
      }
      toast.success(
        outcome === 1
          ? "Verdict: REFUND-PENDING — claim the bond (pull-based, anyone can call)."
          : "Verdict: DONATE — bond deferred to the LP distribution bucket.",
        { action: { label: "tx", onClick: () => window.open(explorerTx(h), "_blank") } },
      );
      refreshAll();
      return outcome;
    } catch (e) {
      toast.error(`Settle failed: ${revertReason(e)}`);
      return undefined;
    } finally {
      setBusy(null);
    }
  };

  const onClaim = async (tradeId: `0x${string}`) => {
    if (!address) return;
    const wallet = walletClientFrom(getEthereum());
    setBusy("claim");
    try {
      const h = await wallet.writeContract({
        address: HOOK,
        abi: HOOK_ABI,
        functionName: "claimRefund",
        args: [tradeId],
        account: address,
      });
      const rc = await publicClient.waitForTransactionReceipt({ hash: h });
      const ok = rc.logs.some(
        (l) =>
          l.address.toLowerCase() === HOOK.toLowerCase() &&
          l.topics[0] === TOPICS.refundClaimed,
      );
      if (ok) toast.success("Bond refunded to the trader.");
      else toast.warning("Delivery failed this time (hostile token?) — claim stays retryable.");
      refreshAll();
    } catch (e) {
      toast.error(`Claim failed: ${revertReason(e)}`);
    } finally {
      setBusy(null);
    }
  };

  const onFlush = async () => {
    if (!address) return;
    const wallet = walletClientFrom(getEthereum());
    setBusy("flush");
    try {
      const h = await wallet.writeContract({
        address: HOOK,
        abi: HOOK_ABI,
        functionName: "flushDonation",
        args: [POOL_ID],
        account: address,
      });
      await publicClient.waitForTransactionReceipt({ hash: h });
      toast.success("Donations flushed to in-range LPs.");
      refreshAll();
    } catch (e) {
      toast.error(`Flush failed: ${revertReason(e)}`);
    } finally {
      setBusy(null);
    }
  };

  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  const waitWindow = async (settleAfter: bigint) => {
    for (;;) {
      if (pilotAbort.current) throw new Error("demo aborted");
      const b = await publicClient.getBlock();
      if (b.timestamp >= settleAfter + 1n) return;
      await sleep(2000);
    }
  };

  /** Deterministic demo: organic swap + overshoot reversion => Refund. */
  const demoRefund = async () => {
    if (!address) return;
    pilotAbort.current = false;
    setPilot("refund");
    setBusy("demo");
    try {
      if ((sellBal ?? 0n) < DEMO_BUY * 2n) {
        toast.error("Need ~2 MDA + 2.2 MDB for the demo — mint first.");
        return;
      }
      // fund both directions
      const approveAll = async (token: `0x${string}`, amt: bigint) => {
        const a = (await publicClient.readContract({
          address: token,
          abi: ERC20_ABI,
          functionName: "allowance",
          args: [address, ROUTER],
        })) as bigint;
        if (a < amt) {
          const wallet = walletClientFrom(getEthereum());
          const h = await wallet.writeContract({
            address: token,
            abi: ERC20_ABI,
            functionName: "approve",
            args: [ROUTER, amt],
            account: address,
          });
          await publicClient.waitForTransactionReceipt({ hash: h });
        }
      };
      await approveAll(TOKEN0, DEMO_BUY + (DEMO_BUY * BOND_BPS) / 10000n);
      await approveAll(TOKEN1, DEMO_OVERSHOOT + (DEMO_OVERSHOOT * BOND_BPS) / 10000n);

      toast.info("DEMO 1/5 — organic swap (1 MDA in)…");
      const first = await doSwapTx(DEMO_BUY, true, 0n);
      setActiveId(first.tradeId);

      toast.info("DEMO 2/5 — arbitrageur overshoots the reversion (2.2 MDB)…");
      await sleep(1500);
      await doSwapTx(DEMO_OVERSHOOT, false, 0n);

      toast.info("DEMO 3/5 — waiting out the fixed 21 s window…");
      await waitWindow(BigInt(Math.floor(Date.now() / 1000)) + BigInt(SETTLEMENT_DELAY) + 2n);

      toast.info("DEMO 4/5 — settling…");
      const outcome = await onSettle(first.tradeId);
      if (outcome === 1) {
        toast.info("DEMO 5/5 — claiming the refund…");
        await onClaim(first.tradeId);
      }
    } catch (e) {
      toast.error(`Demo aborted: ${revertReason(e)}`);
    } finally {
      setPilot(null);
      setBusy(null);
    }
  };

  /** Deterministic demo: single sustained swap => Donate + flush. */
  const demoDonate = async () => {
    if (!address) return;
    pilotAbort.current = false;
    setPilot("donate");
    setBusy("demo");
    try {
      toast.info("DEMO 1/4 — single-shot swap, no reversion behind it…");
      const first = await doSwapTx(DEMO_BUY, true, 0n);
      setActiveId(first.tradeId);

      toast.info("DEMO 2/4 — waiting out the fixed 21 s window…");
      await waitWindow(BigInt(Math.floor(Date.now() / 1000)) + BigInt(SETTLEMENT_DELAY) + 2n);

      toast.info("DEMO 3/4 — settling (expect DONATE)…");
      await onSettle(first.tradeId);

      toast.info("DEMO 4/4 — flushing the LP donation…");
      await onFlush();
    } catch (e) {
      toast.error(`Demo aborted: ${revertReason(e)}`);
    } finally {
      setPilot(null);
      setBusy(null);
    }
  };

  const wrongChain = address !== undefined && chainId !== 11155111;

  // ------------------------------------------------------------------

  return (
    <>
      <Toaster theme="dark" position="bottom-right" />
      <a href="#main" className="skip-link">
        skip to content
      </a>

      <header className="top">
        <div className="top-inner">
          <div className="wordmark">
            MARKOUT<span className="tick">▪</span>
          </div>
          <div className="top-tag">MEV protection by mean reversion</div>
          <div className="top-spacer" />
          <span className={"chain-chip" + (rpcOk ? "" : " warn-chip")} aria-live="polite">
            {rpcOk ? "SEPOLIA · LIVE" : "RPC DEGRADED"}
          </span>
          {address ? (
            <>
              <span className="chain-chip" title={address}>
                {short(address, 4)}
              </span>
              <button className="btn btn-ghost" onClick={() => disconnect()}>
                disconnect
              </button>
            </>
          ) : (
            <button className="btn btn-primary" onClick={onConnect} disabled={connBusy}>
              {connBusy ? "connecting…" : "connect wallet"}
            </button>
          )}
        </div>
      </header>

      <main className="wrap" id="main">
        {/* ---------------------------------------------------- hero */}
        <section className="hero">
          <div className="kicker">
            Uniswap v4 hook · canonical Sepolia PoolManager · sustainable liquidity &amp; MEV
            protection
          </div>
          <h1>
            Continuation-flow MEV filters miss single-shot arbitrage. Markout judges a trade by
            whether its price <span className="stays">stays</span>.
          </h1>
          <p className="hero-sub">
            Swaps fill <strong>immediately at 3 bps</strong> while a <strong>20 bps bond</strong> is
            escrowed over an <strong>immutable 21 s window</strong>. The normalized reversion oracle
            refunds when at least <strong>half the trade&apos;s own price impact</strong> reverted
            (organic flow) and donates the bond to in-range LPs when it sustained (informed flow).
            Settlement is permissionless, verdicts are final, and settling late cannot change them —
            the window endpoint is interpolated from history.
          </p>

          <div className="band">
            <div className="band-cell">
              <div className="band-value">3<span className="unit">bps</span></div>
              <div className="band-label">fill fee</div>
            </div>
            <div className="band-cell">
              <div className="band-value">20<span className="unit">bps</span></div>
              <div className="band-label">bond escrow</div>
            </div>
            <div className="band-cell">
              <div className="band-value">50<span className="unit">%</span></div>
              <div className="band-label">reversion frontier</div>
            </div>
            <div className="band-cell">
              <div className="band-value">21<span className="unit">s</span></div>
              <div className="band-label">fixed window</div>
            </div>
            <div className="band-cell">
              <div className="band-value">43<span className="unit">/43</span></div>
              <div className="band-label">forge tests</div>
            </div>
            <div className="band-cell">
              <div className="band-value">2<span className="unit">tx</span></div>
              <div className="band-label">
                <a href="#proofs">live proofs ↗</a>
              </div>
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------- main grid */}
        <div className="grid">
          {/* ------------------------------------------- swap console */}
          <section className="card" aria-label="Swap console">
            <div className="card-head">
              <div className="card-title">Swap console</div>
              <div className="card-note">
                pool MDA/MDB · 1:1 · capped faucet tokens
              </div>
            </div>
            <div className="card-body">
              {!address ? (
                <div className="connect-call">
                  <p>
                    Connect an injected wallet (MetaMask, Rabby, Brave) on Sepolia. One-click token
                    mint, swap with slippage + deadline protection, a 21 s countdown, settlement,
                    and the REFUND / DONATE verdict.
                  </p>
                  <button className="btn btn-primary" onClick={onConnect} disabled={connBusy}>
                    {connBusy ? "connecting…" : "connect wallet"}
                  </button>
                </div>
              ) : wrongChain ? (
                <div className="connect-call">
                  <p className="warn">Wrong network — switch your wallet to Sepolia (11155111).</p>
                  <button className="btn" onClick={switchNetwork}>
                    switch to sepolia
                  </button>
                </div>
              ) : (
                <>
                  <div className="tokenrow">
                    <div className="token-label">You sell</div>
                    <input
                      className="amount-input"
                      value={amountStr}
                      onChange={(e) => setAmountStr(e.target.value)}
                      placeholder="0.0"
                      inputMode="decimal"
                      aria-label="amount in"
                    />
                    <div className="token-side">
                      <div className="token-name">{zeroForOne ? "MDA" : "MDB"}</div>
                      <div className="token-addr">{short(zeroForOne ? TOKEN0 : TOKEN1)}</div>
                    </div>
                    <div className="token-balance">
                      <span>balance {formatTokens(sellBal ?? 0n)}</span>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={onMint}
                        disabled={busy !== null}
                      >
                        +100 each
                      </button>
                    </div>
                  </div>

                  <div className="flip">
                    <button
                      onClick={() => setZeroForOne((z) => !z)}
                      aria-label="flip direction"
                    >
                      ↕
                    </button>
                  </div>

                  <div className="tokenrow">
                    <div className="token-label">You buy (est.)</div>
                    <div
                      className="amount-input"
                      style={{ color: estOut ? "var(--text)" : "var(--faint)" }}
                    >
                      {estOut ? formatTokens(estOut, 4) : "—"}
                    </div>
                    <div className="token-side">
                      <div className="token-name">{zeroForOne ? "MDB" : "MDA"}</div>
                      <div className="token-addr">{short(zeroForOne ? TOKEN1 : TOKEN0)}</div>
                    </div>
                    <div className="token-balance">
                      <span>balance {formatTokens(buyBal ?? 0n)}</span>
                    </div>
                  </div>

                  <div className="quote-lines">
                    <div className="quote-line">
                      <span>fill fee / min out (slippage-protected)</span>
                      <span className="v">
                        3 bps · ≥ {estOut ? formatTokens(minOut, 4) : "—"}
                      </span>
                    </div>
                    <div className="quote-line">
                      <label htmlFor="slip" style={{ color: "inherit" }}>
                        slippage tolerance %
                      </label>
                      <input
                        id="slip"
                        className="slip-input"
                        value={slippagePct}
                        onChange={(e) => setSlippagePct(e.target.value)}
                        inputMode="decimal"
                        aria-label="slippage tolerance percent"
                        style={{ width: 64 }}
                      />
                    </div>
                    <div className="quote-line">
                      <span>bond escrowed 21 s (20 bps)</span>
                      <span className="v bond">{amountIn ? formatTokens(bond, 6) : "—"}</span>
                    </div>
                    <div className="quote-line">
                      <span>deadline</span>
                      <span className="v">+5 min</span>
                    </div>
                  </div>

                  {tooSmall && (
                    <p className="warn" style={{ marginBottom: 10 }}>
                      Swap too small — the 20 bps bond would round to zero (SwapTooSmall).
                    </p>
                  )}

                  <div className="action-stack">
                    {needApprove && !tooSmall && (
                      <button
                        className="btn"
                        onClick={onApproveExact}
                        disabled={busy !== null || !amountIn}
                      >
                        {busy === "approve" ? "approving…" : "approve exact (input + bond)"}
                      </button>
                    )}
                    <button
                      className="btn btn-primary"
                      onClick={onSwap}
                      disabled={busy !== null || !amountIn || tooSmall || needApprove}
                    >
                      {busy === "swap" ? "signing…" : "swap + post bond"}
                    </button>
                    <div className="demo-row">
                      <button
                        className="btn btn-demo refund"
                        onClick={demoRefund}
                        disabled={busy !== null}
                      >
                        {pilot === "refund" ? "running…" : "demo: refund path"}
                      </button>
                      <button
                        className="btn btn-demo donate"
                        onClick={demoDonate}
                        disabled={busy !== null}
                      >
                        {pilot === "donate" ? "running…" : "demo: donate path"}
                      </button>
                    </div>
                  </div>

                  <p className="tx-note">
                    exact approvals only · every write simulated first · refunds are pull-based
                    claims · net cost for organic flow is the 3 bps fee
                  </p>
                </>
              )}
            </div>
          </section>

          {/* ------------------------------------------- oracle panel */}
          <section className="card" aria-label="Mean reversion oracle">
            <div className="card-head">
              <div className="card-title">Price memory tape</div>
              <div className="card-note">
                <span className="pulse" aria-hidden="true" />
                {active ? "tracking trade" : "no active trade"}
              </div>
            </div>
            <div className="card-body">
              <div className="live-row">
                <span className="k">pool price</span>
                <span className="v">{price ? price.toFixed(6) : "…"} MDB/MDA</span>
              </div>
              <div className="live-row">
                <span className="k">tick</span>
                <span className="v">{liveTick !== null ? liveTick : "…"}</span>
              </div>

              <PriceTape
                pre={preview ? preview.pre : active ? active.preTick : null}
                post={preview ? preview.post : active ? active.postTick : null}
                windowAvg={preview ? preview.windowAvg : null}
                liveTick={liveTick}
                outcome={active ? active.outcome : -1}
              />

              {active ? (
                <div aria-live="polite">
                  <div className="countdown">
                    <div className={"countdown-time" + (windowOpen ? "" : " ready")}>
                      {active.outcome === 1
                        ? active.refundClaimed
                          ? "REFUNDED"
                          : "CLAIMABLE"
                        : active.outcome === 2
                          ? "DONATED"
                          : remaining > 0
                            ? `${remaining}s`
                            : "SETTLEABLE"}
                    </div>
                    <div className="countdown-label">
                      {active.outcome === 0
                        ? windowOpen
                          ? "fixed window running — price decides the bond"
                          : "window closed — anyone may settle"
                        : active.outcome === 1 && !active.refundClaimed
                          ? "verdict recorded — pull the refund"
                          : "terminal"}
                    </div>
                  </div>

                  {preview && active.outcome === 0 && (
                    <div className="quote-lines">
                      <div className="quote-line">
                        <span>reversion of own impact</span>
                        <span className={Number(preview.reversionBps) >= 5000 ? "v pos" : "v bond"}>
                          {(Number(preview.reversionBps) / 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="quote-line">
                        <span>projected verdict if settled now</span>
                        <span className={preview.expected === 1 ? "v pos" : "v bond"}>
                          {preview.expected === 1 ? "REFUND" : "DONATE"}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="action-stack">
                    {active.outcome === 0 && (
                      <button
                        className="btn btn-primary"
                        onClick={() => onSettle(active.id)}
                        disabled={busy !== null || windowOpen}
                      >
                        {busy === "settle" ? "settling…" : windowOpen ? `wait ${remaining}s` : "settle(tradeId) — anyone can"}
                      </button>
                    )}
                    {active.outcome === 1 && !active.refundClaimed && (
                      <button className="btn btn-primary" onClick={() => onClaim(active.id)} disabled={busy !== null}>
                        {busy === "claim" ? "claiming…" : "claimRefund(tradeId)"}
                      </button>
                    )}
                    {active.outcome === 2 && (
                      <button className="btn" onClick={onFlush} disabled={busy !== null}>
                        {busy === "flush" ? "flushing…" : "flushDonation(poolId) → LPs"}
                      </button>
                    )}
                    <a
                      href={explorerTx(active.txHash)}
                      target="_blank"
                      rel="noreferrer"
                      style={{ textAlign: "center", fontSize: 11 }}
                    >
                      swap tx ↗
                    </a>
                  </div>
                  <p className="tx-note">
                    trade id {short(active.id, 10)} · bond {formatTokens(active.bondAmount, 6)}{" "}
                    {active.bondCurrency.toLowerCase() === TOKEN0.toLowerCase() ? "MDA" : "MDB"}
                  </p>
                </div>
              ) : (
                <p className="empty">swap to bond a trade — refresh-safe, recoverable from history</p>
              )}
            </div>
          </section>
        </div>

        {/* ---------------------------------------------------- history */}
        <section className="section" aria-label="Your bonded trades">
          <div className="section-title">Your bonded trades — settle &amp; claim from here</div>
          <div className="card">
            {trades.length === 0 ? (
              <div className="empty">
                {address
                  ? "no SwapBonded events for this wallet in recent blocks"
                  : "connect a wallet to load your trade history"}
              </div>
            ) : (
              <table className="hist">
                <thead>
                  <tr>
                    <th>trade</th>
                    <th>bond</th>
                    <th>status</th>
                    <th>actions</th>
                    <th>tx</th>
                  </tr>
                </thead>
                <tbody>
                  {trades.map((r) => (
                    <tr
                      key={r.id}
                      className={r.id === activeId ? "row-active" : ""}
                      onClick={() => setActiveId(r.id)}
                    >
                      <td className="mono-strong" data-label="trade">{short(r.id, 8)}</td>
                      <td data-label="bond">{formatTokens(r.bondAmount, 6)}</td>
                      <td data-label="status">
                        {r.outcome === 1 ? (
                          <span className={"badge " + (r.refundClaimed ? "" : "refund")}>
                            {r.refundClaimed ? "refunded" : "refund — claim"}
                          </span>
                        ) : r.outcome === 2 ? (
                          <span className="badge donate">donated</span>
                        ) : r.outcome === 0 ? (
                          <span className="badge pending">
                            {chainNow >= r.settleAfter ? "settleable" : "window open"}
                          </span>
                        ) : (
                          <span className="badge pending">…</span>
                        )}
                      </td>
                      <td data-label="actions">
                        {r.outcome === 0 && chainNow >= r.settleAfter && (
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSettle(r.id);
                            }}
                            disabled={busy !== null}
                          >
                            settle
                          </button>
                        )}
                        {r.outcome === 1 && !r.refundClaimed && (
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              onClaim(r.id);
                            }}
                            disabled={busy !== null}
                          >
                            claim
                          </button>
                        )}
                      </td>
                      <td data-label="tx">
                        <a href={explorerTx(r.txHash)} target="_blank" rel="noreferrer">
                          ↗
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        {/* ---------------------------------------------------- footer */}
        <footer className="site" id="proofs">
          <div>
            <div className="foot-row">
              <span className="k">PoolManager</span>
              <a href={explorerAddress(POOL_MANAGER)} target="_blank" rel="noreferrer">
                canonical Sepolia v4 ↗
              </a>
            </div>
            <div className="foot-row">
              <span className="k">MarkoutHook</span>
              <a href={explorerAddress(HOOK)} target="_blank" rel="noreferrer">
                {short(HOOK, 6)} ↗
              </a>
            </div>
            <div className="foot-row">
              <span className="k">MarkoutRouter</span>
              <a href={explorerAddress(ROUTER)} target="_blank" rel="noreferrer">
                {short(ROUTER, 6)} ↗
              </a>
            </div>
            <div className="foot-row">
              <span className="k">Faucet tokens</span>
              <span>
                {short(TOKEN0)} · {short(TOKEN1)} — capped supply, per-wallet cap, no blacklist
              </span>
            </div>
          </div>
          <div>
            <div className="foot-row">
              <span className="k">Live refund</span>
              <a href={explorerTx(PROOFS.refundSettle)} target="_blank" rel="noreferrer">
                Settled(Refund) + claim ↗
              </a>
            </div>
            <div className="foot-row">
              <span className="k">Live donate</span>
              <a href={explorerTx(PROOFS.donateSettle)} target="_blank" rel="noreferrer">
                Settled(Donate) + flush ↗
              </a>
            </div>
            <div className="foot-row">
              <span className="k">RPC</span>
              <span>
                {rpcOk ? "healthy" : "degraded"} · {RPC_URLS.length} endpoints
              </span>
            </div>
          </div>
          <p className="foot-note">
            Fixed [bondTime, settleAfter] window: settlement at T+1 or T+1h interpolates the same
            historical endpoint — verdicts cannot change with delay. Donations socialize to the LPs
            currently in range and defer while liquidity is zero. The oracle is entirely hook-local:
            pool ticks plus a hook-maintained previous-tick accumulator.
          </p>
        </footer>
      </main>
    </>
  );
}

// ---------------------------------------------------------------------------
// Price Memory Tape — pre / post / window average / 50% frontier / verdict
// ---------------------------------------------------------------------------

function PriceTape({
  pre,
  post,
  windowAvg,
  liveTick,
  outcome,
}: {
  pre: number | null;
  post: number | null;
  windowAvg: number | null;
  liveTick: number | null;
  outcome: number;
}) {
  const W = 560;
  const H = 170;
  const PAD = 26;

  const ticks: number[] = [];
  if (pre !== null) ticks.push(pre);
  if (post !== null) ticks.push(post);
  if (windowAvg !== null) ticks.push(windowAvg);
  if (liveTick !== null) ticks.push(liveTick);
  if (pre !== null && post !== null) ticks.push(Math.round((pre + post) / 2));

  const lo = ticks.length ? Math.min(...ticks) - 12 : -12;
  const hi = ticks.length ? Math.max(...ticks) + 12 : 12;
  const y = (t: number) => H - PAD - ((t - lo) / (hi - lo)) * (H - 2 * PAD);

  const frontier = pre !== null && post !== null ? Math.round((pre + post) / 2) : null;

  const fmt = (t: number) => tickToPrice(t).toFixed(5);

  return (
    <div className="tape-wrap" role="img" aria-label="Price memory tape">
      <svg viewBox={`0 0 ${W} ${H}`} className="tape">
        {/* window shade */}
        <rect x={PAD} y={10} width={W * 0.6} height={H - 30} className="tape-window" />
        <text x={PAD + 6} y={22} className="tape-label">
          fixed window [bond, bond+21s]
        </text>

        {pre !== null && (
          <>
            <line x1={PAD} x2={W - PAD} y1={y(pre)} y2={y(pre)} className="tape-pre" />
            <text x={W - PAD - 4} y={y(pre) - 4} className="tape-label" textAnchor="end">
              pre {fmt(pre)}
            </text>
          </>
        )}
        {post !== null && (
          <>
            <line x1={PAD} x2={W - PAD} y1={y(post)} y2={y(post)} className="tape-post" />
            <text x={W - PAD - 4} y={y(post) + 12} className="tape-label" textAnchor="end">
              post {fmt(post)}
            </text>
          </>
        )}
        {frontier !== null && (
          <>
            <line x1={PAD} x2={W - PAD} y1={y(frontier)} y2={y(frontier)} className="tape-frontier" />
            <text x={PAD + 6} y={y(frontier) + 12} className="tape-label green">
              50% reversion frontier {fmt(frontier)}
            </text>
          </>
        )}

        {/* window average marker */}
        {windowAvg !== null && (
          <g className={outcome === 1 ? "tape-avg refund" : outcome === 2 ? "tape-avg donate" : "tape-avg"}>
            <line x1={W * 0.6 - 8} x2={W * 0.6 + 8} y1={y(windowAvg)} y2={y(windowAvg)} />
            <circle cx={W * 0.6} cy={y(windowAvg)} r={4} />
            <text x={W * 0.6 + 12} y={y(windowAvg) + 4} className="tape-label">
              window avg {fmt(windowAvg)}
            </text>
          </g>
        )}

        {/* live price dot */}
        {liveTick !== null && (
          <g className="tape-live">
            <circle cx={W - PAD - 10} cy={y(liveTick)} r={3.5} />
            <text x={W - PAD - 16} y={y(liveTick) - 6} className="tape-label" textAnchor="end">
              live {fmt(liveTick)}
            </text>
          </g>
        )}

        {/* bond destination after verdict */}
        {outcome === 1 && (
          <text x={W / 2} y={H - 6} className="tape-verdict refund" textAnchor="middle">
            BOND → TRADER (pull claim)
          </text>
        )}
        {outcome === 2 && (
          <text x={W / 2} y={H - 6} className="tape-verdict donate" textAnchor="middle">
            BOND → IN-RANGE LPs (deferred donation)
          </text>
        )}
      </svg>
    </div>
  );
}

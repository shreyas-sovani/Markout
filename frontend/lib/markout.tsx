"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  parseAbiItem,
  parseEther,
  decodeEventLog,
  formatEther,
  type Hash,
  type Address,
} from "viem";
import { toast as sonnerToast } from "sonner";

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
  ROUTER,
  ROUTER_ABI,
  SETTLEMENT_DELAY,
  SLOT0_SLOT,
  SWAP_FEE_BPS,
  TOKEN0,
  TOKEN1,
  TOPICS,
  explorerTx,
  formatTokens,
  getLogsChunked,
  publicClient,
  sqrtX96ToPrice,
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
const DEMO_REVERSE = 1n * 10n ** 18n; // 1:1 next-block reversion — enough at T=24
const DONATION_FLUSHED_TOPIC =
  "0x5bc93a443713f36a3668bdfb5ef37b3b5ee9d5dbd41b87e4912964705ac3cc66";

function revertReason(e: unknown): string {
  const err = e as { shortMessage?: string; message?: string; details?: string };
  return (
    err.shortMessage ||
    err.details ||
    (err.message ?? "reverted").replace(/^Execution reverted:\s*/, "").slice(0, 160)
  );
}

export interface MarkoutState {
  // wallet
  address: Address | undefined;
  chainId: number | undefined;
  hasProvider: boolean;
  onConnect: () => Promise<void>;
  connBusy: boolean;
  switchNetwork: () => Promise<void>;
  wrongChain: boolean;
  // live pool
  price: number | null;
  liveTick: number | null;
  chainNow: bigint;
  rpcOk: boolean;
  trace: { t: number; tick: number }[];
  traction: { events: number; a0: bigint; a1: bigint } | null;
  // balances
  sellBal: bigint | undefined;
  buyBal: bigint | undefined;
  allowanceVal: bigint | undefined;
  // form
  zeroForOne: boolean;
  setZeroForOne: (z: boolean) => void;
  amountStr: string;
  setAmountStr: (s: string) => void;
  slippagePct: string;
  setSlippagePct: (s: string) => void;
  amountIn: bigint | null;
  bond: bigint;
  tooSmall: boolean;
  needApprove: boolean;
  estOut: bigint | null;
  minOut: bigint;
  // trades
  trades: TradeRow[];
  active: TradeRow | null;
  activeId: `0x${string}` | null;
  setActiveId: (id: `0x${string}` | null) => void;
  preview: {
    pre: number;
    post: number;
    windowAvg: number;
    reversionBps: bigint;
    expected: number;
  } | null;
  remaining: number;
  windowOpen: boolean;
  // actions
  busy: string | null;
  pilot: "refund" | "donate" | null;
  onMint: () => Promise<void>;
  onApproveExact: () => Promise<void>;
  onSwap: () => Promise<void>;
  onSettle: (id: `0x${string}`) => Promise<number | undefined>;
  onClaim: (id: `0x${string}`) => Promise<void>;
  onFlush: () => Promise<void>;
  demoRefund: () => Promise<void>;
  demoDonate: () => Promise<void>;
  refreshAll: () => void;
}

const Ctx = createContext<MarkoutState | null>(null);

export function useMarkout(): MarkoutState {
  const v = useContext(Ctx);
  if (!v) throw new Error("useMarkout outside MarkoutProvider");
  return v;
}

export function MarkoutProvider({ children }: { children: ReactNode }) {
  const { address, chainId, connect, hasProvider } = useWallet();

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
  const [trace, setTrace] = useState<{ t: number; tick: number }[]>([]);
  const traceRef = useRef<{ t: number; tick: number }[]>([]);

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

  // record a trace point whenever a fresh chain time + tick are both in hand
  useEffect(() => {
    if (liveTick === null || chainNow === 0n) return;
    const t = Number(chainNow);
    const arr = traceRef.current;
    const last = arr[arr.length - 1];
    if (!last || last.t < t) {
      arr.push({ t, tick: liveTick });
      if (arr.length > 360) arr.shift();
      setTrace([...arr]);
    }
  }, [liveTick, chainNow]);

  // ---- traction: cumulative bond value flushed to LPs ----
  const [traction, setTraction] = useState<{ events: number; a0: bigint; a1: bigint } | null>(null);
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const head = await publicClient.getBlockNumber();
        const from = head > 150000n ? head - 150000n : 1n;
        let events = 0;
        let a0 = 0n;
        let a1 = 0n;
        for (let f = from; f <= head; f += 49000n) {
          const to = f + 48999n > head ? head : f + 48999n;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const logs = await (publicClient as any).getLogs({
            address: HOOK,
            topics: [DONATION_FLUSHED_TOPIC],
            fromBlock: f,
            toBlock: to,
          });
          for (const l of logs) {
            const d = l.data.slice(2);
            a0 += BigInt("0x" + d.slice(0, 64));
            a1 += BigInt("0x" + d.slice(64, 128));
            events += 1;
          }
          if (to >= head) break;
        }
        if (alive) setTraction({ events, a0, a1 });
      } catch {
        /* strip stays quiet on RPC failure */
      }
    })();
    return () => {
      alive = false;
    };
  }, [tradesVersion]);

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
  const allowancePoll = usePoll(
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

  const sellBal = (zeroForOne ? bal0.data : bal1.data) as bigint | undefined;
  const buyBal = (zeroForOne ? bal1.data : bal0.data) as bigint | undefined;
  const allowanceVal = allowancePoll.data as bigint | undefined;

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
  const needApprove = amountIn !== null && (allowanceVal ?? 0n) < amountIn + bond;
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

  // ---- trade recovery ----
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
            }) as unknown as {
              args: { tradeId: `0x${string}`; preTick: number; postTick: number };
            };
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
          if (rows.length > 0) {
            const open = rows.find((r) => r.outcome === 0);
            const claimable = rows.find((r) => r.outcome === 2 && !r.refundClaimed);
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

  // ---- live preview of the active trade ----
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

  // ---- write helpers ----
  const refreshAll = useCallback(() => {
    bal0.refresh();
    bal1.refresh();
    allowancePoll.refresh();
    setTradesVersion((v) => v + 1);
  }, [bal0, bal1, allowancePoll]);

  const simulate = async (call: {
    address: `0x${string}`;
    abi: never;
    functionName: string;
    args: unknown[];
    account: Address;
  }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (publicClient as any).simulateContract({ ...call, chain: null, account: call.account });
  };

  const onConnect = useCallback(async () => {
    if (!hasProvider) {
      sonnerToast.error("No injected wallet found — install MetaMask or Rabby, then reload.");
      return;
    }
    setConnBusy(true);
    try {
      const a = await connect();
      if (!a) sonnerToast.error("Wallet connection rejected.");
    } finally {
      setConnBusy(false);
    }
  }, [connect, hasProvider]);

  const switchNetwork = useCallback(async () => {
    const eth = getEthereum();
    if (!eth) return;
    try {
      await eth.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0xaa36a7" }],
      });
    } catch {
      sonnerToast.error("Switch your wallet to Sepolia (11155111) to continue.");
    }
  }, []);

  const onMint = useCallback(async () => {
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
      sonnerToast.success("Minted 100 MDA + 100 MDB (capped faucet: no blacklist, supply-capped).");
      refreshAll();
    } catch (e) {
      sonnerToast.error(`Mint failed: ${revertReason(e)}`);
    } finally {
      setBusy(null);
    }
  }, [address, refreshAll]);

  const onApproveExact = useCallback(async () => {
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
      sonnerToast.success(
        `Approved exactly ${formatEther(exact)} (input + bond) — no unlimited allowances.`,
      );
      allowancePoll.refresh();
    } catch (e) {
      sonnerToast.error(`Approve failed: ${revertReason(e)}`);
    } finally {
      setBusy(null);
    }
  }, [address, amountIn, bond, sellToken, allowancePoll]);

  const doSwapTx = useCallback(
    async (
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
        (l) => l.address.toLowerCase() === HOOK.toLowerCase() && l.topics[0] === TOPICS.swapBonded,
      );
      if (!log) throw new Error("no SwapBonded in receipt");
      const d = decodeEventLog({
        abi: HOOK_ABI,
        data: log.data,
        topics: log.topics as never,
      }) as unknown as { args: { tradeId: `0x${string}` } };
      return { tradeId: d.args.tradeId, hash: h };
    },
    [address],
  );

  const onSwap = useCallback(async () => {
    if (!address || !amountIn) return;
    if (needApprove) {
      sonnerToast.error("Approve the exact amount first (input + bond).");
      return;
    }
    if ((sellBal ?? 0n) < amountIn + bond) {
      sonnerToast.error(
        `Insufficient balance: need ${formatEther(amountIn + bond)} (input + bond).`,
      );
      return;
    }
    setBusy("swap");
    try {
      const { tradeId, hash } = await doSwapTx(amountIn, zeroForOne, minOut);
      setActiveId(tradeId);
      sonnerToast.success("Swap filled at 3 bps — bond escrowed, the 24 s memory is recording.", {
        action: { label: "tx", onClick: () => window.open(explorerTx(hash), "_blank") },
      });
      refreshAll();
    } catch (e) {
      sonnerToast.error(`Swap failed: ${revertReason(e)}`);
    } finally {
      setBusy(null);
    }
  }, [address, amountIn, needApprove, sellBal, bond, doSwapTx, zeroForOne, minOut, refreshAll]);

  const onSettle = useCallback(
    async (tradeId: `0x${string}`) => {
      if (!address) return undefined;
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
        let outcome = 3;
        if (log) {
          const d = decodeEventLog({
            abi: HOOK_ABI,
            data: log.data,
            topics: log.topics as never,
          }) as unknown as { args: { outcome: number } };
          outcome = d.args.outcome;
        }
        sonnerToast.success(
          outcome === 1
            ? "Verdict: REFUND — bond paid to the trader at settlement."
            : outcome === 2
              ? "Verdict: REFUND — delivery failed; claimRefund retries."
              : "Verdict: DONATE — bond deferred to the LP distribution bucket.",
          { action: { label: "tx", onClick: () => window.open(explorerTx(h), "_blank") } },
        );
        refreshAll();
        return outcome;
      } catch (e) {
        sonnerToast.error(`Settle failed: ${revertReason(e)}`);
        return undefined;
      } finally {
        setBusy(null);
      }
    },
    [address, refreshAll],
  );

  const onClaim = useCallback(
    async (tradeId: `0x${string}`) => {
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
        if (ok) sonnerToast.success("Bond refunded to the trader.");
        else sonnerToast.warning("Delivery failed this time (hostile token?) — claim stays retryable.");
        refreshAll();
      } catch (e) {
        sonnerToast.error(`Claim failed: ${revertReason(e)}`);
      } finally {
        setBusy(null);
      }
    },
    [address, refreshAll],
  );

  const onFlush = useCallback(async () => {
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
      sonnerToast.success("Donations flushed to in-range LPs.");
      refreshAll();
    } catch (e) {
      sonnerToast.error(`Flush failed: ${revertReason(e)}`);
    } finally {
      setBusy(null);
    }
  }, [address, refreshAll]);

  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  const waitWindow = async (settleAfter: bigint) => {
    for (;;) {
      if (pilotAbort.current) throw new Error("demo aborted");
      const b = await publicClient.getBlock();
      if (b.timestamp >= settleAfter + 1n) return;
      await sleep(2000);
    }
  };

  const demoRefund = useCallback(async () => {
    if (!address) return;
    pilotAbort.current = false;
    setPilot("refund");
    setBusy("demo");
    try {
      if ((sellBal ?? 0n) < DEMO_BUY * 2n) {
        sonnerToast.error("Need ~2 MDA + 1 MDB for the demo — mint first.");
        return;
      }
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
      await approveAll(TOKEN1, DEMO_REVERSE + (DEMO_REVERSE * BOND_BPS) / 10000n);

      sonnerToast.info("DEMO 1/5 — organic swap (1 MDA in)…");
      const first = await doSwapTx(DEMO_BUY, true, 0n);
      setActiveId(first.tradeId);

      sonnerToast.info("DEMO 2/5 — arbitrageur fully reverses 1:1 in the next block…");
      await sleep(1500);
      await doSwapTx(DEMO_REVERSE, false, 0n);

      sonnerToast.info("DEMO 3/5 — waiting out the fixed 24 s window…");
      await waitWindow(BigInt(Math.floor(Date.now() / 1000)) + BigInt(SETTLEMENT_DELAY) + 2n);

      sonnerToast.info("DEMO 4/5 — settling…");
      const outcome = await onSettle(first.tradeId);
      if (outcome === 2) {
        sonnerToast.info("DEMO 5/5 — delivery failed in this run; claiming…");
        await onClaim(first.tradeId);
      } else {
        sonnerToast.success("DEMO 5/5 — bond refunded to the trader AT SETTLEMENT.");
      }
    } catch (e) {
      sonnerToast.error(`Demo aborted: ${revertReason(e)}`);
    } finally {
      setPilot(null);
      setBusy(null);
    }
  }, [address, sellBal, doSwapTx, onSettle, onClaim]);

  const demoDonate = useCallback(async () => {
    if (!address) return;
    pilotAbort.current = false;
    setPilot("donate");
    setBusy("demo");
    try {
      sonnerToast.info("DEMO 1/4 — single-shot swap, no reversion behind it…");
      const first = await doSwapTx(DEMO_BUY, true, 0n);
      setActiveId(first.tradeId);

      sonnerToast.info("DEMO 2/4 — waiting out the fixed 24 s window…");
      await waitWindow(BigInt(Math.floor(Date.now() / 1000)) + BigInt(SETTLEMENT_DELAY) + 2n);

      sonnerToast.info("DEMO 3/4 — settling (expect DONATE)…");
      await onSettle(first.tradeId);

      sonnerToast.info("DEMO 4/4 — flushing the LP donation…");
      await onFlush();
    } catch (e) {
      sonnerToast.error(`Demo aborted: ${revertReason(e)}`);
    } finally {
      setPilot(null);
      setBusy(null);
    }
  }, [address, doSwapTx, onSettle, onFlush]);

  const wrongChain = address !== undefined && chainId !== 11155111;

  const value: MarkoutState = {
    address,
    chainId,
    hasProvider,
    onConnect,
    connBusy,
    switchNetwork,
    wrongChain,
    price,
    liveTick,
    chainNow,
    rpcOk,
    trace,
    traction,
    sellBal,
    buyBal,
    allowanceVal,
    zeroForOne,
    setZeroForOne,
    amountStr,
    setAmountStr,
    slippagePct,
    setSlippagePct,
    amountIn,
    bond,
    tooSmall,
    needApprove,
    estOut,
    minOut,
    trades,
    active,
    activeId,
    setActiveId,
    preview,
    remaining,
    windowOpen,
    busy,
    pilot,
    onMint,
    onApproveExact,
    onSwap,
    onSettle,
    onClaim,
    onFlush,
    demoRefund,
    demoDonate,
    refreshAll,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

// re-export for pages that import toast from the provider module
export { sonnerToast as toast, formatTokens };

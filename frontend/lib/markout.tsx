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
  encodeAbiParameters,
  formatEther,
  parseAbiParameters,
  type Hash,
  type Address,
} from "viem";
import { toast as sonnerToast } from "sonner";

import {
  ERC20_ABI,
  ERC721_TRANSFER_TOPIC,
  HOOK,
  HOOK_ABI,
  LIQUIDITY_SLOT,
  MAX_SQRT_PRICE,
  MIN_SQRT_PRICE,
  PERMIT2,
  PERMIT2_ABI,
  POOL_ID,
  POOL_KEY,
  POOL_MANAGER,
  POOL_MANAGER_ABI,
  POSM_ABI,
  POSITION_MANAGER,
  positionLiquiditySlot,
  TICK_BOUND_LOWER,
  TICK_BOUND_UPPER,
  ROUTER,
  ROUTER_ABI,
  SLOT0_SLOT,
  SWAP_FEE_BPS,
  TOKEN0,
  TOKEN1,
  TOPICS,
  explorerTx,
  formatTokens,
  getLogsChunked,
  liquidityForAmounts,
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
  onDisconnect: () => void;
  onSwitchAccount: () => Promise<void>;
  connBusy: boolean;
  switchNetwork: () => Promise<void>;
  wrongChain: boolean;
  // live pool
  price: number | null;
  liveTick: number | null;
  sqrtX96: bigint | null;
  chainNow: bigint;
  rpcOk: boolean;
  trace: { t: number; tick: number }[];
  traction: { events: number; a0: bigint; a1: bigint } | null;
  // LP seat
  poolLiquidity: bigint | null;
  pending0: bigint | null;
  pending1: bigint | null;
  // personal LP position (official PositionManager, Permit2-funded)
  lpTokenId: bigint | null;
  lpLiquidity: bigint | null;
  lpBusy: string | null;
  onLpAdd: (amount0: bigint, amount1: bigint) => Promise<void>;
  onLpRemoveAll: () => Promise<void>;
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
  premiumBps: bigint;
  tooSmall: boolean;
  needApprove: boolean;
  estOut: bigint | null;
  minOut: bigint;
  // batch lane
  batch: { epoch: bigint; endsAt: bigint; count: bigint; buy0: bigint; sell1: bigint } | null;
  myOrders: { epoch: bigint; index: bigint; zeroForOne: boolean; amountIn: bigint }[];
  lastClearEpoch: bigint | null;
  onBatchPlace: (zeroForOne: boolean, amount: bigint) => Promise<void>;
  onBatchCancel: (epoch: bigint, index: bigint) => Promise<void>;
  onClearEpoch: (epoch: bigint) => Promise<void>;
  demoBatchNet: () => Promise<void>;
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
  const { address, chainId, connect, disconnect, switchAccount, hasProvider } = useWallet();

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
  const [sqrtX96, setSqrtX96] = useState<bigint | null>(null);
  const [chainBlockNow, setChainBlockNow] = useState<bigint>(0n); // raw block timestamp
  const [chainNow, setChainNow] = useState<bigint>(0n); // smoothed, ticks every 250 ms
  const chainSyncWall = useRef(0);
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
          setSqrtX96(sqrt);
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
        if (alive) {
          // monotonic ingest: a lagging RPC must never move the clock back
          setChainBlockNow((prev) => {
            if (b.timestamp > prev) {
              chainSyncWall.current = Date.now();
              return b.timestamp;
            }
            return prev;
          });
        }
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

  // smooth the chain clock: interpolate between block polls so countdowns
  // tick second-by-second instead of jumping on each 3 s RPC poll
  useEffect(() => {
    const iv = setInterval(() => {
      if (chainBlockNow > 0n && chainSyncWall.current > 0) {
        // cap extrapolation at 18 s (1.5 blocks) so a stalled RPC can't run
        // the clock ahead of the chain; monotonic so it can't run backward
        const elapsed = Math.min(Math.floor((Date.now() - chainSyncWall.current) / 1000), 18);
        const est = chainBlockNow + BigInt(elapsed);
        setChainNow((prev) => (est > prev ? est : prev));
      }
    }, 250);
    return () => clearInterval(iv);
  }, [chainBlockNow]);

  // record a trace point whenever a fresh chain time + tick are both in hand
  useEffect(() => {
    if (liveTick === null || chainBlockNow === 0n) return;
    const t = Number(chainBlockNow);
    const arr = traceRef.current;
    const last = arr[arr.length - 1];
    if (!last || last.t < t) {
      arr.push({ t, tick: liveTick });
      if (arr.length > 360) arr.shift();
      setTrace([...arr]);
    }
  }, [liveTick, chainBlockNow]);

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

  // ---- LP seat: in-range liquidity + the pending dividend bucket ----
  const liqPoll = usePoll(
    async () => {
      const raw = (await publicClient.readContract({
        address: POOL_MANAGER,
        abi: POOL_MANAGER_ABI,
        functionName: "extsload",
        args: [LIQUIDITY_SLOT],
      })) as `0x${string}`;
      return BigInt(raw);
    },
    [],
    8000,
  );
  const pendingPoll = usePoll(
    async () => {
      const r = (await publicClient.multicall({
        contracts: [
          {
            address: HOOK,
            abi: HOOK_ABI,
            functionName: "pendingDonation",
            args: [POOL_ID, 0],
          },
          {
            address: HOOK,
            abi: HOOK_ABI,
            functionName: "pendingDonation",
            args: [POOL_ID, 1],
          },
        ],
        allowFailure: false,
      })) as unknown as bigint[];
      return { p0: r[0], p1: r[1] };
    },
    [],
    8000,
  );
  const poolLiquidity = (liqPoll.data as bigint | undefined) ?? null;
  const pending0 = pendingPoll.data ? (pendingPoll.data as { p0: bigint; p1: bigint }).p0 : null;
  const pending1 = pendingPoll.data ? (pendingPoll.data as { p0: bigint; p1: bigint }).p1 : null;

  // ---- personal LP position via official PositionManager + Permit2 ----
  const [lpTokenId, setLpTokenId] = useState<bigint | null>(null);
  const [lpLiquidity, setLpLiquidity] = useState<bigint | null>(null);
  const [lpBusy, setLpBusy] = useState<string | null>(null);

  // The PositionManager mints an ERC-721 per position; we persist our own
  // tokenId (per wallet) — the on-chain liquidity read validates it.
  useEffect(() => {
    if (!address) {
      setLpTokenId(null);
      setLpLiquidity(null);
      return;
    }
    const raw = typeof window !== "undefined" ? window.localStorage.getItem(`markout:lpTokenId:${address.toLowerCase()}`) : null;
    setLpTokenId(raw ? BigInt(raw) : null);
  }, [address]);

  useEffect(() => {
    if (!address || lpTokenId === null) {
      setLpLiquidity(null);
      return;
    }
    let alive = true;
    (async () => {
      try {
        const owner = (await publicClient.readContract({
          address: POSITION_MANAGER,
          abi: POSM_ABI,
          functionName: "ownerOf",
          args: [lpTokenId],
        })) as string;
        if (owner.toLowerCase() !== address.toLowerCase()) {
          if (alive) setLpLiquidity(0n);
          return;
        }
        const word = BigInt(
          (await publicClient.readContract({
            address: POOL_MANAGER,
            abi: POOL_MANAGER_ABI,
            functionName: "extsload",
            args: [positionLiquiditySlot(address, lpTokenId)],
          })) as `0x${string}`,
        );
        if (alive) setLpLiquidity(word & ((1n << 128n) - 1n));
      } catch {
        if (alive) setLpLiquidity(0n);
      }
    })();
    return () => {
      alive = false;
    };
  }, [address, lpTokenId, tradesVersion]);

  // ---- derived ----
  const amountIn = useMemo(() => {
    try {
      const v = parseEther(amountStr);
      return v > 0n ? v : null;
    } catch {
      return null;
    }
  }, [amountStr]);

  // Live reversion-insurance premium (bps), polled from the hook: donate
  // verdicts raise it, refund verdicts lower it, clamped [5, 60].
  const [premiumBps, setPremiumBps] = useState<bigint>(20n);
  useEffect(() => {
    let alive = true;
    const poll = async () => {
      try {
        const v = (await publicClient.readContract({
          address: HOOK,
          abi: HOOK_ABI,
          functionName: "premiumBps",
          args: [POOL_ID],
        })) as unknown as number | bigint;
        if (alive) setPremiumBps(BigInt(v));
      } catch {
        /* keep last */
      }
    };
    poll();
    const iv = setInterval(poll, 6000);
    return () => {
      alive = false;
      clearInterval(iv);
    };
  }, [tradesVersion]);

  const bond = amountIn ? (amountIn * premiumBps) / 10000n : 0n;

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
    liqPoll.refresh();
    pendingPoll.refresh();
    setTradesVersion((v) => v + 1);
  }, [bal0, bal1, allowancePoll, liqPoll, pendingPoll]);

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

  // ---- batch lane: current epoch preview + this wallet's live orders ----
  const [batchPreviewState, setBatchPreviewState] = useState<{
    epoch: bigint;
    endsAt: bigint;
    count: bigint;
    buy0: bigint;
    sell1: bigint;
  } | null>(null);
  const [myOrders, setMyOrders] = useState<
    { epoch: bigint; index: bigint; zeroForOne: boolean; amountIn: bigint }[]
  >([]);
  const [lastClearEpoch, setLastClearEpoch] = useState<bigint | null>(null);

  useEffect(() => {
    let alive = true;
    const poll = async () => {
      try {
        const p = (await publicClient.readContract({
          address: HOOK,
          abi: HOOK_ABI,
          functionName: "batchPreview",
          args: [POOL_ID],
        })) as unknown as [bigint, bigint, bigint, bigint, bigint];
        if (!alive) return;
        setBatchPreviewState({ epoch: p[0], endsAt: p[1], count: p[2], buy0: p[3], sell1: p[4] });
        if (!address || p[2] === 0n) {
          setMyOrders([]);
          return;
        }
        const idxs = Array.from({ length: Number(p[2]) }, (_, i) => BigInt(i));
        const rows = (await publicClient.multicall({
          contracts: idxs.map((i) => ({
            address: HOOK,
            abi: HOOK_ABI,
            functionName: "batchOrders",
            args: [POOL_ID, p[0], i],
          })),
          allowFailure: false,
        })) as unknown as { trader: string; zeroForOne: boolean; amountIn: bigint }[];
        setMyOrders(
          idxs
            .map((i, k) => ({ epoch: p[0], index: i, ...rows[k] }))
            .filter((r) => r.trader.toLowerCase() === address.toLowerCase()),
        );
      } catch {
        /* keep last */
      }
    };
    poll();
    const iv = setInterval(poll, 5000);
    return () => {
      alive = false;
      clearInterval(iv);
    };
  }, [address, tradesVersion, chainBlockNow === 0n]);

  const waitEpoch = async (endsAt: bigint) => {
    for (;;) {
      if (pilotAbort.current) throw new Error("demo aborted");
      const b = await publicClient.getBlock();
      if (b.timestamp >= endsAt + 1n) return;
      await sleep(2000);
    }
  };

  const _approveHookExact = useCallback(
    async (token: `0x${string}`, amount: bigint) => {
      if (!address) return;
      const a = (await publicClient.readContract({
        address: token,
        abi: ERC20_ABI,
        functionName: "allowance",
        args: [address, HOOK],
      })) as bigint;
      if (a >= amount) return;
      const wallet = walletClientFrom(getEthereum());
      await simulate({
        address: token,
        abi: ERC20_ABI as never,
        functionName: "approve",
        args: [HOOK, amount],
        account: address,
      });
      const h = await wallet.writeContract({
        address: token,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [HOOK, amount],
        account: address,
      });
      await publicClient.waitForTransactionReceipt({ hash: h });
    },
    [address],
  );

  const onBatchPlace = useCallback(
    async (zeroForOne: boolean, amount: bigint) => {
      if (!address) return;
      const token = zeroForOne ? TOKEN0 : TOKEN1;
      setBusy("batch-place");
      try {
        await _approveHookExact(token, amount);
        await simulate({
          address: HOOK,
          abi: HOOK_ABI as never,
          functionName: "placeBatchOrder",
          args: [[TOKEN0, TOKEN1, POOL_KEY.fee, POOL_KEY.tickSpacing, POOL_KEY.hooks], zeroForOne, amount],
          account: address,
        });
        const wallet = walletClientFrom(getEthereum());
        const h = await wallet.writeContract({
          address: HOOK,
          abi: HOOK_ABI,
          functionName: "placeBatchOrder",
          args: [[TOKEN0, TOKEN1, POOL_KEY.fee, POOL_KEY.tickSpacing, POOL_KEY.hooks], zeroForOne, amount] as never,
          account: address,
        });
        await publicClient.waitForTransactionReceipt({ hash: h });
        sonnerToast.success(
          `Queued for the current epoch — custody taken by the hook, cancellable until clear.`,
          { action: { label: "tx", onClick: () => window.open(explorerTx(h), "_blank") } },
        );
        refreshAll();
      } catch (e) {
        sonnerToast.error(`Batch enqueue failed: ${revertReason(e)}`);
      } finally {
        setBusy(null);
      }
    },
    [address, _approveHookExact, refreshAll],
  );

  const onBatchCancel = useCallback(
    async (epoch: bigint, index: bigint) => {
      if (!address) return;
      setBusy("batch-cancel");
      try {
        const wallet = walletClientFrom(getEthereum());
        const h = await wallet.writeContract({
          address: HOOK,
          abi: HOOK_ABI,
          functionName: "cancelBatchOrder",
          args: [POOL_ID, epoch, index],
          account: address,
        });
        await publicClient.waitForTransactionReceipt({ hash: h });
        sonnerToast.success("Order cancelled — deposit returned.");
        refreshAll();
      } catch (e) {
        sonnerToast.error(`Cancel failed: ${revertReason(e)}`);
      } finally {
        setBusy(null);
      }
    },
    [address, refreshAll],
  );

  const onClearEpoch = useCallback(
    async (epoch: bigint) => {
      if (!address) return;
      setBusy("batch-clear");
      try {
        await simulate({
          address: HOOK,
          abi: HOOK_ABI as never,
          functionName: "clearBatch",
          args: [[TOKEN0, TOKEN1, POOL_KEY.fee, POOL_KEY.tickSpacing, POOL_KEY.hooks], epoch],
          account: address,
        });
        const wallet = walletClientFrom(getEthereum());
        const h = await wallet.writeContract({
          address: HOOK,
          abi: HOOK_ABI,
          functionName: "clearBatch",
          args: [[TOKEN0, TOKEN1, POOL_KEY.fee, POOL_KEY.tickSpacing, POOL_KEY.hooks], epoch] as never,
          account: address,
        });
        await publicClient.waitForTransactionReceipt({ hash: h });
        setLastClearEpoch(epoch);
        sonnerToast.success(`Epoch ${epoch} cleared — uniform price set by the epoch TWAP.`, {
          action: { label: "tx", onClick: () => window.open(explorerTx(h), "_blank") },
        });
        refreshAll();
      } catch (e) {
        sonnerToast.error(`Clear failed: ${revertReason(e)}`);
      } finally {
        setBusy(null);
      }
    },
    [address, refreshAll],
  );

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
    ): Promise<{
      tradeId: `0x${string}`;
      hash: Hash;
      settleAfter: bigint;
      blockNumber: bigint;
    }> => {
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
      // The trade's own settleAfter from storage — the demo clock is chain
      // time, never wall clock.
      const t = (await publicClient.readContract({
        address: HOOK,
        abi: HOOK_ABI,
        functionName: "trades",
        args: [d.args.tradeId],
      })) as unknown as { settleAfter: bigint | number };
      return {
        tradeId: d.args.tradeId,
        hash: h,
        settleAfter: BigInt(t.settleAfter),
        blockNumber: rc.blockNumber,
      };
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

  // Full-range MINT_POSITION + SETTLE_PAIR on the official PositionManager —
  // exact encodings from the canonical fork suite / deploy script era.
  const MINT_ACTIONS = "0x020d"; // Actions.MINT_POSITION, Actions.SETTLE_PAIR
  const MINT_PARAMS = parseAbiParameters(
    "(address,address,uint24,int24,address),int24,int24,uint256,uint128,uint128,address,bytes",
  );
  const SETTLE_PAIR_PARAMS = parseAbiParameters("address,address");
  // PosM decodes liquidity as uint256 and negates internally — pass positive.
  const DECREASE_PARAMS = parseAbiParameters("uint256,uint256,uint128,uint128,bytes");
  const CLOSE_PARAMS = parseAbiParameters("address");
  const TAKE_PARAMS = parseAbiParameters("address,address,address");
  const LIQ_DATA_PARAMS = parseAbiParameters("bytes,bytes[]");

  const modifyLiquiditiesTx = useCallback(
    async (actions: `0x${string}`, params: `0x${string}`[]): Promise<`0x${string}`> => {
      if (!address) throw new Error("connect first");
      const wallet = walletClientFrom(getEthereum());
      const data = encodeAbiParameters(LIQ_DATA_PARAMS, [actions, params]);
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 600);
      await simulate({
        address: POSITION_MANAGER,
        abi: POSM_ABI as never,
        functionName: "modifyLiquidities",
        args: [data, deadline],
        account: address,
      });
      return wallet.writeContract({
        address: POSITION_MANAGER,
        abi: POSM_ABI,
        functionName: "modifyLiquidities",
        args: [data, deadline],
        account: address,
      });
    },
    [address],
  );

  const onLpAdd = useCallback(
    async (amount0: bigint, amount1: bigint) => {
      if (!address) return;
      if (sqrtX96 === null) {
        sonnerToast.error("Live pool price not loaded yet — retry in a moment.");
        return;
      }
      const wallet = walletClientFrom(getEthereum());
      setLpBusy("setup");
      try {
        const needed: [`0x${string}`, bigint][] = [
          [TOKEN0, amount0],
          [TOKEN1, amount1],
        ];
        for (let i = 0; i < needed.length; i++) {
          const [token, amt] = needed[i];
          // 1. ERC20 -> Permit2, exact amount only.
          const erc20Allowance = (await publicClient.readContract({
            address: token as `0x${string}`,
            abi: ERC20_ABI,
            functionName: "allowance",
            args: [address, PERMIT2],
          })) as bigint;
          if (erc20Allowance < amt) {
            setLpBusy(`approve-${i}`);
            await simulate({
              address: token as `0x${string}`,
              abi: ERC20_ABI as never,
              functionName: "approve",
              args: [PERMIT2, amt],
              account: address,
            });
            const h = await wallet.writeContract({
              address: token as `0x${string}`,
              abi: ERC20_ABI,
              functionName: "approve",
              args: [PERMIT2, amt],
              account: address,
            });
            await publicClient.waitForTransactionReceipt({ hash: h });
          }
          // 2. Permit2 -> PositionManager, exact amount, 1 h expiry.
          const p2 = (await publicClient.readContract({
            address: PERMIT2,
            abi: PERMIT2_ABI,
            functionName: "allowance",
            args: [address, token as `0x${string}`, POSITION_MANAGER],
          })) as unknown as { amount: bigint; expiration: bigint };
          const now = BigInt(Math.floor(Date.now() / 1000));
          if (p2.amount < amt || p2.expiration < now + 60n) {
            setLpBusy(`permit2-${i}`);
            await simulate({
              address: PERMIT2,
              abi: PERMIT2_ABI as never,
              functionName: "approve",
              args: [token, POSITION_MANAGER, amt, now + 3600n],
              account: address,
            });
            const h = await wallet.writeContract({
              address: PERMIT2,
              abi: PERMIT2_ABI,
              functionName: "approve",
              args: [token, POSITION_MANAGER, amt, now + 3600n] as never,
              account: address,
            });
            await publicClient.waitForTransactionReceipt({ hash: h });
          }
        }

        setLpBusy("mint");
        const liquidity = liquidityForAmounts(sqrtX96, amount0, amount1);
        if (liquidity === 0n) {
          sonnerToast.error("Amounts too small to mint liquidity.");
          return;
        }
        const params: `0x${string}`[] = [
          encodeAbiParameters(
            MINT_PARAMS,
            [
              [TOKEN0, TOKEN1, POOL_KEY.fee, POOL_KEY.tickSpacing, POOL_KEY.hooks],
              TICK_BOUND_LOWER,
              TICK_BOUND_UPPER,
              liquidity,
              amount0,
              amount1,
              address,
              "0x",
            ] as never,
          ),
          encodeAbiParameters(SETTLE_PAIR_PARAMS, [TOKEN0, TOKEN1]),
        ];
        const h = await modifyLiquiditiesTx(MINT_ACTIONS as `0x${string}`, params);
        const rc = await publicClient.waitForTransactionReceipt({ hash: h });
        const transfer = rc.logs.find(
          (l) =>
            l.address.toLowerCase() === POSITION_MANAGER.toLowerCase() &&
            l.topics[0] === ERC721_TRANSFER_TOPIC &&
            l.topics[1] ===
              "0x0000000000000000000000000000000000000000000000000000000000000000",
        );
        if (!transfer || !transfer.topics[3]) throw new Error("no position minted");
        const tokenId = BigInt(transfer.topics[3]);
        window.localStorage.setItem(`markout:lpTokenId:${address.toLowerCase()}`, tokenId.toString());
        setLpTokenId(tokenId);
        sonnerToast.success(
          "Full-range position minted through the official PositionManager — you are now an LP in this pool.",
          { action: { label: "tx", onClick: () => window.open(explorerTx(h), "_blank") } },
        );
        refreshAll();
      } catch (e) {
        sonnerToast.error(`LP add failed: ${revertReason(e)}`);
      } finally {
        setLpBusy(null);
      }
    },
    [address, sqrtX96, modifyLiquiditiesTx, refreshAll],
  );

  const onLpRemoveAll = useCallback(async () => {
    if (!address || lpTokenId === null || lpLiquidity === null || lpLiquidity === 0n) return;
    setLpBusy("remove");
    try {
      const actions = "0x01121211"; // DECREASE, CLOSE cur0, CLOSE cur1, TAKE_PAIR
      const params: `0x${string}`[] = [
        encodeAbiParameters(DECREASE_PARAMS, [lpTokenId, lpLiquidity, 0n, 0n, "0x"] as never),
        encodeAbiParameters(CLOSE_PARAMS, [TOKEN0]),
        encodeAbiParameters(CLOSE_PARAMS, [TOKEN1]),
        encodeAbiParameters(TAKE_PARAMS, [TOKEN0, TOKEN1, address]),
      ];
      const h = await modifyLiquiditiesTx(actions as `0x${string}`, params);
      await publicClient.waitForTransactionReceipt({ hash: h });
      sonnerToast.success("Liquidity removed and tokens returned to your wallet.", {
        action: { label: "tx", onClick: () => window.open(explorerTx(h), "_blank") } },
      );
      refreshAll();
    } catch (e) {
      sonnerToast.error(`LP remove failed: ${revertReason(e)}`);
    } finally {
      setLpBusy(null);
    }
  }, [address, lpTokenId, lpLiquidity, modifyLiquiditiesTx, refreshAll]);

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
      await approveAll(TOKEN0, DEMO_BUY + (DEMO_BUY * premiumBps) / 10000n);
      await approveAll(TOKEN1, DEMO_REVERSE + (DEMO_REVERSE * premiumBps) / 10000n);

      sonnerToast.info("DEMO 1/5 — organic swap (1 MDA in)…");
      const first = await doSwapTx(DEMO_BUY, true, 0n);
      setActiveId(first.tradeId);

      // The first swap is already mined (we hold its receipt), so publishing
      // the reverse immediately usually lands it in the NEXT block. Verify
      // the landing and say the truth when MetaMask/the mempool was slow —
      // the verdict itself is decided by the window, never by this copy.
      sonnerToast.info("DEMO 2/5 — reversing 1:1 into the next block…");
      const second = await doSwapTx(DEMO_REVERSE, false, 0n);
      if (second.blockNumber > first.blockNumber + 1n) {
        sonnerToast.warning(
          `Heads up: the reverse landed ${second.blockNumber - first.blockNumber} blocks after the buy, not the next block. ` +
            "The classifier judges the actual window — this run may not be the canonical 1:1 next-block refund.",
        );
      }

      sonnerToast.info("DEMO 3/5 — waiting out the fixed 24 s window (chain time)…");
      await waitWindow(first.settleAfter + 1n);

      sonnerToast.info("DEMO 4/5 — settling…");
      const outcome = await onSettle(first.tradeId);
      if (outcome === 1) {
        sonnerToast.success("DEMO 5/5 — REFUND: premium paid back to the trader at settlement.");
      } else if (outcome === 2) {
        sonnerToast.info("DEMO 5/5 — REFUND verdict, delivery failed in this run; claiming…");
        await onClaim(first.tradeId);
      } else if (outcome === 3) {
        sonnerToast.warning(
          "DEMO 5/5 — settled DONATE, not refund: the window did not revert past half this run. Not a win; the classifier told the truth.",
        );
      } else {
        sonnerToast.error("DEMO 5/5 — settle did not record a verdict.");
      }
    } catch (e) {
      sonnerToast.error(`Demo aborted: ${revertReason(e)}`);
    } finally {
      setPilot(null);
      setBusy(null);
    }
  }, [address, sellBal, doSwapTx, onSettle, onClaim]);

  /// One-wallet netting demo: enqueue a buy and a value-paired sell into the
  /// SAME epoch, wait out the epoch on chain time, clear it permissionlessly,
  /// and report the uniform clearing from the BatchCleared event. Real
  /// on-chain opposing orders — no mock, no second wallet required.
  const demoBatchNet = useCallback(async () => {
    if (!address) return;
    pilotAbort.current = false;
    setPilot("donate");
    setBusy("demo");
    try {
      const buyAmt = 5n * 10n ** 17n; // 0.5 MDA
      if ((sellBal ?? 0n) < buyAmt) {
        sonnerToast.error("Need ~0.5 MDA for the batch demo — mint first.");
        return;
      }
      const p = (await publicClient.readContract({
        address: HOOK,
        abi: HOOK_ABI,
        functionName: "batchPreview",
        args: [POOL_ID],
      })) as unknown as [bigint, bigint, bigint, bigint, bigint];
      if (p[2] !== 0n) {
        sonnerToast.error("Current epoch already has orders — clear it first or wait for the next epoch.");
        return;
      }
      // Pair the sell at the live price so the epoch nets.
      const priceNow = sqrtX96 ? Number((sqrtX96 * sqrtX96) / (1n << 192n)) : null;
      if (!priceNow) {
        sonnerToast.error("Live price not loaded yet — retry in a moment.");
        return;
      }
      const sellAmt = BigInt(Math.round(Number(buyAmt) * priceNow));

      sonnerToast.info("BATCH 1/4 — enqueueing buy + value-paired sell into this epoch…");
      await onBatchPlace(true, buyAmt);
      await onBatchPlace(false, sellAmt);

      sonnerToast.info("BATCH 2/4 — waiting out the epoch (chain time)…");
      await waitEpoch(p[1]);

      sonnerToast.info("BATCH 3/4 — clearing the epoch (permissionless)…");
      const wallet = walletClientFrom(getEthereum());
      const h = await wallet.writeContract({
        address: HOOK,
        abi: HOOK_ABI,
        functionName: "clearBatch",
        args: [[TOKEN0, TOKEN1, POOL_KEY.fee, POOL_KEY.tickSpacing, POOL_KEY.hooks], p[0]] as never,
        account: address,
      });
      const rc = await publicClient.waitForTransactionReceipt({ hash: h });
      const cleared = rc.logs.find((l) => l.topics[0] === TOPICS.batchCleared);
      if (!cleared) throw new Error("no BatchCleared event");

      sonnerToast.info("BATCH 4/4 — epoch cleared at the uniform TWAP.");
      sonnerToast.success("Batch demo complete: opposing orders netted, both sides filled at one price.", {
        action: { label: "tx", onClick: () => window.open(explorerTx(h), "_blank") },
      });
      setLastClearEpoch(p[0]);
      refreshAll();
    } catch (e) {
      sonnerToast.error(`Batch demo aborted: ${revertReason(e)}`);
    } finally {
      setPilot(null);
      setBusy(null);
    }
  }, [address, sellBal, onBatchPlace, refreshAll]);

  const demoDonate = useCallback(async () => {
    if (!address) return;
    pilotAbort.current = false;
    setPilot("donate");
    setBusy("demo");
    try {
      if ((sellBal ?? 0n) < DEMO_BUY + (DEMO_BUY * premiumBps) / 10000n) {
        sonnerToast.error("Need ~1.02 MDA for the demo — mint first.");
        return;
      }
      sonnerToast.info("DEMO 1/4 — single-shot swap, no reversion behind it…");
      const first = await doSwapTx(DEMO_BUY, true, 0n);
      setActiveId(first.tradeId);

      sonnerToast.info("DEMO 2/4 — waiting out the fixed 24 s window (chain time)…");
      await waitWindow(first.settleAfter + 1n);

      sonnerToast.info("DEMO 3/4 — settling (expect DONATE)…");
      const outcome = await onSettle(first.tradeId);
      if (outcome !== 3) {
        sonnerToast.warning(
          outcome === 1 || outcome === 2
            ? "Not a donate this run — someone else's flow moved the pool back inside the window. Skipping the flush; nothing was donated."
            : "Settle did not record a donate — skipping the flush.",
        );
        return;
      }

      sonnerToast.info("DEMO 4/4 — flushing the LP donation…");
      await onFlush();
    } catch (e) {
      sonnerToast.error(`Demo aborted: ${revertReason(e)}`);
    } finally {
      setPilot(null);
      setBusy(null);
    }
  }, [address, sellBal, doSwapTx, onSettle, onFlush]);

  const wrongChain = address !== undefined && chainId !== 11155111;

  const value: MarkoutState = {
    address,
    chainId,
    hasProvider,
    onConnect,
    onDisconnect: disconnect,
    onSwitchAccount: async () => {
      await switchAccount();
    },
    connBusy,
    switchNetwork,
    wrongChain,
    price,
    liveTick,
    chainNow,
    rpcOk,
    trace,
    traction,
    poolLiquidity,
    pending0,
    pending1,
    sqrtX96,
    lpTokenId,
    lpLiquidity,
    lpBusy,
    onLpAdd,
    onLpRemoveAll,
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
    premiumBps,
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
    batch: batchPreviewState,
    myOrders,
    lastClearEpoch,
    onBatchPlace,
    onBatchCancel,
    onClearEpoch,
    demoBatchNet,
    refreshAll,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

// re-export for pages that import toast from the provider module
export { sonnerToast as toast, formatTokens };

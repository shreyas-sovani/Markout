"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
  FEE,
  HOOK,
  HOOK_ABI,
  MAX_SQRT_PRICE,
  MIN_SQRT_PRICE,
  POOL_MANAGER,
  POOL_MANAGER_ABI,
  PROOFS,
  ROUTER,
  ROUTER_ABI,
  RPC_URL,
  SETTLED_TOPIC,
  SLOT0_SLOT,
  SWAP_FEE_BPS,
  TICK_SPACING,
  TOKEN0,
  TOKEN1,
  explorerAddress,
  explorerTx,
  formatTokens,
  getLogsChunked,
  publicClient,
  sqrtX96ToPrice,
  walletClientFrom,
} from "@/lib/contracts";
import { useWallet, getEthereum } from "@/lib/wallet";
import { usePoll } from "@/lib/usePoll";

const MAX_UINT256 = 2n ** 256n - 1n;
const SWAP_BONDED_EVENT = parseAbiItem(
  "event SwapBonded(bytes32 indexed tradeId, address indexed trader, uint160 sqrtPre, uint160 sqrtPost, uint256 bondAmount)",
);
const MINT_SIZE = 100n * 10n ** 18n;

type Phase = "form" | "swapping" | "bonded" | "settling" | "settled";

interface ActiveTrade {
  id: `0x${string}`;
  bond: bigint;
  bondCurrency: Address;
  settleAfter: bigint;
  swapTx: Hash;
}

interface HistRow {
  id: `0x${string}`;
  bond: bigint;
  outcome: number; // 0 none, 1 refund, 2 donate
  tx: Hash;
}

function short(addr: string, n = 4): string {
  return `${addr.slice(0, 2 + n)}…${addr.slice(-n)}`;
}

// ---------------------------------------------------------------------------

export default function Page() {
  const { address, chainId, connect, disconnect, hasProvider } = useWallet();

  const [phase, setPhase] = useState<Phase>("form");
  const [zeroForOne, setZeroForOne] = useState(true);
  const [amountStr, setAmountStr] = useState("1");
  const [trade, setTrade] = useState<ActiveTrade | null>(null);
  const [verdict, setVerdict] = useState<{ outcome: number; tx: Hash } | null>(null);
  const [busy, setBusy] = useState(false);
  const [connBusy, setConnBusy] = useState(false);
  const [histVersion, setHistVersion] = useState(0);

  // ---- live pool state (price from PoolManager extsload, slot0) ----
  const [price, setPrice] = useState<number | null>(null);
  const [tick, setTick] = useState<bigint | null>(null);
  const [chainNow, setChainNow] = useState<bigint>(0n);

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
          setTick(signed);
        }
      } catch {
        /* RPC hiccup — keep last value */
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
        /* ignore */
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

  const sellToken = zeroForOne ? TOKEN0 : TOKEN1;
  const buyToken = zeroForOne ? TOKEN1 : TOKEN0;
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

  // ---- derived swap numbers ----
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
  const needsApprove =
    amountIn !== null && (allowance.data ?? 0n) < amountIn + bond;
  const estOut = useMemo(() => {
    if (!price || !amountIn) return null;
    const p = BigInt(Math.round(price * 1e6));
    const gross = zeroForOne
      ? (amountIn * p) / 10n ** 6n
      : (amountIn * 10n ** 6n) / p;
    return (gross * (10000n - SWAP_FEE_BPS)) / 10000n;
  }, [price, amountIn, zeroForOne]);

  // ---- history ----
  const [hist, setHist] = useState<HistRow[]>([]);
  useEffect(() => {
    if (!address) {
      setHist([]);
      return;
    }
    let alive = true;
    (async () => {
      try {
        const head = await publicClient.getBlockNumber();
        const from = head > 150000n ? head - 150000n : 0n;
        const logs = (await getLogsChunked({
          address: HOOK,
          event: SWAP_BONDED_EVENT,
          args: { trader: address },
          fromBlock: from,
          toBlock: head,
        })) as {
          blockNumber: bigint;
          transactionHash: `0x${string}`;
          data: `0x${string}`;
          topics: `0x${string}`[];
        }[];
        const rows: HistRow[] = [...logs]
          .sort((a, b) => Number(b.blockNumber - a.blockNumber))
          .slice(0, 12)
          .map((l) => {
            const d = decodeEventLog({
              abi: HOOK_ABI,
              data: l.data,
              topics: l.topics as never,
            }) as { args: { tradeId: `0x${string}`; bondAmount: bigint } };
            return {
              id: d.args.tradeId as `0x${string}`,
              bond: d.args.bondAmount,
              outcome: -1,
              tx: l.transactionHash,
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
          })) as unknown as { outcome: number }[];
          rows.forEach((r, i) => {
            r.outcome = Number(results[i].outcome);
          });
        }
        if (alive) setHist(rows);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      alive = false;
    };
  }, [address, histVersion]);

  // ---- countdown ----
  const remaining =
    trade && chainNow > 0n && trade.settleAfter > chainNow
      ? Number(trade.settleAfter - chainNow)
      : 0;
  const windowOpen = trade !== null && remaining > 0;

  // ---- actions ----
  const refetchBalances = useCallback(() => {
    bal0.refresh();
    bal1.refresh();
    allowance.refresh();
  }, [bal0, bal1, allowance]);

  const onConnect = async () => {
    if (!hasProvider) {
      toast.error(
        "No injected wallet found — install MetaMask or Rabby, then reload.",
      );
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

  const onMint = async () => {
    if (!address) return;
    const wallet = walletClientFrom(getEthereum());
    setBusy(true);
    try {
      for (const token of [TOKEN0, TOKEN1]) {
        const h = await wallet.writeContract({
          address: token,
          abi: ERC20_ABI,
          functionName: "mint",
          args: [address, MINT_SIZE],
          account: address,
        });
        await publicClient.waitForTransactionReceipt({ hash: h });
      }
      toast.success("Minted 100 TOKEN0 + 100 TOKEN1 (demo tokens, permissionless mint).");
      refetchBalances();
    } catch {
      toast.error("Mint failed.");
    } finally {
      setBusy(false);
    }
  };

  const onApprove = async () => {
    if (!address) return;
    const wallet = walletClientFrom(getEthereum());
    setBusy(true);
    try {
      const h = await wallet.writeContract({
        address: sellToken,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [ROUTER, MAX_UINT256],
        account: address,
      });
      await publicClient.waitForTransactionReceipt({ hash: h });
      toast.success("Approved MarkoutRouter to spend your demo tokens.");
      allowance.refresh();
    } catch {
      toast.error("Approve failed or rejected.");
    } finally {
      setBusy(false);
    }
  };

  const onSwap = async () => {
    if (!address || !amountIn) return;
    if (needsApprove) {
      toast.error("Approve the router first — it pulls the input + bond from you.");
      return;
    }
    if ((sellBal ?? 0n) < amountIn + bond) {
      toast.error(
        `Insufficient balance: need ${formatEther(amountIn + bond)} (input + bond).`,
      );
      return;
    }
    const wallet = walletClientFrom(getEthereum());
    setBusy(true);
    setPhase("swapping");
    try {
      const h = await wallet.writeContract({
        address: ROUTER,
        abi: ROUTER_ABI,
        functionName: "swap",
        args: [
          {
            currency0: TOKEN0,
            currency1: TOKEN1,
            fee: Number(FEE),
            tickSpacing: TICK_SPACING,
            hooks: HOOK,
          },
          {
            zeroForOne,
            amountSpecified: -(amountIn as bigint),
            sqrtPriceLimitX96: zeroForOne ? MIN_SQRT_PRICE : MAX_SQRT_PRICE,
          },
          "0x",
        ],
        account: address,
      });
      await publicClient.waitForTransactionReceipt({ hash: h });
      const id = (await publicClient.readContract({
        address: HOOK,
        abi: HOOK_ABI,
        functionName: "lastTradeId",
      })) as `0x${string}`;
      const t = (await publicClient.readContract({
        address: HOOK,
        abi: HOOK_ABI,
        functionName: "trades",
        args: [id],
      })) as unknown as {
        bondAmount: bigint;
        bondCurrency: Address;
        settleAfter: number;
      };
      setTrade({
        id,
        bond: t.bondAmount,
        bondCurrency: t.bondCurrency,
        settleAfter: BigInt(t.settleAfter),
        swapTx: h,
      });
      setVerdict(null);
      setPhase("bonded");
      toast.success(
        `Swap filled at 3 bps. Bond ${formatEther(t.bondAmount)} escrowed for 21 s.`,
        {
          action: {
            label: "tx",
            onClick: () => window.open(explorerTx(h), "_blank"),
          },
        },
      );
      refetchBalances();
      setHistVersion((v) => v + 1);
    } catch {
      toast.error("Swap failed or rejected.");
      setPhase("form");
    } finally {
      setBusy(false);
    }
  };

  const onSettle = async () => {
    if (!trade || windowOpen || !address) return;
    const wallet = walletClientFrom(getEthereum());
    setBusy(true);
    setPhase("settling");
    try {
      const h = await wallet.writeContract({
        address: HOOK,
        abi: HOOK_ABI,
        functionName: "settle",
        args: [trade.id],
        account: address,
      });
      const rc = await publicClient.waitForTransactionReceipt({ hash: h });
      const log = rc.logs.find(
        (l) =>
          l.address.toLowerCase() === HOOK.toLowerCase() &&
          l.topics[0] === SETTLED_TOPIC,
      );
      let outcome = 2;
      if (log) {
        const d = decodeEventLog({
          abi: HOOK_ABI,
          data: log.data,
          topics: log.topics as never,
        }) as { args: { outcome: number } };
        outcome = d.args.outcome;
      }
      setVerdict({ outcome, tx: h });
      setPhase("settled");
      setHistVersion((v) => v + 1);
      refetchBalances();
    } catch {
      toast.error("Settle failed — try again.");
      setPhase("bonded");
    } finally {
      setBusy(false);
    }
  };

  const onNewTrade = () => {
    setPhase("form");
    setTrade(null);
    setVerdict(null);
  };

  // ------------------------------------------------------------------

  const wrongChain = address !== undefined && chainId !== 11155111;

  const steps = ["SWAP", "BOND", "WAIT T", "SETTLE", "VERDICT"];
  const activeStep =
    phase === "form"
      ? 0
      : phase === "swapping"
        ? 1
        : phase === "bonded"
          ? windowOpen
            ? 2
            : 3
          : phase === "settling"
            ? 3
            : 4;

  return (
    <>
      <Toaster theme="dark" position="bottom-right" />

      <header className="top">
        <div className="top-inner">
          <div className="wordmark">
            MARKOUT<span className="tick">▪</span>
          </div>
          <div className="top-tag">MEV protection by mean reversion</div>
          <div className="top-spacer" />
          <span className="chain-chip">SEPOLIA · LIVE</span>
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

      <main className="wrap">
        {/* ---------------------------------------------------- hero */}
        <section className="hero">
          <div className="kicker">
            Uniswap v4 hook · sustainable liquidity &amp; MEV protection
          </div>
          <h1>
            Continuation-flow MEV filters miss single-shot arbitrage.
            Markout judges a trade by whether its price{" "}
            <span className="stays">stays</span>.
          </h1>
          <p className="hero-sub">
            Swaps fill <strong>immediately at 3 bps</strong> while a{" "}
            <strong>20 bps input bond</strong> is escrowed for a{" "}
            <strong>21 s</strong> window. If the pool price{" "}
            <strong>reverts &gt; 5 bps</strong> toward its pre-swap level, the
            trade was organic — the bond is <strong>refunded</strong>. If the
            price <strong>sustains</strong>, the trade was informed price
            discovery — the bond is <strong>donated to in-range LPs</strong>.
            Settlement is permissionless and oracle-free: anyone may call{" "}
            <code>settle()</code> once the window closes.
          </p>

          <div className="band">
            <div className="band-cell">
              <div className="band-value">
                3<span className="unit">bps</span>
              </div>
              <div className="band-label">fill fee</div>
            </div>
            <div className="band-cell">
              <div className="band-value">
                20<span className="unit">bps</span>
              </div>
              <div className="band-label">bond escrow</div>
            </div>
            <div className="band-cell">
              <div className="band-value">
                5<span className="unit">bps</span>
              </div>
              <div className="band-label">reversion threshold</div>
            </div>
            <div className="band-cell">
              <div className="band-value">
                21<span className="unit">s</span>
              </div>
              <div className="band-label">settlement window</div>
            </div>
            <div className="band-cell">
              <div className="band-value">
                16<span className="unit">/16</span>
              </div>
              <div className="band-label">forge tests</div>
            </div>
            <div className="band-cell">
              <div className="band-value">
                2<span className="unit">tx</span>
              </div>
              <div className="band-label">
                <a href="#proofs">live proofs ↗</a>
              </div>
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------- main grid */}
        <div className="grid">
          {/* ------------------------------------------- swap console */}
          <section className="card">
            <div className="card-head">
              <div className="card-title">Swap console</div>
              <div className="card-note">
                demo pool TOKEN0/TOKEN1 · 1:1 · permissionless mint
              </div>
            </div>
            <div className="card-body">
              {!address ? (
                <div className="connect-call">
                  <p>
                    Connect an injected wallet (MetaMask, Rabby, Brave) on
                    Sepolia. You&apos;ll get demo tokens with one click, then
                    swap, watch the 21 s window, and settle.
                  </p>
                  <button className="btn btn-primary" onClick={onConnect} disabled={connBusy}>
                    {connBusy ? "connecting…" : "connect wallet"}
                  </button>
                </div>
              ) : wrongChain ? (
                <div className="connect-call">
                  <p className="warn">
                    Wrong network — switch your wallet to Sepolia (11155111).
                  </p>
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
                      disabled={phase !== "form"}
                    />
                    <div className="token-side">
                      <div className="token-name">
                        {zeroForOne ? "TOKEN 0" : "TOKEN 1"}
                      </div>
                      <div className="token-addr">
                        {short(zeroForOne ? TOKEN0 : TOKEN1)}
                      </div>
                    </div>
                    <div className="token-balance">
                      <span>balance {formatTokens(sellBal ?? 0n)}</span>
                      <button className="btn btn-ghost btn-sm" onClick={onMint} disabled={busy}>
                        +100 each
                      </button>
                    </div>
                  </div>

                  <div className="flip">
                    <button
                      onClick={() => setZeroForOne((z) => !z)}
                      disabled={phase !== "form"}
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
                      <div className="token-name">
                        {zeroForOne ? "TOKEN 1" : "TOKEN 0"}
                      </div>
                      <div className="token-addr">
                        {short(zeroForOne ? TOKEN1 : TOKEN0)}
                      </div>
                    </div>
                    <div className="token-balance">
                      <span>balance {formatTokens(buyBal ?? 0n)}</span>
                    </div>
                  </div>

                  <div className="quote-lines">
                    <div className="quote-line">
                      <span>fill fee</span>
                      <span className="v">3 bps · immediate</span>
                    </div>
                    <div className="quote-line">
                      <span>bond escrowed 21 s (20 bps)</span>
                      <span className="v bond">
                        {amountIn ? formatTokens(bond, 6) : "—"}
                      </span>
                    </div>
                    <div className="quote-line">
                      <span>bond if price reverts &gt; 5 bps</span>
                      <span className="v pos">refunded</span>
                    </div>
                    <div className="quote-line">
                      <span>bond if price sustains</span>
                      <span className="v bond">donated to LPs</span>
                    </div>
                  </div>

                  {tooSmall && (
                    <p className="warn" style={{ marginBottom: 10 }}>
                      Swap too small — a 20 bps bond of this amount rounds to
                      zero and the hook reverts with SwapTooSmall.
                    </p>
                  )}

                  <div className="action-stack">
                    {phase === "form" && needsApprove && !tooSmall && (
                      <button className="btn" onClick={onApprove} disabled={busy || !amountIn}>
                        approve router
                      </button>
                    )}
                    {phase === "form" && (
                      <button
                        className="btn btn-primary"
                        onClick={onSwap}
                        disabled={busy || !amountIn || tooSmall || needsApprove}
                      >
                        {busy ? "signing…" : "swap + post bond"}
                      </button>
                    )}
                  </div>

                  <p className="tx-note">
                    the router pulls input + bond from you — net cost for an
                    organic trade is the 3 bps fee, the bond returns on refund
                  </p>
                </>
              )}
            </div>
          </section>

          {/* ------------------------------------------- oracle panel */}
          <section className="card">
            <div className="card-head">
              <div className="card-title">Mean-reversion oracle</div>
              <div className="card-note">
                <span className="pulse" />
                {address ? "tracking" : "read-only"}
              </div>
            </div>
            <div className="card-body">
              <div className="live-row">
                <span className="k">pool price</span>
                <span className="v">{price ? price.toFixed(6) : "…"} T1/T0</span>
              </div>
              <div className="live-row">
                <span className="k">tick</span>
                <span className="v">{tick !== null ? tick.toString() : "…"}</span>
              </div>
              <div className="live-row">
                <span className="k">window / threshold</span>
                <span className="v">21 s · 5 bps</span>
              </div>

              <div className="stepper">
                {steps.map((s, i) => (
                  <div
                    key={s}
                    className={
                      "step " +
                      (i < activeStep ? "done" : i === activeStep ? "active" : "")
                    }
                  >
                    <div className="step-dot">{i < activeStep ? "✓" : i + 1}</div>
                    <div className="step-label">{s}</div>
                  </div>
                ))}
              </div>

              {trade && phase !== "form" ? (
                <>
                  <div className="countdown">
                    <div className={"countdown-time" + (windowOpen ? "" : " ready")}>
                      {phase === "settled" || verdict
                        ? "SETTLED"
                        : phase === "settling"
                          ? "···"
                          : `${remaining}s`}
                    </div>
                    <div className="countdown-label">
                      {phase === "bonded" && windowOpen
                        ? "settlement window — price decides your bond's fate"
                        : phase === "bonded"
                          ? "window closed — anyone may settle"
                          : phase === "settling"
                            ? "settling on-chain"
                            : "trade settled"}
                    </div>
                  </div>

                  {verdict ? (
                    <div className={"verdict " + (verdict.outcome === 1 ? "refund" : "donate")}>
                      <div className="verdict-word">
                        {verdict.outcome === 1 ? "REFUND" : "DONATE"}
                      </div>
                      <div className="verdict-sub">
                        {verdict.outcome === 1
                          ? `price reverted — ${formatTokens(trade.bond, 6)} bond returned to you`
                          : `price sustained — ${formatTokens(trade.bond, 6)} bond socialized to in-range LPs`}
                      </div>
                      <a href={explorerTx(verdict.tx)} target="_blank" rel="noreferrer">
                        settle tx ↗
                      </a>
                      <div>
                        <button
                          className="btn btn-ghost btn-sm"
                          style={{ marginTop: 12 }}
                          onClick={onNewTrade}
                        >
                          new trade
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="action-stack">
                      <button
                        className="btn btn-primary"
                        onClick={onSettle}
                        disabled={busy || windowOpen || phase === "settling"}
                      >
                        {windowOpen
                          ? `wait ${remaining}s`
                          : phase === "settling"
                            ? "settling…"
                            : "settle(tradeId) — anyone can"}
                      </button>
                      <a
                        href={explorerTx(trade.swapTx)}
                        target="_blank"
                        rel="noreferrer"
                        style={{ textAlign: "center", fontSize: 11 }}
                      >
                        swap tx ↗
                      </a>
                    </div>
                  )}

                  <p className="tx-note">trade id {short(trade.id, 10)}</p>
                </>
              ) : (
                <p className="empty">no active trade — swap to bond one</p>
              )}
            </div>
          </section>
        </div>

        {/* ---------------------------------------------------- history */}
        <section className="section">
          <div className="section-title">Your bonded trades</div>
          <div className="card">
            {hist.length === 0 ? (
              <div className="empty">
                {address
                  ? "no SwapBonded events for this wallet in recent blocks"
                  : "connect a wallet to load your trade history"}
              </div>
            ) : (
              <table className="hist">
                <thead>
                  <tr>
                    <th>trade id</th>
                    <th>bond</th>
                    <th>outcome</th>
                    <th>tx</th>
                  </tr>
                </thead>
                <tbody>
                  {hist.map((r) => (
                    <tr key={r.id}>
                      <td className="mono-strong">{short(r.id, 8)}</td>
                      <td>{formatTokens(r.bond, 6)}</td>
                      <td>
                        {r.outcome === 1 ? (
                          <span className="badge refund">refund</span>
                        ) : r.outcome === 2 ? (
                          <span className="badge donate">donate</span>
                        ) : (
                          <span className="badge pending">settlement window</span>
                        )}
                      </td>
                      <td>
                        <a href={explorerTx(r.tx)} target="_blank" rel="noreferrer">
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
              <span className="k">PoolManager</span>
              <a href={explorerAddress(POOL_MANAGER)} target="_blank" rel="noreferrer">
                {short(POOL_MANAGER, 6)} ↗
              </a>
            </div>
            <div className="foot-row">
              <span className="k">Demo tokens</span>
              <span>
                {short(TOKEN0)} · {short(TOKEN1)} (ERC-20 mocks, permissionless
                mint)
              </span>
            </div>
          </div>
          <div>
            <div className="foot-row">
              <span className="k">Live refund</span>
              <a href={explorerTx(PROOFS.refundSettle)} target="_blank" rel="noreferrer">
                Settled(Refund) ↗
              </a>
            </div>
            <div className="foot-row">
              <span className="k">Live donate</span>
              <a href={explorerTx(PROOFS.donateSettle)} target="_blank" rel="noreferrer">
                Settled(Donate) + Donate ↗
              </a>
            </div>
            <div className="foot-row">
              <span className="k">RPC</span>
              <span>{RPC_URL.replace("https://", "")}</span>
            </div>
          </div>
          <p className="foot-note">
            The PoolManager above is this project&apos;s own v4 deployment (not
            the canonical Sepolia PoolManager) — the hook is a standard Uniswap
            v4 hook against it. Donated bonds socialize to the LPs currently
            in range, not necessarily the LPs who took the toxic trade. The
            oracle is entirely hook-local: pool prices plus a hook-maintained
            time-weighted accumulator — no external feeds, no keepers required
            for correctness.
          </p>
        </footer>
      </main>
    </>
  );
}

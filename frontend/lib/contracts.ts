import {
  createPublicClient,
  createWalletClient,
  custom,
  fallback,
  http,
  keccak256,
  concat,
  pad,
  toHex,
} from "viem";
import { sepolia } from "viem/chains";

// ---------------------------------------------------------------------------
// Deployment (2026-09-02 stack-refactor cut — canonical Sepolia v4, all Etherscan-verified)
// ---------------------------------------------------------------------------

export const CHAIN_ID = 11155111;
export const APP_URL = "https://markout-nine.vercel.app";

/** Canonical Uniswap v4 Sepolia PoolManager (docs.uniswap.org). */
export const POOL_MANAGER = "0xE03A1074c86CFeDd5C142C4F04F1a1536e203543" as const;
export const HOOK = "0x1e9A034B21Ab19D00556B429C281F9B29d8Bb0cC" as const;
export const ROUTER = "0xf06737dcBa252D276deCc0f6f0F2102aD20c7535" as const;
export const BATCH_ROUTER = "0xC9aab8CaD29BE99A36653Ec5A6d78278c84D4067" as const;
export const TOKEN0 = "0x41A9c2d06770375a41b94aBC94bcf0CD14320060" as const; // MDB (currency0)
export const TOKEN1 = "0xae0Fe2707a76EC31AB64Dc29557bdBEE9f1A5F5A" as const; // MDA

export const FEE = 300n; // 3 bps
export const TICK_SPACING = 60;
export const SWAP_FEE_BPS = 3n;
/** Default / genesis premium. Live charge is `premiumBps` on the hook (5–60). */
export const BOND_BPS = 20n;
export const SETTLEMENT_DELAY = 24;
export const MIN_SQRT_PRICE = 4295128741n; // TickMath.MIN_SQRT_PRICE + 1
export const MAX_SQRT_PRICE =
  1461446703485210103287273052203988822378723970340n; // MAX - 1

export const POOL_KEY = {
  currency0: TOKEN0,
  currency1: TOKEN1,
  fee: Number(FEE),
  tickSpacing: TICK_SPACING,
  hooks: HOOK,
} as const;

// PoolId = keccak256(abi.encode(PoolKey)) — five padded 32-byte words.
export const POOL_ID = keccak256(
  concat([
    pad(TOKEN0.toLowerCase() as `0x${string}`),
    pad(TOKEN1.toLowerCase() as `0x${string}`),
    pad(toHex(FEE, { size: 32 })),
    pad(toHex(TICK_SPACING, { size: 32 })),
    pad(HOOK.toLowerCase() as `0x${string}`),
  ]),
);

// v4 StateLibrary: pools mapping at slot 6; slot0 =
// keccak256(abi.encodePacked(poolId, bytes32(uint256(6)))).
export const SLOT0_SLOT = keccak256(
  concat([POOL_ID, pad(toHex(6, { size: 32 }))]),
);

// Pool.State layout from the pinned v4-core: slot0(+0), feeGrowthGlobal0(+1),
// feeGrowthGlobal1(+2), liquidity(+3). In-range liquidity is pool-wide (not
// per-position), which is exactly what the LP seat wants to show.
export const LIQUIDITY_SLOT =
  "0x" +
  (BigInt(SLOT0_SLOT) + 3n).toString(16).padStart(64, "0") as `0x${string}`;

// Live proof pack (2026-09-01 two-lane cut, canonical PoolManager, all our
// txs): exact next-block reversion refunds at settle; unreversed swap donates
// AND credits in-range LPs inside the settle tx; a two-sided batch epoch nets
// at one uniform TWAP price with a dust-bounded residual.
export const PROOFS = {
  refundSwap: "0x2636c8c8df9b1dc7ede26555362f61af41b54f8b3adecdb4705dedac8740f9ff",
  refundReverse: "0x0e76a1cc0f05473be6c4f479d3fd103a21d297c9b5fc7db880df6d3174f89c60",
  refundSettle: "0xe354716c3e82b3e3c20d4a99a69fe10683cc230d23f9cff4861180ed935a10ff",
  donateSwap: "0x1491a672f945c1a8bed55619aa86fdddcb841dd944b600929b9950401a579a0a",
  donateSettleCredited: "0xda7098878fae81aff0b38828ee8773baaa9069c6492ffb74867e66b46b95b189",
  batchBuyOrder: "0x76ce04bf556e8c1c8d52021c27236c4827497121b5b94430cf509d87a45e275d",
  batchSellOrder: "0x19f6b89604b55ddfe4a88836168237fbc18faa1816e080332bd378f051d381c5",
  batchClear: "0xdb3a18f65e6207084b25c924082d21272c49228b3e2b018be01dc5d13ee30109",
};

// Event topics (keccak of signatures).
export const TOPICS = {
  swapBonded:
    "0x5d6006d8592645dcc3aeb6a498b78121ff39f7993c9179e6444921228d7c4b51",
  settled: "0x6c52fe296327271b634ad6076ce552d2fb661a4e996661f45c000f218f52e74e",
  refundClaimed:
    "0xe950d47bcc1a745a8ef1d8b86486b400a99681910425d126eb1a006d61f341b2",
  batchOrderPlaced:
    "0x8b6d242f4e31b47025595c8c10672f15f96fce09d5ebf331ce122573c91b0623",
  batchCleared:
    "0x7cf96d8f3c9fd3e906b083394870fc9b265ee7fd495a5bbf6e41a92d4e76984d",
} as const;

// ---------------------------------------------------------------------------
// ABIs
// ---------------------------------------------------------------------------

export const ERC20_ABI = [
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "allowance",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "approve",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ type: "bool" }],
  },
  {
    type: "function",
    name: "mint",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "symbol",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "string" }],
  },
] as const;

export const ROUTER_ABI = [
  {
    type: "function",
    name: "swap",
    stateMutability: "payable",
    inputs: [
      {
        name: "key",
        type: "tuple",
        components: [
          { name: "currency0", type: "address" },
          { name: "currency1", type: "address" },
          { name: "fee", type: "uint24" },
          { name: "tickSpacing", type: "int24" },
          { name: "hooks", type: "address" },
        ],
      },
      {
        name: "params",
        type: "tuple",
        components: [
          { name: "zeroForOne", type: "bool" },
          { name: "amountSpecified", type: "int256" },
          { name: "sqrtPriceLimitX96", type: "uint160" },
        ],
      },
      { name: "minAmountOut", type: "uint256" },
      { name: "deadline", type: "uint256" },
    ],
    outputs: [{ name: "delta", type: "int256" }],
  },
] as const;

export const HOOK_ABI = [
  {
    type: "function",
    name: "settle",
    stateMutability: "nonpayable",
    inputs: [{ name: "tradeId", type: "bytes32" }],
    outputs: [],
  },
  {
    type: "function",
    name: "claimRefund",
    stateMutability: "nonpayable",
    inputs: [{ name: "tradeId", type: "bytes32" }],
    outputs: [{ type: "bool" }],
  },
  {
    type: "function",
    name: "flushDonation",
    stateMutability: "nonpayable",
    inputs: [{ name: "poolId", type: "bytes32" }],
    outputs: [],
  },
  {
    type: "function",
    name: "poke",
    stateMutability: "nonpayable",
    inputs: [{ name: "poolId", type: "bytes32" }],
    outputs: [{ type: "int56" }],
  },
  {
    type: "function",
    name: "premiumBps",
    stateMutability: "view",
    inputs: [{ name: "poolId", type: "bytes32" }],
    outputs: [{ type: "uint16" }],
  },
  {
    type: "function",
    name: "premiumQuoteFor",
    stateMutability: "view",
    inputs: [
      { name: "poolId", type: "bytes32" },
      { name: "amountIn", type: "uint256" },
    ],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "epochOf",
    stateMutability: "pure",
    inputs: [{ name: "timestamp", type: "uint256" }],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "batchPreview",
    stateMutability: "view",
    inputs: [{ name: "poolId", type: "bytes32" }],
    outputs: [
      { name: "epoch", type: "uint256" },
      { name: "epochEndsAt", type: "uint256" },
      { name: "orderCount", type: "uint256" },
      { name: "buy0", type: "uint256" },
      { name: "sell1", type: "uint256" },
    ],
  },
  {
    type: "function",
    name: "batchOrders",
    stateMutability: "view",
    inputs: [
      { name: "poolId", type: "bytes32" },
      { name: "epoch", type: "uint256" },
      { name: "index", type: "uint256" },
    ],
    outputs: [
      { name: "trader", type: "address" },
      { name: "zeroForOne", type: "bool" },
      { name: "amountIn", type: "uint256" },
    ],
  },
  {
    type: "function",
    name: "batchCleared",
    stateMutability: "view",
    inputs: [
      { name: "poolId", type: "bytes32" },
      { name: "epoch", type: "uint256" },
    ],
    outputs: [{ type: "bool" }],
  },
  {
    type: "function",
    name: "placeBatchOrder",
    stateMutability: "nonpayable",
    inputs: [
      {
        name: "key",
        type: "tuple",
        components: [
          { name: "currency0", type: "address" },
          { name: "currency1", type: "address" },
          { name: "fee", type: "uint24" },
          { name: "tickSpacing", type: "int24" },
          { name: "hooks", type: "address" },
        ],
      },
      { name: "zeroForOne", type: "bool" },
      { name: "amountIn", type: "uint256" },
    ],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "cancelBatchOrder",
    stateMutability: "nonpayable",
    inputs: [
      { name: "poolId", type: "bytes32" },
      { name: "epoch", type: "uint256" },
      { name: "index", type: "uint256" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "clearBatch",
    stateMutability: "nonpayable",
    inputs: [
      {
        name: "key",
        type: "tuple",
        components: [
          { name: "currency0", type: "address" },
          { name: "currency1", type: "address" },
          { name: "fee", type: "uint24" },
          { name: "tickSpacing", type: "int24" },
          { name: "hooks", type: "address" },
        ],
      },
      { name: "epoch", type: "uint256" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "previewTrade",
    stateMutability: "view",
    inputs: [{ name: "tradeId", type: "bytes32" }],
    outputs: [
      { name: "pre", type: "int24" },
      { name: "post", type: "int24" },
      { name: "windowAvg", type: "int24" },
      { name: "reversionBps", type: "int256" },
      { name: "expectedOutcome", type: "uint8" },
      { name: "outcome", type: "uint8" },
      { name: "refundClaimed", type: "bool" },
    ],
  },
  {
    type: "function",
    name: "trades",
    stateMutability: "view",
    inputs: [{ name: "tradeId", type: "bytes32" }],
    outputs: [
      {
        name: "trade",
        type: "tuple",
        components: [
          {
            name: "key",
            type: "tuple",
            components: [
              { name: "currency0", type: "address" },
              { name: "currency1", type: "address" },
              { name: "fee", type: "uint24" },
              { name: "tickSpacing", type: "int24" },
              { name: "hooks", type: "address" },
            ],
          },
          { name: "trader", type: "address" },
          { name: "bondCurrency", type: "address" },
          { name: "bondAmount", type: "uint256" },
          { name: "preTick", type: "int24" },
          { name: "postTick", type: "int24" },
          { name: "bondTime", type: "uint32" },
          { name: "settleAfter", type: "uint32" },
          { name: "tickCumulativeAtBond", type: "int56" },
          { name: "outcome", type: "uint8" },
          { name: "refundClaimed", type: "bool" },
        ],
      },
    ],
  },
  {
    type: "function",
    name: "pendingDonation",
    stateMutability: "view",
    inputs: [
      { name: "poolId", type: "bytes32" },
      { name: "index", type: "uint8" },
    ],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "event",
    name: "SwapBonded",
    inputs: [
      { name: "tradeId", type: "bytes32", indexed: true },
      { name: "trader", type: "address", indexed: true },
      { name: "preTick", type: "int24", indexed: false },
      { name: "postTick", type: "int24", indexed: false },
      { name: "bondAmount", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "Settled",
    inputs: [
      { name: "tradeId", type: "bytes32", indexed: true },
      { name: "outcome", type: "uint8", indexed: false },
      { name: "windowAvgTick", type: "int24", indexed: false },
      { name: "bondAmount", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "RefundClaimed",
    inputs: [
      { name: "tradeId", type: "bytes32", indexed: true },
      { name: "trader", type: "address", indexed: true },
      { name: "bondAmount", type: "uint256", indexed: false },
    ],
  },
] as const;

export const POOL_MANAGER_ABI = [
  {
    type: "function",
    name: "extsload",
    stateMutability: "view",
    inputs: [{ name: "slot", type: "bytes32" }],
    outputs: [{ type: "bytes32" }],
  },
] as const;

// ---------------------------------------------------------------------------
// LP path — official canonical-Sepolia periphery (same era as the deploy
// script + fork tests; addresses verified on-chain, never invent them)
// ---------------------------------------------------------------------------

export const POSITION_MANAGER = "0x429ba70129df741B2Ca2a85BC3A2a3328e5c09b4" as const;
export const PERMIT2 = "0x000000000022D473030F116dDEE9F6B43aC78BA3" as const;

// Full-range bounds for tickSpacing 60: TickMath.minUsableTick/maxUsableTick
// and their exact sqrt prices (printed from the pinned v4-core).
export const TICK_BOUND_LOWER = -887220;
export const TICK_BOUND_UPPER = 887220;
export const SQRT_LOWER_X96 = 4306310044n;
export const SQRT_UPPER_X96 = 1457652066949847389969617340386294118487833376468n;

// Pool.State.positions lives at struct offset 6 (slot0, feeGrowth0,
// feeGrowth1, liquidity, ticks, tickBitmap, positions).
export const POSITIONS_MAPPING_SLOT = BigInt(SLOT0_SLOT) + 6n;

/** v4 position key: keccak256(abi.encodePacked(poolId, owner, tickLower, tickUpper, salt)). */
export function positionIdOf(owner: string, tokenId: bigint): `0x${string}` {
  // encodePacked int24 = 3-byte two's complement; viem's toHex rejects
  // negative sized ints, so mask manually.
  const i24 = (v: number) => toHex(BigInt(v) & 0xffffffn, { size: 3 });
  return keccak256(
    concat([
      POOL_ID,
      owner.toLowerCase() as `0x${string}`,
      i24(TICK_BOUND_LOWER),
      i24(TICK_BOUND_UPPER),
      pad(toHex(tokenId, { size: 32 })),
    ]),
  );
}

/** Storage slot of a position's liquidity word inside PoolManager. */
export function positionLiquiditySlot(owner: string, tokenId: bigint): `0x${string}` {
  return keccak256(
    concat([positionIdOf(owner, tokenId), pad(toHex(POSITIONS_MAPPING_SLOT, { size: 32 }))]),
  );
}

/** LiquidityAmounts.getLiquidityForAmounts for the in-range case, BigInt-exact. */
export function liquidityForAmounts(sqrtP: bigint, amount0: bigint, amount1: bigint): bigint {
  const Q96 = 1n << 96n;
  // L0 = a0 * sqrtP * sqrtB / ((sqrtB - sqrtP) * Q96)
  const l0 = (amount0 * sqrtP * SQRT_UPPER_X96) / ((SQRT_UPPER_X96 - sqrtP) * Q96);
  // L1 = a1 * Q96 / (sqrtP - sqrtA)
  const l1 = (amount1 * Q96) / (sqrtP - SQRT_LOWER_X96);
  return l0 < l1 ? l0 : l1;
}

export const PERMIT2_ABI = [
  {
    type: "function",
    name: "approve",
    stateMutability: "nonpayable",
    inputs: [
      { name: "token", type: "address" },
      { name: "spender", type: "address" },
      { name: "amount", type: "uint160" },
      { name: "expiration", type: "uint48" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "allowance",
    stateMutability: "view",
    inputs: [
      { name: "user", type: "address" },
      { name: "token", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [
      { name: "amount", type: "uint160" },
      { name: "expiration", type: "uint48" },
      { name: "nonce", type: "uint48" },
    ],
  },
] as const;

export const POSM_ABI = [
  {
    type: "function",
    name: "modifyLiquidities",
    stateMutability: "payable",
    inputs: [
      { name: "data", type: "bytes" },
      { name: "deadline", type: "uint256" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "nextTokenId",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "ownerOf",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ type: "address" }],
  },
  {
    type: "event",
    name: "Transfer",
    inputs: [
      { name: "from", type: "address", indexed: true },
      { name: "to", type: "address", indexed: true },
      { name: "tokenId", type: "uint256", indexed: true },
    ],
  },
] as const;

export const ERC721_TRANSFER_TOPIC =
  "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";

// ---------------------------------------------------------------------------
// Clients — fallback transport for RPC resilience
// ---------------------------------------------------------------------------

// Transport order matters: publicnode prunes logs/receipts older than roughly
// a day, which silently zeroes trade recovery and the LP traction read (an
// empty array is not an error, so viem never fails over). Tenderly's public
// Sepolia gateway serves multi-day history and 45k-block log ranges, so it
// takes the first slot behind the env override.
export const RPC_URLS = [
  process.env.NEXT_PUBLIC_SEPOLIA_RPC,
  "https://sepolia.gateway.tenderly.co",
  "https://ethereum-sepolia-rpc.publicnode.com",
  "https://sepolia.drpc.org",
  "https://1rpc.io/sepolia",
].filter(Boolean) as string[];

export const publicClient = createPublicClient({
  chain: sepolia,
  transport: fallback(
    RPC_URLS.map((url) => http(url, { timeout: 8_000 })),
    { rank: false },
  ),
});

export function walletClientFrom(ethProvider: unknown) {
  return createWalletClient({
    chain: sepolia,
    transport: custom(ethProvider as never),
  });
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function sqrtX96ToPrice(sqrtX96: bigint): number {
  return Number((sqrtX96 * sqrtX96) / (1n << 160n)) / Number(1n << 32n);
}

export function tickToPrice(tick: number | bigint): number {
  return Math.pow(1.0001, Number(tick));
}

export function formatTokens(wei: bigint, decimals = 4): string {
  return (Number(wei) / 1e18).toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function explorerAddress(addr: string): string {
  return `https://sepolia.etherscan.io/address/${addr}`;
}

export function explorerTx(hash: string): string {
  return `https://sepolia.etherscan.io/tx/${hash}`;
}

/** eth_getLogs chunked — public RPCs cap block range (publicnode: 50k). */
export async function getLogsChunked(args: {
  address: `0x${string}`;
  event: unknown;
  args?: Record<string, unknown>;
  fromBlock: bigint;
  toBlock: bigint;
}): Promise<
  { blockNumber: bigint; transactionHash: `0x${string}`; data: `0x${string}`; topics: `0x${string}`[] }[]
> {
  const MAX = 49_000n;
  const out: {
    blockNumber: bigint;
    transactionHash: `0x${string}`;
    data: `0x${string}`;
    topics: `0x${string}`[];
  }[] = [];
  for (let from = args.fromBlock; from <= args.toBlock; from += MAX) {
    const to = from + MAX - 1n > args.toBlock ? args.toBlock : from + MAX - 1n;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const logs = await (publicClient as any).getLogs({
      address: args.address,
      event: args.event,
      args: args.args,
      fromBlock: from,
      toBlock: to,
    });
    out.push(...logs);
    if (to >= args.toBlock) break;
  }
  return out;
}

export type TradeRow = {
  id: `0x${string}`;
  trader: string;
  bondCurrency: string;
  bondAmount: bigint;
  preTick: number;
  postTick: number;
  bondTime: bigint;
  settleAfter: bigint;
  outcome: number; // mirrors the hook enum: 0 open, 1 refunded, 2 refund-pending (claim retries), 3 donated
  refundClaimed: boolean;
  txHash: `0x${string}`;
};

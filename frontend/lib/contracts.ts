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
// Deployment (2026-08-25 hardening run — canonical Sepolia v4)
// ---------------------------------------------------------------------------

export const CHAIN_ID = 11155111;

/** Canonical Uniswap v4 Sepolia PoolManager (docs.uniswap.org). */
export const POOL_MANAGER = "0xE03A1074c86CFeDd5C142C4F04F1a1536e203543" as const;
export const HOOK = "0x027C6cfD540f0446641846cd004b41561EEd70cC" as const;
export const ROUTER = "0x41Fd0B2B581C5F59d468D272dbfcc26e595383CF" as const;
export const TOKEN0 = "0x7B0B6aF2271Cb2f7500365f5a80dB18F9666c315" as const; // MDA
export const TOKEN1 = "0xf3df97cf05D6eFc92cF211440381586b8B86eD76" as const; // MDB

export const FEE = 300n; // 3 bps
export const TICK_SPACING = 60;
export const SWAP_FEE_BPS = 3n;
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

// Live proof pack (2026-08-27 cut, canonical PoolManager): 1:1 next-block
// reversion refunds at settle (no claim tx needed); reversal trade donates.
export const PROOFS = {
  refundSwap: "0xb6308958d2a9e6b37fcc433c63e37c2a5a73468ecb0d44d7a74018b992ee903f",
  refundSettle: "0xda16e75a54e340692774f1405158a5870737b6e33df6400835db1fa6600ddc49",
  donateSwap: "0x530304aac8bbc0997a96a3dab9e5a21923b30127793b4836c99e47de5f6dc141",
  donateSettle: "0xbda1222053c34f4b281082df0b139c04668d8fe8f15238d490d288bc277bfe66",
  donateFlush: "0x064234ab4a6dbd357a674cc480e2de5fc1a4a2de83f4e4e3da7af5cd2c66a3e5",
};

// Event topics (keccak of signatures).
export const TOPICS = {
  swapBonded:
    "0x5d6006d8592645dcc3aeb6a498b78121ff39f7993c9179e6444921228d7c4b51",
  settled: "0x6c52fe296327271b634ad6076ce552d2fb661a4e996661f45c000f218f52e74e",
  refundClaimed:
    "0xe950d47bcc1a745a8ef1d8b86486b400a99681910425d126eb1a006d61f341b2",
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
    name: "bondFor",
    stateMutability: "pure",
    inputs: [{ name: "amountIn", type: "uint256" }],
    outputs: [{ type: "uint256" }],
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
// Clients — fallback transport for RPC resilience
// ---------------------------------------------------------------------------

export const RPC_URLS = [
  process.env.NEXT_PUBLIC_SEPOLIA_RPC,
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
  outcome: number; // 0 open, 1 refund-pending, 2 donated
  refundClaimed: boolean;
  txHash: `0x${string}`;
};

import { createPublicClient, createWalletClient, custom, http } from "viem";
import { sepolia } from "viem/chains";
import { keccak256, concat, pad, toHex } from "viem";

// ---------------------------------------------------------------------------
// Deployment (README "Deployed & proven on Sepolia")
// ---------------------------------------------------------------------------

export const CHAIN_ID = 11155111;

export const HOOK = "0xe79B7Ef0Bb9984BDb614F58D2c8000CE98b180c0" as const;
export const ROUTER = "0xcEbe3CE43db694f2313445999648B1FbbBf20890" as const;
export const POOL_MANAGER = "0xCC5795163C3e966074b3ef091A0580C96D16E5A2" as const;
export const TOKEN0 = "0x7e80764a88133cFC3Da52B7305044da782904667" as const;
export const TOKEN1 = "0xCbBE82f3B6331DbE9faeAd19d3757371b059BdaE" as const;

export const FEE = 300n; // 3 bps
export const TICK_SPACING = 60;
export const SWAP_FEE_BPS = 3n;
export const BOND_BPS = 20n;
export const REVERSION_BPS = 5n;
export const SETTLEMENT_DELAY = 21;

// Live proof hashes (README LiveProofPack, 2026-08-25)
export const PROOFS = {
  refundSwap:
    "0xd1cd9b06caa0642db79f7f1803971d94eaa5c02b38d177973058718d94ea288f",
  refundSettle:
    "0x4edcf5e51fec6e978631faea923c2d61bf2573950001ec596c391621abd2c245",
  donateSwap:
    "0x9df51053a7d222a29f4dc7e98cb695236c70df3342abf0107f85828050203165",
  donateSettle:
    "0xd008642604b9ae75178be4ffe033820f855e470d8dd3fe3f35fb214d4b5cb456",
};

export const MIN_SQRT_PRICE = 4295128741n; // TickMath.MIN_SQRT_PRICE + 1
export const MAX_SQRT_PRICE =
  1461446703485210103287273052203988822378723970340n; // MAX - 1

export const POOL_KEY = [
  TOKEN0,
  TOKEN1,
  FEE,
  TICK_SPACING,
  HOOK,
] as const;

// PoolId = keccak256(abi.encode(PoolKey)) — five 32-byte words.
export const POOL_ID = keccak256(
  concat([
    pad(TOKEN0.toLowerCase() as `0x${string}`),
    pad(TOKEN1.toLowerCase() as `0x${string}`),
    pad(toHex(FEE, { size: 32 })),
    pad(toHex(TICK_SPACING, { size: 32 })),
    pad(HOOK.toLowerCase() as `0x${string}`),
  ]),
);

// v4 StateLibrary: pools mapping lives at slot 6 in PoolManager;
// pools[poolId].slot0 = keccak256(abi.encodePacked(poolId, bytes32(uint256(6)))).
export const SLOT0_SLOT = keccak256(
  concat([POOL_ID, pad(toHex(6, { size: 32 }))]),
);

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
      { name: "hookData", type: "bytes" },
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
    name: "lastTradeId",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "bytes32" }],
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
          { name: "key", type: "tuple", components: [
            { name: "currency0", type: "address" },
            { name: "currency1", type: "address" },
            { name: "fee", type: "uint24" },
            { name: "tickSpacing", type: "int24" },
            { name: "hooks", type: "address" },
          ]},
          { name: "trader", type: "address" },
          { name: "bondCurrency", type: "address" },
          { name: "bondAmount", type: "uint256" },
          { name: "sqrtPre", type: "uint160" },
          { name: "sqrtPost", type: "uint160" },
          { name: "bondTime", type: "uint32" },
          { name: "settleAfter", type: "uint32" },
          { name: "tickCumulativeAtBond", type: "int56" },
          { name: "outcome", type: "uint8" },
        ],
      },
    ],
  },
  {
    type: "event",
    name: "SwapBonded",
    inputs: [
      { name: "tradeId", type: "bytes32", indexed: true },
      { name: "trader", type: "address", indexed: true },
      { name: "sqrtPre", type: "uint160", indexed: false },
      { name: "sqrtPost", type: "uint160", indexed: false },
      { name: "bondAmount", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "Settled",
    inputs: [
      { name: "tradeId", type: "bytes32", indexed: true },
      { name: "outcome", type: "uint8", indexed: false },
      { name: "sqrtAtSettlement", type: "uint160", indexed: false },
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

// keccak256("Settled(bytes32,uint8,uint160,uint256)")
export const SETTLED_TOPIC =
  "0x1b564febf951708ff47de44a9c52e3c941ae57275c4e30ceb8fe68387db3e043";

// ---------------------------------------------------------------------------
// Clients
// ---------------------------------------------------------------------------

export const RPC_URL =
  process.env.NEXT_PUBLIC_SEPOLIA_RPC ?? "https://ethereum-sepolia-rpc.publicnode.com";

export const publicClient = createPublicClient({
  chain: sepolia,
  transport: http(RPC_URL),
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
  // price = (sqrtX96 / 2^96)^2, token1 per token0
  return Number((sqrtX96 * sqrtX96) / (1n << 160n)) / Number(1n << 32n);
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
  event: unknown; // parseAbiItem result
  args?: Record<string, unknown>;
  fromBlock: bigint;
  toBlock: bigint;
}): Promise<unknown[]> {
  const MAX = 49_000n;
  const out: unknown[] = [];
  for (
    let from = args.fromBlock;
    from <= args.toBlock;
    from += MAX
  ) {
    const to = from + MAX - 1n > args.toBlock ? args.toBlock : from + MAX - 1n;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const logs = await (publicClient as any).getLogs({
      address: args.address,
      event: args.event,
      args: args.args,
      fromBlock: from,
      toBlock: to,
    });
    out.push(...(logs as unknown[]));
    if (to >= args.toBlock) break;
  }
  return out;
}

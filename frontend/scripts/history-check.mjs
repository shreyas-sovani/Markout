// Sanity check of the UI history pipeline: getLogs(SwapBonded, trader) + multicall(trades).
import { createPublicClient, http, parseAbiItem, decodeEventLog } from "viem";
import { sepolia } from "viem/chains";

const HOOK = "0xe79B7Ef0Bb9984BDb614F58D2c8000CE98b180c0";
const TRADER = "0xFeAf5C921996FC53f4DEf35e181E766e6D74690A";
const HOOK_ABI_EVENT = [
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
];

const TRADES_ABI = [
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
];

const client = createPublicClient({
  chain: sepolia,
  transport: http("https://ethereum-sepolia-rpc.publicnode.com"),
});

const head = await client.getBlockNumber();
const logs = await client.getLogs({
  address: HOOK,
  event: parseAbiItem(
    "event SwapBonded(bytes32 indexed tradeId, address indexed trader, uint160 sqrtPre, uint160 sqrtPost, uint256 bondAmount)",
  ),
  args: { trader: TRADER },
  fromBlock: head > 49000n ? head - 49000n : 0n,
  toBlock: "latest",
});

const rows = [...logs]
  .sort((a, b) => Number(b.blockNumber - a.blockNumber))
  .slice(0, 12)
  .map((l) => {
    const d = decodeEventLog({ abi: HOOK_ABI_EVENT, data: l.data, topics: l.topics });
    return { id: d.args.tradeId, bond: d.args.bondAmount, tx: l.transactionHash };
  });

const results = await client.multicall({
  contracts: rows.map((r) => ({
    address: HOOK,
    abi: TRADES_ABI,
    functionName: "trades",
    args: [r.id],
  })),
  allowFailure: false,
});

rows.forEach((r, i) => {
  const outcome = Number(results[i].outcome);
  console.log(
    r.id.slice(0, 18) + "…",
    "bond " + r.bond.toString(),
    "outcome",
    outcome === 1 ? "REFUND" : outcome === 2 ? "DONATE" : "pending",
  );
});

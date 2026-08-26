// Sanity check of the UI history pipeline against the v2 deployment:
// chunked getLogs(SwapBonded, trader) + multicall(trades) with property access.
import { createPublicClient, http, fallback, parseAbiItem, decodeEventLog } from "viem";
import { sepolia } from "viem/chains";

const HOOK = "0x027C6cfD540f0446641846cd004b41561EEd70cC";
const TRADER = "0xFeAf5C921996FC53f4DEf35e181E766e6D74690A";
const RPCS = ["https://ethereum-sepolia-rpc.publicnode.com", "https://sepolia.drpc.org"];

const HOOK_ABI_EVENT = [
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
];

const client = createPublicClient({
  chain: sepolia,
  transport: fallback(RPCS.map((u) => http(u))),
});

const head = await client.getBlockNumber();
const from = head > 49000n ? head - 49000n : 0n;
const logs = await client.getLogs({
  address: HOOK,
  event: parseAbiItem(
    "event SwapBonded(bytes32 indexed tradeId, address indexed trader, int24 preTick, int24 postTick, uint256 bondAmount)",
  ),
  args: { trader: TRADER },
  fromBlock: from,
  toBlock: head,
});

const rows = [...logs]
  .sort((a, b) => Number(b.blockNumber - a.blockNumber))
  .slice(0, 12)
  .map((l) => {
    const d = decodeEventLog({ abi: HOOK_ABI_EVENT, data: l.data, topics: l.topics });
    return { id: d.args.tradeId, bond: d.args.bondAmount, tx: l.transactionHash };
  });

if (rows.length === 0) {
  console.log("no SwapBonded events for trader in window");
  process.exit(0);
}

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
  const t = results[i];
  const outcome = Number(t.outcome);
  console.log(
    r.id.slice(0, 18) + "…",
    "bond " + r.bond.toString(),
    "outcome",
    outcome === 1 ? "REFUNDED" : outcome === 2 ? "REFUND-pending" : outcome === 3 ? "DONATE" : "open",
  );
});

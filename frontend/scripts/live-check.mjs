// Sanity check of the UI's read pipeline against the canonical Sepolia stack:
// POOL_ID derivation, PoolManager slot0 extsload, hook views.
import { createPublicClient, http, fallback, keccak256, concat, pad, toHex } from "viem";
import { sepolia } from "viem/chains";

const TOKEN0 = "0x41A9c2d06770375a41b94aBC94bcf0CD14320060"; // MDB
const TOKEN1 = "0xae0Fe2707a76EC31AB64Dc29557bdBEE9f1A5F5A"; // MDA
const HOOK = "0x1e9A034B21Ab19D00556B429C281F9B29d8Bb0cC";
const ROUTER = "0xf06737dcBa252D276deCc0f6f0F2102aD20c7535";
const PM = "0xE03A1074c86CFeDd5C142C4F04F1a1536e203543";
const RPCS = [
  process.env.NEXT_PUBLIC_SEPOLIA_RPC,
  process.env.SEP_RPC_URL,
  "https://sepolia.gateway.tenderly.co",
  "https://ethereum-sepolia-rpc.publicnode.com",
].filter(Boolean);

const client = createPublicClient({
  chain: sepolia,
  transport: fallback(RPCS.map((u) => http(u))),
});

const poolId = keccak256(
  concat([
    pad(TOKEN0.toLowerCase()),
    pad(TOKEN1.toLowerCase()),
    pad(toHex(300, { size: 32 })),
    pad(toHex(60, { size: 32 })),
    pad(HOOK.toLowerCase()),
  ]),
);
console.log("POOL_ID:", poolId);

const slot0 = keccak256(concat([poolId, pad(toHex(6, { size: 32 }))]));
const raw = await client.readContract({
  address: PM,
  abi: [
    {
      type: "function",
      name: "extsload",
      stateMutability: "view",
      inputs: [{ name: "slot", type: "bytes32" }],
      outputs: [{ type: "bytes32" }],
    },
  ],
  functionName: "extsload",
  args: [slot0],
});
const value = BigInt(raw);
const sqrt = value & ((1n << 160n) - 1n);
const t = (value >> 160n) & 0xffffffn;
const tick = t >= 1n << 23n ? t - (1n << 24n) : t;
const price = (Number(sqrt) / 2 ** 96) ** 2;
console.log("tick:", tick.toString(), "price T1/T0 (MDA/MDB) ≈", price.toFixed(6));

const hookAbi = [
  { type: "function", name: "premiumBps", stateMutability: "view", inputs: [{ name: "poolId", type: "bytes32" }], outputs: [{ type: "uint256" }] },
  { type: "function", name: "premiumQuoteFor", stateMutability: "view", inputs: [{ name: "poolId", type: "bytes32" }, { name: "amountIn", type: "uint256" }], outputs: [{ type: "uint256" }] },
  { type: "function", name: "observationCount", stateMutability: "view", inputs: [{ name: "poolId", type: "bytes32" }], outputs: [{ type: "uint256" }] },
  { type: "function", name: "pendingDonation", stateMutability: "view", inputs: [{ name: "poolId", type: "bytes32" }, { name: "index", type: "uint8" }], outputs: [{ type: "uint256" }] },
];
const bps = await client.readContract({ address: HOOK, abi: hookAbi, functionName: "premiumBps", args: [poolId] });
const quoted = await client.readContract({ address: HOOK, abi: hookAbi, functionName: "premiumQuoteFor", args: [poolId, 10n ** 18n] });
const obs = await client.readContract({ address: HOOK, abi: hookAbi, functionName: "observationCount", args: [poolId] });
const pend0 = await client.readContract({ address: HOOK, abi: hookAbi, functionName: "pendingDonation", args: [poolId, 0] });
const pend1 = await client.readContract({ address: HOOK, abi: hookAbi, functionName: "pendingDonation", args: [poolId, 1] });
const expect = (10n ** 18n * bps) / 10000n;
console.log("premiumBps:", bps.toString());
console.log("premiumQuoteFor(1e18):", quoted.toString(), quoted === expect ? "OK" : "MISMATCH vs bps×amount");
console.log("observations:", obs.toString(), "pendingDonation:", pend0.toString(), pend1.toString());
console.log("router (sanity):", ROUTER);

// Sanity check of the UI's read pipeline against the canonical Sepolia stack:
// POOL_ID derivation, PoolManager slot0 extsload, hook views.
import { createPublicClient, http, fallback, keccak256, concat, pad, toHex } from "viem";
import { sepolia } from "viem/chains";

const TOKEN0 = "0x333ACc2e37A1A1bC7eF27362eb86baC9A44b2D60";
const TOKEN1 = "0xcf2C78DC09AD87c61D179e36A42ADCC208eb8B73";
const HOOK = "0xAe5A786094a36475EF619956bb6F1C6089Def0c0";
const ROUTER = "0x378f4E63f8aFf6e771EAfa95BCAf0Df6571a5ec8";
const PM = "0xE03A1074c86CFeDd5C142C4F04F1a1536e203543";
const RPCS = ["https://ethereum-sepolia-rpc.publicnode.com", "https://sepolia.drpc.org"];

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
console.log("tick:", tick.toString(), "price T1/T0 ≈", price.toFixed(6));

const hookAbi = [
  { type: "function", name: "trustedRouter", stateMutability: "view", inputs: [], outputs: [{ type: "address" }] },
  { type: "function", name: "observationCount", stateMutability: "view", inputs: [{ name: "poolId", type: "bytes32" }], outputs: [{ type: "uint256" }] },
  { type: "function", name: "pendingDonation", stateMutability: "view", inputs: [{ name: "poolId", type: "bytes32" }, { name: "index", type: "uint8" }], outputs: [{ type: "uint256" }] },
];
const routerSet = await client.readContract({ address: HOOK, abi: hookAbi, functionName: "trustedRouter" });
const obs = await client.readContract({ address: HOOK, abi: hookAbi, functionName: "observationCount", args: [poolId] });
const pend0 = await client.readContract({ address: HOOK, abi: hookAbi, functionName: "pendingDonation", args: [poolId, 0] });
const pend1 = await client.readContract({ address: HOOK, abi: hookAbi, functionName: "pendingDonation", args: [poolId, 1] });
console.log(
  "trustedRouter:",
  routerSet,
  routerSet.toLowerCase() === ROUTER.toLowerCase() ? "OK" : "MISMATCH",
);
console.log("observations:", obs.toString(), "pendingDonation:", pend0.toString(), pend1.toString());

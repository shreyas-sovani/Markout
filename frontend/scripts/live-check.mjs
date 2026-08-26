// Sanity check of the UI's read pipeline against the canonical Sepolia stack:
// POOL_ID derivation, PoolManager slot0 extsload, hook views.
import { createPublicClient, http, fallback, keccak256, concat, pad, toHex } from "viem";
import { sepolia } from "viem/chains";

const TOKEN0 = "0x7B0B6aF2271Cb2f7500365f5a80dB18F9666c315";
const TOKEN1 = "0xf3df97cf05D6eFc92cF211440381586b8B86eD76";
const HOOK = "0x027C6cfD540f0446641846cd004b41561EEd70cC";
const ROUTER = "0x41Fd0B2B581C5F59d468D272dbfcc26e595383CF";
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
  { type: "function", name: "bondFor", stateMutability: "pure", inputs: [{ name: "amountIn", type: "uint256" }], outputs: [{ type: "uint256" }] },
  { type: "function", name: "observationCount", stateMutability: "view", inputs: [{ name: "poolId", type: "bytes32" }], outputs: [{ type: "uint256" }] },
  { type: "function", name: "pendingDonation", stateMutability: "view", inputs: [{ name: "poolId", type: "bytes32" }, { name: "index", type: "uint8" }], outputs: [{ type: "uint256" }] },
];
const bond = await client.readContract({ address: HOOK, abi: hookAbi, functionName: "bondFor", args: [10n ** 18n] });
const obs = await client.readContract({ address: HOOK, abi: hookAbi, functionName: "observationCount", args: [poolId] });
const pend0 = await client.readContract({ address: HOOK, abi: hookAbi, functionName: "pendingDonation", args: [poolId, 0] });
const pend1 = await client.readContract({ address: HOOK, abi: hookAbi, functionName: "pendingDonation", args: [poolId, 1] });
console.log("bondFor(1e18):", bond.toString(), bond === 2n * 10n ** 15n ? "OK" : "MISMATCH");
console.log("observations:", obs.toString(), "pendingDonation:", pend0.toString(), pend1.toString());

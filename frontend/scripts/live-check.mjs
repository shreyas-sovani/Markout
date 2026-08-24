// Sanity check of the UI's read pipeline against Sepolia:
// POOL_ID derivation, slot0 extsload slot, decoded price/tick.
import { createPublicClient, http, keccak256, concat, pad, toHex } from "viem";
import { sepolia } from "viem/chains";

const TOKEN0 = "0x7e80764a88133cFc3dA52b7305044dA782904667";
const TOKEN1 = "0xCBbe82f3B6331dbE9fAEAD19D3757371b059BDAe";
const HOOK = "0xe79B7Ef0Bb9984BDb614F58D2c8000CE98b180c0";
const PM = "0xCC5795163C3e966074b3ef091A0580C96D16E5A2";
const RPC = "https://ethereum-sepolia-rpc.publicnode.com";

const client = createPublicClient({ chain: sepolia, transport: http(RPC) });

const poolId = keccak256(
  concat([
    pad(TOKEN0.toLowerCase()),
    pad(TOKEN1.toLowerCase()),
    pad(toHex(300n, { size: 32 })),
    pad(toHex(60, { size: 32 })),
    pad(HOOK.toLowerCase()),
  ]),
);
console.log("POOL_ID:", poolId);

const slot = keccak256(concat([poolId, pad(toHex(6, { size: 32 }))]));
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
  args: [slot],
});
const value = BigInt(raw);
const sqrt = value & ((1n << 160n) - 1n);
let t = (value >> 160n) & 0xffffffn;
if (t >= 1n << 23n) t -= 1n << 24n;
const price = (Number((sqrt * sqrt) >> 96n) / 2 ** 96);
console.log("sqrtPriceX96:", sqrt.toString());
console.log("tick:", t.toString());
console.log("price T1/T0:", price.toFixed(6));

const last = await client.readContract({
  address: HOOK,
  abi: [
    { type: "function", name: "lastTradeId", stateMutability: "view", inputs: [], outputs: [{ type: "bytes32" }] },
  ],
  functionName: "lastTradeId",
});
console.log("lastTradeId:", last);

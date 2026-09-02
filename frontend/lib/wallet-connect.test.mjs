import assert from "node:assert/strict";
import test from "node:test";

const wallet = await import("./wallet.ts");

const ACCOUNT = "0x1111111111111111111111111111111111111111";

test("reuses an already-authorized account without requesting permission", async () => {
  assert.equal(typeof wallet.connectInjectedWallet, "function");
  const methods = [];
  const provider = {
    async request({ method }) {
      methods.push(method);
      if (method === "eth_accounts") return [ACCOUNT];
      if (method === "eth_chainId") return "0xaa36a7";
      throw new Error(`unexpected ${method}`);
    },
  };

  const result = await wallet.connectInjectedWallet(provider);

  assert.deepEqual(result, { address: ACCOUNT, chainId: 11155111 });
  assert.deepEqual(methods, ["eth_accounts", "eth_chainId"]);
});

test("deduplicates concurrent account requests", async () => {
  assert.equal(typeof wallet.connectInjectedWallet, "function");
  let requestCalls = 0;
  const provider = {
    async request({ method }) {
      if (method === "eth_accounts") return [];
      if (method === "eth_requestAccounts") {
        requestCalls += 1;
        await new Promise((resolve) => setTimeout(resolve, 5));
        return [ACCOUNT];
      }
      if (method === "eth_chainId") return "0xaa36a7";
      throw new Error(`unexpected ${method}`);
    },
  };

  const [first, second] = await Promise.all([
    wallet.connectInjectedWallet(provider),
    wallet.connectInjectedWallet(provider),
  ]);

  assert.equal(requestCalls, 1);
  assert.deepEqual(first, second);
});

test("forced connection requests do not reuse the current authorized account", async () => {
  assert.equal(typeof wallet.connectInjectedWallet, "function");
  const nextAccount = "0x2222222222222222222222222222222222222222";
  const methods = [];
  const provider = {
    async request({ method }) {
      methods.push(method);
      if (method === "eth_accounts") return [ACCOUNT];
      if (method === "eth_requestAccounts") return [nextAccount];
      if (method === "eth_chainId") return "0xaa36a7";
      throw new Error(`unexpected ${method}`);
    },
  };

  const result = await wallet.connectInjectedWallet(provider, { forceRequest: true });

  assert.equal(result.address, nextAccount);
  assert.deepEqual(methods, ["eth_requestAccounts", "eth_chainId"]);
});

test("recovers when MetaMask authorizes before reporting a request failure", async () => {
  assert.equal(typeof wallet.connectInjectedWallet, "function");
  let authorized = false;
  const provider = {
    async request({ method }) {
      if (method === "eth_accounts") return authorized ? [ACCOUNT] : [];
      if (method === "eth_requestAccounts") {
        authorized = true;
        throw Object.assign(new Error("Failed to connect to MetaMask"), { code: -32603 });
      }
      if (method === "eth_chainId") return "0xaa36a7";
      throw new Error(`unexpected ${method}`);
    },
  };

  const result = await wallet.connectInjectedWallet(provider);

  assert.equal(result.address, ACCOUNT);
});

test("translates MetaMask connection failures into actionable messages", () => {
  assert.equal(typeof wallet.walletConnectionErrorMessage, "function");
  assert.match(
    wallet.walletConnectionErrorMessage({ code: -32002 }),
    /open MetaMask/i,
  );
  assert.match(
    wallet.walletConnectionErrorMessage({ code: 4001 }),
    /cancelled/i,
  );
  assert.match(
    wallet.walletConnectionErrorMessage(new Error("Failed to connect to MetaMask")),
    /unlock MetaMask/i,
  );
});

test("account switching only falls back when the permission method is unsupported", () => {
  assert.equal(typeof wallet.shouldFallbackAccountSwitch, "function");
  assert.equal(wallet.shouldFallbackAccountSwitch({ code: 4200 }), true);
  assert.equal(wallet.shouldFallbackAccountSwitch({ code: -32601 }), true);
  assert.equal(wallet.shouldFallbackAccountSwitch({ code: 4001 }), false);
  assert.equal(wallet.shouldFallbackAccountSwitch({ code: -32002 }), false);
});

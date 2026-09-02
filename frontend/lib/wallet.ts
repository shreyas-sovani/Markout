"use client";

import { useCallback, useEffect, useState } from "react";
import type { Address } from "viem";

// Minimal EIP-1193 provider surface we rely on.
export interface Eip1193 {
  request(args: { method: string; params?: unknown[] }): Promise<unknown>;
  on(event: string, listener: (...args: never[]) => void): void;
  removeListener(event: string, listener: (...args: never[]) => void): void;
}

export function getEthereum(): Eip1193 | undefined {
  if (typeof window === "undefined") return undefined;
  return (window as unknown as { ethereum?: Eip1193 }).ethereum;
}

export interface WalletConnection {
  address: Address | undefined;
  chainId: number | undefined;
}

const pendingConnections = new WeakMap<object, Promise<WalletConnection>>();

/**
 * Resolve an injected-wallet account once per provider. Existing permission
 * is reused without opening MetaMask, while concurrent clicks share one
 * eth_requestAccounts call instead of creating a second pending request.
 */
export async function connectInjectedWallet(
  eth: Pick<Eip1193, "request">,
  options: { forceRequest?: boolean } = {},
): Promise<WalletConnection> {
  const key = eth as object;
  const pending = pendingConnections.get(key);
  if (pending) return pending;

  const request = (async () => {
    let accounts = options.forceRequest
      ? []
      : ((await eth.request({ method: "eth_accounts" })) as string[]);
    if (accounts.length === 0) {
      try {
        accounts = (await eth.request({ method: "eth_requestAccounts" })) as string[];
      } catch (error) {
        // MetaMask can finish authorization while its request promise reports
        // an internal failure. Re-read permission once before surfacing it.
        const recovered = (await eth.request({ method: "eth_accounts" })) as string[];
        if (recovered.length === 0) throw error;
        accounts = recovered;
      }
    }

    const address = accounts.length ? (accounts[0] as Address) : undefined;
    const rawChainId = address
      ? ((await eth.request({ method: "eth_chainId" })) as string)
      : undefined;
    return {
      address,
      chainId: rawChainId === undefined ? undefined : Number(rawChainId),
    };
  })();

  pendingConnections.set(key, request);
  try {
    return await request;
  } finally {
    if (pendingConnections.get(key) === request) pendingConnections.delete(key);
  }
}

function walletErrorCode(error: unknown): number | undefined {
  const err = error as {
    code?: number;
    cause?: { code?: number };
  };
  return err?.code ?? err?.cause?.code;
}

export function shouldFallbackAccountSwitch(error: unknown): boolean {
  const code = walletErrorCode(error);
  return code === 4200 || code === -32601;
}

export function walletConnectionErrorMessage(error: unknown): string {
  const err = error as {
    message?: string;
    cause?: { message?: string };
  };
  const code = walletErrorCode(error);
  const message = err?.message ?? err?.cause?.message ?? "";

  if (code === -32002) {
    return "A connection request is already open. Open MetaMask and approve or reject it, then return here.";
  }
  if (code === 4001) return "Wallet connection cancelled. Try again when you are ready.";
  if (code === 4900 || code === 4901) {
    return "MetaMask is disconnected. Unlock or reload the extension, then try again.";
  }
  if (/failed to connect to metamask/i.test(message)) {
    return "MetaMask could not connect. Unlock MetaMask, confirm this site is allowed, then try again.";
  }
  return message
    ? `Wallet connection failed: ${message.slice(0, 140)}`
    : "Wallet connection failed. Unlock your wallet and try again.";
}

export function useWallet() {
  const [address, setAddress] = useState<Address | undefined>(undefined);
  const [chainId, setChainId] = useState<number | undefined>(undefined);

  useEffect(() => {
    const eth = getEthereum();
    if (!eth) return;

    const onAccounts = (...args: never[]) => {
      const accounts = args[0] as string[];
      setAddress(accounts.length ? (accounts[0] as Address) : undefined);
    };
    const onChain = (...args: never[]) => {
      setChainId(Number(args[0]));
    };

    eth.request({ method: "eth_accounts" }).then((res) => {
      const accounts = res as string[];
      if (accounts.length) setAddress(accounts[0] as Address);
    });
    eth.request({ method: "eth_chainId" }).then((res) => {
      setChainId(Number(res));
    });

    eth.on("accountsChanged", onAccounts);
    eth.on("chainChanged", onChain);
    return () => {
      eth.removeListener("accountsChanged", onAccounts);
      eth.removeListener("chainChanged", onChain);
    };
  }, []);

  const connect = useCallback(async (): Promise<Address | undefined> => {
    const eth = getEthereum();
    if (!eth) return undefined;
    const result = await connectInjectedWallet(eth);
    setAddress(result.address);
    setChainId(result.chainId);
    return result.address;
  }, []);

  const disconnect = useCallback(() => setAddress(undefined), []);

  // Ask the extension for its account-switcher; on wallets without the
  // method, fall back to a plain re-request which most extensions surface
  // as the account chooser.
  const switchAccount = useCallback(async (): Promise<Address | undefined> => {
    const eth = getEthereum();
    if (!eth) return undefined;
    try {
      const accounts = (await eth.request({
        method: "wallet_requestPermissions",
        params: [{ eth_accounts: {} }],
      })) as unknown as { eth_accounts?: { accounts?: string[] } }[];
      const list = accounts?.[0]?.eth_accounts?.accounts;
      const a = list?.length ? (list[list.length - 1] as Address) : undefined;
      if (a) setAddress(a);
      return a;
    } catch (error) {
      if (!shouldFallbackAccountSwitch(error)) throw error;
      const result = await connectInjectedWallet(eth, { forceRequest: true });
      setAddress(result.address);
      setChainId(result.chainId);
      return result.address;
    }
  }, []);

  return { address, chainId, connect, disconnect, switchAccount, hasProvider: !!getEthereum() };
}

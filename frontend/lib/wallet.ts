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
    const accounts = (await eth.request({
      method: "eth_requestAccounts",
    })) as string[];
    const a = accounts.length ? (accounts[0] as Address) : undefined;
    setAddress(a);
    if (a) {
      const id = (await eth.request({ method: "eth_chainId" })) as string;
      setChainId(Number(id));
    }
    return a;
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
    } catch {
      return await connect();
    }
  }, [connect]);

  return { address, chainId, connect, disconnect, switchAccount, hasProvider: !!getEthereum() };
}

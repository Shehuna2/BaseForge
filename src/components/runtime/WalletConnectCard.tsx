"use client";

import { useMemo } from "react";
import { OnchainKitProvider } from "@coinbase/onchainkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { base } from "wagmi/chains";
import { WagmiProvider, createConfig, http, useAccount, useConnect, useDisconnect } from "wagmi";
import { injected } from "wagmi/connectors";

const WalletConnectInner = () => {
  const { address, isConnected } = useAccount();
  const { connect, isPending } = useConnect();
  const { disconnect } = useDisconnect();

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-900 p-4">
      {isConnected ? (
        <div className="space-y-2">
          <p className="text-sm text-slate-300">Connected wallet:</p>
          <p className="font-mono text-sm text-slate-100">{address}</p>
          <button
            type="button"
            onClick={() => disconnect()}
            className="rounded-md bg-slate-700 px-3 py-2 text-sm text-white"
          >
            Disconnect
          </button>
        </div>
      ) : (
        <button
          type="button"
          disabled={isPending}
          onClick={() => connect({ connector: injected() })}
          className="rounded-md bg-indigo-500 px-4 py-2 text-white disabled:opacity-60"
        >
          {isPending ? "Connecting…" : "Connect Wallet"}
        </button>
      )}
    </div>
  );
};

export default function WalletConnectCard() {
  const queryClient = useMemo(() => new QueryClient(), []);
  const wagmiConfig = useMemo(
    () =>
      createConfig({
        chains: [base],
        connectors: [injected()],
        transports: {
          [base.id]: http()
        }
      }),
    []
  );

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <OnchainKitProvider chain={base}>
          <WalletConnectInner />
        </OnchainKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

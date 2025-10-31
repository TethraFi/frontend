'use client';

import React from 'react';
import { PrivyProvider } from '@privy-io/react-auth';
import { WagmiProvider } from '@privy-io/wagmi';
import { createConfig, http } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { baseSepolia } from 'wagmi/chains';
import { Toaster } from 'react-hot-toast';
import { TPSLProvider } from '@/contexts/TPSLContext';
import { ChainProvider } from './contexts/ChainContext';
import { flowConfig } from '@/config/chains';

// Define Flow EVM Testnet chain for Wagmi
const flowEvmTestnet = {
  id: flowConfig.id,
  name: flowConfig.name,
  nativeCurrency: flowConfig.nativeCurrency,
  rpcUrls: {
    default: { http: [flowConfig.rpcUrl] },
    public: { http: [flowConfig.rpcUrl] },
  },
  blockExplorers: {
    default: { name: 'FlowScan', url: flowConfig.explorerUrl },
  },
} as const;

export const config = createConfig({
  chains: [baseSepolia, flowEvmTestnet as any],
  transports: {
    [baseSepolia.id]: http(),
    [flowEvmTestnet.id]: http(flowConfig.rpcUrl),
  },
});

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || 'cmghox4fe01ijib0ccdcmw7j5'}
      config={{
        appearance: {
          theme: 'dark',
          accentColor: '#676FFF',
        },
        loginMethods: ['email', 'google', 'wallet'],
        embeddedWallets: {
          ethereum: {
            createOnLogin: 'all-users',
          },
        },
        defaultChain: flowEvmTestnet as any,
        supportedChains: [baseSepolia, flowEvmTestnet as any],
      }}
    >
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={config}>
          <ChainProvider>
            <TPSLProvider>
              <Toaster
                position="top-right"
                containerStyle={{
                  top: 20,
                  right: 20,
                  zIndex: 9999,
                }}
                toastOptions={{
                  style: {
                    background: '#1e293b',
                    color: '#fff',
                    pointerEvents: 'auto',
                  },
                  duration: 1500,
                }}
                containerClassName="toast-container"
                gutter={8}
                reverseOrder={false}
              />
              {children}
            </TPSLProvider>
          </ChainProvider>
        </WagmiProvider>
      </QueryClientProvider>
    </PrivyProvider>
  );
}

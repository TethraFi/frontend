import { useState, useEffect, useCallback } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { parseUnits, formatUnits, createWalletClient, custom, encodeFunctionData, http, createPublicClient } from 'viem';
import { baseSepolia } from 'viem/chains';
import { useChain } from '@/app/contexts/ChainContext';
import { getChainConfig } from '@/config/chains';
import { USDC_DECIMALS } from '@/config/contracts';

const USDC_ABI = [
  {
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    name: 'allowance',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

/**
 * Hook for USDC approval specifically for TapToTradeExecutor contract
 * Multi-chain aware - uses selected chain from ChainContext
 */
export function useTapToTradeApproval() {
  const { authenticated } = usePrivy();
  const { wallets, ready: walletsReady } = useWallets();
  const { selectedChain } = useChain();
  const [allowance, setAllowance] = useState<bigint | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const embeddedWallet = wallets.find((w) => w.walletClientType === 'privy');

  /**
   * Fetch current USDC allowance for TapToTradeExecutor
   */
  const fetchAllowance = useCallback(async () => {
    if (!authenticated || !walletsReady || !embeddedWallet) return;

    try {
      setIsLoading(true);
      const chainConfig = getChainConfig(selectedChain);
      const userAddress = embeddedWallet.address as `0x${string}`;

      const publicClient = createPublicClient({
        chain: selectedChain === 'base' ? baseSepolia : {
          id: chainConfig.id,
          name: chainConfig.displayName,
          nativeCurrency: { name: 'Flow', symbol: 'FLOW', decimals: 18 },
          rpcUrls: { default: { http: [chainConfig.rpcUrl] } },
        } as any,
        transport: http(chainConfig.rpcUrl),
      });

      const currentAllowance = await publicClient.readContract({
        address: chainConfig.contracts.mockUSDC as `0x${string}`,
        abi: USDC_ABI,
        functionName: 'allowance',
        args: [userAddress, chainConfig.contracts.tapToTradeExecutor as `0x${string}`],
      });

      setAllowance(currentAllowance);
      console.log(`✅ TapToTrade USDC Allowance on ${selectedChain}:`, currentAllowance.toString());
    } catch (error) {
      console.error('Error fetching TapToTrade allowance:', error);
      setAllowance(BigInt(0));
    } finally {
      setIsLoading(false);
    }
  }, [authenticated, walletsReady, embeddedWallet, selectedChain]);

  /**
   * Approve USDC for TapToTradeExecutor
   */
  const approve = useCallback(
    async (amount: string) => {
      if (!authenticated || !embeddedWallet) {
        throw new Error('Wallet not connected');
      }

      setIsPending(true);

      try {
        const chainConfig = getChainConfig(selectedChain);
        const ethereumProvider = await embeddedWallet.getEthereumProvider();
        const userAddress = embeddedWallet.address as `0x${string}`;

        console.log(`🔄 Approving USDC for TapToTrade on ${selectedChain}...`);
        console.log(`   Chain ID: ${chainConfig.id}`);
        console.log(`   USDC: ${chainConfig.contracts.mockUSDC}`);
        console.log(`   TapToTradeExecutor: ${chainConfig.contracts.tapToTradeExecutor}`);
        console.log(`   Amount: ${amount}`);

        // Check current chain
        const currentChainId = await ethereumProvider.request({ method: 'eth_chainId' });
        const currentChainIdDecimal = parseInt(currentChainId as string, 16);
        console.log(`   Current wallet chain ID: ${currentChainIdDecimal}`);

        // Switch chain if needed
        if (currentChainIdDecimal !== chainConfig.id) {
          console.log(`   Switching to chain ${chainConfig.id}...`);
          try {
            await ethereumProvider.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: `0x${chainConfig.id.toString(16)}` }],
            });
            console.log(`   ✅ Switched to chain ${chainConfig.id}`);
          } catch (switchError: any) {
            // Chain not added, try to add it
            if (switchError.code === 4902) {
              console.log(`   Chain not found, adding chain ${chainConfig.id}...`);
              await ethereumProvider.request({
                method: 'wallet_addEthereumChain',
                params: [{
                  chainId: `0x${chainConfig.id.toString(16)}`,
                  chainName: chainConfig.displayName,
                  nativeCurrency: {
                    name: selectedChain === 'flow' ? 'Flow' : 'ETH',
                    symbol: selectedChain === 'flow' ? 'FLOW' : 'ETH',
                    decimals: 18,
                  },
                  rpcUrls: [chainConfig.rpcUrl],
                  blockExplorerUrls: [chainConfig.explorerUrl],
                }],
              });
              console.log(`   ✅ Added chain ${chainConfig.id}`);
            } else {
              throw switchError;
            }
          }
        }

        const walletClient = createWalletClient({
          account: userAddress,
          chain: selectedChain === 'base' ? baseSepolia : {
            id: chainConfig.id,
            name: chainConfig.displayName,
            nativeCurrency: { name: 'Flow', symbol: 'FLOW', decimals: 18 },
            rpcUrls: { default: { http: [chainConfig.rpcUrl] } },
          } as any,
          transport: custom(ethereumProvider),
        });

        const approveData = encodeFunctionData({
          abi: USDC_ABI,
          functionName: 'approve',
          args: [chainConfig.contracts.tapToTradeExecutor as `0x${string}`, BigInt(amount)],
        });

        const txHash = await walletClient.sendTransaction({
          account: userAddress,
          to: chainConfig.contracts.mockUSDC as `0x${string}`,
          data: approveData,
          chain: selectedChain === 'base' ? baseSepolia : {
            id: chainConfig.id,
            name: chainConfig.displayName,
            nativeCurrency: { name: 'Flow', symbol: 'FLOW', decimals: 18 },
            rpcUrls: { default: { http: [chainConfig.rpcUrl] } },
          } as any,
        });

        console.log('⏳ Waiting for approval transaction...', txHash);

        // Wait a bit for transaction to be mined
        await new Promise(resolve => setTimeout(resolve, 5000));

        // Refresh allowance
        await fetchAllowance();

        console.log(`✅ USDC approved for TapToTrade on ${selectedChain}!`);

        return txHash;
      } catch (error: any) {
        console.error('Failed to approve USDC for TapToTrade:', error);
        console.error('Error details:', {
          message: error?.message,
          code: error?.code,
          data: error?.data,
        });
        throw error;
      } finally {
        setIsPending(false);
      }
    },
    [authenticated, embeddedWallet, selectedChain, fetchAllowance]
  );

  /**
   * Check if user has sufficient allowance (> threshold)
   */
  const hasAllowance = useCallback(
    (threshold: bigint = parseUnits('10000', USDC_DECIMALS)) => {
      return allowance !== null && allowance > threshold;
    },
    [allowance]
  );

  // Fetch allowance on mount and when dependencies change
  useEffect(() => {
    if (authenticated && walletsReady) {
      fetchAllowance();
    }
  }, [authenticated, walletsReady, fetchAllowance]);

  return {
    allowance,
    approve,
    hasAllowance,
    isPending,
    isLoading,
    refetch: fetchAllowance,
    checkAllowance: fetchAllowance, // Alias for compatibility
  };
}

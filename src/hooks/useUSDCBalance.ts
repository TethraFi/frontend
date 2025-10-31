import { useEffect, useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { createPublicClient, http, formatUnits } from 'viem';
import { baseSepolia } from 'wagmi/chains';
import { USDC_DECIMALS } from '@/config/contracts';
import { useChain } from '@/app/contexts/ChainContext';
import { getChainConfig } from '@/config/chains';

/**
 * Custom hook to fetch USDC balance from the embedded wallet
 * Multi-chain support: fetches balance based on selected chain
 */
export const useUSDCBalance = () => {
  const { authenticated, user } = usePrivy();
  const { selectedChain } = useChain();
  const [usdcBalance, setUsdcBalance] = useState<string>('0.00');
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);

  useEffect(() => {
    const fetchUsdcBalance = async () => {
      if (!authenticated || !user) {
        setUsdcBalance('0.00');
        return;
      }

      // Get embedded wallet address (same logic as WalletConnectButton)
      const embeddedWallets = user.linkedAccounts?.filter(
        (account: any) =>
          account.type === 'wallet' &&
          account.imported === false &&
          account.id !== undefined
      ) as any[];

      const embeddedWalletAddress = embeddedWallets?.[0]?.address || user?.wallet?.address;

      if (!embeddedWalletAddress) {
        setUsdcBalance('0.00');
        return;
      }

      setIsLoadingBalance(true);
      try {
        // Get chain-specific configuration
        const chainConfig = getChainConfig(selectedChain);

        // Create publicClient for the selected chain
        const publicClient = createPublicClient({
          chain: selectedChain === 'base' ? baseSepolia : {
            id: chainConfig.id,
            name: chainConfig.displayName,
            nativeCurrency: { name: 'Flow', symbol: 'FLOW', decimals: 18 },
            rpcUrls: {
              default: { http: [chainConfig.rpcUrl] },
            },
          } as any,
          transport: http(chainConfig.rpcUrl),
        });

        // Get USDC address for the selected chain
        const usdcAddress = chainConfig.contracts.mockUSDC as `0x${string}`;

        const balance = await publicClient.readContract({
          address: usdcAddress,
          abi: [
            {
              constant: true,
              inputs: [{ name: '_owner', type: 'address' }],
              name: 'balanceOf',
              outputs: [{ name: 'balance', type: 'uint256' }],
              type: 'function',
            },
          ],
          functionName: 'balanceOf',
          args: [embeddedWalletAddress as `0x${string}`],
        }) as bigint;

        // Format USDC balance using configured decimals
        const formattedBalance = formatUnits(balance, USDC_DECIMALS);
        setUsdcBalance(parseFloat(formattedBalance).toFixed(2));
      } catch (error) {
        console.error(`Error fetching USDC balance on ${selectedChain}:`, error);
        setUsdcBalance('0.00');
      } finally {
        setIsLoadingBalance(false);
      }
    };

    if (authenticated && user) {
      fetchUsdcBalance();

      // Refresh balance every 5 seconds to keep it in sync
      const interval = setInterval(fetchUsdcBalance, 5000);
      return () => clearInterval(interval);
    }
  }, [authenticated, user, selectedChain]);

  return { usdcBalance, isLoadingBalance };
};

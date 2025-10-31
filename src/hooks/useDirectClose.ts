/**
 * Hook for closing positions DIRECTLY via PositionManager
 * This bypasses MarketExecutor to avoid settlement logic bugs
 * User pays gas with ETH (non-gasless)
 */

import { useWaitForTransactionReceipt } from 'wagmi';
import { encodeFunctionData } from 'viem';
import { useState, useCallback } from 'react';
import { baseSepolia } from 'wagmi/chains';
import { useWallets } from '@privy-io/react-auth';
import { MARKET_EXECUTOR_ADDRESS } from '@/config/contracts';
import MarketExecutorJSON from '@/contracts/abis/MarketExecutor.json';

// Extract the actual ABI array from the JSON object
const MarketExecutorABI = (MarketExecutorJSON as any).abi;
import { getSignedPrice, SignedPriceData } from '@/lib/priceApi';
import { toast } from 'react-hot-toast';
import { useEmbeddedWallet } from './useEmbeddedWallet';

export interface DirectCloseParams {
  positionId: bigint;
  symbol: string;
}

/**
 * Hook to close position directly via PositionManager
 * User pays gas, no settlement logic issues
 */
export function useDirectClosePosition() {
  const { address } = useEmbeddedWallet();
  const { wallets } = useWallets();
  const [isLoadingPrice, setIsLoadingPrice] = useState(false);
  const [hash, setHash] = useState<`0x${string}` | undefined>();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const closePosition = useCallback(async (params: DirectCloseParams) => {
    try {
      setIsLoadingPrice(true);
      setIsPending(true);
      setError(null);
      
      if (!address) {
        throw new Error('Wallet not connected');
      }
      
      // Validate position ID is not zero
      if (!params.positionId || params.positionId === 0n) {
        throw new Error('Invalid position ID');
      }
      
      // Find embedded wallet
      const embeddedWallet = wallets.find(
        (w) => w.walletClientType === 'privy' && w.address === address
      );

      if (!embeddedWallet) {
        throw new Error('Embedded wallet not found');
      }
      
      console.log('🔒 Closing position via NEW MarketExecutor (non-gasless)...');
      console.log('  Position ID:', params.positionId.toString());
      
      // Get current price from backend
      const signedPrice: SignedPriceData = await getSignedPrice(params.symbol);
      
      setIsLoadingPrice(false);
      
      console.log('  Exit Price:', signedPrice.price);

      await embeddedWallet.switchChain(baseSepolia.id);
      const walletClient = await embeddedWallet.getEthereumProvider();
      
      if (!walletClient) {
        throw new Error('Could not get wallet client');
      }

      // Encode call to NEW MarketExecutor.closeMarketPosition (fixed settlement logic)
      const data = encodeFunctionData({
        abi: MarketExecutorABI,
        functionName: 'closeMarketPosition',
        args: [
          params.positionId,
          {
            symbol: params.symbol,
            price: BigInt(signedPrice.price),
            timestamp: BigInt(signedPrice.timestamp),
            signature: signedPrice.signature as `0x${string}`,
          },
        ],
      });

      console.log('⛽ Estimating gas...');
      
      // Estimate gas
      const gasEstimate = await walletClient.request({
        method: 'eth_estimateGas',
        params: [{
          from: address,
          to: MARKET_EXECUTOR_ADDRESS,
          data,
        }],
      });
      
      const gasLimit = (BigInt(gasEstimate as string) * 130n) / 100n; // 30% buffer
      console.log('  Gas estimate:', gasEstimate.toString());
      console.log('  Gas limit (with buffer):', gasLimit.toString());

      // Send transaction
      console.log('📤 Sending close transaction...');
      const txHash = await walletClient.request({
        method: 'eth_sendTransaction',
        params: [{
          from: address,
          to: MARKET_EXECUTOR_ADDRESS,
          data,
          gas: '0x' + gasLimit.toString(16),
        }],
      });

      console.log('✅ Position closed! TX:', txHash);
      setHash(txHash as `0x${string}`);
      
      toast.success('Position closed successfully!', {
        duration: 5000,
      });
      
    } catch (err) {
      setIsLoadingPrice(false);
      console.error('❌ Error closing position:', err);
      setError(err as Error);
      
      const errorMsg = (err as Error).message || 'Unknown error';
      toast.error(`Failed to close: ${errorMsg}`, {
        duration: 7000,
      });
      
      throw err;
    } finally {
      setIsPending(false);
    }
  }, [address, wallets]);

  return {
    closePosition,
    isPending: isPending || isLoadingPrice,
    isConfirming,
    isSuccess,
    error,
    hash,
    isLoadingPrice,
  };
}

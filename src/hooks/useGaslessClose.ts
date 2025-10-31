/**
 * HACKATHON MODE: Gasless close position via backend
 * Backend relayer pays gas, no user signature needed
 * Now supports multi-chain!
 */

import { useState, useCallback } from 'react';
import { useEmbeddedWallet } from './useEmbeddedWallet';
import { useChain } from '@/app/contexts/ChainContext';
import { toast } from 'react-hot-toast';
import { ChainType } from '@/config/chains';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

export interface GaslessCloseParams {
  positionId: bigint;
  symbol: string;
  chain?: ChainType; // Optional: Use position's actual chain if provided
}

export function useGaslessClose() {
  const { address } = useEmbeddedWallet();
  const { selectedChain } = useChain();
  const [isPending, setIsPending] = useState(false);
  const [txHash, setTxHash] = useState<string | undefined>();
  const [error, setError] = useState<Error | null>(null);

  const closePosition = useCallback(async (params: GaslessCloseParams) => {
    try {
      setIsPending(true);
      setError(null);
      setTxHash(undefined);

      if (!address) {
        throw new Error('Wallet not connected');
      }

      // Use position's actual chain if provided, otherwise use wallet's current chain
      const targetChain = params.chain || selectedChain;

      console.log('🔥 GASLESS CLOSE via backend...');
      console.log('  Chain:', targetChain);
      console.log('  Position ID:', params.positionId.toString());
      console.log('  Symbol:', params.symbol);
      console.log('  User:', address);

      // Call backend endpoint with chain info
      const response = await fetch(`${BACKEND_URL}/api/relay/close-position`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userAddress: address,
          positionId: params.positionId.toString(),
          symbol: params.symbol,
          chain: targetChain, // Use position's actual chain
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || result.message || 'Failed to close position');
      }

      const hash = result.data.txHash;
      setTxHash(hash);

      console.log('✅ Position closed gaslessly! TX:', hash);
      toast.success(`Position closed! TX: ${hash.slice(0, 10)}...`, {
        duration: 5000,
      });

      return hash;
      
    } catch (err) {
      console.error('❌ Error closing position gaslessly:', err);
      setError(err as Error);
      
      const errorMsg = (err as Error).message || 'Unknown error';
      toast.error(`Failed to close: ${errorMsg}`, {
        duration: 7000,
      });
      
      throw err;
    } finally {
      setIsPending(false);
    }
  }, [address, selectedChain]);

  return {
    closePosition,
    isPending,
    txHash,
    error,
  };
}

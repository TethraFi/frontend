/**
 * Hook to fetch and manage user positions
 * Now supports multi-chain!
 */

import { useReadContract } from 'wagmi';
import { useEmbeddedWallet } from './useEmbeddedWallet';
import { useContracts } from './useContracts';
import PositionManagerABI from '@/contracts/abis/PositionManager.json';
import { ChainType, getChainConfig } from '@/config/chains';

export interface Position {
  id: bigint;
  trader: string;
  symbol: string;
  isLong: boolean;
  collateral: bigint;
  size: bigint;
  leverage: bigint;
  entryPrice: bigint;
  openTimestamp: bigint;
  status: number; // 0 = OPEN, 1 = CLOSED, 2 = LIQUIDATED
  chain?: ChainType; // Added chain identifier
}

/**
 * Hook to get all user positions
 * Automatically uses the correct PositionManager based on selected chain
 */
export function useUserPositions() {
  const { address } = useEmbeddedWallet();
  const contracts = useContracts();

  const { data: positionIds, isLoading: isLoadingIds, refetch: refetchIds } = useReadContract({
    address: contracts.POSITION_MANAGER_ADDRESS,
    abi: PositionManagerABI,
    functionName: 'getUserPositions',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
      refetchInterval: 5000, // Refetch every 5 seconds
    },
  });

  return {
    positionIds: (positionIds as bigint[]) || [],
    isLoading: isLoadingIds,
    refetch: refetchIds,
  };
}

/**
 * Hook to get single position details
 * Automatically uses the correct PositionManager based on selected chain OR specified chain
 */
export function usePosition(positionId: bigint | undefined, chain?: ChainType) {
  const contracts = useContracts();

  // Use provided chain or get current chain config
  const positionManagerAddress = chain
    ? getChainConfig(chain).contracts.positionManager as `0x${string}`
    : contracts.POSITION_MANAGER_ADDRESS;

  const chainId = chain ? getChainConfig(chain).id : undefined;

  const { data, isLoading, refetch } = useReadContract({
    address: positionManagerAddress,
    abi: PositionManagerABI,
    functionName: 'getPosition',
    args: positionId !== undefined ? [positionId] : undefined,
    chainId: chainId, // Specify chain ID for multi-chain support
    query: {
      enabled: positionId !== undefined,
      refetchInterval: 5000, // Refetch every 5 seconds
    },
  });

  // Parse position data from tuple
  if (!data) {
    return {
      position: null,
      isLoading,
      refetch,
    };
  }
  
  // Try to parse as object first (wagmi v2 returns objects for structs)
  let position: Position;
  
  if (typeof data === 'object' && !Array.isArray(data)) {
    // Data is returned as an object with named properties
    const dataObj = data as any;
    
    // Check if data has properties or is just keys (0,1,2,3...)
    // Wagmi sometimes returns object with numeric keys like {0: value, 1: value2}
    const hasNumericKeys = '0' in dataObj && '1' in dataObj;
    
    if (hasNumericKeys) {
      // Object with numeric keys - treat as array
      position = {
        id: dataObj[0],
        trader: dataObj[1],
        symbol: dataObj[2],
        isLong: dataObj[3],
        collateral: dataObj[4],
        size: dataObj[5],
        leverage: dataObj[6],
        entryPrice: dataObj[7],
        openTimestamp: dataObj[8],
        status: dataObj[9],
      };
    } else {
      // Object with named properties
      position = {
        id: dataObj.id,
        trader: dataObj.trader,
        symbol: dataObj.symbol,
        isLong: dataObj.isLong,
        collateral: dataObj.collateral,
        size: dataObj.size,
        leverage: dataObj.leverage,
        entryPrice: dataObj.entryPrice,
        openTimestamp: dataObj.openTimestamp,
        status: dataObj.status,
      };
    }
  } else {
    // Data is returned as an array (fallback)
    const positionArray = data as any[];
    position = {
      id: positionArray[0],
      trader: positionArray[1],
      symbol: positionArray[2],
      isLong: positionArray[3],
      collateral: positionArray[4],
      size: positionArray[5],
      leverage: positionArray[6],
      entryPrice: positionArray[7],
      openTimestamp: positionArray[8],
      status: positionArray[9],
    };
  }
  
  // Check if position has valid data
  if (!position.id || position.id === 0n) {
    return {
      position: null,
      isLoading,
      refetch,
    };
  }

  return {
    position,
    isLoading,
    refetch,
  };
}

/**
 * Hook to get all user positions with full details
 * Fetches each position individually since batch function may not exist
 */
export function useUserPositionsWithDetails() {
  const { positionIds, isLoading: isLoadingIds, refetch: refetchIds } = useUserPositions();

  // For now, just use the position IDs and fetch them individually in the component
  // This is a simpler approach that doesn't require a batch function
  return {
    positions: [],
    positionIds,
    allPositions: [],
    isLoading: isLoadingIds,
    refetch: refetchIds,
  };
}

/**
 * Hook to get positions from a specific chain
 */
function usePositionsFromChain(chain: ChainType) {
  const { address } = useEmbeddedWallet();
  const chainConfig = getChainConfig(chain);

  const { data: positionIds, isLoading } = useReadContract({
    address: chainConfig.contracts.positionManager as `0x${string}`,
    abi: PositionManagerABI,
    functionName: 'getUserPositions',
    args: address ? [address] : undefined,
    chainId: chainConfig.id, // Specify chain ID for multi-chain support
    query: {
      enabled: !!address,
      refetchInterval: 5000,
    },
  });

  return {
    positionIds: (positionIds as bigint[]) || [],
    isLoading,
    chain,
  };
}

/**
 * Hook to get ALL user positions from ALL chains
 * Returns positions from both Base and Flow chains with chain identifier
 */
export function useAllChainPositions() {
  const basePositions = usePositionsFromChain('base');
  const flowPositions = usePositionsFromChain('flow');

  // Combine position IDs with chain info
  const allPositionIds = [
    ...basePositions.positionIds.map(id => ({ id, chain: 'base' as ChainType })),
    ...flowPositions.positionIds.map(id => ({ id, chain: 'flow' as ChainType })),
  ];

  return {
    allPositionIds,
    basePositionIds: basePositions.positionIds,
    flowPositionIds: flowPositions.positionIds,
    isLoading: basePositions.isLoading || flowPositions.isLoading,
  };
}

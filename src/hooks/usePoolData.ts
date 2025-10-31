import { useState, useEffect } from 'react';
import { usePublicClient } from 'wagmi';
import { formatUnits } from 'viem';

// Contract addresses from environment variables
const TREASURY_MANAGER = process.env.NEXT_PUBLIC_TREASURY_MANAGER_ADDRESS as `0x${string}`;
const TETHRA_STAKING = process.env.NEXT_PUBLIC_TETHRA_STAKING_ADDRESS as `0x${string}`;
const LIQUIDITY_MINING = process.env.NEXT_PUBLIC_LIQUIDITY_MINING_ADDRESS as `0x${string}`;
const USDC_TOKEN = process.env.NEXT_PUBLIC_USDC_TOKEN_ADDRESS as `0x${string}`;

// ABI fragments for the functions we need
const treasuryManagerABI = [
  {
    inputs: [],
    name: 'getTotalBalance',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getAvailableLiquidity',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'totalFeesCollected',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'liquidityPool',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

const stakingABI = [
  {
    inputs: [],
    name: 'totalStaked',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'totalRewardsDistributed',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'rewardsPer7Days', type: 'uint256' }],
    name: 'calculateAPR',
    outputs: [{ internalType: 'uint256', name: 'apr', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

const liquidityMiningABI = [
  {
    inputs: [],
    name: 'totalLiquidity',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'totalRewardsDistributed',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'calculateAPR',
    outputs: [{ internalType: 'uint256', name: 'apr', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

export interface PoolData {
  totalTVL: string;
  liquidityPoolTVL: string;
  stakingTVL: string;
  miningTVL: string;
  totalFeesCollected: string;
  stakingAPR: string;
  miningAPR: string;
  totalRewardsDistributed: string;
  isLoading: boolean;
  error: string | null;
}

export const usePoolData = (): PoolData => {
  const [data, setData] = useState<PoolData>({
    totalTVL: '0',
    liquidityPoolTVL: '0',
    stakingTVL: '0',
    miningTVL: '0',
    totalFeesCollected: '0',
    stakingAPR: '0',
    miningAPR: '0',
    totalRewardsDistributed: '0',
    isLoading: true,
    error: null,
  });

  const publicClient = usePublicClient();

  useEffect(() => {
    const fetchPoolData = async () => {
      if (!publicClient) return;

      try {
        // Only show loading on initial fetch, not on refresh
        setData(prev => ({ ...prev, error: null }));
        
        // Set loading to true only if this is initial load (no previous data)
        setData(prev => ({
          ...prev,
          isLoading: prev.totalTVL === '0', // Only loading if no data yet
        }));

        // Fetch data from all contracts in parallel
        const [
          treasuryBalance,
          availableLiquidity,
          feesCollected,
          liquidityPool,
          stakingTVL,
          stakingRewards,
          miningTVL,
          miningRewards,
        ] = await Promise.all([
          // Treasury Manager data
          publicClient.readContract({
            address: TREASURY_MANAGER,
            abi: treasuryManagerABI,
            functionName: 'getTotalBalance',
          }),
          publicClient.readContract({
            address: TREASURY_MANAGER,
            abi: treasuryManagerABI,
            functionName: 'getAvailableLiquidity',
          }),
          publicClient.readContract({
            address: TREASURY_MANAGER,
            abi: treasuryManagerABI,
            functionName: 'totalFeesCollected',
          }),
          publicClient.readContract({
            address: TREASURY_MANAGER,
            abi: treasuryManagerABI,
            functionName: 'liquidityPool',
          }),
          // Staking data
          publicClient.readContract({
            address: TETHRA_STAKING,
            abi: stakingABI,
            functionName: 'totalStaked',
          }),
          publicClient.readContract({
            address: TETHRA_STAKING,
            abi: stakingABI,
            functionName: 'totalRewardsDistributed',
          }),
          // Mining data
          publicClient.readContract({
            address: LIQUIDITY_MINING,
            abi: liquidityMiningABI,
            functionName: 'totalLiquidity',
          }),
          publicClient.readContract({
            address: LIQUIDITY_MINING,
            abi: liquidityMiningABI,
            functionName: 'totalRewardsDistributed',
          }),
        ]);

        // Calculate APRs (simulate some rewards for demo)
        const [stakingAPR, miningAPR] = await Promise.all([
          publicClient.readContract({
            address: TETHRA_STAKING,
            abi: stakingABI,
            functionName: 'calculateAPR',
            args: [BigInt(3)], // Simulate 3 USDC weekly rewards (normalized)
          }).catch(() => BigInt(1500)), // Fallback to 15% APR
          
          publicClient.readContract({
            address: LIQUIDITY_MINING,
            abi: liquidityMiningABI,
            functionName: 'calculateAPR',
          }).catch(() => BigInt(2500)), // Fallback to 25% APR
        ]);

        // Calculate total TVL (Treasury + Staking value + Mining)
        const stakingValue = Number(formatUnits(stakingTVL as bigint, 18)) * 1; // Assume 1 TETH = $1
        const treasuryValue = Number(formatUnits(treasuryBalance as bigint, 6));
        const miningValue = Number(formatUnits(miningTVL as bigint, 6));
        const totalTVLValue = treasuryValue + stakingValue + miningValue;

        // Format the data
        const formattedData: PoolData = {
          totalTVL: formatCurrency(totalTVLValue),
          liquidityPoolTVL: formatCurrency(Number(formatUnits(liquidityPool as bigint, 6))),
          stakingTVL: `${formatTokens(Number(formatUnits(stakingTVL as bigint, 18)))} TETH`,
          miningTVL: formatCurrency(Number(formatUnits(miningTVL as bigint, 6))),
          totalFeesCollected: formatCurrency(Number(formatUnits(feesCollected as bigint, 6))),
          stakingAPR: `${(Number(stakingAPR) / 10000).toFixed(2)}%`,
          miningAPR: `${(Number(miningAPR) / 100).toFixed(2)}%`,
          totalRewardsDistributed: formatCurrency(
            Number(formatUnits(stakingRewards as bigint, 6)) +
            Number(formatUnits(miningRewards as bigint, 18))
          ),
          isLoading: false,
          error: null,
        };

        setData(formattedData);
      } catch (error) {
        console.error('Error fetching pool data:', error);
        setData(prev => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        }));
      }
    };

    fetchPoolData();

    // Refresh data every 60 seconds
    const interval = setInterval(fetchPoolData, 60000);

    return () => clearInterval(interval);
  }, [publicClient]);

  return data;
};

// Helper functions
const formatCurrency = (value: number): string => {
  if (value >= 1e9) {
    return `$${(value / 1e9).toFixed(2)}b`;
  } else if (value >= 1e6) {
    return `$${(value / 1e6).toFixed(2)}m`;
  } else if (value >= 1e3) {
    return `$${(value / 1e3).toFixed(2)}k`;
  }
  return `$${value.toFixed(2)}`;
};

const formatTokens = (value: number): string => {
  if (value >= 1e9) {
    return `${(value / 1e9).toFixed(2)}b`;
  } else if (value >= 1e6) {
    return `${(value / 1e6).toFixed(2)}m`;
  } else if (value >= 1e3) {
    return `${(value / 1e3).toFixed(2)}k`;
  }
  return value.toFixed(0);
};

export default usePoolData;
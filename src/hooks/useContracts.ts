import { useMemo } from 'react';
import { useChain } from '@/app/contexts/ChainContext';
import { getChainConfig } from '@/config/chains';

/**
 * Hook to get contract addresses based on selected chain
 */
export const useContracts = () => {
  const { selectedChain } = useChain();

  const contracts = useMemo(() => {
    const chainConfig = getChainConfig(selectedChain);
    return {
      // Token Contracts
      USDC_ADDRESS: chainConfig.contracts.mockUSDC as `0x${string}`,
      TETHRA_TOKEN_ADDRESS: chainConfig.contracts.tethraToken as `0x${string}`,

      // Core Trading
      MARKET_EXECUTOR_ADDRESS: chainConfig.contracts.marketExecutor as `0x${string}`,
      LIMIT_EXECUTOR_ADDRESS: chainConfig.contracts.limitExecutorV2 as `0x${string}`,
      TAP_TO_TRADE_EXECUTOR_ADDRESS: chainConfig.contracts.tapToTradeExecutor as `0x${string}`,
      POSITION_MANAGER_ADDRESS: chainConfig.contracts.positionManager as `0x${string}`,
      RISK_MANAGER_ADDRESS: chainConfig.contracts.riskManager as `0x${string}`,
      TREASURY_MANAGER_ADDRESS: chainConfig.contracts.treasuryManager as `0x${string}`,
      ONE_TAP_PROFIT_ADDRESS: chainConfig.contracts.oneTapProfit as `0x${string}`,

      // Utility
      USDC_PAYMASTER_ADDRESS: chainConfig.contracts.usdcPaymaster as `0x${string}`,

      // Staking & Incentives
      TETHRA_STAKING_ADDRESS: chainConfig.contracts.tethraStaking as `0x${string}`,
      LIQUIDITY_MINING_ADDRESS: chainConfig.contracts.liquidityMining as `0x${string}`,

      // Chain info
      chainId: chainConfig.id,
      rpcUrl: chainConfig.rpcUrl,
      explorerUrl: chainConfig.explorerUrl,
      chainName: chainConfig.displayName,
    };
  }, [selectedChain]);

  return contracts;
};

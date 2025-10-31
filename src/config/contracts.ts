/**
 * Smart Contract Addresses Configuration
 *
 * DEPRECATED: This file is kept for backward compatibility.
 * For multi-chain support, use getChainConfig() from '@/config/chains'
 * or useContracts() hook from '@/hooks/useContracts'
 *
 * Default addresses below are for Base Sepolia (for existing code compatibility)
 */

import { baseConfig } from './chains';

// Token Contracts - Base Sepolia (default)
export const USDC_ADDRESS = (process.env.NEXT_PUBLIC_USDC_ADDRESS || baseConfig.contracts.mockUSDC) as `0x${string}`;
export const TETHRA_TOKEN_ADDRESS = (process.env.NEXT_PUBLIC_TETHRA_TOKEN_ADDRESS || baseConfig.contracts.tethraToken) as `0x${string}`;

// Core Trading Contracts
export const MARKET_EXECUTOR_ADDRESS = (process.env.NEXT_PUBLIC_MARKET_EXECUTOR_ADDRESS || baseConfig.contracts.marketExecutor) as `0x${string}`;
export const LIMIT_EXECUTOR_ADDRESS = (process.env.NEXT_PUBLIC_LIMIT_EXECUTOR_ADDRESS || baseConfig.contracts.limitExecutorV2) as `0x${string}`;
export const TAP_TO_TRADE_EXECUTOR_ADDRESS = (process.env.NEXT_PUBLIC_TAP_TO_TRADE_EXECUTOR_ADDRESS || baseConfig.contracts.tapToTradeExecutor) as `0x${string}`;
export const POSITION_MANAGER_ADDRESS = (process.env.NEXT_PUBLIC_POSITION_MANAGER_ADDRESS || baseConfig.contracts.positionManager) as `0x${string}`;
export const RISK_MANAGER_ADDRESS = (process.env.NEXT_PUBLIC_RISK_MANAGER_ADDRESS || baseConfig.contracts.riskManager) as `0x${string}`;
export const TREASURY_MANAGER_ADDRESS = (process.env.NEXT_PUBLIC_TREASURY_MANAGER_ADDRESS || baseConfig.contracts.treasuryManager) as `0x${string}`;
export const ONE_TAP_PROFIT_ADDRESS = (process.env.NEXT_PUBLIC_ONE_TAP_PROFIT_ADDRESS || baseConfig.contracts.oneTapProfit) as `0x${string}`;

// Economic Contracts
export const TETHRA_STAKING_ADDRESS = (process.env.NEXT_PUBLIC_TETHRA_STAKING_ADDRESS || baseConfig.contracts.tethraStaking) as `0x${string}`;
export const LIQUIDITY_MINING_ADDRESS = (process.env.NEXT_PUBLIC_LIQUIDITY_MINING_ADDRESS || baseConfig.contracts.liquidityMining) as `0x${string}`;

// Utility Contracts
export const USDC_PAYMASTER_ADDRESS = (process.env.NEXT_PUBLIC_USDC_PAYMASTER_ADDRESS || baseConfig.contracts.usdcPaymaster) as `0x${string}`;

// Configuration Addresses
export const DEPLOYER_ADDRESS = (process.env.NEXT_PUBLIC_DEPLOYER_ADDRESS || baseConfig.contracts.keeperWallet) as `0x${string}`;
export const TREASURY_ADDRESS = (process.env.NEXT_PUBLIC_TREASURY_ADDRESS || baseConfig.contracts.protocolTreasury) as `0x${string}`;
export const PRICE_SIGNER_ADDRESS = (process.env.NEXT_PUBLIC_PRICE_SIGNER_ADDRESS || baseConfig.contracts.priceSigner) as `0x${string}`;

// Network Configuration - Base Sepolia (default)
export const CHAIN_ID = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || baseConfig.id.toString());
export const NETWORK_NAME = process.env.NEXT_PUBLIC_NETWORK_NAME || baseConfig.name;
export const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || baseConfig.rpcUrl;

// Backend API Configuration
export const BACKEND_API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

// Token Decimals
export const USDC_DECIMALS = 6;
export const TETHRA_DECIMALS = 18;

// Contract Configuration Object (for easy export)
export const CONTRACTS = {
  tokens: {
    usdc: USDC_ADDRESS,
    tethra: TETHRA_TOKEN_ADDRESS,
  },
  trading: {
    marketExecutor: MARKET_EXECUTOR_ADDRESS,
    limitExecutor: LIMIT_EXECUTOR_ADDRESS,
    tapToTradeExecutor: TAP_TO_TRADE_EXECUTOR_ADDRESS,
    positionManager: POSITION_MANAGER_ADDRESS,
    riskManager: RISK_MANAGER_ADDRESS,
    treasuryManager: TREASURY_MANAGER_ADDRESS,
  },
  economic: {
    staking: TETHRA_STAKING_ADDRESS,
    liquidityMining: LIQUIDITY_MINING_ADDRESS,
  },
  utility: {
    paymaster: USDC_PAYMASTER_ADDRESS,
  },
  config: {
    deployer: DEPLOYER_ADDRESS,
    treasury: TREASURY_ADDRESS,
    priceSigner: PRICE_SIGNER_ADDRESS,
  },
} as const;

// Helper function to get contract address by name - simplified to avoid TypeScript complexity
export function getContractAddress(contractName: string): string {
  // Search through all contract categories
  for (const [categoryKey, categoryValue] of Object.entries(CONTRACTS)) {
    if (contractName in categoryValue) {
      return (categoryValue as any)[contractName];
    }
  }
  
  throw new Error(`Contract "${contractName}" not found`);
}

// Export all addresses as a flat object for convenience
export const ALL_ADDRESSES = {
  USDC_ADDRESS,
  TETHRA_TOKEN_ADDRESS,
  MARKET_EXECUTOR_ADDRESS,
  LIMIT_EXECUTOR_ADDRESS,
  TAP_TO_TRADE_EXECUTOR_ADDRESS,
  POSITION_MANAGER_ADDRESS,
  RISK_MANAGER_ADDRESS,
  TREASURY_MANAGER_ADDRESS,
  TETHRA_STAKING_ADDRESS,
  LIQUIDITY_MINING_ADDRESS,
  USDC_PAYMASTER_ADDRESS,
  DEPLOYER_ADDRESS,
  TREASURY_ADDRESS,
  PRICE_SIGNER_ADDRESS,
} as const;

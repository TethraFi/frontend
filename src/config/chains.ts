/**
 * Multi-Chain Configuration
 *
 * Configuration for Base Sepolia and Flow EVM chains
 */

export type ChainType =  'flow' | 'base';

export interface ChainConfig {
  id: number;
  name: string;
  displayName: string;
  rpcUrl: string;
  explorerUrl: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  contracts: {
    // Token Contracts
    mockUSDC: string;
    tethraToken: string;

    // Core Trading
    riskManager: string;
    positionManager: string;
    treasuryManager: string;
    marketExecutor: string;
    usdcPaymaster: string;

    // Advanced Trading
    limitExecutorV2: string;
    tapToTradeExecutor: string;
    oneTapProfit: string;

    // Staking & Incentives
    tethraStaking: string;
    liquidityMining: string;

    // Role Assignments
    keeperWallet: string;
    priceSigner: string;
    teamWallet: string;
    protocolTreasury: string;
  };
}

// Base Sepolia Configuration
export const baseConfig: ChainConfig = {
  id: 84532,
  name: 'base-sepolia',
  displayName: 'Base Sepolia',
  rpcUrl: 'https://sepolia.base.org',
  explorerUrl: 'https://sepolia.basescan.org',
  nativeCurrency: {
    name: 'Ethereum',
    symbol: 'ETH',
    decimals: 18,
  },
  contracts: {
    // Token Contracts
    mockUSDC: process.env.NEXT_PUBLIC_BASE_USDC_TOKEN_ADDRESS || process.env.NEXT_PUBLIC_USDC_TOKEN_ADDRESS || '0x9d660c5d4BFE4b7fcC76f327b22ABF7773DD48c1',
    tethraToken: process.env.NEXT_PUBLIC_BASE_TETHRA_TOKEN_ADDRESS || process.env.NEXT_PUBLIC_TETHRA_TOKEN_ADDRESS || '0x6f1330f207Ab5e2a52c550AF308bA28e3c517311',

    // Core Trading
    riskManager: process.env.NEXT_PUBLIC_BASE_RISK_MANAGER_ADDRESS || process.env.NEXT_PUBLIC_RISK_MANAGER_ADDRESS || '0x08A23503CC221C3B520D2E9bA2aB93E3546d798F',
    positionManager: process.env.NEXT_PUBLIC_BASE_POSITION_MANAGER_ADDRESS || process.env.NEXT_PUBLIC_POSITION_MANAGER_ADDRESS || '0x8eA6059Bd95a9f0A47Ce361130ffB007415519aF',
    treasuryManager: process.env.NEXT_PUBLIC_BASE_TREASURY_MANAGER_ADDRESS || process.env.NEXT_PUBLIC_TREASURY_MANAGER_ADDRESS || '0x157e68fBDD7D8294badeD37d876aEb7765986681',
    marketExecutor: process.env.NEXT_PUBLIC_BASE_MARKET_EXECUTOR_ADDRESS || process.env.NEXT_PUBLIC_MARKET_EXECUTOR_ADDRESS || '0xA1badd2cea74931d668B7aB99015ede28735B3EF',
    usdcPaymaster: process.env.NEXT_PUBLIC_BASE_USDC_PAYMASTER_ADDRESS || process.env.NEXT_PUBLIC_USDC_PAYMASTER_ADDRESS || '0x94FbB9C6C854599c7562c282eADa4889115CCd8E',

    // Advanced Trading
    limitExecutorV2: process.env.NEXT_PUBLIC_BASE_LIMIT_EXECUTOR_ADDRESS || process.env.NEXT_PUBLIC_LIMIT_EXECUTOR_ADDRESS || '0x8c297677FEA6F0beDC0D1fa139aa2bc23eE6234a',
    tapToTradeExecutor: process.env.NEXT_PUBLIC_BASE_TAP_TO_TRADE_EXECUTOR_ADDRESS || process.env.NEXT_PUBLIC_TAP_TO_TRADE_EXECUTOR_ADDRESS || '0x79Cb84cF317235EA5C61Cce662373D982853E8d8',
    oneTapProfit: process.env.NEXT_PUBLIC_BASE_ONE_TAP_PROFIT_ADDRESS || process.env.NEXT_PUBLIC_ONE_TAP_PROFIT_ADDRESS || '0x5D4c52a7aD4Fb6B43C6B212Db1C1e0A7f9B0f73c',

    // Staking & Incentives
    tethraStaking: process.env.NEXT_PUBLIC_BASE_TETHRA_STAKING_ADDRESS || process.env.NEXT_PUBLIC_TETHRA_STAKING_ADDRESS || '0x69FFE0989234971eA2bc542c84c9861b0D8F9b17',
    liquidityMining: process.env.NEXT_PUBLIC_BASE_LIQUIDITY_MINING_ADDRESS || process.env.NEXT_PUBLIC_LIQUIDITY_MINING_ADDRESS || '0x76dc221f50ca56A1E8445508CA9ecc0aD57d0B11',

    // Role Assignments
    keeperWallet: process.env.NEXT_PUBLIC_BASE_DEPLOYER_ADDRESS || process.env.NEXT_PUBLIC_DEPLOYER_ADDRESS || '0x722550Bb8Ec6416522AfE9EAf446F0DE3262f701',
    priceSigner: process.env.NEXT_PUBLIC_BASE_PRICE_SIGNER_ADDRESS || process.env.NEXT_PUBLIC_PRICE_SIGNER_ADDRESS || '0x722550Bb8Ec6416522AfE9EAf446F0DE3262f701',
    teamWallet: process.env.NEXT_PUBLIC_BASE_TREASURY_ADDRESS || process.env.NEXT_PUBLIC_TREASURY_ADDRESS || '0x722550Bb8Ec6416522AfE9EAf446F0DE3262f701',
    protocolTreasury: process.env.NEXT_PUBLIC_BASE_TREASURY_ADDRESS || process.env.NEXT_PUBLIC_TREASURY_ADDRESS || '0x722550Bb8Ec6416522AfE9EAf446F0DE3262f701',
  },
};

// Flow EVM Configuration
export const flowConfig: ChainConfig = {
  id: 545, // Flow EVM Testnet
  name: 'flow-evm-testnet',
  displayName: 'Flow Testnet',
  rpcUrl: 'https://testnet.evm.nodes.onflow.org',
  explorerUrl: 'https://evm-testnet.flowscan.io',
  nativeCurrency: {
    name: 'Flow',
    symbol: 'FLOW',
    decimals: 18,
  },
  contracts: {
    // Token Contracts
    mockUSDC: process.env.NEXT_PUBLIC_FLOW_USDC_TOKEN_ADDRESS || '0x2c6887Fa522B551992974b68ffB1660f6d2F8340',
    tethraToken: process.env.NEXT_PUBLIC_FLOW_TETHRA_TOKEN_ADDRESS || '0xfEC753Dd7648c3a37828E52a7c531aA6b27B95EB',

    // Core Trading
    riskManager: process.env.NEXT_PUBLIC_FLOW_RISK_MANAGER_ADDRESS || '0xc04B2294D30D6e077B1736d84A11DFe6f68e9745',
    positionManager: process.env.NEXT_PUBLIC_FLOW_POSITION_MANAGER_ADDRESS || '0x29Bc61d98d9BD0298C010D59A5C2e5a2CB5D8958',
    treasuryManager: process.env.NEXT_PUBLIC_FLOW_TREASURY_MANAGER_ADDRESS || '0xADbb3D9eE68d701e61bA49DDe3fa85e4864c00e9',
    marketExecutor: process.env.NEXT_PUBLIC_FLOW_MARKET_EXECUTOR_ADDRESS || '0x5f6fe2dee3A77F255057A4210958784B60A9C66D',
    usdcPaymaster: process.env.NEXT_PUBLIC_FLOW_USDC_PAYMASTER_ADDRESS || '0x3aB9B3DD9D96F063902A8FE12Ed1401e26c5D533',

    // Advanced Trading
    limitExecutorV2: process.env.NEXT_PUBLIC_FLOW_LIMIT_EXECUTOR_ADDRESS || '0x9782F89bDB822059FeaC76425b10f81A1E2d5d3f',
    tapToTradeExecutor: process.env.NEXT_PUBLIC_FLOW_TAP_TO_TRADE_EXECUTOR_ADDRESS || '0xD59551d80BDfe94662ACed1d27b5b12792711072',
    oneTapProfit: process.env.NEXT_PUBLIC_FLOW_ONE_TAP_PROFIT_ADDRESS || '0x42C53C1769779277B74bD89b3e6994E88d33E285',

    // Staking & Incentives
    tethraStaking: process.env.NEXT_PUBLIC_FLOW_TETHRA_STAKING_ADDRESS || '0x3c30c160406fd840A571B65fD475A91F960B730E',
    liquidityMining: process.env.NEXT_PUBLIC_FLOW_LIQUIDITY_MINING_ADDRESS || '0xE9de7BF710B98D465BB90a92599F40431b0D3Bf8',

    // Role Assignments
    keeperWallet: process.env.NEXT_PUBLIC_FLOW_DEPLOYER_ADDRESS || '0x722550Bb8Ec6416522AfE9EAf446F0DE3262f701',
    priceSigner: process.env.NEXT_PUBLIC_FLOW_PRICE_SIGNER_ADDRESS || '0x722550Bb8Ec6416522AfE9EAf446F0DE3262f701',
    teamWallet: process.env.NEXT_PUBLIC_FLOW_TREASURY_ADDRESS || '0x722550Bb8Ec6416522AfE9EAf446F0DE3262f701',
    protocolTreasury: process.env.NEXT_PUBLIC_FLOW_TREASURY_ADDRESS || '0x722550Bb8Ec6416522AfE9EAf446F0DE3262f701',
  },
};

// Chain configurations map
export const CHAIN_CONFIGS: Record<ChainType, ChainConfig> = {
  base: baseConfig,
  flow: flowConfig,
};

// Helper function to get chain config
export function getChainConfig(chainType: ChainType): ChainConfig {
  return CHAIN_CONFIGS[chainType];
}

// Helper function to get contract address
export function getContractAddress(
  chainType: ChainType,
  contractName: keyof ChainConfig['contracts']
): string {
  return CHAIN_CONFIGS[chainType].contracts[contractName];
}

// Token decimals
export const USDC_DECIMALS = 6;
export const TETHRA_DECIMALS = 18;

// Backend API Configuration
export const BACKEND_API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

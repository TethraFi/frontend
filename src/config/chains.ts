/**
 * Multi-Chain Configuration
 *
 * Configuration for Base Sepolia and Flow EVM chains
 */

export type ChainType = 'base' | 'flow';

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
    // Token Contracts (from current .env)
    mockUSDC: process.env.NEXT_PUBLIC_USDC_TOKEN_ADDRESS || '0x9d660c5d4BFE4b7fcC76f327b22ABF7773DD48c1',
    tethraToken: process.env.NEXT_PUBLIC_TETHRA_TOKEN_ADDRESS || '0x6f1330f207Ab5e2a52c550AF308bA28e3c517311',

    // Core Trading
    riskManager: process.env.NEXT_PUBLIC_RISK_MANAGER_ADDRESS || '0x08A23503CC221C3B520D2E9bA2aB93E3546d798F',
    positionManager: process.env.NEXT_PUBLIC_POSITION_MANAGER_ADDRESS || '0x8eA6059Bd95a9f0A47Ce361130ffB007415519aF',
    treasuryManager: process.env.NEXT_PUBLIC_TREASURY_MANAGER_ADDRESS || '0x157e68fBDD7D8294badeD37d876aEb7765986681',
    marketExecutor: process.env.NEXT_PUBLIC_MARKET_EXECUTOR_ADDRESS || '0xA1badd2cea74931d668B7aB99015ede28735B3EF',
    usdcPaymaster: process.env.NEXT_PUBLIC_USDC_PAYMASTER_ADDRESS || '0x94FbB9C6C854599c7562c282eADa4889115CCd8E',

    // Advanced Trading
    limitExecutorV2: process.env.NEXT_PUBLIC_LIMIT_EXECUTOR_ADDRESS || '0x8c297677FEA6F0beDC0D1fa139aa2bc23eE6234a',
    tapToTradeExecutor: process.env.NEXT_PUBLIC_TAP_TO_TRADE_EXECUTOR_ADDRESS || '0x79Cb84cF317235EA5C61Cce662373D982853E8d8',
    oneTapProfit: process.env.NEXT_PUBLIC_ONE_TAP_PROFIT_ADDRESS || '0x5D4c52a7aD4Fb6B43C6B212Db1C1e0A7f9B0f73c',

    // Staking & Incentives
    tethraStaking: process.env.NEXT_PUBLIC_TETHRA_STAKING_ADDRESS || '0x69FFE0989234971eA2bc542c84c9861b0D8F9b17',
    liquidityMining: process.env.NEXT_PUBLIC_LIQUIDITY_MINING_ADDRESS || '0x76dc221f50ca56A1E8445508CA9ecc0aD57d0B11',

    // Role Assignments
    keeperWallet: process.env.NEXT_PUBLIC_DEPLOYER_ADDRESS || '0x722550Bb8Ec6416522AfE9EAf446F0DE3262f701',
    priceSigner: process.env.NEXT_PUBLIC_PRICE_SIGNER_ADDRESS || '0x722550Bb8Ec6416522AfE9EAf446F0DE3262f701',
    teamWallet: process.env.NEXT_PUBLIC_TREASURY_ADDRESS || '0x722550Bb8Ec6416522AfE9EAf446F0DE3262f701',
    protocolTreasury: process.env.NEXT_PUBLIC_TREASURY_ADDRESS || '0x722550Bb8Ec6416522AfE9EAf446F0DE3262f701',
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
    mockUSDC: '0x69FFE0989234971eA2bc542c84c9861b0D8F9b17',
    tethraToken: '0x49c37C3b3a96028D2A1A1e678A302C1d727f3FEF',

    // Core Trading
    riskManager: '0x94FbB9C6C854599c7562c282eADa4889115CCd8E',
    positionManager: '0x50951f3AE8e622E007A174e7AE08f25659bCe4B0',
    treasuryManager: '0xa1c84C31165282C05450b2a86f80999dD263b071',
    marketExecutor: '0xCb5A11a2913763a01FA97CBDE67BCAB4Bf234D97',
    usdcPaymaster: '0xF515Fd4fAf79E263d6E38c77A6be7165d3F746Df',

    // Advanced Trading
    limitExecutorV2: '0x3c4AadE89D4af90666b859DaFB7DDB61C4E58C60',
    tapToTradeExecutor: '0x2f994B6Ffbe5f943cb1F1932b1CF41d81780A091',
    oneTapProfit: '0xE47b99032f7a7Efef1917A7CAA81455A3C552d17',

    // Staking & Incentives
    tethraStaking: '0xe2BF339Beb501f0C5263170189b6960AC416F1f3',
    liquidityMining: '0x6D91332E27a5BddCe9486ad4e9cA3C319947a302',

    // Role Assignments
    keeperWallet: '0x722550Bb8Ec6416522AfE9EAf446F0DE3262f701',
    priceSigner: '0x722550Bb8Ec6416522AfE9EAf446F0DE3262f701',
    teamWallet: '0x722550Bb8Ec6416522AfE9EAf446F0DE3262f701',
    protocolTreasury: '0x722550Bb8Ec6416522AfE9EAf446F0DE3262f701',
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

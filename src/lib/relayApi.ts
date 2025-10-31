/**
 * API client for gasless transaction relay service
 */

import { BACKEND_API_URL } from '@/config/contracts';

export interface RelayTransactionParams {
  to: string;
  data: string;
  userAddress: string;
  value?: string;
  chain?: 'base' | 'flow'; // Add chain parameter
}

export interface RelayTransactionResult {
  txHash: string;
  gasUsed: string;
  usdcCharged: string;
  usdcChargedFormatted: string;
  explorerUrl: string;
}

export interface PaymasterBalance {
  address: string;
  deposit: string;
  depositFormatted: string;
}

export interface GasCostEstimate {
  estimatedGas: string;
  usdcCost: string;
  usdcCostFormatted: string;
}

export interface AffordabilityCheck {
  canAfford: boolean;
  userDeposit: string;
  requiredUsdc: string;
  depositFormatted: string;
  requiredFormatted: string;
}

export interface LimitExecutionFeeEstimate {
  orderType: string;
  gasEstimate: string;
  baseCost: string;
  baseCostFormatted: string;
  bufferBps: number;
  recommendedMaxExecutionFee: string;
  recommendedFormatted: string;
}

/**
 * Relay a transaction through backend (gasless)
 */
export async function relayTransaction(params: RelayTransactionParams): Promise<RelayTransactionResult> {
  console.log('🚀 Relaying transaction with params:', {
    to: params.to,
    userAddress: params.userAddress,
    chain: params.chain,
    dataLength: params.data.length
  });

  const response = await fetch(`${BACKEND_API_URL}/api/relay/transaction`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  const result = await response.json();

  console.log('📥 Backend response:', result);

  if (!result.success) {
    console.error('❌ Backend error:', result);
    throw new Error(result.error || result.message || 'Failed to relay transaction');
  }

  return result.data;
}

/**
 * Get user's paymaster deposit balance
 */
export async function getPaymasterBalance(address: string): Promise<PaymasterBalance> {
  const response = await fetch(`${BACKEND_API_URL}/api/relay/balance/${address}`);
  const result = await response.json();

  if (!result.success) {
    throw new Error(result.error || 'Failed to get paymaster balance');
  }

  return result.data;
}

/**
 * Calculate USDC cost for estimated gas
 */
export async function calculateGasCost(estimatedGas: string): Promise<GasCostEstimate> {
  const response = await fetch(`${BACKEND_API_URL}/api/relay/calculate-cost`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ estimatedGas }),
  });

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.error || 'Failed to calculate gas cost');
  }

  return result.data;
}

/**
 * Check if user can afford gas payment
 */
export async function canAffordGas(
  userAddress: string,
  estimatedGas: string
): Promise<AffordabilityCheck> {
  const response = await fetch(`${BACKEND_API_URL}/api/relay/can-afford`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ userAddress, estimatedGas }),
  });

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.error || 'Failed to check affordability');
  }

  return result.data;
}

/**
 * Get relay service status
 */
export async function getRelayStatus(): Promise<{
  relayWalletBalance: string;
  status: string;
  warning: string | null;
}> {
  const response = await fetch(`${BACKEND_API_URL}/api/relay/status`);
  const result = await response.json();

  if (!result.success) {
    throw new Error(result.error || 'Failed to get relay status');
  }

  return result.data;
}

/**
 * Get recommended execution fee for limit orders
 */
export async function getLimitExecutionFee(
  orderType: 'limit_open' | 'limit_close' | 'stop_loss' = 'limit_open',
  options: { estimatedGas?: string; bufferBps?: number } = {}
): Promise<LimitExecutionFeeEstimate> {
  const params = new URLSearchParams({ orderType });

  if (options.estimatedGas) {
    params.set('estimatedGas', options.estimatedGas);
  }

  if (options.bufferBps !== undefined) {
    params.set('bufferBps', options.bufferBps.toString());
  }

  const response = await fetch(`${BACKEND_API_URL}/api/relay/limit/execution-fee?${params.toString()}`);
  const result = await response.json();

  if (!result.success) {
    throw new Error(result.error || 'Failed to estimate execution fee');
  }

  return result.data;
}

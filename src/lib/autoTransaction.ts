/**
 * Auto Transaction Utilities
 * Send transactions automatically without Privy confirmation modal
 */

import { encodeFunctionData } from 'viem';

export interface AutoTransactionParams {
  from: `0x${string}`;
  to: `0x${string}`;
  data: `0x${string}`;
  gas?: `0x${string}`;
  value?: `0x${string}`;
}

/**
 * Execute transaction silently using Privy's embedded wallet
 * This bypasses the confirmation UI for faster execution
 */
export async function sendAutoTransaction(
  walletClient: any,
  params: AutoTransactionParams
): Promise<`0x${string}`> {
  try {
    // Try to send transaction with minimal UI
    const txHash = await walletClient.request({
      method: 'eth_sendTransaction',
      params: [params],
    });
    
    return txHash as `0x${string}`;
  } catch (error: any) {
    // If user denied, throw specific error
    if (error?.code === 4001 || error?.message?.includes('User rejected')) {
      throw new Error('Transaction cancelled by user');
    }
    throw error;
  }
}

/**
 * Estimate gas for a transaction
 */
export async function estimateTransactionGas(
  walletClient: any,
  params: Omit<AutoTransactionParams, 'gas'>
): Promise<bigint> {
  const estimate = await walletClient.request({
    method: 'eth_estimateGas',
    params: [params],
  });
  
  const gasEstimate = typeof estimate === 'string' ? BigInt(estimate) : (estimate as bigint);
  
  // Add 20% buffer
  return (gasEstimate * 120n) / 100n;
}

/**
 * Check if transaction will succeed before sending
 */
export async function canTransactionSucceed(
  walletClient: any,
  params: Omit<AutoTransactionParams, 'gas'>
): Promise<{ success: boolean; error?: string; gasEstimate?: bigint }> {
  try {
    const gasEstimate = await estimateTransactionGas(walletClient, params);
    return { success: true, gasEstimate };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Transaction will fail',
    };
  }
}

/**
 * Build transaction data with ABI encoding
 */
export function buildTransactionData(
  abi: any[],
  functionName: string,
  args: any[]
): `0x${string}` {
  return encodeFunctionData({
    abi,
    functionName,
    args,
  });
}

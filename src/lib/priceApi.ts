/**
 * Price API Utilities
 * Handle communication with backend for signed prices
 */

import { BACKEND_API_URL } from '@/config/contracts';

export interface SignedPriceData {
  asset: string; // Asset symbol (e.g., "BTC")
  assetId: string; // keccak256 hash of asset symbol
  price: string; // Price with 8 decimals as string
  timestamp: number;
  signature: string;
  signer: string; // Signer address
  
  // Backward compatibility
  symbol?: string;
}

export interface SignedPriceResponse {
  success: boolean;
  data?: SignedPriceData;
  error?: string;
}

/**
 * Get signed price from backend
 * @param symbol Asset symbol (BTC, ETH, etc)
 * @returns Signed price data
 */
export async function getSignedPrice(symbol: string): Promise<SignedPriceData> {
  try {
    const response = await fetch(`${BACKEND_API_URL}/api/price/signed/${symbol}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get signed price: ${response.statusText}`);
    }

    const result: SignedPriceResponse = await response.json();

    console.log('asdadads', result)

    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to get signed price');
    }

    return result.data;
  } catch (error) {
    console.error('Error fetching signed price:', error);
    throw error;
  }
}

/**
 * Format price from 8 decimals to display format
 * @param price Price with 8 decimals (as string or bigint)
 * @returns Formatted price string
 */
export function formatPriceFromDecimals(price: string | bigint): string {
  const priceNum = typeof price === 'string' ? BigInt(price) : price;
  const formatted = Number(priceNum) / 1e8;
  return formatted.toFixed(2);
}

/**
 * Convert price to 8 decimals format
 * @param price Price in normal format (e.g., 50000.00)
 * @returns Price with 8 decimals as bigint
 */
export function convertPriceTo8Decimals(price: number): bigint {
  return BigInt(Math.floor(price * 1e8));
}

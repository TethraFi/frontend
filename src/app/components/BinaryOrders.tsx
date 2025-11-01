'use client';

import { useState, useEffect } from 'react';
import { useEmbeddedWallet } from '@/hooks/useEmbeddedWallet';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

interface BinaryOrder {
  betId: string;
  symbol: string;
  direction: 'UP' | 'DOWN';
  betAmount: string;
  targetPrice: string;
  entryPrice: string;
  entryTime: number;
  targetTime: number;
  multiplier: number;
  status: 'ACTIVE' | 'WON' | 'LOST' | 'CANCELLED';
  settledAt?: number;
  settlePrice?: string;
  createdAt: number;
  chain?: 'base' | 'flow';
}

const BinaryOrders = () => {
  const [orders, setOrders] = useState<BinaryOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { address } = useEmbeddedWallet();

  useEffect(() => {
    const fetchOrders = async () => {
      if (!address) {
        setIsLoading(false);
        return;
      }

      try {
        // Only show loading on first fetch
        if (orders.length === 0) {
          setIsLoading(true);
        }

        // Fetch from both chains in parallel
        const [baseResponse, flowResponse] = await Promise.all([
          fetch(`${BACKEND_URL}/api/one-tap/bets?trader=${address}&chain=base`).catch(() => null),
          fetch(`${BACKEND_URL}/api/one-tap/bets?trader=${address}&chain=flow`).catch(() => null),
        ]);

        let allOrders: any[] = [];

        // Process Base chain orders
        if (baseResponse && baseResponse.ok) {
          const data = await baseResponse.json();
          if (data.success && data.data) {
            const baseOrders = data.data.map((bet: any) => {
              const entryPrice = parseFloat(bet.entryPrice) / 100000000;
              const targetPrice = parseFloat(bet.targetPrice) / 100000000;
              const direction = targetPrice > entryPrice ? 'UP' : 'DOWN';
              return { ...bet, direction, chain: 'base' as const };
            });
            allOrders = [...allOrders, ...baseOrders];
          }
        }

        // Process Flow chain orders
        if (flowResponse && flowResponse.ok) {
          const data = await flowResponse.json();
          if (data.success && data.data) {
            const flowOrders = data.data.map((bet: any) => {
              const entryPrice = parseFloat(bet.entryPrice) / 100000000;
              const targetPrice = parseFloat(bet.targetPrice) / 100000000;
              const direction = targetPrice > entryPrice ? 'UP' : 'DOWN';
              return { ...bet, direction, chain: 'flow' as const };
            });
            allOrders = [...allOrders, ...flowOrders];
          }
        }

        // Sort by creation time (newest first)
        allOrders.sort((a, b) => b.createdAt - a.createdAt);

        // Only update state if data actually changed (prevents unnecessary re-renders that cause scroll reset)
        const ordersChanged = JSON.stringify(allOrders) !== JSON.stringify(orders);
        if (ordersChanged) {
          console.log('🔍 Binary Orders - Data changed, updating...');
          setOrders(allOrders);
        }
      } catch (error) {
        console.error('❌ Error fetching binary orders:', error);
        setOrders([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();

    // Poll every 1 second to get updates (faster UI responsiveness)
    const interval = setInterval(fetchOrders, 1000);
    return () => clearInterval(interval);
  }, [address, orders]);

  // Get crypto icon based on symbol
  const getCryptoIcon = (symbol: string) => {
    const icons: { [key: string]: string } = {
      'BTC': '₿',
      'ETH': 'Ξ',
      'SOL': '◎',
      'AVAX': '🔺',
      'MATIC': '🟣',
      'ARB': '🔵',
      'OP': '🔴',
    };
    return icons[symbol] || '💎';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'WON':
        return 'text-green-400 bg-green-400/10';
      case 'LOST':
        return 'text-red-400 bg-red-400/10';
      case 'ACTIVE':
        return 'text-yellow-400 bg-yellow-400/10';
      case 'CANCELLED':
        return 'text-gray-400 bg-gray-400/10';
      default:
        return 'text-gray-400 bg-gray-400/10';
    }
  };

  const getDirectionColor = (direction: string) => {
    return direction === 'UP' ? 'text-green-400' : 'text-red-400';
  };

  if (isLoading) {
    return <div className="text-center py-16 text-gray-500">Loading binary orders...</div>;
  }

  if (orders.length === 0) {
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-400">
          <thead className="text-xs text-gray-500 uppercase">
            <tr className="border-b border-gray-800">
              <th className="px-4 py-3 text-left font-medium">MARKET</th>
              <th className="px-4 py-3 text-left font-medium">BET AMOUNT</th>
              <th className="px-4 py-3 text-left font-medium">MULTIPLIER</th>
              <th className="px-4 py-3 text-left font-medium">STATUS</th>
              <th className="px-4 py-3 text-left font-medium">TIME</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-gray-700">
              <td colSpan={5} className="text-center py-16 text-gray-500">
                No binary orders. Place a bet in One Tap Profit mode to see orders here.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left text-gray-400">
        <thead className="text-xs text-gray-500 uppercase">
          <tr className="border-b border-gray-800">
            <th className="px-4 py-3 text-left font-medium">MARKET</th>
            <th className="px-4 py-3 text-left font-medium">BET AMOUNT</th>
            <th className="px-4 py-3 text-left font-medium">MULTIPLIER</th>
            <th className="px-4 py-3 text-left font-medium">STATUS</th>
            <th className="px-4 py-3 text-left font-medium">TIME</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => {
            // Parse bet amount - backend already sends in decimal format (not wei)
            let betAmount = 0;
            if (typeof order.betAmount === 'string') {
              const parsed = parseFloat(order.betAmount);
              betAmount = isNaN(parsed) ? 0 : parsed;
            } else if (typeof order.betAmount === 'number') {
              betAmount = order.betAmount;
            }
            
            console.log('🔍 Order betAmount:', order.betAmount, '-> parsed:', betAmount);
            
            return (
            <tr
              key={order.betId}
              className="border-t border-gray-800/50 hover:bg-gray-800/30 transition-colors"
            >
              {/* Market */}
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center text-lg">
                    {getCryptoIcon(order.symbol)}
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white">{order.symbol}/USD</span>
                      {order.chain && (
                        <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded ${
                          order.chain === 'base'
                            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                            : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        }`}>
                          {order.chain === 'base' ? 'Base' : 'Flow'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </td>

              {/* Bet Amount */}
              <td className="px-4 py-3">
                <span className="text-white font-medium">
                  ${betAmount > 0 ? betAmount.toFixed(2) : '0.00'}
                </span>
              </td>

              {/* Multiplier */}
              <td className="px-4 py-3">
                <span className="text-blue-300 font-bold">
                  {(order.multiplier / 100).toFixed(2)}x
                </span>
              </td>

              {/* Status */}
              <td className="px-4 py-3">
                <span
                  className={`px-2 py-1 rounded text-xs font-bold ${getStatusColor(
                    order.status
                  )}`}
                >
                  {order.status}
                </span>
              </td>

              {/* Time */}
              <td className="px-4 py-3">
                <div className="flex flex-col gap-0.5">
                  <span className="text-gray-400 text-xs">
                    {new Date(order.createdAt * 1000).toLocaleTimeString()}
                  </span>
                  {order.status === 'ACTIVE' && (
                    <span className="text-yellow-400 text-xs">
                      Expires: {new Date(order.targetTime * 1000).toLocaleTimeString()}
                    </span>
                  )}
                </div>
              </td>
            </tr>
          );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default BinaryOrders;

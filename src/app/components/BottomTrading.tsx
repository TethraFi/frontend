'use client';

import { useState, useEffect } from 'react';
import { useUserPositions, usePosition, useAllChainPositions } from '@/hooks/usePositions';
import { useEmbeddedWallet } from '@/hooks/useEmbeddedWallet';
import { usePrice } from '@/hooks/usePrices';
import { useGaslessClose } from '@/hooks/useGaslessClose';
import { formatUnits } from 'viem';
import { toast } from 'react-hot-toast';
import PendingOrdersTable from './PendingOrdersTable';
import TapToTradeOrders from './TapToTradeOrders';
import BinaryOrders from './BinaryOrders';
import { useMarket } from '../contexts/MarketContext';
import TPSLModal from './TPSLModal';
import { useTPSLContext } from '@/contexts/TPSLContext';
import { ChainType } from '@/config/chains';

// List of all markets for matching
const ALL_MARKETS = [
  { symbol: 'BTC', tradingViewSymbol: 'BINANCE:BTCUSDT', logoUrl: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/bitcoin/info/logo.png', binanceSymbol: 'BTCUSDT' },
  { symbol: 'ETH', tradingViewSymbol: 'BINANCE:ETHUSDT', logoUrl: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png', binanceSymbol: 'ETHUSDT' },
  { symbol: 'SOL', tradingViewSymbol: 'BINANCE:SOLUSDT', logoUrl: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/info/logo.png', binanceSymbol: 'SOLUSDT' },
  { symbol: 'AVAX', tradingViewSymbol: 'BINANCE:AVAXUSDT', logoUrl: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/avalanchex/info/logo.png', binanceSymbol: 'AVAXUSDT' },
  { symbol: 'NEAR', tradingViewSymbol: 'BINANCE:NEARUSDT', logoUrl: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/near/info/logo.png', binanceSymbol: 'NEARUSDT' },
  { symbol: 'BNB', tradingViewSymbol: 'BINANCE:BNBUSDT', logoUrl: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/binance/info/logo.png', binanceSymbol: 'BNBUSDT' },
  { symbol: 'XRP', tradingViewSymbol: 'BINANCE:XRPUSDT', logoUrl: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ripple/info/logo.png', binanceSymbol: 'XRPUSDT' },
  { symbol: 'AAVE', tradingViewSymbol: 'BINANCE:AAVEUSDT', logoUrl: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9/logo.png', binanceSymbol: 'AAVEUSDT' },
  { symbol: 'ARB', tradingViewSymbol: 'BINANCE:ARBUSDT', logoUrl: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/arbitrum/info/logo.png', binanceSymbol: 'ARBUSDT' },
  { symbol: 'CRV', tradingViewSymbol: 'BINANCE:CRVUSDT', logoUrl: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xD533a949740bb3306d119CC777fa900bA034cd52/logo.png', binanceSymbol: 'CRVUSDT' },
  { symbol: 'DOGE', tradingViewSymbol: 'BINANCE:DOGEUSDT', logoUrl: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/doge/info/logo.png', binanceSymbol: 'DOGEUSDT' },
  { symbol: 'ENA', tradingViewSymbol: 'BINANCE:ENAUSDT', logoUrl: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x57E114B691Db790C35207b2e685D4A43181e6061/logo.png', binanceSymbol: 'ENAUSDT' },
  { symbol: 'LINK', tradingViewSymbol: 'BINANCE:LINKUSDT', logoUrl: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x514910771AF9Ca656af840dff83E8264EcF986CA/logo.png', binanceSymbol: 'LINKUSDT' },
  { symbol: 'MATIC', tradingViewSymbol: 'BINANCE:MATICUSDT', logoUrl: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/polygon/info/logo.png', binanceSymbol: 'MATICUSDT' },
  { symbol: 'PEPE', tradingViewSymbol: 'BINANCE:PEPEUSDT', logoUrl: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x6982508145454Ce325dDbE47a25d4ec3d2311933/logo.png', binanceSymbol: 'PEPEUSDT' },
];

// Component to display individual position
const PositionRow = ({
  positionId,
  chain,
  onClose,
  onPositionClick,
  onTPSLClick,
  isSelected,
  onPositionLoaded
}: {
  positionId: bigint;
  chain?: ChainType;
  onClose: (positionId: bigint, symbol: string, chain?: ChainType) => void;
  onPositionClick: (positionId: bigint, symbol: string, entryPrice: number, isLong: boolean) => void;
  onTPSLClick: (positionId: bigint, trader: string, symbol: string, entryPrice: number, isLong: boolean) => void;
  isSelected: boolean;
  onPositionLoaded?: (positionId: bigint, isOpen: boolean, symbol?: string, chain?: ChainType) => void;
}) => {
  const { position, isLoading } = usePosition(positionId, chain);

  // Use shared price hook - all positions with same symbol share same price
  const { price: priceData, isLoading: loadingPrice } = usePrice(position?.symbol);
  const currentPrice = priceData?.price || null;
  
  // Fetch TP/SL config for this position from global context
  const { getConfig } = useTPSLContext();
  const tpslConfig = position ? getConfig(Number(position.id)) : null;
  
  // Report position status when loaded
  useEffect(() => {
    if (!isLoading && position && onPositionLoaded) {
      onPositionLoaded(positionId, position.status === 0, position.symbol, chain);
    }
  }, [isLoading, position, positionId, onPositionLoaded, chain]);
  
  if (isLoading) {
    return (
      <tr className="border-t border-gray-700">
        <td colSpan={9} className="px-4 py-4 text-center text-gray-400">
          Loading position #{positionId.toString()}...
        </td>
      </tr>
    );
  }
  
  if (!position) {
    return null;
  }
  
  // Only show open positions
  if (position.status !== 0) {
    return null;
  }
  
  const entryPrice = parseFloat(formatUnits(position.entryPrice, 8));
  const collateral = parseFloat(formatUnits(position.collateral, 6));
  const size = parseFloat(formatUnits(position.size, 6));
  const leverage = Number(position.leverage);
  
  // Calculate unrealized PnL and net value
  let unrealizedPnl = 0;
  let pnlPercentage = 0;
  let netValue = collateral;
  const markPrice = currentPrice || entryPrice;
  
  if (currentPrice && entryPrice > 0) {
    const priceDiff = position.isLong 
      ? currentPrice - entryPrice 
      : entryPrice - currentPrice;
    
    unrealizedPnl = (priceDiff / entryPrice) * size;
    pnlPercentage = (unrealizedPnl / collateral) * 100;
    netValue = collateral + unrealizedPnl;
  }
  
  // Calculate liquidation price (simplified)
  // Liq price = entry ± (collateral / size) * entry
  // For long: entry - (collateral / size) * entry * 0.9
  // For short: entry + (collateral / size) * entry * 0.9
  const liqPriceRatio = (collateral / size) * 0.9;
  const liquidationPrice = position.isLong
    ? entryPrice * (1 - liqPriceRatio)
    : entryPrice * (1 + liqPriceRatio);
  
  const pnlColor = unrealizedPnl >= 0 ? 'text-green-400' : 'text-red-400';

  // Get crypto logo URL from ALL_MARKETS
  const getMarketLogo = (symbol: string) => {
    const market = ALL_MARKETS.find(m => m.symbol === symbol);
    return market?.logoUrl || '';
  };
  
  const handleRowClick = (e: React.MouseEvent) => {
    // Don't trigger if clicking on Close button or menu
    const target = e.target as HTMLElement;
    if (target.closest('button')) {
      return;
    }
    onPositionClick(position.id, position.symbol, entryPrice, position.isLong);
  };
  
  // Handle TP/SL button click
  const handleTPSLClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onTPSLClick(position.id, position.trader, position.symbol, entryPrice, position.isLong);
  };

  return (
    <tr
      onClick={handleRowClick}
      className={`border-t border-gray-800/50 hover:bg-gray-800/30 transition-colors cursor-pointer ${
        isSelected ? 'bg-blue-300/10 border-blue-300/30' : ''
      }`}
    >
      {/* Position / Market */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <img
            src={getMarketLogo(position.symbol)}
            alt={position.symbol}
            className="w-8 h-8 rounded-full bg-slate-700"
            onError={(e) => {
              const target = e.currentTarget;
              target.onerror = null;
              target.style.visibility = 'hidden';
            }}
          />
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-white">{position.symbol}/USD</span>
              {chain && (
                <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded ${
                  chain === 'base'
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                }`}>
                  {chain === 'base' ? 'Base' : 'Flow'}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <span className={`text-xs font-medium ${
                position.isLong ? 'text-green-400' : 'text-red-400'
              }`}>
                {leverage.toFixed(2)}x
              </span>
              <span className={`text-xs font-medium ${
                position.isLong ? 'text-green-400' : 'text-red-400'
              }`}>
                {position.isLong ? 'Long' : 'Short'}
              </span>
            </div>
          </div>
        </div>
      </td>

      {/* Size */}
      <td className="px-4 py-3">
        <span className="text-white font-medium">${size.toFixed(2)}</span>
      </td>

      {/* Net Value */}
      <td className="px-4 py-3">
        <div className="flex flex-col">
          <span className={`font-medium ${pnlColor}`}>
            ${netValue.toFixed(2)}
          </span>
          {currentPrice && (
            <span className={`text-xs ${pnlColor}`}>
              {unrealizedPnl >= 0 ? '+' : ''}${unrealizedPnl.toFixed(2)} ({pnlPercentage >= 0 ? '+' : ''}{pnlPercentage.toFixed(2)}%)
            </span>
          )}
        </div>
      </td>

      {/* Collateral */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-1">
          <span className="text-white">${collateral.toFixed(2)}</span>
        </div>
        <div className="text-xs text-gray-400">({collateral.toFixed(2)} USDC)</div>
      </td>

      {/* Entry Price */}
      <td className="px-4 py-3">
        <span className="text-white">${entryPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
      </td>

      {/* Mark Price */}
      <td className="px-4 py-3">
        {loadingPrice ? (
          <span className="text-gray-400 text-sm">...</span>
        ) : (
          <span className="text-white">${markPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        )}
      </td>

      {/* Liquidation Price */}
      <td className="px-4 py-3">
        <span className="text-white">${liquidationPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
      </td>

      {/* TP/SL Status */}
      <td className="px-4 py-3">
        {tpslConfig ? (
          <div className="flex flex-col gap-1 text-xs">
            {tpslConfig.takeProfit && (
              <div className="text-green-400">
                TP: ${(parseFloat(tpslConfig.takeProfit) / 100000000).toFixed(2)}
              </div>
            )}
            {tpslConfig.stopLoss && (
              <div className="text-red-400">
                SL: ${(parseFloat(tpslConfig.stopLoss) / 100000000).toFixed(2)}
              </div>
            )}
          </div>
        ) : (
          <span className="text-gray-500 text-xs">-</span>
        )}
      </td>

      {/* Actions */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <button
            onClick={handleTPSLClick}
            className="px-3 py-1.5 bg-blue-300/20 hover:bg-blue-300/30 text-blue-300 text-xs font-medium rounded transition-colors cursor-pointer"
          >
            TP/SL
          </button>
          <button
            onClick={() => onClose(position.id, position.symbol, chain)}
            className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs font-medium rounded transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </td>
    </tr>
  );
};

const BottomTrading = () => {
  const [activeTab, setActiveTab] = useState('Positions');
  const [orderSubTab, setOrderSubTab] = useState('Pending Orders');
  const [openPositionsCount, setOpenPositionsCount] = useState(0);
  const { allPositionIds, isLoading: isLoadingIds } = useAllChainPositions();
  const { address } = useEmbeddedWallet();
  const { closePosition, isPending: isClosing, txHash } = useGaslessClose();
  const { setActiveMarket, setSelectedPosition, selectedPosition, chartPositions, setChartPositions } = useMarket();
  
  // TP/SL Modal state
  const [tpslModalOpen, setTpslModalOpen] = useState(false);
  const [tpslModalData, setTpslModalData] = useState<{
    positionId: number;
    trader: string;
    symbol: string;
    entryPrice: number;
    isLong: boolean;
  } | null>(null);
  const [tpslRefreshTrigger, setTpslRefreshTrigger] = useState(0);

  // Track open positions status and data
  const [positionStatuses, setPositionStatuses] = useState<Map<bigint, boolean>>(new Map());
  const [positionData, setPositionData] = useState<Map<bigint, { symbol: string; isOpen: boolean; chain?: ChainType }>>(new Map());

  // Track recently closed positions for optimistic update
  const [closedPositionIds, setClosedPositionIds] = useState<Set<bigint>>(new Set());

  // Close All confirmation modal state
  const [showCloseAllModal, setShowCloseAllModal] = useState(false);

  // Handle position loaded - track if position is open
  const handlePositionLoaded = (positionId: bigint, isOpen: boolean, symbol?: string, chain?: ChainType) => {
    setPositionStatuses(prev => {
      const newMap = new Map(prev);
      newMap.set(positionId, isOpen);
      return newMap;
    });

    if (symbol) {
      setPositionData(prev => {
        const newMap = new Map(prev);
        newMap.set(positionId, { symbol, isOpen, chain });
        return newMap;
      });
    }
  };
  
  // Calculate open positions count
  useEffect(() => {
    const openCount = Array.from(positionStatuses.values()).filter(isOpen => isOpen).length;
    setOpenPositionsCount(openCount);
  }, [positionStatuses]);
  
  // Listen for TP/SL updates from other components
  useEffect(() => {
    const handleTPSLUpdate = () => {
      setTpslRefreshTrigger(prev => prev + 1);
    };
    
    window.addEventListener('tpsl-updated', handleTPSLUpdate);
    return () => window.removeEventListener('tpsl-updated', handleTPSLUpdate);
  }, []);
  
  // Auto-refetch positions when txHash changes (position closed)
  useEffect(() => {
    if (txHash) {
      // Positions will auto-refetch via the hook's refetchInterval
      console.log('Position closed, auto-refetching positions...');

      // Clear optimistic closed positions after 6 seconds (after refetch completes)
      const timer = setTimeout(() => {
        setClosedPositionIds(new Set());
        console.log('Cleared optimistic closed positions');
      }, 6000);

      return () => clearTimeout(timer);
    }
  }, [txHash]);
  
  // Handle position click - Switch market and show entry price line
  const handlePositionClick = (positionId: bigint, symbol: string, entryPrice: number, isLong: boolean) => {
    // Find market by symbol
    const market = ALL_MARKETS.find(m => m.symbol === symbol);
    if (market) {
      // Switch trading chart to this market
      setActiveMarket(market);

      // Set selected position to show entry price line
      setSelectedPosition({
        positionId,
        symbol,
        entryPrice,
        isLong
      });

      console.log(`📍 Switched to ${symbol} market, showing entry price at $${entryPrice.toFixed(2)}`);
    }
  };
  
  // Handle TP/SL modal open
  const handleTPSLModalOpen = (positionId: bigint, trader: string, symbol: string, entryPrice: number, isLong: boolean) => {
    setTpslModalData({
      positionId: Number(positionId),
      trader,
      symbol,
      entryPrice,
      isLong
    });
    setTpslModalOpen(true);
  };
  
  // Handle TP/SL modal close - trigger refetch
  const handleTPSLModalClose = () => {
    setTpslModalOpen(false);
    // Trigger refetch by incrementing counter
    setTpslRefreshTrigger(prev => prev + 1);
  };

  // Handle close position - GASLESS via backend (hackathon mode 🔥)
  const handleClosePosition = async (positionId: bigint, symbol: string, chain?: ChainType) => {
    if (isClosing) return;

    try {
      toast.loading('Closing position gaslessly...', { id: 'close-position' });

      await closePosition({
        positionId,
        symbol,
        chain // Pass the position's actual chain
      });

      toast.dismiss('close-position');
      // Success toast will be shown by hook

      // Clear selected position if it's the one being closed
      if (selectedPosition?.positionId === positionId) {
        setSelectedPosition(null);
      }

      // Optimistically hide closed position immediately
      setClosedPositionIds(prev => new Set(prev).add(positionId));

      // Positions will auto-refetch via the hook's refetchInterval (5 seconds)
      // After refetch, the position will be removed from blockchain data
      console.log('Position closed, optimistically hidden from UI...');

    } catch (error) {
      console.error('Error closing position:', error);
      toast.dismiss('close-position');
      // Error toast already shown by hook
    }
  };

  // Handle close all positions button click - show modal
  const handleCloseAllPositionsClick = () => {
    // Get all open position IDs with their symbols and chains from positionData
    const openPositions: Array<{ id: bigint; symbol: string; chain?: ChainType }> = [];

    allPositionIds.forEach(({ id }) => {
      const data = positionData.get(id);
      if (data && data.isOpen) {
        openPositions.push({ id, symbol: data.symbol, chain: data.chain });
      }
    });

    if (openPositions.length === 0) {
      toast.error('No open positions to close');
      return;
    }

    setShowCloseAllModal(true);
  };

  // Handle close all positions - actual closing logic
  const handleCloseAllPositionsConfirm = async () => {
    if (isClosing || allPositionIds.length === 0) return;

    // Get all open position IDs with their symbols and chains from positionData
    const openPositions: Array<{ id: bigint; symbol: string; chain?: ChainType }> = [];

    allPositionIds.forEach(({ id }) => {
      const data = positionData.get(id);
      if (data && data.isOpen) {
        openPositions.push({ id, symbol: data.symbol, chain: data.chain });
      }
    });

    if (openPositions.length === 0) {
      toast.error('No open positions to close');
      return;
    }

    // Close modal
    setShowCloseAllModal(false);

    try {
      toast.loading(`Closing ${openPositions.length} position(s)...`, {
        id: 'close-all-positions'
      });

      // Close positions sequentially to avoid rate limiting
      for (const pos of openPositions) {
        try {
          await closePosition({
            positionId: pos.id,
            symbol: pos.symbol,
            chain: pos.chain // Pass the position's actual chain
          });

          // Small delay between closes
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
          console.error(`Failed to close position ${pos.id}:`, error);
        }
      }

      toast.success('All positions closed successfully!', {
        id: 'close-all-positions',
        duration: 3000
      });

      // Clear selected position
      setSelectedPosition(null);

      // Positions will auto-refetch via the hook's refetchInterval
      console.log('Position closed, auto-refetching...');

    } catch (error) {
      console.error('Error closing all positions:', error);
      toast.error('Failed to close all positions', {
        id: 'close-all-positions'
      });
    }
  };
  
  // No need for extra state or useEffect - just use positionIds directly
  const isLoading = isLoadingIds;

  // Mobile tabs: Orders instead of 3 separate tabs
  const mobileTabs = ['Positions', 'Orders'];
  // Desktop tabs: 3 separate order tabs
  const desktopTabs = ['Positions', 'Pending Orders', 'Tap to Trade Orders', 'Binary Orders'];

  const renderContent = () => {
    switch (activeTab) {
      case 'Positions':
        if (isLoading) {
          return <div className="text-center py-16 text-gray-500">Loading positions...</div>;
        }

        if (allPositionIds.length === 0) {
          return (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-400">
                <thead className="text-xs text-gray-500 uppercase">
                  <tr className="border-b border-gray-800">
                    <th className="px-4 py-3 text-left font-medium">POSITION</th>
                    <th className="px-4 py-3 text-left font-medium">SIZE</th>
                    <th className="px-4 py-3 text-left font-medium">NET VALUE</th>
                    <th className="px-4 py-3 text-left font-medium">COLLATERAL</th>
                    <th className="px-4 py-3 text-left font-medium">ENTRY PRICE</th>
                    <th className="px-4 py-3 text-left font-medium">MARK PRICE</th>
                    <th className="px-4 py-3 text-left font-medium">LIQ. PRICE</th>
                    <th className="px-4 py-3 text-left font-medium">TP / SL</th>
                    <th className="px-4 py-3 text-left font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-gray-700">
                    <td colSpan={9} className="text-center py-16 text-gray-500">
                      No open positions
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
                  <th className="px-4 py-3 text-left font-medium">POSITION</th>
                  <th className="px-4 py-3 text-left font-medium">SIZE</th>
                  <th className="px-4 py-3 text-left font-medium">NET VALUE</th>
                  <th className="px-4 py-3 text-left font-medium">COLLATERAL</th>
                  <th className="px-4 py-3 text-left font-medium">ENTRY PRICE</th>
                  <th className="px-4 py-3 text-left font-medium">MARK PRICE</th>
                  <th className="px-4 py-3 text-left font-medium">LIQ. PRICE</th>
                  <th className="px-4 py-3 text-left font-medium">TP / SL</th>
                  <th className="px-4 py-3 text-left font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {allPositionIds
                  .filter(({ id }) => !closedPositionIds.has(id)) // Filter out optimistically closed positions
                  .map(({ id, chain }) => (
                    <PositionRow
                      key={`${chain}-${id.toString()}-${tpslRefreshTrigger}`}
                      positionId={id}
                      chain={chain}
                      onClose={handleClosePosition}
                      onPositionClick={handlePositionClick}
                      onTPSLClick={handleTPSLModalOpen}
                      isSelected={selectedPosition?.positionId === id}
                      onPositionLoaded={handlePositionLoaded}
                    />
                  ))}
              </tbody>
            </table>
          </div>
        );
      case 'Orders':
        // Mobile only - show submenu
        return (
          <div>
            <div className="flex gap-2 p-3 border-b border-gray-800 bg-[#0F1419]">
              {['Pending Orders', 'Tap to Trade Orders', 'Binary Orders'].map((subTab) => (
                <button
                  key={subTab}
                  onClick={() => setOrderSubTab(subTab)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    orderSubTab === subTab
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  {subTab}
                </button>
              ))}
            </div>
            <div>
              {orderSubTab === 'Pending Orders' && <PendingOrdersTable />}
              {orderSubTab === 'Tap to Trade Orders' && <TapToTradeOrders />}
              {orderSubTab === 'Binary Orders' && <BinaryOrders />}
            </div>
          </div>
        );
      case 'Pending Orders':
        return <PendingOrdersTable />;
      case 'Tap to Trade Orders':
        return <TapToTradeOrders />;
      case 'Binary Orders':
        return <BinaryOrders />;
      case 'Trades':
        return <div className="text-center py-16 text-gray-500">No trades found</div>;
      case 'Claims':
        return <div className="text-center py-16 text-gray-500">No claims available</div>;
      default:
        return null;
    }
  };

  return (
    <>
    <div className="bg-[#0B1017] border border-gray-700/50 rounded-lg h-full flex flex-col">
      <div className="flex items-center justify-between border-b border-gray-800/50 flex-shrink-0 md:px-4">
        {/* Mobile tabs - full width divided by 4 */}
        <div className="flex w-full md:hidden">
          {mobileTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3.5 text-sm font-medium transition-colors duration-200 cursor-pointer relative ${
                activeTab === tab
                  ? 'text-white'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                {tab}
                {tab === 'Positions' && openPositionsCount > 0 && (
                  <span className="bg-gray-700/50 text-white text-xs rounded px-1.5 py-0.5">
                    {openPositionsCount}
                  </span>
                )}
              </span>
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-300"></div>
              )}
            </button>
          ))}
        </div>
        {/* Desktop tabs */}
        <div className="hidden md:flex space-x-6">
          {desktopTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-3.5 text-sm font-medium transition-colors duration-200 cursor-pointer relative ${
                activeTab === tab
                  ? 'text-white'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <span className="flex items-center gap-2">
                {tab}
                {tab === 'Positions' && openPositionsCount > 0 && (
                  <span className="bg-gray-700/50 text-white text-xs rounded px-1.5 py-0.5">
                    {openPositionsCount}
                  </span>
                )}
              </span>
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-300"></div>
              )}
            </button>
          ))}
        </div>

        {/* Close All button - Desktop only, shows when Positions tab is active */}
        {activeTab === 'Positions' && openPositionsCount > 0 && (
          <button
            onClick={handleCloseAllPositionsClick}
            disabled={isClosing}
            className="hidden md:block px-4 py-2 bg-red-500/20 hover:bg-red-500/30 disabled:bg-red-500/10 disabled:cursor-not-allowed text-red-400 text-xs font-medium rounded transition-colors cursor-pointer"
          >
            {isClosing ? 'Closing...' : `Close All (${openPositionsCount})`}
          </button>
        )}
      </div>
      <div className="flex-1 overflow-auto min-h-0">
        {renderContent()}
      </div>
    </div>
    
    {/* TP/SL Modal */}
    {tpslModalOpen && tpslModalData && (
      <TPSLModal
        isOpen={tpslModalOpen}
        onClose={handleTPSLModalClose}
        positionId={tpslModalData.positionId}
        trader={tpslModalData.trader}
        symbol={tpslModalData.symbol}
        entryPrice={tpslModalData.entryPrice}
        isLong={tpslModalData.isLong}
      />
    )}

    {/* Close All Confirmation Modal */}
    {showCloseAllModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={() => setShowCloseAllModal(false)}
        />

        {/* Modal Content */}
        <div className="relative w-[420px] bg-[#16181D] rounded-2xl shadow-2xl border border-red-500/30 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="px-6 py-5 border-b border-gray-700/50 bg-red-500/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-red-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Close All Positions</h2>
                <p className="text-sm text-gray-400">This action cannot be undone</p>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="px-6 py-5">
            <p className="text-gray-300 mb-4">
              Are you sure you want to close all{' '}
              <span className="font-bold text-red-400">{openPositionsCount}</span>{' '}
              open position(s)?
            </p>
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <svg
                  className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-xs text-yellow-300">
                  All positions will be closed at the current market price. This may result in profit or loss.
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-[#0B1017] border-t border-gray-700/50 flex gap-3">
            <button
              onClick={() => setShowCloseAllModal(false)}
              className="flex-1 px-4 py-2.5 bg-gray-700/50 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleCloseAllPositionsConfirm}
              disabled={isClosing}
              className="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 disabled:bg-red-500/50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors cursor-pointer"
            >
              {isClosing ? 'Closing...' : 'Close All'}
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
};

export default BottomTrading;

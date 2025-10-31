'use client';
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Info, Grid as GridIcon, Star } from 'lucide-react';
import { useMarket } from '../../contexts/MarketContext';
import { useGridTradingContext } from '../../contexts/GridTradingContext';
import { useTapToTrade } from '../../contexts/TapToTradeContext';
import { useUSDCBalance } from '@/hooks/useUSDCBalance';
import { useTapToTradeApproval } from '@/hooks/useTapToTradeApproval';
import { useOneTapProfitApproval } from '@/hooks/useOneTapProfitApproval';
import { useOneTapProfit } from '../../hooks/useOneTapProfit';
import { useSessionKey } from '@/hooks/useSessionKey';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { parseUnits } from 'viem';
import { toast } from 'react-hot-toast';

interface Market {
  symbol: string;
  tradingViewSymbol: string;
  logoUrl: string;
  binanceSymbol: string;
}

// Available markets - sama seperti di TradingChart
const ALL_MARKETS: Market[] = [
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

interface TimeframeOption {
  label: string;
  value: string;
}

const TIMEFRAME_OPTIONS: TimeframeOption[] = [
  { label: '1m', value: '1' },
  { label: '5m', value: '5' },
  { label: '15m', value: '15' },
  { label: '30m', value: '30' },
  { label: '1H', value: '60' },
  { label: '4H', value: '240' },
  { label: '1D', value: 'D' },
  { label: '1W', value: 'W' },
];

// Market Selector Component with Favorites (from MarketOrder)
interface MarketSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (market: Market) => void;
  triggerRef?: React.RefObject<HTMLButtonElement | null>;
}

const MarketSelector: React.FC<MarketSelectorProps> = ({ isOpen, onClose, onSelect, triggerRef }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const panelRef = useRef<HTMLDivElement>(null);

  const toggleFavorite = (symbol: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(symbol)) {
        newFavorites.delete(symbol);
      } else {
        newFavorites.add(symbol);
      }
      return newFavorites;
    });
  };

  const filteredMarkets = ALL_MARKETS.filter(market =>
    market.symbol.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => {
    const aIsFav = favorites.has(a.symbol);
    const bIsFav = favorites.has(b.symbol);
    if (aIsFav && !bIsFav) return -1;
    if (!aIsFav && bIsFav) return 1;
    return 0;
  });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      // Ignore clicks on the trigger button or inside the panel
      if (
        (panelRef.current && panelRef.current.contains(target)) ||
        (triggerRef?.current && triggerRef.current.contains(target))
      ) {
        return;
      }
      onClose();
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose, triggerRef]);

  if (!isOpen) return null;

  return (
    <div
      ref={panelRef}
      className="absolute top-full mt-1 right-0 w-fit min-w-[200px] max-h-[400px] bg-[#1A2332] border border-[#2D3748] rounded-lg shadow-xl z-50 overflow-hidden"
    >
      <div className="p-2 border-b border-[#2D3748]">
        <input
          type="text"
          placeholder="Search Market"
          className="w-full px-3 py-2 bg-[#0F1419] border border-[#2D3748] rounded text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-300"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          autoFocus
        />
      </div>
      <div className="overflow-y-auto max-h-[350px] custom-scrollbar-dark">
        {filteredMarkets.map(market => {
          const isFavorite = favorites.has(market.symbol);
          return (
            <div
              key={market.symbol}
              onClick={() => {
                onSelect(market);
                onClose();
              }}
              className="flex items-center justify-between gap-3 px-3 py-2 hover:bg-[#2D3748] cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-2">
                <img
                  src={market.logoUrl}
                  alt={market.symbol}
                  className="w-5 h-5 rounded-full"
                  onError={(e) => {
                    const target = e.currentTarget;
                    target.style.display = 'none';
                  }}
                />
                <span className="text-white font-medium whitespace-nowrap">{market.symbol}/USD</span>
              </div>
              <button
                onClick={(e) => toggleFavorite(market.symbol, e)}
                className="p-1 hover:bg-[#3D4A5F] rounded transition-colors"
              >
                <Star
                  size={14}
                  className={`${isFavorite ? 'fill-yellow-400 text-yellow-400' : 'text-gray-500'} transition-colors`}
                />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const TapToTrade: React.FC = () => {
  const { activeMarket, setActiveMarket, timeframe, setTimeframe, currentPrice } = useMarket();
  const { usdcBalance, isLoadingBalance } = useUSDCBalance();
  const { authenticated } = usePrivy();
  const { wallets } = useWallets();
  const [leverage, setLeverage] = useState(10);
  const [leverageInput, setLeverageInput] = useState<string>('10.0');
  const [marginAmount, setMarginAmount] = useState<string>('');
  const [xCoordinate, setXCoordinate] = useState<string>('');
  const [yCoordinate, setYCoordinate] = useState<string>('');
  const [isTimeframeOpen, setIsTimeframeOpen] = useState(false);
  const [isMarketSelectorOpen, setIsMarketSelectorOpen] = useState(false);
  const [showLeverageTooltip, setShowLeverageTooltip] = useState(false);
  const [isModeDropdownOpen, setIsModeDropdownOpen] = useState(false);
  const [hasSelectedYGrid, setHasSelectedYGrid] = useState(false); // Track if user explicitly selected Y grid
  const timeframeRef = useRef<HTMLDivElement>(null);
  const triggerButtonRef = useRef<HTMLButtonElement>(null); // For market selector
  const modeDropdownRef = useRef<HTMLDivElement>(null);

  // Approval hook for USDC (TapToTradeExecutor-specific)
  const { approve: approveUSDC, hasAllowance, allowance, isPending: isApprovalPending } = useTapToTradeApproval();

  // Approval hook for USDC (OneTapProfit-specific)
  const { 
    approve: approveOneTapProfit, 
    hasAllowance: hasOneTapProfitAllowance, 
    allowance: oneTapProfitAllowance, 
    isPending: isOneTapProfitApprovalPending 
  } = useOneTapProfitApproval();

  // Hook for OneTapProfit session key management
  const { isSessionValid: isBinarySessionValid } = useOneTapProfit();
  
  // Session key hook for binary trading
  const binarySessionKey = useSessionKey();

  // Grid Trading dari Context
  const gridTrading = useGridTradingContext();

  // Tap to Trade dari Context
  const tapToTrade = useTapToTrade();

  // Use trade mode from context
  const tradeMode = tapToTrade.tradeMode;
  const setTradeMode = tapToTrade.setTradeMode;

  const leverageMarkers = [1, 2, 5, 10, 25, 50, 100]; // Updated to match MarketOrder

  // Check if we have large allowance (> $10,000) - memoized to prevent setState during render
  const hasLargeAllowance = useMemo(() => {
    return Boolean(allowance && allowance > parseUnits('10000', 6));
  }, [allowance]);

  // Check if OneTapProfit has large allowance
  const hasLargeOneTapProfitAllowance = useMemo(() => {
    return Boolean(oneTapProfitAllowance && oneTapProfitAllowance > parseUnits('10000', 6));
  }, [oneTapProfitAllowance]);

  // Handler for pre-approve USDC in large amount
  const handlePreApprove = async () => {
    try {
      toast.loading('Approving unlimited USDC...', { id: 'pre-approve' });
      // Approve 1 million USDC (enough for many trades)
      const maxAmount = parseUnits('1000000', 6).toString();
      await approveUSDC(maxAmount);
      toast.success('✅ Pre-approved! You can now trade without approval popups', { 
        id: 'pre-approve',
        duration: 5000
      });
    } catch (error) {
      console.error('Pre-approve error:', error);
      toast.error('Failed to approve USDC. Please try again.', { id: 'pre-approve' });
    }
  };

  // Handler for pre-approve USDC for OneTapProfit
  const handlePreApproveOneTapProfit = async () => {
    try {
      toast.loading('Approving unlimited USDC for Binary Trading...', { id: 'binary-pre-approve' });
      // Approve 1 million USDC (enough for many bets)
      const maxAmount = parseUnits('1000000', 6).toString();
      await approveOneTapProfit(maxAmount);
      toast.success('✅ Pre-approved! You can now enable Binary Trading', { 
        id: 'binary-pre-approve',
        duration: 5000
      });
    } catch (error) {
      console.error('OneTapProfit pre-approve error:', error);
      toast.error('Failed to approve USDC. Please try again.', { id: 'binary-pre-approve' });
    }
  };

  // Close timeframe dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (timeframeRef.current && !timeframeRef.current.contains(event.target as Node)) {
        setIsTimeframeOpen(false);
      }
    };

    if (isTimeframeOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isTimeframeOpen]);

  // Close mode dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modeDropdownRef.current && !modeDropdownRef.current.contains(event.target as Node)) {
        setIsModeDropdownOpen(false);
      }
    };

    if (isModeDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isModeDropdownOpen]);

  // Handler untuk mengganti market dan update chart
  const handleMarketSelect = (market: Market) => {
    setActiveMarket(market);
    setIsMarketSelectorOpen(false);
  };

  const handleMarginInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setMarginAmount(value);
      // Sync with context for OneTapProfit mode
      if (tradeMode === 'one-tap-profit') {
        tapToTrade.setBetAmount(value);
      }
    }
  };

  const handleMaxClick = () => {
    setMarginAmount(usdcBalance);
  };

  const marginUsdValue = marginAmount ? parseFloat(marginAmount) : 0;

  const generateLeverageValues = () => {
    const values: number[] = [];
    for (let i = 0; i < leverageMarkers.length - 1; i++) {
      const start = leverageMarkers[i];
      const end = leverageMarkers[i + 1];
      const step = (end - start) / 10;

      for (let j = 0; j < 10; j++) {
        const value = start + (step * j);
        values.push(Number(value.toFixed(2)));
      }
    }
    values.push(leverageMarkers[leverageMarkers.length - 1]);
    return values;
  };

  const leverageValues = generateLeverageValues();
  const maxSliderValue = leverageValues.length - 1;

  const handleLeverageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    if (value === '' || /^\d*\.?\d{0,1}$/.test(value)) {
      setLeverageInput(value);

      if (value === '' || value === '.') {
        setLeverage(1);
      } else {
        const numValue = parseFloat(value);
        if (!isNaN(numValue) && numValue >= 0.1 && numValue <= 100) {
          setLeverage(numValue);
        }
      }
    }
  };

  const handleLeverageInputBlur = () => {
    if (leverageInput === '' || leverageInput === '.') {
      setLeverageInput('1.0');
      setLeverage(1);
    } else {
      setLeverageInput(leverage.toFixed(1));
    }
  };

  const handleLeverageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const index = parseInt(e.target.value);
    const value = leverageValues[index];
    setLeverage(value);
    setLeverageInput(value.toFixed(1));
    setShowLeverageTooltip(true);
  };

  const handleLeverageMouseDown = () => {
    setShowLeverageTooltip(true);
  };

  const handleLeverageMouseUp = () => {
    setShowLeverageTooltip(false);
  };

  const getCurrentSliderIndex = () => {
    let closestIndex = 0;
    let minDiff = Math.abs(leverageValues[0] - leverage);

    for (let i = 1; i < leverageValues.length; i++) {
      const diff = Math.abs(leverageValues[i] - leverage);
      if (diff < minDiff) {
        minDiff = diff;
        closestIndex = i;
      }
    }

    return closestIndex;
  };

  const handleTimeframeSelect = (value: string) => {
    setTimeframe(value);
    setIsTimeframeOpen(false);
  };

  const selectedTimeframeLabel = TIMEFRAME_OPTIONS.find(opt => opt.value === timeframe)?.label || '1m';

  const formatPrice = (price: number) => {
    if (isNaN(price) || price === 0) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price);
  };


  return (
    <div className="flex flex-col gap-3 px-4 py-4 bg-[#0F1419] h-full">
      {/* One Tap Profit Info Banner */}
      {tradeMode === 'one-tap-profit' && (
        <div className="bg-blue-300/10 border border-blue-300/50 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <Info size={16} className="text-blue-300 flex-shrink-0 mt-0.5" />
            <div className="flex-1 space-y-1">
              <div className="text-xs font-semibold text-blue-300">One Tap Profit Mode</div>
              <div className="text-xs text-blue-300 space-y-0.5">
                <div>• Chart updates in real-time per second</div>
                <div>• Fixed grid: 10 seconds per X-axis</div>
                <div>• Price grid: ${activeMarket?.symbol === 'SOL' ? '0.1' : '10'} per Y-axis increment</div>
                <div>• Grid is fixed (no zoom in/out)</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Market Selector */}
      <div>
        <div className={`bg-[#1A2332] border border-[#2D3748] rounded-lg p-3 relative ${tapToTrade.isEnabled ? 'opacity-50 pointer-events-none' : ''}`}>
          <label className="text-xs text-gray-400 mb-2 block">Market</label>
          <div className="flex justify-between items-center">
            <span className="text-2xl text-white font-medium">{activeMarket?.symbol || 'BTC'}</span>
            <button
              ref={triggerButtonRef}
              onClick={() => setIsMarketSelectorOpen(!isMarketSelectorOpen)}
              disabled={tapToTrade.isEnabled}
              className="flex items-center gap-2 bg-transparent rounded-lg px-2 py-1 text-base cursor-pointer hover:opacity-75 transition-opacity relative disabled:cursor-not-allowed"
            >
              {activeMarket && (
                <img
                  src={activeMarket.logoUrl}
                  alt={activeMarket.symbol}
                  className="w-7 h-7 rounded-full"
                  onError={(e) => {
                    const target = e.currentTarget;
                    target.style.display = 'none';
                  }}
                />
              )}
              <span className="text-white font-medium whitespace-nowrap">{activeMarket?.symbol || 'BTC'}/USD</span>
              <ChevronDown size={16} className={`transition-transform duration-200 ${isMarketSelectorOpen ? 'rotate-180' : ''}`} />
            </button>
            <MarketSelector
              isOpen={isMarketSelectorOpen}
              onClose={() => setIsMarketSelectorOpen(false)}
              onSelect={handleMarketSelect}
              triggerRef={triggerButtonRef}
            />
          </div>
          <div className="flex justify-between text-xs mt-2">
            <span className="text-gray-500">Current Price: {currentPrice ? `$${Number(currentPrice).toFixed(2)}` : 'Loading...'}</span>
          </div>
        </div>
      </div>

      {/* Margin Input (USDC) */}
      <div>
        <div className={`bg-[#1A2332] border border-[#2D3748] rounded-lg p-3 ${tapToTrade.isEnabled ? 'opacity-50 pointer-events-none' : ''}`}>
          <label className="text-xs text-gray-400 mb-2 block">{tradeMode === 'one-tap-profit' ? 'Bet Amount' : 'Margin'}</label>
          <div className="flex justify-between items-center mb-2">
            <input
              type="text"
              placeholder="0.0"
              value={marginAmount}
              onChange={handleMarginInputChange}
              disabled={tapToTrade.isEnabled}
              className="bg-transparent text-2xl text-white outline-none w-full disabled:cursor-not-allowed"
            />
            <div className="flex items-center gap-2 mr-6">
              <img
                src="/images/USDC.png"
                alt="USDC"
                className="w-7 h-7 rounded-full"
                onError={(e) => {
                  const target = e.currentTarget;
                  target.style.display = 'none';
                }}
              />
              <span className="font-medium">USDC</span>
            </div>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">{formatPrice(marginUsdValue)}</span>
            <div className="flex items-center gap-2">
              <span className="text-gray-400">
                {isLoadingBalance ? 'Loading...' : `${usdcBalance} USDC`}
              </span>
              <button
                onClick={handleMaxClick}
                className="bg-[#2D3748] px-2 py-0.5 rounded text-xs cursor-pointer hover:bg-[#3d4a5f] transition-colors"
              >
                Max
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Leverage Input - Hidden for One Tap Profit */}
      {tradeMode !== 'one-tap-profit' && (
        <div className={tapToTrade.isEnabled ? 'opacity-50 pointer-events-none' : ''}>
          <label className="text-xs text-gray-400 mb-2 block">Leverage</label>
        
        {/* Slider and Value Box in One Row */}
        <div className="flex items-center gap-3">
          {/* Slider Container */}
          <div className="flex-1 relative pt-1 pb-4">
            <div className="relative h-1 bg-[#2D3748] rounded-full">
              {/* Blue progress line */}
              <div
                className="absolute top-0 left-0 h-full bg-blue-400 rounded-full"
                style={{
                  width: `${(getCurrentSliderIndex() / maxSliderValue) * 100}%`
                }}
              />

              {/* Markers */}
              {leverageMarkers.map((marker, index) => {
                const markerIndex = leverageValues.findIndex(v => Math.abs(v - marker) < 0.01);
                const position = (markerIndex / maxSliderValue) * 100;
                const isActive = getCurrentSliderIndex() >= markerIndex;
                return (
                  <div
                    key={index}
                    className={`absolute w-3 h-3 rounded-full border-2 transition-colors duration-150 ${
                      isActive ? 'bg-blue-400 border-blue-400' : 'bg-[#1A2332] border-[#4A5568]'
                    }`}
                    style={{
                      left: `${position}%`,
                      top: '50%',
                      transform: 'translate(-50%, -50%)'
                    }}
                  />
                );
              })}

              {/* Slider handle */}
              <div
                className="absolute w-5 h-5 bg-white rounded-full shadow-lg cursor-pointer border-2 border-blue-400"
                style={{
                  left: `${(getCurrentSliderIndex() / maxSliderValue) * 100}%`,
                  top: '50%',
                  transform: 'translate(-50%, -50%)'
                }}
              />

              {/* Leverage Tooltip */}
              {showLeverageTooltip && (
                <div
                  className="absolute -top-12 transition-opacity duration-200"
                  style={{
                    left: `${(getCurrentSliderIndex() / maxSliderValue) * 100}%`,
                    transform: 'translateX(-50%)'
                  }}
                >
                  <div className="relative bg-blue-400 text-white px-3 py-1.5 rounded-lg shadow-lg whitespace-nowrap">
                    <span className="text-sm font-bold">{leverage.toFixed(1)}x</span>
                    {/* Arrow pointing down */}
                    <div className="absolute left-1/2 -translate-x-1/2 -bottom-1 w-0 h-0 border-l-4 border-l-transparent border-r-4 border-r-transparent border-t-4 border-t-blue-400"></div>
                  </div>
                </div>
              )}
            </div>

            <input
              type="range"
              min="0"
              max={maxSliderValue}
              step="1"
              value={getCurrentSliderIndex()}
              onChange={handleLeverageChange}
              onMouseDown={handleLeverageMouseDown}
              onMouseUp={handleLeverageMouseUp}
              onTouchStart={handleLeverageMouseDown}
              onTouchEnd={handleLeverageMouseUp}
              disabled={tapToTrade.isEnabled}
              className="absolute inset-0 w-full opacity-0 cursor-grab active:cursor-grabbing disabled:cursor-not-allowed z-10"
            />

            <div className="absolute top-full mt-2 left-0 right-0">
              {leverageMarkers.map((marker, index) => {
                const markerIndex = leverageValues.findIndex(v => Math.abs(v - marker) < 0.01);
                const position = (markerIndex / maxSliderValue) * 100;
                return (
                  <span
                    key={index}
                    className="absolute text-xs text-gray-400 font-medium"
                    style={{
                      left: `${position}%`,
                      transform: 'translateX(-50%)'
                    }}
                  >
                    {marker < 1 ? marker.toFixed(1) : marker}x
                  </span>
                );
              })}
            </div>
          </div>

          {/* Leverage Value Box */}
          <div className="bg-[#2D3748] rounded-lg px-3 py-2 min-w-[70px] flex items-center justify-center gap-1">
            <input
              type="text"
              value={leverageInput}
              onChange={handleLeverageInputChange}
              onBlur={handleLeverageInputBlur}
              disabled={tapToTrade.isEnabled}
              className="bg-transparent text-sm font-semibold text-white outline-none w-12 text-right disabled:cursor-not-allowed"
            />
            <span className="text-sm font-semibold text-white">x</span>
          </div>
        </div>
        </div>
      )}

      {/* Timeframe Selector - Only for Open Position mode */}
      {tradeMode === 'open-position' && (
        <>
          <div className="mb-4"></div>
          <div className={tapToTrade.isEnabled ? 'opacity-50 pointer-events-none' : ''}>
            <label className="text-xs text-gray-400 mb-2 block">Timeframe</label>
            <div className="relative" ref={timeframeRef}>
              <button
                onClick={() => setIsTimeframeOpen(!isTimeframeOpen)}
                disabled={tapToTrade.isEnabled}
                className="w-full bg-[#1A2332] rounded-lg px-3 py-2.5 flex items-center justify-between text-white hover:bg-[#2D3748] transition-colors disabled:cursor-not-allowed"
              >
                <span className="font-semibold">{selectedTimeframeLabel}</span>
                <ChevronDown size={16} className={`transition-transform ${isTimeframeOpen ? 'rotate-180' : ''}`} />
              </button>

              {isTimeframeOpen && (
                <div className="absolute top-full mt-1 left-0 w-full bg-[#1A2332] border border-[#2D3748] rounded-lg shadow-xl z-50 overflow-hidden">
                  {TIMEFRAME_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleTimeframeSelect(option.value)}
                      className={`w-full px-3 py-2 text-left hover:bg-[#2D3748] transition-colors ${
                        timeframe === option.value ? 'bg-[#2D3748] text-blue-300' : 'text-white'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}


      {/* Tap to Trade Status Banner */}
      {tapToTrade.isEnabled && (
        <div className="bg-blue-300/10 border border-blue-300/50 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-300 rounded-full animate-pulse"></div>
            <span className="text-sm font-bold text-blue-300">Tap to Trade Active</span>
          </div>
          <p className="text-xs text-blue-300 mt-1">
            Tap grid cells on chart to select orders
          </p>
          <div className="bg-yellow-500/10 border border-yellow-500/50 rounded px-2 py-1.5 mt-2 flex items-center gap-1.5">
            <Info size={12} className="text-yellow-400 flex-shrink-0" />
            <p className="text-xs text-yellow-300">
              To modify settings, please press <span className="font-bold text-yellow-200">Stop</span> first
            </p>
          </div>
        </div>
      )}

      {/* Grid Configuration - Only for Open Position mode */}
      {tradeMode === 'open-position' && (
        <div className="space-y-3 border-t border-[#1A202C] pt-3">
          <div className="text-xs font-semibold text-gray-400 flex items-center gap-2 mb-2">
            <GridIcon size={14} />
            Tap to Trade Grid Settings
          </div>
          
          {/* X Coordinate - Time Grid */}
          <div className={tapToTrade.isEnabled ? 'opacity-50 pointer-events-none' : ''}>
            <label className="text-xs text-gray-400 mb-2 flex items-center gap-1">
              X Coordinate (Time Grid)
              <Info size={12} className="text-gray-500" />
            </label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="1"
                max="15"
                step="1"
                value={tapToTrade.gridSizeX}
                onChange={(e) => tapToTrade.setGridSizeX(parseInt(e.target.value))}
                disabled={tapToTrade.isEnabled}
                className="flex-1 h-2 bg-[#1A2332] rounded-lg appearance-none cursor-pointer accent-blue-300 disabled:cursor-not-allowed"
              />
              <div className="bg-[#1A2332] rounded px-3 py-1.5 min-w-[60px] text-center">
                <span className="text-white font-semibold text-sm">{tapToTrade.gridSizeX}</span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              1 grid column = {tapToTrade.gridSizeX} candle{tapToTrade.gridSizeX > 1 ? 's' : ''}
            </p>
          </div>

          {/* Y Coordinate - Price Grid */}
          <div className={tapToTrade.isEnabled ? 'opacity-50 pointer-events-none' : ''}>
            <label className="text-xs text-gray-400 mb-2 flex items-center gap-1">
              Y Coordinate (Price Grid)
              <Info size={12} className="text-gray-500" />
            </label>

            {/* Show selection boxes for Solana with specific timeframes */}
            {activeMarket?.symbol === 'SOL' && timeframe === '1' ? (
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    tapToTrade.setGridSizeY(0.1);
                    setHasSelectedYGrid(true);
                  }}
                  disabled={tapToTrade.isEnabled}
                  className={`flex-1 py-3 rounded-lg font-semibold transition-all disabled:cursor-not-allowed ${
                    tapToTrade.gridSizeY === 0.1
                      ? 'bg-blue-300 text-white shadow-lg shadow-blue-300/30'
                      : 'bg-[#1A2332] text-gray-400 hover:bg-[#2D3748]'
                  }`}
                >
                  0.1%
                </button>
                <button
                  onClick={() => {
                    tapToTrade.setGridSizeY(0.2);
                    setHasSelectedYGrid(true);
                  }}
                  disabled={tapToTrade.isEnabled}
                  className={`flex-1 py-3 rounded-lg font-semibold transition-all disabled:cursor-not-allowed ${
                    tapToTrade.gridSizeY === 0.2
                      ? 'bg-blue-300 text-white shadow-lg shadow-blue-300/30'
                      : 'bg-[#1A2332] text-gray-400 hover:bg-[#2D3748]'
                  }`}
                >
                  0.2%
                </button>
              </div>
            ) : activeMarket?.symbol === 'SOL' && timeframe === '5' ? (
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    tapToTrade.setGridSizeY(0.1);
                    setHasSelectedYGrid(true);
                  }}
                  disabled={tapToTrade.isEnabled}
                  className={`py-3 rounded-lg font-semibold transition-all disabled:cursor-not-allowed ${
                    tapToTrade.gridSizeY === 0.1
                      ? 'bg-blue-300 text-white shadow-lg shadow-blue-300/30'
                      : 'bg-[#1A2332] text-gray-400 hover:bg-[#2D3748]'
                  }`}
                >
                  0.1%
                </button>
                <button
                  onClick={() => {
                    tapToTrade.setGridSizeY(0.2);
                    setHasSelectedYGrid(true);
                  }}
                  disabled={tapToTrade.isEnabled}
                  className={`py-3 rounded-lg font-semibold transition-all disabled:cursor-not-allowed ${
                    tapToTrade.gridSizeY === 0.2
                      ? 'bg-blue-300 text-white shadow-lg shadow-blue-300/30'
                      : 'bg-[#1A2332] text-gray-400 hover:bg-[#2D3748]'
                  }`}
                >
                  0.2%
                </button>
                <button
                  onClick={() => {
                    tapToTrade.setGridSizeY(0.3);
                    setHasSelectedYGrid(true);
                  }}
                  disabled={tapToTrade.isEnabled}
                  className={`py-3 rounded-lg font-semibold transition-all disabled:cursor-not-allowed ${
                    tapToTrade.gridSizeY === 0.3
                      ? 'bg-blue-300 text-white shadow-lg shadow-blue-300/30'
                      : 'bg-[#1A2332] text-gray-400 hover:bg-[#2D3748]'
                  }`}
                >
                  0.3%
                </button>
                <button
                  onClick={() => {
                    tapToTrade.setGridSizeY(0.4);
                    setHasSelectedYGrid(true);
                  }}
                  disabled={tapToTrade.isEnabled}
                  className={`py-3 rounded-lg font-semibold transition-all disabled:cursor-not-allowed ${
                    tapToTrade.gridSizeY === 0.4
                      ? 'bg-blue-300 text-white shadow-lg shadow-blue-300/30'
                      : 'bg-[#1A2332] text-gray-400 hover:bg-[#2D3748]'
                  }`}
                >
                  0.4%
                </button>
              </div>
            ) : (
              <div className="bg-[#1A2332] rounded-lg px-3 py-2.5 flex items-center gap-2">
                <input
                  type="number"
                  min="0.1"
                  max="100"
                  step="0.1"
                  value={tapToTrade.gridSizeY}
                  onChange={(e) => {
                    tapToTrade.setGridSizeY(parseFloat(e.target.value) || 0.5);
                    setHasSelectedYGrid(true);
                  }}
                  disabled={tapToTrade.isEnabled}
                  className="bg-transparent text-white outline-none w-full [&::-webkit-inner-spin-button]:opacity-100 [&::-webkit-outer-spin-button]:opacity-100 disabled:cursor-not-allowed"
                  style={{
                    colorScheme: 'dark'
                  }}
                />
                <span className="text-gray-400 text-sm">%</span>
              </div>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Each grid row = {tapToTrade.gridSizeY.toFixed(1)}% price difference
            </p>

            {/* Price Difference Display */}
            {Number(currentPrice) > 0 && (
              <div className="mt-3">
                <label className="text-xs text-gray-400 mb-2 block">
                  Price difference per grid
                </label>
                <div className="bg-[#1A2332] rounded-lg px-3 py-2.5 flex items-center gap-2">
                  <span className="text-white font-medium">
                    {((Number(currentPrice) * tapToTrade.gridSizeY) / 100).toFixed(2)}
                  </span>
                  <span className="text-gray-400 text-sm">$</span>
                </div>
              </div>
            )}
          </div>

          {/* Cell Orders Statistics */}
          {tapToTrade.isEnabled && tapToTrade.cellOrders.size > 0 && (
            <div className="bg-[#1A2332] rounded-lg p-3 space-y-2">
              <div className="text-xs font-semibold text-white mb-2">Active Orders</div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Total Orders:</span>
                <span className="text-white font-semibold">
                  {Array.from(tapToTrade.cellOrders.values()).reduce((sum, cell) => sum + cell.orderCount, 0)}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Cells with Orders:</span>
                <span className="text-white font-semibold">{tapToTrade.cellOrders.size}</span>
              </div>
            </div>
          )}

        

        </div>
      )}

      {/* Pre-Approve Section for Tap to Trade */}
      {tradeMode === 'open-position' && authenticated && !hasLargeAllowance && (
        <div className="bg-[#1A2332] rounded-lg p-3 border border-blue-300/30">
          <div className="flex items-start gap-2">
            <Info size={16} className="text-blue-300 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-blue-300 font-medium mb-1">⚡ Enable One-Click Trading</p>
              <p className="text-xs text-gray-400 mb-2">
                Approve USDC once → Trade with 1 click instead of 2. You'll still confirm each trade for security.
              </p>
              <button
                onClick={handlePreApprove}
                disabled={isApprovalPending}
                className="w-full px-3 py-2 bg-blue-400 hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed rounded text-sm font-medium transition-colors cursor-pointer"
              >
                {isApprovalPending ? 'Approving...' : '⚡ Enable Fast Trading'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pre-Approve Section for Binary Trading */}
      {tradeMode === 'one-tap-profit' && authenticated && !hasLargeOneTapProfitAllowance && (
        <div className="bg-[#1A2332] rounded-lg p-3 border border-blue-300/30">
          <div className="flex items-start gap-2">
            <Info size={16} className="text-blue-300 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-blue-300 font-medium mb-1">⚡ Enable One-Click Binary Trading</p>
              <p className="text-xs text-gray-400 mb-2">
                Approve USDC once → Place bets with 1 click. Required before enabling Binary Trading.
              </p>
              <button
                onClick={handlePreApproveOneTapProfit}
                disabled={isOneTapProfitApprovalPending}
                className="w-full px-3 py-2 bg-blue-400 hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed rounded text-sm font-medium transition-colors cursor-pointer"
              >
                {isOneTapProfitApprovalPending ? 'Approving...' : '⚡ Approve USDC for Binary Trading'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Large Allowance Indicator for Tap to Trade */}
      {tradeMode === 'open-position' && authenticated && hasLargeAllowance && (
        <div className="bg-green-500/10 rounded-lg p-3 border border-green-500/30">
          <div className="flex items-center gap-2">
            <span className="text-green-400">✅</span>
            <div className="flex-1">
              <p className="text-sm text-green-400 font-medium">⚡ One-Click Trading Active</p>
            </div>
          </div>
        </div>
      )}

      {/* Large Allowance Indicator for Binary Trading */}
      {tradeMode === 'one-tap-profit' && authenticated && hasLargeOneTapProfitAllowance && (
        <div className="bg-green-500/10 rounded-lg p-3 border border-green-500/30">
          <div className="flex items-center gap-2">
            <span className="text-green-400">✅</span>
            <div className="flex-1">
              <p className="text-sm text-green-400 font-medium">⚡ One-Click Trading Active</p>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons - Separated for each mode */}
      {!tapToTrade.isEnabled ? (
        <>
          {/* Tap to Trade Mode (Open Position) - Needs Session Key */}
          {tradeMode === 'open-position' && (
            <button
              onClick={async () => {
                // Check if USDC is approved first
                if (!hasLargeAllowance) {
                  toast.error('Please enable One-Click Trading first by approving USDC', {
                    duration: 4000,
                    icon: '⚠️'
                  });
                  return;
                }

                // Check if Y coordinate (price grid) is selected
                if (!hasSelectedYGrid) {
                  toast.error('Please select Y Coordinate (Price Grid) first', {
                    duration: 4000,
                    icon: '⚠️'
                  });
                  return;
                }

                // Validate inputs
                if (!marginAmount || parseFloat(marginAmount) === 0) {
                  alert('Please enter margin amount');
                  return;
                }

                // Enable with session key setup
                await tapToTrade.toggleMode({
                  symbol: activeMarket?.symbol || 'BTC',
                  margin: marginAmount,
                  leverage: leverage,
                  timeframe: timeframe,
                  currentPrice: Number(currentPrice) || 0,
                });
              }}
              disabled={
                tapToTrade.isLoading || 
                !marginAmount || 
                !hasLargeAllowance || 
                !hasSelectedYGrid
              }
              className="mt-2 py-3 rounded-lg font-bold text-white bg-blue-300 hover:bg-blue-400 transition-all shadow-lg shadow-blue-300/30 hover:cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {tapToTrade.isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Setting up session key...
                </>
              ) : !hasLargeAllowance ? (
                '⚡ Enable One-Click Trading First'
              ) : (
                'Enable Tap to Trade'
              )}
            </button>
          )}

          {/* One Tap Profit Mode - With Session Key for Gasless Trading */}
          {tradeMode === 'one-tap-profit' && (
            <button
              onClick={async () => {
                // Check if USDC is approved first
                if (!hasLargeOneTapProfitAllowance) {
                  toast.error('Please approve USDC first by clicking "Approve USDC for Binary Trading"', {
                    duration: 4000,
                    icon: '⚠️'
                  });
                  return;
                }

                // Validate inputs
                if (!marginAmount || parseFloat(marginAmount) === 0) {
                  toast.error('Please enter bet amount', {
                    duration: 3000,
                    icon: '⚠️'
                  });
                  return;
                }

                try {
                  toast.loading('Creating session key for gasless binary trading...', { id: 'binary-session' });
                  
                  // Step 1: Get embedded wallet
                  const embeddedWallet = wallets.find((w) => w.walletClientType === 'privy');
                  
                  if (!embeddedWallet) {
                    throw new Error('Privy wallet not found');
                  }
                  
                  const traderAddress = embeddedWallet.address;
                  const walletClient = await embeddedWallet.getEthereumProvider();
                  
                  if (!walletClient) {
                    throw new Error('Could not get wallet client');
                  }
                  
                  // Step 2: Create session key (user signs once)
                  await binarySessionKey.createSession(
                    traderAddress,
                    walletClient,
                    30 * 60 * 1000 // 30 minutes
                  );
                  
                  if (!binarySessionKey.isSessionValid()) {
                    throw new Error('Session creation failed');
                  }
                  
                  // Step 2: Enable tap-to-trade mode (opens chart)
                  await tapToTrade.toggleMode({
                    symbol: activeMarket?.symbol || 'BTC',
                    margin: marginAmount,
                    leverage: 1, // Not used in binary trading
                    timeframe: '1', // Fixed 1 second for binary
                    currentPrice: Number(currentPrice) || 0,
                  });
                  
                  // Step 3: Mark binary trading as enabled
                  tapToTrade.setIsBinaryTradingEnabled(true);
                  
                  toast.success('✅ Binary Trading enabled! Tap grid without signatures', { 
                    id: 'binary-session',
                    duration: 5000
                  });
                } catch (error) {
                  console.error('Failed to enable binary trading:', error);
                  toast.error('Failed to enable binary trading. Please try again.', { id: 'binary-session' });
                }
              }}
              disabled={
                tapToTrade.isLoading || 
                !marginAmount ||
                !hasLargeOneTapProfitAllowance
              }
              className="mt-2 py-3 rounded-lg font-bold text-white bg-blue-300 hover:bg-blue-400 transition-all shadow-lg shadow-blue-300/30 hover:cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {tapToTrade.isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Setting up session key...
                </>
              ) : (
                'Enable Binary Trade'
              )}
            </button>
          )}
        </>
      ) : tradeMode === 'one-tap-profit' ? (
        // Binary Trading Stop Button
        <button
          onClick={async () => {
            // Disable binary trading
            tapToTrade.setIsBinaryTradingEnabled(false);
            
            // Disable mode
            await tapToTrade.toggleMode();
            
            toast.success('Binary Trading stopped');
          }}
          className="mt-2 py-3 rounded-lg font-bold text-white bg-red-500 hover:bg-red-600 transition-all shadow-lg shadow-red-500/30 hover:cursor-pointer flex items-center justify-center gap-2"
        >
          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
          <span>Stop Binary Trading</span>
        </button>
      ) : (
        <button
          onClick={async () => {
            await tapToTrade.toggleMode();
          }}
          disabled={tapToTrade.isLoading}
          className="mt-2 w-full py-3 rounded-lg font-bold text-white bg-red-500 hover:bg-red-600 transition-all shadow-lg shadow-red-500/30 hover:cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {tapToTrade.isLoading ? 'Stopping...' : 'Stop Tap to Trade'}
        </button>
      )}

      {/* Info Section */}
      <div className="text-xs text-gray-500 space-y-1 border-t border-[#1A202C] pt-3">
        <div className="flex justify-between">
          <span>Mode:</span>
          <span className="text-white">{tradeMode === 'open-position' ? 'Open Position' : 'One Tap Profit'}</span>
        </div>
        <div className="flex justify-between">
          <span>Market:</span>
          <span className="text-white">{activeMarket?.symbol || 'BTC'}/USD</span>
        </div>
        <div className="flex justify-between">
          <span>{tradeMode === 'one-tap-profit' ? 'Bet Amount:' : 'Margin:'}</span>
          <span className="text-white">{formatPrice(marginUsdValue)}</span>
        </div>
        {tradeMode !== 'one-tap-profit' && (
          <div className="flex justify-between">
            <span>Leverage:</span>
            <span className="text-white">{leverage.toFixed(1)}x</span>
          </div>
        )}
        {tradeMode === 'open-position' && (
          <div className="flex justify-between">
            <span>Timeframe:</span>
            <span className="text-white">{selectedTimeframeLabel}</span>
          </div>
        )}
        {xCoordinate && (
          <div className="flex justify-between">
            <span>X (Time):</span>
            <span className="text-white">{xCoordinate}</span>
          </div>
        )}
        {yCoordinate && (
          <div className="flex justify-between">
            <span>Y (Price):</span>
            <span className="text-white">${yCoordinate}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default TapToTrade;

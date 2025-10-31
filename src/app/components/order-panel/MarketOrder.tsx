'use client';
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Info, Star } from 'lucide-react';
import { useMarket } from '../../contexts/MarketContext';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { baseSepolia } from 'wagmi/chains';
import { parseUnits } from 'viem';
import { useMarketOrderFlow, useRelayMarketOrder, useApproveUSDCForTrading, calculatePositionCost } from '@/hooks/useMarketOrder';
import { usePaymasterFlow } from '@/hooks/usePaymaster';
import { useEmbeddedWallet } from '@/hooks/useEmbeddedWallet';
import { useUSDCBalance } from '@/hooks/useUSDCBalance';
import { USDC_DECIMALS } from '@/config/contracts';
import { toast } from 'react-hot-toast';
import { useTPSL } from '@/hooks/useTPSL';
import { useUserPositions } from '@/hooks/usePositions';

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

// Market Selector Component
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

// MarketOrder Component - Updated
interface MarketOrderProps {
  activeTab?: 'long' | 'short' | 'swap';
}

const MarketOrder: React.FC<MarketOrderProps> = ({ activeTab = 'long' }) => {
  const { activeMarket, setActiveMarket, currentPrice } = useMarket();
  const { authenticated, user } = usePrivy();
  const { wallets, ready: walletsReady } = useWallets();
  const { address: embeddedAddress, hasEmbeddedWallet } = useEmbeddedWallet();
  const [leverage, setLeverage] = useState(10);
  const [leverageInput, setLeverageInput] = useState<string>('10.0');
  const { usdcBalance, isLoadingBalance } = useUSDCBalance();
  const [payAmount, setPayAmount] = useState<string>('');
  const [isMarketSelectorOpen, setIsMarketSelectorOpen] = useState(false);
  const [isTpSlEnabled, setIsTpSlEnabled] = useState(false);
  const [takeProfitPrice, setTakeProfitPrice] = useState<string>('');
  const [stopLossPrice, setStopLossPrice] = useState<string>('');
  const [tpSlUnit, setTpSlUnit] = useState<'price' | 'percentage'>('percentage');
  const [showLeverageTooltip, setShowLeverageTooltip] = useState(false);
  const triggerButtonRef = useRef<HTMLButtonElement>(null);
  const processedHashRef = useRef<string | null>(null);

  // Trading hooks - Use GASLESS relay for transactions
  const { openPositionGasless, isPending: isRelayPending, hash: relayHash, usdcCharged, positionId: relayPositionId } = useRelayMarketOrder();
  const { balance: paymasterBalance, isApproving, isDepositing, ensurePaymasterBalance } = usePaymasterFlow();
  const { approve: approveUSDC, hasAllowance, allowance, isPending: isApprovalPending } = useApproveUSDCForTrading();
  const { setTPSL } = useTPSL();
  const { positionIds, refetch: refetchPositions } = useUserPositions();

  const leverageMarkers = [1, 2, 5, 10, 25, 50, 100];
  const [showPreApprove, setShowPreApprove] = useState(false);

  // Check if we have large allowance (> $10,000) - memoized to prevent setState during render
  const hasLargeAllowance = useMemo(() => {
    return Boolean(allowance && allowance > parseUnits('10000', 6));
  }, [allowance]);

  // Handler untuk pre-approve USDC dalam jumlah besar
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
      setShowPreApprove(false);
    } catch (error) {
      console.error('Pre-approve error:', error);
      toast.error('Failed to pre-approve USDC', { id: 'pre-approve' });
    }
  };

  // Handler untuk mengganti market
  const handleMarketSelect = (market: Market) => {
    setActiveMarket(market);
    setIsMarketSelectorOpen(false);
  };
  
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

  // Get oracle price from current price - memoized
  const oraclePrice = useMemo(() => {
    return currentPrice ? parseFloat(currentPrice) : 0;
  }, [currentPrice]);
  
  const payUsdValue = useMemo(() => {
    return payAmount ? parseFloat(payAmount) : 0;
  }, [payAmount]);
  
  const longShortUsdValue = useMemo(() => {
    return payUsdValue * leverage;
  }, [payUsdValue, leverage]);
  
  const tokenAmount = useMemo(() => {
    return oraclePrice > 0 ? longShortUsdValue / oraclePrice : 0;
  }, [oraclePrice, longShortUsdValue]);

  // Calculate liquidation price
  const liquidationPrice = useMemo(() => {
    if (!oraclePrice || !leverage || leverage <= 0 || !payAmount || parseFloat(payAmount) <= 0) {
      return null;
    }
    
    // Liquidation happens when loss = collateral
    // For LONG: liquidationPrice = entryPrice * (1 - 1/leverage)
    // For SHORT: liquidationPrice = entryPrice * (1 + 1/leverage)
    const liqPercentage = 1 / leverage;
    
    if (activeTab === 'long') {
      return oraclePrice * (1 - liqPercentage);
    } else if (activeTab === 'short') {
      return oraclePrice * (1 + liqPercentage);
    }
    return null;
  }, [oraclePrice, leverage, payAmount, activeTab]);

  const handlePayInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setPayAmount(value);
    }
  };

  const handleMaxClick = () => {
    setPayAmount(usdcBalance);
  };

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

  const formatPrice = (price: number) => {
    if (isNaN(price) || price === 0) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price);
  };

  const formatTokenAmount = (amount: number) => {
    if (isNaN(amount) || amount === 0) return '0.0';
    return amount.toFixed(6);
  };
  
  const formatLeverage = (lev: number) => {
    return lev.toFixed(1);
  };

  // Handle market order execution
  const handleOpenPosition = async () => {
    // Moved console.logs to avoid setState during render warnings
    // All logging is now inside the async function

    if (!authenticated) {
      toast.error('Please connect your wallet');
      return;
    }

    if (!hasEmbeddedWallet || !embeddedAddress) {
      toast.error('Embedded wallet not ready. Please wait...');
      return;
    }

    if (!payAmount || parseFloat(payAmount) <= 0) {
      toast.error('Please enter collateral amount');
      return;
    }

    if (!activeMarket) {
      toast.error('Please select a market');
      return;
    }

    // Check if USDC is approved first (only for long/short, not swap)
    const needsApproval = (activeTab === 'long' || activeTab === 'short') && !hasLargeAllowance;
    if (needsApproval) {
      toast.error('Please enable One-Click Trading first by approving USDC', {
        duration: 4000,
        icon: '⚠️'
      });
      return;
    }

    try {
      // Find and set active embedded wallet
      const embeddedWallet = wallets.find(
        (w) => w.walletClientType === 'privy' && w.address === embeddedAddress
      );

      if (!embeddedWallet) {
        toast.error('Embedded wallet not found in wallets list');
        console.error('Available wallets:', wallets);
        return;
      }

      // Set embedded wallet as active
      console.log('Setting active wallet:', embeddedWallet.address);
      await embeddedWallet.switchChain(baseSepolia.id);

      // Calculate position costs
      const { totalCost, tradingFee, positionSize } = calculatePositionCost(payAmount, leverage);
      
      console.log('Position costs:', { totalCost, tradingFee, positionSize });

      // NOTE: Paymaster balance check disabled - using relay backend instead
      // Relay backend pays gas using its own ETH, no user deposit needed
      // const hasBalance = await ensurePaymasterBalance('1.00');
      // if (!hasBalance) {
      //   toast('Setting up paymaster... Please try again after approval/deposit completes', {
      //     icon: 'ℹ️',
      //   });
      //   return;
      // }

      // Execute market order (GASLESS via relay!)
      await openPositionGasless({
        symbol: activeMarket.symbol,
        isLong: activeTab === 'long',
        collateral: payAmount,
        leverage: Math.floor(leverage), // Round to integer
      });
      
      // Success toast will be shown by useEffect below
    } catch (error) {
      console.error('Error executing market order:', error);
      toast.error('Failed to execute market order');
    }
  };

  // Get button text based on state
  const getButtonText = () => {
    if (!authenticated) return 'Connect Wallet';
    if ((activeTab === 'long' || activeTab === 'short') && !hasLargeAllowance) return '⚡ Enable One-Click Trading First';
    if (isApproving) return 'Approving for Paymaster...';
    if (isDepositing) return 'Depositing to Paymaster...';
    if (isRelayPending) return 'Opening Position (Gasless)...';
    if (!payAmount || parseFloat(payAmount) <= 0) return 'Enter Amount';

    if (activeTab === 'long') return `⚡ Long ${activeMarket?.symbol || 'BTC'} (No Gas)`;
    if (activeTab === 'short') return `⚡ Short ${activeMarket?.symbol || 'BTC'} (No Gas)`;
    return 'Swap';
  };

  const isButtonDisabled = !authenticated ||
    isRelayPending ||
    isApproving ||
    isDepositing ||
    !payAmount ||
    parseFloat(payAmount) <= 0 ||
    ((activeTab === 'long' || activeTab === 'short') && !hasLargeAllowance);

  // Show success notification with explorer link and auto-set TP/SL
  useEffect(() => {
    // Only process new hashes, prevent duplicate toasts
    if (relayHash && relayHash !== processedHashRef.current) {
      processedHashRef.current = relayHash; // Mark as processed
      
      const shouldSetTPSL = isTpSlEnabled && (takeProfitPrice || stopLossPrice);
      
      toast.success(
        <div>
          <div>✅ Position opened! Gas paid in USDC: {usdcCharged}</div>
          <a 
            href={`https://sepolia.basescan.org/tx/${relayHash}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-300 hover:underline text-xs"
          >
            View transaction
          </a>
          {shouldSetTPSL && (
            <div className="text-blue-300 text-xs mt-1">
              🎯 Setting TP/SL automatically...
            </div>
          )}
        </div>,
        { duration: 4000, id: 'position-success' }
      );
      
      // Auto-set TP/SL if enabled
      if (shouldSetTPSL && embeddedAddress) {
        const setTPSLForNewPosition = async () => {
          try {
            // Wait a bit for backend to process
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Get position ID from backend (already extracted from event)
            const newPositionId = relayPositionId;
            
            if (!newPositionId) {
              toast.error('⚠️ Could not get position ID from backend. Please set TP/SL manually.', { duration: 5000 });
              return;
            }
            
            console.log('🎯 Setting TP/SL for position', newPositionId);
            
            const success = await setTPSL({
              positionId: newPositionId,
              trader: embeddedAddress,
              takeProfit: takeProfitPrice || undefined,
              stopLoss: stopLossPrice || undefined,
            });
            
            if (success) {
              toast.success('✅ TP/SL set successfully!', { duration: 3000 });
              // Broadcast event to trigger TP/SL refresh in positions table
              window.dispatchEvent(new CustomEvent('tpsl-updated', { detail: { positionId: newPositionId } }));
            }
          } catch (error) {
            console.error('Failed to auto-set TP/SL:', error);
            toast.error('⚠️ Could not auto-set TP/SL. Please set manually from positions table.', { duration: 5000 });
          }
        };
        
        setTPSLForNewPosition();
      }
      
      // Reset form
      setPayAmount('');
      // Don't reset TP/SL values immediately - wait for auto-set to complete
      if (!shouldSetTPSL) {
        setTakeProfitPrice('');
        setStopLossPrice('');
        setIsTpSlEnabled(false);
      } else {
        // Reset after delay
        setTimeout(() => {
          setTakeProfitPrice('');
          setStopLossPrice('');
          setIsTpSlEnabled(false);
        }, 5000);
      }
    }
  }, [relayHash, usdcCharged, isTpSlEnabled, takeProfitPrice, stopLossPrice, embeddedAddress, setTPSL, refetchPositions, positionIds]);

  return (
    <div className="flex flex-col gap-3 md:px-4 px-3 md:py-4 py-3 bg-[#0F1419]">
      <div>
        <div className="bg-[#1A2332] border border-[#2D3748] rounded-lg md:p-3 p-2">
          <label className="text-xs text-gray-400 mb-2 block">Pay</label>
          <div className="flex justify-between items-center mb-2">
            <input
              type="text"
              placeholder="0.0"
              value={payAmount}
              onChange={handlePayInputChange}
              className="bg-transparent text-2xl text-white outline-none w-full"
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
            <span className="text-gray-500">{formatPrice(payUsdValue)}</span>
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

      <div>
        <div className="bg-[#1A2332] border border-[#2D3748] rounded-lg p-3 relative">
          <label className="text-xs text-gray-400 mb-2 block">
            {activeTab === 'long' ? 'Long' : activeTab === 'short' ? 'Short' : 'Receive'}
          </label>
          <div className="flex justify-between items-center mb-2 gap-2">
            <input
              type="text"
              placeholder="0.0"
              value={activeTab === 'swap' ? (payAmount && oraclePrice > 0 ? formatTokenAmount(payUsdValue / oraclePrice) : '') : (tokenAmount > 0 ? formatTokenAmount(tokenAmount) : '')}
              readOnly
              className="bg-transparent text-2xl text-white outline-none flex-1 min-w-0"
            />
            <button
              ref={triggerButtonRef}
              onClick={() => setIsMarketSelectorOpen(!isMarketSelectorOpen)}
              className="flex items-center gap-2 bg-transparent rounded-lg px-2 py-1 text-base cursor-pointer hover:opacity-75 transition-opacity flex-shrink-0"
            >
              {activeMarket && (
                <img
                  src={activeMarket.logoUrl}
                  alt={activeMarket.symbol}
                  className="w-7 h-7 rounded-full flex-shrink-0"
                  onError={(e) => {
                    const target = e.currentTarget;
                    target.style.display = 'none';
                  }}
                />
              )}
              <span className="whitespace-nowrap font-medium">{activeTab === 'swap' ? activeMarket?.symbol || 'BTC' : `${activeMarket?.symbol || 'BTC'}/USD`}</span>
              <ChevronDown
                size={16}
                className={`flex-shrink-0 transition-transform duration-200 ${isMarketSelectorOpen ? 'rotate-180' : ''}`}
              />
            </button>
            <MarketSelector
              isOpen={isMarketSelectorOpen}
              onClose={() => setIsMarketSelectorOpen(false)}
              onSelect={handleMarketSelect}
              triggerRef={triggerButtonRef}
            />
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">
              {activeTab === 'swap' ? formatPrice(payUsdValue) : formatPrice(longShortUsdValue)}
            </span>
            {activeTab !== 'swap' && <span className="text-gray-400">Leverage: {formatLeverage(leverage)}x</span>}
          </div>
        </div>
      </div>

{activeTab !== 'swap' && (
      <div>
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
                    <span className="text-sm font-bold">{formatLeverage(leverage)}x</span>
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
              className="absolute inset-0 w-full opacity-0 cursor-grab active:cursor-grabbing z-10"
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
              className="bg-transparent text-sm font-semibold text-white outline-none w-12 text-right"
            />
            <span className="text-sm font-semibold text-white">x</span>
          </div>
        </div>
      </div>
      )}

      {/* Select different tokens message - Only show for Swap */}
      {activeTab === 'swap' && (
        <div className="text-center py-3 text-gray-500 text-sm">
          Select different tokens
        </div>
      )}

      {activeTab !== 'swap' && (
        <>
          <div className="mb-4"></div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-400">Pool</span>
            <button className="flex items-center gap-1 text-white cursor-pointer hover:text-blue-300 transition-colors">
              {activeMarket?.symbol || 'BTC'}-USDC

            </button>
          </div>

          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center gap-1">
              <span className="text-gray-400">Collateral In</span>
              <Info size={12} className="text-gray-500" />
            </div>
            <button className="flex items-center gap-1 text-white hover:text-blue-300 transition-colors">
              USDC

            </button>
          </div>
        </>
      )}

      {activeTab !== 'swap' && (
        <>
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-400">Take Profit / Stop Loss</span>
            <label className="relative inline-block w-10 h-5">
              <input
                type="checkbox"
                className="opacity-0 w-0 h-0 peer"
                checked={isTpSlEnabled}
                onChange={(e) => setIsTpSlEnabled(e.target.checked)}
              />
              <span className={`absolute cursor-pointer inset-0 rounded-full transition-all ${isTpSlEnabled ? 'bg-blue-300' : 'bg-[#2D3748]'}`}>
                <span className={`absolute left-0.5 top-0.5 h-4 w-4 bg-white rounded-full transition-transform ${isTpSlEnabled ? 'translate-x-5' : 'translate-x-0'}`}></span>
              </span>
            </label>
          </div>

          {/* Take Profit / Stop Loss Form */}
          {isTpSlEnabled && (
            <div className="bg-[#1A2332] rounded-lg p-3 space-y-3">
              {/* Take Profit */}
              <div>
                <label className="text-xs text-gray-400 mb-2 block">Take Profit</label>
                <div className="bg-[#0F1419] rounded-lg px-3 py-2 flex items-center">
                  <span className="text-xs text-gray-400 mr-2">$</span>
                  <input
                    type="text"
                    placeholder="Price"
                    value={takeProfitPrice}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '' || /^\d*\.?\d*$/.test(value)) {
                        setTakeProfitPrice(value);
                      }
                    }}
                    className="bg-transparent text-sm text-white outline-none w-full"
                  />
                </div>
              </div>

              {/* Stop Loss */}
              <div>
                <label className="text-xs text-gray-400 mb-2 block">Stop Loss</label>
                <div className="bg-[#0F1419] rounded-lg px-3 py-2 flex items-center">
                  <span className="text-xs text-gray-400 mr-2">$</span>
                  <input
                    type="text"
                    placeholder="Price"
                    value={stopLossPrice}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '' || /^\d*\.?\d*$/.test(value)) {
                        setStopLossPrice(value);
                      }
                    }}
                    className="bg-transparent text-sm text-white outline-none w-full"
                  />
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Pre-Approve Section */}
      {authenticated && !hasLargeAllowance && activeTab !== 'swap' && (
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

      {/* Large Allowance Indicator */}
      {authenticated && hasLargeAllowance && activeTab !== 'swap' && (
        <div className="bg-green-500/10 rounded-lg p-3 border border-green-500/30">
          <div className="flex items-center gap-2">
            <span className="text-green-400">✅</span>
            <div className="flex-1">
              <p className="text-sm text-green-400 font-medium">⚡ One-Click Trading Active</p>
              <p className="text-xs text-gray-400 mt-0.5">
                USDC pre-approved! Just 1 confirmation per trade (for your security).
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Action Button */}
      <button
        onClick={handleOpenPosition}
        disabled={isButtonDisabled}
        className={`w-full py-4 rounded-lg font-bold text-white transition-all duration-200 ${
          isButtonDisabled
            ? 'bg-gray-600 cursor-not-allowed opacity-50'
            : activeTab === 'long'
            ? 'bg-green-600 hover:bg-green-700'
            : activeTab === 'short'
            ? 'bg-red-600 hover:bg-red-700'
            : 'bg-blue-400 hover:bg-blue-500'
        }`}
      >
        {getButtonText()}
      </button>

      {/* Paymaster Info */}
      {authenticated && parseFloat(paymasterBalance) > 0 && (
        <div className="text-xs text-gray-400 text-center">
          Gas Balance: ${parseFloat(paymasterBalance).toFixed(2)} USDC
        </div>
      )}

      <div className="text-center py-6 text-gray-500 text-sm border-t border-[#1A202C]">
        {payAmount ? (activeTab === 'swap' ? `Swap Amount: ${formatPrice(payUsdValue)}` : `Position Size: ${formatPrice(longShortUsdValue)}`) : 'Enter an amount'}
      </div>

      <div className="space-y-2 text-sm border-t border-[#1A202C] pt-3">
        <div className="flex justify-between">
          <span className="text-gray-400">Oracle Price</span>
          <span className="text-white">{formatPrice(oraclePrice)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Liquidation Price</span>
          <span className="text-white">
            {liquidationPrice ? formatPrice(liquidationPrice) : '-'}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Trading Fee</span>
          <span className="text-white">
            {payAmount && leverage > 0 
              ? `$${calculatePositionCost(payAmount, leverage).tradingFee} (0.05%)`
              : '0.000%'
            }
          </span>
        </div>
      </div>
    </div>
  );
};

export default MarketOrder;

"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import TradingViewWidget from "./TradingViewWidget";
import SimpleLineChart from "./SimpleLineChart";
import PerSecondChart from "./PerSecondChart";

interface Market {
  symbol: string;
  tradingViewSymbol: string;
  logoUrl: string;
  binanceSymbol: string;
}

interface MarketData {
  price: string;
  priceChange: string;
  priceChangePercent: string;
  high24h: string;
  low24h: string;
  volume24h: string;
}

interface FuturesData {
  fundingRate: string;
  nextFundingTime: number;
  openInterest: string;
  openInterestValue: string;
}

const ALL_MARKETS: Market[] = [
  {
    symbol: "BTC",
    tradingViewSymbol: "BINANCE:BTCUSDT",
    logoUrl:
      "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/bitcoin/info/logo.png",
    binanceSymbol: "BTCUSDT",
  },
  {
    symbol: "ETH",
    tradingViewSymbol: "BINANCE:ETHUSDT",
    logoUrl:
      "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png",
    binanceSymbol: "ETHUSDT",
  },
  {
    symbol: "SOL",
    tradingViewSymbol: "BINANCE:SOLUSDT",
    logoUrl:
      "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/info/logo.png",
    binanceSymbol: "SOLUSDT",
  },
  {
    symbol: "AVAX",
    tradingViewSymbol: "BINANCE:AVAXUSDT",
    logoUrl:
      "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/avalanchex/info/logo.png",
    binanceSymbol: "AVAXUSDT",
  },
  {
    symbol: "NEAR",
    tradingViewSymbol: "BINANCE:NEARUSDT",
    logoUrl:
      "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/near/info/logo.png",
    binanceSymbol: "NEARUSDT",
  },
  {
    symbol: "BNB",
    tradingViewSymbol: "BINANCE:BNBUSDT",
    logoUrl:
      "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/binance/info/logo.png",
    binanceSymbol: "BNBUSDT",
  },
  {
    symbol: "XRP",
    tradingViewSymbol: "BINANCE:XRPUSDT",
    logoUrl:
      "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ripple/info/logo.png",
    binanceSymbol: "XRPUSDT",
  },
  {
    symbol: "AAVE",
    tradingViewSymbol: "BINANCE:AAVEUSDT",
    logoUrl:
      "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9/logo.png",
    binanceSymbol: "AAVEUSDT",
  },
  {
    symbol: "ARB",
    tradingViewSymbol: "BINANCE:ARBUSDT",
    logoUrl:
      "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/arbitrum/info/logo.png",
    binanceSymbol: "ARBUSDT",
  },
  {
    symbol: "CRV",
    tradingViewSymbol: "BINANCE:CRVUSDT",
    logoUrl:
      "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xD533a949740bb3306d119CC777fa900bA034cd52/logo.png",
    binanceSymbol: "CRVUSDT",
  },
  {
    symbol: "DOGE",
    tradingViewSymbol: "BINANCE:DOGEUSDT",
    logoUrl:
      "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/doge/info/logo.png",
    binanceSymbol: "DOGEUSDT",
  },
  {
    symbol: "ENA",
    tradingViewSymbol: "BINANCE:ENAUSDT",
    logoUrl:
      "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x57E114B691Db790C35207b2e685D4A43181e6061/logo.png",
    binanceSymbol: "ENAUSDT",
  },
  {
    symbol: "LINK",
    tradingViewSymbol: "BINANCE:LINKUSDT",
    logoUrl:
      "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x514910771AF9Ca656af840dff83E8264EcF986CA/logo.png",
    binanceSymbol: "LINKUSDT",
  },
  {
    symbol: "MATIC",
    tradingViewSymbol: "BINANCE:MATICUSDT",
    logoUrl:
      "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/polygon/info/logo.png",
    binanceSymbol: "MATICUSDT",
  },
  {
    symbol: "PEPE",
    tradingViewSymbol: "BINANCE:PEPEUSDT",
    logoUrl:
      "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x6982508145454Ce325dDbE47a25d4ec3d2311933/logo.png",
    binanceSymbol: "PEPEUSDT",
  },
];

const formatPrice = (price: number) => {
  if (price === 0) return "$--";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);
};

const formatVolume = (volume: number) => {
  if (volume === 0) return "--";
  if (volume >= 1e9) return `$${(volume / 1e9).toFixed(2)}B`;
  if (volume >= 1e6) return `$${(volume / 1e6).toFixed(2)}M`;
  if (volume >= 1e3) return `$${(volume / 1e3).toFixed(2)}K`;
  return `$${volume.toFixed(2)}`;
};

const formatFundingRate = (rate: number) => {
  return `${(rate * 100).toFixed(4)}%`;
};

const formatTimeUntil = (timestamp: number) => {
  const now = Date.now();
  const diff = timestamp - now;
  if (diff <= 0) return "Now";

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

// Real-time clock component for Jakarta time (GMT+7)
const RealTimeClock: React.FC = () => {
  const [currentTime, setCurrentTime] = useState("");
  const [currentDate, setCurrentDate] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();

      // Convert to Jakarta time (GMT+7)
      const jakartaTime = new Date(
        now.toLocaleString("en-US", { timeZone: "Asia/Jakarta" })
      );

      // Format time (HH:MM:SS)
      const hours = jakartaTime.getHours().toString().padStart(2, "0");
      const minutes = jakartaTime.getMinutes().toString().padStart(2, "0");
      const seconds = jakartaTime.getSeconds().toString().padStart(2, "0");
      const timeString = `${hours}:${minutes}:${seconds}`;

      // Format date (DD MMM YYYY)
      const dateString = jakartaTime.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });

      setCurrentTime(timeString);
      setCurrentDate(dateString);
    };

    // Update immediately
    updateTime();

    // Update every second
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col">
      <span className="text-xs text-slate-400">Jakarta Time (GMT+7)</span>
      <div className="flex flex-col">
        <span className="font-semibold font-mono text-sm text-slate-200">
          {currentTime}
        </span>
        <span className="text-[10px] font-mono text-slate-400">
          {currentDate}
        </span>
      </div>
    </div>
  );
};

interface MarketSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  markets: Market[];
  onSelect: (symbol: string) => void;
  allPrices: Record<string, string>;
  marketDataMap: Record<string, MarketData>;
  futuresDataMap: Record<string, FuturesData>;
  triggerRef?: React.RefObject<HTMLButtonElement | null>;
}

const MarketSelector: React.FC<MarketSelectorProps> = ({
  isOpen,
  onClose,
  markets,
  onSelect,
  allPrices,
  marketDataMap,
  futuresDataMap,
  triggerRef,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<
    "price" | "24hChange" | "24hVolume" | "fundingRate" | "openInterest" | null
  >(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc" | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const handleSort = (
    column: "price" | "24hChange" | "24hVolume" | "fundingRate" | "openInterest"
  ) => {
    if (sortBy === column) {
      // Cycle through: desc -> asc -> null
      if (sortOrder === "desc") {
        setSortOrder("asc");
      } else if (sortOrder === "asc") {
        setSortBy(null);
        setSortOrder(null);
      }
    } else {
      // First click: sort descending (largest first)
      setSortBy(column);
      setSortOrder("desc");
    }
  };

  const filteredMarkets = useMemo(() => {
    if (!markets) return [];
    let filtered = markets.filter((market) =>
      market.symbol.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Apply sorting if active
    if (sortBy && sortOrder) {
      filtered = [...filtered].sort((a, b) => {
        let aValue = 0;
        let bValue = 0;

        switch (sortBy) {
          case "price":
            aValue = parseFloat(allPrices[a.binanceSymbol] || "0");
            bValue = parseFloat(allPrices[b.binanceSymbol] || "0");
            break;
          case "24hChange":
            aValue = parseFloat(
              marketDataMap[a.binanceSymbol]?.priceChangePercent || "0"
            );
            bValue = parseFloat(
              marketDataMap[b.binanceSymbol]?.priceChangePercent || "0"
            );
            break;
          case "24hVolume":
            aValue = parseFloat(
              marketDataMap[a.binanceSymbol]?.volume24h || "0"
            );
            bValue = parseFloat(
              marketDataMap[b.binanceSymbol]?.volume24h || "0"
            );
            break;
          case "fundingRate":
            aValue = parseFloat(
              futuresDataMap[a.binanceSymbol]?.fundingRate || "0"
            );
            bValue = parseFloat(
              futuresDataMap[b.binanceSymbol]?.fundingRate || "0"
            );
            break;
          case "openInterest":
            aValue = parseFloat(
              futuresDataMap[a.binanceSymbol]?.openInterestValue || "0"
            );
            bValue = parseFloat(
              futuresDataMap[b.binanceSymbol]?.openInterestValue || "0"
            );
            break;
        }

        return sortOrder === "desc" ? bValue - aValue : aValue - bValue;
      });
    }

    return filtered;
  }, [
    markets,
    searchTerm,
    sortBy,
    sortOrder,
    allPrices,
    marketDataMap,
    futuresDataMap,
  ]);

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
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose, triggerRef]);

  if (!isOpen) return null;

  return (
    <div
      ref={panelRef}
      className="absolute top-full mt-2 left-0 w-screen max-h-[60vh] max-w-[90vw] lg:max-w-[80vw] bg-[#171B26] border border-slate-700 rounded-lg shadow-xl flex flex-col overflow-hidden"
      style={{ zIndex: 9999 }}
    >
      <div className="p-4 border-b border-slate-800">
        <input
          type="text"
          placeholder="Search Market"
          className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-md text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-300"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          autoFocus
        />
      </div>
      {/* Header Row */}
      <div className="grid lg:grid-cols-6 grid-cols-2 gap-3 px-4 py-2 text-xs font-semibold text-slate-400 bg-slate-800/50 border-b border-slate-700 sticky top-0">
        <div>Market</div>
        <div
          className="lg:text-right text-start cursor-pointer hover:text-slate-200 transition-colors flex items-center jlg:ustify-end gap-1"
          onClick={() => handleSort("price")}
        >
          Price
          {sortBy === "price" ? (
            <span className="text-blue-300">
              {sortOrder === "desc" ? "↓" : "↑"}
            </span>
          ) : (
            <span className="flex flex-col text-[8px] leading-none text-slate-500">
              <span>▲</span>
              <span>▼</span>
            </span>
          )}
        </div>
        <div
          className="text-right cursor-pointer hover:text-slate-200 transition-colors lg:flex items-center justify-end gap-1 hidden"
          onClick={() => handleSort("24hChange")}
        >
          24h Change
          {sortBy === "24hChange" ? (
            <span className="text-blue-300">
              {sortOrder === "desc" ? "↓" : "↑"}
            </span>
          ) : (
            <span className="flex flex-col text-[8px] leading-none text-slate-500">
              <span>▲</span>
              <span>▼</span>
            </span>
          )}
        </div>
        <div
          className="text-right cursor-pointer hover:text-slate-200 transition-colors lg:flex items-center justify-end gap-1 hidden"
          onClick={() => handleSort("24hVolume")}
        >
          24h Volume
          {sortBy === "24hVolume" ? (
            <span className="text-blue-300">
              {sortOrder === "desc" ? "↓" : "↑"}
            </span>
          ) : (
            <span className="flex flex-col text-[8px] leading-none text-slate-500">
              <span>▲</span>
              <span>▼</span>
            </span>
          )}
        </div>
        <div
          className="text-right cursor-pointer hover:text-slate-200 transition-colors lg:flex items-center justify-end gap-1 hidden"
          onClick={() => handleSort("fundingRate")}
        >
          Funding Rate
          {sortBy === "fundingRate" ? (
            <span className="text-blue-300">
              {sortOrder === "desc" ? "↓" : "↑"}
            </span>
          ) : (
            <span className="flex flex-col text-[8px] leading-none text-slate-500">
              <span>▲</span>
              <span>▼</span>
            </span>
          )}
        </div>
        <div
          className="text-right cursor-pointer hover:text-slate-200 transition-colors lg:flex items-center justify-end gap-1 hidden"
          onClick={() => handleSort("openInterest")}
        >
          Open Interest
          {sortBy === "openInterest" ? (
            <span className="text-blue-300">
              {sortOrder === "desc" ? "↓" : "↑"}
            </span>
          ) : (
            <span className="flex flex-col text-[8px] leading-none text-slate-500">
              <span>▲</span>
              <span>▼</span>
            </span>
          )}
        </div>
      </div>
      <div className="flex-grow overflow-y-auto custom-scrollbar-slate">
        {filteredMarkets.length > 0 ? (
          filteredMarkets.map((market) => {
            const price = allPrices[market.binanceSymbol];
            const marketData = marketDataMap[market.binanceSymbol];
            const futuresData = futuresDataMap[market.binanceSymbol];
            const priceChangePercent = marketData?.priceChangePercent
              ? parseFloat(marketData.priceChangePercent)
              : 0;
            const isPositive = priceChangePercent >= 0;
            const fundingRate = futuresData
              ? parseFloat(futuresData.fundingRate)
              : 0;
            const isFundingPositive = fundingRate >= 0;

            return (
              <div
                key={market.symbol}
                onClick={() => {
                  onSelect(market.symbol);
                  onClose();
                }}
                className="grid lg:grid-cols-6 grid-cols-2 items-center gap-3 px-4 py-3 text-sm border-b border-slate-800 hover:bg-slate-800 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={market.logoUrl}
                    alt={market.symbol}
                    className="w-5 h-5 rounded-full bg-slate-700"
                    onError={(e) => {
                      const target = e.currentTarget;
                      target.onerror = null;
                      target.style.visibility = "hidden";
                    }}
                  />
                  <span className="font-bold text-white">
                    {market.symbol}/USD
                  </span>
                </div>
                <div className="lg:text-right text-start font-mono text-slate-200">
                  {price
                    ? `$${parseFloat(price).toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}`
                    : "--"}
                </div>
                <div className="text-right hidden lg:block">
                  {marketData?.priceChangePercent ? (
                    <span
                      className={`font-semibold font-mono ${
                        isPositive ? "text-green-400" : "text-red-400"
                      }`}
                    >
                      {isPositive ? "+" : ""}
                      {priceChangePercent.toFixed(2)}%
                    </span>
                  ) : (
                    <span className="text-slate-500">--</span>
                  )}
                </div>
                <div className="text-right font-mono text-slate-200 hidden lg:block">
                  {marketData?.volume24h
                    ? formatVolume(parseFloat(marketData.volume24h))
                    : "--"}
                </div>
                <div className="text-right hidden lg:block">
                  {futuresData ? (
                    <span
                      className={`font-semibold font-mono ${
                        isFundingPositive ? "text-green-400" : "text-red-400"
                      }`}
                    >
                      {formatFundingRate(fundingRate)}
                    </span>
                  ) : (
                    <span className="text-slate-500">--</span>
                  )}
                </div>
                <div className="text-right font-mono text-slate-200 hidden lg:block">
                  {futuresData?.openInterestValue
                    ? formatVolume(parseFloat(futuresData.openInterestValue))
                    : "--"}
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex justify-center items-center h-32 text-slate-400">
            No markets found.
          </div>
        )}
      </div>
    </div>
  );
};

interface OraclePrice {
  symbol: string;
  price: number;
  confidence?: number;
  timestamp: number;
  source: string;
}

interface ChartHeaderProps {
  activeMarket: Market | null;
  marketData: MarketData | null;
  futuresData: FuturesData | null;
  allPrices: Record<string, string>;
  marketDataMap: Record<string, MarketData>;
  futuresDataMap: Record<string, FuturesData>;
  oraclePrice: OraclePrice | null;
  onSymbolChangeClick: () => void;
  isMarketSelectorOpen: boolean;
  onClose: () => void;
  markets: Market[];
  onSelect: (symbol: string) => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
}

const ChartHeader: React.FC<ChartHeaderProps> = (props) => {
  // Use Oracle price data if available, otherwise fallback to Binance
  const displayPrice =
    props.oraclePrice?.price ||
    (props.marketData?.price ? parseFloat(props.marketData.price) : 0);
  const priceChangePercent = props.marketData?.priceChangePercent
    ? parseFloat(props.marketData.priceChangePercent)
    : 0;
  const isPositive = priceChangePercent >= 0;
  const fundingRate = props.futuresData
    ? parseFloat(props.futuresData.fundingRate)
    : 0;
  const isFundingPositive = fundingRate >= 0;

  return (
    <div
      className="flex flex-wrap items-center justify-between md:px-4 px-2 md:py-2 py-1.5"
      style={{
        gap: "0.75rem",
        flexShrink: 0,
        position: "relative",
        zIndex: 10,
      }}
    >
      <div className="flex items-center md:gap-x-6 md:gap-y-3 gap-3 flex-wrap">
        <div className="relative" style={{ zIndex: 11 }}>
          <button
            ref={props.triggerRef}
            onClick={props.onSymbolChangeClick}
            className="flex items-center gap-2 bg-gradient-to-r from-slate-800 to-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-sm font-bold text-slate-100 hover:from-slate-700 hover:to-slate-600 hover:border-slate-500 transition-all duration-200 shadow-lg hover:shadow-xl cursor-pointer"
          >
            {props.activeMarket && (
              <img
                src={props.activeMarket.logoUrl}
                alt={props.activeMarket.symbol}
                className="w-6 h-6 rounded-full bg-slate-700 ring-2 ring-slate-600"
                onError={(e) => {
                  const target = e.currentTarget;
                  target.onerror = null;
                  target.style.visibility = "hidden";
                }}
              />
            )}
            <span className="text-base">{props.activeMarket?.symbol}/USD</span>
            <svg
              className={`w-4 h-4 transition-transform duration-200 ${
                props.isMarketSelectorOpen ? "rotate-180" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
          <MarketSelector
            isOpen={props.isMarketSelectorOpen}
            onClose={props.onClose}
            markets={props.markets}
            onSelect={props.onSelect}
            allPrices={props.allPrices}
            marketDataMap={props.marketDataMap}
            futuresDataMap={props.futuresDataMap}
            triggerRef={props.triggerRef}
          />
        </div>

        <div className="flex flex-col min-w-[100px] md:min-w-[130px]">
          <span className="font-semibold font-mono md:text-lg text-base text-white">
            {displayPrice ? formatPrice(displayPrice) : "$--"}
          </span>
          <span
            className={`font-semibold font-mono md:text-sm text-xs ${
              isPositive ? "text-green-400" : "text-red-400"
            }`}
          >
            {props.marketData?.priceChangePercent
              ? `${isPositive ? "+" : ""}${parseFloat(
                  props.marketData.priceChangePercent
                ).toFixed(2)}%`
              : "--"}
          </span>
        </div>

        <div className="md:flex flex-col hidden">
          <span className="text-m text-slate-400">24H HIGH</span>
          <div className="flex items-center gap-1">
            <span className="text-green-400 text-xs">▲</span>
            <span className="font-semibold font-mono text-sm text-slate-200">
              {props.marketData?.high24h
                ? formatPrice(parseFloat(props.marketData.high24h))
                : "$--"}
            </span>
          </div>
        </div>

        <div className="md:flex flex-col hidden">
          <span className="text-m text-slate-400">24H LOW</span>
          <div className="flex items-center gap-1">
            <span className="text-red-400 text-xs">▼</span>
            <span className="font-semibold font-mono text-sm text-slate-200">
              {props.marketData?.low24h
                ? formatPrice(parseFloat(props.marketData.low24h))
                : "$--"}
            </span>
          </div>
        </div>

        <div className="md:flex flex-col hidden">
          <span className="text-m text-slate-400">24H VOLUME</span>
          <span className="font-semibold font-mono text-sm text-slate-200">
            {props.marketData?.volume24h
              ? formatVolume(parseFloat(props.marketData.volume24h))
              : "--"}
          </span>
        </div>

        {/* Futures Data */}
        {props.futuresData && (
          <>
            <div className="md:flex flex-col hidden">
              <span className="text-m text-slate-400">FUNDING RATE</span>
              <div className="flex items-center gap-1">
                <span
                  className={`font-semibold font-mono text-sm ${
                    isFundingPositive ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {formatFundingRate(fundingRate)}
                </span>
                <span className="text-xs text-slate-500 font-mono">
                  / {formatTimeUntil(props.futuresData.nextFundingTime)}
                </span>
              </div>
            </div>
            <div className="md:flex flex-col hidden">
              <span className="text-m text-slate-400">OPEN INTEREST</span>
              <span className="font-semibold font-mono text-sm text-slate-200">
                {formatVolume(parseFloat(props.futuresData.openInterestValue))}
              </span>
            </div>
            <div className="md:flex hidden">
              <RealTimeClock />
            </div>
          </>
        )}
      </div>

      {/* Mobile: Info Button - Top Right Corner */}
      <button
        className="md:hidden absolute top-2 right-2 flex items-center justify-center p-2 bg-slate-800/50 rounded-lg hover:bg-slate-700/50 transition-colors"
        onClick={() => {
          // Toggle mobile coin info panel with market data
          const event = new CustomEvent("toggleMobileCoinInfo", {
            detail: {
              marketData: {
                ...props.marketData,
                openInterestValue: props.futuresData?.openInterestValue,
              },
              activeMarket: props.activeMarket,
            },
          });
          window.dispatchEvent(event);
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 text-slate-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </button>
    </div>
  );
};

// Removed old TradingView TVChart component
// Now using TradingVueChart with Binance data

import { useMarket } from "../contexts/MarketContext";
import { useTapToTrade } from "../contexts/TapToTradeContext";

const TradingChart: React.FC = () => {
  const {
    activeMarket: contextActiveMarket,
    setActiveMarket,
    setCurrentPrice,
    timeframe,
  } = useMarket();
  const [markets] = useState<Market[]>(ALL_MARKETS);
  const [activeSymbol, setActiveSymbol] = useState<string>(
    contextActiveMarket?.symbol || ALL_MARKETS[0].symbol
  );
  const [isMarketSelectorOpen, setIsMarketSelectorOpen] = useState(false);
  const [allPrices, setAllPrices] = useState<Record<string, string>>({});
  const [marketDataMap, setMarketDataMap] = useState<
    Record<string, MarketData>
  >({});
  const [futuresDataMap, setFuturesDataMap] = useState<
    Record<string, FuturesData>
  >({});
  const [oraclePrices, setOraclePrices] = useState<Record<string, OraclePrice>>(
    {}
  );
  const triggerButtonRef = useRef<HTMLButtonElement>(null);

  // Tap to Trade from context
  const tapToTrade = useTapToTrade();

  // Sync activeSymbol with context activeMarket (when changed from MarketOrder)
  useEffect(() => {
    if (contextActiveMarket && contextActiveMarket.symbol !== activeSymbol) {
      setActiveSymbol(contextActiveMarket.symbol);
    }
  }, [contextActiveMarket, activeSymbol]);

  // Fetch Futures Data (Funding Rate, Open Interest)
  useEffect(() => {
    const fetchFuturesData = async () => {
      try {
        const symbols = markets.map((m) => m.binanceSymbol);

        const results = await Promise.all(
          symbols.map(async (symbol) => {
            try {
              // Fetch funding rate
              const fundingResponse = await fetch(
                `https://fapi.binance.com/fapi/v1/premiumIndex?symbol=${symbol}`
              );
              const fundingData = await fundingResponse.json();

              // Fetch open interest
              const oiResponse = await fetch(
                `https://fapi.binance.com/fapi/v1/openInterest?symbol=${symbol}`
              );
              const oiData = await oiResponse.json();

              // Get current price for OI value calculation
              const priceResponse = await fetch(
                `https://fapi.binance.com/fapi/v1/ticker/price?symbol=${symbol}`
              );
              const priceData = await priceResponse.json();

              const openInterestValue = (
                parseFloat(oiData.openInterest || "0") *
                parseFloat(priceData.price || "0")
              ).toString();

              return {
                symbol,
                data: {
                  fundingRate: fundingData.lastFundingRate || "0",
                  nextFundingTime: fundingData.nextFundingTime || 0,
                  openInterest: oiData.openInterest || "0",
                  openInterestValue,
                },
              };
            } catch (error) {
              console.error(
                `Error fetching futures data for ${symbol}:`,
                error
              );
              return null;
            }
          })
        );

        const newFuturesData: Record<string, FuturesData> = {};
        results.forEach((result) => {
          if (result) {
            newFuturesData[result.symbol] = result.data;
          }
        });

        setFuturesDataMap(newFuturesData);
      } catch (error) {
        console.error("Error fetching futures data:", error);
      }
    };

    fetchFuturesData();
    const interval = setInterval(fetchFuturesData, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, [markets]);

  // WebSocket for real-time spot prices (Binance) with ping mechanism
  useEffect(() => {
    const ws = new WebSocket("wss://stream.binance.com:9443/ws/!ticker@arr");
    let pingInterval: NodeJS.Timeout | null = null;

    ws.onopen = () => {
      console.log("✅ Binance WebSocket connected");

      // Start ping interval to keep connection alive (every 3 minutes)
      pingInterval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ method: "ping" }));
          console.log("🏓 Ping sent to Binance ticker WebSocket");
        }
      }, 180000); // 3 minutes (180000ms)
    };

    ws.onmessage = (event) => {
      const tickers = JSON.parse(event.data);
      const newPrices: Record<string, string> = {};
      const newMarketData: Record<string, MarketData> = {};

      for (const ticker of tickers) {
        newPrices[ticker.s] = parseFloat(ticker.c).toString();
        newMarketData[ticker.s] = {
          price: parseFloat(ticker.c).toString(),
          priceChange: parseFloat(ticker.p).toString(),
          priceChangePercent: parseFloat(ticker.P).toString(),
          high24h: parseFloat(ticker.h).toString(),
          low24h: parseFloat(ticker.l).toString(),
          volume24h: parseFloat(ticker.q).toString(),
        };
      }

      setAllPrices(newPrices);
      setMarketDataMap(newMarketData);
    };

    ws.onerror = (error) => console.error("❌ Binance WebSocket error:", error);

    ws.onclose = () => {
      console.log("🔌 Binance WebSocket closed");

      // Clear ping interval when connection closes
      if (pingInterval) {
        clearInterval(pingInterval);
        pingInterval = null;
      }
    };

    return () => {
      // Clear ping interval on cleanup
      if (pingInterval) {
        clearInterval(pingInterval);
      }

      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, []);

  // WebSocket for Pyth Oracle prices
  useEffect(() => {
    let ws: WebSocket | null = null;

    const connectWebSocket = () => {
      try {
        const wsUrl = (process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001').replace(/^http/, 'ws') + '/ws/price';
        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          console.log("✅ Pyth Oracle WebSocket connected");
        };

        ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);

            if (message.type === "price_update" && message.data) {
              const newOraclePrices: Record<string, OraclePrice> = {};

              Object.keys(message.data).forEach((symbol) => {
                const priceData = message.data[symbol];
                newOraclePrices[symbol] = {
                  symbol: priceData.symbol,
                  price: priceData.price,
                  confidence: priceData.confidence,
                  timestamp: priceData.timestamp,
                  source: priceData.source,
                };
              });

              setOraclePrices(newOraclePrices);
            }
          } catch (error) {
            console.error("Error parsing Oracle message:", error);
          }
        };

        ws.onerror = () => {
          // Silently handle error - backend might not be running
          console.warn("⚠️ Oracle WebSocket not available (backend offline?)");
        };

        ws.onclose = () => {
          console.log("🔌 Oracle WebSocket closed");
          // Don't auto-reconnect to avoid spam
        };
      } catch (error) {
        console.warn("⚠️ Could not connect to Oracle WebSocket:", error);
      }
    };

    connectWebSocket();

    return () => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, []);

  const activeMarket = useMemo(
    () => markets.find((m) => m.symbol === activeSymbol) || markets[0],
    [markets, activeSymbol]
  );

  const currentMarketData = activeMarket
    ? marketDataMap[activeMarket.binanceSymbol]
    : null;
  const currentFuturesData = activeMarket
    ? futuresDataMap[activeMarket.binanceSymbol]
    : null;
  const currentOraclePrice = activeMarket
    ? oraclePrices[activeMarket.symbol]
    : null;

  // Update context when market changes
  useEffect(() => {
    if (activeMarket) {
      setActiveMarket(activeMarket);
    }
  }, [activeMarket, setActiveMarket]);

  // Update context when price changes - prioritize Oracle price
  useEffect(() => {
    // Use Oracle price if available, fallback to Binance price
    if (currentOraclePrice?.price) {
      setCurrentPrice(currentOraclePrice.price.toString());
    } else if (currentMarketData?.price) {
      setCurrentPrice(currentMarketData.price);
    }
  }, [currentOraclePrice?.price, currentMarketData?.price, setCurrentPrice]);

  const handleMarketSelect = (symbol: string) => {
    const selectedMarket = markets.find((m) => m.symbol === symbol);
    if (selectedMarket) {
      setActiveSymbol(symbol);
      setActiveMarket(selectedMarket); // Update context untuk sinkronisasi dengan komponen lain
    }
    setIsMarketSelectorOpen(false);
  };

  // Handle tap to trade cell click
  const handleTapCellClick = (
    cellId: string,
    price: number,
    time: number,
    isBuy: boolean
  ) => {
    // Extract cellX and cellY from cellId (format: "cellX,cellY")
    // Example: "5,10" means cellX=5, cellY=10
    const parts = cellId.split(",");
    if (parts.length === 2) {
      const cellX = parseInt(parts[0]);
      const cellY = parseInt(parts[1]);

      console.log(
        `🎯 TradingChart: Calling handleCellClick with cellX=${cellX}, cellY=${cellY}`
      );

      // Directly pass to tapToTrade context
      tapToTrade.handleCellClick(cellX, cellY);
    } else {
      console.error("❌ Invalid cellId format:", cellId);
    }
  };

  return (
    <div
      className="w-full h-full flex flex-col bg-black text-slate-100"
      style={{ borderRadius: "0.5rem" }}
    >
      {/* Header with flexible height - can be 1 or 2 rows */}
      <div
        style={{
          flexShrink: 0,
          flexGrow: 0,
          borderTopLeftRadius: "0.5rem",
          borderTopRightRadius: "0.5rem",
          position: "relative",
          zIndex: 10,
        }}
      >
        <ChartHeader
          activeMarket={activeMarket}
          marketData={currentMarketData}
          futuresData={currentFuturesData}
          allPrices={allPrices}
          marketDataMap={marketDataMap}
          futuresDataMap={futuresDataMap}
          oraclePrice={currentOraclePrice}
          onSymbolChangeClick={() =>
            setIsMarketSelectorOpen(!isMarketSelectorOpen)
          }
          isMarketSelectorOpen={isMarketSelectorOpen}
          onClose={() => setIsMarketSelectorOpen(false)}
          markets={markets}
          onSelect={handleMarketSelect}
          triggerRef={triggerButtonRef}
        />
      </div>

      {/* Chart container - takes remaining space */}
      <div
        className="trading-chart-container w-full"
        style={{
          flex: "1 1 auto",
          minHeight: 0,
          position: "relative",
          zIndex: 1,
        }}
      >
        {activeMarket && (
          <>
            {tapToTrade.isEnabled ? (
              tapToTrade.tradeMode === "one-tap-profit" ? (
                <PerSecondChart
                  key={`${activeMarket.binanceSymbol}-per-s`}
                  symbol={activeMarket.symbol}
                  currentPrice={parseFloat(
                    currentOraclePrice?.price?.toString() ||
                      currentMarketData?.price ||
                      "0"
                  )}
                  betAmount={tapToTrade.betAmount}
                  isBinaryTradingEnabled={tapToTrade.isBinaryTradingEnabled}
                />
              ) : (
                <SimpleLineChart
                  key={`${activeMarket.binanceSymbol}-tap`}
                  symbol={activeMarket.binanceSymbol}
                  interval={timeframe}
                  currentPrice={parseFloat(
                    currentOraclePrice?.price?.toString() ||
                      currentMarketData?.price ||
                      "0"
                  )}
                  tapToTradeEnabled={true}
                  gridSize={tapToTrade.gridSizeY}
                  onCellTap={handleTapCellClick}
                />
              )
            ) : (
              <TradingViewWidget
                key={`${activeMarket.binanceSymbol}`}
                symbol={activeMarket.binanceSymbol}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default TradingChart;

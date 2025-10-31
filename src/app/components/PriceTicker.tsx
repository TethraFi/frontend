"use client";

import React, { useEffect, useState } from "react";
import { useMarket } from "../contexts/MarketContext";

interface Market {
  symbol: string;
  binanceSymbol: string;
  logoUrl: string;
}

interface TickerData {
  symbol: string;
  binanceSymbol: string;
  price: number;
  change: number;
  logoUrl: string;
}

const ALL_MARKETS: Market[] = [
  {
    symbol: "BTC",
    binanceSymbol: "BTCUSDT",
    logoUrl:
      "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/bitcoin/info/logo.png",
  },
  {
    symbol: "ETH",
    binanceSymbol: "ETHUSDT",
    logoUrl:
      "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png",
  },
  {
    symbol: "SOL",
    binanceSymbol: "SOLUSDT",
    logoUrl:
      "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/info/logo.png",
  },
  {
    symbol: "AVAX",
    binanceSymbol: "AVAXUSDT",
    logoUrl:
      "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/avalanchex/info/logo.png",
  },
  {
    symbol: "NEAR",
    binanceSymbol: "NEARUSDT",
    logoUrl:
      "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/near/info/logo.png",
  },
  {
    symbol: "BNB",
    binanceSymbol: "BNBUSDT",
    logoUrl:
      "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/binance/info/logo.png",
  },
  {
    symbol: "XRP",
    binanceSymbol: "XRPUSDT",
    logoUrl:
      "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ripple/info/logo.png",
  },
  {
    symbol: "AAVE",
    binanceSymbol: "AAVEUSDT",
    logoUrl:
      "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9/logo.png",
  },
  {
    symbol: "ARB",
    binanceSymbol: "ARBUSDT",
    logoUrl:
      "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/arbitrum/info/logo.png",
  },
  {
    symbol: "CRV",
    binanceSymbol: "CRVUSDT",
    logoUrl:
      "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xD533a949740bb3306d119CC777fa900bA034cd52/logo.png",
  },
  {
    symbol: "DOGE",
    binanceSymbol: "DOGEUSDT",
    logoUrl:
      "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/doge/info/logo.png",
  },
  {
    symbol: "LINK",
    binanceSymbol: "LINKUSDT",
    logoUrl:
      "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x514910771AF9Ca656af840dff83E8264EcF986CA/logo.png",
  },
  {
    symbol: "MATIC",
    binanceSymbol: "MATICUSDT",
    logoUrl:
      "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/polygon/info/logo.png",
  },
  {
    symbol: "PEPE",
    binanceSymbol: "PEPEUSDT",
    logoUrl:
      "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x6982508145454Ce325dDbE47a25d4ec3d2311933/logo.png",
  },
];

const PriceTicker: React.FC = () => {
  const { setActiveMarket } = useMarket();
  const [tickerData, setTickerData] = useState<TickerData[]>([]);

  useEffect(() => {
    const symbols = ALL_MARKETS.map((m) => m.binanceSymbol).join(",");
    let ws: WebSocket | null = null;

    const connectWebSocket = () => {
      try {
        const streams = ALL_MARKETS.map(
          (m) => `${m.binanceSymbol.toLowerCase()}@ticker`
        ).join("/");

        ws = new WebSocket(`wss://stream.binance.com:9443/stream?streams=${streams}`);

        ws.onmessage = (event) => {
          const message = JSON.parse(event.data);
          if (message.data) {
            const data = message.data;
            const symbol = data.s;
            const market = ALL_MARKETS.find((m) => m.binanceSymbol === symbol);

            if (market) {
              setTickerData((prev) => {
                const existing = prev.find((t) => t.binanceSymbol === symbol);
                const newData = {
                  symbol: market.symbol,
                  binanceSymbol: symbol,
                  price: parseFloat(data.c),
                  change: parseFloat(data.P),
                  logoUrl: market.logoUrl,
                };

                if (existing) {
                  return prev.map((t) =>
                    t.binanceSymbol === symbol ? newData : t
                  );
                } else {
                  return [...prev, newData];
                }
              });
            }
          }
        };

        ws.onerror = (error) => {
          console.error("WebSocket error:", error);
        };

        ws.onclose = () => {
          console.log("WebSocket closed, reconnecting...");
          setTimeout(connectWebSocket, 3000);
        };
      } catch (error) {
        console.error("Failed to connect WebSocket:", error);
        setTimeout(connectWebSocket, 3000);
      }
    };

    connectWebSocket();

    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, []);

  const handleMarketClick = (market: TickerData) => {
    const fullMarket = ALL_MARKETS.find((m) => m.symbol === market.symbol);
    if (fullMarket) {
      setActiveMarket({
        symbol: fullMarket.symbol,
        tradingViewSymbol: `BINANCE:${fullMarket.binanceSymbol}`,
        logoUrl: fullMarket.logoUrl,
        binanceSymbol: fullMarket.binanceSymbol,
      });
    }
  };

  // Duplicate data for seamless loop
  const duplicatedData = [...tickerData, ...tickerData];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-[#0a0a0a] border-t border-slate-800 overflow-hidden z-50 h-10 hidden lg:block">
      <div className="flex animate-scroll-left">
        {duplicatedData.map((item, index) => (
          <div
            key={`${item.binanceSymbol}-${index}`}
            onClick={() => handleMarketClick(item)}
            className="flex items-center gap-2 px-4 py-2 whitespace-nowrap cursor-pointer hover:bg-slate-800/50 transition-colors min-w-fit"
          >
            <img
              src={item.logoUrl}
              alt={item.symbol}
              className="w-5 h-5 rounded-full"
              onError={(e) => {
                const target = e.currentTarget;
                target.style.display = "none";
              }}
            />
            <span className="text-white font-medium text-sm">
              {item.symbol}USDT
            </span>
            <span className="text-slate-300 font-mono text-sm">
              ${item.price.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: item.price < 1 ? 6 : 2,
              })}
            </span>
            <span
              className={`font-mono text-sm ${
                item.change >= 0 ? "text-green-400" : "text-red-400"
              }`}
            >
              {item.change >= 0 ? "+" : ""}
              {item.change.toFixed(2)}%
            </span>
          </div>
        ))}
      </div>

      <style jsx>{`
        @keyframes scroll-left {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        .animate-scroll-left {
          animation: scroll-left 60s linear infinite;
        }

        .animate-scroll-left:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
};

export default PriceTicker;

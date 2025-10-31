"use client";

import { useState, useEffect } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import DashboardTrade from "../components/DashboardTrade";
import MobileHeader from "../components/MobileHeader";
import TradingChart from "../components/TradingChart";
import OrderPanel from "../components/OrderPanel";
import BottomTrading from "../components/BottomTrading";
import WalletConnectButton from "../components/WalletConnectButton";
import { MarketProvider, useMarket } from "../contexts/MarketContext";
import { GridTradingProvider } from "../contexts/GridTradingContext";
import {
  TapToTradeProvider,
  useTapToTrade,
} from "../contexts/TapToTradeContext";
import { useDynamicTitle } from "@/hooks/useDynamicTitle";
import PriceTicker from "../components/PriceTicker";

function TradePageContent() {
  const { isEnabled, toggleMode } = useTapToTrade();
  const { activeMarket, currentPrice } = useMarket();
  const [isBottomPanelOpen, setIsBottomPanelOpen] = useState(false);
  const [isMobileOrderPanelOpen, setIsMobileOrderPanelOpen] = useState(false);
  const [isMobileCoinInfoOpen, setIsMobileCoinInfoOpen] = useState(false);
  const [mobileActiveTab, setMobileActiveTab] = useState<
    "long" | "short" | "swap"
  >("long");
  const [marketDataState, setMarketDataState] = useState<any>(null);
  const [activeMarketState, setActiveMarketState] = useState<any>(null);
  const [showTapToTradeIntro, setShowTapToTradeIntro] = useState(false);
  const [carouselIndex, setCarouselIndex] = useState(0);

  // Check if we're in Tap to Trade mode (any mode) and enabled
  const isTapToTradeActive = isEnabled;

  // Dynamic title with price and pair
  const priceValue = currentPrice ? parseFloat(currentPrice) : null;
  const pairName = activeMarket?.symbol || "BTC/USDT";
  useDynamicTitle(priceValue, pairName);

  // Show Tap to Trade intro modal on page load (unless user opted out)
  useEffect(() => {
    const dontShowAgain = localStorage.getItem('dontShowTapToTradeIntro');
    if (!dontShowAgain) {
      setShowTapToTradeIntro(true);
    }
  }, []);

  // Listen for mobile coin info toggle event
  useEffect(() => {
    const handleToggleCoinInfo = (event: any) => {
      setIsMobileCoinInfoOpen((prev) => !prev);
      if (event.detail?.marketData) {
        setMarketDataState(event.detail.marketData);
      }
      if (event.detail?.activeMarket) {
        setActiveMarketState(event.detail.activeMarket);
      }
    };

    window.addEventListener(
      "toggleMobileCoinInfo",
      handleToggleCoinInfo as EventListener
    );
    return () =>
      window.removeEventListener(
        "toggleMobileCoinInfo",
        handleToggleCoinInfo as EventListener
      );
  }, []);

  return (
    <main className="bg-black text-white h-screen flex flex-col relative lg:p-2 p-2 lg:overflow-hidden overflow-auto">
      {/* Mobile Header */}
      <MobileHeader rightContent={<WalletConnectButton />} />

      <div
        className="flex flex-col lg:flex-row w-full flex-1 lg:gap-2 gap-2 lg:overflow-hidden"
        style={{ minHeight: 0 }}
      >
        {/* Left Sidebar - Responsive (hidden on mobile, overlay on mobile when open) */}
        <DashboardTrade />

        {/* Center - Chart and Bottom Trading */}
        <div
          className="lg:flex-1 flex flex-col min-w-0 relative lg:gap-2"
          style={{ minHeight: 0, gap: isTapToTradeActive ? 0 : "0.5rem" }}
        >
          {/* Trading Chart */}
          <div
            className="transition-all duration-300 relative flex-1"
            style={{
              minHeight: isTapToTradeActive ? "80vh" : "400px",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <TradingChart />

            {/* Mobile Market Details Dropdown - Below Chart Header */}
            {isMobileCoinInfoOpen && (
              <div
                className="lg:hidden absolute left-0 right-0 bg-[#16191E] border-b border-slate-700 shadow-lg z-20 animate-slide-down"
                style={{ top: "60px" }}
              >
                {/* Market Info Content */}
                <div className="p-3 relative">
                  {/* Coin Logo - Top Right */}
                  {(activeMarketState || activeMarket) && (
                    <img
                      src={(activeMarketState || activeMarket).logoUrl}
                      alt={(activeMarketState || activeMarket).symbol}
                      className="absolute top-2 right-2 w-10 h-10 rounded-full bg-slate-700 ring-2 ring-slate-600"
                      onError={(e) => {
                        const target = e.currentTarget;
                        target.onerror = null;
                        target.style.visibility = "hidden";
                      }}
                    />
                  )}

                  {/* Price Info Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-xs text-slate-400 mb-1">
                        Current Price
                      </div>
                      <div className="text-sm font-mono font-semibold text-white">
                        {currentPrice
                          ? `$${parseFloat(currentPrice).toLocaleString(
                              "en-US",
                              {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              }
                            )}`
                          : "$--"}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-400 mb-1">
                        24h Change
                      </div>
                      <div
                        className={`text-sm font-mono font-semibold ${
                          marketDataState?.priceChangePercent
                            ? parseFloat(marketDataState.priceChangePercent) >=
                              0
                              ? "text-green-400"
                              : "text-red-400"
                            : "text-gray-400"
                        }`}
                      >
                        {marketDataState?.priceChangePercent
                          ? `${
                              parseFloat(marketDataState.priceChangePercent) >=
                              0
                                ? "+"
                                : ""
                            }${parseFloat(
                              marketDataState.priceChangePercent
                            ).toFixed(2)}%`
                          : "+0.00%"}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-400 mb-1">
                        24h High
                      </div>
                      <div className="text-xs font-mono text-slate-200">
                        {marketDataState?.high24h
                          ? `$${parseFloat(
                              marketDataState.high24h
                            ).toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}`
                          : "$--"}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-400 mb-1">24h Low</div>
                      <div className="text-xs font-mono text-slate-200">
                        {marketDataState?.low24h
                          ? `$${parseFloat(
                              marketDataState.low24h
                            ).toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}`
                          : "$--"}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-400 mb-1">
                        24h Volume
                      </div>
                      <div className="text-xs font-mono text-slate-200">
                        {marketDataState?.volume24h
                          ? (() => {
                              const vol = parseFloat(marketDataState.volume24h);
                              if (vol >= 1e9)
                                return `$${(vol / 1e9).toFixed(2)}B`;
                              if (vol >= 1e6)
                                return `$${(vol / 1e6).toFixed(2)}M`;
                              if (vol >= 1e3)
                                return `$${(vol / 1e3).toFixed(2)}K`;
                              return `$${vol.toFixed(2)}`;
                            })()
                          : "--"}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-400 mb-1">
                        Open Interest
                      </div>
                      <div className="text-xs font-mono text-slate-200">
                        {marketDataState?.openInterestValue
                          ? (() => {
                              const oi = parseFloat(
                                marketDataState.openInterestValue
                              );
                              if (oi >= 1e9)
                                return `$${(oi / 1e9).toFixed(2)}B`;
                              if (oi >= 1e6)
                                return `$${(oi / 1e6).toFixed(2)}M`;
                              if (oi >= 1e3)
                                return `$${(oi / 1e3).toFixed(2)}K`;
                              return `$${oi.toFixed(2)}`;
                            })()
                          : "--"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Panel - Different behavior for Tap to Trade modes */}
          {isTapToTradeActive ? (
            /* Tap to Trade Active - Toggle button with overlay */
            <>
              {/* Bottom Panel - Overlays the chart when open */}
              {isBottomPanelOpen && (
                <div
                  className="absolute bottom-0 left-0 right-0 z-10 transition-all duration-300 flex flex-col mb-0 lg:mb-0"
                  style={{
                    height: "40vh",
                    minHeight: "200px",
                    maxHeight: "50vh",
                  }}
                >
                  {/* Toggle Button at the top of the panel */}
                  <div className="flex justify-center">
                    <button
                      onClick={() => setIsBottomPanelOpen(!isBottomPanelOpen)}
                      className="bg-[#0B1017] border border-gray-700/50 rounded-t-lg px-4 py-2 flex items-center gap-2 hover:bg-gray-800/50 transition-colors"
                    >
                      <ChevronDown size={16} className="text-gray-400" />
                      <span className="text-xs text-gray-400 font-medium cursor-pointer">
                        Close Positions
                      </span>
                      <ChevronDown size={16} className="text-gray-400" />
                    </button>
                  </div>

                  {/* Bottom Panel Content */}
                  <div className="flex-1 overflow-hidden">
                    <BottomTrading />
                  </div>
                </div>
              )}

              {/* Desktop "Open Positions" Button - When panel is closed */}
              {!isBottomPanelOpen && (
                <button
                  onClick={() => setIsBottomPanelOpen(true)}
                  className="hidden lg:flex absolute bottom-10 left-1/2 -translate-x-1/2 z-50 bg-[#0B1017] border border-gray-700/50 rounded-t-lg px-4 py-2 items-center gap-2 hover:bg-gray-800/50 transition-colors cursor-pointer"
                >
                  <ChevronUp size={16} className="text-gray-400" />
                  <span className="text-xs text-gray-400 font-medium">
                    Open Positions
                  </span>
                  <ChevronUp size={16} className="text-gray-400" />
                </button>
              )}
            </>
          ) : (
            /* Normal mode - Regular layout with BottomTrading */
            <div
              className="lg:flex-1 transition-all duration-300 mb-20 lg:mb-0"
              style={{
                minHeight: "400px",
                maxHeight: "40vh",
              }}
            >
              <BottomTrading />
            </div>
          )}
        </div>

        {/* Right Order Panel - Hidden on mobile, shows as bottom sheet */}
        <div
          className="hidden lg:flex shrink-0 flex-col"
          style={{
            width: "30vw",
            minWidth: "300px",
            maxWidth: "520px",
          }}
        >
          <OrderPanel />
        </div>

        {/* Tap to Trade "Open Positions" Button - Mobile Only, Independent */}
        {isTapToTradeActive && !isBottomPanelOpen && (
          <button
            onClick={() => setIsBottomPanelOpen(!isBottomPanelOpen)}
            className="lg:hidden fixed bottom-[56px] left-1/2 -translate-x-1/2 z-50 bg-[#0B1017] border border-gray-700/50 rounded-t-lg px-4 py-2 flex items-center gap-2 hover:bg-gray-800/50 transition-colors"
          >
            <ChevronUp size={16} className="text-gray-400" />
            <span className="text-xs text-gray-400 font-medium">
              Open Positions
            </span>
            <ChevronUp size={16} className="text-gray-400" />
          </button>
        )}

        {/* Mobile Order Panel - Bottom Sheet */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50">
          {/* Long/Short/Swap Tabs OR Stop Tap to Trade Button */}
          {!isMobileOrderPanelOpen && (
            <>
              {isTapToTradeActive ? (
                /* Stop Tap to Trade Button */
                <button
                  onClick={() => toggleMode()}
                  className="w-full py-3.5 font-semibold text-sm bg-red-600 text-white hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <rect x="6" y="6" width="12" height="12" />
                  </svg>
                  Stop Tap to Trade
                </button>
              ) : (
                /* Normal Mode: Long/Short/Swap Tabs */
                <div className="flex items-center bg-[#16191E]">
                  <button
                    onClick={() => {
                      setMobileActiveTab("long");
                      setIsMobileOrderPanelOpen(true);
                    }}
                    className={`flex-1 py-3.5 font-semibold text-sm transition-colors flex items-center justify-center gap-2 ${
                      mobileActiveTab === "long"
                        ? "bg-green-800 text-white hover:bg-[#105D47]"
                        : "bg-[#1E2329] text-gray-300 hover:bg-[#2B3139]"
                    }`}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                      <polyline points="17 6 23 6 23 12"></polyline>
                    </svg>
                    Long
                  </button>
                  <button
                    onClick={() => {
                      setMobileActiveTab("short");
                      setIsMobileOrderPanelOpen(true);
                    }}
                    className={`flex-1 py-3.5 font-semibold text-sm transition-colors flex items-center justify-center gap-2 ${
                      mobileActiveTab === "short"
                        ? "bg-red-600 text-white hover:bg-[#105D47]"
                        : "bg-[#1E2329] text-gray-300 hover:bg-[#2B3139]"
                    }`}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline>
                      <polyline points="17 18 23 18 23 12"></polyline>
                    </svg>
                    Short
                  </button>
                  <button
                    onClick={() => {
                      setMobileActiveTab("swap");
                      setIsMobileOrderPanelOpen(true);
                    }}
                    className={`flex-1 py-3.5 font-semibold text-sm transition-colors flex items-center justify-center gap-2 ${
                      mobileActiveTab === "swap"
                        ? "bg-blue-800 text-white hover:bg-[#105D47]"
                        : "bg-[#1E2329] text-gray-300 hover:bg-[#2B3139]"
                    }`}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path>
                    </svg>
                    Swap
                  </button>
                </div>
              )}
            </>
          )}

          {/* Bottom Sheet Panel */}
          {isMobileOrderPanelOpen && (
            <>
              {/* Backdrop - Click to close */}
              <div
                className="fixed inset-0 bg-black/40 -z-10"
                onClick={() => setIsMobileOrderPanelOpen(false)}
              />

              {/* Panel */}
              <div
                className="bg-[#0B1017] shadow-2xl animate-slide-up rounded-t-lg"
                style={{ maxHeight: "85vh", overflowY: "auto" }}
              >
                {/* Order Panel Content */}
                <OrderPanel mobileActiveTab={mobileActiveTab} />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Price Ticker at bottom */}
      <PriceTicker />

      {/* Tap to Trade Intro Modal */}
      {showTapToTradeIntro && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => {
              setShowTapToTradeIntro(false);
            }}
          />

          {/* Modal Content */}
          <div className="relative w-full max-w-3xl bg-gradient-to-br from-[#0B1621] to-[#0F1825] rounded-2xl shadow-2xl border border-blue-500/30 overflow-hidden animate-in fade-in zoom-in-95 duration-300">
            {/* Header */}
            <div className="relative px-6 py-4 border-b border-blue-500/20 bg-gradient-to-r from-blue-600/10 to-blue-400/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 flex items-center justify-center">
                    <img
                      src="/images/logo.png"
                      alt="Tethra"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">
                      Introducing Tap to Trade
                    </h2>
                    <p className="text-xs text-blue-300 mt-0.5">
                      Trade faster and smarter with our new feature
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowTapToTradeIntro(false);
                  }}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* Body - Carousel */}
            <div className="p-6">
              <div className="relative">
                {/* Carousel Container */}
                <div className="overflow-hidden">
                  <div
                    className="flex transition-transform duration-500 ease-in-out"
                    style={{ transform: `translateX(-${carouselIndex * 100}%)` }}
                  >
                    {/* Slide 1 - Open Position Feature */}
                    <div className="w-full flex-shrink-0 px-4">
                      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 shadow-lg shadow-blue-500/20">
                        <div className="p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                              <svg
                                className="w-5 h-5 text-blue-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"
                                />
                              </svg>
                            </div>
                            <div>
                              <h3 className="text-lg font-bold text-white">
                                Tap to Open Position
                              </h3>
                              <p className="text-xs text-blue-300">Feature 1 of 2</p>
                            </div>
                          </div>
                          <p className="text-sm text-gray-300 mb-4">
                            Click anywhere on the chart to instantly open a position at your desired price level.
                          </p>
                          <div className="relative rounded-lg overflow-hidden border border-blue-500/30 shadow-xl max-h-64">
                            <img
                              src="/images/TapPosition.png"
                              alt="Tap to Open Position"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Slide 2 - Take Profit Feature */}
                    <div className="w-full flex-shrink-0 px-4">
                      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20 shadow-lg shadow-green-500/20">
                        <div className="p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                              <svg
                                className="w-5 h-5 text-green-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                            </div>
                            <div>
                              <h3 className="text-lg font-bold text-white">
                                One Tap Profit
                              </h3>
                              <p className="text-xs text-green-300">Feature 2 of 2</p>
                            </div>
                          </div>
                          <p className="text-sm text-gray-300 mb-4">
                            Set your take profit with a single tap on the chart. Lock in your gains effortlessly.
                          </p>
                          <div className="relative rounded-lg overflow-hidden border border-green-500/30 shadow-xl max-h-64">
                            <img
                              src="/images/TapProfit.png"
                              alt="One Tap Profit"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Navigation Arrows */}
                <button
                  onClick={() => setCarouselIndex(Math.max(0, carouselIndex - 1))}
                  disabled={carouselIndex === 0}
                  className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 w-12 h-12 rounded-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white shadow-lg transition-all duration-200 flex items-center justify-center cursor-pointer"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>
                <button
                  onClick={() => setCarouselIndex(Math.min(1, carouselIndex + 1))}
                  disabled={carouselIndex === 1}
                  className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 w-12 h-12 rounded-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white shadow-lg transition-all duration-200 flex items-center justify-center cursor-pointer"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>

                {/* Dots Indicator */}
                <div className="flex justify-center gap-2 mt-4">
                  <button
                    onClick={() => setCarouselIndex(0)}
                    className={`w-2 h-2 rounded-full transition-all duration-300 cursor-pointer ${
                      carouselIndex === 0
                        ? "bg-blue-500 w-6"
                        : "bg-gray-600 hover:bg-gray-500"
                    }`}
                  />
                  <button
                    onClick={() => setCarouselIndex(1)}
                    className={`w-2 h-2 rounded-full transition-all duration-300 cursor-pointer ${
                      carouselIndex === 1
                        ? "bg-green-500 w-6"
                        : "bg-gray-600 hover:bg-gray-500"
                    }`}
                  />
                </div>
              </div>

              {/* Info Box */}
              <div className="mt-4 bg-blue-500/10 border border-blue-500/30 rounded-xl p-3">
                <div className="flex items-start gap-2">
                  <svg
                    className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5"
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
                  <p className="text-xs text-blue-200">
                    <span className="font-semibold">Pro Tip:</span> Enable Tap to Trade mode from the Order Panel to start using these features.
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-3 bg-gradient-to-r from-blue-600/5 to-blue-400/5 border-t border-blue-500/20">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer"
                    onChange={(e) => {
                      if (e.target.checked) {
                        localStorage.setItem('dontShowTapToTradeIntro', 'true');
                      } else {
                        localStorage.removeItem('dontShowTapToTradeIntro');
                      }
                    }}
                  />
                  <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
                    Don't show this again
                  </span>
                </label>
                <button
                  onClick={() => {
                    setShowTapToTradeIntro(false);
                  }}
                  className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 cursor-pointer"
                >
                  Got it!
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default function TradePage() {
  return (
    <MarketProvider>
      <GridTradingProvider>
        <TapToTradeProvider>
          <TradePageContent />
        </TapToTradeProvider>
      </GridTradingProvider>
    </MarketProvider>
  );
}

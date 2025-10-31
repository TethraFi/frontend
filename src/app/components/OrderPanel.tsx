"use client";

import React, { useState, useEffect } from "react";
import {
  ChevronDown,
  Info,
  Settings,
  TrendingUp,
  TrendingDown,
  Zap,
} from "lucide-react";
import MarketOrder from './order-panel/MarketOrder';
import LimitOrder from './order-panel/LimitOrder';
import TapToTrade from './order-panel/TaptoTrade';
import SwapPanel from './order-panel/SwapPanel';
import { useTapToTrade } from "../contexts/TapToTradeContext";
import WalletConnectButton from "./WalletConnectButton";

interface OrderPanelProps {
  mobileActiveTab?: "long" | "short" | "swap";
}

const OrderPanel: React.FC<OrderPanelProps> = ({ mobileActiveTab }) => {
  const [activeTab, setActiveTab] = useState<"long" | "short" | "swap">(
    mobileActiveTab || "short"
  );
  const [activeOrderType, setActiveOrderType] = useState<
    "market" | "limit" | "Tap to Trade" | "more"
  >("market");

  // Sync with mobile tab if provided
  React.useEffect(() => {
    if (mobileActiveTab) {
      setActiveTab(mobileActiveTab);
    }
  }, [mobileActiveTab]);
  const [isTapToTradeDropdownOpen, setIsTapToTradeDropdownOpen] =
    useState(false);
  const {
    isEnabled: tapToTradeEnabled,
    tradeMode,
    setTradeMode,
  } = useTapToTrade();

  // Close dropdown when clicking outside (with proper handling)
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      // Don't close if clicking inside the dropdown
      if (
        !target.closest(".tap-to-trade-dropdown") &&
        !target.closest(".tap-to-trade-button")
      ) {
        setIsTapToTradeDropdownOpen(false);
      }
    };

    if (isTapToTradeDropdownOpen) {
      setTimeout(() => {
        document.addEventListener("mousedown", handleClickOutside);
      }, 0);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isTapToTradeDropdownOpen]);

  return (
    <div className="h-full flex flex-col text-gray-100 relative overflow-hidden md:rounded-lg">
      {/* Separate Header with Wallet Connect Button - Dark Background - Hidden on Mobile */}
      <div
        className="md:flex hidden items-center justify-end"
        style={{
          padding: "0.60rem 1rem",
          backgroundColor: "#000000",
          flexShrink: 0,
          borderTopLeftRadius: "0.5rem",
          borderTopRightRadius: "0.5rem",
        }}
      >
        <WalletConnectButton />
      </div>

      {/* Order Panel - Aligned with Trading Chart Header */}
      <div className="flex-1 flex flex-col bg-[#0B1017] overflow-hidden md:rounded-b-lg">
        {/* Tab buttons - Always visible */}
        <div className="flex border-b border-[#1A202C] bg-[#0B1017]">
          {[
            {
              key: "long" as const,
              label: "Long",
              icon: <TrendingUp size={16} />,
              color: "#10B981",
              bgColor: "rgba(16, 185, 129, 0.15)",
              shadowColor: "rgba(16, 185, 129, 0.3)",
            },
            {
              key: "short" as const,
              label: "Short",
              icon: <TrendingDown size={16} />,
              color: "#EF4444",
              bgColor: "rgba(239, 68, 68, 0.15)",
              shadowColor: "rgba(239, 68, 68, 0.3)",
            },
            {
              key: "swap" as const,
              label: "Swap",
              icon: <Zap size={16} />,
              color: "#93C5FD",
              bgColor: "rgba(147, 197, 253, 0.15)",
              shadowColor: "rgba(147, 197, 253, 0.3)",
            },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() =>
                !(tapToTradeEnabled || activeOrderType === "Tap to Trade") &&
                setActiveTab(tab.key)
              }
              disabled={tapToTradeEnabled || activeOrderType === "Tap to Trade"}
              className={`flex-1 py-4 text-sm font-bold transition-all duration-200 relative ${
                tapToTradeEnabled || activeOrderType === "Tap to Trade"
                  ? "cursor-not-allowed opacity-30"
                  : "cursor-pointer"
              } ${
                activeTab === tab.key &&
                !(tapToTradeEnabled || activeOrderType === "Tap to Trade")
                  ? "text-white"
                  : tapToTradeEnabled || activeOrderType === "Tap to Trade"
                  ? "text-gray-600"
                  : "text-gray-400 hover:text-gray-200"
              }`}
              style={{
                backgroundColor:
                  activeTab === tab.key &&
                  !(tapToTradeEnabled || activeOrderType === "Tap to Trade")
                    ? tab.bgColor
                    : "transparent",
                boxShadow:
                  activeTab === tab.key &&
                  !(tapToTradeEnabled || activeOrderType === "Tap to Trade")
                    ? `inset 0 0 20px ${tab.shadowColor}, 0 0 10px ${tab.shadowColor}`
                    : "none",
                borderBottom:
                  activeTab === tab.key &&
                  !(tapToTradeEnabled || activeOrderType === "Tap to Trade")
                    ? `2px solid ${tab.color}`
                    : "2px solid transparent",
              }}
            >
              <div className="flex items-center justify-center gap-2">
                {tab.icon}
                {tab.label}
              </div>
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between px-4 py-4 border-b border-[#1A202C] bg-[#0B1017]">
          <div className="inline-flex gap-1.5 bg-[#0D1117] p-1 rounded-lg relative">
            {(["market", "limit", "Tap to Trade", "more"] as const).map(
              (type) => (
                <div key={type} className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (type === "Tap to Trade") {
                        setActiveOrderType(type);
                        setIsTapToTradeDropdownOpen(!isTapToTradeDropdownOpen);
                      } else {
                        setActiveOrderType(type);
                        setIsTapToTradeDropdownOpen(false);
                      }
                    }}
                    disabled={
                      activeTab === "swap" ||
                      (tapToTradeEnabled && type !== "Tap to Trade")
                    }
                    className={`tap-to-trade-button px-4 py-1.5 rounded-md text-xs font-semibold transition-all whitespace-nowrap min-w-fit ${
                      activeTab === "swap" ||
                      (tapToTradeEnabled && type !== "Tap to Trade")
                        ? "cursor-not-allowed opacity-50"
                        : "cursor-pointer"
                    } ${
                      activeOrderType === type
                        ? "bg-[#1E2836] text-white shadow-sm"
                        : "text-gray-400 hover:text-gray-200"
                    }`}
                  >
                    {type === "more" ? (
                      <span className="flex items-center gap-1">
                        More <ChevronDown size={14} />
                      </span>
                    ) : type === "Tap to Trade" ? (
                      <span className="flex items-center gap-1">
                        Tap to Trade{" "}
                        <ChevronDown
                          size={14}
                          className={`transition-transform ${
                            isTapToTradeDropdownOpen ? "rotate-180" : ""
                          }`}
                        />
                      </span>
                    ) : (
                      type.charAt(0).toUpperCase() + type.slice(1)
                    )}
                  </button>

                  {/* Tap to Trade Mode Dropdown */}
                  {type === "Tap to Trade" &&
                    isTapToTradeDropdownOpen &&
                    activeOrderType === "Tap to Trade" && (
                      <div className="tap-to-trade-dropdown absolute top-full mt-1 left-0 w-48 bg-[#1A2332] border border-[#2D3748] rounded-lg shadow-xl z-50 overflow-hidden">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setTradeMode("open-position");
                            setIsTapToTradeDropdownOpen(false);
                          }}
                          className={`w-full px-3 py-2 text-left text-xs hover:bg-[#2D3748] transition-colors cursor-pointer ${
                            tradeMode === "open-position"
                              ? "bg-[#2D3748] text-blue-300"
                              : "text-white"
                          }`}
                        >
                          Open Position
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setTradeMode("one-tap-profit");
                            setIsTapToTradeDropdownOpen(false);
                          }}
                          className={`w-full px-3 py-2 text-left text-xs hover:bg-[#2D3748] transition-colors cursor-pointer ${
                            tradeMode === "one-tap-profit"
                              ? "bg-[#2D3748] text-blue-300"
                              : "text-white"
                          }`}
                        >
                          One Tap Profit
                        </button>
                      </div>
                    )}
                </div>
              )
            )}
          </div>
          <div className="flex gap-2">
            <button className="p-2 rounded-md text-gray-400 hover:bg-[#1A202C] hover:text-white transition-all cursor-pointer">
              <Info size={16} />
            </button>
            <button className="p-2 rounded-md text-gray-400 hover:bg-[#1A202C] hover:text-white transition-all cursor-pointer">
              <Settings size={16} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar-dark relative">
          {/* Render different components based on activeTab and activeOrderType */}
          {activeTab === "swap" ? (
            <SwapPanel />
          ) : (
            <>
              {activeOrderType === "market" && (
                <MarketOrder activeTab={activeTab} />
              )}
              {activeOrderType === "limit" && <LimitOrder activeTab={activeTab} />}
              {activeOrderType === "Tap to Trade" && (
                <div className="relative min-h-full">
                  <TapToTrade />
                  {/* Blur overlay when dropdown is open - covers entire scrollable content */}
                  {isTapToTradeDropdownOpen && (
                    <div className="absolute inset-0 bg-[#0B1017]/80 backdrop-blur-sm z-40 flex items-center justify-center min-h-full">
                      <div className="text-center px-6">
                        <div className="bg-blue-300/10 border border-blue-300/30 rounded-lg p-6 max-w-md">
                          <p className="text-sm text-blue-400 mb-2">
                            Please select a trade mode to continue
                          </p>
                          <div className="flex items-center justify-center gap-2">
                            <ChevronDown
                              size={16}
                              className="text-blue-300 animate-bounce"
                            />
                            <p className="text-xs text-gray-400">
                              Choose from the dropdown above
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
              {activeOrderType === "more" && (
                <div className="text-center py-8 text-gray-400">
                  <p>More order types coming soon...</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderPanel;

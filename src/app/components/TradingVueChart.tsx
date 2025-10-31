'use client';

import React, { useEffect, useRef, useState, memo } from 'react';
import { init, dispose } from 'klinecharts';
import { pythDataFeed, Candle } from '../services/pythDataFeed';
import { useMarket } from '../contexts/MarketContext';
import { useGridTradingContext } from '../contexts/GridTradingContext';
import CanvasGridOverlay from './CanvasGridOverlay';
import GridSettingsPanel from './GridSettingsPanel';

interface TradingVueChartProps {
    symbol: string;
    interval: string;
}

// Drawing tools available in KLineChart
const DRAWING_TOOLS = [
    { name: 'segment', label: 'Line', icon: '📏' },
    { name: 'ray', label: 'Ray', icon: '➡️' },
    { name: 'horizontalStraightLine', label: 'H-Line', icon: '—' },
    { name: 'verticalStraightLine', label: 'V-Line', icon: '|' },
    { name: 'priceLine', label: 'Price', icon: '💲' },
    { name: 'fibonacciLine', label: 'Fib', icon: '🌀' },
    { name: 'rect', label: 'Rectangle', icon: '▭' },
    { name: 'circle', label: 'Circle', icon: '○' },
    { name: 'parallelogram', label: 'Parallel', icon: '▱' },
    { name: 'triangle', label: 'Triangle', icon: '△' }
];

const TradingVueChart: React.FC<TradingVueChartProps> = memo(({ symbol, interval }) => {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<any>(null);
    const wsRef = useRef<{ ws: WebSocket; cleanup: () => void } | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeDrawingTool, setActiveDrawingTool] = useState<string | null>(null);
    const [showDrawingTools, setShowDrawingTools] = useState(false);
    const { selectedPosition, chartPositions, currentPrice } = useMarket();
    const entryLineid = useRef<string | null>(null);
    const [showGridSettings, setShowGridSettings] = useState(false);
    
    // Grid Trading dari Context
    const gridTrading = useGridTradingContext();

    // Handle drawing tool selection
    const handleDrawingToolSelect = (toolName: string) => {
        if (chartRef.current) {
            if (activeDrawingTool === toolName) {
                // Deselect tool
                chartRef.current.createOverlay({ name: '' });
                setActiveDrawingTool(null);
            } else {
                // Select new tool
                chartRef.current.createOverlay({ name: toolName });
                setActiveDrawingTool(toolName);
                console.log(`🎨 Drawing tool activated: ${toolName}`);
            }
        }
    };

    // Clear all drawings
    const handleClearDrawings = () => {
        if (chartRef.current) {
            chartRef.current.removeOverlay();
            setActiveDrawingTool(null);
            console.log('🧹 All drawings cleared');
        }
    };

    // Initialize chart and fetch data
    useEffect(() => {
        if (!chartContainerRef.current || !symbol) return;

        const initializeChart = async () => {
            setIsLoading(true);
            console.log(`📊 Initializing chart for ${symbol} with interval ${interval}`);

            try {
                // Clean up existing chart first
                if (chartRef.current && chartContainerRef.current) {
                    console.log(`🧹 Cleaning up old chart before creating new one`);
                    dispose(chartContainerRef.current);
                    chartRef.current = null;
                }

                // Clear container innerHTML to ensure clean state
                if (chartContainerRef.current) {
                    chartContainerRef.current.innerHTML = '';
                }

                // Create chart instance
                const chart = init(chartContainerRef.current!, {
                    styles: {
                        candle: {
                            bar: {
                                upColor: '#10b981',
                                downColor: '#ef4444',
                                upBorderColor: '#10b981',
                                downBorderColor: '#ef4444',
                                upWickColor: '#10b981',
                                downWickColor: '#ef4444'
                            },
                            area: {
                                lineSize: 2,
                                lineColor: '#2962FF',
                                value: 'close',
                                backgroundColor: [{
                                    offset: 0,
                                    color: 'rgba(41, 98, 255, 0.01)'
                                }, {
                                    offset: 1,
                                    color: 'rgba(41, 98, 255, 0.2)'
                                }]
                            }
                        },
                        grid: {
                            horizontal: {
                                color: '#1D2029',
                                show: true
                            },
                            vertical: {
                                color: '#1D2029',
                                show: true
                            }
                        },
                        xAxis: {
                            size: 'auto'
                        },
                        yAxis: {
                            size: 'auto'
                        }
                    }
                });

                chartRef.current = chart;

                // Set initial bar space for better grid visibility
                // Adjust based on timeframe for optimal grid spacing
                const getBarSpaceForTimeframe = (timeframe: string) => {
                    const tf = parseInt(timeframe) || 60;
                    if (tf <= 1) return 8;      // 1 minute
                    if (tf <= 5) return 10;     // 5 minutes
                    if (tf <= 15) return 12;    // 15 minutes
                    if (tf <= 60) return 15;    // 1 hour
                    if (tf <= 240) return 18;   // 4 hours
                    return 20;                  // Daily
                };

                const initialBarSpace = getBarSpaceForTimeframe(interval);
                if (chart) {
                    chart.setBarSpace(initialBarSpace);
                    console.log(`📊 Set bar space to ${initialBarSpace}px for ${interval} timeframe`);
                }

                // Fetch historical candles (Pyth Oracle or Binance fallback)
                const candles = await pythDataFeed.fetchCandles(symbol, interval, 500);

                if (candles.length === 0) {
                    console.error(`❌ No candles fetched for ${symbol}`);
                    setIsLoading(false);
                    return;
                }

                console.log(`✅ Fetched ${candles.length} candles for ${symbol}`);

                // Format for KLineChart
                const formattedData = candles.map(candle => ({
                    timestamp: candle.time,
                    open: candle.open,
                    high: candle.high,
                    low: candle.low,
                    close: candle.close,
                    volume: candle.volume
                }));

                // Apply data to chart
                chart?.applyNewData(formattedData);
                console.log(`✅ Chart initialized successfully for ${symbol}`);
                setIsLoading(false);

                // Enable default crosshair mode
                chart?.createOverlay({
                    name: 'simpleAnnotation'
                });

                // Setup WebSocket for real-time updates (Pyth Oracle or Binance fallback)
                if (wsRef.current) {
                    wsRef.current.cleanup();
                }

                wsRef.current = pythDataFeed.createWebSocket(
                    symbol,
                    interval,
                    (candle: Candle) => {
                        if (chart) {
                            const newCandle = {
                                timestamp: candle.time,
                                open: candle.open,
                                high: candle.high,
                                low: candle.low,
                                close: candle.close,
                                volume: candle.volume
                            };
                            chart.updateData(newCandle);
                        }
                    }
                );
            } catch (error) {
                console.error('Error initializing chart:', error);
                setIsLoading(false);
            }
        };

        initializeChart();

        // Handle resize and zoom
        let resizeTimeout: NodeJS.Timeout;
        const handleResize = () => {
            // Debounce resize to avoid too many calls
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                if (chartRef.current && chartContainerRef.current) {
                    const container = chartContainerRef.current;
                    const rect = container.getBoundingClientRect();

                    // Only resize if container has valid dimensions
                    if (rect.width > 0 && rect.height > 0) {
                        console.log('Resizing chart to:', rect.width, 'x', rect.height);
                        chartRef.current.resize();
                    }
                }
            }, 50);
        };

        // Force multiple resizes after mount to ensure proper rendering
        const timeoutId1 = setTimeout(() => {
            console.log('First resize attempt');
            handleResize();
        }, 100);

        const timeoutId2 = setTimeout(() => {
            console.log('Second resize attempt');
            handleResize();
        }, 300);

        const timeoutId3 = setTimeout(() => {
            console.log('Third resize attempt');
            handleResize();
        }, 500);

        // Use ResizeObserver to detect container size changes
        let resizeObserver: ResizeObserver | null = null;
        if (chartContainerRef.current) {
            resizeObserver = new ResizeObserver((entries) => {
                for (const entry of entries) {
                    console.log('ResizeObserver detected size change:', entry.contentRect.width, 'x', entry.contentRect.height);
                    handleResize();
                }
            });
            resizeObserver.observe(chartContainerRef.current);
        }

        // Listen for both resize and zoom events
        window.addEventListener('resize', handleResize);
        // Visualviewport is better for detecting zoom
        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', handleResize);
        }

        return () => {
            clearTimeout(timeoutId1);
            clearTimeout(timeoutId2);
            clearTimeout(timeoutId3);
            clearTimeout(resizeTimeout);
            if (resizeObserver) {
                resizeObserver.disconnect();
            }
            window.removeEventListener('resize', handleResize);
            if (window.visualViewport) {
                window.visualViewport.removeEventListener('resize', handleResize);
            }
            if (wsRef.current) {
                wsRef.current.cleanup();
                wsRef.current = null;
            }
            if (chartRef.current && chartContainerRef.current) {
                dispose(chartContainerRef.current);
                chartRef.current = null;
            }
        };
    }, [symbol, interval]);

    // Toggle chart type based on grid trading mode
    useEffect(() => {
        if (!chartRef.current) return;

        if (gridTrading.gridConfig.enabled) {
            // Switch to line chart for grid trading
            chartRef.current.setStyles({
                candle: {
                    type: 'area'
                }
            });
            console.log('📊 Switched to line chart for grid trading');
        } else {
            // Switch back to candlestick chart
            chartRef.current.setStyles({
                candle: {
                    type: 'candle_solid'
                }
            });
            console.log('📊 Switched to candlestick chart');
        }
    }, [gridTrading.gridConfig.enabled]);

    // Draw entry price line when position is selected
    useEffect(() => {
        // Wait until loading is complete and chart is ready
        if (!chartRef.current || isLoading) {
            console.log('⏳ Chart not ready or loading, skipping entry line draw', { isLoading, hasChart: !!chartRef.current });
            return;
        }

        const chartSymbolClean = symbol.replace('USDT', '');

        console.log('🔍 Entry Line Debug:', {
            selectedPosition,
            chartSymbol: symbol,
            chartSymbolClean,
            matches: selectedPosition ? selectedPosition.symbol === chartSymbolClean : false,
            isLoading
        });

        // Remove old entry line if exists
        if (entryLineid.current) {
            try {
                chartRef.current.removeOverlay({ id: entryLineid.current });
                console.log(`🧹 Removed old entry line: ${entryLineid.current}`);
            } catch (e) {
                console.log('Could not remove old overlay:', e);
            }
            entryLineid.current = null;
        }

        // Check if we should draw entry line
        if (!selectedPosition) {
            console.log('No position selected');
            return;
        }

        // Check if chart positions is enabled
        if (!chartPositions) {
            console.log('Chart positions disabled');
            return;
        }

        // Match symbol
        if (selectedPosition.symbol !== chartSymbolClean) {
            console.log(`❌ Symbol mismatch: position=${selectedPosition.symbol}, chart=${chartSymbolClean}`);
            return;
        }

        // At this point: chart ready, not loading, position selected and symbol matches
        const entryPrice = selectedPosition.entryPrice;
        const isLong = selectedPosition.isLong;

        console.log(`📍 Will draw entry price line at $${entryPrice.toFixed(2)} for ${isLong ? 'Long' : 'Short'} ${selectedPosition.symbol}`);

        // Add delay to ensure chart data is loaded
        const drawTimeout = setTimeout(() => {
            if (!chartRef.current) {
                console.log('❌ Chart ref lost during timeout');
                return;
            }

            try {
                const overlayId = `entry-price-${selectedPosition.positionId.toString()}`;

                // Create simple price line - label will appear on left by default
                const overlay = {
                    name: 'priceLine',
                    id: overlayId,
                    points: [{ value: entryPrice }],
                    extendLeft: true,
                    extendRight: true,
                    lock: true,
                    styles: {
                        line: {
                            color: '#3b82f6', // Blue line
                            size: 0.5, // Thinner line
                            style: 'dashed' // Dashed line
                        }
                    }
                };

                chartRef.current.createOverlay(overlay);
                entryLineid.current = overlayId;

                console.log(`✅ Successfully drew entry price line for ${selectedPosition.symbol} at $${entryPrice.toFixed(2)}`);
            } catch (error) {
                console.error('❌ Error drawing entry line:', error);
            }
        }, 500); // 500ms delay to ensure chart is fully loaded

        return () => clearTimeout(drawTimeout);
    }, [selectedPosition, symbol, isLoading, chartPositions]);

    return (
        <div
            className="w-full h-full bg-[#0D1017]"
            style={{
                position: 'relative',
                width: '100%',
                height: '100%'
            }}
        >
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center z-10">
                    <div className="text-slate-400">Loading chart data...</div>
                </div>
            )}

            {/* Drawing Tools Toolbar */}
            <div className="absolute top-2 left-2 z-20 flex flex-col gap-1" style={{ pointerEvents: 'auto' }}>
                {/* Toggle Grid Trading Button */}
                <button
                    onClick={gridTrading.toggleGrid}
                    className={`p-2 rounded-lg shadow-lg transition-all duration-200 ${
                        gridTrading.gridConfig.enabled
                            ? 'bg-green-500 text-white shadow-green-500/50'
                            : 'bg-slate-800/90 text-slate-300 hover:bg-slate-700'
                    }`}
                    title="Toggle Tap to Trade Grid"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1v-3z" />
                    </svg>
                </button>

                {/* Toggle Grid Settings Button */}
                {gridTrading.gridConfig.enabled && (
                    <button
                        onClick={() => setShowGridSettings(!showGridSettings)}
                        className={`p-2 rounded-lg shadow-lg transition-all duration-200 ${
                            showGridSettings
                                ? 'bg-blue-500 text-white'
                                : 'bg-slate-800/90 text-slate-300 hover:bg-slate-700'
                        }`}
                        title="Grid Settings"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </button>
                )}

                {/* Toggle Drawing Tools Button */}
                <button
                    onClick={() => setShowDrawingTools(!showDrawingTools)}
                    className={`p-2 rounded-lg shadow-lg transition-all duration-200 ${
                        showDrawingTools
                            ? 'bg-blue-500 text-white'
                            : 'bg-slate-800/90 text-slate-300 hover:bg-slate-700'
                    }`}
                    title="Drawing Tools"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                </button>

                {/* Drawing Tools Panel */}
                {showDrawingTools && (
                    <div className="bg-slate-800/95 backdrop-blur-sm rounded-lg shadow-xl p-2 border border-slate-700">
                        <div className="grid grid-cols-2 gap-1 mb-2">
                            {DRAWING_TOOLS.map((tool) => (
                                <button
                                    key={tool.name}
                                    onClick={() => handleDrawingToolSelect(tool.name)}
                                    className={`px-3 py-2 rounded text-xs font-medium transition-all duration-200 flex items-center gap-2 ${
                                        activeDrawingTool === tool.name
                                            ? 'bg-blue-500 text-white shadow-lg'
                                            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                    }`}
                                    title={tool.label}
                                >
                                    <span>{tool.icon}</span>
                                    <span className="whitespace-nowrap">{tool.label}</span>
                                </button>
                            ))}
                        </div>

                        {/* Clear All Button */}
                        <button
                            onClick={handleClearDrawings}
                            className="w-full px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded transition-all duration-200 flex items-center justify-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Clear All
                        </button>
                    </div>
                )}

                {/* Grid Settings Panel */}
                {showGridSettings && gridTrading.gridConfig.enabled && (
                    <GridSettingsPanel
                        gridConfig={gridTrading.gridConfig}
                        onConfigChange={gridTrading.updateGridConfig}
                        interval={interval}
                        stats={gridTrading.stats}
                    />
                )}

                {/* Grid Action Buttons */}
                {gridTrading.gridConfig.enabled && gridTrading.stats.totalCells > 0 && (
                    <div className="bg-slate-800/95 backdrop-blur-sm rounded-lg shadow-xl p-3 border border-slate-700">
                        <div className="text-xs text-slate-300 mb-2">
                            <span className="font-semibold">{gridTrading.stats.totalCells}</span> cells selected
                        </div>
                        <div className="flex flex-col gap-2">
                            <button
                                onClick={gridTrading.placeGridOrders}
                                className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-all flex items-center justify-center gap-2"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Place Orders
                            </button>
                            <button
                                onClick={gridTrading.clearAllCells}
                                className="w-full px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded transition-all"
                            >
                                Clear Selection
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <div
                ref={chartContainerRef}
                className="w-full h-full"
                style={{ position: 'relative' }}
            >
                {/* Canvas Grid Overlay */}
                <CanvasGridOverlay
                    chartRef={chartRef}
                    gridConfig={gridTrading.gridConfig}
                    selectedCells={gridTrading.selectedCells}
                    currentPrice={parseFloat(currentPrice) || 0}
                    onCellClick={gridTrading.handleCellTap}
                    interval={interval}
                />
            </div>
        </div>
    );
});

TradingVueChart.displayName = 'TradingVueChart';

export default TradingVueChart;

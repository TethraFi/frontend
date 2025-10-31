'use client';

import React, { useEffect, useRef, memo } from 'react';

interface TradingViewWidgetProps {
    symbol: string;
}

const TradingViewWidget: React.FC<TradingViewWidgetProps> = memo(({ symbol }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const scriptLoadedRef = useRef(false);

    useEffect(() => {
        if (!containerRef.current) return;

        // Clear container
        containerRef.current.innerHTML = '';

        // Create container div for widget
        const widgetContainer = document.createElement('div');
        widgetContainer.id = `tradingview_${Date.now()}`;
        widgetContainer.style.height = '100%';
        widgetContainer.style.width = '100%';
        containerRef.current.appendChild(widgetContainer);

        // Load TradingView script if not already loaded
        const loadScript = () => {
            if (scriptLoadedRef.current) {
                initWidget();
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://s3.tradingview.com/tv.js';
            script.async = true;
            script.onload = () => {
                scriptLoadedRef.current = true;
                initWidget();
            };
            document.head.appendChild(script);
        };

        const initWidget = () => {
            if (typeof (window as any).TradingView !== 'undefined') {
                // Check if mobile device (not just screen size)
                const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                                 (window.innerWidth < 768 && 'ontouchstart' in window);

                new (window as any).TradingView.widget({
                    autosize: true,
                    symbol: `BINANCE:${symbol}`,
                    interval: '240', // 4h default
                    timezone: 'Asia/Jakarta',
                    theme: 'dark',
                    style: '1',
                    locale: 'en',
                    toolbar_bg: '#171B26',
                    enable_publishing: false,
                    hide_side_toolbar: isMobile, // Hide on mobile, show on desktop
                    allow_symbol_change: true,
                    details: false,
                    hotlist: false,
                    calendar: false,
                    container_id: widgetContainer.id,
                    // Disabled features to hide bottom toolbar
                    disabled_features: [
                        'use_localstorage_for_settings',
                        'timeframes_toolbar', // This hides the bottom timeframe bar
                    ],
                    // Enabled features to show header with timeframes
                    enabled_features: [
                        'header_widget',
                        'header_resolutions',
                        'header_interval_dialog_button',
                        'show_interval_dialog_on_key_press',
                    ],
                    overrides: {
                        // Main background
                        'paneProperties.background': '#171B26',
                        'paneProperties.backgroundGradientStartColor': '#171B26',
                        'paneProperties.backgroundGradientEndColor': '#171B26',
                        'paneProperties.backgroundType': 'solid',

                        // Grid
                        'paneProperties.vertGridProperties.color': '#1E2433',
                        'paneProperties.horzGridProperties.color': '#1E2433',

                        // Scales/Axis
                        'scalesProperties.backgroundColor': '#171B26',
                        'scalesProperties.textColor': '#94A3B8',
                        'scalesProperties.lineColor': '#1E2433',

                        // Symbol watermark
                        'symbolWatermarkProperties.transparency': 90,
                        'symbolWatermarkProperties.color': '#171B26',

                        // Candles
                        'mainSeriesProperties.candleStyle.upColor': '#22c55e',
                        'mainSeriesProperties.candleStyle.downColor': '#ef4444',
                        'mainSeriesProperties.candleStyle.borderUpColor': '#22c55e',
                        'mainSeriesProperties.candleStyle.borderDownColor': '#ef4444',
                        'mainSeriesProperties.candleStyle.wickUpColor': '#22c55e',
                        'mainSeriesProperties.candleStyle.wickDownColor': '#ef4444',
                    },
                    loading_screen: {
                        backgroundColor: '#171B26',
                        foregroundColor: '#171B26',
                    },
                });
            }
        };

        loadScript();

        return () => {
            if (containerRef.current) {
                containerRef.current.innerHTML = '';
            }
        };
    }, [symbol]);

    return (
        <div
            ref={containerRef}
            className="w-full h-full"
            style={{
                position: 'relative',
                width: '100%',
                height: '100%',
                zIndex: 1,
            }}
        />
    );
});

TradingViewWidget.displayName = 'TradingViewWidget';

export default TradingViewWidget;

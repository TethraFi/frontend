export interface Candle {
    time: number;      // timestamp in ms
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}

export class PythDataFeed {
    private baseUrl = (process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001') + '/api'; // Your backend URL
    private wsUrl = (process.env.NEXT_PUBLIC_BACKEND_URL || 'ws://localhost:3001').replace(/^http/, 'ws') + '/ws'; // WebSocket URL

    /**
     * Convert timeframe to backend interval format
     * TradingView: '1', '5', '15', '30', '60', '240', 'D', 'W', 'M'
     * Backend: '1m', '5m', '15m', '30m', '1h', '4h', '1d', '1w', '1M'
     */
    private convertTimeframe(timeframe: string): string {
        const timeframeMap: Record<string, string> = {
            '1': '1m',
            '3': '3m',
            '5': '5m',
            '15': '15m',
            '30': '30m',
            '60': '1h',
            '120': '2h',
            '240': '4h',
            '360': '6h',
            '480': '8h',
            '720': '12h',
            'D': '1d',
            'W': '1w',
            'M': '1M'
        };
        return timeframeMap[timeframe] || '1h';
    }

    /**
     * Convert symbol format (BTCUSDT -> BTC)
     */
    private convertSymbol(symbol: string): string {
        // Remove USDT suffix to get clean symbol (BTC, ETH, SOL, etc.)
        return symbol.replace('USDT', '');
    }

    /**
     * Fetch historical candlestick data from Pyth Oracle backend with Binance fallback
     */
    async fetchCandles(
        symbol: string,
        timeframe: string,
        limit: number = 500
    ): Promise<Candle[]> {
        const interval = this.convertTimeframe(timeframe);
        const cleanSymbol = this.convertSymbol(symbol);
        const url = `${this.baseUrl}/candles/${cleanSymbol}?interval=${interval}&limit=${limit}`;

        console.log(`📊 [PYTH] Attempting to fetch candles from: ${url}`);

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

            const response = await fetch(url, {
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            console.log(`📊 [PYTH] Response status: ${response.status} ${response.statusText}`);

            if (!response.ok) {
                console.error(`❌ [PYTH] HTTP Error: ${response.status} ${response.statusText}`);
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            console.log(`📊 [PYTH] Received data:`, {
                isArray: Array.isArray(data),
                length: Array.isArray(data) ? data.length : 0,
                firstItem: Array.isArray(data) && data.length > 0 ? data[0] : null
            });

            // Backend should return array of candles with format:
            // { time: number, open: number, high: number, low: number, close: number, volume: number }
            if (!Array.isArray(data)) {
                console.error('❌ [PYTH] Invalid response format - not an array:', typeof data);
                throw new Error('Invalid response format - expected array');
            }

            if (data.length === 0) {
                console.warn('⚠️ [PYTH] No candles returned from backend');
                throw new Error('No candles returned');
            }

            console.log(`✅ [PYTH] Successfully fetched ${data.length} candles from Pyth Oracle`);

            return data.map((candle: any) => ({
                time: candle.time || candle.timestamp,
                open: parseFloat(candle.open),
                high: parseFloat(candle.high),
                low: parseFloat(candle.low),
                close: parseFloat(candle.close),
                volume: parseFloat(candle.volume || 0)
            }));
        } catch (error) {
            if (error instanceof Error) {
                console.error('❌ [PYTH] Error fetching candles:', {
                    name: error.name,
                    message: error.message,
                    stack: error.stack?.split('\n')[0]
                });
            } else {
                console.error('❌ [PYTH] Unknown error:', error);
            }

            console.warn('⚠️ [PYTH] Falling back to Binance API');

            // Fallback to Binance API
            try {
                const interval = this.convertTimeframe(timeframe);
                const binanceUrl = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;

                console.log(`📊 Fetching fallback candles from Binance: ${binanceUrl}`);

                const response = await fetch(binanceUrl);
                if (!response.ok) {
                    throw new Error(`Binance fallback failed: ${response.statusText}`);
                }

                const data = await response.json();

                console.log(`✅ Fetched ${data.length} candles from Binance (fallback)`);

                // Binance returns: [timestamp, open, high, low, close, volume, closeTime, quoteVolume, trades, takerBuyBase, takerBuyQuote, ignore]
                return data.map((candle: any[]) => ({
                    time: candle[0],
                    open: parseFloat(candle[1]),
                    high: parseFloat(candle[2]),
                    low: parseFloat(candle[3]),
                    close: parseFloat(candle[4]),
                    volume: parseFloat(candle[5])
                }));
            } catch (binanceError) {
                console.error('❌ Both Pyth and Binance failed:', binanceError);
                return [];
            }
        }
    }

    /**
     * Format candles for TradingVue (OHLCV format)
     * TradingVue expects: [timestamp, open, high, low, close, volume]
     */
    formatForTradingVue(candles: Candle[]): number[][] {
        return candles.map(candle => [
            candle.time,
            candle.open,
            candle.high,
            candle.low,
            candle.close,
            candle.volume
        ]);
    }

    /**
     * Create WebSocket connection for real-time updates from Pyth Oracle with Binance fallback
     */
    createWebSocket(
        symbol: string,
        timeframe: string,
        onCandle: (candle: Candle) => void
    ): { ws: WebSocket; cleanup: () => void } {
        const interval = this.convertTimeframe(timeframe);
        const cleanSymbol = this.convertSymbol(symbol);

        let ws: WebSocket;
        let pingInterval: NodeJS.Timeout | null = null;
        let usePyth = true;

        try {
            // Try Pyth Oracle WebSocket first
            ws = new WebSocket(`${this.wsUrl}/candles`);

            // Set timeout to fallback to Binance if Pyth doesn't connect
            const connectionTimeout = setTimeout(() => {
                if (ws.readyState !== WebSocket.OPEN) {
                    console.warn('⚠️ Pyth WebSocket timeout, falling back to Binance');
                    ws.close();
                }
            }, 5000); // 5 second timeout

            ws.onopen = () => {
                clearTimeout(connectionTimeout);
                console.log(`✅ Pyth WebSocket connected for ${cleanSymbol} ${interval}`);
                usePyth = true;

                // Subscribe to specific symbol and interval
                ws.send(JSON.stringify({
                    type: 'subscribe',
                    symbol: cleanSymbol,
                    interval: interval
                }));

                // Start ping interval when connection is established
                pingInterval = setInterval(() => {
                    if (ws.readyState === WebSocket.OPEN) {
                        ws.send(JSON.stringify({ type: 'ping' }));
                    }
                }, 180000); // 3 minutes
            };

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);

                    if (data.type === 'candle_update' && data.candle) {
                        const candle: Candle = {
                            time: data.candle.time || data.candle.timestamp,
                            open: parseFloat(data.candle.open),
                            high: parseFloat(data.candle.high),
                            low: parseFloat(data.candle.low),
                            close: parseFloat(data.candle.close),
                            volume: parseFloat(data.candle.volume || 0)
                        };
                        onCandle(candle);
                    }
                } catch (error) {
                    console.error('Error parsing Pyth WebSocket message:', error);
                }
            };

            ws.onerror = () => {
                console.warn('⚠️ Pyth WebSocket error, attempting Binance fallback');
                usePyth = false;
            };

            ws.onclose = () => {
                console.log(`🔌 Pyth WebSocket closed for ${cleanSymbol} ${interval}`);
                clearTimeout(connectionTimeout);

                // If Pyth failed, fallback to Binance
                if (!usePyth) {
                    console.log('🔄 Falling back to Binance WebSocket...');
                    const stream = `${symbol.toLowerCase()}@kline_${interval}`;
                    ws = new WebSocket(`wss://stream.binance.com:9443/ws/${stream}`);

                    ws.onopen = () => {
                        console.log(`✅ Binance WebSocket connected (fallback) for ${symbol} ${interval}`);

                        pingInterval = setInterval(() => {
                            if (ws.readyState === WebSocket.OPEN) {
                                ws.send(JSON.stringify({ method: 'ping' }));
                            }
                        }, 180000);
                    };

                    ws.onmessage = (event) => {
                        try {
                            const data = JSON.parse(event.data);
                            const kline = data.k;

                            if (kline) {
                                const candle: Candle = {
                                    time: kline.t,
                                    open: parseFloat(kline.o),
                                    high: parseFloat(kline.h),
                                    low: parseFloat(kline.l),
                                    close: parseFloat(kline.c),
                                    volume: parseFloat(kline.v)
                                };
                                onCandle(candle);
                            }
                        } catch (error) {
                            console.error('Error parsing Binance WebSocket message:', error);
                        }
                    };

                    ws.onerror = (error) => {
                        console.error('Binance WebSocket error:', error);
                    };

                    ws.onclose = () => {
                        console.log('🔌 Binance WebSocket closed');
                        if (pingInterval) {
                            clearInterval(pingInterval);
                            pingInterval = null;
                        }
                    };
                }

                if (pingInterval) {
                    clearInterval(pingInterval);
                    pingInterval = null;
                }
            };
        } catch (error) {
            console.error('❌ Error creating Pyth WebSocket, falling back to Binance:', error);

            // Direct Binance fallback
            const stream = `${symbol.toLowerCase()}@kline_${interval}`;
            ws = new WebSocket(`wss://stream.binance.com:9443/ws/${stream}`);

            ws.onopen = () => {
                console.log(`✅ Binance WebSocket connected (fallback) for ${symbol} ${interval}`);

                pingInterval = setInterval(() => {
                    if (ws.readyState === WebSocket.OPEN) {
                        ws.send(JSON.stringify({ method: 'ping' }));
                    }
                }, 180000);
            };

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    const kline = data.k;

                    if (kline) {
                        const candle: Candle = {
                            time: kline.t,
                            open: parseFloat(kline.o),
                            high: parseFloat(kline.h),
                            low: parseFloat(kline.l),
                            close: parseFloat(kline.c),
                            volume: parseFloat(kline.v)
                        };
                        onCandle(candle);
                    }
                } catch (error) {
                    console.error('Error parsing Binance WebSocket message:', error);
                }
            };
        }

        // Return cleanup function
        const cleanup = () => {
            if (pingInterval) {
                clearInterval(pingInterval);
                pingInterval = null;
            }
            if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
                if (ws.readyState === WebSocket.OPEN && usePyth) {
                    try {
                        ws.send(JSON.stringify({
                            type: 'unsubscribe',
                            symbol: cleanSymbol,
                            interval: interval
                        }));
                    } catch (e) {
                        // Ignore errors during cleanup
                    }
                }
                ws.close();
            }
        };

        return { ws: ws!, cleanup };
    }
}

export const pythDataFeed = new PythDataFeed();

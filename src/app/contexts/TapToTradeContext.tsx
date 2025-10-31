'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useRef } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { keccak256, encodePacked, encodeFunctionData, toHex } from 'viem';
import { useSessionKey } from '@/hooks/useSessionKey';
import { useChain } from './ChainContext';
import { getChainConfig } from '@/config/chains';

interface GridSession {
  id: string;
  trader: string;
  symbol: string;
  marginTotal: string;
  leverage: number;
  timeframeSeconds: number;
  gridSizeX: number;
  gridSizeYPercent: number;
  referenceTime: number;
  referencePrice: string;
  isActive: boolean;
  createdAt: number;
}

interface CellOrderInfo {
  cellX: number;
  cellY: number;
  orderCount: number;
  triggerPrice: string;
  startTime: number;
  endTime: number;
  isLong: boolean;
}

type TradeMode = 'open-position' | 'one-tap-profit';

interface TapToTradeContextType {
  // Mode state
  isEnabled: boolean;
  tradeMode: TradeMode;
  setTradeMode: (mode: TradeMode) => void;
  toggleMode: (params?: {
    symbol: string;
    margin: string;
    leverage: number;
    timeframe: string;
    currentPrice: number;
  }) => Promise<void>;
  
  // Binary trading state (for OneTapProfit mode)
  isBinaryTradingEnabled: boolean;
  setIsBinaryTradingEnabled: (enabled: boolean) => void;

  // Grid settings
  gridSizeX: number; // Number of candles per grid column
  gridSizeY: number; // Price step per grid row (in %)
  setGridSizeX: (size: number) => void;
  setGridSizeY: (size: number) => void;
  
  // Bet amount for OneTapProfit mode
  betAmount: string;
  setBetAmount: (amount: string) => void;

  // Cell interactions - NEW: immediate order creation
  handleCellClick: (cellX: number, cellY: number) => Promise<void>;
  cellOrders: Map<string, CellOrderInfo>; // Track orders per cell

  // Session key state
  sessionKey: any | null; // Session key for signature-less trading
  sessionTimeRemaining: number; // Time remaining in milliseconds

  // Backend integration
  gridSession: GridSession | null;
  isLoading: boolean;
  error: string | null;
}

const TapToTradeContext = createContext<TapToTradeContextType | undefined>(undefined);

const BACKEND_API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
const EXPECTED_CHAIN_ID = BigInt(process.env.NEXT_PUBLIC_CHAIN_ID || '84532');
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL;

export const TapToTradeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = usePrivy();
  const { wallets } = useWallets();
  const { selectedChain } = useChain();
  const [isEnabled, setIsEnabled] = useState(false);
  const [tradeMode, setTradeMode] = useState<TradeMode>('open-position');
  const [gridSizeX, setGridSizeX] = useState(1); // 1 candle per column by default
  const [gridSizeY, setGridSizeY] = useState(0.5); // 0.5% per row by default
  const [cellOrders, setCellOrders] = useState<Map<string, CellOrderInfo>>(new Map());
  const [betAmount, setBetAmount] = useState('10'); // Default 10 USDC for OneTapProfit
  const [isBinaryTradingEnabled, setIsBinaryTradingEnabled] = useState(false); // Binary trading toggle

  // Backend integration state
  const [gridSession, setGridSession] = useState<GridSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track nonce locally to avoid race conditions with multiple orders
  const [localNonce, setLocalNonce] = useState<bigint>(BigInt(0));
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const resignIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const attemptedResignOrders = useRef<Set<string>>(new Set()); // Track orders we've already attempted to re-sign

  // Session key for signature-less tap-to-trade (chain-specific!)
  const {
    sessionKey,
    isSessionValid,
    createSession,
    signWithSession,
    clearSession,
    getTimeRemaining,
  } = useSessionKey(selectedChain); // Pass selected chain!

  /**
   * Initialize nonce from contract
   */
  const initializeNonce = async () => {
    try {
      const embeddedWallet = wallets.find((w) => w.walletClientType === 'privy');
      if (!embeddedWallet) {
        console.warn('Cannot initialize nonce: embedded wallet not found');
        return;
      }

      const traderAddress = embeddedWallet.address;
      const walletClient = await embeddedWallet.getEthereumProvider();
      if (!walletClient) {
        console.warn('Cannot initialize nonce: wallet client not available');
        return;
      }

      // Get chain-specific contract address
      const chainConfig = getChainConfig(selectedChain);
      const tapToTradeExecutorAddress = chainConfig.contracts.tapToTradeExecutor;

      const MarketExecutorABI = [
        {
          inputs: [{ name: '', type: 'address' }],
          name: 'metaNonces',
          outputs: [{ name: '', type: 'uint256' }],
          stateMutability: 'view',
          type: 'function',
        },
      ];

      const nonceData = encodeFunctionData({
        abi: MarketExecutorABI,
        functionName: 'metaNonces',
        args: [traderAddress as `0x${string}`],
      });

      const nonceResult = await walletClient.request({
        method: 'eth_call',
        params: [{
          to: tapToTradeExecutorAddress,
          data: nonceData,
        }, 'latest'],
      });

      // Handle empty result (0x means 0)
      const currentNonce = nonceResult === '0x' || !nonceResult
        ? BigInt(0)
        : BigInt(nonceResult as string);

      setLocalNonce(currentNonce);
      console.log(`✅ Initialized local nonce for ${selectedChain}:`, currentNonce.toString());
    } catch (err) {
      console.error('Failed to initialize nonce:', err);
    }
  };

  // NOTE: authorizeSessionKeyOnChain() removed for 100% gasless experience
  // Session keys are validated off-chain by backend only
  // Contract execution happens via keeper role (backend pays gas)

  /**
   * Auto re-sign orders that need re-signing (nonce mismatch)
   */
  const checkAndResignOrders = async () => {
    if (!isEnabled || !gridSession || !user?.wallet?.address) {
      return;
    }

    try {
      // Get Privy embedded wallet
      const embeddedWallet = wallets.find((w) => w.walletClientType === 'privy');
      if (!embeddedWallet) {
        return;
      }

      const traderAddress = embeddedWallet.address;

      // Fetch orders that need re-signing
      const response = await fetch(
        `${BACKEND_API_URL}/api/tap-to-trade/orders?trader=${traderAddress}&status=NEEDS_RESIGN`
      );
      const result = await response.json();

      if (!result.success || !result.data || result.data.length === 0) {
        return;
      }

      console.log(`\ud83d\udd04 Found ${result.data.length} orders that need re-signing`);

      // Re-sign each order (only once per order)
      for (const order of result.data) {
        // Skip if we've already attempted to re-sign this order
        if (attemptedResignOrders.current.has(order.id)) {
          console.log(`⏭️ Already attempted re-sign for order ${order.id}, skipping...`);
          continue;
        }

        // Mark as attempted
        attemptedResignOrders.current.add(order.id);
        try {
          console.log(`\u270d\ufe0f Re-signing order ${order.id}...`);

          const walletClient = await embeddedWallet.getEthereumProvider();
          if (!walletClient) {
            continue;
          }

          // Fetch fresh nonce
          const MarketExecutorABI = [
            {
              inputs: [{ name: '', type: 'address' }],
              name: 'metaNonces',
              outputs: [{ name: '', type: 'uint256' }],
              stateMutability: 'view',
              type: 'function',
            },
          ];

          // Get chain-specific contract address
          const chainConfig = getChainConfig(selectedChain);
          const tapToTradeExecutorAddress = chainConfig.contracts.tapToTradeExecutor;

          const nonceData = encodeFunctionData({
            abi: MarketExecutorABI,
            functionName: 'metaNonces',
            args: [traderAddress as `0x${string}`],
          });

          const nonceResult = await walletClient.request({
            method: 'eth_call',
            params: [{
              to: tapToTradeExecutorAddress,
              data: nonceData,
            }, 'latest'],
          });

          // Handle empty result (0x means 0)
          const freshNonce = nonceResult === '0x' || !nonceResult
            ? BigInt(0)
            : BigInt(nonceResult as string);

          console.log(`\u2705 Fresh nonce: ${freshNonce.toString()}`);

          // Create new signature with fresh nonce and chain-specific contract
          const messageHash = keccak256(
            encodePacked(
              ['address', 'string', 'bool', 'uint256', 'uint256', 'uint256', 'address'],
              [
                traderAddress as `0x${string}`,
                order.symbol,
                order.isLong,
                BigInt(order.collateral),
                BigInt(order.leverage),
                freshNonce,
                tapToTradeExecutorAddress as `0x${string}`
              ]
            )
          );

          // User will see signature request popup here
          const newSignature = await walletClient.request({
            method: 'personal_sign',
            params: [messageHash, traderAddress],
          });

          // Update signature in backend
          const updateResponse = await fetch(`${BACKEND_API_URL}/api/tap-to-trade/update-signature`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              orderId: order.id,
              nonce: freshNonce.toString(),
              signature: newSignature,
              trader: traderAddress,
            }),
          });

          const updateResult = await updateResponse.json();
          if (updateResult.success) {
            console.log(`\u2705 Successfully re-signed order ${order.id}`);
            // Remove from attempted list on success so it can be re-attempted if needed again
            attemptedResignOrders.current.delete(order.id);
          } else {
            console.error(`\u274c Failed to update signature for order ${order.id}:`, updateResult.error);
          }
        } catch (err: any) {
          // User cancelled signature or error occurred
          if (err.code === 4001 || err.message?.includes('User rejected')) {
            console.warn(`\u274c User cancelled re-signing order ${order.id}`);
            // Mark as cancelled in backend
            try {
              await fetch(`${BACKEND_API_URL}/api/tap-to-trade/cancel-order`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  orderId: order.id,
                  trader: traderAddress,
                }),
              });
            } catch (cancelErr) {
              console.error('Failed to cancel order:', cancelErr);
            }
          } else {
            console.error(`\u274c Error re-signing order ${order.id}:`, err);
          }
        }
      }
    } catch (err) {
      console.error('Error checking for orders to re-sign:', err);
    }
  };

  // Poll for orders that need re-signing
  useEffect(() => {
    if (isEnabled && gridSession) {
      // Check immediately
      checkAndResignOrders();

      // Then check every 15 seconds (not too frequent to avoid spam)
      resignIntervalRef.current = setInterval(checkAndResignOrders, 15000);

      return () => {
        if (resignIntervalRef.current) {
          clearInterval(resignIntervalRef.current);
        }
      };
    }
  }, [isEnabled, gridSession, user?.wallet?.address, wallets]);

  // Auto-disable tap-to-trade when session expires
  useEffect(() => {
    if (!isEnabled || !sessionKey) return;

    const checkSessionExpiry = () => {
      if (!isSessionValid()) {
        console.log('⏰ Session expired, disabling tap-to-trade...');
        // Auto-disable tap-to-trade mode
        toggleMode();
      }
    };

    // Check every 10 seconds
    const interval = setInterval(checkSessionExpiry, 10000);

    return () => clearInterval(interval);
  }, [isEnabled, sessionKey, isSessionValid]);

  const toggleMode = async (params?: {
    symbol: string;
    margin: string;
    leverage: number;
    timeframe: string;
    currentPrice: number;
  }) => {
    if (isEnabled) {
      // DISABLE mode - Cancel grid session
      if (gridSession) {
        try {
          setIsLoading(true);
          
          // Get Privy embedded wallet
          const embeddedWallet = wallets.find((w) => w.walletClientType === 'privy');
          const traderAddress = embeddedWallet?.address || gridSession.trader;
          
          await fetch(`${BACKEND_API_URL}/api/grid/cancel-session`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              gridId: gridSession.id,
              trader: traderAddress,
            }),
          });

          setGridSession(null);
        } catch (err: any) {
          console.error('Failed to cancel grid session:', err);
        } finally {
          setIsLoading(false);
        }
      }

      // Clear cell orders when disabling
      setCellOrders(new Map());
      setIsEnabled(false);
      setError(null);
      setLocalNonce(BigInt(0)); // Reset nonce
      attemptedResignOrders.current.clear(); // Clear attempted re-sign tracking

      // Clear session key
      if (sessionKey) {
        clearSession();
        console.log('Session key cleared');
      }

      console.log(`\ud83c\udfaf Tap to Trade mode: DISABLED`);

    } else {
      // ENABLE mode - Create grid session
      if (!params) {
        setError('Missing parameters to enable tap-to-trade');
        return;
      }

      if (!user?.wallet?.address) {
        setError('Wallet not connected');
        return;
      }

      // Get Privy embedded wallet for tap-to-trade
      const embeddedWallet = wallets.find((w) => w.walletClientType === 'privy');
      if (!embeddedWallet) {
        setError('Privy embedded wallet not found. Tap-to-trade requires Privy AA wallet.');
        return;
      }

      const traderAddress = embeddedWallet.address;
      console.log('💼 Using Privy wallet for tap-to-trade:', traderAddress);

      setIsLoading(true);
      setError(null);

      try {
        // Convert timeframe to seconds
        const timeframeMap: { [key: string]: number } = {
          '1': 60,
          '5': 300,
          '15': 900,
          '30': 1800,
          '60': 3600,
          '240': 14400,
          'D': 86400,
          'W': 604800,
        };
        const timeframeSeconds = timeframeMap[params.timeframe] || 60;

        // Convert price to 8 decimals (contract format)
        const priceWith8Decimals = Math.round(params.currentPrice * 100000000).toString();

        // Convert margin to base units (6 decimals for USDC)
        const marginInBaseUnits = (parseFloat(params.margin) * 1000000).toString();

        // Convert gridSizeY from % to basis points (0.5% = 50 basis points)
        const gridSizeYPercent = Math.round(gridSizeY * 100);

        // Calculate reference time - snap to start of current timeframe window
        const nowSeconds = Math.floor(Date.now() / 1000);
        const columnDurationSeconds = gridSizeX * timeframeSeconds;
        const referenceTimeSnapped = Math.floor(nowSeconds / columnDurationSeconds) * columnDurationSeconds;
        
        console.log('📅 Reference time calculation:');
        console.log('  nowSeconds:', new Date(nowSeconds * 1000).toISOString());
        console.log('  timeframeSeconds:', timeframeSeconds);
        console.log('  gridSizeX:', gridSizeX);
        console.log('  columnDurationSeconds:', columnDurationSeconds);
        console.log('  referenceTimeSnapped:', new Date(referenceTimeSnapped * 1000).toISOString());

        const response = await fetch(`${BACKEND_API_URL}/api/grid/create-session`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            trader: traderAddress,
            symbol: params.symbol,
            marginTotal: marginInBaseUnits,
            leverage: params.leverage,
            timeframeSeconds,
            gridSizeX,
            gridSizeYPercent,
            referenceTime: referenceTimeSnapped,
            referencePrice: priceWith8Decimals,
            chain: selectedChain, // Multi-chain support
          }),
        });

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || 'Failed to create grid session');
        }

        const session = result.data as GridSession;
        setGridSession(session);

        setIsEnabled(true);

        // Initialize nonce from contract when enabling
        await initializeNonce();

        console.log('✅ Grid session created:', session.id);

        // Create session key ONLY for open-position mode (tap-to-trade)
        // One Tap Profit mode doesn't need session key (signs each trade)
        if (tradeMode === 'open-position') {
          try {
            const walletClient = await embeddedWallet.getEthereumProvider();
            if (!walletClient) {
              throw new Error('Could not get wallet client');
            }

            console.log('🔑 Step 1: Creating ephemeral session key for Tap-to-Trade...');
            const newSession = await createSession(
              traderAddress,
              walletClient,
              30 * 60 * 1000 // 30 minutes
            );

            if (!newSession) {
              throw new Error('Failed to create session key');
            }

            console.log('✅ Session key created:', newSession.address);

          // Step 2: Register session key with backend (NO ON-CHAIN TX!)
          console.log('🔑 Step 2: Registering session key with backend (100% GASLESS!)...');
          console.log('⚡ No transaction needed - backend validates session off-chain!');
          
          try {
            // We skip on-chain authorization for 100% gasless experience
            // Backend will validate session signature for each order
            const sessionDurationSeconds = 30 * 60; // 30 minutes in seconds
            const expiresAtSeconds = Math.floor(newSession.expiresAt / 1000);
            
            // Create authorization message EXACTLY matching smart contract format
            // Smart contract uses: keccak256(abi.encodePacked("Authorize session key ", address, " for Tethra Tap-to-Trade until ", uint256))
            // We need to encode address and uint256 as bytes, not as string!
            
            // IMPORTANT: Convert address to checksum format
            const sessionAddressChecksum = newSession.address as `0x${string}`;
            
            console.log('🔍 DEBUG: Authorization encoding:');
            console.log('   Session address (raw):', newSession.address);
            console.log('   Session address (checksum):', sessionAddressChecksum);
            console.log('   Expires at (ms):', newSession.expiresAt);
            console.log('   Expires at (seconds):', expiresAtSeconds);
            console.log('   Duration (seconds):', sessionDurationSeconds);
            
            const authMessageHash = keccak256(
              encodePacked(
                ['string', 'address', 'string', 'uint256'],
                [
                  'Authorize session key ',
                  sessionAddressChecksum,
                  ' for Tethra Tap-to-Trade until ',
                  BigInt(expiresAtSeconds)
                ]
              )
            );

            console.log('📝 Authorization message hash:', authMessageHash);
            console.log('📝 Session authSignature (from useSessionKey):', newSession.authSignature);
            
            // IMPORTANT: Use the authSignature that was already created in createSession()
            // Don't sign again here - it will create different signature!
            const authSignature = newSession.authSignature;
            
            console.log('✅ Using authorization signature from session:', authSignature);
            
            // DEBUG: Verify signature locally before sending to contract
            try {
              const { recoverMessageAddress } = await import('viem');
              const recovered = await recoverMessageAddress({
                message: { raw: authMessageHash },
                signature: authSignature as `0x${string}`,
              });
              console.log('🔍 Local signature verification:');
              console.log('   Recovered signer:', recovered);
              console.log('   Expected signer (trader):', traderAddress);
              console.log('   Match?', recovered.toLowerCase() === traderAddress.toLowerCase());
              
              if (recovered.toLowerCase() !== traderAddress.toLowerCase()) {
                throw new Error(`Signature mismatch! Recovered: ${recovered}, Expected: ${traderAddress}`);
              }
            } catch (verifyErr: any) {
              console.error('❌ Local verification failed:', verifyErr);
              throw verifyErr;
            }

            // Call authorizeSessionKey on TapToTradeExecutor contract
            const TapToTradeExecutorABI = [
              {
                inputs: [
                  { name: 'sessionKeyAddress', type: 'address' },
                  { name: 'duration', type: 'uint256' },
                  { name: 'authSignature', type: 'bytes' }
                ],
                name: 'authorizeSessionKey',
                outputs: [],
                stateMutability: 'nonpayable',
                type: 'function',
              },
            ];

            const authData = encodeFunctionData({
              abi: TapToTradeExecutorABI,
              functionName: 'authorizeSessionKey',
              args: [
                newSession.address as `0x${string}`,
                BigInt(sessionDurationSeconds),
                authSignature as `0x${string}`
              ],
            });

            // Send authorization request to backend
            // Backend will call authorizeSessionKey() on contract and pay gas!
            // Skip backend authorization - we only need local session storage!
            // Backend will validate session signature when orders are executed
            console.log('✅ Session key registered locally!');
            console.log('🔐 Backend will validate session off-chain (no on-chain registration needed)');
            console.log('⚡ This is 100% GASLESS - no transactions, no gas fees!');
            
            // No need to call backend for authorization
            // Session is stored in localStorage and validated by backend on each order

            console.log('🎉 SUCCESS! Session ready - you can trade without popups for 30 minutes!');
            console.log('⚡ Just tap grid cells to place orders - NO MORE POPUPS!');
          } catch (authErr: any) {
            console.error('❌ Failed to setup session key:', authErr);
            clearSession();
            throw new Error(`Session setup failed: ${authErr.message}. Please try again.`);
          }
          } catch (sessionErr: any) {
            console.error('❌ Failed to setup session key:', sessionErr);
            // Don't fail the entire enable if session creation fails
            // User can still use with regular signatures
            setError(`Session setup failed: ${sessionErr.message}`);
          }
        } else {
          // One Tap Profit mode - skip session key setup
          console.log('⚡ One Tap Profit mode: No session key needed');
          console.log('✅ Each trade will be signed individually (more secure)');
        }

        console.log(`🎯 Tap to Trade mode: ENABLED`);

      } catch (err: any) {
        setError(err.message || 'Failed to enable tap-to-trade');
        console.error('Failed to create grid session:', err);
      } finally {
        setIsLoading(false);
      }
    }
  };

  /**
   * Handle cell click - immediately create order in backend
   * Each click creates a new order (accumulate, not toggle)
   */
  const handleCellClick = async (cellX: number, cellY: number) => {
    if (!isEnabled || !gridSession || !user?.wallet?.address) {
      console.warn('Cannot create order: mode not enabled or session not found');
      return;
    }

    // Prevent multiple orders from being created simultaneously (nonce collision)
    if (isCreatingOrder) {
      console.warn('⏳ Please wait, another order is being created...');
      return;
    }

    setIsCreatingOrder(true);
    setIsLoading(true);
    setError(null);

    try {
      // Calculate trigger price based on grid position
      const referencePrice = parseFloat(gridSession.referencePrice) / 100000000; // Convert from 8 decimals
      const gridSizeYPercent = gridSession.gridSizeYPercent / 100; // Convert from basis points to %
      const priceChange = (cellY * gridSizeYPercent / 100) * referencePrice;
      const triggerPrice = referencePrice + priceChange;
      const triggerPriceWith8Decimals = Math.round(triggerPrice * 100000000).toString();

      // Calculate time window based on grid position
      const columnDurationSeconds = Math.max(1, gridSession.gridSizeX * gridSession.timeframeSeconds);
      const startTime = gridSession.referenceTime + (cellX * columnDurationSeconds);
      const endTime = startTime + columnDurationSeconds;

      // Determine if LONG or SHORT based on trigger price vs reference price
      // LONG: buy when price is LOW (trigger below reference) - profit when price goes UP
      // SHORT: sell when price is HIGH (trigger above reference) - profit when price goes DOWN
      const isLong = cellY < 0; // Below reference = LONG, Above reference = SHORT

      // Each cell click = 1 full order with entire margin amount
      // If user taps same cell 2x, it creates 2 separate orders with full margin each
      const collateralPerOrder = gridSession.marginTotal;

      // Find embedded wallet - try multiple approaches
      console.log('🔍 Looking for embedded wallet...');
      console.log('Available wallets:', wallets.map(w => ({ 
        type: w.walletClientType, 
        address: w.address,
        connectorType: w.connectorType 
      })));
      console.log('User wallet address:', user.wallet.address);
      console.log('User wallet type:', user.wallet.walletClientType);
      
      // ALWAYS use Privy embedded wallet for tap-to-trade (gasless with AA)
      const embeddedWallet = wallets.find((w) => w.walletClientType === 'privy');

      if (!embeddedWallet) {
        console.error('❌ No Privy embedded wallet found in wallets array');
        throw new Error('Privy embedded wallet not found. Tap-to-trade requires Privy AA wallet.');
      }
      
      console.log('✅ Using Privy embedded wallet for tap-to-trade:', embeddedWallet.address);
      
      // Use embedded wallet address as trader (not the currently active wallet)
      const traderAddress = embeddedWallet.address;

      // Get wallet provider (EIP-1193)
      const walletClient = await embeddedWallet.getEthereumProvider();
      if (!walletClient) {
        throw new Error('Could not get wallet client');
      }

      // Get chain-specific contract addresses
      const chainConfig = getChainConfig(selectedChain);
      const tapToTradeExecutorAddress = chainConfig.contracts.tapToTradeExecutor;

      console.log(`🔗 Using ${selectedChain} chain contracts:`, {
        tapToTradeExecutor: tapToTradeExecutorAddress,
        chainId: chainConfig.id,
      });

      // ALWAYS fetch fresh nonce from contract for each order
      // This prevents signature failures due to stale nonce
      const MarketExecutorABI = [
        {
          inputs: [{ name: '', type: 'address' }],
          name: 'metaNonces',
          outputs: [{ name: '', type: 'uint256' }],
          stateMutability: 'view',
          type: 'function',
        },
      ];

      const nonceData = encodeFunctionData({
        abi: MarketExecutorABI,
        functionName: 'metaNonces',
        args: [traderAddress as `0x${string}`],
      });

      const nonceResult = await walletClient.request({
        method: 'eth_call',
        params: [{
          to: tapToTradeExecutorAddress,
          data: nonceData,
        }, 'latest'],
      });

      // Handle empty result (0x means 0)
      const currentNonce = nonceResult === '0x' || !nonceResult
        ? BigInt(0)
        : BigInt(nonceResult as string);

      console.log('✅ Fetched fresh nonce from contract:', currentNonce.toString());

      // Sign order message with chain-specific contract address
      const messageHash = keccak256(
        encodePacked(
          ['address', 'string', 'bool', 'uint256', 'uint256', 'uint256', 'address'],
          [
            traderAddress as `0x${string}`,
            gridSession.symbol,
            isLong,
            BigInt(collateralPerOrder),
            BigInt(gridSession.leverage),
            currentNonce,
            tapToTradeExecutorAddress as `0x${string}`
          ]
        )
      );

      let signature: string;
      let usedSessionKey = false; // Track if we actually used session key

      // Check if we have a valid session key
      console.log('🔍 Session key status:', {
        hasSessionKey: !!sessionKey,
        isValid: isSessionValid(),
        sessionAddress: sessionKey?.address,
        expiresAt: sessionKey?.expiresAt,
        now: Date.now(),
      });

      // Use session key if available and valid AND in open-position mode (NO POPUP!)
      // One Tap Profit mode always uses user signature for security
      if (tradeMode === 'open-position' && isSessionValid()) {
        console.log('✍️ Attempting to sign with session key (NO USER PROMPT!)...');
        console.log('📝 Message hash to sign:', messageHash);
        console.log('🔑 Session key address:', sessionKey?.address);

        try {
          const sessionSignature = await signWithSession(messageHash);

          if (!sessionSignature) {
            throw new Error('Session signature returned null');
          }

          signature = sessionSignature;
          usedSessionKey = true; // Mark that we used session key
          console.log('✅ Signature obtained (automatically with session key!)');
          console.log('🔑 Session signature:', sessionSignature);
          console.log('⚡ No popup, no waiting - instant signing!');
        } catch (sessionError: any) {
          console.error('⚠️ Session signature failed:', sessionError.message);
          console.warn('   Falling back to traditional signature with user popup...');

          // Fallback to traditional signature if session fails
          const userSignature = await walletClient.request({
            method: 'personal_sign',
            params: [messageHash, traderAddress],
          });
          signature = userSignature as string;
          usedSessionKey = false; // IMPORTANT: Mark as NOT using session key
          console.log('✅ Using user signature as fallback (session key failed)');
        }
      } else {
        // Fallback: request signature from user (with popup)
        if (tradeMode === 'one-tap-profit') {
          console.log('⚡ One Tap Profit mode - requesting signature from user for security...');
        } else {
          console.log('⚠️ No valid session key, requesting signature from user...');
          console.log('💡 TIP: Enable Tap-to-Trade mode to avoid signature popups!');
        }
        console.log('📝 Message hash to sign:', messageHash);
        const userSignature = await walletClient.request({
          method: 'personal_sign',
          params: [messageHash, traderAddress],
        });

        if (!userSignature) {
          throw new Error('Failed to obtain signature');
        }

        signature = userSignature as string;
        usedSessionKey = false; // Explicitly mark as NOT using session key
        console.log('✅ Signature obtained from user (with popup)');
        console.log('🔑 User signature:', userSignature);
      }

      // Create order in backend
      const cellId = `${cellX},${cellY}`;

      // Prepare order data with optional session key info and chain parameter
      const orderData: any = {
        gridSessionId: gridSession.id,
        cellId,
        trader: traderAddress,
        symbol: gridSession.symbol,
        isLong,
        collateral: collateralPerOrder,
        leverage: gridSession.leverage,
        triggerPrice: triggerPriceWith8Decimals,
        startTime,
        endTime,
        nonce: currentNonce.toString(),
        signature,
        chain: selectedChain, // Multi-chain support - tell backend which chain to execute on
      };

      // ONLY add session key info if we actually used session key for signing
      if (usedSessionKey && sessionKey) {
        orderData.sessionKey = {
          address: sessionKey.address,
          expiresAt: sessionKey.expiresAt,
          authorizedBy: sessionKey.authorizedBy,
          authSignature: sessionKey.authSignature,
        };
        console.log(`🔑 Including session key in order (${selectedChain} chain):`, {
          sessionKeyAddress: sessionKey.address,
          usedSessionKey: true,
        });
      } else {
        console.log(`📝 Using direct user signature (${selectedChain} chain) - no session key attached`);
      }

      console.log(`📤 Sending order to backend (${selectedChain} chain):`, {
        ...orderData,
        signature: orderData.signature.substring(0, 20) + '...',
        hasSessionKey: !!orderData.sessionKey,
      });

      const response = await fetch(`${BACKEND_API_URL}/api/tap-to-trade/batch-create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gridSessionId: gridSession.id,
          orders: [orderData]
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to create order');
      }

      // Update cell order count for visual feedback
      setCellOrders(prev => {
        const newMap = new Map(prev);
        const existing = newMap.get(cellId);
        if (existing) {
          newMap.set(cellId, {
            ...existing,
            orderCount: existing.orderCount + 1,
          });
        } else {
          newMap.set(cellId, {
            cellX,
            cellY,
            orderCount: 1,
            triggerPrice: triggerPriceWith8Decimals,
            startTime,
            endTime,
            isLong,
          });
        }
        return newMap;
      });

      console.log(`✅ Order created for cell (${cellX}, ${cellY})`);

    } catch (err: any) {
      setError(err.message || 'Failed to create order');
      console.error('Failed to create order:', err);
    } finally {
      setIsLoading(false);
      setIsCreatingOrder(false);
    }
  };

  return (
    <TapToTradeContext.Provider
      value={{
        isEnabled,
        tradeMode,
        setTradeMode,
        toggleMode,
        gridSizeX,
        gridSizeY,
        setGridSizeX,
        setGridSizeY,
        betAmount,
        setBetAmount,
        handleCellClick,
        cellOrders,
        sessionKey,
        sessionTimeRemaining: getTimeRemaining(),
        gridSession,
        isLoading,
        error,
        isBinaryTradingEnabled,
        setIsBinaryTradingEnabled,
      }}
    >
      {children}
    </TapToTradeContext.Provider>
  );
};

export const useTapToTrade = () => {
  const context = useContext(TapToTradeContext);
  if (context === undefined) {
    throw new Error('useTapToTrade must be used within a TapToTradeProvider');
  }
  return context;
};

'use client';

import React, { useEffect, useState } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { usePublicClient } from 'wagmi';
import { formatUnits, parseUnits, encodeFunctionData } from 'viem';
import { Droplets, TrendingUp, Clock } from 'lucide-react';

// Use type assertion for window.ethereum to avoid global declaration conflicts

const LIQUIDITY_MINING = process.env.NEXT_PUBLIC_LIQUIDITY_MINING_ADDRESS as `0x${string}`;
const USDC_TOKEN = process.env.NEXT_PUBLIC_USDC_TOKEN_ADDRESS as `0x${string}`;

const usdcABI = [
  {
    inputs: [{ internalType: 'address', name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'spender', type: 'address' },
      { internalType: 'uint256', name: 'amount', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'owner', type: 'address' },
      { internalType: 'address', name: 'spender', type: 'address' },
    ],
    name: 'allowance',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

const liquidityMiningABI = [
  {
    inputs: [],
    name: 'totalLiquidity',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'amount', type: 'uint256' }],
    name: 'addLiquidity',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'provider', type: 'address' }],
    name: 'getProviderInfo',
    outputs: [
      { internalType: 'uint256', name: 'amount', type: 'uint256' },
      { internalType: 'uint256', name: 'pendingRewards', type: 'uint256' },
      { internalType: 'uint256', name: 'depositedAt', type: 'uint256' },
      { internalType: 'bool', name: 'canWithdrawWithoutPenalty', type: 'bool' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'calculateAPR',
    outputs: [{ internalType: 'uint256', name: 'apr', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

interface LiquidityProvisionProps {
  className?: string;
}

export default function LiquidityProvision({ className = '' }: LiquidityProvisionProps) {
  const { ready, authenticated, login } = usePrivy();
  const { wallets } = useWallets();
  const publicClient = usePublicClient();
  
  // State for contract data
  const [userBalance, setUserBalance] = useState<bigint>(BigInt(0));
  const [totalLiquidity, setTotalLiquidity] = useState<bigint>(BigInt(0));
  const [allowance, setAllowance] = useState<bigint>(BigInt(0));
  const [userLiquidityAmount, setUserLiquidityAmount] = useState<bigint>(BigInt(0));
  const [pendingRewards, setPendingRewards] = useState<bigint>(BigInt(0));
  const [apr, setApr] = useState<bigint>(BigInt(0));
  const [isLoading, setIsLoading] = useState(true);
  const [liquidityAmount, setLiquidityAmount] = useState('');
  const [isTransacting, setIsTransacting] = useState(false);

  // Get external wallet (MetaMask, etc.) for liquidity provision
  const externalWallet = wallets.find(wallet => 
    wallet.walletClientType === 'metamask' || 
    wallet.walletClientType === 'coinbase_wallet' ||
    wallet.walletClientType === 'wallet_connect' ||
    (wallet.walletClientType !== 'privy' && wallet.connectorType !== 'embedded')
  );
  const userAddress = externalWallet?.address;

  // Fetch contract data function (reusable)
  const fetchContractData = async () => {
    if (!publicClient || !userAddress) {
      setIsLoading(false);
      return;
    }

    try {
      console.log('Fetching liquidity mining data for:', userAddress);
      const [balance, liquidity, currentAllowance, providerInfo, currentAPR] = await Promise.all([
        publicClient.readContract({
          address: USDC_TOKEN,
          abi: usdcABI,
          functionName: 'balanceOf',
          args: [userAddress as `0x${string}`],
        }),
        publicClient.readContract({
          address: LIQUIDITY_MINING,
          abi: liquidityMiningABI,
          functionName: 'totalLiquidity',
        }),
        publicClient.readContract({
          address: USDC_TOKEN,
          abi: usdcABI,
          functionName: 'allowance',
          args: [userAddress as `0x${string}`, LIQUIDITY_MINING],
        }),
        publicClient.readContract({
          address: LIQUIDITY_MINING,
          abi: liquidityMiningABI,
          functionName: 'getProviderInfo',
          args: [userAddress as `0x${string}`],
        }),
        publicClient.readContract({
          address: LIQUIDITY_MINING,
          abi: liquidityMiningABI,
          functionName: 'calculateAPR',
        }),
      ]);

      console.log('Liquidity mining data fetched:', {
        balance: balance.toString(),
        liquidity: liquidity.toString(), 
        allowance: currentAllowance.toString(),
        providerInfo: providerInfo,
        apr: currentAPR.toString()
      });

      setUserBalance(balance as bigint);
      setTotalLiquidity(liquidity as bigint);
      setAllowance(currentAllowance as bigint);
      setApr(currentAPR as bigint);
      
      // Parse provider info
      if (providerInfo && Array.isArray(providerInfo)) {
        console.log('Setting user liquidity amount:', providerInfo[0].toString());
        setUserLiquidityAmount(providerInfo[0] as bigint);
        setPendingRewards(providerInfo[1] as bigint);
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching liquidity mining data:', error);
      setIsLoading(false);
    }
  };

  // Fetch contract data on component mount and when dependencies change
  useEffect(() => {
    fetchContractData();
  }, [publicClient, userAddress]);

  const switchToBaseSepolia = async () => {
    const ethereum = (window as any).ethereum;
    if (!ethereum) return;
    
    try {
      // Try to switch to Base Sepolia
      await ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x14a34' }], // 84532 in hex
      });
    } catch (switchError: any) {
      // Chain not added to MetaMask, add it
      if (switchError.code === 4902) {
        try {
          await ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: '0x14a34',
              chainName: 'Base Sepolia',
              nativeCurrency: {
                name: 'ETH',
                symbol: 'ETH',
                decimals: 18,
              },
              rpcUrls: ['https://sepolia.base.org'],
              blockExplorerUrls: ['https://sepolia.basescan.org'],
            }],
          });
        } catch (addError) {
          console.error('Failed to add Base Sepolia network:', addError);
          throw new Error('Please add Base Sepolia network to MetaMask manually');
        }
      } else {
        console.error('Failed to switch network:', switchError);
        throw switchError;
      }
    }
  };

  const handleApproveAndAddLiquidity = async () => {
    if (!liquidityAmount || !userAddress) {
      alert('Please enter an amount and make sure wallet is connected');
      return;
    }

    const ethereum = (window as any).ethereum;
    if (!ethereum) {
      alert('Please install MetaMask or connect an external wallet');
      return;
    }
    
    setIsTransacting(true);
    
    try {
      // Switch to Base Sepolia first
      console.log('Switching to Base Sepolia...');
      await switchToBaseSepolia();
      console.log('Network switched successfully!');
      
      const amount = parseUnits(liquidityAmount, 6); // USDC has 6 decimals
      
      // Check if approval is needed
      if (allowance < amount) {
        console.log('Approving USDC...');
        
        // Prepare approve transaction data
        const approveData = encodeFunctionData({
          abi: usdcABI,
          functionName: 'approve',
          args: [LIQUIDITY_MINING, amount],
        });
        
        // Send approve transaction
        const approveTxHash = await ethereum.request({
          method: 'eth_sendTransaction',
          params: [{
            from: userAddress,
            to: USDC_TOKEN,
            data: approveData,
          }],
        });
        
        console.log('Approve tx hash:', approveTxHash);
        
        // Wait for approval to be confirmed
        await publicClient!.waitForTransactionReceipt({ hash: approveTxHash });
        console.log('Approval confirmed!');
        
        // Refresh allowance
        const newAllowance = await publicClient!.readContract({
          address: USDC_TOKEN,
          abi: usdcABI,
          functionName: 'allowance',
          args: [userAddress as `0x${string}`, LIQUIDITY_MINING],
        });
        setAllowance(newAllowance);
      }
      
      console.log('Adding liquidity...');
      
      // Prepare add liquidity transaction data
      const addLiquidityData = encodeFunctionData({
        abi: liquidityMiningABI,
        functionName: 'addLiquidity',
        args: [amount],
      });
      
      // Send add liquidity transaction
      const liquidityTxHash = await ethereum.request({
        method: 'eth_sendTransaction',
        params: [{
          from: userAddress,
          to: LIQUIDITY_MINING,
          data: addLiquidityData,
        }],
      });
      
      console.log('Add liquidity tx hash:', liquidityTxHash);
      
      // Wait for liquidity addition to be confirmed
      await publicClient!.waitForTransactionReceipt({ hash: liquidityTxHash });
      console.log('Liquidity addition confirmed!');
      
      // Refresh all contract data immediately after successful transaction
      console.log('Refreshing contract data...');
      await fetchContractData();
      
      setLiquidityAmount('');
      alert('Liquidity added successfully! Data refreshed.');
      
    } catch (error) {
      console.error('Transaction failed:', error);
      alert('Transaction failed: ' + (error as any).message);
    } finally {
      setIsTransacting(false);
    }
  };

  const handleConnect = () => {
    login();
  };

  if (!ready) {
    return (
      <div className={`bg-slate-900/50 rounded-lg border border-slate-800 p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-700 rounded w-48 mb-6"></div>
          <div className="h-32 bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-slate-900/50 rounded-lg border border-slate-800 p-6 ${className}`}>
      <div className="flex items-center gap-2 mb-6">
        <Droplets className="text-blue-400" size={24} />
        <h2 className="text-xl font-bold text-white">USDC Liquidity Mining</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-slate-800/50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={16} className="text-green-400" />
            <span className="text-sm text-gray-400">Current APR</span>
          </div>
          <p className="text-lg font-semibold text-white">
            {isLoading ? '...' : `${(Number(apr) / 100).toFixed(2)}%`}
          </p>
        </div>

        <div className="bg-slate-800/50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Droplets size={16} className="text-blue-400" />
            <span className="text-sm text-gray-400">Total Liquidity</span>
          </div>
          <p className="text-lg font-semibold text-white">
            {isLoading ? '...' : `${Number(formatUnits(totalLiquidity, 6)).toFixed(2)} USDC`}
          </p>
        </div>

        <div className="bg-slate-800/50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock size={16} className="text-yellow-400" />
            <span className="text-sm text-gray-400">Lock Period</span>
          </div>
          <p className="text-lg font-semibold text-white">14 days</p>
        </div>
      </div>

      <div className="bg-slate-800/30 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-white">Your Liquidity</h3>
          <button 
            onClick={() => fetchContractData()}
            className="text-blue-400 hover:text-blue-300 text-sm"
            disabled={isLoading}
          >
            {isLoading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-400">Provided Amount</p>
              <p className="font-semibold text-white">
                {isLoading ? '...' : `${Number(formatUnits(userLiquidityAmount, 6)).toFixed(2)} USDC`}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Pending Rewards</p>
              <p className="font-semibold text-green-400">
                {isLoading ? '...' : `${Number(formatUnits(pendingRewards, 18)).toFixed(2)} TETH`}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Available Balance</p>
              <p className="font-semibold text-white">
                {isLoading ? '...' : `${Number(formatUnits(userBalance, 6)).toFixed(2)} USDC`}
              </p>
            </div>
        </div>
      </div>

      {authenticated && userAddress ? (
        <>
          <div className="bg-slate-800/30 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-white mb-3">Your Wallet</h3>
            <div className="text-sm text-gray-400">
              <p>Connected: {userAddress.slice(0, 6)}...{userAddress.slice(-4)}</p>
              <p className="mt-1">Ready for liquidity transactions</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Amount to Provide (USDC)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={liquidityAmount}
                  onChange={(e) => setLiquidityAmount(e.target.value)}
                  placeholder="0.0"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                />
                <button 
                  onClick={() => setLiquidityAmount(Number(formatUnits(userBalance, 6)).toFixed(2))}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-blue-400 text-sm hover:text-blue-300"
                >
                  MAX
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Minimum: 100 USDC • Lock period: 14 days • Early withdrawal penalty: 15%
              </p>
            </div>
            
            <button 
              onClick={handleApproveAndAddLiquidity}
              disabled={!liquidityAmount || Number(liquidityAmount) <= 0 || isTransacting}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-3 rounded-lg transition-colors"
            >
              {isTransacting ? 'Processing...' : 
               (allowance >= parseUnits(liquidityAmount || '0', 6) ? 'Add Liquidity' : 'Approve & Add Liquidity')}
            </button>
          </div>
        </>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-400 mb-4">
            {authenticated 
              ? 'Connect an external wallet (MetaMask, etc.) to provide liquidity'
              : 'Connect your wallet to start providing USDC liquidity'
            }
          </p>
          <button 
            onClick={handleConnect}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
          >
            {authenticated ? 'Connect External Wallet' : 'Connect Wallet'}
          </button>
        </div>
      )}
    </div>
  );
}
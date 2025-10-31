'use client';

import React from 'react';
import { BarChart3, TrendingUp, Users, DollarSign } from 'lucide-react';
import usePoolData from '../hooks/usePoolData';

interface AnalyticsDashboardProps {
  className?: string;
}

export default function AnalyticsDashboard({ className = '' }: AnalyticsDashboardProps) {
  const poolData = usePoolData();

  const statsCards = [
    {
      title: 'Total Value Locked',
      value: poolData.totalTVL,
      icon: DollarSign,
      color: 'text-blue-400',
      bgColor: 'bg-blue-900/20',
      change: '+12.5%',
      changeColor: 'text-green-400',
    },
    {
      title: 'Liquidity Pool TVL',
      value: poolData.liquidityPoolTVL,
      icon: BarChart3,
      color: 'text-purple-400',
      bgColor: 'bg-purple-900/20',
      change: '+8.3%',
      changeColor: 'text-green-400',
    },
    {
      title: 'Total Staked TETH',
      value: poolData.stakingTVL,
      icon: Users,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-900/20',
      change: '+5.7%',
      changeColor: 'text-green-400',
    },
    {
      title: 'Fees Collected',
      value: poolData.totalFeesCollected,
      icon: TrendingUp,
      color: 'text-green-400',
      bgColor: 'bg-green-900/20',
      change: '+15.2%',
      changeColor: 'text-green-400',
    },
  ];

  const performanceMetrics = [
    {
      label: 'Staking APR',
      value: poolData.stakingAPR,
      description: 'Current staking rewards rate',
    },
    {
      label: 'Mining APR',
      value: poolData.miningAPR,
      description: 'Liquidity mining rewards rate',
    },
    {
      label: 'Total Rewards',
      value: poolData.totalRewardsDistributed,
      description: 'Total rewards distributed to users',
    },
  ];

  if (poolData.isLoading) {
    return (
      <div className={`bg-slate-900/50 rounded-lg border border-slate-800 p-6 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-700 rounded w-48"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-slate-900/50 rounded-lg border border-slate-800 p-6 ${className}`}>
      <div className="flex items-center gap-2 mb-6">
        <BarChart3 className="text-blue-400" size={24} />
        <h2 className="text-xl font-bold text-white">Protocol Analytics</h2>
      </div>

      {poolData.error && (
        <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 mb-6">
          <p className="text-red-400 text-sm">Error loading data: {poolData.error}</p>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statsCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <Icon size={20} className={stat.color} />
                </div>
                <span className={`text-xs font-medium ${stat.changeColor}`}>
                  {stat.change}
                </span>
              </div>
              <h3 className="text-sm text-gray-400 mb-1">{stat.title}</h3>
              <p className="text-lg font-semibold text-white">{stat.value}</p>
            </div>
          );
        })}
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {performanceMetrics.map((metric, index) => (
          <div key={index} className="bg-slate-800/30 rounded-lg p-4 border border-slate-700/50">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-white">{metric.label}</h4>
              <TrendingUp size={16} className="text-green-400" />
            </div>
            <p className="text-2xl font-bold text-green-400 mb-1">{metric.value}</p>
            <p className="text-xs text-gray-400">{metric.description}</p>
          </div>
        ))}
      </div>

      {/* Additional Insights */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Protocol Health */}
        <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-700/50">
          <h4 className="font-medium text-white mb-4">Protocol Health</h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Fee Distribution</span>
              <span className="text-sm text-white">60% LP | 30% Staking | 10% Treasury</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Network</span>
              <span className="text-sm text-blue-400">Base Sepolia</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Status</span>
              <span className="text-sm text-green-400 flex items-center gap-1">
                <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                Active
              </span>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-700/50">
          <h4 className="font-medium text-white mb-4">Recent Activity</h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-400">Last fee distribution</span>
              <span className="text-white">2 hours ago</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-400">New stakers</span>
              <span className="text-green-400">+5 today</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-400">Total transactions</span>
              <span className="text-white">1,247</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useGridTrading } from '../hooks/useGridTrading';
import { useMarket } from './MarketContext';

type GridTradingContextType = ReturnType<typeof useGridTrading>;

const GridTradingContext = createContext<GridTradingContextType | null>(null);

export const GridTradingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { currentPrice, timeframe } = useMarket();
  
  const gridTrading = useGridTrading({
    currentPrice: parseFloat(currentPrice) || 0,
    interval: timeframe,
  });

  return (
    <GridTradingContext.Provider value={gridTrading}>
      {children}
    </GridTradingContext.Provider>
  );
};

export const useGridTradingContext = () => {
  const context = useContext(GridTradingContext);
  if (!context) {
    throw new Error('useGridTradingContext must be used within GridTradingProvider');
  }
  return context;
};

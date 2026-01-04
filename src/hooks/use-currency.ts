
"use client";

import { useContext } from 'react';
import { CurrencyContext } from '@/contexts/currency-context';
import type { FormattedCurrency } from '@/contexts/currency-context';

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  
  // Extending formatCurrency to handle cases where it might return an object
  const formatCurrency = (amount: number): FormattedCurrency & { toString: () => string } => {
    const { amount: formattedAmount, symbol } = context.formatCurrency(amount);
    
    return {
      amount: formattedAmount,
      symbol: symbol,
      toString: () => `${formattedAmount} ${symbol}`,
    };
  };

  return { ...context, formatCurrency };
};

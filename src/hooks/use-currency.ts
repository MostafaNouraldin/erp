
"use client";

import { useContext } from 'react';
import { CurrencyContext } from '@/contexts/currency-context';

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};

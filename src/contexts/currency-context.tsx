
"use client";

import React, { createContext, useState, useEffect, ReactNode, Dispatch, SetStateAction } from 'react';

export interface Currency {
  code: string; // e.g., "SAR", "USD", "EUR", "EGP"
  name: string; // e.g., "ريال سعودي", "دولار أمريكي"
  symbol: string; // e.g., "⃁", "$", "€", "E£" 
}

export const availableCurrencies: Currency[] = [
  { code: "SAR", name: "ريال سعودي", symbol: "⃁" },
  { code: "USD", name: "دولار أمريكي", symbol: "$" },
  { code: "EUR", name: "يورو", symbol: "€" },
  { code: "EGP", name: "جنيه مصري", symbol: "E£" },
];

interface CurrencyContextProps {
  selectedCurrency: Currency;
  setSelectedCurrency: Dispatch<SetStateAction<Currency>>;
  formatCurrency: (amount: number) => string;
}

const defaultCurrency = availableCurrencies[0]; // Default to SAR

export const CurrencyContext = createContext<CurrencyContextProps>({
  selectedCurrency: defaultCurrency,
  setSelectedCurrency: () => {},
  formatCurrency: (amount: number) => {
    const { code, symbol } = defaultCurrency;
    const formatted = new Intl.NumberFormat('ar-SA', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
    return `${formatted} ${symbol}`;
  },
});

interface CurrencyProviderProps {
  children: ReactNode;
}

export const CurrencyProvider: React.FC<CurrencyProviderProps> = ({ children }) => {
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(defaultCurrency);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedCurrencyCode = localStorage.getItem('selectedCurrency');
      const initialCurrency = availableCurrencies.find(c => c.code === storedCurrencyCode) || defaultCurrency;
      setSelectedCurrency(initialCurrency);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('selectedCurrency', selectedCurrency.code);
    }
  }, [selectedCurrency]);

  const formatCurrency = (amount: number): string => {
    const { code, symbol } = selectedCurrency;
    const formatted = new Intl.NumberFormat('ar-SA', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
    return `${formatted} ${symbol}`;
  };

  return (
    <CurrencyContext.Provider value={{ selectedCurrency, setSelectedCurrency, formatCurrency }}>
      {children}
    </CurrencyContext.Provider>
  );
};

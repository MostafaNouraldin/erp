
"use client";

import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth'; 
import { getCompanySettings } from '@/app/settings/actions'; 

export interface Currency {
  code: string; 
  name: string; 
  symbol: string; 
}

export const availableCurrencies: Currency[] = [
  { code: "SAR", name: "ريال سعودي", symbol: "⃁" },
  { code: "USD", name: "دولار أمريكي", symbol: "$" },
  { code: "EUR", name: "يورو", symbol: "€" },
  { code: "EGP", name: "جنيه مصري", symbol: "E£" },
];

interface CurrencyContextProps {
  selectedCurrency: Currency;
  updateCurrency: (currencyCode: string) => void;
  formatCurrency: (amount: number) => string;
}

const defaultCurrency = availableCurrencies[0]; 

export const CurrencyContext = createContext<CurrencyContextProps>({
  selectedCurrency: defaultCurrency,
  updateCurrency: () => {},
  formatCurrency: (amount: number) => {
    const { symbol } = defaultCurrency;
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
  const { user, isLoading: isAuthLoading } = useAuth();
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(defaultCurrency);
  const [isCurrencyLoading, setIsCurrencyLoading] = useState(true);

  const updateCurrency = useCallback((currencyCode: string) => {
    const newCurrency = availableCurrencies.find(c => c.code === currencyCode) || defaultCurrency;
    setSelectedCurrency(newCurrency);
  }, []);

  useEffect(() => {
    async function loadCurrencyPreference() {
      if (isAuthLoading) return; // Wait for auth to be resolved

      setIsCurrencyLoading(true);
      if (user?.tenantId) {
        try {
          const settings = await getCompanySettings(user.tenantId);
          if (settings?.defaultCurrency) {
            updateCurrency(settings.defaultCurrency);
          } else {
            setSelectedCurrency(defaultCurrency);
          }
        } catch (error) {
          console.error("Failed to fetch company settings for currency:", error);
          setSelectedCurrency(defaultCurrency);
        }
      } else {
        setSelectedCurrency(defaultCurrency);
      }
      setIsCurrencyLoading(false);
    }
    loadCurrencyPreference();
  }, [user, isAuthLoading, updateCurrency]);

  const formatCurrency = (amount: number): string => {
    const { symbol } = selectedCurrency;
    const formatted = new Intl.NumberFormat('ar-SA', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
    
    return `${formatted} <span class="font-saudi-riyal">${symbol}</span>`;
  };

  // Do not render children until the currency has been loaded to prevent hydration mismatches
  if(isCurrencyLoading && !isAuthLoading && user){
     return null;
  }

  return (
    <CurrencyContext.Provider value={{ selectedCurrency, updateCurrency, formatCurrency }}>
      {children}
    </CurrencyContext.Provider>
  );
};

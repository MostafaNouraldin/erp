
"use client";

import React, { createContext, useState, useEffect, ReactNode, Dispatch, SetStateAction } from 'react';
import { useAuth } from '@/hooks/use-auth'; // Import useAuth
import { getCompanySettings } from '@/app/settings/actions'; // Import server action

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
    const { symbol } = defaultCurrency;
    const formatted = new Intl.NumberFormat('ar-SA', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
    if (defaultCurrency.code === 'SAR') {
        return `${formatted} <span class="srs">${symbol}</span>`;
    }
    return `${formatted} ${symbol}`;
  },
});

interface CurrencyProviderProps {
  children: ReactNode;
}

export const CurrencyProvider: React.FC<CurrencyProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(defaultCurrency);

  useEffect(() => {
    async function loadCurrencyPreference() {
      if (user?.tenantId) {
        try {
          const settings = await getCompanySettings(user.tenantId);
          const currencyCode = settings?.defaultCurrency;
          const userCurrency = availableCurrencies.find(c => c.code === currencyCode) || defaultCurrency;
          setSelectedCurrency(userCurrency);
        } catch (error) {
          console.error("Failed to fetch company settings for currency:", error);
          setSelectedCurrency(defaultCurrency); // Fallback to default
        }
      } else {
        setSelectedCurrency(defaultCurrency); // Fallback for users without tenantId
      }
    }
    loadCurrencyPreference();
  }, [user]);

  const formatCurrency = (amount: number): string => {
    const { symbol } = selectedCurrency;
    const formatted = new Intl.NumberFormat('ar-SA', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
    
    if (selectedCurrency.code === 'SAR') {
        return `${formatted} <span class="srs">${symbol}</span>`;
    }
    return `${formatted} ${symbol}`;
  };

  return (
    <CurrencyContext.Provider value={{ selectedCurrency, setSelectedCurrency, formatCurrency }}>
      {children}
    </CurrencyContext.Provider>
  );
};

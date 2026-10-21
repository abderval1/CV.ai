import React, { createContext, useContext, useState, useEffect } from 'react';

export type SupportedCurrency = 'USD' | 'EUR' | 'AOA' | 'BRL';

export interface CurrencyConfig {
  code: SupportedCurrency;
  symbol: string;
  name: string;
  flag: string;
  exchangeRateToUSD: number; // 1 USD = X in this currency
  format: (amountInUSD: number) => string;
}

export const CURRENCIES: Record<SupportedCurrency, CurrencyConfig> = {
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'Dólar Americano',
    flag: '🇺🇸',
    exchangeRateToUSD: 1,
    format: (amt) => `$${Math.round(amt)}`
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    name: 'Euro (Portugal / UE)',
    flag: '🇪🇺',
    exchangeRateToUSD: 0.92,
    format: (amt) => `€${Math.round(amt * 0.92)}`
  },
  AOA: {
    code: 'AOA',
    symbol: 'Kz',
    name: 'Kwanza (Angola)',
    flag: '🇦🇴',
    exchangeRateToUSD: 915,
    format: (amt) => `${Math.round(amt * 915).toLocaleString('pt-AO')} Kz`
  },
  BRL: {
    code: 'BRL',
    symbol: 'R$',
    name: 'Real (Brasil)',
    flag: '🇧🇷',
    exchangeRateToUSD: 5.4,
    format: (amt) => `R$ ${Math.round(amt * 5.4)}`
  }
};

interface CurrencyContextType {
  currency: SupportedCurrency;
  setCurrency: (c: SupportedCurrency) => void;
  config: CurrencyConfig;
  formatPrice: (amountInUSD: number) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currency, setCurrencyState] = useState<SupportedCurrency>(() => {
    const saved = localStorage.getItem('saas_currency');
    return (saved as SupportedCurrency) || 'USD';
  });

  const setCurrency = (c: SupportedCurrency) => {
    setCurrencyState(c);
    localStorage.setItem('saas_currency', c);
  };

  const config = CURRENCIES[currency] || CURRENCIES.USD;

  const formatPrice = (amountInUSD: number) => {
    return config.format(amountInUSD);
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, config, formatPrice }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};

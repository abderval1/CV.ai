import React, { createContext, useContext, useState, useEffect } from 'react';

export type SupportedCurrency = 'USD' | 'BRL';

export interface CurrencyConfig {
  code: SupportedCurrency;
  symbol: string;
  name: string;
  flag: string;
  exchangeRateToUSD: number; // 1 USD = X in this currency
  format: (amountInUSD: number) => string;
}

const formatDecimal = (val: number) => {
  const rounded = Math.round(val * 100) / 100;
  return Number.isInteger(rounded) ? `${rounded}` : rounded.toFixed(2);
};

export const CURRENCIES: Record<SupportedCurrency, CurrencyConfig> = {
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'Dólar Americano (USD)',
    flag: '🇺🇸',
    exchangeRateToUSD: 1,
    format: (amt) => `$${formatDecimal(amt)}`
  },
  BRL: {
    code: 'BRL',
    symbol: 'R$',
    name: 'Real Brasileiro (BRL)',
    flag: '🇧🇷',
    exchangeRateToUSD: 5.4,
    format: (amt) => `R$ ${formatDecimal(amt * 5.4)}`
  }
};

interface CurrencyContextType {
  currency: SupportedCurrency;
  setCurrency: (c: SupportedCurrency) => void;
  config: CurrencyConfig;
  formatPrice: (amountInUSD: number) => string;
  convertFromUSD: (amountInUSD: number, targetCurrency?: SupportedCurrency) => number;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currency, setCurrencyState] = useState<SupportedCurrency>(() => {
    const saved = localStorage.getItem('saas_currency');
    return saved === 'BRL' || saved === 'USD' ? saved : 'USD';
  });

  const setCurrency = (c: SupportedCurrency) => {
    setCurrencyState(c);
    localStorage.setItem('saas_currency', c);
  };

  const config = CURRENCIES[currency] || CURRENCIES.USD;

  const formatPrice = (amountInUSD: number) => {
    return config.format(amountInUSD);
  };

  const convertFromUSD = (amountInUSD: number, targetCurrency?: SupportedCurrency) => {
    const target = targetCurrency || currency;
    const rate = CURRENCIES[target]?.exchangeRateToUSD ?? 1;
    return Math.round(amountInUSD * rate * 100) / 100;
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, config, formatPrice, convertFromUSD }}>
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

'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

import { Token } from '@/types/Token';
import { showToast } from '../Toastify';

interface TokenContextType {
  tokenList: Token[];
  loading: boolean;
  error: string | null;
}

const TokenContext = createContext<TokenContextType | undefined>(undefined);

interface Props {
  children: React.ReactNode;
}

export const TokenProvider = ({ children }: Props) => {
  const [tokenList, setTokenList] = useState<Token[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error] = useState<string | null>(null);

  useEffect(() => {
    const fetchTokenList = async () => {
      try {
        const response = await fetch('/tokens.json');
        if (!response.ok) {
          throw new Error('Failed to fetch token list');
        }
        const data: Token[] = await response.json();
        setTokenList(data);
      } catch {
        showToast('error', 'Failed to fetch token list');
      } finally {
        setLoading(false);
      }
    };

    fetchTokenList();
  }, []);

  return (
    <TokenContext.Provider value={{ tokenList, loading, error }}>
      {children}
    </TokenContext.Provider>
  );
};

export const useTokenList = (): TokenContextType => {
  const context = useContext(TokenContext);
  if (!context) {
    throw new Error('useTokenList must be used within a TokenProvider');
  }
  return context;
};

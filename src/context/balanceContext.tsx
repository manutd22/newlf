import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useLaunchParams } from '@telegram-apps/sdk-react';

const BACKEND_URL = 'https://504986964a5f6e10bb87d37830f71850.serveo.net';

interface BalanceContextType {
  balance: number;
  addToBalance: (amount: number) => void;
  updateBalanceFromServer: () => Promise<void>;
  isLoading: boolean;
}

const BalanceContext = createContext<BalanceContextType | undefined>(undefined);

export const BalanceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [balance, setBalance] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const lp = useLaunchParams();

  const updateBalanceFromServer = useCallback(async () => {
    if (!lp.initData?.user?.id) {
      console.warn('User ID not available');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const response = await axios.get(`${BACKEND_URL}/user/balance`, {
        params: { userId: lp.initData.user.id }
      });
      setBalance(response.data.balance);
    } catch (error) {
      console.error('Error updating balance:', error);
    } finally {
      setIsLoading(false);
    }
  }, [lp.initData?.user?.id]);

  const addToBalance = useCallback(async (amount: number) => {
    if (!lp.initData?.user?.id) {
      console.warn('User ID not available');
      return;
    }

    try {
      const response = await axios.post(`${BACKEND_URL}/user/add-balance`, {
        userId: lp.initData.user.id,
        amount
      });
      setBalance(response.data.balance);
    } catch (error) {
      console.error('Error adding to balance:', error);
    }
  }, [lp.initData?.user?.id]);

  useEffect(() => {
    updateBalanceFromServer();
  }, [updateBalanceFromServer]);

  return (
    <BalanceContext.Provider value={{ balance: balance ?? 0, addToBalance, updateBalanceFromServer, isLoading }}>
      {children}
    </BalanceContext.Provider>
  );
};

export const useBalance = () => {
  const context = useContext(BalanceContext);
  if (context === undefined) {
    throw new Error('useBalance must be used within a BalanceProvider');
  }
  return context;
};
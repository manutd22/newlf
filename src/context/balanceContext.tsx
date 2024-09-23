import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useLaunchParams } from '@telegram-apps/sdk-react';

const BACKEND_URL = 'https://90740c67105f604b91d1a450e186418b.serveo.net';

interface BalanceContextType {
  ballcryBalance: number;
  addToBalance: (amount: number) => Promise<void>;
  updateBalanceFromServer: () => Promise<void>;
  isLoading: boolean;
}

const BalanceContext = createContext<BalanceContextType | undefined>(undefined);

export const BalanceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [ballcryBalance, setBallcryBalance] = useState<number>(0);
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
      console.log('Balance response:', response.data); // Добавим лог для отладки
      if (typeof response.data.ballcryBalance === 'number') {
        setBallcryBalance(response.data.ballcryBalance);
      } else {
        console.error('Invalid balance data received:', response.data);
      }
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
      // Оптимистичное обновление UI
      setBallcryBalance((prevBalance) => prevBalance + amount);

      const response = await axios.post(`${BACKEND_URL}/user/add-balance`, {
        userId: lp.initData.user.id,
        amount
      });

      console.log('Add balance response:', response.data); // Добавим лог для отладки
      // Синхронизация с сервером
      if (typeof response.data.ballcryBalance === 'number') {
        setBallcryBalance(response.data.ballcryBalance);
      } else {
        console.error('Invalid balance data received:', response.data);
      }
    } catch (error) {
      console.error('Error adding to balance:', error);
      // В случае ошибки, откатываем изменение
      setBallcryBalance((prevBalance) => prevBalance - amount);
      throw error;
    }
  }, [lp.initData?.user?.id]);

  useEffect(() => {
    updateBalanceFromServer();
  }, [updateBalanceFromServer]);

  return (
    <BalanceContext.Provider value={{ ballcryBalance, addToBalance, updateBalanceFromServer, isLoading }}>
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
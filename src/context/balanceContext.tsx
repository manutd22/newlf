import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import axios from 'axios';

const BACKEND_URL = 'https://d484971f92c77aa3b1d90a59f9e45b23.serveo.net';

interface BalanceContextType {
  balance: number;
  addToBalance: (amount: number) => void;
  updateBalanceFromServer: () => Promise<void>;
}

const BalanceContext = createContext<BalanceContextType | undefined>(undefined);

export const BalanceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [balance, setBalance] = useState(0);

  const addToBalance = (amount: number) => {
    setBalance((prevBalance) => prevBalance + amount);
    // Здесь в будущем можно добавить логику для обновления баланса на бэкенде
  };

  const updateBalanceFromServer = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/user/balance`);
      setBalance(response.data.balance);
    } catch (error) {
      console.error('Error updating balance:', error);
    }
  };

  useEffect(() => {
    updateBalanceFromServer();
  }, []);

  return (
    <BalanceContext.Provider value={{ balance, addToBalance, updateBalanceFromServer }}>
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
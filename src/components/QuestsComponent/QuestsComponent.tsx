import React, { useState, useEffect, useCallback } from 'react';
import { useLaunchParams } from '@telegram-apps/sdk-react';
import axios from 'axios';
import { Button } from '@telegram-apps/telegram-ui';
import { DisplayData, DisplayDataRow } from '@/components/DisplayData/DisplayData';
import { useBalance } from '../../context/balanceContext';

interface Quest {
  id: number;
  title: string;
  reward: number;
  type: string;
}

const BACKEND_URL = 'https://06a7f0008251691636bca2e41b13a319.serveo.net';

export const QuestsComponent: React.FC = () => {
  const [quests, setQuests] = useState<Quest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { addToBalance } = useBalance();
  const lp = useLaunchParams();

  const showPopup = useCallback((title: string, message: string) => {
    if (window.Telegram?.WebApp?.showPopup) {
      window.Telegram.WebApp.showPopup({
        title,
        message,
        buttons: [{ type: 'ok' }]
      });
    } else {
      console.warn('Telegram WebApp API is not available');
      alert(`${title}: ${message}`);
    }
  }, []);

  const fetchQuests = useCallback(async () => {
    console.log('Fetching quests...');
    if (!lp.initData?.user?.id) {
      console.warn('User ID not available');
      showPopup('Ошибка', 'ID пользователя недоступен');
      setIsLoading(false);
      return;
    }

    try {
      const response = await axios.get(`${BACKEND_URL}/quests`, {
        params: { userId: lp.initData.user.id }
      });
      setQuests(response.data);
      setIsLoading(false);
    } catch (error) {
      console.error("Error loading quests:", error);
      showPopup('Ошибка', 'Не удалось загрузить квесты. Пожалуйста, попробуйте позже.');
      setError("Failed to load quests. Please try again later.");
      setIsLoading(false);
    }
  }, [lp.initData?.user?.id, showPopup]);

  useEffect(() => {
    fetchQuests();
  }, [fetchQuests]);

  const handleQuestCompletion = async (quest: Quest) => {
    if (!lp.initData?.user?.id) {
      showPopup('Ошибка', 'ID пользователя недоступен');
      return;
    }

    try {
      if (quest.type === 'CHANNEL_SUBSCRIPTION') {
        const subscriptionCheck = await axios.get(`${BACKEND_URL}/quests/check-subscription`, {
          params: { userId: lp.initData.user.id }
        });
        if (!subscriptionCheck.data.isSubscribed) {
          showPopup('Ошибка', 'Пожалуйста, подпишитесь на канал, чтобы выполнить этот квест.');
          return;
        }
      }
      
      const response = await axios.post(`${BACKEND_URL}/quests/complete`, {
        userId: lp.initData.user.id,
        questId: quest.id
      });

      if (response.data.success) {
        addToBalance(quest.reward);
        setQuests(quests.filter(q => q.id !== quest.id));
        showPopup('Успех', 'Квест успешно выполнен!');
      } else {
        throw new Error(response.data.message || 'Failed to complete quest');
      }
    } catch (error) {
      console.error("Error completing quest:", error);
      showPopup('Ошибка', 'Произошла ошибка при выполнении квеста. Пожалуйста, попробуйте позже.');
    }
  };

  if (isLoading) return <div>Загрузка квестов...</div>;
  if (error) return <div>{error}</div>;

  const questRows: DisplayDataRow[] = quests.map(quest => ({
    title: quest.title,
    value: (
      <>
        <span>Награда: {quest.reward} BallCry</span>
        <Button onClick={() => handleQuestCompletion(quest)} style={{ marginLeft: '10px' }}>Выполнить</Button>
      </>
    )
  }));

  return (
    <DisplayData
      header="Доступные квесты"
      rows={questRows}
    />
  );
};

export default QuestsComponent;
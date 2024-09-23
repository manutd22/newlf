import React, { useState, useEffect } from 'react';
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { addToBalance } = useBalance();

  useEffect(() => {
    fetchQuests();
  }, []);

  const fetchQuests = async () => {
    try {
      setLoading(true);
      const userId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id;
      const response = await axios.get(`${BACKEND_URL}/quests`, {
        params: { userId }
      });
      setQuests(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Ошибка при загрузке квестов:", error);
      setError("Не удалось загрузить квесты. Пожалуйста, попробуйте позже.");
      setLoading(false);
    }
  };

  const handleQuestCompletion = async (quest: Quest) => {
    try {
      const userId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id;
      
      if (quest.type === 'CHANNEL_SUBSCRIPTION') {
        const subscriptionCheck = await axios.get(`${BACKEND_URL}/quests/check-subscription`, {
          params: { userId }
        });
        if (!subscriptionCheck.data.isSubscribed) {
          alert("Пожалуйста, подпишитесь на канал, чтобы выполнить этот квест.");
          return;
        }
      }
      
      const response = await axios.post(`${BACKEND_URL}/quests/complete`, {
        userId,
        questId: quest.id
      });

      if (response.data.success) {
        addToBalance(quest.reward);
        setQuests(quests.filter(q => q.id !== quest.id));
      } else {
        throw new Error(response.data.message || 'Не удалось выполнить квест');
      }
    } catch (error) {
      console.error("Ошибка при выполнении квеста:", error);
      alert("Произошла ошибка при выполнении квеста. Пожалуйста, попробуйте позже.");
    }
  };

  if (loading) return <div>Загрузка квестов...</div>;
  if (error) return <div>{error}</div>;

  const questRows: DisplayDataRow[] = quests.map(quest => ({
    title: quest.title,
    value: (
      <>
        <span>Reward: {quest.reward} BallCry</span>
        <Button onClick={() => handleQuestCompletion(quest)} style={{ marginLeft: '10px' }}>Complete</Button>
      </>
    )
  }));

  return (
    <DisplayData
      header="Available Quests"
      rows={questRows}
    />
  );
};
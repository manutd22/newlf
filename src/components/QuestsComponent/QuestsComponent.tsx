import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Button } from '@telegram-apps/telegram-ui';
import { DisplayData, DisplayDataRow } from '@/components/DisplayData/DisplayData';
import { useBalance } from '../../context/balanceContext';
import { initUtils } from '@telegram-apps/sdk-react';

interface Quest {
  id: number;
  title: string;
  reward: number;
  type: string;
  channelUsername?: string;
}

const utils = initUtils();
const BACKEND_URL = 'https://c9ef543a6819bed5c8df26556c8997b1.serveo.net';

export const QuestsComponent: React.FC = () => {
  const [quests, setQuests] = useState<Quest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { addToBalance } = useBalance();

  const showPopup = useCallback((title: string, message: string) => {
    if (window.Telegram?.WebApp?.showPopup) {
      window.Telegram.WebApp.showPopup({
        title,
        message,
        buttons: [{ type: 'ok' }]
      });
    } else {
      alert(`${title}: ${message}`);
    }
  }, []);

  const getUserId = useCallback(() => {
    return window.Telegram?.WebApp?.initDataUnsafe?.user?.id || 'test_user_id';
  }, []);

  const fetchQuests = useCallback(async () => {
    const userId = getUserId();
    try {
      const response = await axios.get(`${BACKEND_URL}/quests`, {
        params: { userId }
      });
      setQuests(response.data);
      setIsLoading(false);
    } catch (error) {
      console.error("Error loading quests:", error);
      showPopup('Ошибка', 'Не удалось загрузить квесты. Пожалуйста, попробуйте позже.');
      setError("Failed to load quests. Please try again later.");
      setIsLoading(false);
    }
  }, [getUserId, showPopup]);

  useEffect(() => {
    fetchQuests();
  }, [fetchQuests]);

  const handleChannelSubscription = async (quest: Quest) => {
    if (!quest.channelUsername) {
      showPopup('Ошибка', 'Не указано имя канала для подписки.');
      return;
    }

    const channelUrl = `https://t.me/${quest.channelUsername}`;
    
    utils.openTelegramLink(channelUrl);

    showPopup('Подписка на канал', 'Пожалуйста, подпишитесь на канал и затем нажмите "Проверить подписку".');
  };

  const checkSubscription = async (quest: Quest) => {
    const userId = getUserId();
    try {
      const subscriptionCheck = await axios.get(`${BACKEND_URL}/quests/check-subscription`, {
        params: { userId, channelUsername: quest.channelUsername }
      });
      if (subscriptionCheck.data.isSubscribed) {
        await completeQuest(quest);
      } else {
        showPopup('Ошибка', 'Вы не подписаны на канал. Пожалуйста, подпишитесь и попробуйте снова.');
      }
    } catch (error) {
      console.error("Error checking subscription:", error);
      showPopup('Ошибка', 'Не удалось проверить подписку. Пожалуйста, попробуйте позже.');
    }
  };

  const completeQuest = async (quest: Quest) => {
    const userId = getUserId();
    try {
      const response = await axios.post(`${BACKEND_URL}/quests/complete`, {
        userId,
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

  const handleQuestCompletion = async (quest: Quest) => {
    if (quest.type === 'CHANNEL_SUBSCRIPTION') {
      await handleChannelSubscription(quest);
    } else {
      await completeQuest(quest);
    }
  };

  if (isLoading) return <div>Загрузка квестов...</div>;
  if (error) return <div>{error}</div>;

  const questRows: DisplayDataRow[] = quests.map(quest => ({
    title: quest.title,
    value: (
      <>
        <span>Награда: {quest.reward} BallCry</span>
        <Button onClick={() => handleQuestCompletion(quest)} style={{ marginLeft: '10px' }}>
          {quest.type === 'CHANNEL_SUBSCRIPTION' ? 'Подписаться' : 'Выполнить'}
        </Button>
        {quest.type === 'CHANNEL_SUBSCRIPTION' && (
          <Button onClick={() => checkSubscription(quest)} style={{ marginLeft: '10px' }}>
            Проверить подписку
          </Button>
        )}
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
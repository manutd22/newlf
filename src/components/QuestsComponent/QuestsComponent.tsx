import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Button } from '@telegram-apps/telegram-ui';
import { DisplayData, DisplayDataRow } from '@/components/DisplayData/DisplayData';
import { useBalance } from '../../context/balanceContext';
import { initUtils, useLaunchParams } from '@telegram-apps/sdk-react';

interface Quest {
  id: number;
  title: string;
  reward: number;
  type: string;
  progress?: {
    current: number;
    total: number;
  };
}

const utils = initUtils();
const BACKEND_URL = 'https://28cc2c11d6982debd0964cacf288e278.serveo.net';
const SUBSCRIPTION_CHANNEL = 'ballcry'; // Замените на реальное имя канала
const BOT_USERNAME = 'newcary_bot';
const APP_NAME = 'newcae';

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

  const handleChannelSubscription = async () => {
    const channelUrl = `https://t.me/${SUBSCRIPTION_CHANNEL}`;
    
    utils.openTelegramLink(channelUrl);

    showPopup('Подписка на канал', `Пожалуйста, подпишитесь на канал @${SUBSCRIPTION_CHANNEL} и затем нажмите "Проверить подписку".`);
  };

  const checkSubscription = async (quest: Quest) => {
    if (!lp.initData?.user?.id) {
      showPopup('Ошибка', 'ID пользователя недоступен');
      return;
    }

    try {
      const subscriptionCheck = await axios.get(`${BACKEND_URL}/quests/check-subscription`, {
        params: { userId: lp.initData.user.id, channelUsername: SUBSCRIPTION_CHANNEL }
      });
      if (subscriptionCheck.data.isSubscribed) {
        await completeQuest(quest);
      } else {
        showPopup('Ошибка', `Вы не подписаны на канал @${SUBSCRIPTION_CHANNEL}. Пожалуйста, подпишитесь и попробуйте снова.`);
      }
    } catch (error) {
      console.error("Error checking subscription:", error);
      showPopup('Ошибка', 'Не удалось проверить подписку. Пожалуйста, попробуйте позже.');
    }
  };

  const completeQuest = async (quest: Quest) => {
    if (!lp.initData?.user?.id) {
      showPopup('Ошибка', 'ID пользователя недоступен');
      return;
    }

    try {
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

  const generateInviteLink = useCallback(() => {
    if (!lp.initData?.user?.id) {
      console.error('User ID not available');
      return null;
    }
    return `https://t.me/${BOT_USERNAME}/${APP_NAME}?startapp=invite_${lp.initData.user.id}`;
  }, [lp.initData?.user?.id]);

  const handleQuestCompletion = async (quest: Quest) => {
    if (quest.type === 'CHANNEL_SUBSCRIPTION') {
      await handleChannelSubscription();
    } else if (quest.type === 'INVITE_FRIENDS') {
      const referralLink = generateInviteLink();
      if (referralLink) {
        showPopup('Пригласить друзей', `Ваша реферальная ссылка: ${referralLink}\nПоделитесь ею с друзьями, чтобы выполнить квест!`);
        // Опционально: добавить кнопку для копирования ссылки
        navigator.clipboard.writeText(referralLink)
          .then(() => console.log('Referral link copied to clipboard'))
          .catch(err => console.error('Failed to copy referral link:', err));
      } else {
        showPopup('Ошибка', 'Не удалось создать реферальную ссылку. Пожалуйста, попробуйте позже.');
      }
    } else {
      await completeQuest(quest);
    }
  };

  const questRows: DisplayDataRow[] = quests.map(quest => ({
    title: quest.title,
    value: (
      <>
        <span>Награда: {quest.reward} BallCry</span>
        {quest.type === 'INVITE_FRIENDS' && quest.progress && (
          <span style={{ marginLeft: '10px' }}>Прогресс: {quest.progress.current}/{quest.progress.total}</span>
        )}
        <Button onClick={() => handleQuestCompletion(quest)} style={{ marginLeft: '10px' }}>
          {quest.type === 'CHANNEL_SUBSCRIPTION' ? 'Подписаться' : 
           quest.type === 'INVITE_FRIENDS' ? 'Пригласить друзей' : 'Выполнить'}
        </Button>
        {quest.type === 'CHANNEL_SUBSCRIPTION' && (
          <Button onClick={() => checkSubscription(quest)} style={{ marginLeft: '10px' }}>
            Проверить подписку
          </Button>
        )}
      </>
    )
  }));

  if (isLoading) return <div>Загрузка квестов...</div>;
  if (error) return <div>{error}</div>;

  return (
    <DisplayData
      header="Доступные квесты"
      rows={questRows}
    />
  );
};

export default QuestsComponent;
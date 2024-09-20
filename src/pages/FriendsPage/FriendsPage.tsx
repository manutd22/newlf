import { FC, useState, useEffect, useCallback } from 'react';
import { Button } from '@telegram-apps/telegram-ui';
import { initUtils, useLaunchParams } from '@telegram-apps/sdk-react';
import axios from 'axios';

interface Referral {
  id?: number;
  username?: string;
  firstName?: string;
  lastName?: string;
}

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initDataUnsafe?: {
          startParam?: string;
          user?: {
            id: number;
            first_name: string;
            last_name?: string;
            username?: string;
            language_code?: string;
          };
        };
        showPopup: (params: { title: string; message: string; buttons: Array<{ type: string }> }) => void;
        shareUrl: (url: string) => void;
        close: () => void;
      };
    };
  }
}

const utils = initUtils();
const BACKEND_URL = 'https://bfcf5691dfbbb3d70bb82fdaf03ac07c.serveo.net';
const BOT_USERNAME = 'newcary_bot';
const APP_NAME = 'newcae';

export const FriendsPage: FC = () => {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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

  const fetchReferrals = useCallback(async () => {
    console.log('Fetching referrals...');
    if (!lp.initData?.user?.id) {
      console.warn('User ID not available');
      showPopup('Ошибка', 'ID пользователя недоступен');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const response = await axios.get(`${BACKEND_URL}/users/${lp.initData.user.id}/referrals`, {
        headers: {
          'Content-Type': 'application/json',
        }
      });
      console.log('Referrals response:', response);
      console.log('Response data structure:', JSON.stringify(response.data));

      if (Array.isArray(response.data)) {
        setReferrals(response.data);
      } else if (response.data && Array.isArray(response.data.data)) {
        setReferrals(response.data.data);
      } else {
        console.error('Unexpected response format:', response.data);
        showPopup('Ошибка', 'Получен неожиданный формат данных. Проверьте консоль для деталей.');
        setError('Неожиданный формат данных');
      }
    } catch (err) {
      console.error('Error fetching referrals:', err);
      showPopup('Ошибка', 'Не удалось загрузить рефералов. Пожалуйста, попробуйте позже.');
      setError('Ошибка загрузки рефералов');
    } finally {
      setIsLoading(false);
    }
  }, [lp.initData?.user?.id, showPopup]);

  useEffect(() => {
    fetchReferrals();
  }, [fetchReferrals]);

  const generateInviteLink = useCallback(() => {
    if (!lp.initData?.user?.id) {
      console.error('User ID not available');
      return null;
    }
    return `https://t.me/${BOT_USERNAME}/${APP_NAME}?startapp=invite_${lp.initData.user.id}`;
  }, [lp.initData?.user?.id]);

  const shareInviteLink = useCallback(() => {
    const inviteLink = generateInviteLink();
    if (inviteLink) {
      console.log('Generated invite link:', inviteLink);
      utils.shareURL(inviteLink, 'Join me in BallCry and get more rewards!');
    } else {
      showPopup('Error', 'Unable to create invite link. Please try again later.');
    }
  }, [generateInviteLink, showPopup]);

  const copyInviteLink = useCallback(() => {
    const inviteLink = generateInviteLink();
    if (inviteLink) {
      navigator.clipboard.writeText(inviteLink)
        .then(() => {
          showPopup('Success', 'Invite link copied to clipboard!');
        })
        .catch(() => {
          showPopup('Error', 'Failed to copy invite link. Please try again.');
        });
    } else {
      showPopup('Error', 'Unable to create invite link. Please try again later.');
    }
  }, [generateInviteLink, showPopup]);

  useEffect(() => {
    const handleReferral = async () => {
      const startParam = lp.initData?.startParam;
      if (lp.initData?.user?.id) {
        try {
          if (startParam && startParam.startsWith('invite_')) {
            // Обработка через startParam (для веб-версии)
            await axios.post(`${BACKEND_URL}/users/process-referral`, {
              userId: lp.initData.user.id,
              startParam: startParam
            });
            showPopup('Success', 'You have been successfully referred!');
          } else {
            // Проверка сохраненной информации о реферале (для мобильных устройств)
            const response = await axios.get(`${BACKEND_URL}/users/${APP_NAME}/check-referral`, {
              params: { userId: lp.initData.user.id }
            });
            if (response.data.success) {
              showPopup('Success', 'Referral information processed successfully!');
            }
          }
        } catch (error) {
          console.error('Error processing referral:', error);
          showPopup('Error', 'Failed to process referral. Please try again later.');
        }
      }
    };

    handleReferral();
  }, [lp.initData?.user?.id, lp.initData?.startParam, showPopup]);

  if (error) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>Error loading referrals</h2>
        <p>{error}</p>
        <Button onClick={fetchReferrals}>Try Again</Button>
      </div>
    );
  }

   return (
    <div>
      <h1>Пригласить друзей</h1>
      <button onClick={shareInviteLink}>Пригласить</button>
      <button onClick={copyInviteLink}>Скопировать ссылку</button>
      <h2>Ваши рефералы</h2>
      {isLoading ? (
        <p>Загрузка рефералов...</p>
      ) : error ? (
        <p>Ошибка: {error}</p>
      ) : referrals.length > 0 ? (
        <ul>
          {referrals.map((referral, index) => (
            <li key={referral.id || index}>
              {referral.firstName || referral.username || 'Неизвестный пользователь'} 
              {referral.lastName ? ` ${referral.lastName}` : ''}
              {referral.username ? ` (@${referral.username})` : ''}
            </li>
          ))}
        </ul>
      ) : (
        <p>Рефералов пока нет</p>
      )}
    </div>
  );
};

export default FriendsPage;

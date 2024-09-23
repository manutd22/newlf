import React from 'react';
import { Section, Image } from '@telegram-apps/telegram-ui';
import { useBalance } from '@/context/balanceContext';
import { NavigationBar } from '@/components/NavigationBar/NavigationBar';
import { QuestsComponent } from '@/components/QuestsComponent/QuestsComponent';

export const IndexPage: React.FC = () => {
  const { ballcryBalance } = useBalance();

  return (
    <div style={{ paddingBottom: '60px' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: '10px',
        background: '#f0f0f0'
      }}>
        <Image src="/ball1.png" alt="BallCry" style={{ width: '50px', height: '50px' }} />
        <div>Balance: { ballcryBalance } BallCry</div>
      </div>

      <Section>
        <QuestsComponent />
      </Section>

      <NavigationBar />
    </div>
  );
};
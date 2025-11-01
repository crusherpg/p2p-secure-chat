import React, { useState } from 'react';
import Header from '../components/Header';
import ChatPage from './ChatPage';
import { ProfileSettingsModal, PrivacySecurityModal } from '../components/SettingsModals';
import { useAuth } from '../context/AuthContext';

const Shell = () => {
  const [showSecurity, setShowSecurity] = useState(false);
  const { user } = useAuth();
  return (
    <div className="min-h-screen bg-[var(--bg-app)]">
      <Header onOpenSettings={() => setShowSecurity(true)} />
      <ChatPage />
      <PrivacySecurityModal user={user} isOpen={showSecurity} onClose={() => setShowSecurity(false)} onSave={() => setShowSecurity(false)} />
    </div>
  );
};

export default Shell;
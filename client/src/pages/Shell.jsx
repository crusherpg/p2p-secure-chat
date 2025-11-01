import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import ChatPage from './ChatPage';
import SettingsModal from '../components/SettingsModal';

const Shell = () => {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  return (
    <div className="min-h-screen bg-[var(--bg-app)]">
      <Header onOpenSettings={() => setOpen(true)} />
      <ChatPage />
      <SettingsModal isOpen={open} onClose={() => setOpen(false)} />
    </div>
  );
};

export default Shell;
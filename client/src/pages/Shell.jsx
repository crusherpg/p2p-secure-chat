import React, { useState } from 'react';
import { Shield, Settings } from 'lucide-react';
import SettingsModal from '../components/SettingsModal';
import ChatPage from './ChatPage';
import { useAuth } from '../context/AuthContext';

const Shell = () => {
  const [showSettings, setShowSettings] = useState(false);
  const { user } = useAuth();
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Settings accessible via ChatPage topbar */}
      <ChatPage onOpenSettings={() => setShowSettings(true)} />
      
      <SettingsModal 
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </div>
  );
};

export default Shell;

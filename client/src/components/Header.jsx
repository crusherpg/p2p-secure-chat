import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Shield, Settings, LogOut } from 'lucide-react';
import { ProfileSettingsModal, PrivacySecurityModal } from '../components/SettingsModals';

const Header = ({ onOpenSettings }) => {
  const { user, logout } = useAuth();
  const { isDark } = useTheme();
  return (
    <div className="h-14 px-4 flex items-center justify-between bg-white border-b border-gray-200">
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold">P2P</p>
          <p className="text-xs text-gray-500">Secure Messaging</p>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <button onClick={onOpenSettings} className="p-2 rounded-lg hover:bg-gray-100"><Settings className="w-5 h-5 text-gray-600" /></button>
        <button onClick={logout} className="p-2 rounded-lg hover:bg-gray-100"><LogOut className="w-5 h-5 text-gray-600" /></button>
        <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200">
          {user?.avatar ? <img src={user.avatar} alt="avatar" /> : <div className="w-full h-full flex items-center justify-center text-sm font-medium">{user?.username?.[0]?.toUpperCase() || 'U'}</div>}
        </div>
      </div>
    </div>
  );
};

export default Header;
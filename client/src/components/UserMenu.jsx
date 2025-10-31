import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { User, Settings, LogOut, Shield, Moon, Sun, ChevronDown, Bell, Lock } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';
import { ProfileSettingsModal, PrivacySecurityModal } from './SettingsModals';
import { userService } from '../services/userService';

const UserMenu = () => {
  const { user, token, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [saving, setSaving] = useState(false);
  const menuRef = useRef(null);
  const buttonRef = useRef(null);

  useEffect(() => { userService.setAuthToken(token); }, [token]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target) && buttonRef.current && !buttonRef.current.contains(event.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try { await logout(); } finally { setIsLoggingOut(false); setIsOpen(false); }
  };

  const toggleMenu = () => setIsOpen(!isOpen);
  const onProfileSettings = () => setShowProfile(true);
  const onPrivacy = () => setShowPrivacy(true);

  const handleSaveProfile = async (data) => {
    try {
      setSaving(true);
      const payload = { username: data.username, preferences: { theme: data.theme, notifications: data.notifications } };
      const res = await userService.updateProfile(payload);
      console.log('[UserMenu] Profile saved', res);
      setShowProfile(false);
    } catch (e) {
      console.error('[UserMenu] Save Profile failed', e);
    } finally { setSaving(false); }
  };

  const handleSavePrivacy = async (data) => {
    try {
      setSaving(true);
      const payload = { preferences: { readReceipts: data.readReceipts, typingIndicators: data.typingIndicators }, totpEnabled: data.totpEnabled };
      const res = await userService.updatePrivacy(payload);
      console.log('[UserMenu] Privacy saved', res);
      setShowPrivacy(false);
    } catch (e) {
      console.error('[UserMenu] Save Privacy failed', e);
    } finally { setSaving(false); }
  };

  return (
    <div className="relative">
      <button ref={buttonRef} onClick={toggleMenu} className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-dark-800" aria-expanded={isOpen} aria-haspopup="true">
        <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center flex-shrink-0">
          {user?.avatar ? (<img src={user.avatar} alt={user?.username || 'User'} className="w-8 h-8 rounded-full object-cover" />) : (<span className="text-white text-sm font-medium">{user?.username?.[0]?.toUpperCase() || 'U'}</span>)}
        </div>
        <div className="hidden md:block min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{user?.username || 'User'}</p>
          <div className="flex items-center space-x-1"><div className="w-2 h-2 bg-green-500 rounded-full" /><span className="text-xs text-gray-500 dark:text-gray-400">Online</span></div>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div ref={menuRef} className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-dark-800 rounded-lg shadow-lg border border-gray-200 dark:border-dark-700 py-2 z-50 fade-in">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-dark-700">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center flex-shrink-0">
                {user?.avatar ? (<img src={user.avatar} alt={user?.username || 'User'} className="w-10 h-10 rounded-full object-cover" />) : (<span className="text-white font-medium">{user?.username?.[0]?.toUpperCase() || 'U'}</span>)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{user?.username || 'Unknown User'}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email || 'No email'}</p>
                <div className="flex items-center space-x-2 mt-1">
                  <div className="flex items-center space-x-1"><div className="w-2 h-2 bg-green-500 rounded-full" /><span className="text-xs text-gray-500 dark:text-gray-400">Online</span></div>
                  {user?.totpEnabled && (<div className="flex items-center space-x-1"><Shield className="w-3 h-3 text-green-500" /><span className="text-xs text-green-600 dark:text-green-400">2FA</span></div>)}
                </div>
              </div>
            </div>
          </div>

          <div className="py-2">
            <button onClick={onProfileSettings} className="w-full flex items-center space-x-3 px-4 py-3 text-left text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-dark-600"><User className="w-5 h-5" /><span className="flex-1">Profile Settings</span></button>
            <button onClick={()=>console.log('[UserMenu] Notifications clicked')} className="w-full flex items-center space-x-3 px-4 py-3 text-left text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-dark-600"><Bell className="w-5 h-5" /><span className="flex-1">Notifications</span></button>
            <button onClick={onPrivacy} className="w-full flex items-center space-x-3 px-4 py-3 text-left text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-dark-600"><Lock className="w-5 h-5" /><span className="flex-1">Privacy & Security</span></button>
            <button onClick={toggleTheme} className="w-full flex items-center space-x-3 px-4 py-3 text-left text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-dark-600">{isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}<span className="flex-1">{isDark ? 'Light Mode' : 'Dark Mode'}</span></button>
            <button onClick={()=>console.log('[UserMenu] Settings clicked')} className="w-full flex items-center space-x-3 px-4 py-3 text-left text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-dark-600"><Settings className="w-5 h-5" /><span className="flex-1">Settings</span></button>
          </div>

          <div className="border-t border-gray-200 dark:border-dark-700 my-2" />

          <div className="py-2">
            <button onClick={handleLogout} disabled={isLoggingOut} className={`w-full flex items-center space-x-3 px-4 py-3 text-left ${isLoggingOut? 'opacity-50 cursor-not-allowed' : ''} text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20`}><LogOut className="w-5 h-5" /><span className="flex-1">{isLoggingOut ? 'Signing out...' : 'Sign Out'}</span>{isLoggingOut && <LoadingSpinner size="sm" />}</button>
          </div>

          <div className="px-4 py-2 border-t border-gray-200 dark:border-dark-700"><p className="text-xs text-gray-400 dark:text-gray-500">P2P Secure Chat v{typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : 'dev'} · {typeof __BUILD_TIME__ !== 'undefined' ? __BUILD_TIME__ : ''}</p></div>
        </div>
      )}

      <ProfileSettingsModal user={user} isOpen={showProfile} onClose={()=>setShowProfile(false)} onSave={handleSaveProfile} />
      <PrivacySecurityModal user={user} isOpen={showPrivacy} onClose={()=>setShowPrivacy(false)} onSave={handleSavePrivacy} />
    </div>
  );
};

export default UserMenu;

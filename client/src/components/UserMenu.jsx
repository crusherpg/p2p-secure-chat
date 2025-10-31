import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { User, Settings, LogOut, Shield, Moon, Sun, ChevronDown, Bell, Lock } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';
import { ProfileSettingsModal, PrivacySecurityModal } from './SettingsModals';

const UserMenu = () => {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const menuRef = useRef(null);
  const buttonRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target) && buttonRef.current && !buttonRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    console.log('[UserMenu] Logout clicked');
    setIsLoggingOut(true);
    try { await logout(); } catch (error) { console.error('[UserMenu] Logout error:', error); } finally { setIsLoggingOut(false); setIsOpen(false); }
  };

  const toggleMenu = () => { const next = !isOpen; console.log('[UserMenu] toggleMenu', { next }); setIsOpen(next); };
  const onProfileSettings = () => { console.log('[UserMenu] Profile settings clicked', { user }); setShowProfile(true); };
  const onPrivacy = () => { console.log('[UserMenu] Privacy clicked'); setShowPrivacy(true); };

  const MenuItem = ({ icon: Icon, label, onClick, danger = false, disabled = false }) => (
    <button onClick={() => { try { onClick?.(); } catch (e) { console.error('[UserMenu] MenuItem onClick error', e); } if (!disabled) setIsOpen(false); }} disabled={disabled} className={`w-full flex items-center space-x-3 px-4 py-3 text-left transition-colors ${danger ? 'text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20' : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-dark-600'} ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50 dark:hover:bg-dark-600'}`}>
      <Icon className="w-5 h-5 flex-shrink-0" />
      <span className="flex-1">{label}</span>
      {disabled && <LoadingSpinner size="sm" />}
    </button>
  );

  const handleSaveProfile = (data) => {
    console.log('[UserMenu] Save Profile', data);
    setShowProfile(false);
  };

  const handleSavePrivacy = (data) => {
    console.log('[UserMenu] Save Privacy', data);
    setShowPrivacy(false);
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
            <MenuItem icon={User} label="Profile Settings" onClick={onProfileSettings} />
            <MenuItem icon={Bell} label="Notifications" onClick={()=>console.log('[UserMenu] Notifications clicked')} />
            <MenuItem icon={Lock} label="Privacy & Security" onClick={onPrivacy} />
            <MenuItem icon={isDark ? Sun : Moon} label={isDark ? 'Light Mode' : 'Dark Mode'} onClick={toggleTheme} />
            <MenuItem icon={Settings} label="Settings" onClick={()=>console.log('[UserMenu] Settings clicked')} />
          </div>

          <div className="border-t border-gray-200 dark:border-dark-700 my-2" />

          <div className="py-2">
            <MenuItem icon={LogOut} label={isLoggingOut ? 'Signing out...' : 'Sign Out'} onClick={handleLogout} danger disabled={isLoggingOut} />
          </div>

          <div className="px-4 py-2 border-t border-gray-200 dark:border-dark-700">
            <p className="text-xs text-gray-400 dark:text-gray-500">P2P Secure Chat v{typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : 'dev'} · {typeof __BUILD_TIME__ !== 'undefined' ? __BUILD_TIME__ : ''}</p>
          </div>
        </div>
      )}

      {/* Modals */}
      <ProfileSettingsModal user={user} isOpen={showProfile} onClose={()=>setShowProfile(false)} onSave={handleSaveProfile} />
      <PrivacySecurityModal user={user} isOpen={showPrivacy} onClose={()=>setShowPrivacy(false)} onSave={handleSavePrivacy} />
    </div>
  );
};

export default UserMenu;

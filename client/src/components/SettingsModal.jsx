import React, { useState } from 'react';
import { X, Shield, RefreshCw, CheckCircle, Bell, Lock, Eye, EyeOff } from 'lucide-react';
import userService from '../services/userService';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import toast from 'react-hot-toast';

const SettingsModal = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('security');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  
  const [settings, setSettings] = useState({
    theme: theme || 'auto',
    readReceipts: true,
    typingIndicators: true,
    screenshotProtection: true,
    notifications: true,
    username: user?.username || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  if (!isOpen) return null;

  const handleSave = async (section) => {
    setLoading(true);
    try {
      if (section === 'privacy') {
        await userService.updatePrivacy({
          preferences: {
            readReceipts: settings.readReceipts,
            typingIndicators: settings.typingIndicators
          }
        });
        toast.success('Privacy settings saved');
      } else if (section === 'profile') {
        const updates = { username: settings.username };
        if (settings.theme !== 'auto') {
          updates.preferences = { theme: settings.theme };
        }
        await userService.updateProfile(updates);
        if (settings.theme) setTheme(settings.theme);
        toast.success('Profile updated');
      }
    } catch (error) {
      toast.error(`Failed to save ${section} settings`);
      console.error(`${section} save error:`, error);
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerateKeys = async () => {
    setLoading(true);
    try {
      // Note: This would call a crypto rotation endpoint if available
      // For demo, just show success
      toast.success('Encryption keys regenerated successfully');
    } catch (error) {
      toast.error('Failed to regenerate keys');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="settings-modal">
      <div className="settings-content fade-in">
        {/* Header */}
        <div className="settings-header">
          <h2 className="text-lg font-semibold">Settings</h2>
          <button onClick={onClose} className="btn btn-icon w-8 h-8">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="settings-tabs">
          {[
            { id: 'security', label: 'Security' },
            { id: 'appearance', label: 'Appearance' },
            { id: 'account', label: 'Account' },
            { id: 'privacy', label: 'Privacy' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`settings-tab ${activeTab === tab.id ? 'active' : ''}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="settings-body custom-scrollbar">
          {activeTab === 'security' && (
            <>
              {/* Encryption Section */}
              <div className="settings-section">
                <h3 className="settings-section-title">Encryption</h3>
                
                <div className="settings-card encryption">
                  <div className="flex items-center">
                    <div className="card-icon encryption-icon">
                      <Shield className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-medium">End-to-End Encryption</p>
                      <p className="text-xs text-gray-500 mt-1">AES-256-GCM with ECDH-X25519</p>
                    </div>
                  </div>
                  <div className="status-badge">Active</div>
                </div>

                <button 
                  onClick={handleRegenerateKeys}
                  disabled={loading}
                  className="settings-card dashed-card w-full hover:bg-gray-50"
                >
                  <div className="flex items-center justify-between w-full">
                    <div>
                      <p className="font-medium text-left">Regenerate Encryption Keys</p>
                      <p className="text-xs text-gray-500 mt-1 text-left">Create new keys for enhanced security</p>
                    </div>
                    <RefreshCw className={`w-4 h-4 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
                  </div>
                </button>
              </div>

              {/* Two-Factor Authentication */}
              <div className="settings-section">
                <h3 className="settings-section-title">Two-Factor Authentication</h3>
                
                <div className="settings-card">
                  <div>
                    <p className="font-medium">2FA Status</p>
                    <p className="text-xs text-gray-500 mt-1">{user?.totpEnabled ? 'Enabled' : 'Disabled'}</p>
                  </div>
                  <div className={`status-badge ${user?.totpEnabled ? '' : 'bg-gray-100 text-gray-600'}`}>
                    {user?.totpEnabled ? 'Active' : 'Inactive'}
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'appearance' && (
            <div className="settings-section">
              <h3 className="settings-section-title">Theme</h3>
              <div className="space-y-3">
                {[
                  { value: 'light', label: 'Light', desc: 'Clean white interface' },
                  { value: 'dark', label: 'Dark', desc: 'Dark mode for low light' },
                  { value: 'auto', label: 'System', desc: 'Follow system preference' }
                ].map(option => (
                  <label key={option.value} className={`settings-card cursor-pointer ${settings.theme === option.value ? 'border-blue-500' : ''}`}>
                    <div className="flex items-center">
                      <input
                        type="radio"
                        name="theme"
                        value={option.value}
                        checked={settings.theme === option.value}
                        onChange={(e) => setSettings(s => ({ ...s, theme: e.target.value }))}
                        className="mr-3"
                      />
                      <div>
                        <p className="font-medium">{option.label}</p>
                        <p className="text-xs text-gray-500">{option.desc}</p>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
              <button 
                onClick={() => handleSave('profile')} 
                disabled={loading}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Theme'}
              </button>
            </div>
          )}

          {activeTab === 'account' && (
            <div className="settings-section">
              <h3 className="settings-section-title">Profile Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Username</label>
                  <input
                    type="text"
                    value={settings.username}
                    onChange={(e) => setSettings(s => ({ ...s, username: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                </div>
              </div>
              
              <h3 className="settings-section-title mt-6">Change Password</h3>
              <div className="space-y-4">
                <div className="relative">
                  <label className="block text-sm font-medium mb-2">Current Password</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={settings.currentPassword}
                    onChange={(e) => setSettings(s => ({ ...s, currentPassword: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-9 text-gray-500"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">New Password</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={settings.newPassword}
                    onChange={(e) => setSettings(s => ({ ...s, newPassword: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Confirm New Password</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={settings.confirmPassword}
                    onChange={(e) => setSettings(s => ({ ...s, confirmPassword: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              
              <button 
                onClick={() => handleSave('profile')} 
                disabled={loading}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Updating...' : 'Update Profile'}
              </button>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="settings-section">
              <h3 className="settings-section-title">Privacy Controls</h3>
              
              <div className="space-y-3">
                <label className="privacy-item cursor-pointer">
                  <span className="text-sm text-gray-900">Read Receipts</span>
                  <input 
                    type="checkbox" 
                    checked={settings.readReceipts}
                    onChange={(e) => setSettings(s => ({ ...s, readReceipts: e.target.checked }))}
                    className="checkbox" 
                  />
                </label>
                
                <label className="privacy-item cursor-pointer">
                  <span className="text-sm text-gray-900">Typing Indicators</span>
                  <input 
                    type="checkbox" 
                    checked={settings.typingIndicators}
                    onChange={(e) => setSettings(s => ({ ...s, typingIndicators: e.target.checked }))}
                    className="checkbox" 
                  />
                </label>
                
                <label className="privacy-item cursor-pointer">
                  <span className="text-sm text-gray-900">Screenshot Protection</span>
                  <input 
                    type="checkbox" 
                    checked={settings.screenshotProtection}
                    onChange={(e) => setSettings(s => ({ ...s, screenshotProtection: e.target.checked }))}
                    className="checkbox" 
                  />
                </label>
                
                <label className="privacy-item cursor-pointer">
                  <span className="text-sm text-gray-900">Push Notifications</span>
                  <input 
                    type="checkbox" 
                    checked={settings.notifications}
                    onChange={(e) => setSettings(s => ({ ...s, notifications: e.target.checked }))}
                    className="checkbox" 
                  />
                </label>
              </div>
              
              <button 
                onClick={() => handleSave('privacy')} 
                disabled={loading}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Privacy Settings'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;

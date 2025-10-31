import React, { useEffect, useState } from 'react';
import { X, User, Bell, Lock, Shield, Save, Loader2, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const Modal = ({ title, onClose, children, className = "" }) => {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose} />
      <div className={`relative w-full max-w-lg bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 ${className}`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
          <button 
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};

export const ProfileSettingsModal = ({ user, isOpen, onClose, onSave }) => {
  const [form, setForm] = useState({
    username: user?.username || '',
    theme: user?.preferences?.theme || 'dark',
    notifications: user?.preferences?.notifications !== false,
    language: user?.preferences?.language || 'en'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (user) {
      setForm({
        username: user.username || '',
        theme: user.preferences?.theme || 'dark',
        notifications: user.preferences?.notifications !== false,
        language: user.preferences?.language || 'en'
      });
      setErrors({});
    }
  }, [user, isOpen]);

  if (!isOpen) return null;

  const validateForm = () => {
    const newErrors = {};
    
    if (!form.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (form.username.length < 2) {
      newErrors.username = 'Username must be at least 2 characters';
    } else if (!/^[a-zA-Z0-9_.-]+$/.test(form.username)) {
      newErrors.username = 'Username can only contain letters, numbers, dots, hyphens, and underscores';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    
    setIsLoading(true);
    try {
      await onSave(form);
      toast.success('Profile updated successfully!');
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  return (
    <Modal title="Profile Settings" onClose={onClose}>
      <div className="space-y-6">
        {/* Username */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Username
          </label>
          <div className="relative">
            <User className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              value={form.username}
              onChange={(e) => handleInputChange('username', e.target.value)}
              className={`input-primary pl-9 ${
                errors.username ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
              }`}
              placeholder="Enter username"
              disabled={isLoading}
            />
          </div>
          {errors.username && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.username}</p>
          )}
        </div>

        {/* Theme */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Appearance
          </label>
          <select
            value={form.theme}
            onChange={(e) => handleInputChange('theme', e.target.value)}
            className="input-primary"
            disabled={isLoading}
          >
            <option value="light">Light Mode</option>
            <option value="dark">Dark Mode</option>
            <option value="auto">System Default</option>
          </select>
        </div>

        {/* Language */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Language
          </label>
          <select
            value={form.language}
            onChange={(e) => handleInputChange('language', e.target.value)}
            className="input-primary"
            disabled={isLoading}
          >
            <option value="en">English</option>
            <option value="es">Español</option>
            <option value="fr">Français</option>
            <option value="de">Deutsch</option>
            <option value="it">Italiano</option>
            <option value="pt">Português</option>
          </select>
        </div>

        {/* Notifications Toggle */}
        <div className="flex items-center justify-between py-2">
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">Push Notifications</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Receive notifications for new messages</p>
          </div>
          <button
            onClick={() => handleInputChange('notifications', !form.notifications)}
            className={`relative w-11 h-6 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              form.notifications ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
            }`}
            disabled={isLoading}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
              form.notifications ? 'transform translate-x-5' : ''
            }`} />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="btn-primary flex items-center"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export const PrivacySecurityModal = ({ user, isOpen, onClose, onSave }) => {
  const [form, setForm] = useState({
    readReceipts: user?.preferences?.readReceipts !== false,
    typingIndicators: user?.preferences?.typingIndicators !== false,
    totpEnabled: user?.totpEnabled || false
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({
        readReceipts: user.preferences?.readReceipts !== false,
        typingIndicators: user.preferences?.typingIndicators !== false,
        totpEnabled: user.totpEnabled || false
      });
    }
  }, [user, isOpen]);

  if (!isOpen) return null;

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await onSave(form);
      toast.success('Privacy settings updated!');
    } catch (error) {
      toast.error('Failed to update privacy settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const ToggleSwitch = ({ label, description, field, icon: Icon }) => (
    <div className="flex items-center justify-between py-4">
      <div className="flex items-start space-x-3">
        <Icon className="w-5 h-5 text-gray-600 dark:text-gray-400 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-gray-900 dark:text-white">{label}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{description}</p>
        </div>
      </div>
      <button
        onClick={() => handleInputChange(field, !form[field])}
        className={`relative w-11 h-6 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
          form[field] ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
        }`}
        disabled={isLoading}
      >
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
          form[field] ? 'transform translate-x-5' : ''
        }`} />
      </button>
    </div>
  );

  return (
    <Modal title="Privacy & Security" onClose={onClose}>
      <div className="space-y-4">
        {/* Privacy Settings */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-4">Message Privacy</h4>
          <div className="space-y-2">
            <ToggleSwitch
              label="Read Receipts"
              description="Show others when you've read their messages"
              field="readReceipts"
              icon={CheckCircle}
            />
            <ToggleSwitch
              label="Typing Indicators"
              description="Show others when you're typing a message"
              field="typingIndicators"
              icon={Bell}
            />
          </div>
        </div>

        {/* Security Settings */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-4">Account Security</h4>
          
          {/* Two-Factor Authentication */}
          <div className="flex items-center justify-between py-4">
            <div className="flex items-start space-x-3">
              <Shield className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Two-Factor Authentication
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Protect your account with an additional security layer
                </p>
              </div>
            </div>
            <button
              onClick={() => handleInputChange('totpEnabled', !form.totpEnabled)}
              disabled={isLoading}
              className={`px-4 py-2 text-xs font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                form.totpEnabled 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                  : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {form.totpEnabled ? 'Enabled' : 'Enable 2FA'}
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="btn-primary flex items-center"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Lock className="w-4 h-4 mr-2" />
                Apply Settings
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
};

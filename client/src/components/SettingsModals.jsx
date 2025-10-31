import React, { useEffect, useState } from 'react';
import { X, User, Bell, Lock, Shield, Save } from 'lucide-react';

const Modal = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-black/50" onClick={onClose} />
    <div className="relative w-full max-w-lg bg-white dark:bg-dark-800 rounded-2xl shadow-xl border border-gray-200 dark:border-dark-700">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-dark-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
        <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700">
          <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        </button>
      </div>
      <div className="p-5">{children}</div>
    </div>
  </div>
);

export const ProfileSettingsModal = ({ user, isOpen, onClose, onSave }) => {
  const [form, setForm] = useState({ username: user?.username || '', theme: user?.preferences?.theme || 'dark', notifications: !!user?.preferences?.notifications });
  useEffect(() => setForm({ username: user?.username || '', theme: user?.preferences?.theme || 'dark', notifications: !!user?.preferences?.notifications }), [user]);
  if (!isOpen) return null;

  return (
    <Modal title="Profile Settings" onClose={onClose}>
      <div className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Username</label>
          <div className="relative">
            <User className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <input value={form.username} onChange={(e)=>setForm(prev=>({...prev, username:e.target.value}))} className="w-full pl-9 pr-3 py-2 border rounded-lg bg-white dark:bg-dark-700 border-gray-300 dark:border-dark-600 text-gray-900 dark:text-white" placeholder="Enter username" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Theme</label>
          <select value={form.theme} onChange={(e)=>setForm(prev=>({...prev, theme:e.target.value}))} className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-dark-700 border-gray-300 dark:border-dark-600 text-gray-900 dark:text-white">
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="auto">Auto</option>
          </select>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">Notifications</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Enable in-app notifications</p>
          </div>
          <button onClick={()=>setForm(prev=>({...prev, notifications:!prev.notifications}))} className={`w-11 h-6 rounded-full ${form.notifications ? 'bg-primary-600' : 'bg-gray-300 dark:bg-dark-600'} relative transition-colors`}>
            <span className={`absolute top-0.5 ${form.notifications ? 'right-0.5' : 'left-0.5'} w-5 h-5 bg-white rounded-full transition-all`} />
          </button>
        </div>
        <div className="flex justify-end space-x-3">
          <button onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-dark-700 text-gray-800 dark:text-gray-200">Cancel</button>
          <button onClick={()=>onSave(form)} className="px-4 py-2 rounded-lg bg-primary-600 text-white flex items-center space-x-2">
            <Save className="w-4 h-4" />
            <span>Save</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};

export const PrivacySecurityModal = ({ user, isOpen, onClose, onSave }) => {
  const [form, setForm] = useState({ readReceipts: !!user?.preferences?.readReceipts, typingIndicators: !!user?.preferences?.typingIndicators, totpEnabled: !!user?.totpEnabled });
  useEffect(()=>setForm({ readReceipts: !!user?.preferences?.readReceipts, typingIndicators: !!user?.preferences?.typingIndicators, totpEnabled: !!user?.totpEnabled }),[user]);
  if (!isOpen) return null;

  const Toggle = ({ label, desc, field }) => (
    <div className="flex items-center justify-between py-3">
      <div>
        <p className="text-sm font-medium text-gray-900 dark:text-white">{label}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">{desc}</p>
      </div>
      <button onClick={()=>setForm(prev=>({...prev, [field]:!prev[field]}))} className={`w-11 h-6 rounded-full ${form[field] ? 'bg-primary-600' : 'bg-gray-300 dark:bg-dark-600'} relative transition-colors`}>
        <span className={`absolute top-0.5 ${form[field] ? 'right-0.5' : 'left-0.5'} w-5 h-5 bg-white rounded-full transition-all`} />
      </button>
    </div>
  );

  return (
    <Modal title="Privacy & Security" onClose={onClose}>
      <div className="space-y-4">
        <Toggle label="Read Receipts" desc="Show when messages are read" field="readReceipts" />
        <Toggle label="Typing Indicators" desc="Show when you're typing" field="typingIndicators" />
        <div className="flex items-center justify-between py-3">
          <div className="flex items-center space-x-2">
            <Shield className="w-4 h-4 text-green-500" />
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Two-Factor Authentication</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Protect your account with a 6‑digit code</p>
            </div>
          </div>
          <button onClick={()=>setForm(prev=>({...prev, totpEnabled:!prev.totpEnabled}))} className={`px-3 py-1 rounded-lg ${form.totpEnabled ? 'bg-green-600 text-white' : 'bg-gray-200 dark:bg-dark-600 text-gray-800 dark:text-gray-200'}`}>
            {form.totpEnabled ? 'Enabled' : 'Enable'}
          </button>
        </div>
        <div className="flex justify-end space-x-3 pt-2">
          <button onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-dark-700 text-gray-800 dark:text-gray-200">Close</button>
          <button onClick={()=>onSave(form)} className="px-4 py-2 rounded-lg bg-primary-600 text-white flex items-center space-x-2">
            <Lock className="w-4 h-4" />
            <span>Apply</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};

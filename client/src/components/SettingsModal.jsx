import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import SecurityTab from './SecurityTab';

const Tabs = [
  { id: 'security', label: 'Security' },
  { id: 'appearance', label: 'Appearance' },
  { id: 'account', label: 'Account' }
];

const SettingsModal = ({ isOpen, onClose }) => {
  const [tab, setTab] = useState('security');
  useEffect(() => { if (isOpen) setTab('security'); }, [isOpen]);
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold">Settings</h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="settings-tabs">
          {Tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} className={tab===t.id? 'active':''}>{t.label}</button>
          ))}
        </div>

        <div className="py-2">
          {tab === 'security' && <SecurityTab onRegenerate={() => {}} />}
          {tab === 'appearance' && (
            <div className="p-6 text-sm text-gray-600">Appearance settings placeholder</div>
          )}
          {tab === 'account' && (
            <div className="p-6 text-sm text-gray-600">Account settings placeholder</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
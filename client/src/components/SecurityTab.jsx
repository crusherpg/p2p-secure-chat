import React from 'react';
import { Shield, RefreshCw } from 'lucide-react';

const SecurityTab = ({ onRegenerate }) => {
  return (
    <div className="settings-modal text-[15px]">
      <div className="px-6 py-5">
        <h4 className="text-sm font-semibold text-gray-900 mb-3">Encryption</h4>
        <div className="card active flex items-center justify-between p-4 mb-3">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
              <Shield className="w-4 h-4 text-green-700" />
            </div>
            <div>
              <p className="font-medium text-gray-900">End-to-End Encryption</p>
              <p className="text-xs text-gray-500">AES-256-GCM with ECDH-X25519</p>
            </div>
          </div>
          <span className="badge-active">Active</span>
        </div>

        <button onClick={onRegenerate} className="tile w-full p-4 flex items-center justify-between hover:bg-gray-50 transition">
          <div>
            <p className="font-medium text-gray-900">Regenerate Encryption Keys</p>
            <p className="text-xs text-gray-500">Create new keys for enhanced security</p>
          </div>
          <RefreshCw className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      <div className="px-6 py-5">
        <h4 className="text-sm font-semibold text-gray-900 mb-3">Two-Factor Authentication</h4>
        <div className="card p-4 flex items-center justify-between">
          <div>
            <p className="font-medium text-gray-900">2FA Status</p>
            <p className="text-xs text-gray-500">Enabled</p>
          </div>
          <span className="badge-active">Active</span>
        </div>
      </div>

      <div className="px-6 py-5">
        <h4 className="text-sm font-semibold text-gray-900 mb-2">Privacy</h4>
        <div className="space-y-2">
          <label className="card flex items-center justify-between p-3">
            <span className="text-sm text-gray-900">Screenshot Protection</span>
            <input type="checkbox" defaultChecked className="w-4 h-4" />
          </label>
          <label className="card flex items-center justify-between p-3">
            <span className="text-sm text-gray-900">Typing Indicators</span>
            <input type="checkbox" defaultChecked className="w-4 h-4" />
          </label>
          <label className="card flex items-center justify-between p-3">
            <span className="text-sm text-gray-900">Read Receipts</span>
            <input type="checkbox" defaultChecked className="w-4 h-4" />
          </label>
        </div>
      </div>
    </div>
  );
};

export default SecurityTab;
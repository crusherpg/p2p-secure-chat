import React, { useState } from 'react';
import { X, Shield, RefreshCw, CheckCircle, Bell, Lock } from 'lucide-react';

const SettingsModal = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('security');

  if (!isOpen) return null;

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
            { id: 'account', label: 'Account' }
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

                <div className="settings-card dashed-card">
                  <div className="flex items-center">
                    <div>
                      <p className="font-medium">Regenerate Encryption Keys</p>
                      <p className="text-xs text-gray-500 mt-1">Create new keys for enhanced security</p>
                    </div>
                  </div>
                  <RefreshCw className="w-4 h-4 text-gray-500" />
                </div>
              </div>

              {/* Two-Factor Authentication */}
              <div className="settings-section">
                <h3 className="settings-section-title">Two-Factor Authentication</h3>
                
                <div className="settings-card">
                  <div>
                    <p className="font-medium">2FA Status</p>
                    <p className="text-xs text-gray-500 mt-1">Enabled</p>
                  </div>
                  <div className="status-badge">Active</div>
                </div>
              </div>

              {/* Privacy */}
              <div className="settings-section">
                <h3 className="settings-section-title">Privacy</h3>
                
                <div className="privacy-item">
                  <label htmlFor="screenshot">Screenshot Protection</label>
                  <input 
                    id="screenshot"
                    type="checkbox" 
                    defaultChecked 
                    className="checkbox" 
                  />
                </div>
                
                <div className="privacy-item">
                  <label htmlFor="typing">Typing Indicators</label>
                  <input 
                    id="typing"
                    type="checkbox" 
                    defaultChecked 
                    className="checkbox" 
                  />
                </div>
                
                <div className="privacy-item">
                  <label htmlFor="receipts">Read Receipts</label>
                  <input 
                    id="receipts"
                    type="checkbox" 
                    defaultChecked 
                    className="checkbox" 
                  />
                </div>
              </div>
            </>
          )}

          {activeTab === 'appearance' && (
            <div className="settings-section">
              <h3 className="settings-section-title">Theme</h3>
              <p className="text-sm text-gray-500">Appearance settings will be available here.</p>
            </div>
          )}

          {activeTab === 'account' && (
            <div className="settings-section">
              <h3 className="settings-section-title">Account Information</h3>
              <p className="text-sm text-gray-500">Account settings will be available here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;

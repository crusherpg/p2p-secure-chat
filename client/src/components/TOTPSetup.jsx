import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, Copy, Download, CheckCircle, AlertCircle } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';
import toast from 'react-hot-toast';

const TOTPSetup = ({ onComplete }) => {
  const { setupTOTP, verifyTOTP } = useAuth();
  const [step, setStep] = useState(1); // 1: Setup, 2: Verify, 3: Backup Codes
  const [qrCode, setQrCode] = useState('');
  const [manualEntry, setManualEntry] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [backupCodes, setBackupCodes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSetupTOTP = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await setupTOTP();
      if (response.success) {
        setQrCode(response.qrCode);
        setManualEntry(response.manualEntry);
        setStep(2);
      } else {
        setError(response.message || 'Failed to setup 2FA');
      }
    } catch (error) {
      console.error('TOTP setup error:', error);
      setError('Failed to setup 2FA. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyTOTP = async (e) => {
    e.preventDefault();
    if (totpCode.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const response = await verifyTOTP(totpCode);
      if (response.success) {
        setBackupCodes(response.backupCodes || []);
        setStep(3);
      } else {
        setError(response.message || 'Invalid verification code');
      }
    } catch (error) {
      console.error('TOTP verification error:', error);
      setError('Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard!');
    } catch (error) {
      console.error('Clipboard error:', error);
      toast.error('Failed to copy to clipboard');
    }
  };

  const downloadBackupCodes = () => {
    const codesText = backupCodes.join('\n');
    const blob = new Blob([`P2P Secure Chat - Backup Codes\n\n${codesText}\n\nKeep these codes safe! Each code can only be used once.`], {
      type: 'text/plain'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'p2p-chat-backup-codes.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const renderStep1 = () => (
    <div className="text-center">
      <div className="w-16 h-16 mx-auto bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center mb-6">
        <Shield className="w-8 h-8 text-primary-600 dark:text-primary-400" />
      </div>
      
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
        Set up Two-Factor Authentication
      </h2>
      
      <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
        Add an extra layer of security to your P2P Secure Chat account. You'll need an authenticator app like Google Authenticator or Authy.
      </p>
      
      <div className="space-y-4 text-left max-w-sm mx-auto mb-8">
        <div className="flex items-start space-x-3">
          <div className="w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm font-medium">1</div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Download an authenticator app (Google Authenticator, Authy, etc.)
          </p>
        </div>
        
        <div className="flex items-start space-x-3">
          <div className="w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm font-medium">2</div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Scan the QR code or enter the setup key manually
          </p>
        </div>
        
        <div className="flex items-start space-x-3">
          <div className="w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm font-medium">3</div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Enter the 6-digit code from your app to complete setup
          </p>
        </div>
      </div>
      
      <button
        onClick={handleSetupTOTP}
        disabled={loading}
        className="bg-primary-600 text-white px-8 py-3 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 mx-auto"
      >
        {loading ? (
          <LoadingSpinner size="sm" className="text-white" />
        ) : (
          <Shield className="w-5 h-5" />
        )}
        <span>{loading ? 'Setting up...' : 'Continue Setup'}</span>
      </button>
    </div>
  );

  const renderStep2 = () => (
    <div className="max-w-md mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Scan QR Code
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Scan this QR code with your authenticator app
        </p>
      </div>
      
      {/* QR Code */}
      {qrCode && (
        <div className="bg-white p-6 rounded-lg mb-6 text-center">
          <img
            src={qrCode}
            alt="TOTP QR Code"
            className="mx-auto max-w-full h-auto"
            style={{ maxWidth: '200px' }}
          />
        </div>
      )}
      
      {/* Manual Entry */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Can't scan? Enter this code manually:
        </h3>
        <div className="flex items-center space-x-2">
          <code className="flex-1 bg-gray-100 dark:bg-dark-700 px-3 py-2 rounded text-sm font-mono break-all">
            {manualEntry}
          </code>
          <button
            onClick={() => copyToClipboard(manualEntry)}
            className="p-2 text-gray-500 hover:text-primary-600 transition-colors"
            title="Copy to clipboard"
          >
            <Copy className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      {/* Verification Form */}
      <form onSubmit={handleVerifyTOTP} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Enter the 6-digit code from your authenticator app:
          </label>
          <input
            type="text"
            value={totpCode}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, '').slice(0, 6);
              setTotpCode(value);
              setError('');
            }}
            placeholder="000000"
            className="w-full px-4 py-3 text-center text-lg font-mono tracking-widest border border-gray-300 dark:border-dark-600 rounded-lg bg-white dark:bg-dark-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            maxLength="6"
            autoComplete="off"
          />
        </div>
        
        {error && (
          <div className="flex items-center space-x-2 text-red-600 dark:text-red-400">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">{error}</span>
          </div>
        )}
        
        <button
          type="submit"
          disabled={loading || totpCode.length !== 6}
          className="w-full bg-primary-600 text-white py-3 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
        >
          {loading ? (
            <LoadingSpinner size="sm" className="text-white" />
          ) : (
            <CheckCircle className="w-5 h-5" />
          )}
          <span>{loading ? 'Verifying...' : 'Verify & Enable 2FA'}</span>
        </button>
      </form>
    </div>
  );

  const renderStep3 = () => (
    <div className="max-w-md mx-auto">
      <div className="text-center mb-8">
        <div className="w-16 h-16 mx-auto bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mb-4">
          <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Two-Factor Authentication Enabled!
        </h2>
        
        <p className="text-gray-600 dark:text-gray-400">
          Your account is now protected with 2FA. Save these backup codes in a safe place.
        </p>
      </div>
      
      {/* Backup Codes */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
          Backup Codes:
        </h3>
        
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-4">
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-800 dark:text-yellow-200">
              <p className="font-medium mb-1">Important:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Each backup code can only be used once</li>
                <li>Keep them in a secure location</li>
                <li>Use them if you lose access to your authenticator app</li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-2 mb-4">
          {backupCodes.map((code, index) => (
            <div key={index} className="bg-gray-100 dark:bg-dark-700 px-3 py-2 rounded font-mono text-sm text-center">
              {code}
            </div>
          ))}
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={() => copyToClipboard(backupCodes.join(', '))}
            className="flex-1 flex items-center justify-center space-x-2 bg-gray-200 dark:bg-dark-600 text-gray-700 dark:text-gray-300 py-2 px-4 rounded-lg hover:bg-gray-300 dark:hover:bg-dark-500 transition-colors"
          >
            <Copy className="w-4 h-4" />
            <span>Copy</span>
          </button>
          
          <button
            onClick={downloadBackupCodes}
            className="flex-1 flex items-center justify-center space-x-2 bg-gray-200 dark:bg-dark-600 text-gray-700 dark:text-gray-300 py-2 px-4 rounded-lg hover:bg-gray-300 dark:hover:bg-dark-500 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Download</span>
          </button>
        </div>
      </div>
      
      <button
        onClick={onComplete}
        className="w-full bg-primary-600 text-white py-3 rounded-lg hover:bg-primary-700 transition-colors"
      >
        Continue to Chat
      </button>
    </div>
  );

  return (
    <div className="w-full max-w-lg mx-auto bg-white dark:bg-dark-800 rounded-lg shadow-xl p-8">
      {error && step === 1 && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            <span className="text-red-600 dark:text-red-400">{error}</span>
          </div>
        </div>
      )}
      
      {step === 1 && renderStep1()}
      {step === 2 && renderStep2()}
      {step === 3 && renderStep3()}
    </div>
  );
};

export default TOTPSetup;
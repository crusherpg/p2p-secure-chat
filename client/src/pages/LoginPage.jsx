import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Eye, EyeOff, Lock, Mail, User, Shield, Moon, Sun } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import TOTPSetup from '../components/TOTPSetup';

const LoginPage = () => {
  const { login, register, loading } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showTOTPSetup, setShowTOTPSetup] = useState(false);
  const [requiresTOTP, setRequiresTOTP] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
    totpCode: ''
  });
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (!isLogin && formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (!isLogin && !formData.username) {
      newErrors.username = 'Username is required';
    }

    if (requiresTOTP && !formData.totpCode) {
      newErrors.totpCode = '2FA code is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      if (isLogin) {
        const result = await login({
          email: formData.email,
          password: formData.password,
          totpCode: formData.totpCode
        });

        if (result.requiresTOTP) {
          setRequiresTOTP(true);
        } else if (result.success) {
          // Login successful, user will be redirected by AuthContext
        }
      } else {
        const result = await register({
          email: formData.email,
          password: formData.password,
          username: formData.username
        });

        if (result.success) {
          setShowTOTPSetup(true);
        }
      }
    } catch (error) {
      console.error('Auth error:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setRequiresTOTP(false);
    setErrors({});
    setFormData({
      email: '',
      password: '',
      username: '',
      totpCode: ''
    });
  };

  if (showTOTPSetup) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-900 px-4 sm:px-6 lg:px-8">
        <TOTPSetup onComplete={() => setShowTOTPSetup(false)} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-900 px-4 sm:px-6 lg:px-8">
      {/* Theme Toggle */}
      <button
        onClick={toggleTheme}
        className="absolute top-4 right-4 p-3 rounded-full bg-white dark:bg-dark-800 shadow-lg hover:shadow-xl transition-all duration-200 z-10"
        aria-label="Toggle theme"
      >
        {isDark ? (
          <Sun className="w-5 h-5 text-yellow-500" />
        ) : (
          <Moon className="w-5 h-5 text-gray-600" />
        )}
      </button>

      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-primary-600 rounded-full flex items-center justify-center mb-6">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            P2P Secure Chat
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            End-to-end encrypted messaging
          </p>
        </div>

        {/* Form */}
        <div className="bg-white dark:bg-dark-800 py-8 px-6 shadow-xl rounded-lg sm:px-8">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {isLogin ? 'Sign in to your account' : 'Create your account'}
            </h3>
            {requiresTOTP && (
              <p className="mt-2 text-sm text-primary-600 dark:text-primary-400">
                Enter your 2FA code to complete login
              </p>
            )}
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email address
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`block w-full pl-10 pr-3 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-200 ${
                    errors.email
                      ? 'border-red-500 dark:border-red-500'
                      : 'border-gray-300 dark:border-dark-600'
                  } bg-white dark:bg-dark-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400`}
                  placeholder="Enter your email"
                  disabled={loading}
                />
              </div>
              {errors.email && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.email}</p>
              )}
            </div>

            {/* Username (register only) */}
            {!isLogin && (
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Username
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    autoComplete="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    className={`block w-full pl-10 pr-3 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-200 ${
                      errors.username
                        ? 'border-red-500 dark:border-red-500'
                        : 'border-gray-300 dark:border-dark-600'
                    } bg-white dark:bg-dark-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400`}
                    placeholder="Choose a username"
                    disabled={loading}
                  />
                </div>
                {errors.username && (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.username}</p>
                )}
              </div>
            )}

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Password
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`block w-full pl-10 pr-10 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-200 ${
                    errors.password
                      ? 'border-red-500 dark:border-red-500'
                      : 'border-gray-300 dark:border-dark-600'
                  } bg-white dark:bg-dark-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400`}
                  placeholder={isLogin ? 'Enter your password' : 'Create a strong password'}
                  disabled={loading}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.password}</p>
              )}
              {!isLogin && (
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Must be at least 8 characters with uppercase, lowercase, number, and special character
                </p>
              )}
            </div>

            {/* TOTP Code */}
            {requiresTOTP && (
              <div>
                <label htmlFor="totpCode" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  2FA Code
                </label>
                <div className="mt-1">
                  <input
                    id="totpCode"
                    name="totpCode"
                    type="text"
                    value={formData.totpCode}
                    onChange={handleInputChange}
                    className={`block w-full px-3 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-200 text-center text-lg tracking-widest ${
                      errors.totpCode
                        ? 'border-red-500 dark:border-red-500'
                        : 'border-gray-300 dark:border-dark-600'
                    } bg-white dark:bg-dark-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400`}
                    placeholder="000000"
                    maxLength="6"
                    disabled={loading}
                  />
                </div>
                {errors.totpCode && (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.totpCode}</p>
                )}
              </div>
            )}

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {loading ? (
                  <LoadingSpinner size="sm" className="text-white" />
                ) : isLogin ? (
                  'Sign in'
                ) : (
                  'Create account'
                )}
              </button>
            </div>
          </form>

          {/* Toggle Mode */}
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={toggleMode}
              className="text-sm text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300 transition-colors duration-200"
              disabled={loading}
            >
              {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </button>
          </div>
        </div>

        {/* Security Notice */}
        <div className="text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            🔒 Your messages are end-to-end encrypted and stored securely
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
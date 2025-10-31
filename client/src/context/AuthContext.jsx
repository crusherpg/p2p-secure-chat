import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { socketService } from '../services/socketService';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('p2p_token'));

  useEffect(() => {
    if (token) {
      validateToken();
    } else {
      setLoading(false);
    }
  }, [token]);

  const validateToken = async () => {
    try {
      if (!token) {
        setLoading(false);
        return;
      }

      authService.setAuthToken(token);
      const response = await authService.getProfile();
      if (response.success) {
        setUser(response.user);
        // Ensure socket connection is up after token validation
        try {
          socketService.connect(token);
        } catch (e) {
          console.warn('[Auth] Socket connect after validateToken failed', e);
        }
      } else {
        await logout();
      }
    } catch (error) {
      console.error('Token validation error:', error);
      await logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    try {
      setLoading(true);
      const response = await authService.login(credentials);
      if (response.success) {
        const newToken = response.token;
        setToken(newToken);
        setUser(response.user);
        localStorage.setItem('p2p_token', newToken);
        authService.setAuthToken(newToken);
        try { socketService.connect(newToken); } catch (e) {}
        toast.success(`Welcome back, ${response.user.username}! 🎉`);
        return { success: true };
      } else if (response.requiresTOTP) {
        return { success: false, requiresTOTP: true, message: response.message };
      } else {
        toast.error(response.message || 'Login failed');
        return { success: false, message: response.message };
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Login failed. Please try again.');
      return { success: false, message: 'Network error' };
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setLoading(true);
      const response = await authService.register(userData);
      if (response.success) {
        const newToken = response.token;
        setToken(newToken);
        setUser(response.user);
        localStorage.setItem('p2p_token', newToken);
        authService.setAuthToken(newToken);
        try { socketService.connect(newToken); } catch (e) {}
        toast.success(`Account created successfully! Welcome, ${response.user.username}! 🎉`);
        return { success: true };
      } else {
        toast.error(response.message || 'Registration failed');
        return { success: false, message: response.message };
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast.error('Registration failed. Please try again.');
      return { success: false, message: 'Network error' };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      if (token) { await authService.logout(); }
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      try { socketService.disconnect(); } catch (e) {}
      setUser(null);
      setToken(null);
      localStorage.removeItem('p2p_token');
      authService.setAuthToken(null);
      toast.success('Logged out successfully 👋');
    }
  };

  const setupTOTP = async () => {
    try { return await authService.setupTOTP(); } 
    catch (error) { console.error('TOTP setup error:', error); toast.error('Failed to setup 2FA'); return { success: false }; }
  };

  const verifyTOTP = async (totpCode) => {
    try {
      const response = await authService.verifyTOTP(totpCode);
      if (response.success) {
        toast.success('2FA enabled successfully! 🔐');
        setUser(prev => prev ? { ...prev, totpEnabled: true } : null);
      }
      return response;
    } catch (error) {
      console.error('TOTP verification error:', error);
      toast.error('Failed to verify 2FA code');
      return { success: false };
    }
  };

  const value = { user, token, loading, login, register, logout, setupTOTP, verifyTOTP };
  return (<AuthContext.Provider value={value}>{children}</AuthContext.Provider>);
};

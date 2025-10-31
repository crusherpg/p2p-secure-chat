import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';
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

      // Set token for API requests
      authService.setAuthToken(token);
      
      const response = await authService.getProfile();
      if (response.success) {
        setUser(response.user);
      } else {
        logout();
      }
    } catch (error) {
      console.error('Token validation error:', error);
      logout();
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
      // Call logout API to clean up server-side session
      if (token) {
        await authService.logout();
      }
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      // Always clean up client-side state
      setUser(null);
      setToken(null);
      localStorage.removeItem('p2p_token');
      authService.setAuthToken(null);
      toast.success('Logged out successfully 👋');
    }
  };

  const setupTOTP = async () => {
    try {
      const response = await authService.setupTOTP();
      return response;
    } catch (error) {
      console.error('TOTP setup error:', error);
      toast.error('Failed to setup 2FA');
      return { success: false };
    }
  };

  const verifyTOTP = async (totpCode) => {
    try {
      const response = await authService.verifyTOTP(totpCode);
      if (response.success) {
        toast.success('2FA enabled successfully! 🔐');
        // Update user state to reflect TOTP enabled
        setUser(prev => prev ? { ...prev, totpEnabled: true } : null);
      }
      return response;
    } catch (error) {
      console.error('TOTP verification error:', error);
      toast.error('Failed to verify 2FA code');
      return { success: false };
    }
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    setupTOTP,
    verifyTOTP
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
import axios from 'axios';

class AuthService {
  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL || '/api';
    this.token = null;
    
    // Create axios instance
    this.api = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config) => {
        if (this.token) {
          config.headers.Authorization = `Bearer ${this.token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor to handle errors
    this.api.interceptors.response.use(
      (response) => response.data,
      (error) => {
        if (error.response?.status === 401) {
          // Token expired or invalid
          this.setAuthToken(null);
          localStorage.removeItem('p2p_token');
        }
        return Promise.reject(error);
      }
    );
  }

  setAuthToken(token) {
    this.token = token;
  }

  async register(userData) {
    try {
      const response = await this.api.post('/auth/register', userData);
      return response;
    } catch (error) {
      if (error.response?.data) {
        return error.response.data;
      }
      throw error;
    }
  }

  async login(credentials) {
    try {
      const response = await this.api.post('/auth/login', credentials);
      return response;
    } catch (error) {
      if (error.response?.data) {
        return error.response.data;
      }
      throw error;
    }
  }

  async logout() {
    try {
      const response = await this.api.post('/auth/logout');
      return response;
    } catch (error) {
      console.error('Logout error:', error);
      // Don't throw error for logout - always succeed client-side cleanup
      return { success: true };
    }
  }

  async getProfile() {
    try {
      const response = await this.api.get('/auth/profile');
      return response;
    } catch (error) {
      if (error.response?.data) {
        return error.response.data;
      }
      throw error;
    }
  }

  async setupTOTP() {
    try {
      const response = await this.api.post('/auth/totp/setup');
      return response;
    } catch (error) {
      if (error.response?.data) {
        return error.response.data;
      }
      throw error;
    }
  }

  async verifyTOTP(totpCode) {
    try {
      const response = await this.api.post('/auth/totp/verify', { totpCode });
      return response;
    } catch (error) {
      if (error.response?.data) {
        return error.response.data;
      }
      throw error;
    }
  }
}

export const authService = new AuthService();
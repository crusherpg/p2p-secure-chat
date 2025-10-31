/**
 * User Settings Service
 */
import axios from 'axios';

class UserService {
  constructor(){
    this.baseURL = import.meta.env.VITE_API_URL || '/api';
    this.api = axios.create({ baseURL: this.baseURL, headers: { 'Content-Type':'application/json' } });
  }

  setAuthToken(token){
    if (token) this.api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    else delete this.api.defaults.headers.common['Authorization'];
  }

  async updateProfile(payload){
    const { data } = await this.api.put('/users/profile', payload);
    return data;
  }

  async updatePrivacy(payload){
    const { data } = await this.api.put('/users/privacy', payload);
    return data;
  }
}

export const userService = new UserService();

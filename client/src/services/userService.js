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

  async getProfile(){
    const { data } = await this.api.get('/users/profile');
    return data?.user;
  }

  async updateProfile(updates){
    const { data } = await this.api.put('/users/profile', updates);
    return data?.user;
  }

  async updatePrivacy(settings){
    const { data } = await this.api.put('/users/privacy', settings);
    return data?.user;
  }

  async updateStatus(status){
    const { data } = await this.api.put('/users/status', { status });
    return data?.user;
  }

  async listOnline(limit=100){
    const { data } = await this.api.get('/users/online', { params: { limit } });
    return data?.users || [];
  }

  async searchUsers(q, limit=20){
    const { data } = await this.api.get('/users/search', { params: { q, limit } });
    return data?.users || [];
  }

  async getUser(userId){
    const { data } = await this.api.get(`/users/${userId}`);
    return data?.user;
  }

  async blockUser(userId){
    const { data } = await this.api.post(`/users/${userId}/block`);
    return data;
  }
}

export const userService = new UserService();
export default userService;

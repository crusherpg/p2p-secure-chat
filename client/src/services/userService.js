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

  async listOnline(limit=100){
    const { data } = await this.api.get(`/users/online`, { params: { limit } });
    return data?.users || [];
  }

  async searchUsers(q, limit=20){
    const { data } = await this.api.get(`/users/search`, { params: { q, limit } });
    return data?.users || [];
  }

  async getProfile(){
    const { data } = await this.api.get(`/users/profile`);
    return data?.user;
  }
}

export const userService = new UserService();
export default userService;

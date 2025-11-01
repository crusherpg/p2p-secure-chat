import axios from 'axios';

class MessageService {
  constructor(){
    this.baseURL = import.meta.env.VITE_API_URL || '/api';
    this.api = axios.create({ baseURL: this.baseURL, headers: { 'Content-Type':'application/json' } });
  }

  setAuthToken(token){
    if (token) this.api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    else delete this.api.defaults.headers.common['Authorization'];
  }

  async getConversations(){
    const { data } = await this.api.get('/messages/conversations');
    return data?.conversations || [];
  }

  async getHistory(conversationId, page=1, limit=50){
    const { data } = await this.api.get(`/messages/conversation/${conversationId}`, { params: { page, limit } });
    return { messages: data?.messages || [], pagination: data?.pagination || {} };
  }

  async sendMessage(payload){
    const { data } = await this.api.post('/messages/send', payload);
    return data;
  }

  async updateStatus(messageId, status){
    const { data } = await this.api.put(`/messages/${messageId}/status`, { status });
    return data;
  }

  async deleteMessage(messageId){
    const { data } = await this.api.delete(`/messages/${messageId}`);
    return data;
  }

  async uploadFile(file, onProgress){
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await axios.post(`${this.baseURL}/files/upload`, formData, {
      headers: { ...this.api.defaults.headers.common, 'Content-Type': 'multipart/form-data' },
      onUploadProgress: onProgress
    });
    return data;
  }
}

export const messageService = new MessageService();
export default messageService;

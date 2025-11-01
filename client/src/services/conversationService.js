import axios from 'axios';
import socketService from './socketService';

class ConversationService {
  constructor(){
    this.baseURL = import.meta.env.VITE_API_URL || '/api';
    this.api = axios.create({ baseURL: this.baseURL, headers:{'Content-Type':'application/json'} });
  }
  setAuthToken(token){ if(token) this.api.defaults.headers.common['Authorization']=`Bearer ${token}`; else delete this.api.defaults.headers.common['Authorization']; }

  async ensureConversationWith(userId){
    // For backends that use explicit conversations, try to fetch/derive.
    // Fallback: treat userId as conversationId (demo)
    try{
      const { data } = await this.api.get('/messages/conversations');
      const found = data?.conversations?.find(c=>c.participants?.some(p=>p.id===userId));
      if(found) return found.id;
    } catch {}
    return userId; // fallback mapping
  }
}

export const conversationService = new ConversationService();
export default conversationService;

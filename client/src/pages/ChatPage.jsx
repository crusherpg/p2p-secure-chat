import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Shield, Bell, Search, MoreVertical, Send, Paperclip, Smile, Mic, Check, CheckCheck, Upload, X, Settings } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import userService from '../services/userService';
import messageService from '../services/messageService';
import socketService from '../services/socketService';
import SettingsModal from '../components/SettingsModal';
import toast from 'react-hot-toast';

// ... utility components omitted for brevity (unchanged)

// Adjust selectUser() to use conversationId instead of userId to follow server rooms

const ChatPage = ({ onOpenSettings }) => {
  // ... state hooks unchanged

  const selectUser = async (u) => {
    // Derive conversationId = other user id for demo server (server expects conversation rooms by id provided)
    const conversationId = u.id; 
    const activeUser = { ...u, conversationId };
    setActive(activeUser);
    localStorage.setItem('p2p_active', JSON.stringify(activeUser));

    setLoadingMessages(true);
    setMessages([]);

    try {
      const { messages: history } = await messageService.getHistory(conversationId);
      const normalized = history.map(m => ({
        id: m.id || m._id,
        from: (m.from?.id || m.from) === user?.id ? 'me' : 'them',
        text: m.content?.encrypted ? '[Encrypted Message]' : (m.content || m.text || ''),
        ts: new Date(m.timestamp).getTime(),
        status: m.status || 'delivered',
        type: m.type || 'text',
        attachment: m.attachment
      }));
      setMessages(normalized);
    } catch (e) {
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  };

  // Join/leave with conversationId
  useEffect(()=>{
    if (!active?.conversationId) return;
    socketService.joinConversation(active.conversationId);
    return () => socketService.leaveConversation(active.conversationId);
  },[active?.conversationId]);

  // new_message handler should accept messages from conversation room
  useEffect(()=>{
    const newMessageHandler = (msg) => {
      if (!active?.conversationId) return;
      if (msg.conversationId !== active.conversationId) return;
      const normalized = {
        id: msg.id,
        from: (msg.from?.id || msg.from) === user?.id ? 'me' : 'them',
        text: msg.content?.encrypted ? '[Encrypted Message]' : (msg.content || msg.text || ''),
        ts: new Date(msg.timestamp).getTime(),
        status: msg.status || 'delivered',
        type: msg.type || 'text',
        attachment: msg.attachment
      };
      setMessages(prev => [...prev, normalized]);
    };
    socketService.on('new_message', newMessageHandler);
    return () => socketService.off('new_message', newMessageHandler);
  },[active?.conversationId, user?.id]);

  const send = async () => {
    if (!text.trim() || !active?.conversationId) return;
    const localId = `m-${Date.now()}`;
    const messageText = text.trim();
    setText('');
    setMessages(prev=>[...prev,{ id: localId, from:'me', text: messageText, ts: Date.now(), status:'sending' }]);

    try {
      const sent = socketService.sendMessage({
        conversationId: active.conversationId,
        content: messageText,
        type: 'text'
      });
      if (!sent){
        await messageService.sendMessage({ conversationId: active.conversationId, type:'text', encryptedContent: btoa(messageText), iv:'demo-iv', authTag:'demo-tag' });
      }
      setMessages(prev=>prev.map(m=>m.id===localId?{...m,status:'sent'}:m));
    } catch (e){
      setMessages(prev=>prev.map(m=>m.id===localId?{...m,status:'failed'}:m));
      toast.error('Failed to send message');
    }
  };

  // typing handlers must use conversationId
  const handleTyping = () => { if (active?.conversationId) socketService.startTyping(active.conversationId); };

  // ... rest of render unchanged
}

export default ChatPage;

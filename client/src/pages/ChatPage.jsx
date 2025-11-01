import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Shield, Bell, Search, MoreVertical, Send, Paperclip, Smile, Mic, Check, CheckCheck, Upload, X, Settings } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import userService from '../services/userService';
import messageService from '../services/messageService';
import socketService from '../services/socketService';
import { conversationService } from '../services/conversationService';
import SettingsModal from '../components/SettingsModal';
import toast from 'react-hot-toast';

// ... keep rest of ChatPage imports and helpers the same

// Replace selectUser definition with conversation resolver and history persistence

// inside component

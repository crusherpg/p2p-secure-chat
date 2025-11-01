import React, { useEffect, useRef, useState } from 'react';
import { Paperclip, Smile, Mic, Image as ImageIcon, Send } from 'lucide-react';

const EmojiPicker = ({ onPick }) => {
  const emojis = ['😀','😂','😍','👍','🙏','🔥','🎉','🥳','❤️','👏','😎','🤖'];
  return (
    <div className="absolute bottom-12 left-0 bg-white border border-gray-200 rounded-lg p-2 shadow-lg grid grid-cols-6 gap-1">
      {emojis.map(e => (
        <button key={e} onClick={() => onPick(e)} className="text-xl hover:bg-gray-100 rounded p-1">{e}</button>
      ))}
    </div>
  );
};

const GifPicker = ({ onPick }) => {
  const gifs = ['https://media.giphy.com/media/ICOgUNjpvO0PC/giphy.gif','https://media.giphy.com/media/l0HUqsz2jdQYElRm0/giphy.gif','https://media.giphy.com/media/3oEjI6SIIHBdRxXI40/giphy.gif'];
  return (
    <div className="absolute bottom-12 left-12 bg-white border border-gray-200 rounded-lg p-2 shadow-lg w-64">
      <p className="text-xs text-gray-500 mb-2">Quick GIFs</p>
      <div className="grid grid-cols-3 gap-2">
        {gifs.map((url,i)=> (
          <button key={i} onClick={() => onPick(url)} className="block w-full h-16 overflow-hidden rounded">
            <img src={url} alt="gif" className="w-full h-full object-cover" />
          </button>
        ))}
      </div>
    </div>
  );
};

const SpeechToText = ({ onResult }) => {
  const [listening,setListening] = useState(false);
  const recRef = useRef(null);
  
  useEffect(()=>{
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.lang = 'en-US';
      rec.interimResults = true;
      rec.maxAlternatives = 1;
      rec.onresult = (e) => {
        const t = Array.from(e.results).map(r => r[0].transcript).join(' ');
        onResult(t);
      };
      rec.onend = () => setListening(false);
      recRef.current = rec;
    }
  },[onResult]);

  const toggle = () => {
    if (!recRef.current) return;
    if (!listening) { recRef.current.start(); setListening(true); }
    else { recRef.current.stop(); setListening(false); }
  };

  return (
    <button type="button" onClick={toggle} className={`btn btn-icon w-8 h-8 ${listening ? 'ring-2 ring-blue-500' : ''}`}>
      <Mic className="w-4 h-4" />
    </button>
  );
};

const MessageInput = ({ onSend }) => {
  const [text,setText] = useState('');
  const [showEmoji,setShowEmoji] = useState(false);
  const [showGif,setShowGif] = useState(false);

  const send = () => {
    if (!text.trim()) return;
    onSend(text.trim());
    setText('');
  };

  const key = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  return (
    <div className="message-input relative">
      <div className="input-container">
        <button className="btn btn-icon w-8 h-8"><Paperclip className="w-4 h-4" /></button>
        <textarea className="message-textarea" rows={1} placeholder="Type a message..." value={text} onChange={e=>setText(e.target.value)} onKeyDown={key} />
        <button type="button" onClick={()=>setShowGif(s=>!s)} className="btn btn-icon w-8 h-8"><ImageIcon className="w-4 h-4" /></button>
        <button type="button" onClick={()=>setShowEmoji(s=>!s)} className="btn btn-icon w-8 h-8"><Smile className="w-4 h-4" /></button>
        <SpeechToText onResult={(t)=>setText(t)} />
        <button onClick={send} disabled={!text.trim()} className="btn btn-send"><Send className="w-4 h-4" /></button>
      </div>
      {showEmoji && <EmojiPicker onPick={(e)=>{setText(t=>t+e); setShowEmoji(false);}} />}
      {showGif && <GifPicker onPick={(url)=>{onSend(url); setShowGif(false);}} />}
    </div>
  );
};

export default MessageInput;

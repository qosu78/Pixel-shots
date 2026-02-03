
import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage } from '../types';
import { sendChatMessage, listenToChat } from '../services/firebaseService';

interface ChatBoxProps {
  roomId?: string;
  playerName: string;
  team?: 'A' | 'B';
  compact?: boolean;
}

const ChatBox: React.FC<ChatBoxProps> = ({ roomId = 'global', playerName, team, compact = false }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsub = listenToChat(roomId, (msgs) => {
      setMessages(msgs);
    });
    return () => unsub();
  }, [roomId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    const text = inputText;
    setInputText('');
    await sendChatMessage(text, playerName, roomId, team);
  };

  return (
    <div className={`flex flex-col bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden backdrop-blur-md ${compact ? 'h-48 w-64' : 'h-80 w-full'}`}>
      <div className="bg-slate-800/50 px-3 py-1 border-b border-slate-700 flex justify-between items-center">
        <span className="text-[9px] pixel-font text-slate-400 uppercase tracking-widest">
          {roomId === 'global' ? 'Global Comms' : `Room: ${roomId.substring(0,8)}`}
        </span>
        <div className="flex space-x-1">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/50"></div>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2 scroll-smooth">
        {messages.map((msg) => (
          <div key={msg.id} className="text-[10px] leading-tight flex flex-col">
            <span className={`font-black uppercase tracking-tighter ${msg.sender === playerName ? 'text-cyan-400' : msg.team === 'A' ? 'text-rose-500' : msg.team === 'B' ? 'text-blue-400' : 'text-slate-400'}`}>
              {msg.sender}:
            </span>
            <span className="text-white break-words mt-0.5 opacity-90">{msg.text}</span>
          </div>
        ))}
      </div>

      <form onSubmit={handleSend} className="p-2 bg-black/40 border-t border-slate-800 flex space-x-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="TYPE MESSAGE..."
          className="flex-1 bg-slate-950 border border-slate-800 px-3 py-1.5 text-[10px] pixel-font text-white focus:outline-none focus:border-cyan-600 transition-colors"
        />
        <button 
          type="submit" 
          className="bg-cyan-600 px-3 py-1.5 text-[10px] pixel-font text-black hover:bg-cyan-400 transition-colors"
        >
          SEND
        </button>
      </form>
    </div>
  );
};

export default ChatBox;

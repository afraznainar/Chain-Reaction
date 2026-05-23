import React, { useState, useEffect, useRef } from 'react';
import { db, auth } from '../lib/firebase';
import { collection, addDoc, query, orderBy, limit, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { socket } from '../lib/socket';
import { ChatMessage } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Globe, MessageSquare, X } from 'lucide-react';
import { cn } from '../lib/utils';
import PlayerAvatar from './PlayerAvatar';

import { audioController } from '../lib/audio';

interface ChatPanelProps {
  roomId?: string;
  user?: any;
  avatar?: { icon: string; color: string };
  onClose?: () => void;
  isSpectator?: boolean;
  isPlaying?: boolean;
}

export default function ChatPanel({ roomId, user, avatar, onClose, isSpectator = false, isPlaying = false }: ChatPanelProps) {
  const [activeTab, setActiveTab] = useState<'room' | 'global'>(roomId ? 'room' : 'global');
  const [roomMessages, setRoomMessages] = useState<ChatMessage[]>([]);
  const [globalMessages, setGlobalMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Global Chat Listener
  useEffect(() => {
    const q = query(collection(db, 'global_messages'), orderBy('createdAt', 'desc'), limit(50));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: (doc.data().createdAt?.toDate()?.getTime()) || Date.now()
      })).reverse() as ChatMessage[];
      setGlobalMessages(msgs);
    });
    return () => unsubscribe();
  }, []);

  // Room Chat Listener
  useEffect(() => {
    if (!roomId) return;
    socket.on('room_chat_message', (msg: ChatMessage) => {
      setRoomMessages(prev => [...prev, msg]);
      if (msg.isSpectator) {
        // Only play soft/non-disruptive sound if the local user is also a spectator
        if (isSpectator) {
          audioController.play('place');
        }
      } else {
        audioController.play('message');
      }
    });
    return () => {
      socket.off('room_chat_message');
    };
  }, [roomId, isSpectator]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [roomMessages, globalMessages, activeTab]);

  const handleSendReaction = (text: string) => {
    if (!user || !roomId) return;
    socket.emit('send_room_chat', {
      roomId,
      text,
      senderId: socket.id,
      senderName: user.displayName || 'Watcher',
      avatar
    });
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !user) return;

    const text = inputText.trim();
    setInputText('');

    if (activeTab === 'global') {
      try {
        await addDoc(collection(db, 'global_messages'), {
          senderId: user.uid,
          senderName: user.displayName || 'Anonymous',
          text,
          avatar: avatar,
          createdAt: serverTimestamp()
        });
      } catch (err) {
        console.error("Error sending global message:", err);
      }
    } else if (roomId) {
      if (isSpectator && isPlaying) return;

      socket.emit('send_room_chat', {
        roomId,
        text,
        senderId: socket.id,
        senderName: user.displayName || 'Pilot',
        avatar
      });
    }
  };

  const messages = activeTab === 'global' ? globalMessages : roomMessages;

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a] lg:border-l border-white/10 w-full lg:w-80 rounded-xl lg:rounded-none overflow-hidden">
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <div className="flex gap-2">
          <button 
            onClick={() => setActiveTab('global')}
            className={cn(
              "px-3 py-1 rounded-full text-[10px] uppercase font-black transition-all flex items-center gap-1.5",
              activeTab === 'global' ? "bg-white text-black" : "text-white/40 hover:text-white"
            )}
          >
            <Globe className="w-3 h-3" /> Global
          </button>
          {roomId && (
            <button 
              onClick={() => setActiveTab('room')}
              className={cn(
                "px-3 py-1 rounded-full text-[10px] uppercase font-black transition-all flex items-center gap-1.5",
                activeTab === 'room' ? "bg-white text-black" : "text-white/40 hover:text-white"
              )}
            >
              <MessageSquare className="w-3 h-3" /> Tactical
            </button>
          )}
        </div>
        {onClose && (
          <button onClick={onClose} className="text-white/20 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {messages.length === 0 && (
          <div className="h-full flex items-center justify-center text-white/10 text-[10px] uppercase tracking-widest font-bold">
            No transmissions detected
          </div>
        )}
        {messages.map((msg, idx) => (
          <div key={msg.id || `msg-${idx}`} className="group">
            <div className="flex items-start gap-2">
              <PlayerAvatar icon={msg.avatar?.icon} color={msg.avatar?.color} size="sm" className="mt-1" />
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between mb-0.5">
                  <span className="text-[10px] font-black uppercase text-white/40 truncate flex items-center">
                    {msg.senderName}
                    {msg.isSpectator && (
                      <span className="ml-1.5 px-1 py-0.25 text-[7px] bg-[#08f7fe]/15 text-[#08f7fe] rounded uppercase font-black tracking-widest border border-[#08f7fe]/30">
                        Watcher
                      </span>
                    )}
                  </span>
                  <span className="text-[8px] font-mono text-white/10">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <p className={cn(
                  "text-xs leading-relaxed break-words",
                  msg.isReaction ? "text-[#08f7fe] italic font-semibold tracking-wide bg-[#08f7fe]/5 px-2 py-1 rounded border border-[#08f7fe]/10" : "text-white/80"
                )}>
                  {msg.text}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-white/10 bg-black/40">
        {!user ? (
          <p className="text-[10px] text-center text-white/20 uppercase font-black py-2">Auth Required to React</p>
        ) : isSpectator && isPlaying && activeTab === 'room' ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[8px] uppercase font-black tracking-widest text-[#08f7fe]/60">Spectator Reactions Only</span>
              <span className="text-[8px] text-white/20 uppercase font-mono">Tap a reaction</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { text: "💥 BOOM!", color: "hover:border-red-500/50 hover:bg-red-500/5 hover:text-red-400" },
                { text: "⚡ Brilliant Move!", color: "hover:border-[#08f7fe]/50 hover:bg-[#08f7fe]/5 hover:text-[#08f7fe]" },
                { text: "🤯 Insane Chain!", color: "hover:border-purple-500/50 hover:bg-purple-500/5 hover:text-purple-400" },
                { text: "😮 So Close!", color: "hover:border-yellow-500/50 hover:bg-yellow-500/5 hover:text-yellow-400" },
                { text: "👀 Intense!", color: "hover:border-orange-500/50 hover:bg-orange-500/5 hover:text-orange-400" },
                { text: "🤖 AI is cooking!", color: "hover:border-[#08f7fe]/50 hover:bg-[#08f7fe]/5 hover:text-[#08f7fe]" },
                { text: "👑 GG!", color: "hover:border-green-500/50 hover:bg-green-500/5 hover:text-green-400" },
                { text: "💔 Oof!", color: "hover:border-pink-500/50 hover:bg-pink-500/5 hover:text-pink-400" }
              ].map((reaction) => (
                <button
                  key={reaction.text}
                  type="button"
                  onClick={() => handleSendReaction(reaction.text)}
                  className={cn(
                    "py-2 px-2.5 bg-white/[0.03] border border-white/5 rounded-lg text-[10px] font-black uppercase text-white/60 tracking-tight transition-all text-left whitespace-nowrap overflow-hidden text-ellipsis flex items-center gap-1.5 active:scale-95 duration-150",
                    reaction.color
                  )}
                >
                  {reaction.text}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <form onSubmit={handleSend} className="relative">
            <input 
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={activeTab === 'global' ? "Broadcast to everyone..." : "Message squad..."}
              className="w-full bg-white/5 border border-white/10 rounded-lg py-2 pl-3 pr-10 text-xs focus:border-[#ff2e63] outline-none transition-colors"
            />
            <button 
              type="submit"
              disabled={!inputText.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-white/20 hover:text-[#ff2e63] disabled:opacity-0 transition-all"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

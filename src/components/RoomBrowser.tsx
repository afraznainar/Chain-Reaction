import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { socket } from '../lib/socket';
import { X, Users, Globe, ExternalLink, RefreshCw } from 'lucide-react';
import PlayerAvatar from './PlayerAvatar';
import { cn } from '../lib/utils';

interface ActiveRoom {
  id: string;
  playerCount: number;
  maxPlayers: number;
  hostName: string;
}

interface RoomBrowserProps {
  onJoin: (roomId: string) => void;
  onClose: () => void;
}

export default function RoomBrowser({ onJoin, onClose }: RoomBrowserProps) {
  const [rooms, setRooms] = useState<ActiveRoom[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRooms = () => {
    setLoading(true);
    socket.emit('get_active_rooms');
  };

  useEffect(() => {
    fetchRooms();
    socket.on('active_rooms_list', (roomList: ActiveRoom[]) => {
      setRooms(roomList);
      setLoading(false);
    });

    return () => {
      socket.off('active_rooms_list');
    };
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4"
    >
      <div className="w-full max-w-2xl bg-[#0a0a0a] border border-white/10 p-6 sm:p-8 rounded-2xl sm:rounded-3xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4">
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-[#ff2e63]/10 rounded-2xl">
              <Globe className="w-8 h-8 text-[#ff2e63]" />
            </div>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black italic uppercase tracking-tighter skew-x-[-6deg] underline decoration-[#ff2e63] decoration-[4px] sm:decoration-8">Global Arenas</h2>
          <p className="text-[10px] uppercase tracking-[0.3em] font-medium text-white/30 mt-2">Active frequencies across the network</p>
        </div>

        <div className="flex justify-end mb-4">
          <button 
            onClick={fetchRooms}
            className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-black text-white/30 hover:text-white transition-colors"
          >
            <RefreshCw className={cn("w-3 h-3", loading && "animate-spin")} /> Refresh
          </button>
        </div>

        <div className="space-y-3 overflow-y-auto max-h-[50vh] pr-2 custom-scrollbar min-h-[200px]">
          {loading ? (
             <div className="h-[200px] flex flex-col items-center justify-center gap-4">
                <div className="w-8 h-8 border-4 border-white/10 border-t-[#ff2e63] rounded-full animate-spin"></div>
                <p className="text-[10px] uppercase font-black text-white/20 tracking-tighter">Scanning frequencies...</p>
             </div>
          ) : rooms.length === 0 ? (
            <div className="h-[200px] flex flex-col items-center justify-center gap-4 border-2 border-dashed border-white/5 rounded-2xl">
              <p className="text-[10px] uppercase font-black text-white/20 tracking-tighter">No active arenas found</p>
              <button 
                onClick={onClose}
                className="px-6 py-2 bg-white/5 border border-white/10 text-[9px] uppercase font-black tracking-widest hover:bg-white/10 transition-colors"
              >
                Create New Arena
              </button>
            </div>
          ) : (
            rooms.map((room) => (
              <div 
                key={room.id}
                className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-2xl hover:bg-white/[0.04] hover:border-white/10 transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center font-black italic text-lg text-white/30">
                    {room.id.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-bold text-sm sm:text-base leading-none mb-1 flex items-center gap-2">
                       Arena {room.id}
                       <span className="text-[9px] px-2 py-0.5 bg-[#ff2e63]/20 text-[#ff2e63] font-black uppercase rounded-full">Lobby</span>
                    </div>
                    <div className="text-[9px] sm:text-[10px] uppercase tracking-widest text-white/30">
                      Host: <span className="text-white/60">{room.hostName}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 sm:gap-8">
                  <div className="text-right">
                    <div className="flex items-center gap-1 justify-end text-white/60">
                      <Users className="w-3 h-3" />
                      <span className="font-mono text-sm font-bold">{room.playerCount}/{room.maxPlayers}</span>
                    </div>
                    <p className="text-[8px] uppercase font-black text-white/20">Occupancy</p>
                  </div>
                  <button 
                    onClick={() => onJoin(room.id)}
                    className="p-3 bg-[#ff2e63]/20 text-[#ff2e63] rounded-xl hover:bg-[#ff2e63] hover:text-white transition-all group-hover:scale-105"
                  >
                    <ExternalLink className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-8 pt-6 border-t border-white/10">
          <p className="text-[9px] uppercase tracking-tighter text-white/20 text-center italic">
            Atomic Reaction Global Mesh v.2.4.0
          </p>
        </div>
      </div>
    </motion.div>
  );
}

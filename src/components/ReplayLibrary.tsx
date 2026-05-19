import React, { useState, useEffect } from 'react';
import { getReplays } from '../lib/firebase';
import { Replay, COLOR_MAP } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Film, Play, Calendar, Users, Trophy, ChevronRight, Search, X } from 'lucide-react';
import { cn } from '../lib/utils';
import PlayerAvatar from './PlayerAvatar';

interface ReplayLibraryProps {
  onSelect: (replay: Replay) => void;
  onClose: () => void;
}

export default function ReplayLibrary({ onSelect, onClose }: ReplayLibraryProps) {
  const [replays, setReplays] = useState<Replay[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    getReplays().then(data => {
      setReplays(data as Replay[]);
      setIsLoading(false);
    });
  }, []);

  const filteredReplays = replays.filter(r => 
    r.players.some(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    r.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-[#0a0a0a]/95 backdrop-blur-xl z-[90] flex flex-col items-center">
      <div className="w-full max-w-4xl h-full flex flex-col p-6">
        <header className="flex items-center justify-between mb-8">
           <div className="flex items-center gap-4">
              <div className="p-3 bg-[#ff2e63]/10 rounded-2xl">
                 <Film className="w-6 h-6 text-[#ff2e63]" />
              </div>
              <div>
                 <h2 className="text-2xl font-black uppercase tracking-widest text-white">Match Archives</h2>
                 <p className="text-[10px] text-white/40 font-bold uppercase tracking-[0.2em]">Review Tactical Engagements</p>
              </div>
           </div>
           <button 
             onClick={onClose}
             className="p-3 hover:bg-white/5 rounded-full transition-colors group"
           >
              <X className="w-6 h-6 text-white/20 group-hover:text-white" />
           </button>
        </header>

        <div className="relative mb-8">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
            <input 
              type="text"
              placeholder="Search by pilot name or arena key..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold placeholder:text-white/10 focus:border-[#ff2e63] outline-none transition-all"
            />
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-2">
           {isLoading ? (
             <div className="h-full flex items-center justify-center">
                <div className="text-[10px] uppercase font-black tracking-widest text-[#ff2e63] animate-pulse">Scanning Archives...</div>
             </div>
           ) : filteredReplays.length === 0 ? (
             <div className="h-full flex flex-col items-center justify-center text-white/20">
                <Film className="w-12 h-12 mb-4 opacity-20" />
                <p className="text-[10px] uppercase font-black tracking-widest text-center">No classified logs found matching your query</p>
             </div>
           ) : (
             filteredReplays.map((replay) => (
               <motion.button
                 key={replay.id}
                 layoutId={replay.id}
                 onClick={() => onSelect(replay)}
                 className="w-full bg-[#111] border border-white/10 p-5 rounded-2xl flex items-center justify-between hover:bg-white/5 hover:border-white/20 transition-all text-left relative overflow-hidden group"
               >
                 <div className="flex items-center gap-6 relative z-10">
                    <div className="w-12 h-12 rounded-xl bg-black flex flex-col items-center justify-center font-mono text-[8px] font-black leading-tight border border-white/5">
                        <span className="text-white/30 uppercase">ID</span>
                        <span className="text-white text-xs">{replay.id.slice(0, 4).toUpperCase()}</span>
                    </div>

                    <div className="space-y-1">
                       <div className="flex items-center gap-3">
                          <p className="text-sm font-black uppercase text-white group-hover:text-[#ff2e63] transition-colors">{replay.moves.length} Moves</p>
                          <span className="text-[10px] text-white/20 font-mono italic">
                            {new Date(replay.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                       </div>
                       <div className="flex items-center gap-2">
                          <div className="flex -space-x-1.5">
                             {replay.players.map((p) => (
                               <div key={p.id}>
                                 <PlayerAvatar 
                                   icon={p.avatar?.icon} 
                                   color={p.avatar?.color || COLOR_MAP[p.color as keyof typeof COLOR_MAP]} 
                                   size="xs" 
                                 />
                               </div>
                             ))}
                          </div>
                          <span className="text-[9px] uppercase font-black text-white/30 tracking-widest">
                            {replay.players.length} Pilots Engaged
                          </span>
                       </div>
                    </div>
                 </div>

                 <div className="flex items-center gap-6 relative z-10">
                    <div className="text-right">
                       <div className="flex items-center gap-2 justify-end mb-1">
                          <Trophy className="w-3 h-3 text-yellow-500" />
                          <span className="text-[10px] font-black uppercase text-yellow-500 italic">Victor</span>
                       </div>
                       <p className="text-sm font-black uppercase text-white/80">{replay.players.find(p => p.id === replay.winnerId)?.name || 'N/A'}</p>
                    </div>
                    <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center group-hover:bg-[#ff2e63] group-hover:border-[#ff2e63] transition-all group-hover:scale-110">
                       <Play className="w-4 h-4 text-white group-hover:fill-white" />
                    </div>
                 </div>

                 <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.02] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
               </motion.button>
             ))
           )}
        </div>

        <div className="mt-8 p-4 border border-white/5 rounded-xl bg-white/[0.02]">
           <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-[#ff2e63] animate-pulse" />
              <p className="text-[9px] uppercase font-black text-white/40 tracking-[0.3em]">Archives auto-purge older records every 7 solar cycles</p>
           </div>
        </div>
      </div>
    </div>
  );
}

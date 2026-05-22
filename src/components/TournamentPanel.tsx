import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Users, X, DollarSign, Zap, ShieldCheck, Skull, RefreshCw, ChevronRight, Award } from 'lucide-react';
import { cn } from '../lib/utils';
import { getTournamentParticipant, joinTournament, getTournamentLeaderboard } from '../lib/firebase';
import PlayerAvatar from './PlayerAvatar';

interface TournamentPanelProps {
  user: any;
  avatar: any;
  onClose: () => void;
}

export default function TournamentPanel({ user, avatar, onClose }: TournamentPanelProps) {
  const [participant, setParticipant] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [signingUp, setSigningUp] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    if (user) {
      const p = await getTournamentParticipant(user.uid);
      setParticipant(p);
    }
    const lb = await getTournamentLeaderboard();
    setLeaderboard(lb);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Polling for leaderboard updates
    return () => clearInterval(interval);
  }, [user]);

  const handleJoin = async (isSecondChance: boolean = false) => {
    if (!user) return;
    setSigningUp(true);
    try {
      // Mock payment delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      const newP = await joinTournament(user, avatar, isSecondChance);
      setParticipant(newP);
      await fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setSigningUp(false);
    }
  };

  return (
    <motion.div 
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      className="fixed inset-y-0 right-0 w-full sm:w-[500px] bg-[#0a0a0a] border-l border-white/10 z-[100] flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.8)]"
    >
      {/* Header */}
      <div className="p-8 border-b border-white/5 bg-gradient-to-r from-[#ff2e63]/10 to-transparent flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-[#ff2e63]/20 rounded-2xl border border-[#ff2e63]/30">
            <Trophy className="w-6 h-6 text-[#ff2e63]" />
          </div>
          <div>
            <h2 className="text-2xl font-black uppercase italic tracking-tighter text-white">Hyper Nexus</h2>
            <p className="text-[10px] text-white/40 uppercase tracking-[0.3em] font-bold">50,000 USDT Season</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors group">
          <X className="w-6 h-6 text-white/40 group-hover:text-white" />
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-6">
        <div className="relative">
          <div className="absolute inset-0 bg-[#ff2e63]/20 blur-3xl rounded-full" />
          <Trophy className="w-24 h-24 text-[#ff2e63] relative z-10 animate-bounce" />
        </div>
        <div className="space-y-2">
          <h3 className="text-4xl font-black italic uppercase tracking-tighter text-white">Protocol Locked</h3>
          <p className="text-sm text-white/40 font-bold uppercase tracking-[0.3em]">Coming Soon to Nexus</p>
        </div>
        <div className="max-w-xs p-6 border border-white/10 bg-white/[0.02] rounded-3xl italic text-[11px] text-white/30 leading-relaxed">
          The Hyper Nexus tournament sequence is currently in dry-run mode. 
          Synchronization with global USDT liquidity pools is pending final validation.
        </div>
        <div className="flex flex-col gap-4 w-full">
          <div className="p-4 border border-[#ff2e63]/20 bg-[#ff2e63]/5 rounded-2xl flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#ff2e63]">Prize Pool</span>
            <span className="text-xl font-black italic text-white">$50,000 USDT</span>
          </div>
          <div className="p-4 border border-white/5 bg-white/[0.01] rounded-2xl flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-white/30 text-left">Registration<br/>Phase</span>
            <span className="text-sm font-black italic text-white uppercase italic">Offline</span>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="p-8 border-t border-white/5 bg-white/[0.01]">
        <div className="flex items-center gap-4 text-[10px] text-white/30 font-bold uppercase tracking-wider">
          <div className="flex items-center gap-1.5"><DollarSign className="w-3 h-3 text-[#ff2e63]" /> 1 USDT Entry</div>
          <div className="flex items-center gap-1.5"><RefreshCw className="w-3 h-3 text-yellow-500" /> 2.99 USDT Re-entry</div>
          <div className="flex items-center gap-1.5 ml-auto"><Award className="w-3 h-3 text-white" /> Limited Slot Nexus</div>
        </div>
      </div>
    </motion.div>
  );
}

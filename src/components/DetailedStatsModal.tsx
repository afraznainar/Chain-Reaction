import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Zap, Maximize2, Target, BarChart3, TrendingUp, Trophy } from 'lucide-react';
import { Player, COLOR_MAP } from '../types';
import PlayerAvatar from './PlayerAvatar';
import { cn } from '../lib/utils';

interface DetailedStatsModalProps {
  players: Player[];
  winnerId: string | null;
  onClose: () => void;
}

export default function DetailedStatsModal({ players, winnerId, onClose }: DetailedStatsModalProps) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-4 sm:p-8"
    >
      <div className="w-full max-w-4xl bg-[#0a0a0a] border border-white/10 p-6 sm:p-10 rounded-2xl sm:rounded-3xl relative overflow-hidden flex flex-col max-h-[90vh]">
        <div className="absolute top-0 right-0 p-4">
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="text-center mb-10 shrink-0">
          <div className="inline-flex items-center gap-3 px-4 py-1.5 bg-[#ff2e63]/10 border border-[#ff2e63]/20 rounded-full mb-4">
             <Trophy className="w-4 h-4 text-[#ff2e63]" />
             <span className="text-[10px] uppercase font-black tracking-[0.2em] text-[#ff2e63]">Match Result Summary</span>
          </div>
          <h2 className="text-4xl sm:text-6xl font-black italic uppercase tracking-tighter skew-x-[-6deg] underline decoration-[#ff2e63] decoration-8">Game Stats</h2>
          <p className="text-[10px] sm:text-[12px] uppercase tracking-[0.3em] font-medium text-white/30 mt-4">Detailed information about the last game</p>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-6">
          {players.map((player) => {
            const isWinner = player.id === winnerId;
            const stats = player.stats;
            const color = player.avatar?.color || COLOR_MAP[player.color];

            return (
              <div 
                key={player.id}
                className={cn(
                  "p-6 rounded-2xl border transition-all relative overflow-hidden",
                  isWinner ? "bg-white/[0.04] border-[#f5d300]/30" : "bg-white/[0.02] border-white/5"
                )}
              >
                {isWinner && (
                  <div className="absolute top-0 right-0 p-4">
                     <span className="text-[9px] font-black uppercase text-[#f5d300] bg-[#f5d300]/10 px-3 py-1 rounded-full border border-[#f5d300]/20 italic">Winner</span>
                  </div>
                )}

                <div className="flex flex-col lg:flex-row items-center gap-8">
                  {/* Pilot Identity */}
                  <div className="flex flex-col items-center gap-4 min-w-[200px]">
                    <PlayerAvatar 
                      icon={player.avatar?.icon} 
                      color={color} 
                      size="lg" 
                      className={cn(isWinner && "ring-4 ring-[#f5d300]/40 ring-offset-4 ring-offset-black")}
                    />
                    <div className="text-center">
                      <h3 className="text-2xl font-black italic uppercase tracking-tight leading-none mb-2">{player.name}</h3>
                      <p className="text-[10px] uppercase font-bold text-white/30 tracking-widest">{player.isAI ? 'AI Player' : 'Human Player'}</p>
                    </div>
                  </div>

                  {/* Core Metrics Grid */}
                  <div className="flex-1 w-full grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                    <StatCard 
                      icon={<Zap className="w-3.5 h-3.5" />} 
                      label="Total Explosions" 
                      value={stats?.explosionsTriggered || 0} 
                      color={color}
                    />
                    <StatCard 
                      icon={<Target className="w-3.5 h-3.5" />} 
                      label="Captures" 
                      value={stats?.cellsCaptured || 0} 
                      color={color}
                    />
                    <StatCard 
                      icon={<TrendingUp className="w-3.5 h-3.5" />} 
                      label="Peak Control" 
                      value={stats?.peakCellsControlled || 0} 
                      color={color}
                      unit=" Cells"
                    />
                    <StatCard 
                      icon={<BarChart3 className="w-3.5 h-3.5" />} 
                      label="Max Exp/Turn" 
                      value={stats?.maxExplosionsInTurn || 0} 
                      color={color}
                    />
                    <StatCard 
                      icon={<Maximize2 className="w-3.5 h-3.5" />} 
                      label="Longest Chain" 
                      value={stats?.maxChainReaction || 0} 
                      color={color}
                      unit=" Lvl"
                    />
                    <StatCard 
                      icon={<TrendingUp className="w-3.5 h-3.5" />} 
                      label="Sustained" 
                      value={Math.round((stats?.movesMade || 1) / (stats?.maxChainReaction || 1))} 
                      color={color}
                      unit=" Eff"
                    />
                  </div>
                </div>

                {/* Progress Visualizer */}
                <div className="mt-8 pt-6 border-t border-white/5 flex items-center gap-4">
                   <div className="text-[10px] uppercase font-black text-white/20 whitespace-nowrap">Board Control</div>
                   <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, (stats?.peakCellsControlled || 0) * 5)}%` }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: color }}
                      />
                   </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 pt-6 border-t border-white/10 flex justify-between items-center shrink-0">
          <p className="text-[9px] uppercase tracking-tighter text-white/20 italic">
            Match Statistics Information
          </p>
          <button 
            onClick={onClose}
            className="px-8 py-3 bg-white text-black font-black uppercase tracking-widest text-[10px] hover:bg-[#ff2e63] hover:text-white transition-all active:scale-95"
          >
            Close Stats
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function StatCard({ icon, label, value, color, unit = "" }: { icon: React.ReactNode, label: string, value: number | string, color: string, unit?: string }) {
  return (
    <div className="bg-black/40 border border-white/5 p-3 rounded-xl flex flex-col justify-between group hover:border-white/20 transition-colors">
      <div className="flex items-center justify-between mb-3">
        <div className="p-1.5 rounded-lg bg-white/5 text-white/30 group-hover:text-white transition-colors">
          {icon}
        </div>
      </div>
      <div>
        <p className="text-[8px] uppercase font-black text-white/20 mb-1 leading-none">{label}</p>
        <p className="text-xl font-black italic tracking-tighter leading-none" style={{ color }}>
          {value}<span className="text-[8px] uppercase tracking-tighter opacity-50 ml-0.5">{unit}</span>
        </p>
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { getTopPlayers } from '../lib/firebase';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Medal, X } from 'lucide-react';
import PlayerAvatar from './PlayerAvatar';

interface UserStats {
  userId: string;
  displayName: string;
  wins: number;
  losses: number;
  totalGames: number;
  photoURL?: string;
  avatarConfig?: {
    icon: string;
    color: string;
  };
}

export default function Leaderboard({ onClose }: { onClose: () => void }) {
  const [players, setPlayers] = useState<UserStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        const data = await getTopPlayers();
        setPlayers(data as UserStats[]);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchLeaderboard();
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4"
    >
      <div className="w-full max-w-2xl bg-[#111] border border-white/10 p-6 sm:p-8 rounded-2xl sm:rounded-3xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4">
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="text-center mb-8 sm:mb-10 pt-4 sm:pt-0">
          <h2 className="text-3xl sm:text-5xl font-black italic uppercase tracking-tighter skew-x-[-6deg] underline decoration-[#ff2e63] decoration-[4px] sm:decoration-8">World Rankings</h2>
          <p className="text-[9px] sm:text-[10px] uppercase tracking-[0.3em] font-medium text-white/30 mt-2">The Elite Pilots of Atomic Reaction</p>
        </div>

        {loading ? (
          <div className="py-20 text-center text-white/20 uppercase tracking-widest text-xs animate-pulse">Loading Archives...</div>
        ) : (
          <div className="space-y-2 overflow-y-auto max-h-[60vh] pr-1 sm:pr-4 custom-scrollbar">
            {players.map((player, index) => (
              <div 
                key={player.userId}
                className="flex flex-col sm:flex-row items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-2xl hover:bg-white/[0.05] transition-colors gap-4"
              >
                <div className="flex items-center gap-4 w-full sm:w-auto">
                  <div className="w-6 sm:w-8 font-mono text-lg sm:text-xl italic font-black text-white/20">
                    {index + 1}.
                  </div>
                  <div className="w-10 h-10 flex items-center justify-center shrink-0">
                    {player.avatarConfig ? (
                       <PlayerAvatar icon={player.avatarConfig.icon} color={player.avatarConfig.color} size="md" />
                    ) : player.photoURL ? (
                       <img src={player.photoURL} alt="" className="w-full h-full rounded-full" />
                    ) : (
                       <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-xs">?</div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-base sm:text-lg leading-none truncate">{player.displayName}</div>
                    <div className="text-[9px] sm:text-[10px] uppercase tracking-widest text-white/30 mt-1">Sorties: {player.totalGames}</div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between sm:justify-end gap-6 sm:gap-8 w-full sm:w-auto border-t border-white/5 sm:border-none pt-4 sm:pt-0">
                   <div className="text-center">
                     <div className="text-[9px] sm:text-[10px] uppercase tracking-tighter text-white/30 mb-1">Wins</div>
                     <div className="font-black text-xl sm:text-2xl text-[#f5d300] italic leading-none">{player.wins}</div>
                   </div>
                   <div className="text-center">
                     <div className="text-[9px] sm:text-[10px] uppercase tracking-tighter text-white/30 mb-1">Ratio</div>
                     <div className="font-mono text-[10px] sm:text-xs text-white/50">
                        {player.totalGames > 0 ? Math.round((player.wins / player.totalGames) * 100) : 0}%
                     </div>
                   </div>
                   {index < 3 && (
                     <div className={index === 0 ? "text-[#f5d300]" : index === 1 ? "text-slate-300" : "text-amber-600"}>
                       <Trophy className="w-5 h-5 fill-current" />
                     </div>
                   )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

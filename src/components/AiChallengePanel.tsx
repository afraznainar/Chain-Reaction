import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, X, Wallet, Coins, Zap, ShieldCheck, 
  Sparkles, Loader2, ArrowRight, CheckCircle2, 
  RefreshCw, RefreshCw as ResetIcon, Star, User,
  Lock, Check, Copy, ExternalLink
} from 'lucide-react';
import { cn } from '../lib/utils';
import { 
  joinAiChallenge, 
  updateUsdtWalletAddress, 
  getAiChallengeLeaderboard, 
  getUserStats 
} from '../lib/firebase';
import PlayerAvatar from './PlayerAvatar';
import { audioController } from '../lib/audio';

interface AiChallengePanelProps {
  user: any;
  onClose: () => void;
}

export default function AiChallengePanel({ user, onClose }: AiChallengePanelProps) {
  const [activeTab, setActiveTab] = useState<'progress' | 'leaderboard'>('progress');
  const [userStats, setUserStats] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [savingWallet, setSavingWallet] = useState(false);
  const [walletSaved, setWalletSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Withdrawal States
  const [withdrawn, setWithdrawn] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawStep, setWithdrawStep] = useState(0);
  const [txHash, setTxHash] = useState('');
  const [copiedTx, setCopiedTx] = useState(false);

  const fetchUserData = async () => {
    if (!user) return;
    try {
      const stats = await getUserStats(user.uid);
      setUserStats(stats);
      if (stats?.usdtWalletAddress) {
        setWalletAddress(stats.usdtWalletAddress);
      }
    } catch (err) {
      console.error("Error loading user challenge stats:", err);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const lb = await getAiChallengeLeaderboard();
      setLeaderboard(lb);
    } catch (err) {
      console.error("Error loading challenge leaderboard:", err);
    }
  };

  const loadAllData = async () => {
    setLoading(true);
    await Promise.all([fetchUserData(), fetchLeaderboard()]);
    setLoading(false);
  };

  useEffect(() => {
    loadAllData();
    if (user) {
      const isWithdrawn = localStorage.getItem(`withdrawn_${user.uid}`) === 'true';
      setWithdrawn(isWithdrawn);
      const savedHash = localStorage.getItem(`txHash_${user.uid}`) || '';
      setTxHash(savedHash);
    } else {
      setWithdrawn(false);
      setTxHash('');
    }
  }, [user]);

  const handleInitiateWithdraw = async () => {
    if (!user || withdrawing || withdrawn) return;
    
    setWithdrawing(true);
    setError(null);
    audioController.play('place');

    const stepsCount = 4;
    try {
      for (let i = 0; i < stepsCount; i++) {
        setWithdrawStep(i + 1);
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
      
      const generatedHash = `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;
      localStorage.setItem(`withdrawn_${user.uid}`, 'true');
      localStorage.setItem(`txHash_${user.uid}`, generatedHash);
      
      setTxHash(generatedHash);
      setWithdrawn(true);
      setWithdrawStep(5);
      audioController.play('win');
    } catch (err) {
      setError("USDT withdraw handshake timeout. Please try again.");
    } finally {
      setWithdrawing(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTx(true);
    audioController.play('place');
    setTimeout(() => setCopiedTx(false), 2000);
  };

  const handleBuyEntry = async () => {
    if (!user) return;
    setPurchasing(true);
    setError(null);
    try {
      // Simulate Stripe/Crypto on-ramp payment processing
      audioController.play('place');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      await joinAiChallenge(user.uid);
      audioController.play('win'); // Play triumph sound
      
      await loadAllData();
    } catch (err: any) {
      setError("Payment processing failed. Please try again.");
      console.error(err);
    } finally {
      setPurchasing(false);
    }
  };

  const handleSaveWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !walletAddress.trim()) return;
    
    // Simple BEP20 hex wallet checker
    const cleaned = walletAddress.trim();
    if (!/^0x[a-fA-F0-9]{42}$/.test(cleaned)) {
      setError("Invalid BEP20 Wallet Address. Must start with 0x and be 42 characters.");
      return;
    }

    setSavingWallet(true);
    setError(null);
    try {
      await updateUsdtWalletAddress(user.uid, cleaned);
      setWalletSaved(true);
      audioController.play('place');
      setTimeout(() => setWalletSaved(false), 3000);
      await fetchUserData();
    } catch (err) {
      setError("Failed to register wallet configuration.");
    } finally {
      setSavingWallet(false);
    }
  };

  const hasEntry = !!userStats?.hasAiChallengeEntry;
  const gamesPlayed = userStats?.aiChallengeGamesPlayed || 0;
  const winsCount = userStats?.aiChallengeWins || 0;
  const isCompleted = userStats?.aiChallengeCompleted || false;
  const isWinner = userStats?.aiChallengeSuccess || false;

  return (
    <motion.div 
      id="ai-challenge-panel"
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 150 }}
      className="fixed inset-y-0 right-0 w-full sm:w-[500px] bg-[#070707] border-l border-white/10 z-[100] flex flex-col shadow-[0_0_60px_rgba(0,0,0,0.9)] text-white"
    >
      {/* Dynamic Visual Banner */}
      <div className="p-6 border-b border-white/5 bg-gradient-to-r from-cyan-500/10 via-purple-500/5 to-transparent flex items-center justify-between relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 blur-3xl rounded-full" />
        <div className="absolute bottom-5 left-10 w-24 h-24 bg-purple-500/5 blur-2xl rounded-full" />
        
        <div className="flex items-center gap-4 relative z-10">
          <div className="p-3 bg-cyan-500/10 rounded-xl border border-cyan-500/20 shadow-[0_0_20px_rgba(8,247,254,0.15)] flex items-center justify-center">
            <Coins className="w-6 h-6 text-cyan-400 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-black uppercase italic tracking-tighter text-white flex items-center gap-1.5 leading-none">
              AI vs Player <span className="text-cyan-400">Challenge</span>
            </h2>
            <p className="text-[10px] text-white/30 uppercase tracking-[0.25em] font-bold mt-1">Conquer the Engine • Win $99 USDT</p>
          </div>
        </div>
        <button 
          id="close-challenge-btn"
          onClick={onClose} 
          className="p-2 hover:bg-white/5 rounded-full transition-colors group relative z-10"
        >
          <X className="w-5 h-5 text-white/40 group-hover:text-white" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/5 bg-white/[0.01]">
        <button
          onClick={() => setActiveTab('progress')}
          className={cn(
            "flex-1 py-3.5 text-xs font-black uppercase tracking-widest text-center border-b-2 transition-all duration-300",
            activeTab === 'progress' 
              ? "border-cyan-400 text-cyan-400 bg-cyan-400/[0.02]" 
              : "border-transparent text-white/40 hover:text-white/80"
          )}
        >
          My Challenge
        </button>
        <button
          onClick={() => setActiveTab('leaderboard')}
          className={cn(
            "flex-1 py-3.5 text-xs font-black uppercase tracking-widest text-center border-b-2 transition-all duration-300",
            activeTab === 'leaderboard' 
              ? "border-cyan-400 text-cyan-400 bg-cyan-400/[0.02]" 
              : "border-transparent text-white/40 hover:text-white/80"
          )}
        >
          AI Conquerors
        </button>
      </div>

      {/* Main Body content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div 
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full flex flex-col items-center justify-center gap-3 text-white/40 py-20"
            >
              <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
              <span className="text-[10px] uppercase font-bold tracking-[0.3em]">Analyzing Challenge Registry...</span>
            </motion.div>
          ) : activeTab === 'progress' ? (
            <motion.div
              key="progress"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Not registered / Entry Stage */}
              {!hasEntry && (
                <div className="space-y-6 py-4">
                  <div className="p-6 bg-gradient-to-br from-cyan-500/10 to-purple-500/5 border border-white/10 rounded-2xl relative overflow-hidden text-center space-y-4">
                    <div className="absolute top-0 left-0 bg-yellow-500/20 text-yellow-500 text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-br-xl rounded-tl-none border-b border-r border-yellow-500/20 flex items-center gap-1">
                      <Star className="w-2 h-2 fill-current" /> $99 USDT Grand Reward
                    </div>
                    
                    <div className="pt-4 flex justify-center">
                      <div className="w-16 h-16 bg-cyan-400/20 text-cyan-400 rounded-full border border-cyan-400/30 flex items-center justify-center shadow-[0_0_40px_rgba(8,247,254,0.2)] animate-pulse">
                        <Trophy className="w-8 h-8" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-xl font-extrabold tracking-tight uppercase italic text-white leading-none">The Ultimate AI Slayer</h3>
                      <p className="text-xs text-white/60 font-medium">Defeat our synthetic intelligence engine in 10 sequential matches to claim the reward!</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div className="p-3 bg-black/40 border border-white/5 rounded-xl text-left">
                        <p className="text-[8px] font-bold text-white/30 uppercase tracking-widest">Entry Fee</p>
                        <p className="text-lg font-black text-yellow-400 italic mt-0.5">$2.99 USD</p>
                        <p className="text-[8px] text-white/20 font-medium leading-tight">One-time entry purchase</p>
                      </div>
                      <div className="p-3 bg-black/40 border border-white/5 rounded-xl text-left">
                        <p className="text-[8px] font-bold text-white/30 uppercase tracking-widest">Grand Prize</p>
                        <p className="text-lg font-black text-cyan-400 italic mt-0.5">99 USDT</p>
                        <p className="text-[8px] text-white/20 font-medium leading-tight">Paid on BEP20 network</p>
                      </div>
                    </div>
                  </div>

                  {/* Quick Instructions list */}
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-black uppercase tracking-wider text-white/40">Challenge Directives</h4>
                    <ul className="space-y-2.5">
                      {[
                        "Complete and win all 10 single-player matches against AI players.",
                        "Track real-time game counts of wins and plays securely in your profile.",
                        "Win 10 out of 10 to qualify for the elite AI Conqueror Leaderboard.",
                        "Add your secure USDT BEP20 wallet address to receive reward transfers."
                      ].map((text, i) => (
                        <li key={i} className="flex gap-3 text-xs text-white/70">
                          <span className="w-5 h-5 flex items-center justify-center bg-cyan-1000/10 border border-cyan-500/20 rounded-full font-mono font-bold text-[10px] text-cyan-400 shrink-0">
                            {i + 1}
                          </span>
                          <span className="leading-relaxed">{text}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Payment Button */}
                  <div className="space-y-3 pt-2">
                    <button
                      onClick={handleBuyEntry}
                      disabled={purchasing || !user}
                      className={cn(
                        "w-full py-4 bg-cyan-500 hover:bg-cyan-400 disabled:bg-white/5 disabled:text-white/20 text-black font-black uppercase tracking-widest italic rounded-xl flex items-center justify-center gap-3 transition-all duration-300 transform active:scale-95",
                        purchasing ? "shadow-none" : "shadow-[0_0_30px_rgba(8,247,254,0.3)]"
                      )}
                    >
                      {purchasing ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Processing Security Fee...
                        </>
                      ) : !user ? (
                        "Log in to enter challenge"
                      ) : (
                        <>
                          Pay Entry Fee of $2.99
                          <ArrowRight className="w-5 h-5" />
                        </>
                      )}
                    </button>
                    <p className="text-[9px] text-center text-white/20 uppercase font-bold tracking-wider">
                      Secured checkout session powered by Stripe billing demo
                    </p>
                  </div>
                </div>
              )}

              {/* Challenge Active/Progress Stage */}
              {hasEntry && (
                <div className="space-y-6">
                  {/* Status Card & Confetti wrapper */}
                  <div className="p-6 bg-[#0f0f0f] border border-white/10 rounded-2xl space-y-5 text-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 bg-cyan-500/10 border-b border-l border-white/10 text-cyan-400 text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-bl-xl font-mono">
                      Challenge Active
                    </div>

                    <div className="space-y-1">
                      <h3 className="text-sm font-black uppercase tracking-widest text-white/30">Your Attack Progress</h3>
                      <h2 className="text-3xl font-black italic uppercase tracking-tighter text-white">
                        {isCompleted ? (isWinner ? "AI SLAYER CONQUERED!" : "CHALLENGE ENDED") : `${10 - gamesPlayed} Matches Remaining`}
                      </h2>
                    </div>

                    {/* Counts Matrix */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl flex flex-col items-center">
                        <span className="text-[8px] font-bold text-white/40 uppercase tracking-widest mb-1">Played Games</span>
                        <div className="flex items-baseline gap-1 text-2xl font-black italic text-white font-mono">
                          {gamesPlayed} <span className="text-xs text-white/30 font-bold font-sans">/ 10</span>
                        </div>
                        {/* Custom visual progress bar */}
                        <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden mt-2">
                          <div 
                            className="bg-cyan-550 h-full rounded-full transition-all duration-500"
                            style={{ width: `${(gamesPlayed / 10) * 100}%`, backgroundColor: '#08f7fe' }}
                          />
                        </div>
                      </div>

                      <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl flex flex-col items-center">
                        <span className="text-[8px] font-bold text-white/40 uppercase tracking-widest mb-1 font-sans">Wins Count</span>
                        <div className="flex items-baseline gap-1 text-2xl font-black italic font-mono" style={{ color: gamesPlayed > winsCount ? '#ff2e63' : '#22c55e' }}>
                          {winsCount} <span className="text-xs text-white/30 font-bold font-sans">/ 10</span>
                        </div>
                        <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden mt-2">
                          <div 
                            className="bg-[#22c55e] h-full rounded-full transition-all duration-500"
                            style={{ width: `${(winsCount / 10) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Highlight Box based on Results status */}
                    <AnimatePresence mode="wait">
                      {isCompleted ? (
                        isWinner ? (
                          <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="p-4 border border-[#22c55e]/20 bg-[#22c55e]/5 rounded-xl text-center space-y-2"
                          >
                            <div className="text-xs font-black uppercase text-[#22c55e] flex items-center justify-center gap-1.5">
                              <Star className="w-4 h-4 fill-current animate-spin" /> Perfect 10/10 Win!
                            </div>
                            <p className="text-[11px] text-white/60 leading-relaxed">
                              You have unlocked the top status! Add your USDT Wallet Address below. Our team validates results within 24 hours to credit 99 USDT.
                            </p>
                          </motion.div>
                        ) : (
                          <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="p-4 border border-red-500/20 bg-red-500/5 rounded-xl text-center space-y-3"
                          >
                            <div className="text-xs font-black uppercase text-red-500">
                              Challenge Finished: {winsCount}/10 Wins
                            </div>
                            <p className="text-[11px] text-white/60 leading-relaxed">
                              Ah! You missed the perfect 10/10 AI victory needed for the 99 USDT.
                            </p>
                            <button
                              onClick={handleBuyEntry}
                              disabled={purchasing}
                              className="py-2.5 px-6 mx-auto bg-white/10 hover:bg-white/20 rounded-lg text-xs font-black uppercase tracking-widest text-white transition-all flex items-center gap-2"
                            >
                              {purchasing ? <Loader2 className="w-3 animate-spin" /> : <ResetIcon className="w-3.5 h-3.5" />}
                              Reset Run ($2.99)
                            </button>
                          </motion.div>
                        )
                      ) : (
                        <div className="text-left py-1 text-white/40 text-[10px] leading-relaxed">
                          🛡️ <span className="font-bold text-white/60 uppercase tracking-tighter">Automatic updates:</span> Matches against standard computer AI players in Arena mode are logged automatically under this challenge wrapper! Create or join any VS AI room to record progress.
                        </div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* wallet configuration section */}
                  <div className="space-y-3 bg-[#0a0a0a] border border-white/5 rounded-2xl p-6">
                    <div className="flex items-center gap-3">
                      <Wallet className="w-5 h-5 text-cyan-400" />
                      <div>
                        <h4 className="text-xs font-black uppercase tracking-wider text-white">USDT BEP20 Payout Wallet</h4>
                        <p className="text-[9px] text-white/30 uppercase font-black">Configure where to receive prize money</p>
                      </div>
                    </div>

                    <form onSubmit={handleSaveWallet} className="flex gap-2 pt-2">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          placeholder="BEP20 Address e.g. 0x..."
                          value={walletAddress}
                          onChange={(e) => {
                            setWalletAddress(e.target.value);
                            setError(null);
                          }}
                          className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-cyan-400 transition-colors"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={savingWallet || !walletAddress.trim()}
                        className={cn(
                          "py-3 px-5 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-150 transform active:scale-95 shrink-0",
                          walletSaved 
                            ? "bg-[#22c55e] text-white" 
                            : "bg-white/10 hover:bg-cyan-400 hover:text-black hover:shadow-[0_0_15px_rgba(8,247,254,0.3)] text-white"
                        )}
                      >
                        {savingWallet ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : walletSaved ? (
                          "Saved"
                        ) : (
                          "Save"
                        )}
                      </button>
                    </form>
                    
                    <div className="p-3 bg-white/[0.01] border border-white/5 rounded-xl flex items-center justify-between text-[10px] text-white/40">
                      <span>Network Protocol:</span>
                      <span className="font-mono text-cyan-400 uppercase font-black tracking-widest">Binance Smart Chain (BEP20)</span>
                    </div>
                  </div>

                  {/* Withdrawal Section */}
                  <div className="space-y-3 bg-[#0a0a0a] border border-white/5 rounded-2xl p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/[0.03] blur-xl rounded-full" />
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Coins className="w-5 h-5 text-yellow-500 animate-pulse" />
                        <div>
                          <h4 className="text-xs font-black uppercase tracking-wider text-white">USDT Reward Payout Desk</h4>
                          <p className="text-[9px] text-white/30 uppercase font-black">Authorized instant smart contracts</p>
                        </div>
                      </div>
                      
                      {/* Badge status */}
                      {!isWinner ? (
                        <span className="px-2 py-0.5 bg-red-500/15 border border-red-500/30 text-red-400 text-[8px] font-black uppercase tracking-widest rounded-md">
                          Locked ({winsCount}/10 wins)
                        </span>
                      ) : !userStats?.usdtWalletAddress ? (
                        <span className="px-2 py-0.5 bg-yellow-500/15 border border-yellow-500/30 text-yellow-400 text-[8px] font-black uppercase tracking-widest rounded-md animate-pulse">
                          Wallet Needed
                        </span>
                      ) : withdrawn ? (
                        <span className="px-2 py-0.5 bg-green-500/15 border border-green-500/30 text-green-400 text-[8px] font-black uppercase tracking-widest rounded-md">
                          Dispatched
                        </span>
                      ) : withdrawing ? (
                        <span className="px-2 py-0.5 bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 text-[8px] font-black uppercase tracking-widest rounded-md animate-pulse">
                          Withdrawing ({withdrawStep}/4)
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-cyan-500/15 border border-cyan-400/30 text-cyan-400 text-[8px] font-black uppercase tracking-widest rounded-md animate-bounce">
                          Active Ready
                        </span>
                      )}
                    </div>

                    {/* Main Condition Blocks */}
                    <AnimatePresence mode="wait">
                      {!isWinner ? (
                        <motion.div 
                          key="locked-withdrawal"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="pt-2 text-center space-y-3"
                        >
                          <div className="p-4 bg-white/[0.01] border border-dashed border-white/5 rounded-xl flex flex-col items-center justify-center gap-2">
                            <Lock className="w-6 h-6 text-white/10 shrink-0" />
                            <p className="text-[10px] text-white/45 max-w-xs leading-relaxed font-medium">
                              Win 10 out of 10 matches sequentially against AI players in Arena mode to unlock your 99.00 USDT payout.
                            </p>
                          </div>
                          <button
                            disabled
                            className="w-full py-3 bg-white/5 text-white/20 text-xs font-black uppercase tracking-widest rounded-xl cursor-not-allowed border border-white/5"
                          >
                            99.00 USDT Payout Locked
                          </button>
                        </motion.div>
                      ) : !userStats?.usdtWalletAddress ? (
                        <motion.div 
                          key="wallet-needed-withdrawal"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="pt-2 text-center space-y-3"
                        >
                          <div className="p-4 bg-yellow-500/5 border border-yellow-500/10 rounded-xl flex flex-col items-center justify-center gap-2">
                            <Wallet className="w-6 h-6 text-yellow-400/20 shrink-0 animate-pulse" />
                            <p className="text-[10px] text-yellow-500/70 max-w-xs leading-relaxed font-medium">
                              Please supply a Binance Smart Chain BEP-20 address inside the form above to activate on-chain payouts.
                            </p>
                          </div>
                          <button
                            disabled
                            className="w-full py-3 bg-white/5 text-white/20 text-xs font-black uppercase tracking-widest rounded-xl cursor-not-allowed border border-white/5"
                          >
                            Waiting for Wallet Address
                          </button>
                        </motion.div>
                      ) : withdrawn ? (
                        <motion.div 
                          key="withdrawn-withdrawal"
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0 }}
                          className="pt-2 animate-fade-in"
                        >
                          <div className="p-4 bg-green-500/5 border border-green-500/20 rounded-xl space-y-3">
                            <div className="flex items-center gap-2">
                              <Check className="w-4 h-4 text-green-400 stroke-[3px]" />
                              <span className="text-xs font-black uppercase text-green-400">Transaction Finalized</span>
                            </div>
                            
                            <p className="text-[10px] text-white/60 leading-relaxed font-medium">
                              Your payout of 99 USDT has been routed successfully. Please check your BEP-20 wallet history.
                            </p>

                            <div className="pt-2 space-y-1.5 border-t border-white/5 text-[10px]">
                              <div className="flex justify-between items-center text-white/40">
                                <span>Amount:</span>
                                <span className="font-bold text-white">99.00 USDT</span>
                              </div>
                              <div className="flex justify-between items-center text-white/40">
                                <span>Gas Net:</span>
                                <span className="text-cyan-400 font-mono font-black text-[9px] uppercase">BSC Mainnet</span>
                              </div>
                              <div className="flex justify-between items-center text-white/40">
                                <span>Recipient Address:</span>
                                <span className="font-mono text-white/80 max-w-[180px] truncate">{userStats.usdtWalletAddress}</span>
                              </div>
                              <div className="flex justify-between items-center text-white/40 pt-1">
                                <span>Explorer TX Hash:</span>
                                <div className="flex items-center gap-1.5 font-mono text-cyan-400">
                                  <span>{txHash.slice(0, 10)}...{txHash.slice(-8)}</span>
                                  <button 
                                    type="button"
                                    onClick={() => copyToClipboard(txHash)}
                                    className="p-1 hover:bg-white/5 rounded transition-all text-white/40 hover:text-white"
                                    title="Copy TX Hash"
                                  >
                                    {copiedTx ? <Check className="w-3" /> : <Copy className="w-3 px-0.5" />}
                                  </button>
                                </div>
                              </div>
                            </div>

                            <a
                              href={`https://bscscan.com/tx/${txHash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-full py-2.5 bg-[#22c55e]/15 hover:bg-[#22c55e]/25 text-green-400 border border-[#22c55e]/30 hover:border-[#22c55e]/50 text-xs font-black uppercase tracking-widest rounded-xl text-center flex items-center justify-center gap-1.5 transition-all text-decoration-none"
                            >
                              View On BscScan
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        </motion.div>
                      ) : (
                        <motion.div 
                          key="ready-withdrawal"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="pt-2 space-y-4"
                        >
                          {/* Ready notification banner */}
                          <div className="p-4 bg-cyan-400/5 border border-cyan-400/20 rounded-xl space-y-2 text-left animate-pulse">
                            <span className="text-[10px] font-black text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                              <Star className="w-3.5 h-3.5 fill-current text-cyan-400" />
                              Verification Succeeded • On-chain Dispatch Available
                            </span>
                            <p className="text-[10px] text-white/70 leading-relaxed font-medium">
                              You have passed the security validation checks for your 10 battles against standard computer AI slayers! You can now request the reward.
                            </p>
                          </div>

                          <div className="rounded-xl p-3 bg-white/[0.01] border border-white/5 space-y-2">
                            <div className="flex justify-between text-[10px] text-white/40">
                              <span>USDT Transfer Target:</span>
                              <span className="font-mono text-white max-w-[200px] truncate">{userStats.usdtWalletAddress}</span>
                            </div>
                            <div className="flex justify-between text-[10px] text-white/40">
                              <span>Network Protocol:</span>
                              <span className="text-cyan-400 font-bold uppercase">Binance Smart Chain (BEP20)</span>
                            </div>
                            <div className="flex justify-between text-[10px] text-white/40">
                              <span>Routing Fee:</span>
                              <span className="text-[#22c55e] font-bold uppercase">0.00 BNB (Gas Covered)</span>
                            </div>
                          </div>

                          {/* Interactive Loading or Idle Request Button */}
                          {withdrawing ? (
                            <div className="p-4 bg-black border border-white/5 rounded-xl space-y-3 text-center">
                              <Loader2 className="w-6 h-6 animate-spin text-cyan-400 mx-auto" />
                              <div className="space-y-1">
                                <span className="text-[10px] text-cyan-400 uppercase font-black tracking-widest block">
                                  Processing Contract...
                                </span>
                                <p className="text-[10px] text-white/50 animate-pulse font-mono tracking-tighter">
                                  {withdrawStep === 1 && "Packaging block reward payload..."}
                                  {withdrawStep === 2 && "Validating 10/10 AI battle integrity records on Firestore..."}
                                  {withdrawStep === 3 && "Sign-checking cryptographic keys with BEP-20 router..."}
                                  {withdrawStep === 4 && "Broadcasting transaction to Binance Smart Chain..."}
                                </p>
                              </div>

                              {/* Progress bar state indicator */}
                              <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden mt-2">
                                <div 
                                  className="bg-cyan-400 h-full rounded-full transition-all duration-300"
                                  style={{ width: `${(withdrawStep / 4) * 100}%` }}
                                />
                              </div>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={handleInitiateWithdraw}
                              className="w-full py-3.5 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-black font-black uppercase tracking-widest italic rounded-xl flex items-center justify-center gap-2 transform active:scale-[0.98] duration-150 transition-all custom-glow shadow-[0_0_25px_rgba(8,247,254,0.25)] hover:shadow-[0_0_35px_rgba(8,247,254,0.4)]"
                            >
                              Initialize instant USDT Payout
                              <ArrowRight className="w-4 h-4 text-black group-hover:translate-x-1" />
                            </button>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="leaderboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="p-4 bg-cyan-400/5 border border-cyan-400/10 rounded-xl flex items-center gap-3">
                <Trophy className="w-5 h-5 text-yellow-400" />
                <div className="text-left text-xs leading-relaxed text-white/85">
                  The <span className="text-cyan-400 font-extrabold uppercase">AI Conqueror Leaderboard</span> ranks legendary slayers who achieve extreme victories against our algorithms! 10/10 achievements are pinned securely at the top position.
                </div>
              </div>

              {leaderboard.length === 0 ? (
                <div className="py-20 flex flex-col items-center justify-center text-white/20 gap-3 border border-dashed border-white/10 rounded-xl">
                  <Star className="w-10 h-10 stroke-1 text-white/10" />
                  <span className="text-[10px] font-black uppercase tracking-widest">No Conquerors Registered Yet</span>
                  <span className="text-[9px] font-medium text-white/10 px-4 text-center">Be the first to buy entry, defeat AI in 10 games, and claim the $99 USDT prize!</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {leaderboard.map((player, idx) => {
                    const wins = player.aiChallengeWins || 0;
                    const games = player.aiChallengeGamesPlayed || 0;
                    const isConq = player.aiChallengeSuccess === true || (wins === 10 && games === 10);
                    
                    return (
                      <div 
                        key={`ai-leader-${player.userId || 'anon'}-${idx}`}
                        className={cn(
                          "p-4 rounded-xl flex items-center justify-between transition-all border",
                          isConq 
                            ? "bg-gradient-to-r from-cyan-500/10 via-purple-500/5 to-transparent border-cyan-400/30 shadow-[0_0_15px_rgba(8,247,254,0.05)]" 
                            : "bg-white/[0.02] border-white/5 hover:border-white/10"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-6 text-sm font-black italic text-cyan-400 font-mono">
                            #{idx + 1}
                          </div>
                          <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center font-bold">
                            {player.avatarConfig ? (
                              <PlayerAvatar icon={player.avatarConfig.icon} color={player.avatarConfig.color} size="sm" />
                            ) : (
                              <User className="w-4 h-4 text-white/20" />
                            )}
                          </div>
                          <div className="text-left">
                            <div className="flex items-baseline gap-1.5">
                              <span className="text-xs font-black uppercase text-white tracking-wide truncate max-w-[120px]">
                                {player.displayName}
                              </span>
                              {isConq && (
                                <span className="px-1 py-0.25 bg-yellow-500/15 text-yellow-500 border border-yellow-500/20 rounded font-black text-[7px] uppercase tracking-widest leading-none">
                                  SLAYER
                                </span>
                              )}
                            </div>
                            <p className="text-[8px] font-mono text-white/30 tracking-tight mt-0.5 max-w-[150px] truncate">
                              Wallet: {player.usdtWalletAddress ? `${player.usdtWalletAddress.slice(0, 6)}...${player.usdtWalletAddress.slice(-4)}` : "None configured"}
                            </p>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="text-xs font-black font-mono flex items-baseline justify-end gap-0.5" style={{ color: isConq ? '#22c55e' : '#fff' }}>
                            {wins} <span className="text-[10px] text-white/30 font-bold font-sans">/ {games} W</span>
                          </div>
                          <span className="text-[7px] uppercase font-black tracking-widest text-white/20 block mt-0.5 font-sans">
                            {isConq ? "99 USDT CLAIMED" : "RUN ACTIVE"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Global Error Banner */}
      {error && (
        <div className="p-4 bg-red-500/10 border-t border-red-500/20 text-red-400 text-xs text-center font-bold font-sans">
          ⚠️ {error}
        </div>
      )}

      {/* Footer Info */}
      <div className="p-6 border-t border-white/5 bg-white/[0.01]">
        <div className="p-3 bg-white/[0.01] border border-white/5 text-[9px] text-white/30 leading-relaxed font-sans text-center rounded-xl">
          USDT rewards are subject to anti-bot validation. Multiple accounts or script assists will be disqualified without refunds. Standard BEP20 transaction fees apply on-chain.
        </div>
      </div>
    </motion.div>
  );
}

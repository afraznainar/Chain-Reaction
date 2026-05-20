import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { socket } from './lib/socket';
import { GameState, Player, COLOR_MAP, Replay } from './types';
import { cn } from './lib/utils';
import { Copy, UserMinus, Globe, BarChart3, Eye, Users, Play, CheckCircle2, User, Trophy, Wallet, Zap, ShieldCheck, LogIn, LogOut, ChevronRight, Volume2, VolumeX, MessageSquare, Film } from 'lucide-react';
import { auth, signInWithGoogle, updateMatchResult, updateAvatarPreference, getUserStats, saveReplay } from './lib/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import Leaderboard from './components/Leaderboard';
import AvatarCustomizer from './components/AvatarCustomizer';
import PlayerAvatar from './components/PlayerAvatar';
import { audioController } from './lib/audio';
import GameSettings from './components/GameSettings';
import ReplayLibrary from './components/ReplayLibrary';
import ReplayPlayer from './components/ReplayPlayer';
import RoomBrowser from './components/RoomBrowser';
import DetailedStatsModal from './components/DetailedStatsModal';
import AtomicBurst from './components/AtomicBurst';

function TurnTimer({ endTime, status }: { endTime?: number, status: string }) {
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    if (status !== 'playing' || !endTime) return;

    const tick = () => {
      const now = Date.now();
      const diff = Math.max(0, Math.ceil((endTime - now) / 1000));
      setTimeLeft(diff);
    };

    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [endTime, status]);

  if (status !== 'playing' || !endTime) return null;

  return (
    <div className={cn(
      "text-[10px] sm:text-xs font-black font-mono transition-all",
      timeLeft <= 2 ? "text-[#ff2e63] scale-110 animate-pulse" : "text-white/30"
    )}>
      00:0{timeLeft}
    </div>
  );
}

import ChatPanel from './components/ChatPanel';

export default function App() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [roomId, setRoomId] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState('');
  const [hasPremium, setHasPremium] = useState(false);
  const [isJoiningAsSpectator, setIsJoiningAsSpectator] = useState(false);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showReplays, setShowReplays] = useState(false);
  const [showRoomBrowser, setShowRoomBrowser] = useState(false);
  const [showDetailedStats, setShowDetailedStats] = useState(false);
  const [selectedReplay, setSelectedReplay] = useState<Replay | null>(null);
  const [hasReportedResult, setHasReportedResult] = useState(false);
  const [hasSavedReplay, setHasSavedReplay] = useState(false);
  const [avatar, setAvatar] = useState({ icon: 'zap', color: '#ff2e63' });
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    audioController.setMuted(isMuted);
  }, [isMuted]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        setPlayerName(u.displayName || '');
        // Load avatar preference
        getUserStats(u.uid).then(stats => {
          if (stats?.avatarConfig) {
            setAvatar(stats.avatarConfig);
          }
        }).catch(e => {
          // Ignore offline errors on initial load, as Firestore will eventually sync
          if (!e.message?.includes('offline')) {
            console.error("Error loading avatar preference:", e);
          }
        });
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    socket.on('game_updated', (updatedGame: GameState) => {
      // Play game over sound
      if (updatedGame.status === 'gameover' && gameState?.status !== 'gameover') {
        audioController.play('gameOver');
      }

      setGameState(updatedGame);
      setIsJoining(false);

      // Report result if game over and we are a player
      if (updatedGame.status === 'gameover' && !hasReportedResult && user) {
        const myPlayerInGame = updatedGame.players.find(p => p.id === socket.id);
        if (myPlayerInGame && !myPlayerInGame.isAI) {
          const isWin = updatedGame.winnerId === socket.id;
          updateMatchResult(user.uid, isWin).catch(console.error);
          setHasReportedResult(true);
        }

        // Save replay if I am host
        if (myPlayerInGame?.isHost && !hasSavedReplay) {
           const replay: Replay = {
             id: updatedGame.id + '-' + Date.now(),
             gridWidth: updatedGame.gridWidth,
             gridHeight: updatedGame.gridHeight,
             players: updatedGame.players,
             moves: updatedGame.moveHistory, // moveHistory is recorded on server
             winnerId: updatedGame.winnerId,
             createdAt: Date.now()
           };
           saveReplay(replay).catch(console.error);
           setHasSavedReplay(true);
        }
      }
      
      // Reset flags if we are in lobby again (new game)
      if (updatedGame.status === 'lobby') {
        setHasReportedResult(false);
        setHasSavedReplay(false);
      }
    });

    socket.on('error', (err: { message: string }) => {
      setError(err.message);
      setIsJoining(false);
    });

    socket.on('kicked', () => {
      setGameState(null);
      setError("You have been removed from the room.");
      audioController.play('gameOver'); // Or a specific kick sound
    });

    return () => {
      socket.off('game_updated');
      socket.off('error');
    };
  }, [user, hasReportedResult, gameState, hasSavedReplay]);

  const handleJoin = (e: React.FormEvent, spectate: boolean = false) => {
    e.preventDefault();
    if (!roomId) return;
    setIsJoining(true);
    socket.emit('join_game', { 
      roomId, 
      playerName: user?.displayName || playerName, 
      isSpectator: spectate, 
      userId: user?.uid,
      avatar: avatar
    });

    if (user) {
      updateAvatarPreference(user.uid, avatar).catch(console.error);
    }
  };

  const handleLogin = async () => {
    try {
      await signInWithGoogle();
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => auth.signOut();

  const handleExitGame = () => {
    if (gameState) {
      socket.emit('leave_game', gameState.id);
      setGameState(null);
    }
  };

  const handleRandomKey = () => {
    const key = Math.random().toString(36).substr(2, 6).toUpperCase();
    setRoomId(key);
  };

  const handlePlayAgain = () => {
    if (gameState) {
      socket.emit('play_again', gameState.id);
    }
  };

  const handleStartGame = () => {
    if (gameState) {
      socket.emit('start_game', gameState.id);
    }
  };

  const handleUpdateSettings = (settings: any) => {
    if (gameState) {
      socket.emit('update_settings', { roomId: gameState.id, ...settings });
    }
  };

  const handleToggleReady = () => {
    if (gameState) {
      socket.emit('toggle_ready', gameState.id);
    }
  };

  const handleBuyPremium = async () => {
    try {
      const response = await fetch('/api/create-checkout-session', { method: 'POST' });
      const data = await response.json();
      // In a real app, window.location.href = data.url;
      // Since it's a mock, we'll just set premium locally for demo
      setHasPremium(true);
      alert('Mock Checkout Successful! You now have Premium features.');
    } catch (e) {
      console.error(e);
    }
  };

  if (!gameState) {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-4 sm:p-10 font-sans overflow-x-hidden">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md space-y-8 sm:space-y-12 text-left"
        >
          <header className="mb-8 sm:mb-12">
            <h1 className="text-6xl sm:text-8xl font-black italic tracking-tighter leading-[0.8] uppercase skew-x-[-6deg] underline decoration-[#ff2e63] decoration-8">
              Chain<br/>Reaction
            </h1>
            <div className="mt-6 flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              <span className="text-[10px] uppercase tracking-[0.3em] font-medium text-white/40">v.2.4.0 Ready for Deployment</span>
            </div>
          </header>

          <form onSubmit={handleJoin} className="space-y-8">
            <div className="space-y-6">
              {!user ? (
                <button
                  type="button"
                  onClick={handleLogin}
                  className="w-full flex items-center justify-center gap-4 py-4 border-2 border-white/10 rounded-xl hover:border-white/30 transition-all group overflow-hidden relative"
                >
                  <div className="absolute inset-0 bg-white/5 translate-y-full group-hover:translate-y-0 transition-transform"></div>
                  <LogIn className="w-5 h-5 text-white/50 relative" />
                  <span className="font-black uppercase tracking-widest text-xs relative">Sign in with Google</span>
                </button>
              ) : (
                <div className="flex items-center justify-between bg-white/[0.02] border border-white/5 p-4 rounded-xl">
                  <div className="flex items-center gap-3">
                    <img src={user.photoURL || ''} className="w-8 h-8 rounded-full" alt="" />
                    <span className="font-bold text-sm tracking-tight">{user.displayName}</span>
                  </div>
                  <button onClick={handleLogout} className="text-white/30 hover:text-[#ff2e63] transition-colors">
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              )}

              <div className="space-y-1 border-l-2 border-white/10 pl-4 hover:border-[#ff2e63] transition-colors text-left">
                <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Your Name</label>
                <input
                  type="text"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Enter your name..."
                  className="w-full bg-transparent border-none text-2xl font-bold p-0 outline-none placeholder:text-white/10"
                />
              </div>

              <div className="space-y-1 border-l-2 border-white/10 pl-4 hover:border-[#ff2e63] transition-colors">
                <div className="flex justify-between items-center pr-2">
                  <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Room Key</label>
                  <button 
                    type="button" 
                    onClick={handleRandomKey}
                    className="text-[9px] uppercase font-black text-[#ff2e63] hover:text-white transition-colors"
                  >
                    Generate Random
                  </button>
                </div>
                <input
                  type="text"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  placeholder="Enter key..."
                  className="w-full bg-transparent border-none text-2xl font-bold p-0 outline-none placeholder:text-white/10"
                  required
                />
              </div>

              <AvatarCustomizer 
                currentIcon={avatar.icon} 
                currentColor={avatar.color} 
                onSelect={(icon, color) => setAvatar({ icon, color })}
              />
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={isJoining}
                className="flex-1 px-10 py-4 bg-[#ff2e63] font-black uppercase tracking-widest text-sm hover:skew-x-[-3deg] transition-transform active:scale-95 disabled:opacity-50"
              >
                {isJoining ? 'Connecting...' : 'Join Game'}
              </button>
              <button
                type="button"
                onClick={() => setShowRoomBrowser(true)}
                className="px-6 py-4 border-2 border-[#ff2e63]/30 text-[#ff2e63] font-black uppercase tracking-widest text-[10px] hover:bg-[#ff2e63]/10 transition-colors flex items-center gap-2 active:scale-95"
              >
                <Globe className="w-4 h-4" /> Browse Rooms
              </button>
            </div>
            
            {error && <p className="text-[#ff2e63] text-xs font-bold uppercase italic">{error}</p>}
          </form>

          <footer className="pt-8 sm:pt-12 border-t border-white/10 flex flex-wrap items-center gap-4 sm:gap-8">
            <button onClick={() => setShowLeaderboard(true)} className="text-[10px] uppercase tracking-widest font-black text-white/30 hover:text-[#f5d300] transition-colors flex items-center gap-2">
              <Trophy className="w-3 h-3" /> Rankings
            </button>
            <button onClick={() => setShowReplays(true)} className="text-[10px] uppercase tracking-widest font-black text-white/30 hover:text-[#ff2e63] transition-colors flex items-center gap-2">
              <Film className="w-3 h-3" /> Archives
            </button>
            <button onClick={handleBuyPremium} className="text-[10px] uppercase tracking-widest font-black text-white/30 hover:text-white transition-colors">
              Store
            </button>
            <div className="hidden sm:block flex-1 h-[2px] bg-white/5"></div>
            <p className="text-[10px] text-white/20 font-mono italic w-full sm:w-auto">#SESSION_INIT_001</p>
          </footer>
        </motion.div>

        <AnimatePresence>
          {showLeaderboard && <Leaderboard onClose={() => setShowLeaderboard(false)} />}
          {showRoomBrowser && (
            <RoomBrowser 
              onJoin={(id) => {
                setRoomId(id);
                setShowRoomBrowser(false);
                // Trigger join automatically
                socket.emit('join_game', { 
                  roomId: id, 
                  playerName: user?.displayName || playerName, 
                  isSpectator: false, 
                  userId: user?.uid,
                  avatar: avatar
                });
              }} 
              onClose={() => setShowRoomBrowser(false)} 
            />
          )}
          {showReplays && (
            <ReplayLibrary 
              onSelect={(replay) => {
                setSelectedReplay(replay);
                setShowReplays(false);
              }} 
              onClose={() => setShowReplays(false)} 
            />
          )}
          {selectedReplay && (
            <ReplayPlayer 
              replay={selectedReplay} 
              onClose={() => setSelectedReplay(null)} 
            />
          )}
        </AnimatePresence>
      </div>
    );
  }

  const myPlayer = gameState.players.find(p => p.id === socket.id);
  const currentPlayer = gameState.players[gameState.currentTurnIndex];

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col p-4 sm:p-10 font-sans overflow-x-hidden">
      <header className="flex flex-col lg:flex-row justify-between items-start gap-8 lg:gap-0 mb-8 sm:mb-12">
        <div className="w-full lg:w-auto">
          <h1 className="text-5xl sm:text-7xl font-black tracking-tighter leading-none italic uppercase skew-x-[-6deg] underline decoration-[#ff2e63] decoration-[4px] sm:decoration-8">
            Chain<br/>Reaction
          </h1>
          <div className="mt-4 flex flex-wrap items-center gap-4 sm:gap-6">
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              <span className="text-[9px] sm:text-[10px] uppercase tracking-[0.2em] sm:tracking-[0.3em] font-medium text-white/40">Cloud Server: Asia (Live)</span>
            </div>
            {gameState.spectatorCount > 0 && (
              <div className="flex items-center gap-2">
                <Users className="w-3 h-3 text-[#ff2e63]" />
                <span className="text-[9px] sm:text-[10px] uppercase tracking-[0.2em] font-black text-[#ff2e63]">{gameState.spectatorCount}</span>
              </div>
            )}
            <button 
               onClick={handleExitGame}
               className="text-[9px] sm:text-[10px] uppercase tracking-widest font-black text-white/20 hover:text-[#ff2e63] flex items-center gap-2 transition-colors border border-white/5 px-3 py-1 rounded"
            >
              Exit
            </button>
          </div>
        </div>
        <div className="flex flex-col items-end w-full lg:w-auto gap-4">
          <div className="flex items-center justify-between lg:justify-end w-full lg:w-auto gap-4">
            <button 
              onClick={() => setShowChat(!showChat)}
              className={cn(
                "p-2 border transition-all flex items-center gap-2 px-3 flex-1 lg:flex-none justify-center lg:justify-start",
                showChat ? "bg-white text-black border-white" : "border-white/10 text-white/40 hover:bg-white/5"
              )}
            >
              <MessageSquare className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase">Chat</span>
            </button>
            <button 
              onClick={() => setIsMuted(!isMuted)}
              className="p-2 border border-white/10 hover:bg-white/5 transition-colors"
              title={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-white/30" /> : <Volume2 className="w-4 h-4 text-[#ff2e63]" />}
            </button>
            <div className="text-right border-r-2 border-[#ff2e63] pr-4 flex flex-col items-end">
              <p className="text-[9px] uppercase tracking-[0.2em] text-white/50 mb-1 leading-none">Turn</p>
              <p className="text-xl sm:text-3xl font-bold text-[#ff2e63] uppercase italic tracking-tighter truncate max-w-[150px] leading-none mb-1">
                {gameState.status === 'playing' ? currentPlayer?.name : 'WAITING'}
              </p>
              <TurnTimer endTime={gameState.turnEndTime} status={gameState.status} />
            </div>
          </div>
          <button 
            onClick={handleBuyPremium}
            className="w-full lg:w-auto px-6 py-2 border border-white/20 text-[10px] uppercase tracking-widest hover:bg-white hover:text-black transition-colors"
          >
            {hasPremium ? 'Premium Active' : 'View Store'}
          </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col lg:flex-row gap-8 lg:gap-12 min-h-0">
        {/* Main Board Area */}
        <div className="flex-1 flex items-center justify-center min-h-0">
            {gameState.status === 'lobby' ? (
              <LobbyView 
                gameState={gameState} 
                myPlayer={myPlayer} 
                handleToggleReady={handleToggleReady}
                handleStartGame={handleStartGame}
                handleUpdateSettings={handleUpdateSettings}
                showSettings={showSettings}
                setShowSettings={setShowSettings}
              />
            ) : (
              <GameView 
                gameState={gameState} 
                myPlayer={myPlayer} 
                setShowDetailedStats={setShowDetailedStats}
              />
            )}
        </div>

        {/* Sidebar */}
        <aside className={cn(
          "w-full lg:w-72 flex flex-col gap-8 shrink-0 pb-8 lg:pb-0",
          !showChat && "lg:flex hidden"
        )}>
          <AnimatePresence mode="wait">
            {showChat ? (
              <motion.div 
                key="chat"
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 20, opacity: 0 }}
                className="flex-1 min-h-[400px] lg:min-h-0"
              >
                <ChatPanel 
                  roomId={gameState.id} 
                  user={user} 
                  avatar={avatar} 
                  onClose={() => setShowChat(false)} 
                />
              </motion.div>
            ) : (
              <motion.div 
                key="default"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
                className="flex flex-col gap-8 h-full"
              >
                <div className="p-4 sm:p-6 bg-[#111] border border-white/10 rounded-xl lg:rounded-none">
                  <h3 className="text-[11px] uppercase tracking-widest text-white/40 mb-6">Players Lobby</h3>
                  <ul className="space-y-4">
                    {gameState.players.map((p) => (
                      <li key={p.id} className={cn("flex items-center justify-between group", p.isEliminated && "opacity-30")}>
                        <div className="flex items-center gap-3">
                          <PlayerAvatar icon={p.avatar?.icon} color={p.avatar?.color || COLOR_MAP[p.color]} size="sm" />
                          <span className={cn("text-sm font-bold tracking-tight", p.id === socket.id && "text-white")}>
                             {p.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                           {p.isReady && gameState.status === 'lobby' && (
                             <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
                           )}
                           <span className="text-[10px] font-mono font-black text-white/20">#{p.id.slice(0, 3).toUpperCase()}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="relative flex-1 p-4 sm:p-6 border-2 border-dashed border-white/10 overflow-hidden min-h-[200px] sm:min-h-[250px] rounded-xl lg:rounded-none">
                   <div className="absolute inset-0 bg-gradient-to-br from-[#ff2e63]/20 to-transparent"></div>
                   <div className="relative h-full flex flex-col">
                     <p className="text-[10px] uppercase font-bold tracking-tighter text-[#ff2e63] mb-2">Limited Offer</p>
                     <h4 className="text-xl font-bold italic mb-4 uppercase leading-none">Neon Vortex Skin Pack</h4>
                     <p className="text-[11px] text-white/60 mb-6 leading-relaxed">Unlock exclusive high-intensity particle effects for all your explosions.</p>
                     <div className="mt-auto">
                       <button 
                        onClick={handleBuyPremium}
                        className="w-full py-3 bg-[#ff2e63] text-white text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-transform"
                       >
                         {hasPremium ? 'Owned' : 'Unlock Now $4.99'}
                       </button>
                     </div>
                   </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </aside>
      </main>

      <footer className="mt-8 sm:mt-10 flex flex-wrap justify-between items-end gap-6 border-t border-white/10 pt-8">
        <div className="flex flex-wrap gap-8 sm:gap-12 text-[10px] uppercase tracking-widest text-white/40">
          <div className="flex flex-col gap-1 sm:gap-1"><span className="text-white/20">Ping</span><span className="text-white">24ms</span></div>
          <div className="flex flex-col gap-1 sm:gap-1"><span className="text-white/20">Session</span><span className="text-white font-mono uppercase">#{gameState.id.slice(0, 5)}</span></div>
          <div className="flex flex-col gap-1 sm:gap-1"><span className="text-white/20">Status</span><span className="text-white text-[#f5d300] uppercase italic font-bold">{gameState.status}</span></div>
        </div>
        <p className="text-[9px] uppercase tracking-tighter text-white/20 italic order-first sm:order-last w-full sm:w-auto">Atomic Engine v.2.4.0-cloud-stable</p>
      </footer>

      <AnimatePresence>
        {showLeaderboard && (
          <Leaderboard onClose={() => setShowLeaderboard(false)} />
        )}
        {showReplays && (
          <ReplayLibrary 
            onSelect={(replay) => {
              setSelectedReplay(replay);
              setShowReplays(false);
            }} 
            onClose={() => setShowReplays(false)} 
          />
        )}
        {selectedReplay && (
          <ReplayPlayer 
            replay={selectedReplay} 
            onClose={() => setSelectedReplay(null)} 
          />
        )}
        {showDetailedStats && (
          <DetailedStatsModal 
            players={gameState.players} 
            winnerId={gameState.winnerId} 
            onClose={() => setShowDetailedStats(false)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}


function LobbyView({ gameState, myPlayer, handleToggleReady, handleStartGame, handleUpdateSettings, showSettings, setShowSettings }: any) {
  const allReady = gameState.players.length >= 2 && gameState.players.every((p: Player) => p.isReady);

  const handleAddAI = () => {
    socket.emit('add_ai', gameState.id);
  };

  const handleCopyKey = () => {
    navigator.clipboard.writeText(gameState.id);
    // Simple visual feedback could be added here
  };

  const handleKick = (playerId: string) => {
    socket.emit('kick_player', { roomId: gameState.id, targetId: playerId });
  };

  return (
    <div className="w-full text-center space-y-8 flex flex-col items-center justify-center min-h-[400px]">
       <div className="relative group flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
         {myPlayer?.avatar ? (
           <PlayerAvatar icon={myPlayer.avatar.icon} color={myPlayer.avatar.color} size="xl" className="animate-pulse" />
         ) : (
           <div className="w-12 h-12 rounded-full border-4 border-[#ff2e63]/20 border-t-[#ff2e63] animate-spin"></div>
         )}
         <div className="text-center sm:text-left">
           <h2 className="text-3xl sm:text-5xl font-black italic uppercase tracking-tight leading-none">{myPlayer?.name || 'Pilot'}</h2>
           <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 mt-2">
              <p className="text-[9px] sm:text-[10px] uppercase font-bold text-white/40 tracking-[0.3em] font-mono whitespace-nowrap">Connected</p>
              {gameState.spectatorCount > 0 && (
                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-[#ff2e63]/10 border border-[#ff2e63]/20 rounded-full animate-pulse">
                  <Eye className="w-2.5 h-2.5 text-[#ff2e63]" />
                  <span className="text-[9px] font-black text-[#ff2e63] uppercase tracking-tighter">{gameState.spectatorCount} Watchers</span>
                </div>
              )}
              <button 
                onClick={handleCopyKey}
                className="flex items-center gap-1.5 px-2 py-0.5 border border-white/10 rounded-full hover:bg-white/5 transition-colors group/key"
              >
                <span className="text-[9px] font-mono font-black text-white/20 uppercase group-hover/key:text-[#ff2e63]">Key: {gameState.id}</span>
                <Copy className="w-2.5 h-2.5 text-white/10 group-hover/key:text-[#ff2e63]" />
              </button>
           </div>
         </div>
       </div>

       <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full max-w-2xl px-4">
          {gameState.players.map((p: Player) => (
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              key={p.id} 
              className={cn(
                "p-4 border rounded-xl flex flex-col items-center gap-3 relative overflow-hidden transition-all group/card",
                p.isReady ? "border-green-500/50 bg-green-500/5" : "border-white/10 bg-white/[0.02]"
              )}
            >
              {myPlayer?.isHost && p.id !== myPlayer.id && (
                 <button 
                  onClick={() => handleKick(p.id)}
                  className="absolute top-2 right-2 p-1.5 opacity-0 group-hover/card:opacity-100 transition-opacity bg-red-500/20 text-red-500 rounded-lg hover:bg-red-500 hover:text-white"
                  title="Kick Player"
                 >
                   <UserMinus className="w-3.5 h-3.5" />
                 </button>
              )}
              <PlayerAvatar icon={p.avatar?.icon} color={p.avatar?.color || COLOR_MAP[p.color]} size="md" />
              <div className="text-center">
                <p className="text-[10px] font-black uppercase tracking-widest truncate max-w-[100px]">{p.name}</p>
                <div className={cn("mt-2 px-2 py-1 rounded-sm text-[8px] font-black uppercase inline-block", p.isReady ? "bg-green-500 text-black" : "bg-white/5 text-white/30")}>
                  {p.isReady ? 'Ready' : 'Not Ready'}
                </div>
              </div>
            </motion.div>
          ))}
       </div>

       <div className="flex flex-col gap-4 w-full max-w-xs sm:max-w-md">
          {myPlayer?.isHost && (
            <button 
              onClick={() => setShowSettings(!showSettings)}
              className="py-4 border border-white/10 text-white/40 text-[10px] font-black uppercase tracking-[0.3em] skew-x-[-3deg] hover:bg-white/5 transition-all"
            >
              {showSettings ? 'Hide Settings' : 'Room Settings'}
            </button>
          )}

          <AnimatePresence>
            {showSettings && myPlayer?.isHost && (
              <div className="flex justify-center mb-6">
                <GameSettings 
                  gridWidth={gameState.gridWidth}
                  gridHeight={gameState.gridHeight}
                  maxPlayers={gameState.maxPlayers}
                  isHost={myPlayer.isHost}
                  onUpdate={handleUpdateSettings}
                  onClose={() => setShowSettings(false)}
                />
              </div>
            )}
          </AnimatePresence>
          <button 
            onClick={handleToggleReady}
            className={cn(
              "py-4 border transition-all active:scale-95 text-[10px] font-black uppercase tracking-[0.3em] skew-x-[-3deg]",
              myPlayer?.isReady 
                ? "bg-green-500 border-green-500 text-black" 
                : "bg-transparent border-white/20 text-white/50 hover:border-white hover:text-white"
            )}
          >
            {myPlayer?.isReady ? 'Ready' : 'Click to Ready'}
          </button>
          
          {myPlayer?.isHost && (
             <>
               <button 
                 onClick={handleAddAI}
                 disabled={gameState.players.length >= 8}
                 className="py-4 border border-[#08f7fe]/40 text-[#08f7fe]/70 text-[10px] font-black uppercase tracking-[0.3em] skew-x-[-3deg] hover:border-[#08f7fe] hover:text-[#08f7fe] transition-all disabled:opacity-20"
               >
                 Add AI Player
               </button>
               <button 
                 onClick={handleStartGame}
                 disabled={!allReady}
                 className="py-4 bg-[#ff2e63] text-white text-[10px] font-black uppercase tracking-[0.4em] disabled:opacity-20 transition-all hover:scale-105 active:scale-95 skew-x-[-3deg]"
               >
                 Start Game
               </button>
             </>
          )}
          {!allReady && myPlayer?.isHost && (
            <p className="text-[9px] text-[#ff2e63] font-bold uppercase italic mt-2">Everyone must be ready to start</p>
          )}
       </div>
    </div>
  );
}

function GameView({ gameState, myPlayer, setShowDetailedStats }: any) {
  const isMyTurn = gameState.players[gameState.currentTurnIndex].id === socket.id;
  const [explosions, setExplosions] = useState<{ id: number; x: number; y: number; color: string }[]>([]);
  const [shake, setShake] = useState(false);

  useEffect(() => {
    if (gameState.lastExplosions && gameState.lastExplosions.length > 0) {
      setShake(true);
      const shakeTimer = setTimeout(() => setShake(false), 300);
      
      // Process explosions with a slight stagger for visual effect
      gameState.lastExplosions.forEach((exp: any, index: number) => {
        setTimeout(() => {
          setExplosions(prev => [...prev, { ...exp, id: Date.now() + index }]);
          audioController.play('explode');
          // Auto remove explosion after animation
          setTimeout(() => {
            setExplosions(prev => prev.filter(e => e.id !== (Date.now() + index))); // This logic is slightly flawed due to Date.now(), using index is better
          }, 1000);
        }, index * 50); // Stagger
      });

      return () => clearTimeout(shakeTimer);
    }
  }, [gameState.id, gameState.lastMoveTimestamp]); // Trigger on new move

  const [gameEnded, setGameEnded] = useState(false);

  useEffect(() => {
    if (gameState.status === 'gameover' && !gameEnded) {
      setGameEnded(true);
      audioController.play('gameOver');
    } else if (gameState.status !== 'gameover') {
      setGameEnded(false);
    }
  }, [gameState.status]);

  return (
    <div className="w-full flex flex-col items-center">
       {/* Nuclear Flash Effect */}
       <AnimatePresence>
         {gameEnded && (
           <motion.div 
             initial={{ opacity: 0 }}
             animate={{ opacity: [0, 1, 0] }}
             exit={{ opacity: 0 }}
             transition={{ duration: 1.5, times: [0, 0.1, 1] }}
             className="fixed inset-0 bg-white z-[200] pointer-events-none"
           />
         )}
       </AnimatePresence>

       <div className="relative">
         <motion.div 
           animate={shake ? {
             x: [0, -4, 4, -4, 4, 0],
             y: [0, 4, -4, 4, -4, 0],
           } : {}}
           transition={{ duration: 0.2 }}
           className="grid bg-[#111] border border-white/10 relative z-0"
           style={{ 
             gridTemplateColumns: `repeat(${gameState.gridWidth}, 1fr)`,
             width: 'min(85vw, 600px)',
             aspectRatio: `${gameState.gridWidth} / ${gameState.gridHeight}`
           }}
         >
           {gameState.board.map((row: any[]) => 
             row.map((cell: any) => (
               <CellComponent 
                 key={`${cell.x}-${cell.y}`} 
                 cell={cell} 
                 isMyTurn={isMyTurn}
                 roomId={gameState.id}
                 myId={socket.id}
                 players={gameState.players}
               />
             ))
           )}
         </motion.div>

         {/* Explosion Overlay */}
         <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
            <AnimatePresence>
              {explosions.map((exp) => (
                <ExplosionEffect 
                  key={exp.id} 
                  x={exp.x} 
                  y={exp.y} 
                  color={exp.color} 
                  gridWidth={gameState.gridWidth} 
                  gridHeight={gameState.gridHeight}
                  onComplete={() => setExplosions(prev => prev.filter(e => e.id !== exp.id))}
                />
              ))}
            </AnimatePresence>
         </div>
       </div>

       {gameState.status === 'gameover' && (
         <motion.div 
           initial={{ opacity: 0, scale: 0.9, filter: 'blur(20px)' }}
           animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
           className="mt-8 text-center space-y-8 bg-white/[0.02] border border-white/10 p-6 sm:p-12 rounded-2xl sm:rounded-[3rem] backdrop-blur-3xl relative overflow-hidden group w-full max-w-2xl"
         >
            <div className="absolute inset-0 bg-gradient-to-br from-[#ff2e63]/5 to-transparent pointer-events-none" />
            
            {/* Celebration Effect */}
            <AtomicBurst color={gameState.players.find((p: Player) => p.id === gameState.winnerId)?.avatar?.color || COLOR_MAP[gameState.players.find((p: Player) => p.id === gameState.winnerId)?.color as keyof typeof COLOR_MAP] || '#f5d300'} />
            
            <div className="relative z-10">
              <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-3 px-6 py-2 bg-white/5 border border-white/10 rounded-full mb-8"
              >
                <Trophy className="w-5 h-5 text-[#f5d300]" />
                <span className="text-[10px] sm:text-[12px] uppercase font-black tracking-[0.4em] text-[#f5d300]">Game Over</span>
              </motion.div>
              
              <div className="flex flex-col items-center gap-6 mb-12">
                <motion.div
                  animate={{ 
                    scale: [1, 1.1, 1],
                    boxShadow: ['0 0 0px transparent', '0 0 40px rgba(245,211,0,0.3)', '0 0 0px transparent']
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <PlayerAvatar 
                    icon={gameState.players.find((p: Player) => p.id === gameState.winnerId)?.avatar?.icon} 
                    color={gameState.players.find((p: Player) => p.id === gameState.winnerId)?.avatar?.color || COLOR_MAP[gameState.players.find((p: Player) => p.id === gameState.winnerId)?.color as keyof typeof COLOR_MAP]} 
                    size="xl" 
                  />
                </motion.div>
                
                <div className="space-y-2">
                  <h2 className="text-5xl sm:text-7xl font-black italic tracking-tighter uppercase text-white skew-x-[-6deg] leading-none">
                    {gameState.players.find((p: Player) => p.id === gameState.winnerId)?.name}
                  </h2>
                  <p className="text-[10px] uppercase font-bold text-white/30 tracking-[0.5em] font-mono">Winner!</p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-12">
                {gameState.players.map(p => {
                  const isWinner = p.id === gameState.winnerId;
                  const color = p.avatar?.color || COLOR_MAP[p.color];
                  
                  return (
                    <motion.div 
                      key={p.id} 
                      whileHover={{ y: -5 }}
                      className={cn(
                        "text-center space-y-2 p-4 rounded-2xl border transition-all", 
                        isWinner ? "bg-white/5 border-white/20 ring-2 ring-white/10" : "bg-white/[0.02] border-white/5 opacity-50 grayscale"
                      )}
                    >
                      <div className="relative inline-block">
                        <PlayerAvatar icon={p.avatar?.icon} color={color} size="sm" className="mx-auto" />
                        {isWinner && <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#f5d300] rounded-full ring-2 ring-black" />}
                      </div>
                      <p className="text-[8px] font-black uppercase tracking-widest truncate">{p.name}</p>
                      <p className="text-xl font-black italic tracking-tighter" style={{ color }}>{p.stats?.explosionsTriggered || 0}</p>
                      <p className="text-[6px] uppercase font-black text-white/20">Explosions</p>
                    </motion.div>
                  );
                })}
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button 
                  onClick={() => setShowDetailedStats(true)}
                  className="w-full sm:w-auto px-8 py-4 bg-white/5 border border-white/10 text-white font-black uppercase tracking-widest text-[10px] hover:bg-white/10 transition-colors flex items-center justify-center gap-3 active:scale-95"
                >
                  <BarChart3 className="w-5 h-5" /> Score Details
                </button>
                {myPlayer?.isHost && (
                  <button 
                    onClick={() => socket.emit('play_again', gameState.id)} 
                    className="w-full sm:w-auto px-12 py-4 bg-[#ff2e63] text-white font-black uppercase tracking-widest text-[10px] hover:skew-x-[-3deg] transition-all hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(255,46,99,0.3)] flex items-center justify-center gap-3"
                  >
                    <Zap className="w-5 h-5 fill-current" /> Play Again
                  </button>
                )}
                <button 
                  onClick={() => socket.emit('leave_game', gameState.id)} 
                  className="w-full sm:w-auto px-8 py-4 bg-white/5 border border-white/10 text-white font-black uppercase tracking-widest text-[10px] hover:border-white/30 transition-colors flex items-center justify-center gap-3 active:scale-95"
                >
                  <LogOut className="w-5 h-5" /> Exit
                </button>
              </div>
            </div>
         </motion.div>
       )}
    </div>
  );
}

function ExplosionEffect({ x, y, color, gridWidth, gridHeight, onComplete }: any) {
  const left = `${(x + 0.5) * (100 / gridWidth)}%`;
  const top = `${(y + 0.5) * (100 / gridHeight)}%`;

  useEffect(() => {
    const timer = setTimeout(onComplete, 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="absolute" style={{ left, top }}>
      {/* Shockwave */}
      <motion.div
        initial={{ scale: 0, opacity: 0.8 }}
        animate={{ scale: 4, opacity: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="absolute w-20 h-20 -translate-x-1/2 -translate-y-1/2 rounded-full border-2"
        style={{ borderColor: color, boxShadow: `0 0 40px ${color}` }}
      />
      
      {/* Particles */}
      {Array.from({ length: 8 }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
          animate={{ 
            x: Math.cos((i * 45) * Math.PI / 180) * 80, 
            y: Math.sin((i * 45) * Math.PI / 180) * 80,
            opacity: 0,
            scale: 0
          }}
          transition={{ duration: 0.8, ease: "circOut" }}
          className="absolute w-2 h-2 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{ backgroundColor: color, boxShadow: `0 0 10px ${color}` }}
        />
      ))}

      {/* Grid Flare */}
      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: [0, 1, 0], scale: [0, 1.5, 2] }}
        transition={{ duration: 0.4 }}
        className="absolute w-40 h-1 bg-gradient-to-r from-transparent via-white to-transparent -translate-x-1/2 -translate-y-1/2"
        style={{ color: color }}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: [0, 1, 0], scale: [0, 1.5, 2] }}
        transition={{ duration: 0.4 }}
        className="absolute w-1 h-40 bg-gradient-to-b from-transparent via-white to-transparent -translate-x-1/2 -translate-y-1/2"
        style={{ color: color }}
      />
    </div>
  );
}

function CellComponent({ cell, isMyTurn, roomId, myId, players }: any) {
  const handleClick = () => {
    if (!isMyTurn) return;
    if (cell.playerId !== null && cell.playerId !== myId) return;
    audioController.play('place');
    socket.emit('make_move', { roomId, x: cell.x, y: cell.y });
  };

  const cellOwner = players.find((p: Player) => p.id === cell.playerId);
  const orbColor = cellOwner ? COLOR_MAP[cellOwner.color] : 'transparent';
  
  return (
    <button 
      onClick={handleClick}
      disabled={!isMyTurn}
      className={cn(
        "relative flex items-center justify-center border border-white/5 bg-white/[0.02] transition-all overflow-hidden group",
        isMyTurn && (cell.playerId === null || cell.playerId === myId) ? "hover:bg-white/[0.05] cursor-pointer" : "cursor-default",
        cell.playerId && "border-opacity-20"
      )}
      style={{ borderColor: cell.playerId ? `${orbColor}40` : undefined }}
    >
      <div className="absolute inset-0 flex items-center justify-center gap-1 p-2">
         <AnimatePresence mode="popLayout">
           {Array.from({ length: cell.count }).map((_, i) => (
             <motion.div
               key={i}
               layout
               initial={{ scale: 0 }}
               animate={{ scale: 1 }}
               exit={{ scale: 0 }}
               className="w-3 h-3 md:w-4 md:h-4 rounded-full relative"
               style={{ 
                 backgroundColor: orbColor,
                 boxShadow: `0 0 15px ${orbColor}`
               }}
             />
           ))}
         </AnimatePresence>
      </div>
      
      {/* Critical state indicator */}
      {cell.count > 0 && cell.count >= cell.capacity - 1 && (
         <motion.div 
           initial={{ opacity: 0 }}
           animate={{ opacity: [0.1, 0.4, 0.1] }}
           transition={{ duration: 0.5, repeat: Infinity }}
           className="absolute inset-0 pointer-events-none"
           style={{ backgroundColor: orbColor }}
         />
      )}

      {/* Skewed capacity text as seen in data-heavy themes */}
      <div className="absolute bottom-1 right-1 text-[7px] font-mono font-black text-white/10 uppercase tracking-tighter">
         {cell.count}/{cell.capacity}
      </div>
    </button>
  );
}

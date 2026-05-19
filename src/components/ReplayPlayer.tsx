import React, { useState, useEffect, useCallback } from 'react';
import { Replay, ReplayMove, Cell, COLOR_MAP, Player, GameState } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Pause, RotateCcw, FastForward, Rewind, ChevronLeft, Calendar, Trophy as TrophyIcon } from 'lucide-react';
import { cn } from '../lib/utils';
import PlayerAvatar from './PlayerAvatar';
import { audioController } from '../lib/audio';

interface ReplayPlayerProps {
  replay: Replay;
  onClose: () => void;
}

export default function ReplayPlayer({ replay, onClose }: ReplayPlayerProps) {
  const [currentMoveIndex, setCurrentMoveIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [gameState, setGameState] = useState<Partial<GameState>>({
    gridWidth: replay.gridWidth,
    gridHeight: replay.gridHeight,
    board: createInitialBoard(replay.gridWidth, replay.gridHeight),
    lastExplosions: [],
    players: replay.players
  });
  const [shake, setShake] = useState(false);

  function createInitialBoard(width: number, height: number): Cell[][] {
    const board: Cell[][] = [];
    for (let y = 0; y < height; y++) {
      const row: Cell[] = [];
      for (let x = 0; x < width; x++) {
        let capacity = 4;
        const isEdgeX = x === 0 || x === width - 1;
        const isEdgeY = y === 0 || y === height - 1;
        if (isEdgeX && isEdgeY) capacity = 2;
        else if (isEdgeX || isEdgeY) capacity = 3;
        row.push({ x, y, playerId: null, count: 0, capacity });
      }
      board.push(row);
    }
    return board;
  }

  const applyMove = useCallback((move: ReplayMove, currentBoard: Cell[][]) => {
    const newBoard = JSON.parse(JSON.stringify(currentBoard));
    const explosions: { x: number; y: number; color: string }[] = [];
    
    const queue: { x: number; y: number }[] = [{ x: move.x, y: move.y }];
    const firstCell = newBoard[move.y][move.x];
    firstCell.count++;
    firstCell.playerId = move.playerId;

    while (queue.length > 0) {
      const { x, y } = queue.shift()!;
      const cell = newBoard[y][x];

      if (cell.count >= cell.capacity) {
        const p = replay.players.find(pl => pl.id === move.playerId);
        const color = p?.avatar?.color || (p ? COLOR_MAP[p.color] : '#fff');
        explosions.push({ x, y, color });

        const excess = cell.count - cell.capacity;
        cell.count = excess;
        if (cell.count === 0) cell.playerId = null;

        const neighbors = [
          { nx: x + 1, ny: y }, { nx: x - 1, ny: y },
          { nx: x, ny: y + 1 }, { nx: x, ny: y - 1 },
        ];

        for (const { nx, ny } of neighbors) {
          if (nx >= 0 && nx < replay.gridWidth && ny >= 0 && ny < replay.gridHeight) {
            const nCell = newBoard[ny][nx];
            nCell.count++;
            nCell.playerId = move.playerId;
            if (nCell.count >= nCell.capacity) {
              queue.push({ x: nx, y: ny });
            }
          }
        }
      }
    }

    return { newBoard, explosions };
  }, [replay]);

  const goToMove = useCallback((index: number) => {
    if (index < -1) return;
    
    let board = createInitialBoard(replay.gridWidth, replay.gridHeight);
    let explosions: { x: number; y: number; color: string }[] = [];
    
    for (let i = 0; i <= index; i++) {
       const result = applyMove(replay.moves[i], board);
       board = result.newBoard;
       if (i === index) explosions = result.explosions;
    }

    setGameState(prev => ({ ...prev, board, lastExplosions: explosions }));
    setCurrentMoveIndex(index);

    if (explosions.length > 0) {
      setShake(true);
      setTimeout(() => setShake(false), 200);
      audioController.play('explode');
    } else if (index >= 0) {
       audioController.play('place');
    }
  }, [replay, applyMove]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlaying && currentMoveIndex < replay.moves.length - 1) {
      timer = setTimeout(() => {
        goToMove(currentMoveIndex + 1);
      }, 1000 / playbackSpeed);
    } else if (currentMoveIndex === replay.moves.length - 1) {
      setIsPlaying(false);
    }
    return () => clearTimeout(timer);
  }, [isPlaying, currentMoveIndex, replay.moves, playbackSpeed, goToMove]);

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex flex-col items-center">
      <div className="w-full max-w-5xl p-6 flex flex-col h-full">
        <header className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-8">
           <div className="flex items-center gap-4 w-full sm:w-auto">
              <button 
                onClick={onClose}
                className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all text-white/50 hover:text-white"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div>
                 <h2 className="text-lg sm:text-xl font-black uppercase tracking-widest text-[#ff2e63]">Mission Logs</h2>
                 <p className="text-[10px] text-white/40 font-bold uppercase tracking-tighter flex items-center gap-2">
                   <Calendar className="w-3 h-3" /> {new Date(replay.createdAt).toLocaleDateString()}
                 </p>
              </div>
           </div>

           <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-6 border-t border-white/5 sm:border-none pt-4 sm:pt-0">
              <div className="flex -space-x-2">
                 {replay.players.map(p => (
                   <div key={p.id} className="relative group">
                     <PlayerAvatar icon={p.avatar?.icon} color={p.avatar?.color || COLOR_MAP[p.color]} size="sm" className={cn(p.id === replay.winnerId && "ring-2 ring-yellow-500 scale-110 z-10")} />
                   </div>
                 ))}
              </div>
              <div className="text-right">
                <p className="text-[8px] sm:text-[9px] uppercase font-black text-white/30">Victor</p>
                <p className="text-xs sm:text-sm font-black italic text-yellow-500 uppercase truncate max-w-[120px]">{replay.players.find(p => p.id === replay.winnerId)?.name}</p>
              </div>
           </div>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center p-2 sm:p-4 min-h-0">
           <div className="relative">
             <motion.div 
               animate={shake ? {
                 x: [0, -4, 4, -4, 4, 0],
                 y: [0, 4, -4, 4, -4, 0],
               } : {}}
               transition={{ duration: 0.2 }}
               className="grid bg-[#111] border border-white/10 relative z-0"
               style={{ 
                 gridTemplateColumns: `repeat(${replay.gridWidth}, 1fr)`,
                 width: 'min(90vw, 500px)',
                 aspectRatio: `${replay.gridWidth} / ${replay.gridHeight}`
               }}
             >
               {gameState.board?.map((row, y) => 
                 row.map((cell, x) => (
                   <div 
                    key={`${x}-${y}`} 
                    className="relative border border-white/5 flex items-center justify-center overflow-hidden h-full w-full"
                   >
                      <AnimatePresence>
                        {cell.count > 0 && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                            className="relative flex items-center justify-center h-full w-full"
                          >
                             {/* Central Glow */}
                             <div 
                                className="absolute w-2/3 h-2/3 rounded-full blur-xl opacity-20"
                                style={{ backgroundColor: cell.playerId ? COLOR_MAP[replay.players.find(p => p.id === cell.playerId)?.color as keyof typeof COLOR_MAP] : '#fff' }}
                             />
                             
                             {/* Orbs */}
                             <div className="flex flex-wrap items-center justify-center gap-1 p-2">
                                {Array.from({ length: cell.count }).map((_, i) => (
                                  <motion.div
                                    key={i}
                                    layout
                                    className="w-3 h-3 rounded-full shadow-[0_0_10px_rgba(255,255,255,0.4)]"
                                    style={{ 
                                      backgroundColor: cell.playerId ? COLOR_MAP[replay.players.find(p => p.id === cell.playerId)?.color as keyof typeof COLOR_MAP] : '#fff',
                                      animation: `pulse 2s infinite ${i * 0.2}s`
                                    }}
                                  />
                                ))}
                             </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                   </div>
                 ))
               )}
             </motion.div>
           </div>
        </main>

        <footer className="mt-8 space-y-4 sm:space-y-6">
           {/* Timeline Slider */}
           <div className="space-y-2">
              <div className="flex justify-between text-[9px] sm:text-[10px] uppercase font-black tracking-widest text-white/30">
                 <span>T-START</span>
                 <span>T-END</span>
              </div>
              <div className="relative h-2 bg-white/5 rounded-full overflow-hidden group">
                 <div 
                    className="absolute inset-y-0 left-0 bg-[#ff2e63] transition-all duration-300"
                    style={{ width: `${((currentMoveIndex + 1) / replay.moves.length) * 100}%` }}
                 />
                 <input 
                    type="range" 
                    min="-1" 
                    max={replay.moves.length - 1} 
                    value={currentMoveIndex}
                    onChange={(e) => goToMove(parseInt(e.target.value))}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                 />
              </div>
              <div className="flex justify-between text-[9px] sm:text-[10px] font-mono font-black text-white/50">
                 <span>LOG {currentMoveIndex + 1}</span>
                 <span>TOTAL {replay.moves.length}</span>
              </div>
           </div>

           {/* Controls */}
           <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 pb-4">
              <div className="flex items-center gap-4 order-2 sm:order-1">
                 <button 
                   onClick={() => setPlaybackSpeed(s => Math.max(0.5, s - 0.5))}
                   className="p-2 text-white/30 hover:text-white transition-colors"
                 >
                    <Rewind className="w-4 h-4" />
                 </button>
                 <span className="text-[10px] font-mono font-black w-10 text-center text-[#ff2e63]">{playbackSpeed}X</span>
                 <button 
                    onClick={() => setPlaybackSpeed(s => Math.min(4, s + 0.5))}
                    className="p-2 text-white/30 hover:text-white transition-colors"
                 >
                    <FastForward className="w-4 h-4" />
                 </button>
              </div>

              <div className="flex items-center gap-6 order-1 sm:order-2">
                 <button 
                   onClick={() => goToMove(-1)}
                   className="p-3 text-white/50 hover:text-white transition-colors"
                 >
                    <RotateCcw className="w-5 h-5 sm:w-6 sm:h-6" />
                 </button>
                 <button 
                   onClick={() => setIsPlaying(!isPlaying)}
                   className="w-14 h-14 sm:w-16 sm:h-16 bg-white text-black rounded-2xl flex items-center justify-center hover:bg-[#ff2e63] hover:text-white transition-all hover:scale-110 active:scale-95 shadow-xl shadow-white/5"
                 >
                    {isPlaying ? <Pause className="w-6 h-6 sm:w-8 sm:h-8" /> : <Play className="w-6 h-6 sm:w-8 sm:h-8 ml-1" />}
                 </button>
              </div>

              <div className="flex items-center justify-center gap-2 order-3 sm:w-32 sm:justify-end">
                 <div className="text-right">
                    <p className="text-[7px] sm:text-[8px] uppercase font-black text-white/20">Active Pilot</p>
                    <p className="text-[9px] sm:text-[10px] font-black uppercase text-white/60 truncate max-w-[80px] sm:max-w-[100px]">
                      {currentMoveIndex >= 0 ? replay.players.find(p => p.id === replay.moves[currentMoveIndex].playerId)?.name : 'STANDBY'}
                    </p>
                 </div>
                 {currentMoveIndex >= 0 && (
                   <PlayerAvatar 
                    icon={replay.players.find(p => p.id === replay.moves[currentMoveIndex].playerId)?.avatar?.icon} 
                    color={replay.players.find(p => p.id === replay.moves[currentMoveIndex].playerId)?.avatar?.color || '#fff'} 
                    size="xs" 
                   />
                 )}
              </div>
           </div>
        </footer>
      </div>
    </div>
  );
}

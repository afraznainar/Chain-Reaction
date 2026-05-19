import React from 'react';
import { Settings, Maximize, LayoutGrid, Users, Check } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

interface GameSettingsProps {
  gridWidth: number;
  gridHeight: number;
  maxPlayers: number;
  isHost: boolean;
  onUpdate: (settings: { gridWidth?: number; gridHeight?: number; maxPlayers?: number }) => void;
  onClose: () => void;
}

export default function GameSettings({ gridWidth, gridHeight, maxPlayers, isHost, onUpdate, onClose }: GameSettingsProps) {
  if (!isHost) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl relative"
    >
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#ff2e63]/10 rounded-lg">
            <Settings className="w-5 h-5 text-[#ff2e63]" />
          </div>
          <div>
            <h3 className="text-sm font-black uppercase tracking-widest text-white">Arena Config</h3>
            <p className="text-[10px] text-white/40 font-bold uppercase tracking-tighter">Tactical Grid Calibration</p>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        {/* Grid Size */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-white/60">
              <LayoutGrid className="w-4 h-4" />
              <span className="text-[10px] uppercase font-black tracking-widest">Dimension</span>
            </div>
            <span className="text-xs font-mono font-black text-[#ff2e63]">{gridWidth} x {gridHeight}</span>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[9px] uppercase text-white/30 font-bold">Width</label>
              <input 
                type="range" 
                min="4" 
                max="12" 
                value={gridWidth} 
                onChange={(e) => onUpdate({ gridWidth: parseInt(e.target.value) })}
                className="w-full accent-[#ff2e63]"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[9px] uppercase text-white/30 font-bold">Height</label>
              <input 
                type="range" 
                min="4" 
                max="15" 
                value={gridHeight} 
                onChange={(e) => onUpdate({ gridHeight: parseInt(e.target.value) })}
                className="w-full accent-[#ff2e63]"
              />
            </div>
          </div>
        </div>

        {/* Max Players */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-white/60">
              <Users className="w-4 h-4" />
              <span className="text-[10px] uppercase font-black tracking-widest">Capacity</span>
            </div>
            <span className="text-xs font-mono font-black text-[#ff2e63]">{maxPlayers} Slots</span>
          </div>
          
          <div className="flex gap-2">
            {[2, 4, 6, 8].map(val => (
              <button
                key={val}
                onClick={() => onUpdate({ maxPlayers: val })}
                className={cn(
                  "flex-1 py-2 rounded-lg border text-[10px] font-black transition-all",
                  maxPlayers === val 
                    ? "bg-[#ff2e63] border-[#ff2e63] text-white" 
                    : "bg-white/5 border-white/5 text-white/40 hover:bg-white/10"
                )}
              >
                {val}P
              </button>
            ))}
          </div>
        </div>

        <button 
          onClick={onClose}
          className="w-full py-4 bg-white text-black text-[11px] font-black uppercase tracking-[0.3em] hover:bg-[#ff2e63] hover:text-white transition-all rounded-xl"
        >
          Finalize Calibration
        </button>
      </div>

      {/* Background decoration */}
      <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
        <Maximize className="w-24 h-24 text-white" />
      </div>
    </motion.div>
  );
}

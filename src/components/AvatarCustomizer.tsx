import React from 'react';
import { motion } from 'motion/react';
import PlayerAvatar, { AVATAR_ICONS, AVATAR_COLORS } from './PlayerAvatar';
import { Check } from 'lucide-react';
import { cn } from '../lib/utils';

interface AvatarCustomizerProps {
  currentIcon: string;
  currentColor: string;
  onSelect: (icon: string, color: string) => void;
}

export default function AvatarCustomizer({ currentIcon, currentColor, onSelect }: AvatarCustomizerProps) {
  return (
    <div className="space-y-6 p-6 bg-white/[0.02] border border-white/5 rounded-2xl">
      <div className="flex flex-col items-center gap-4 mb-6">
        <PlayerAvatar icon={currentIcon} color={currentColor} size="xl" />
        <span className="text-[10px] uppercase tracking-[0.3em] font-black text-white/40">Customize Hologram</span>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-[9px] uppercase tracking-widest font-bold text-white/30 mb-2 block">Spectral Signature</label>
          <div className="grid grid-cols-4 gap-2">
            {AVATAR_COLORS.map(color => (
              <button
                key={color}
                type="button"
                onClick={() => onSelect(currentIcon, color)}
                className={cn(
                  "h-8 rounded-lg transition-all relative overflow-hidden",
                  currentColor === color ? "ring-2 ring-white scale-110" : "hover:scale-105 opacity-60 hover:opacity-100"
                )}
                style={{ backgroundColor: color }}
              >
                {currentColor === color && (
                  <Check className="w-4 h-4 text-black absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                )}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-[9px] uppercase tracking-widest font-bold text-white/30 mb-2 block">Emitter Icon</label>
          <div className="grid grid-cols-4 gap-2">
            {Object.entries(AVATAR_ICONS).map(([key, Icon]) => (
              <button
                key={key}
                type="button"
                onClick={() => onSelect(key, currentColor)}
                className={cn(
                  "p-3 rounded-lg border transition-all flex items-center justify-center",
                  currentIcon === key 
                    ? "bg-white/10 border-white/40 scale-110" 
                    : "bg-white/5 border-white/5 hover:bg-white/10"
                )}
              >
                <Icon size={16} className={cn(currentIcon === key ? "text-white" : "text-white/40")} />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { 
  Zap, Shield, Target, Cpu, Atom, Biohazard, 
  Flame, Skull, Ghost, Gem, Crown, Swords,
  User
} from 'lucide-react';
import { cn } from '../lib/utils';

export const AVATAR_ICONS: Record<string, any> = {
  zap: Zap,
  shield: Shield,
  target: Target,
  cpu: Cpu,
  atom: Atom,
  biohazard: Biohazard,
  flame: Flame,
  skull: Skull,
  ghost: Ghost,
  gem: Gem,
  crown: Crown,
  swords: Swords
};

export const AVATAR_COLORS = [
  '#ff2e63', '#08f7fe', '#22c55e', '#f5d300', 
  '#a855f7', '#f97316', '#ec4899', '#6366f1'
];

interface PlayerAvatarProps {
  icon?: string;
  color?: string;
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

export default function PlayerAvatar({ icon, color = '#ff2e63', className, size = 'md' }: PlayerAvatarProps) {
  const IconComponent = icon && AVATAR_ICONS[icon] ? AVATAR_ICONS[icon] : User;
  
  const sizeClasses = {
    xs: 'w-4 h-4',
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  };

  const iconSizes = {
    xs: 8,
    sm: 12,
    md: 20,
    lg: 32,
    xl: 48
  };

  return (
    <div 
      className={cn(
        "relative rounded-full flex items-center justify-center transition-all duration-500",
        "shadow-[0_0_20px_rgba(0,0,0,0.5)] border-2",
        sizeClasses[size],
        className
      )}
      style={{ 
        backgroundColor: `${color}10`,
        borderColor: `${color}40`,
        boxShadow: `0 0 15px ${color}20, inset 0 0 10px ${color}10`
      }}
    >
      {/* 3D-ish Glow layers */}
      <div 
        className="absolute inset-0 rounded-full bg-gradient-to-br from-white/20 to-transparent pointer-events-none" 
      />
      
      <IconComponent 
        size={iconSizes[size]} 
        style={{ color: color }}
        className="drop-shadow-[0_0_8px_rgba(255,255,255,0.3)] relative z-10"
      />

      {/* Decorative rim */}
      <div 
        className="absolute inset-[2px] rounded-full border border-white/5 pointer-events-none"
      />
    </div>
  );
}

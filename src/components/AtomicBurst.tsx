import React from 'react';
import { motion } from 'motion/react';

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
}

export default function AtomicBurst({ color }: { color: string }) {
  const particles: Particle[] = Array.from({ length: 40 }).map((_, i) => ({
    id: i,
    x: (Math.random() - 0.5) * 400,
    y: (Math.random() - 0.5) * 400,
    color,
    size: Math.random() * 4 + 2
  }));

  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
          animate={{ 
            x: p.x, 
            y: p.y, 
            opacity: 0, 
            scale: 0,
            rotate: Math.random() * 360 
          }}
          transition={{ 
            duration: 1.5 + Math.random(), 
            ease: "easeOut",
            repeat: Infinity,
            repeatDelay: Math.random() * 2
          }}
          className="absolute rounded-full"
          style={{ 
            backgroundColor: p.color,
            width: p.size,
            height: p.size,
            boxShadow: `0 0 15px ${p.color}, 0 0 30px ${p.color}` 
          }}
        />
      ))}
      
      {/* Shockwave ring */}
      <motion.div
        initial={{ scale: 0, opacity: 0.8 }}
        animate={{ scale: 4, opacity: 0 }}
        transition={{ 
          duration: 2, 
          ease: "easeOut", 
          repeat: Infinity,
          repeatDelay: 1
        }}
        className="absolute w-20 h-20 border-2 rounded-full"
        style={{ borderColor: color, boxShadow: `0 0 40px ${color}` }}
      />
    </div>
  );
}

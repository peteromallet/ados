'use client'

import { motion } from 'framer-motion'

interface VibeToggleProps {
  value: 'chill' | 'epic'
  onChange: (vibe: 'chill' | 'epic') => void
}

export function VibeToggle({ value, onChange }: VibeToggleProps) {
  const vibe = value

  return (
    <div className="flex items-center gap-4">
      <motion.button
        onClick={() => onChange('chill')}
        animate={{
          scale: [1, 1.05, 1],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className={`text-sm uppercase tracking-wider transition-all ${
          vibe === 'chill'
            ? 'text-white font-semibold'
            : vibe === 'epic'
              ? 'text-black/50 hover:text-black/75'
              : 'text-white/50 hover:text-white/75'
        }`}
      >
        Chill
      </motion.button>
      
      <div className={`relative w-12 h-6 rounded-full cursor-pointer transition-colors ${
        vibe === 'epic' ? 'bg-black/20' : 'bg-white/20'
      }`} onClick={() => onChange(vibe === 'chill' ? 'epic' : 'chill')}>
        <motion.div
          className={`absolute top-0.5 w-5 h-5 rounded-full shadow-lg transition-colors ${
            vibe === 'epic' ? 'bg-black' : 'bg-white'
          }`}
          animate={{
            left: vibe === 'chill' ? '2px' : '26px',
          }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      </div>
      
      <motion.button
        onClick={() => onChange('epic')}
        animate={{
          scale: [1, 1.05, 1],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className={`text-sm uppercase tracking-wider transition-all ${
          vibe === 'epic'
            ? 'text-black font-semibold'
            : 'text-white/50 hover:text-white/75'
        }`}
      >
        Epic
      </motion.button>
    </div>
  )
}

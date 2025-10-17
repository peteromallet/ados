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
        className={`text-sm uppercase tracking-wider transition-all duration-300 ${
          vibe === 'chill'
            ? 'text-white font-semibold'
            : vibe === 'epic'
              ? 'text-yellow-100/50 hover:text-yellow-100/75'
              : 'text-white/50 hover:text-white/75'
        }`}
      >
        Chill
      </motion.button>
      
      <div 
        className={`relative w-12 h-6 rounded-full cursor-pointer transition-colors duration-300 ${
          vibe === 'epic' ? 'bg-yellow-500/20' : 'bg-white/20'
        }`}
        onClick={() => onChange(vibe === 'chill' ? 'epic' : 'chill')}
      >
        <motion.div
          className={`absolute top-0.5 w-5 h-5 rounded-full shadow-lg ${
            vibe === 'epic' ? 'bg-yellow-300' : 'bg-white'
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
        className={`text-sm uppercase tracking-wider transition-all duration-300 ${
          vibe === 'epic'
            ? 'text-yellow-200 font-semibold'
            : 'text-white/50 hover:text-white/75'
        }`}
      >
        Epic
      </motion.button>
    </div>
  )
}

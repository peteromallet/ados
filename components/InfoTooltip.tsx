'use client'

import { useState, ReactNode, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'

interface InfoTooltipProps {
  trigger: string
  content: ReactNode
  isDark?: boolean
}

export function InfoTooltip({ trigger, content, isDark = false }: InfoTooltipProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const mobileTooltip = (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Mobile backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="md:hidden fixed inset-0 bg-black/50 z-[9998]"
            onClick={() => setIsOpen(false)}
          />

          {/* Mobile tooltip - explicitly centered */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className={`md:hidden fixed backdrop-blur-sm p-5 rounded-lg text-sm text-left whitespace-pre-line z-[9999] ${
              isDark
                ? 'bg-white/95 text-black border border-black/20 shadow-xl'
                : 'bg-black/95 text-white border border-white/20 shadow-xl'
            }`}
            style={{
              top: '6rem',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '85vw',
              maxWidth: '24rem',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {content}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )

  return (
    <>
      <div className="relative flex items-center justify-center">
        <button
          onClick={() => setIsOpen(!isOpen)}
          onMouseEnter={() => setIsOpen(true)}
          onMouseLeave={() => setIsOpen(false)}
          className={`transition-colors text-sm uppercase tracking-wide border-b pb-1 whitespace-nowrap ${
            isDark 
              ? 'text-black/80 hover:text-black border-black/40 hover:border-black' 
              : 'text-white/80 hover:text-white border-white/40 hover:border-white'
          }`}
        >
          {trigger}
        </button>
        
        {/* Desktop tooltip - positioned above trigger */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className={`hidden md:block absolute bottom-full mb-3 backdrop-blur-sm p-4 rounded-lg text-sm text-left whitespace-pre-line z-50 w-64 ${
                isDark
                  ? 'bg-white/90 text-black border border-black/20'
                  : 'bg-black/90 text-white border border-white/20'
              }`}
              style={{
                left: '50%',
                marginLeft: '-8rem', // Half of w-64 (16rem / 2 = 8rem)
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {content}
              <div 
                className={`absolute top-full w-3 h-3 ${
                  isDark
                    ? 'bg-white/90 border-r border-b border-black/20'
                    : 'bg-black/90 border-r border-b border-white/20'
                }`}
                style={{
                  left: '50%',
                  marginLeft: '-6px',
                  marginTop: '-6px',
                  transform: 'rotate(45deg)',
                }}
              ></div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Mobile tooltip and backdrop - rendered via portal to document.body */}
      {mounted && createPortal(mobileTooltip, document.body)}
    </>
  )
}
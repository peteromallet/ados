'use client'

import { useState, ReactNode, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'

interface InfoTooltipProps {
  trigger: string
  content: ReactNode
  isDark?: boolean
  arrowPosition?: 'left' | 'center' | 'right'
}

export function InfoTooltip({ trigger, content, isDark = false, arrowPosition = 'center' }: InfoTooltipProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [buttonTop, setButtonTop] = useState(0)
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setButtonTop(rect.top)
    }
  }, [isOpen])

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

          {/* Centering container */}
          <div
            className="md:hidden fixed left-0 right-0 z-[9999] flex justify-center items-end pb-4 pointer-events-none"
            style={{
              top: 0,
              height: `${buttonTop}px`, // Container goes from top to button position
            }}
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className={`backdrop-blur-sm p-5 rounded-lg text-sm text-left whitespace-pre-line pointer-events-auto relative ${
                isDark
                  ? 'bg-white/95 text-black border border-black/20 shadow-xl'
                  : 'bg-black/95 text-white border border-white/20 shadow-xl'
              }`}
              style={{
                width: '85vw',
                maxWidth: '24rem',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {content}
              
              {/* Arrow pointing down */}
              <div 
                className={`absolute w-3 h-3 ${
                  isDark
                    ? 'bg-white/95 border-r border-b border-black/20'
                    : 'bg-black/95 border-r border-b border-white/20'
                }`}
                style={{
                  bottom: '-6px',
                  left: arrowPosition === 'left' ? '20%' : arrowPosition === 'right' ? '80%' : '50%',
                  marginLeft: '-6px',
                  transform: 'rotate(45deg)',
                }}
              />
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )

  return (
    <>
      <div className="relative flex items-center justify-center">
        <button
          ref={buttonRef}
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
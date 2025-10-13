'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { AuthModal } from '@/components/AuthModal'
import { X } from 'lucide-react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import type { Event } from '@/lib/types'

interface EventDetailClientProps {
  event: Event
}

export function EventDetailClient({ event }: EventDetailClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [hasApplied, setHasApplied] = useState(false)
  const [isLoadingUserData, setIsLoadingUserData] = useState(true)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteCode, setInviteCode] = useState('')
  const [inviteError, setInviteError] = useState('')
  const [isSubmittingInvite, setIsSubmittingInvite] = useState(false)
  const showSuccess = searchParams.get('success') === 'true'

  // Prefetch apply route ASAP for faster navigation
  useEffect(() => {
    router.prefetch(`/events/${event.slug}/apply`)
  }, [event.slug, router])

  // Fetch user-specific data on client side (non-blocking)
  useEffect(() => {
    async function fetchUserData() {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        setIsAuthenticated(true)
        
        // Check if user has applied
        const { data: attendance } = await supabase
          .from('attendance')
          .select('id')
          .eq('event_id', event.id)
          .eq('user_id', user.id)
          .maybeSingle()
        
        if (attendance) {
          setHasApplied(true)
        }
      }
      
      setIsLoadingUserData(false)
    }
    
    fetchUserData()
  }, [event.id, supabase])

  const handleApplyClick = () => {
    if (isAuthenticated) {
      router.push(`/events/${event.slug}/apply`)
    } else {
      setShowAuthModal(true)
    }
  }

  const handleInviteClick = () => {
    setShowInviteModal(true)
  }

  const handleInviteSubmit = async () => {
    setInviteError('')
    
    if (!inviteCode.trim()) {
      setInviteError('Please enter an invite code')
      return
    }

    setIsSubmittingInvite(true)

    try {
      // Validate invite code against database
      const { data: inviteData, error: inviteError } = await supabase
        .from('invites')
        .select('code, name, used_count, max_uses')
        .eq('code', inviteCode.trim().toUpperCase())
        .maybeSingle()

      if (inviteError || !inviteData) {
        setInviteError('Invalid invite code')
        setIsSubmittingInvite(false)
        return
      }

      // Check if invite has uses left
      if (inviteData.used_count >= inviteData.max_uses) {
        setInviteError('This invite code has been used up')
        setIsSubmittingInvite(false)
        return
      }

      // Close modal and redirect to apply page with invite code
      setShowInviteModal(false)
      router.push(`/events/${event.slug}/apply?invite=${inviteCode.trim().toUpperCase()}`)
    } catch (error) {
      console.error('Error validating invite:', error)
      setInviteError('Failed to process invite. Please try again.')
      setIsSubmittingInvite(false)
    }
  }

  const isFull = false // TODO: Implement attendance counting

  return (
    <>
      {/* Status Badge */}
      {showSuccess && (
        <div className="mb-6 p-3 sm:p-4 bg-green-100/90 backdrop-blur-sm border border-green-300 rounded-lg">
          <p className="text-sm sm:text-base text-green-900 font-semibold">
            ✓ You have successfully submitted for this event
          </p>
        </div>
      )}
      
      {hasApplied && !showSuccess && (
        <div className="mb-6 p-3 sm:p-4 bg-blue-100/90 backdrop-blur-sm border border-blue-300 rounded-lg">
          <p className="text-sm sm:text-base text-blue-900 font-semibold">
            ✓ You have already submitted for this event
          </p>
        </div>
      )}

      {isFull && !hasApplied && (
        <div className="mb-6 p-3 sm:p-4 bg-yellow-100/90 backdrop-blur-sm border border-yellow-300 rounded-lg">
          <p className="text-sm sm:text-base text-yellow-900 font-semibold">
            This event has reached maximum capacity
          </p>
        </div>
      )}

      {/* Description */}
      <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-xl p-5 sm:p-8 mb-8">
        <p className="text-text-light text-base sm:text-lg leading-relaxed mb-4 sm:mb-6">
          Join us in LA.
        </p>
        <p className="text-text-light text-base sm:text-lg leading-relaxed mb-4 sm:mb-6">
          The event will consist of:
        </p>
        <ul className="text-text-light text-base sm:text-lg leading-relaxed mb-4 sm:mb-6 list-disc pl-6">
          <li>Day-time: panels, roundtables, hangouts</li>
          <li>Evening: show, drinks, frivolities</li>
        </ul>
        <p className="text-text-light text-base sm:text-lg leading-relaxed">
          We have very limited space so we'll ask a few questions to validate if it's a good mutual fit.
        </p>
      </div>

      {/* CTA */}
      <div className="flex flex-col items-center gap-4">
        {isLoadingUserData ? (
          // Show a loading state while checking user status
          <Button size="lg" disabled>
            Loading...
          </Button>
        ) : hasApplied ? (
          <Link href={`/events/${event.slug}/apply`}>
            <Button size="lg">Update Submission</Button>
          </Link>
        ) : isFull ? (
          <Button size="lg" disabled>
            Event Full
          </Button>
        ) : (
          <>
            <Button 
              size="lg" 
              onClick={handleApplyClick}
              onMouseEnter={() => router.prefetch(`/events/${event.slug}/apply`)}
            >
              Sign up
            </Button>
            <button
              onClick={handleInviteClick}
              className="text-white/80 hover:text-white transition-colors text-xs sm:text-sm underline"
            >
              I was invited
            </button>
          </>
        )}
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        redirectTo={`/events/${event.slug}/apply`}
      />

      {/* Invite Code Modal */}
      <AnimatePresence>
        {showInviteModal && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              onClick={() => setShowInviteModal(false)}
            >
              <div 
                className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md relative"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X size={24} />
                </button>

                <div className="text-center">
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">Enter Invite Code</h2>
                  <p className="text-gray-600 mb-8">
                    If you were personally invited, enter your code below
                  </p>

                  {inviteError && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
                      {inviteError}
                    </div>
                  )}

                  <form onSubmit={(e) => { e.preventDefault(); handleInviteSubmit(); }}>
                    <Input
                      type="text"
                      placeholder="Enter your invite code"
                      value={inviteCode}
                      onChange={(e) => setInviteCode(e.target.value)}
                      className="mb-4"
                    />
                    <Button
                      type="submit"
                      disabled={isSubmittingInvite || !inviteCode.trim()}
                      size="lg"
                      className="w-full"
                    >
                      {isSubmittingInvite ? 'Processing...' : 'Submit'}
                    </Button>
                  </form>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

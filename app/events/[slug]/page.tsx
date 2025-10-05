'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { AuthModal } from '@/components/AuthModal'
import { Calendar, MapPin, X, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import type { Event } from '@/lib/types'

export default function EventDetailPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [hasApplied, setHasApplied] = useState(false)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteCode, setInviteCode] = useState('')
  const [inviteError, setInviteError] = useState('')
  const [isSubmittingInvite, setIsSubmittingInvite] = useState(false)

  useEffect(() => {
    async function loadEvent() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        setIsAuthenticated(!!user)

        const { data: eventData, error } = await supabase
          .from('events')
          .select('*')
          .eq('slug', params.slug as string)
          .single()

        if (error) throw error

        if (user) {
          const { data: attendance } = await supabase
            .from('attendance')
            .select('*')
            .eq('event_id', eventData.id)
            .eq('user_id', user.id)
            .single()

          setHasApplied(!!attendance)
        }

        setEvent(eventData)
      } catch (err) {
        console.error('Error loading event:', err)
      } finally {
        setLoading(false)
      }
    }

    loadEvent()
  }, [params.slug, supabase])

  // Check for pending invite code after auth
  useEffect(() => {
    const processInvite = async () => {
      const pendingCode = sessionStorage.getItem('pendingInviteCode')
      if (pendingCode && isAuthenticated && event) {
        sessionStorage.removeItem('pendingInviteCode')
        
        // Create attendance directly with the pending code
        try {
          const { data: { user } } = await supabase.auth.getUser()
          if (!user) return

          const { error: attendanceError } = await supabase
            .from('attendance')
            .insert({
              user_id: user.id,
              event_id: event.id,
              status: 'approved',
            })

          if (attendanceError) throw attendanceError

          router.push('/success')
        } catch (error) {
          console.error('Error creating attendance:', error)
        }
      }
    }
    
    processInvite()
  }, [isAuthenticated, event, supabase, router])

  const handleApplyClick = () => {
    if (isAuthenticated) {
      router.push(`/events/${params.slug}/apply`)
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

    // Validate invite code
    if (inviteCode.toLowerCase().trim() !== 'goodiewoodie') {
      setInviteError('Invalid invite code')
      return
    }

    // Check if authenticated
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      // If not authenticated, show auth modal first
      setShowInviteModal(false)
      setShowAuthModal(true)
      // Store the invite code to use after auth
      sessionStorage.setItem('pendingInviteCode', inviteCode)
      return
    }

    // User is authenticated and code is valid - create attendance directly
    setIsSubmittingInvite(true)
    
    try {
      const { data: attendance, error: attendanceError } = await supabase
        .from('attendance')
        .insert({
          user_id: user.id,
          event_id: event!.id,
          status: 'approved', // Auto-approve invited guests
        })
        .select()
        .single()

      if (attendanceError) throw attendanceError

      // Success! Redirect to success page
      router.push('/success')
    } catch (error) {
      console.error('Error creating attendance:', error)
      setInviteError('Failed to process invite. Please try again.')
      setIsSubmittingInvite(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <p className="text-xl text-text-light">Loading...</p>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <p className="text-xl text-red-500">Event not found</p>
      </div>
    )
  }

  const isFull = false // TODO: Implement attendance counting

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Hero Section */}
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center text-text-light hover:text-text-dark transition-colors mb-4">
            <ArrowLeft size={24} />
          </Link>
          <h1 className="text-5xl font-bold text-text-dark mb-4">{event.name}</h1>

          <div className="flex flex-wrap gap-4 text-text-light mb-6">
            {event.date && (
              <div className="flex items-center space-x-2">
                <Calendar size={20} />
                <span>{formatDate(event.date)}</span>
              </div>
            )}
            {event.location && (
              <div className="flex items-center space-x-2">
                <MapPin size={20} />
                <span>{event.location}</span>
              </div>
            )}
          </div>
        </div>

        {/* Status Badge */}
        {hasApplied && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-800 font-semibold">
              ✓ You have already applied to this event
            </p>
            <p className="text-blue-600 text-sm mt-1">
              Status: <span className="capitalize">{event.user_attendance.status}</span>
            </p>
          </div>
        )}

        {isFull && !hasApplied && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-800 font-semibold">
              This event has reached maximum capacity
            </p>
          </div>
        )}

        {/* Description */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <p className="text-text-light text-lg leading-relaxed mb-6">
            Join us in LA.
          </p>
          <p className="text-text-light text-lg leading-relaxed mb-6">
            The event will consist of:
          </p>
          <ul className="text-text-light text-lg leading-relaxed mb-6 list-disc pl-6">
            <li>Day-time: panels, roundtables, hangouts</li>
            <li>Evening: show, drinks, frivolities</li>
          </ul>
          <p className="text-text-light text-lg leading-relaxed mb-6">
            We have very limited space so we'll ask a few questions to validate if it's a good mutual fit.
          </p>
          <p className="text-text-light text-lg leading-relaxed">
            For those who wish to travel, we'll have some financial support.
          </p>
        </div>

        {/* CTA */}
        <div className="flex flex-col items-center gap-4">
          {hasApplied ? (
            <Link href="/dashboard">
              <Button size="lg">View My Applications</Button>
            </Link>
          ) : isFull ? (
            <Button size="lg" disabled>
              Event Full
            </Button>
          ) : (
            <>
              <Button size="lg" onClick={handleApplyClick}>
                Proceed to questions
              </Button>
              <button
                onClick={handleInviteClick}
                className="text-text-light hover:text-text-dark transition-colors text-sm underline"
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
                onClick={() => setShowInviteModal(false)}
              />

              {/* Modal */}
              <motion.div
                initial={{ opacity: 0, y: -50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -50 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
              >
                <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md relative">
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
                        autoFocus
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
      </div>
    </div>
  )
}


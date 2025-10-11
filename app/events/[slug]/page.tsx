'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
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
  const searchParams = useSearchParams()
  const supabase = createClient()
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [hasApplied, setHasApplied] = useState(false)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteCode, setInviteCode] = useState('')
  const [inviteError, setInviteError] = useState('')
  const [isSubmittingInvite, setIsSubmittingInvite] = useState(false)
  const showSuccess = searchParams.get('success') === 'true'

  // Prefetch apply page data in the background
  const prefetchApplyData = async () => {
    if (!event) return
    
    try {
      // Always prefetch event with questions (no auth required)
      supabase
        .from('events')
        .select(`
          *,
          questions (*)
        `)
        .eq('slug', params.slug as string)
        .order('order_index', { foreignTable: 'questions', ascending: true })
        .single()
        .then(() => console.log('✅ Prefetched apply page data'))

      // Only prefetch user-specific data if authenticated
      const { data: { user } } = await supabase.auth.getUser()
      if (user && event) {
        supabase
          .from('attendance')
          .select(`
            id,
            answers (question_id, answer_text)
          `)
          .eq('user_id', user.id)
          .eq('event_id', event.id)
          .single()
          .then(() => console.log('✅ Prefetched user answers'))
      }
    } catch (err) {
      // Silent fail - this is just optimization
      console.log('Prefetch skipped:', err)
    }
  }

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

        if (error) {
          console.error('Error loading event:', error)
          setError(error.message || 'Failed to load event')
          setLoading(false)
          return
        }

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
        setError(err instanceof Error ? err.message : 'An unexpected error occurred')
      } finally {
        setLoading(false)
      }
    }

    loadEvent()
  }, [params.slug, supabase])

  // Prefetch apply page data after event loads
  useEffect(() => {
    if (event) {
      // Prefetch the route
      router.prefetch(`/events/${params.slug}/apply`)
      
      // Prefetch data in background after a short delay (to not block main thread)
      const timer = setTimeout(() => {
        prefetchApplyData()
      }, 500)
      
      return () => clearTimeout(timer)
    }
  }, [event])

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

          router.push(`/events/${params.slug}?success=true`)
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

      // Success! Redirect back to event page with success message
      router.push(`/events/${params.slug}?success=true`)
    } catch (error) {
      console.error('Error creating attendance:', error)
      setInviteError('Failed to process invite. Please try again.')
      setIsSubmittingInvite(false)
    }
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-white px-4">
        <p className="text-lg sm:text-xl text-text-light">Loading...</p>
      </div>
    )
  }

  if (error || !event) {
    return (
      <div className="h-screen flex items-center justify-center bg-white px-4">
        <div className="text-center">
          <p className="text-lg sm:text-xl text-red-500 mb-2">
            {error || 'Event not found'}
          </p>
          <p className="text-xs sm:text-sm text-gray-500 mb-4">Slug: {params.slug}</p>
          <Link href="/" className="text-sm sm:text-base text-blue-500 hover:underline">
            Return to home
          </Link>
        </div>
      </div>
    )
  }

  const isFull = false // TODO: Implement attendance counting

  return (
    <>
      {/* Background Video */}
      <video
        autoPlay
        loop
        muted
        playsInline
        poster="/chill-hero-poster.jpg"
        className="fixed inset-0 w-full h-full object-cover -z-10"
      >
        <source src="/chill-hero.mp4" type="video/mp4" />
      </video>

      {/* Overlay */}
      <div className="fixed inset-0 bg-black/40 -z-10" />

      <div className="relative pt-8 sm:pt-12 md:pt-16 pb-6 sm:pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto relative z-10">
        {/* Hero Section */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Link href="/" className="inline-flex items-center text-white hover:text-gray-200 transition-colors">
              <ArrowLeft size={20} className="sm:w-6 sm:h-6" />
            </Link>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white">{event.name}</h1>
          </div>

          <div className="flex flex-wrap gap-3 sm:gap-4 text-sm sm:text-base text-white/80 mb-6">
            {event.date && (
              <div className="flex items-center space-x-2">
                <Calendar size={16} className="sm:w-5 sm:h-5" />
                <span>{formatDate(event.date)}</span>
              </div>
            )}
            {event.location && (
              <div className="flex items-center space-x-2">
                <MapPin size={16} className="sm:w-5 sm:h-5" />
                <span>{event.location}</span>
              </div>
            )}
          </div>
        </div>

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
          {hasApplied ? (
            <Link href={`/events/${params.slug}/apply`}>
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
                onMouseEnter={() => {
                  router.prefetch(`/events/${params.slug}/apply`)
                  prefetchApplyData()
                }}
              >
                Proceed to questions
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
        </div>
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


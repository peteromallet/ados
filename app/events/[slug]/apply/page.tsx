'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { EventWithDetails, Invite } from '@/lib/types'
import { Questionnaire } from '@/components/Questionnaire'
import { AuthModal } from '@/components/AuthModal'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function ApplyPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [event, setEvent] = useState<EventWithDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [invite, setInvite] = useState<Invite | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    async function checkAuthAndLoadEvent() {
      try {
        // Check for invite code in URL or localStorage
        let inviteCode = searchParams.get('invite')
        
        if (!inviteCode) {
          // Try to load from localStorage
          const storedInvite = localStorage.getItem('invite_code')
          if (storedInvite) {
            const { code, name } = JSON.parse(storedInvite)
            inviteCode = code
            setInvite({ code, name } as any)
          }
        }
        
        // Run auth check and invite check in parallel
        const [userResult, inviteResult] = await Promise.all([
          supabase.auth.getUser(),
          inviteCode 
            ? supabase.from('invites').select('*').eq('code', inviteCode).single()
            : Promise.resolve({ data: null, error: null })
        ])

        const { data: { user } } = userResult
        
        // Handle invite validation
        if (inviteCode) {
          const { data: inviteData, error: inviteError } = inviteResult
          if (!inviteError && inviteData) {
            // Check if invite has uses left
            if (inviteData.used_count < inviteData.max_uses) {
              setInvite(inviteData)
              // Persist to localStorage
              localStorage.setItem('invite_code', JSON.stringify({
                code: inviteData.code,
                name: inviteData.name
              }))
            } else {
              setError('This invite code has been used up')
              localStorage.removeItem('invite_code')
              setLoading(false)
              return
            }
          } else {
            setError('Invalid invite code')
            localStorage.removeItem('invite_code')
            setLoading(false)
            return
          }
        }
        
        if (!user) {
          setShowAuthModal(true)
          setLoading(false)
          return
        }

        setIsAuthenticated(true)

        // Get event data with questions in a single query using join
        const { data: eventData, error: eventError } = await supabase
          .from('events')
          .select(`
            *,
            questions (*)
          `)
          .eq('slug', params.slug as string)
          .order('order_index', { foreignTable: 'questions', ascending: true })
          .single()

        if (eventError) throw eventError

        // Check if user has existing answers and load them
        const { data: existingAttendance } = await supabase
          .from('attendance')
          .select(`
            id,
            answers (question_id, answer_text)
          `)
          .eq('user_id', user.id)
          .eq('event_id', eventData.id)
          .single()

        if (existingAttendance) {
          setIsUpdating(true)
          
          // Pre-populate localStorage with existing answers
          if (existingAttendance.answers && existingAttendance.answers.length > 0) {
            const answersMap: Record<string, string> = {}
            existingAttendance.answers.forEach((answer: any) => {
              answersMap[answer.question_id] = answer.answer_text
            })
            
            // Save to localStorage so the questionnaire component can load them
            const storageKey = `questionnaire_${eventData.id}`
            localStorage.setItem(storageKey, JSON.stringify(answersMap))
          }
        }
        
        setEvent(eventData as EventWithDetails)
      } catch (err) {
        console.error('Error loading event:', err)
        setError('Failed to load event')
      } finally {
        setLoading(false)
      }
    }

    checkAuthAndLoadEvent()
  }, [params.slug, router, supabase, searchParams])

  const handleSubmit = async (answers: { question_id: string; answer_text: string }[]) => {
    // Prevent duplicate submissions
    if (isSubmitting) {
      console.log('⚠️ Submission already in progress, ignoring duplicate click')
      return
    }

    setIsSubmitting(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user || !event) {
        throw new Error('User not authenticated or event not loaded')
      }

      // Check if attendance record already exists
      const { data: existingAttendance } = await supabase
        .from('attendance')
        .select('id')
        .eq('user_id', user.id)
        .eq('event_id', event.id)
        .single()

      let attendanceId: string

      if (existingAttendance) {
        // Update existing submission
        attendanceId = existingAttendance.id

        // Delete old answers
        await supabase
          .from('answers')
          .delete()
          .eq('attendance_id', attendanceId)

        // Insert new answers
        const answerInserts = answers.map(answer => ({
          attendance_id: attendanceId,
          question_id: answer.question_id,
          answer_text: answer.answer_text,
        }))

        const { error: answersError } = await supabase
          .from('answers')
          .insert(answerInserts)

        if (answersError) throw answersError
      } else {
        // Create new attendance record
        // Auto-approve if they used an invite code
        const { data: attendance, error: attendanceError } = await supabase
          .from('attendance')
          .insert({
            user_id: user.id,
            event_id: event.id,
            status: invite ? 'approved' : 'pending',
            invite_code: invite?.code || null,
          })
          .select()
          .single()

        if (attendanceError) throw attendanceError
        attendanceId = attendance.id

        // Create answer records
        const answerInserts = answers.map(answer => ({
          attendance_id: attendanceId,
          question_id: answer.question_id,
          answer_text: answer.answer_text,
        }))

        const { error: answersError } = await supabase
          .from('answers')
          .insert(answerInserts)

        if (answersError) throw answersError

        // Increment invite usage if an invite was used
        if (invite) {
          await supabase
            .from('invites')
            .update({ used_count: invite.used_count + 1 })
            .eq('code', invite.code)
          
          // Clear invite from localStorage after successful submission
          localStorage.removeItem('invite_code')
        }
      }

      // Redirect back to event page with success message
      router.push(`/events/${params.slug}?success=true`)
    } catch (err) {
      console.error('Error submitting application:', err)
      throw err
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => router.push(`/events/${params.slug}`)}
        redirectTo={`/events/${params.slug}/apply`}
      />
      
      <div className="relative min-h-screen overflow-hidden">
        {/* Video Background - always show */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute top-0 left-0 w-full h-full object-cover"
        >
          <source src="/chill-hero.mp4" type="video/mp4" />
        </video>
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/40" />

        {loading && !showAuthModal && (
          <div className="relative z-10 min-h-screen pt-24 flex items-center justify-center">
            <p className="text-xl text-white">Loading...</p>
          </div>
        )}

        {!loading && !showAuthModal && error && (
          <div className="relative z-10 min-h-screen pt-24 flex items-center justify-center">
            <p className="text-xl text-red-500">{error}</p>
          </div>
        )}

        {!loading && !showAuthModal && !error && event && !event.questions?.length && (
          <div className="relative z-10 min-h-screen pt-24 flex items-center justify-center">
            <p className="text-xl text-white">No questions configured for this event</p>
          </div>
        )}
        
        {!loading && !showAuthModal && isAuthenticated && event && event.questions && event.questions.length > 0 && (
          <>
          
          {/* Content */}
          <div className="relative z-10 pt-8 sm:pt-16 md:pt-24">
            <div className="flex items-center justify-center mb-4 gap-4">
              <Link 
                href={`/events/${params.slug}`}
                className="text-white/80 hover:text-white transition-colors"
              >
                <ArrowLeft size={32} />
              </Link>
              <h1 className="text-4xl font-bold text-white">{event.name}</h1>
            </div>
            
            <Questionnaire 
              questions={event.questions} 
              onSubmit={handleSubmit} 
              isUpdating={isUpdating}
              inviteName={invite?.name}
            />
          </div>
          </>
        )}
      </div>
    </>
  )
}


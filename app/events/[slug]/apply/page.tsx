'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { EventWithDetails } from '@/lib/types'
import { Questionnaire } from '@/components/Questionnaire'
import { AuthModal } from '@/components/AuthModal'

export default function ApplyPage() {
  const params = useParams()
  const router = useRouter()
  const [event, setEvent] = useState<EventWithDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    async function checkAuthAndLoadEvent() {
      try {
        // Check authentication first
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          setShowAuthModal(true)
          setLoading(false)
          return
        }

        setIsAuthenticated(true)

        // Get event data
        const { data: eventData, error: eventError } = await supabase
          .from('events')
          .select('*')
          .eq('slug', params.slug as string)
          .single()

        if (eventError) throw eventError

        // Get questions
        const { data: questions, error: questionsError } = await supabase
          .from('questions')
          .select('*')
          .eq('event_id', eventData.id)
          .order('order_index', { ascending: true })

        if (questionsError) throw questionsError

        // Check if user already applied
        const { data: existingAttendance } = await supabase
          .from('attendance')
          .select('*')
          .eq('event_id', eventData.id)
          .eq('user_id', user.id)
          .single()

        if (existingAttendance) {
          router.push(`/events/${params.slug}`)
          return
        }

        setEvent({ ...eventData, questions: questions || [] })
      } catch (err) {
        console.error('Error loading event:', err)
        setError('Failed to load event')
      } finally {
        setLoading(false)
      }
    }

    checkAuthAndLoadEvent()
  }, [params.slug, router, supabase])

  const handleSubmit = async (answers: { question_id: string; answer_text: string }[]) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user || !event) {
        throw new Error('User not authenticated or event not loaded')
      }

      // Create attendance record
      const { data: attendance, error: attendanceError } = await supabase
        .from('attendance')
        .insert({
          user_id: user.id,
          event_id: event.id,
          status: 'pending',
        })
        .select()
        .single()

      if (attendanceError) throw attendanceError

      // Create answer records
      const answerInserts = answers.map(answer => ({
        attendance_id: attendance.id,
        question_id: answer.question_id,
        answer_text: answer.answer_text,
      }))

      const { error: answersError } = await supabase
        .from('answers')
        .insert(answerInserts)

      if (answersError) throw answersError

      // Redirect to success page
      router.push('/success')
    } catch (err) {
      console.error('Error submitting application:', err)
      throw err
    }
  }

  return (
    <>
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => router.push(`/events/${params.slug}`)}
        redirectTo={`/events/${params.slug}/apply`}
      />
      
      {loading && !showAuthModal && (
        <div className="min-h-screen pt-24 flex items-center justify-center">
          <p className="text-xl text-text-light">Loading...</p>
        </div>
      )}

      {!loading && !showAuthModal && error && (
        <div className="min-h-screen pt-24 flex items-center justify-center">
          <p className="text-xl text-red-500">{error}</p>
        </div>
      )}

      {!loading && !showAuthModal && !error && event && !event.questions?.length && (
        <div className="min-h-screen pt-24 flex items-center justify-center">
          <p className="text-xl text-text-light">No questions configured for this event</p>
        </div>
      )}
      
      {!loading && !showAuthModal && isAuthenticated && event && event.questions && event.questions.length > 0 && (
        <div className="min-h-screen pt-24 bg-background">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-text-dark mb-2">Apply to {event.name}</h1>
            <p className="text-text-light">Please answer the following questions</p>
          </div>
          
          <Questionnaire questions={event.questions} onSubmit={handleSubmit} />
        </div>
      )}
    </>
  )
}


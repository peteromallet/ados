import { createClient } from '@/lib/supabase/server'
import { Event, EventWithDetails } from '@/lib/types'

export async function getActiveEvents(): Promise<Event[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('is_active', true)
    .order('date', { ascending: true })
  
  if (error) throw error
  return data || []
}

export async function getEventBySlug(slug: string): Promise<EventWithDetails | null> {
  const supabase = await createClient()
  
  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('*')
    .eq('slug', slug)
    .single()
  
  if (eventError) throw eventError
  if (!event) return null
  
  // Get questions for this event
  const { data: questions, error: questionsError } = await supabase
    .from('questions')
    .select('*')
    .eq('event_id', event.id)
    .order('order_index', { ascending: true })
  
  if (questionsError) throw questionsError
  
  // Get attendance count
  const { count } = await supabase
    .from('attendance')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', event.id)
  
  // Check if current user has applied
  const { data: { user } } = await supabase.auth.getUser()
  let userAttendance = null
  
  if (user) {
    const { data } = await supabase
      .from('attendance')
      .select('*')
      .eq('event_id', event.id)
      .eq('user_id', user.id)
      .single()
    
    userAttendance = data
  }
  
  return {
    ...event,
    questions: questions || [],
    attendance_count: count || 0,
    user_attendance: userAttendance,
  }
}


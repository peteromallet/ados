import { createClient } from '@/lib/supabase/server'
import { AttendanceWithEvent, AttendanceWithAnswers } from '@/lib/types'

export async function getUserAttendance(userId: string): Promise<AttendanceWithEvent[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('attendance')
    .select(`
      *,
      event:events(*)
    `)
    .eq('user_id', userId)
    .order('applied_at', { ascending: false })
  
  if (error) throw error
  return data || []
}

export async function getAttendanceWithAnswers(
  attendanceId: string
): Promise<AttendanceWithAnswers | null> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('attendance')
    .select(`
      *,
      answers(*),
      event:events(*)
    `)
    .eq('id', attendanceId)
    .single()
  
  if (error) throw error
  return data
}

export async function createAttendance(
  userId: string,
  eventId: string,
  answers: { question_id: string; answer_text: string }[]
) {
  const supabase = await createClient()
  
  // Create attendance record
  const { data: attendance, error: attendanceError } = await supabase
    .from('attendance')
    .insert({
      user_id: userId,
      event_id: eventId,
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
  
  return attendance
}


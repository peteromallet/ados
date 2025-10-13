import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import ApplyClient from './ApplyClient'
import type { EventWithDetails } from '@/lib/types'

interface ApplyPageProps {
  params: {
    slug: string
  }
}

async function getEventWithQuestions(slug: string): Promise<EventWithDetails | null> {
    const supabase = await createClient()
    const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select(`
            *,
            questions (*)
        `)
        .eq('slug', slug)
        .order('order_index', { foreignTable: 'questions', ascending: true })
        .single()
    
    if (eventError) {
        console.error('Error fetching event with questions:', eventError)
        return null
    }

    return eventData
}

export default async function ApplyPage({ params }: ApplyPageProps) {
  const event = await getEventWithQuestions(params.slug)

  if (!event) {
    notFound()
  }

  return <ApplyClient event={event} />
}

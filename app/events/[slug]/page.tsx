import { formatDate } from '@/lib/utils'
import { Calendar, MapPin, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { EventDetailClient } from './EventDetailClient'

// Use ISR for better performance - page is cached and revalidated every 60 seconds
export const revalidate = 60

interface EventDetailPageProps {
  params: {
    slug: string
  }
}

export default async function EventDetailPage({ params }: EventDetailPageProps) {
  // Use direct Supabase client for public data (no cookies needed, faster)
  const { createClient } = await import('@supabase/supabase-js')
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  
  // Only fetch fields we actually use for maximum speed
  const { data: event, error } = await supabase
    .from('events')
    .select('id, slug, name, date, location')
    .eq('slug', params.slug)
    .single()

  if (error || !event) {
    return (
      <div className="h-screen flex items-center justify-center bg-white px-4">
        <div className="text-center">
          <p className="text-lg sm:text-xl text-red-500 mb-2">
            {error?.message || 'Event not found'}
          </p>
          <p className="text-xs sm:text-sm text-gray-500 mb-4">Slug: {params.slug}</p>
          <Link href="/" className="text-sm sm:text-base text-blue-500 hover:underline">
            Return to home
          </Link>
        </div>
      </div>
    )
  }

  // User-specific data is now fetched on the client for better caching
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

          {/* Client Component for Interactive Content */}
          <EventDetailClient 
            event={event}
          />
        </div>
      </div>
    </>
  )
}

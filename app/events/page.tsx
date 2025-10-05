import { getActiveEvents } from '@/lib/database/events'
import { EventCard } from '@/components/EventCard'

export const dynamic = 'force-dynamic'

export default async function EventsPage() {
  const events = await getActiveEvents()

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-text-dark mb-4">Upcoming Events</h1>
          <p className="text-xl text-text-light">
            Choose an event to apply for
          </p>
        </div>

        {events.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-xl text-text-light">
              No active events at the moment. Check back soon!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}


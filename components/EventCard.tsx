import Link from 'next/link'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Event } from '@/lib/types'
import { formatDate } from '@/lib/utils'
import { Calendar, MapPin } from 'lucide-react'

interface EventCardProps {
  event: Event
}

export function EventCard({ event }: EventCardProps) {
  return (
    <Card className="hover:shadow-xl transition-shadow duration-300">
      {event.banner_image_url && (
        <div className="h-48 bg-gradient-to-br from-accent-blue via-accent-pink to-accent-yellow" />
      )}
      
      <CardHeader>
        <h3 className="text-2xl font-bold text-text-dark mb-2">{event.name}</h3>
        
        <div className="flex flex-col space-y-2 text-sm text-text-light">
          {event.date && (
            <div className="flex items-center space-x-2">
              <Calendar size={16} />
              <span>{formatDate(event.date)}</span>
            </div>
          )}
          {event.location && (
            <div className="flex items-center space-x-2">
              <MapPin size={16} />
              <span>{event.location}</span>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        <p className="text-text-light line-clamp-3">{event.description}</p>
      </CardContent>
      
      <CardFooter>
        <Link href={`/events/${event.slug}`} className="w-full">
          <Button variant="primary" className="w-full">
            View Details
          </Button>
        </Link>
      </CardFooter>
    </Card>
  )
}


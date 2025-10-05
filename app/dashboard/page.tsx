import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { formatDateTime } from '@/lib/utils'
import { Calendar, CheckCircle, Clock, XCircle } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth/signin?redirect=/dashboard')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const { data: attendance } = await supabase
    .from('attendance')
    .select(`
      *,
      event:events(*)
    `)
    .eq('user_id', user.id)
    .order('applied_at', { ascending: false })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="text-green-500" size={20} />
      case 'rejected':
        return <XCircle className="text-red-500" size={20} />
      case 'pending':
        return <Clock className="text-yellow-500" size={20} />
      default:
        return <Clock className="text-gray-500" size={20} />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <div className="min-h-screen pt-8 sm:pt-16 md:pt-24 pb-12 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-6xl mx-auto">
        {/* Profile Section */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-text-dark mb-2">My Dashboard</h1>
          <p className="text-text-light">
            Welcome back, {profile?.discord_username || 'User'}!
          </p>
        </div>

        {/* Applications Section */}
        <div>
          <h2 className="text-2xl font-bold text-text-dark mb-6">My Applications</h2>
          
          {!attendance || attendance.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-xl text-text-light mb-6">
                  You haven't applied to any events yet
                </p>
                <Link href="/events">
                  <Button>Browse Events</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {attendance.map((item: any) => (
                <Card key={item.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-2xl font-bold text-text-dark mb-2">
                          {item.event.name}
                        </h3>
                        <div className="flex items-center space-x-2 text-text-light text-sm">
                          <Calendar size={16} />
                          <span>
                            Applied on {formatDateTime(item.applied_at)}
                          </span>
                        </div>
                      </div>
                      <div className={`flex items-center space-x-2 px-4 py-2 rounded-full border-2 ${getStatusColor(item.status)}`}>
                        {getStatusIcon(item.status)}
                        <span className="font-semibold capitalize">{item.status}</span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-text-light mb-4">{item.event.description}</p>
                    {item.event.date && (
                      <div className="flex items-center space-x-2 text-text-light text-sm">
                        <Calendar size={16} />
                        <span>Event Date: {formatDateTime(item.event.date)}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


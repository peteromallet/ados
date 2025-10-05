import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { CheckCircle } from 'lucide-react'

export default function SuccessPage() {
  return (
    <div className="min-h-screen pt-24 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full text-center">
        <div className="bg-white rounded-lg shadow-xl p-12">
          <div className="flex justify-center mb-6">
            <CheckCircle className="text-green-500" size={80} />
          </div>
          
          <h1 className="text-4xl font-bold text-text-dark mb-4">
            Application Submitted!
          </h1>
          
          <p className="text-xl text-text-light mb-8">
            Thank you for applying. We've received your application and will review it shortly.
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <h2 className="text-lg font-semibold text-blue-900 mb-2">
              What happens next?
            </h2>
            <ul className="text-left text-blue-800 space-y-2">
              <li>• Our team will review your application</li>
              <li>• You'll receive an email with the decision</li>
              <li>• Check your dashboard for application status</li>
              <li>• If approved, you'll receive event details</li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/dashboard">
              <Button size="lg">View My Applications</Button>
            </Link>
            <Link href="/events">
              <Button size="lg" variant="secondary">
                Browse More Events
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}


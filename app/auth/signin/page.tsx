import { SignInButton } from '@/components/SignInButton'

export default function SignInPage({
  searchParams,
}: {
  searchParams: { redirect?: string }
}) {
  return (
    <div className="min-h-screen pt-24 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-text-dark mb-4">Welcome to ADOS</h1>
          <p className="text-text-light">
            Sign in with Discord to apply for events
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <SignInButton redirectTo={searchParams.redirect} />
        </div>

        <p className="text-center text-sm text-text-light mt-6">
          By signing in, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  )
}


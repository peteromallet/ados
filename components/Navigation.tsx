'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/hooks/useAuth'
import { LogOut, User } from 'lucide-react'

export function Navigation() {
  const { user, profile, loading, signOut } = useAuth()

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold">ADOS</span>
          </Link>

          <div className="flex items-center space-x-6">
            <Link href="/events" className="text-text-dark hover:text-primary transition-colors">
              Events
            </Link>

            {!loading && (
              <>
                {user ? (
                  <>
                    <Link href="/dashboard" className="text-text-dark hover:text-primary transition-colors">
                      Dashboard
                    </Link>
                    <div className="flex items-center space-x-3">
                      {profile?.avatar_url && (
                        <Image
                          src={profile.avatar_url}
                          alt={profile.discord_username || 'User'}
                          width={32}
                          height={32}
                          className="rounded-full"
                        />
                      )}
                      <button
                        onClick={signOut}
                        className="flex items-center space-x-1 text-text-dark hover:text-primary transition-colors"
                      >
                        <LogOut size={18} />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </>
                ) : (
                  <Link
                    href="/auth/signin"
                    className="flex items-center space-x-1 text-text-dark hover:text-primary transition-colors"
                  >
                    <User size={18} />
                    <span>Sign In</span>
                  </Link>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}


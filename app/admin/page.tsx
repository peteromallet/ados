'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ArrowLeft, Copy, Check } from 'lucide-react'
import Link from 'next/link'

export default function AdminPage() {
  const router = useRouter()
  const supabase = createClient()
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [customCode, setCustomCode] = useState('')
  const [maxUses, setMaxUses] = useState('5')
  const [generatedUrl, setGeneratedUrl] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')
  const [invites, setInvites] = useState<any[]>([])
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    async function checkAdmin() {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profile?.role !== 'admin') {
        router.push('/')
        return
      }

      setIsAdmin(true)
      setLoading(false)
      
      // Load existing invites
      loadInvites()
    }

    checkAdmin()
  }, [router, supabase])

  const loadInvites = async () => {
    const { data, error } = await supabase
      .from('invites')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (!error && data) {
      setInvites(data)
    }
  }

  const generateCode = () => {
    // Generate a random code if custom code is empty
    const randomCode = name.toUpperCase().replace(/\s+/g, '') + Math.random().toString(36).substring(2, 6).toUpperCase()
    return randomCode
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      const code = customCode.trim() || generateCode()
      const uses = parseInt(maxUses)

      if (!name.trim()) {
        setError('Name is required')
        setIsSubmitting(false)
        return
      }

      if (uses < 1) {
        setError('Number of uses must be at least 1')
        setIsSubmitting(false)
        return
      }

      // Create the invite
      const { error: inviteError } = await supabase
        .from('invites')
        .insert({
          code: code,
          name: name.trim(),
          max_uses: uses,
          used_count: 0,
        })

      if (inviteError) {
        if (inviteError.message.includes('duplicate')) {
          setError('This invite code already exists. Try a different code.')
        } else {
          setError(inviteError.message)
        }
        setIsSubmitting(false)
        return
      }

      // Generate the shareable URL
      const url = `${window.location.origin}/?invite=${code}`
      setGeneratedUrl(url)
      
      // Reload invites to show the new one at the top
      await loadInvites()
      
      // Reset form
      setName('')
      setCustomCode('')
      setMaxUses('5')
    } catch (err) {
      console.error('Error creating invite:', err)
      setError('Failed to create invite')
    } finally {
      setIsSubmitting(false)
    }
  }

  const copyToClipboard = async (url?: string, id?: string) => {
    try {
      const textToCopy = url || generatedUrl
      await navigator.clipboard.writeText(textToCopy)
      
      if (id) {
        setCopiedId(id)
        setTimeout(() => setCopiedId(null), 2000)
      } else {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl">Loading...</p>
      </div>
    )
  }

  if (!isAdmin) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/" className="text-gray-600 hover:text-gray-900">
            <ArrowLeft size={24} />
          </Link>
          <h1 className="text-4xl font-bold text-gray-900">Admin - Create Invite</h1>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Person's Name *
              </label>
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nathan Shipley"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Custom Invite Code (optional)
              </label>
              <Input
                type="text"
                value={customCode}
                onChange={(e) => setCustomCode(e.target.value.toUpperCase())}
                placeholder="NATHAN2025 (leave empty for auto-generated)"
              />
              <p className="text-xs text-gray-500 mt-1">
                If empty, a code will be auto-generated
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Number of Uses *
              </label>
              <Input
                type="number"
                value={maxUses}
                onChange={(e) => setMaxUses(e.target.value)}
                min="1"
                required
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={isSubmitting}
              size="lg"
              className="w-full"
            >
              {isSubmitting ? 'Creating...' : 'Create Invite'}
            </Button>
          </form>

          {generatedUrl && (
            <div className="mt-8 p-6 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="text-lg font-semibold text-green-900 mb-3">
                ✓ Invite Created!
              </h3>
              <p className="text-sm text-green-800 mb-3">
                Share this link with the person:
              </p>
              <div className="flex gap-2">
                <Input
                  type="text"
                  value={generatedUrl}
                  readOnly
                  className="flex-1"
                />
                <Button
                  onClick={copyToClipboard}
                  variant="secondary"
                  className="flex items-center gap-2"
                >
                  {copied ? (
                    <>
                      <Check size={16} />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy size={16} />
                      Copy
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* List of existing invites */}
        <div className="mt-8 bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Existing Invites</h2>
          
          {invites.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No invites created yet</p>
          ) : (
            <div className="space-y-4">
              {invites.map((invite) => {
                const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/?invite=${invite.code}`
                const usagePercent = (invite.used_count / invite.max_uses) * 100
                
                return (
                  <div key={invite.id} className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-gray-900 text-lg">{invite.name}</h3>
                        <p className="text-sm text-gray-500 font-mono">{invite.code}</p>
                      </div>
                      <div className="text-right">
                        <span className={`text-sm font-semibold ${invite.used_count >= invite.max_uses ? 'text-red-600' : 'text-green-600'}`}>
                          {invite.used_count} / {invite.max_uses} uses
                        </span>
                        <div className="w-32 h-2 bg-gray-200 rounded-full mt-1 overflow-hidden">
                          <div 
                            className={`h-full transition-all ${invite.used_count >= invite.max_uses ? 'bg-red-500' : 'bg-green-500'}`}
                            style={{ width: `${Math.min(usagePercent, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 mt-3">
                      <Input
                        type="text"
                        value={url}
                        readOnly
                        className="flex-1 text-sm"
                      />
                      <Button
                        onClick={() => copyToClipboard(url, invite.id)}
                        variant="secondary"
                        className="flex items-center gap-2"
                      >
                        {copiedId === invite.id ? (
                          <>
                            <Check size={16} />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy size={16} />
                            Copy
                          </>
                        )}
                      </Button>
                    </div>
                    
                    <p className="text-xs text-gray-400 mt-2">
                      Created {new Date(invite.created_at).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric', 
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


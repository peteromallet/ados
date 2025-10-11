import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const redirect = requestUrl.searchParams.get('redirect') || '/events'
  
  // Use the app URL from env or fall back to request origin
  const origin = process.env.NEXT_PUBLIC_APP_URL || requestUrl.origin
  console.log('🔧 Auth Callback - NEXT_PUBLIC_APP_URL:', process.env.NEXT_PUBLIC_APP_URL)
  console.log('🔧 Auth Callback - Request origin:', requestUrl.origin)
  console.log('🔧 Auth Callback - Using origin:', origin)

  if (code) {
    const supabase = await createClient()
    
    // Exchange code for session
    const { data: { user }, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      return NextResponse.redirect(`${origin}/auth/signin?error=auth_failed`)
    }

    if (user) {
      // Create or update profile
      const discordUser = user.user_metadata
      
      await supabase.from('profiles').upsert({
        id: user.id,
        discord_username: discordUser.full_name || discordUser.name,
        discord_id: discordUser.provider_id,
        avatar_url: discordUser.avatar_url,
        email: user.email,
        updated_at: new Date().toISOString(),
      })
    }

    return NextResponse.redirect(`${origin}${redirect}`)
  }

  return NextResponse.redirect(`${origin}/auth/signin`)
}


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
      
      // Debug: Log all available Discord data to see what fields we have
      console.log('🔍 Discord user_metadata:', JSON.stringify(discordUser, null, 2))
      console.log('🔍 Available fields:', Object.keys(discordUser))
      
      // Discord fields explained:
      // - global_name: Display name (e.g., "Nathan Shipley", "Deke")
      // - name: The actual Discord handle/username (e.g., "nathanshipley", "deke")
      // - full_name: Usually same as global_name
      
      // Display name - what shows prominently
      const displayName = discordUser.global_name || discordUser.custom_claims?.global_name || discordUser.full_name || discordUser.name
      
      // Handle - the actual @username (no @ symbol in the data)
      // The 'name' field is the unique Discord username
      const handle = discordUser.name || discordUser.username || discordUser.user_name
      
      console.log('📝 Display name (global_name):', discordUser.global_name)
      console.log('📝 Handle (name):', discordUser.name)
      console.log('📝 Storing display name:', displayName)
      console.log('📝 Storing handle:', handle)
      
      await supabase.from('profiles').upsert({
        id: user.id,
        discord_username: displayName,  // Display name (e.g., "Nathan Shipley")
        discord_handle: handle,          // Actual handle (e.g., "nathanshipley")
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


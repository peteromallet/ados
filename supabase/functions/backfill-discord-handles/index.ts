import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4'

const DISCORD_BOT_TOKEN = Deno.env.get('DISCORD_BOT_TOKEN')

Deno.serve(async (req) => {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Check for authorization (optional: add a secret key check)
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  if (!DISCORD_BOT_TOKEN) {
    return new Response(
      JSON.stringify({ error: 'Discord bot token not configured' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  try {
    console.log('🚀 Starting Discord handle backfill...')

    // Get all profiles with discord_id
    const { data: profiles, error } = await supabaseClient
      .from('profiles')
      .select('id, discord_username, discord_handle, discord_id, email')
      .not('discord_id', 'is', null)

    if (error) {
      console.error('Error fetching profiles:', error)
      return new Response(JSON.stringify({ error: 'Failed to fetch profiles' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    console.log(`Found ${profiles.length} profiles with Discord IDs`)

    // Filter profiles that need updating
    const needsUpdate = profiles.filter(
      (p) => !p.discord_handle || p.discord_handle === p.discord_username
    )

    console.log(`${needsUpdate.length} profiles need handle updates`)

    const results = {
      total: needsUpdate.length,
      success: 0,
      errors: 0,
      skipped: 0,
      details: [] as any[],
    }

    // Process each profile
    for (let i = 0; i < needsUpdate.length; i++) {
      const profile = needsUpdate[i]
      console.log(
        `[${i + 1}/${needsUpdate.length}] Processing ${profile.email || profile.discord_username}...`
      )

      try {
        // Fetch from Discord API
        const discordResponse = await fetch(
          `https://discord.com/api/v10/users/${profile.discord_id}`,
          {
            headers: {
              Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
              'Content-Type': 'application/json',
            },
          }
        )

        if (!discordResponse.ok) {
          const errorText = await discordResponse.text()
          console.error(`Discord API error for ${profile.discord_id}:`, errorText)
          results.errors++
          results.details.push({
            email: profile.email,
            discord_id: profile.discord_id,
            status: 'error',
            message: `Discord API error: ${errorText}`,
          })
          continue
        }

        const discordUser = await discordResponse.json()

        // Discord fields:
        // - username: The actual handle (e.g., "nathanshipley")
        // - global_name: Display name (e.g., "Nathan Shipley")
        const handle = discordUser.username
        const displayName = discordUser.global_name || discordUser.username

        console.log(`   Display: "${displayName}" | Handle: "@${handle}"`)

        // Update the profile
        const { error: updateError } = await supabaseClient
          .from('profiles')
          .update({
            discord_username: displayName,
            discord_handle: handle,
          })
          .eq('id', profile.id)

        if (updateError) {
          console.error(`Error updating profile:`, updateError.message)
          results.errors++
          results.details.push({
            email: profile.email,
            discord_id: profile.discord_id,
            status: 'error',
            message: updateError.message,
          })
        } else {
          console.log(`   ✅ Updated`)
          results.success++
          results.details.push({
            email: profile.email,
            discord_id: profile.discord_id,
            display_name: displayName,
            handle: handle,
            status: 'success',
          })
        }

        // Rate limit: Wait 100ms between requests (10 requests per second)
        await new Promise((resolve) => setTimeout(resolve, 100))
      } catch (error) {
        console.error(`Error processing ${profile.email}:`, error)
        results.errors++
        results.details.push({
          email: profile.email,
          discord_id: profile.discord_id,
          status: 'error',
          message: error.message,
        })
      }
    }

    console.log('📈 Summary:', results)

    return new Response(
      JSON.stringify({
        message: 'Backfill complete',
        results,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Backfill failed:', error)
    return new Response(
      JSON.stringify({
        error: 'Backfill failed',
        message: error.message,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
})


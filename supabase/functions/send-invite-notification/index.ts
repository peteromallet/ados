import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
const DISCORD_BOT_TOKEN = Deno.env.get('DISCORD_BOT_TOKEN')

// Helper function to find Discord user by username
async function findDiscordUser(username: string) {
  if (!DISCORD_BOT_TOKEN) {
    return { success: false, error: 'No bot token' }
  }

  try {
    // Note: Discord doesn't provide a direct username search API
    // The bot must share a server with the user to find them
    // This is a limitation - we'll need the discord_id instead of username
    // For now, we'll return an error suggesting to use discord_id
    
    return { 
      success: false, 
      error: 'Discord username lookup requires shared server. Please use discord_id instead.' 
    }
  } catch (error) {
    console.error('Discord user lookup error:', error)
    return { success: false, error: error.message }
  }
}

// Helper function to send Discord DM
async function sendDiscordDM(discordId: string, username: string, inviteCode: string, inviteName: string) {
  if (!DISCORD_BOT_TOKEN) {
    console.warn('Discord bot token not configured, skipping Discord notification')
    return { success: false, error: 'No bot token' }
  }

  try {
    // First, create a DM channel with the user
    const dmChannelResponse = await fetch('https://discord.com/api/v10/users/@me/channels', {
      method: 'POST',
      headers: {
        'Authorization': `Bot ${DISCORD_BOT_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        recipient_id: discordId,
      }),
    })

    if (!dmChannelResponse.ok) {
      const error = await dmChannelResponse.text()
      console.error('Failed to create DM channel:', error)
      return { success: false, error: 'Failed to create DM channel' }
    }

    const dmChannel = await dmChannelResponse.json()

    // Send the message to the DM channel
    const messageResponse = await fetch(`https://discord.com/api/v10/channels/${dmChannel.id}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bot ${DISCORD_BOT_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: `Hey ${username}! 🎉\n\n**${inviteName}** has invited you to [ADOS LA](https://ados.events/)!\n\nYour exclusive invite code: **${inviteCode}**\n\n📍 Location: Mack Sennett studios, 1215 Bates Ave, Los Angeles, CA 90029\n📅 Date: November 7th\n⏰ Morning event: 11am-5pm (panels, roundtables, hangouts)\n⏰ Evening event: 7pm-11pm (show, drinks, frivolities)\n\n**To RSVP:**\n1. Visit https://ados.events/\n2. Sign in and apply for the event\n3. Use your invite code: **${inviteCode}**\n\nSee you there! ✨`,
      }),
    })

    if (!messageResponse.ok) {
      const error = await messageResponse.text()
      console.error('Failed to send Discord message:', error)
      return { success: false, error: 'Failed to send message' }
    }

    return { success: true, data: await messageResponse.json() }
  } catch (error) {
    console.error('Discord DM error:', error)
    return { success: false, error: error.message }
  }
}

serve(async (req) => {
  try {
    const { invite_id } = await req.json()

    if (!invite_id) {
      return new Response(
        JSON.stringify({ error: 'invite_id is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Initialize Supabase client with service role
    const supabase = createClient(
      SUPABASE_URL!,
      SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Query the database to validate the invite record
    const { data: invite, error: queryError } = await supabase
      .from('invites')
      .select('id, code, name, discord_id, invite_sent_at')
      .eq('id', invite_id)
      .single()

    if (queryError || !invite) {
      console.error('Invite record not found:', queryError)
      return new Response(
        JSON.stringify({ error: 'Invite record not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Check if notification was already sent
    if (invite.invite_sent_at) {
      console.warn(`Invite notification already sent for invite_id: ${invite_id}`)
      return new Response(
        JSON.stringify({ error: 'Invite notification already sent', sent_at: invite.invite_sent_at }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Validate discord_id exists
    if (!invite.discord_id) {
      console.error('No discord_id found for invite:', invite_id)
      return new Response(
        JSON.stringify({ error: 'Discord ID not set for this invite' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const discordId = invite.discord_id
    const inviteCode = invite.code
    const inviteName = invite.name

    console.log(`Sending invite notification to Discord ID ${discordId} for code: ${inviteCode}`)

    // Validate discord_id is numeric
    const isDiscordId = /^\d+$/.test(discordId)
    
    if (!isDiscordId) {
      console.error('Invalid discord_id format (must be numeric):', discordId)
      return new Response(
        JSON.stringify({ 
          error: 'Invalid discord_id format. Must be numeric. Enable Developer Mode in Discord, right-click the user, and select "Copy User ID".',
          id_provided: discordId
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Send Discord DM using the discord_id
    // We'll use "friend" as placeholder since we don't have their username yet
    const discordResult = await sendDiscordDM(discordId, 'friend', inviteCode, inviteName)
    
    if (!discordResult.success) {
      console.error('Failed to send Discord invite:', discordResult.error)
      return new Response(
        JSON.stringify({ error: 'Failed to send Discord invite', details: discordResult.error }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    console.log(`✅ Discord invite sent successfully to ${discordId}`)

    // Record that the invite was sent
    const { error: updateError } = await supabase
      .from('invites')
      .update({ invite_sent_at: new Date().toISOString() })
      .eq('id', invite_id)

    if (updateError) {
      console.warn('Failed to update invite_sent_at:', updateError)
      // Don't fail the request - invite was sent successfully
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Discord invite sent to Discord ID ${discordId}`,
        invite_id,
        code: inviteCode,
        discord_sent: true
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})


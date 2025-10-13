import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
const DISCORD_BOT_TOKEN = Deno.env.get('DISCORD_BOT_TOKEN')

// Helper function to get Discord user info
async function getDiscordUser(discordId: string) {
  if (!DISCORD_BOT_TOKEN) {
    return { success: false, error: 'No bot token' }
  }

  try {
    const userResponse = await fetch(`https://discord.com/api/v10/users/${discordId}`, {
      headers: {
        'Authorization': `Bot ${DISCORD_BOT_TOKEN}`,
      },
    })

    if (!userResponse.ok) {
      const error = await userResponse.text()
      console.error('Failed to fetch Discord user:', error)
      return { success: false, error: 'Failed to fetch user' }
    }

    const user = await userResponse.json()
    // Return display name (global_name) or fallback to username
    const displayName = user.global_name || user.username
    return { success: true, displayName, user }
  } catch (error) {
    console.error('Discord user fetch error:', error)
    return { success: false, error: error.message }
  }
}

// Helper function to send Discord DM
async function sendDiscordDM(discordId: string, displayName: string) {
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
        content: `Hey ${displayName}! 🎉\n\nBanodoco is excited to have you joining us for [ADOS LA](https://ados.events/)!\n\n📍 Location: Mack Sennett studios, 1215 Bates Ave, Los Angeles, CA 90029\n📅 Date: November 7th\n⏰ Morning event: 11am-5pm (panels, roundtables, hangouts)\n⏰ Evening event: 7pm-11pm (show, drinks, frivolities)\n\nCheck your email for calendar links and more details. See you there! ✨`,
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

// Email HTML template stored directly in the function
const EMAIL_TEMPLATE = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You're Approved for ADOS!</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #000000; min-height: 100vh;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%;">
          <tr>
            <td style="position: relative; background-image: url('https://ados.events/bg_poster.jpg'); background-size: cover; background-position: center; border-radius: 12px; overflow: hidden;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background: linear-gradient(to bottom, rgba(0,0,0,0.7), rgba(0,0,0,0.85)); padding: 60px 40px; text-align: center;">
                    <h1 style="margin: 0 0 20px 0; font-size: 48px; font-weight: 700; color: #ffffff; letter-spacing: 8px;">ADOS</h1>
                    <p style="margin: 0 0 30px 0; font-size: 16px; color: rgba(255,255,255,0.8); letter-spacing: 2px; text-transform: uppercase;">Los Angeles | November 7th</p>
                    <div style="background: rgba(255,255,255,0.05); backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 40px 30px; margin: 30px 0;">
                      <h2 style="margin: 0 0 20px 0; font-size: 32px; font-weight: 600; color: #ffffff; line-height: 1.4;">You're in! 🎉</h2>
                      <p style="margin: 0 0 25px 0; font-size: 18px; color: rgba(255,255,255,0.9); line-height: 1.6;">We're delighted to have you joining us for ADOS.</p>
                      
                      <div style="text-align: left; margin: 0 auto; max-width: 400px;">
                        <p style="margin: 0 0 15px 0; font-size: 15px; color: rgba(255,255,255,0.8); line-height: 1.6;">
                          <strong style="color: rgba(255,255,255,0.9);">Address:</strong><br>
                          Mack Sennett studios<br>
                          1215 Bates Ave, Los Angeles, CA 90029, United States
                        </p>
                        <p style="margin: 0 0 15px 0; font-size: 15px; color: rgba(255,255,255,0.8); line-height: 1.6;">
                          <strong style="color: rgba(255,255,255,0.9);">Date:</strong><br>
                          November 7
                        </p>
                        <p style="margin: 0 0 10px 0; font-size: 15px; color: rgba(255,255,255,0.8); line-height: 1.6;">
                          <strong style="color: rgba(255,255,255,0.9);">Morning event:</strong> 11-5pm
                        </p>
                        <p style="margin: 0; font-size: 15px; color: rgba(255,255,255,0.8); line-height: 1.6;">
                          <strong style="color: rgba(255,255,255,0.9);">Evening event:</strong> 7-11pm
                        </p>
                        <p style="margin: 20px 0 0 0; font-size: 14px; color: rgba(255,255,255,0.6); font-style: italic;">
                          More details soon.
                        </p>
                      </div>
                    </div>
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0 0 0;">
                      <tr>
                        <td align="center" style="text-align: center;">
                          <a href="https://calendar.google.com/calendar/render?action=TEMPLATE&text=ADOS+-+Los+Angeles&dates=20251107/20251108&details=Morning+event:+11am-5pm+(panels,+roundtables,+hangouts)%0A%0AEvening+event:+7pm-11pm+(show,+drinks,+frivolities)&location=Mack+Sennett+studios,+1215+Bates+Ave,+Los+Angeles,+CA+90029,+United+States&sf=true&output=xml" style="display: inline-block; background: linear-gradient(135deg, #ffffff 0%, #f0f0f0 100%); color: #000000; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-size: 15px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase; box-shadow: 0 4px 20px rgba(255,255,255,0.2); margin: 0 8px 10px 8px;">Google Calendar</a>
                          <a href="https://ados.events/api/calendar/ados-2025.ics" style="display: inline-block; background: linear-gradient(135deg, #ffffff 0%, #f0f0f0 100%); color: #000000; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-size: 15px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase; box-shadow: 0 4px 20px rgba(255,255,255,0.2); margin: 0 8px 10px 8px;">Apple/Outlook</a>
                        </td>
                      </tr>
                    </table>
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin: 15px 0 0 0;">
                      <tr>
                        <td align="center" style="text-align: center;">
                          <p style="margin: 0; font-size: 13px; color: rgba(255,255,255,0.6); line-height: 1.6;">
                            Add November 7th to your calendar
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 0;">
              <p style="margin: 0; text-align: center; font-size: 12px; color: rgba(255,255,255,0.3);">Questions? Reply to this email or visit <a href="https://ados.events" style="color: rgba(255,255,255,0.5); text-decoration: none;">ados.events</a></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

serve(async (req) => {
  try {
    const { attendance_id } = await req.json()

    if (!attendance_id) {
      return new Response(
        JSON.stringify({ error: 'attendance_id is required' }),
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

    // Query the database to validate the attendance record
    const { data: attendance, error: queryError } = await supabase
      .from('attendance')
      .select(`
        id,
        status,
        user_id,
        profiles!attendance_user_id_fkey(email, discord_id, discord_username),
        events(name)
      `)
      .eq('id', attendance_id)
      .single()

    if (queryError || !attendance) {
      console.error('Attendance record not found:', queryError)
      return new Response(
        JSON.stringify({ error: 'Attendance record not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Verify the attendance is actually approved
    if (attendance.status !== 'approved') {
      console.warn(`Attempted to send email for non-approved attendance: ${attendance_id} (status: ${attendance.status})`)
      return new Response(
        JSON.stringify({ error: 'Attendance is not approved', status: attendance.status }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Get validated data from database
    const email = attendance.profiles?.email
    const discordId = attendance.profiles?.discord_id
    const discordUsername = attendance.profiles?.discord_username
    const eventName = attendance.events?.name

    if (!email) {
      console.error('No email found for user:', attendance.user_id)
      return new Response(
        JSON.stringify({ error: 'User email not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Sending approval notifications to ${email} for ${eventName} (attendance_id: ${attendance_id})`)
    if (discordId) {
      console.log(`  - Will also send Discord DM to ${discordUsername} (${discordId})`)
    }

    // Send email using Resend
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'ADOS <hello@ados.events>',
        to: [email],
        subject: "We're delighted to have you joining us for ADOS!",
        html: EMAIL_TEMPLATE,
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      console.error('Resend API error:', data)
      return new Response(
        JSON.stringify({ error: 'Failed to send email', details: data }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Record that the email was sent
    const { error: updateError } = await supabase
      .from('attendance')
      .update({ email_sent_at: new Date().toISOString() })
      .eq('id', attendance_id)

    if (updateError) {
      console.warn('Failed to update email_sent_at:', updateError)
      // Don't fail the request - email was sent successfully
    }

    // Send Discord DM if user has Discord connected
    let discordResult = null
    if (discordId) {
      console.log(`Fetching Discord user info for ID ${discordId}...`)
      
      // Fetch current Discord display name
      const userInfo = await getDiscordUser(discordId)
      const displayName = userInfo.success ? userInfo.displayName : (discordUsername || 'friend')
      
      console.log(`Sending Discord DM to ${displayName}...`)
      discordResult = await sendDiscordDM(discordId, displayName)
      
      if (discordResult.success) {
        console.log(`✅ Discord DM sent successfully to ${displayName}`)
      } else {
        console.warn(`⚠️ Failed to send Discord DM: ${discordResult.error}`)
        // Don't fail the request - email was sent successfully
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Email sent to ${email}${discordId ? ` and Discord DM sent to ${discordUsername}` : ''}`,
        attendance_id,
        email_sent: true,
        discord_sent: discordResult?.success || false,
        data 
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


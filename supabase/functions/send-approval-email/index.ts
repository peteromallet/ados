import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

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
    const { email, event_name } = await req.json()

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Sending approval email to ${email} for ${event_name}`)

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

    return new Response(
      JSON.stringify({ success: true, message: `Email sent to ${email}`, data }),
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


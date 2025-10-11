import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { user_email, user_id, event_id, event_name } = await request.json()

    // Verify the request is from your Supabase instance
    // You can add authentication here if needed

    if (!user_email || !event_name) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Read the HTML email template
    const fs = require('fs')
    const path = require('path')
    const emailTemplate = fs.readFileSync(
      path.join(process.cwd(), 'supabase/templates/approval.html'),
      'utf8'
    )

    // Send email using Supabase Auth (which uses your configured email provider)
    const { error } = await supabase.auth.admin.sendRawEmail({
      to: user_email,
      subject: "You're delighted to have you joining us for ADOS!",
      html: emailTemplate,
    })

    if (error) {
      console.error('Error sending approval email:', error)
      return NextResponse.json(
        { error: 'Failed to send email', details: error },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true,
      message: `Approval email sent to ${user_email}` 
    })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


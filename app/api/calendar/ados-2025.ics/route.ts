import { NextResponse } from 'next/server'

export async function GET() {
  const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//ADOS//Events//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:ADOS - Los Angeles
X-WR-TIMEZONE:America/Los_Angeles
BEGIN:VEVENT
UID:ados-2025@ados.events
DTSTAMP:20251011T000000Z
DTSTART;VALUE=DATE:20251107
DTEND;VALUE=DATE:20251108
SUMMARY:ADOS - Los Angeles
DESCRIPTION:Morning event: 11am-5pm (panels, roundtables, hangouts)\\n\\nEvening event: 7pm-11pm (show, drinks, frivolities)
LOCATION:Mack Sennett studios, 1215 Bates Ave, Los Angeles, CA 90029, United States
URL:https://ados.events/events/ados-2025
STATUS:CONFIRMED
SEQUENCE:0
END:VEVENT
END:VCALENDAR`

  return new NextResponse(icsContent, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'attachment; filename="ados-2025.ics"',
    },
  })
}


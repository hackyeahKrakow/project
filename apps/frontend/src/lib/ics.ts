import type { SpottedEvent } from './events'

const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
// RFC 5545: escape \ ; , and newlines in text values.
const text = (s: string) => s.replace(/[\\;,]/g, (c) => `\\${c}`).replace(/\n/g, '\\n')

/** iCalendar file with the given events (2 h long when no end time is known). */
export function ics(events: SpottedEvent[], now = new Date()) {
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//spotted student//PL', 'CALSCALE:GREGORIAN']
  for (const ev of events) {
    const start = new Date(ev.starts_at)
    lines.push(
      'BEGIN:VEVENT',
      `UID:${ev.id}@spottedstudent.app`,
      `DTSTAMP:${stamp(now)}`,
      `DTSTART:${stamp(start)}`,
      `DTEND:${stamp(new Date(start.getTime() + 2 * 3_600_000))}`,
      `SUMMARY:${text(ev.event_name)}`,
      `LOCATION:${text(ev.address)}`,
      `DESCRIPTION:${text(`${ev.description}\n\nOrganizator: ${ev.organizer.name}`)}`,
      'END:VEVENT',
    )
  }
  lines.push('END:VCALENDAR')
  return lines.join('\r\n')
}

export function downloadIcs(events: SpottedEvent[], name = 'spotted-student.ics') {
  const url = URL.createObjectURL(new Blob([ics(events)], { type: 'text/calendar;charset=utf-8' }))
  const a = Object.assign(document.createElement('a'), { href: url, download: name })
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000) // revoking right away cancels the download in Firefox
}

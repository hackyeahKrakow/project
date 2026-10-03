import type { SpottedEvent } from './events'

const stamp = (d: Date) =>
  d
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '')
// RFC 5545: escape \ ; , and newlines in text values.
const text = (s: string) => s.replace(/[\\;,]/g, (c) => `\\${c}`).replace(/\n/g, '\\n')

const utf8 = new TextEncoder()

/** RFC 5545 §3.1: lines longer than 75 octets continue on the next line after CRLF + space, never inside a UTF-8 character. */
export function fold(line: string) {
  const out: string[] = []
  let cur = ''
  let size = 0
  for (const ch of line) {
    const n = utf8.encode(ch).length
    if (size + n > (out.length ? 74 : 75)) {
      out.push(cur)
      cur = ''
      size = 0
    }
    cur += ch
    size += n
  }
  out.push(cur)
  return out.join('\r\n ')
}

/** iCalendar file with the given events (2 h long when no end time is known). */
export function ics(events: SpottedEvent[], now = new Date()) {
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//spootted//PL', 'CALSCALE:GREGORIAN']
  for (const ev of events) {
    const start = new Date(ev.starts_at)
    lines.push(
      'BEGIN:VEVENT',
      `UID:${ev.id}@spootted.app`,
      `DTSTAMP:${stamp(now)}`,
      `DTSTART:${stamp(start)}`,
      `DTEND:${stamp(ev.ends_at ? new Date(ev.ends_at) : new Date(start.getTime() + 2 * 3_600_000))}`,
      `SUMMARY:${text(ev.event_name)}`,
      `LOCATION:${text(ev.address)}`,
      `DESCRIPTION:${text(`${ev.description}\n\nOrganizator: ${ev.organizer.name}`)}`,
      // The calendar reminds an hour before, also with the app closed.
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      'TRIGGER:-PT1H',
      `DESCRIPTION:${text(ev.event_name)}`,
      'END:VALARM',
      'END:VEVENT',
    )
  }
  lines.push('END:VCALENDAR')
  return lines.map(fold).join('\r\n')
}

export function downloadIcs(events: SpottedEvent[], name = 'spootted.ics') {
  const url = URL.createObjectURL(new Blob([ics(events)], { type: 'text/calendar;charset=utf-8' }))
  const a = Object.assign(document.createElement('a'), { href: url, download: name })
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000) // revoking right away cancels the download in Firefox
}

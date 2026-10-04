import { formatTime, type SpottedEvent } from './events'

// Reminders an hour before liked events, while the app is open (also in a background tab).
// ponytail: no server push (needs accounts, VAPID keys and a cron); with the app closed the phone's calendar reminds,
// because the .ics export carries an alarm (VALARM) an hour before.
const LEAD = 60 * 60_000
const DAY = 24 * 60 * 60_000
const KEY = 'spootted:notified'

export const canNotify = () => 'Notification' in window && Notification.permission === 'granted'

/** Asks the browser once; true when reminders can be shown. */
export async function askPermission() {
  if (!('Notification' in window)) return false
  return Notification.permission === 'granted' || (await Notification.requestPermission()) === 'granted'
}

async function show(ev: SpottedEvent) {
  let done: string[] = []
  try {
    done = JSON.parse(localStorage.getItem(KEY) ?? '[]')
    if (done.includes(ev.id)) return // one reminder per event, even across reloads
    localStorage.setItem(KEY, JSON.stringify([...done, ev.id].slice(-200)))
  } catch {
    /* storage blocked: may repeat after a reload, never breaks */
  }
  const title = `${ev.event_name} o ${formatTime(ev.starts_at)}`
  const options = { body: ev.address, tag: ev.id }
  // Android Chrome only shows notifications through a service worker; desktop browsers also take the plain constructor.
  const reg = await navigator.serviceWorker?.getRegistration()
  if (reg) await reg.showNotification(title, options)
  else new Notification(title, options)
}

/** Sets a timer per liked event that starts within a day; returns the cleanup. */
export function scheduleReminders(events: SpottedEvent[], now = Date.now()) {
  const timers = events.flatMap((ev) => {
    const wait = Date.parse(ev.starts_at) - LEAD - now
    if (wait < -LEAD || wait > DAY) return [] // already started, or reminded on a later visit
    return [setTimeout(() => show(ev).catch(() => {}), Math.max(wait, 0))]
  })
  return () => timers.forEach(clearTimeout)
}

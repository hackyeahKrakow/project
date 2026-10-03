import { CATEGORIES, category, type CategoryId } from './categories.ts'
import { DISTRICTS, SIZE_LABEL, daysFromToday, formatPrice, inRange, km, todayYmd, whenLabel, type SpottedEvent } from './events.ts'
import type { Decision, Goal, Profile } from './store'

const GOAL_CATS: Record<Goal, CategoryId[]> = {
  ludzie: ['imprezy', 'gry'],
  nauka: ['nauka', 'warsztaty'],
  zabawa: ['imprezy', 'muzyka', 'gry'],
  ruch: ['sport'],
  spokoj: ['kultura'],
  oszczedzac: [],
}

/** Category weights: onboarding gives 0.7 / 0.3, goals +0.1, each swipe right +0.1, left −0.05 (docs/ARCHITECTURE.md). */
export function weights(profile: Profile, swipes: Record<string, Decision>, events: SpottedEvent[]) {
  const w = Object.fromEntries(CATEGORIES.map((c) => [c.id, profile.interests.length ? (profile.interests.includes(c.id) ? 0.7 : 0.3) : 0.5])) as Record<
    CategoryId,
    number
  >
  for (const g of profile.goals) for (const c of GOAL_CATS[g]) w[c] += 0.1
  const byId = new Map(events.map((e) => [e.id, e]))
  for (const [id, d] of Object.entries(swipes)) {
    const ev = byId.get(id)
    if (ev) w[ev.category] += d === 'right' ? 0.1 : -0.05
  }
  for (const c of CATEGORIES) w[c.id] = Math.min(1, Math.max(0, w[c.id]))
  return w
}

const hourOf = (iso: string) => Number(new Intl.DateTimeFormat('en-GB', { hour: 'numeric', hourCycle: 'h23', timeZone: 'Europe/Warsaw' }).format(new Date(iso)))
const weekdayOf = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { weekday: 'short', timeZone: 'Europe/Warsaw' })

/** Budget is a hard filter; everything else is a score. */
export const fitsBudget = (ev: SpottedEvent, p: Profile) => (p.budget === 'free' ? ev.price === 0 : p.budget === 'upto20' ? ev.price !== null && ev.price <= 20 : true)

function timeFit(ev: SpottedEvent, p: Profile) {
  if (!p.times.length) return 1
  const h = hourOf(ev.starts_at)
  const weekend = ['Sat', 'Sun'].includes(weekdayOf(ev.starts_at))
  return p.times.some((t) => (t === 'weekendy' ? weekend : t === 'wieczory' ? h >= 18 : !weekend && h >= 14 && h < 18)) ? 1 : 0.4
}

export type Scored = { ev: SpottedEvent; score: number; reason: string; distance: number }

/** score = 0.45·category + 0.25·proximity + 0.20·time + 0.10·followed organizer (docs/ARCHITECTURE.md), × size fit. */
export function score(
  ev: SpottedEvent,
  p: Profile,
  w: Record<CategoryId, number>,
  here?: [number, number],
  today = todayYmd(),
  follows: ReadonlySet<string> = new Set(),
): Scored {
  const from = here ?? DISTRICTS[p.district] ?? DISTRICTS['Stare Miasto']
  const distance = km(from, [ev.lat, ev.lng])
  const reach = p.distanceKm || 8
  const proximity = Math.max(0, 1 - distance / reach)
  const soon = Math.max(0, 1 - Math.max(0, daysFromToday(ev.starts_at, today)) / 14)
  const followed = follows.has(ev.organizer.id)
  const sizeFit = !p.sizes.length || p.sizes.includes(ev.size) ? 1 : 0.85
  const s = (0.45 * w[ev.category] + 0.25 * proximity + 0.2 * soon * timeFit(ev, p) + 0.1 * (followed ? 1 : 0)) * sizeFit

  // "Bo lubisz…" lists only what really drove the match (docs/SPEC.md, DSA transparency).
  const parts = [w[ev.category] >= 0.6 ? category(ev.category).short.toLowerCase() : null, p.sizes.includes(ev.size) ? SIZE_LABEL[ev.size] : null].filter(
    Boolean,
  )
  const reason = [
    followed ? `Obserwujesz: ${ev.organizer.name}` : null,
    parts.length ? `Bo lubisz: ${parts.join(', ')}` : followed ? null : 'Nowość dla ciebie',
    distance < 1 ? `${Math.round(distance * 1000)} m od ${here ? 'ciebie' : p.district}` : `${distance.toFixed(1).replace('.', ',')} km`,
    daysFromToday(ev.starts_at, today) < 2 ? whenLabel(ev.starts_at, today) : null, // the card shows the full date already
    p.budget !== 'any' ? formatPrice(ev.price).toLowerCase() : null,
  ]
    .filter(Boolean)
    .join(' · ')
  return { ev, score: s, reason, distance }
}

/** Next cards: upcoming, not swiped, within budget and reach, best first. */
export function recommend(
  events: SpottedEvent[],
  p: Profile,
  swipes: Record<string, Decision>,
  exclude: Set<string>,
  n: number,
  here?: [number, number],
  follows: ReadonlySet<string> = new Set(),
) {
  const w = weights(p, swipes, events)
  const today = todayYmd()
  return events
    .filter((e) => !swipes[e.id] && !exclude.has(e.id) && inRange(e, 'wszystkie', today) && fitsBudget(e, p))
    .map((e) => score(e, p, w, here, today, follows))
    .filter((x) => !p.distanceKm || x.distance <= p.distanceKm + 1)
    .sort((a, b) => b.score - a.score)
    .slice(0, n)
}

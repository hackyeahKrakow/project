import { CATEGORIES, category, type CategoryId } from './categories.ts'
import { DISTRICTS, SIZE_LABEL, daysFromToday, formatPrice, km, todayYmd, whenLabel, type SpottedEvent } from './events.ts'
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
  const w = Object.fromEntries(CATEGORIES.map((c) => [c.id, profile.interests.length ? (profile.interests.includes(c.id) ? 0.7 : 0.3) : 0.5])) as Record<CategoryId, number>
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
export const fitsBudget = (ev: SpottedEvent, p: Profile) => (p.budget === 'free' ? ev.price === 0 : p.budget === 'upto20' ? ev.price <= 20 : true)

function timeFit(ev: SpottedEvent, p: Profile) {
  if (!p.times.length) return 1
  const h = hourOf(ev.starts_at)
  const weekend = ['Sat', 'Sun'].includes(weekdayOf(ev.starts_at))
  return p.times.some((t) => (t === 'weekendy' ? weekend : t === 'wieczory' ? h >= 18 : !weekend && h >= 14 && h < 18)) ? 1 : 0.4
}

export type Scored = { ev: SpottedEvent; score: number; reason: string; distance: number }

export function score(ev: SpottedEvent, p: Profile, w: Record<CategoryId, number>, here?: [number, number], today = todayYmd()): Scored {
  const from = here ?? DISTRICTS[p.district] ?? DISTRICTS['Stare Miasto']
  const distance = km(from, [ev.lat, ev.lng])
  const reach = p.distanceKm || 8
  const proximity = Math.max(0, 1 - distance / reach)
  const soon = Math.max(0, 1 - Math.max(0, daysFromToday(ev.starts_at, today)) / 14)
  const sizeFit = !p.sizes.length || p.sizes.includes(ev.size) ? 1 : 0.3
  const s = 0.45 * w[ev.category] + 0.25 * proximity + 0.2 * soon * timeFit(ev, p) + 0.1 * sizeFit

  // "Bo lubisz…" lists only what really drove the match (docs/SPEC.md, DSA transparency).
  const parts = [w[ev.category] >= 0.6 ? category(ev.category).short.toLowerCase() : null, p.sizes.includes(ev.size) ? SIZE_LABEL[ev.size] : null].filter(Boolean)
  const reason = [
    parts.length ? `Bo lubisz: ${parts.join(', ')}` : 'Nowość dla ciebie',
    distance < 1 ? `${Math.round(distance * 1000)} m od ${here ? 'ciebie' : p.district}` : `${distance.toFixed(1).replace('.', ',')} km`,
    whenLabel(ev.starts_at, today),
    ev.price === 0 || p.budget !== 'any' ? formatPrice(ev.price).toLowerCase() : null,
  ]
    .filter(Boolean)
    .join(' · ')
  return { ev, score: s, reason, distance }
}

/** Next cards: upcoming, not swiped, within budget and reach, best first. */
export function recommend(events: SpottedEvent[], p: Profile, swipes: Record<string, Decision>, exclude: Set<string>, n: number, here?: [number, number]) {
  const w = weights(p, swipes, events)
  const today = todayYmd()
  return events
    .filter((e) => !swipes[e.id] && !exclude.has(e.id) && daysFromToday(e.starts_at, today) >= 0 && fitsBudget(e, p))
    .map((e) => score(e, p, w, here, today))
    .filter((x) => !p.distanceKm || x.distance <= p.distanceKm + 1)
    .sort((a, b) => b.score - a.score)
    .slice(0, n)
}

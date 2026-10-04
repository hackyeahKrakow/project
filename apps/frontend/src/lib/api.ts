import type { CategoryId } from './categories'
import { CARD_IDS, STARTER, type Size, type SpottedEvent } from './events'
import type { Decision } from './store'

// Empty VITE_API_URL = offline demo on the mock catalog. Locally http://localhost:8000, on Vercel /api.
const API = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')

type Card = Pick<SpottedEvent, 'id' | 'event_name' | 'description' | 'starts_at' | 'address' | 'lat' | 'lng' | 'price'>

/** The six fixed starter cards: local copies (category, organizer) updated with what GET /card/new/{user_id} returns. */
export async function starterDeck(userId: string): Promise<SpottedEvent[]> {
  if (!API) return STARTER
  const fromApi = new Map<string, Card>()
  try {
    for (let i = 0; i < STARTER.length; i++) {
      const res = await fetch(`${API}/card/new/${userId}`)
      if (!res.ok) break // 404 = this user already got all six
      const card = (await res.json()) as Card
      // null = not known yet in the backend (coordinates, price), keep the local value
      fromApi.set(card.id, Object.fromEntries(Object.entries(card).filter(([, v]) => v !== null)) as Card)
    }
  } catch {
    /* offline: local copies only */
  }
  return STARTER.map((e) => ({ ...e, ...fromApi.get(e.id) }))
}

/** Saves a swipe with POST /card/{user_id}. Only the 20 backend cards exist there; demo events stay local. */
export function saveSwipe(userId: string, cardId: string, decision: Decision) {
  if (!API || !CARD_IDS.has(cardId)) return
  fetch(`${API}/card/${userId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ card_id: cardId, decision }),
  }).catch(() => {}) // ponytail: fire-and-forget, the local copy is the source of truth for the demo
}

export type Draft = {
  title: string | null
  description: string | null
  category: CategoryId | null
  starts_at: string | null
  ends_at: string | null
  address: string | null
  price: number | null
  size: Size | null
  missing_fields: string[]
}

/**
 * POST /events/parse. `'invalid'` = the text was rejected (422, e.g. too long); null = the API or model is unavailable,
 * so the caller can fall back to the demo draft.
 */
export async function parseEvent(text: string): Promise<Draft | 'invalid' | null> {
  if (!API) return null
  try {
    const res = await fetch(`${API}/events/parse`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
      signal: AbortSignal.timeout(25_000),
    })
    if (res.status === 422) return 'invalid'
    return res.ok ? ((await res.json()) as Draft) : null
  } catch {
    return null
  }
}

export type Place = { label: string; lat: number; lng: number }

/** GET /geocode: up to 5 Kraków addresses matching the typed text. null when the API is unavailable. */
export async function searchAddress(q: string): Promise<Place[] | null> {
  if (!API) return null
  try {
    const res = await fetch(`${API}/geocode?q=${encodeURIComponent(q)}`, { signal: AbortSignal.timeout(8_000) })
    return res.ok ? ((await res.json()) as Place[]) : null
  } catch {
    return null
  }
}

export type TransitNear = {
  stops: { name: string; mode: 'tram' | 'bus'; distance_m: number }[]
  alerts: { header: string; description: string }[]
}

/** GET /transit/near: nearest tram and bus stop and current ZTP disruptions around the event. null when unavailable. */
export async function transitNear(lat: number, lng: number): Promise<TransitNear | null> {
  if (!API) return null
  try {
    const res = await fetch(`${API}/transit/near?lat=${lat}&lng=${lng}`, { signal: AbortSignal.timeout(25_000) })
    return res.ok ? ((await res.json()) as TransitNear) : null
  } catch {
    return null
  }
}

export type RouteLeg = {
  mode: string // WALK, TRAM, BUS, RAIL…
  line: string | null
  headsign: string | null
  from_name: string
  to_name: string
  start: string
  end: string
  minutes: number
  low_floor: boolean | null // from the ZTP timetable; null = unknown
  realtime: boolean
}
export type RouteOption = { start: string; end: string; minutes: number; transfers: number; legs: RouteLeg[] }
export type RoutePlan = { options: RouteOption[]; walk_minutes: number | null }

/** GET /route: public transport options arriving by `time` (Transitous over the ZTP timetable). null when unavailable. */
export async function planRoute(from: [number, number], to: [number, number], time: string, arriveBy: boolean, wheelchair: boolean): Promise<RoutePlan | null> {
  if (!API) return null
  const q = new URLSearchParams({
    from_lat: String(from[0]),
    from_lng: String(from[1]),
    to_lat: String(to[0]),
    to_lng: String(to[1]),
    time,
    arrive_by: String(arriveBy),
    wheelchair: String(wheelchair),
  })
  try {
    const res = await fetch(`${API}/route?${q}`, { signal: AbortSignal.timeout(20_000) })
    return res.ok ? ((await res.json()) as RoutePlan) : null
  } catch {
    return null
  }
}

export type Parking = {
  name: string
  distance_m: number
  lat: number
  lng: number
  capacity: number | null
  disabled_spaces: number | null
  has_disabled_spaces: boolean | null
  fee: boolean | null
  park_ride: boolean
}
export type ParkingNear = { parkings: Parking[]; disabled_spaces: number; nearest_disabled_m: number | null }

/** GET /parking/near: car parks and spaces for people with disabilities around the event (OpenStreetMap). null when unavailable. */
export async function parkingNear(lat: number, lng: number): Promise<ParkingNear | null> {
  if (!API) return null
  try {
    const res = await fetch(`${API}/parking/near?lat=${lat}&lng=${lng}`, { signal: AbortSignal.timeout(30_000) })
    return res.ok ? ((await res.json()) as ParkingNear) : null
  } catch {
    return null
  }
}

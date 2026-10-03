import type { CategoryId } from './categories'
import { STARTER, STARTER_IDS, type Size, type SpottedEvent } from './events'
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
      fromApi.set(card.id, card)
    }
  } catch {
    /* offline: local copies only */
  }
  return STARTER.map((e) => ({ ...e, ...fromApi.get(e.id) }))
}

/** Saves a swipe with POST /card/{user_id}. Only the starter cards exist in the backend; the rest stay local. */
export function saveSwipe(userId: string, cardId: string, decision: Decision) {
  if (!API || !STARTER_IDS.has(cardId)) return
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

/** POST /events/parse. Returns null when the API or the model is unavailable, so the caller can use the demo draft. */
export async function parseEvent(text: string): Promise<Draft | null> {
  if (!API) return null
  try {
    const res = await fetch(`${API}/events/parse`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
      signal: AbortSignal.timeout(25_000),
    })
    return res.ok ? ((await res.json()) as Draft) : null
  } catch {
    return null
  }
}

/** Address → coordinates with OpenStreetMap Nominatim (low volume, called only on publish). */
export async function geocode(address: string): Promise<[number, number] | null> {
  try {
    const q = encodeURIComponent(/krak[oó]w/i.test(address) ? address : `${address}, Kraków`)
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=pl&q=${q}`, {
      signal: AbortSignal.timeout(6_000),
    })
    const [hit] = (await res.json()) as { lat: string; lon: string }[]
    return hit ? [Number(hit.lat), Number(hit.lon)] : null
  } catch {
    return null
  }
}

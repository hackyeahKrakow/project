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

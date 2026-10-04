import type { CategoryId } from './categories'
import { CARD_IDS, STARTER, type Size, type SpottedEvent } from './events'
import type { Decision } from './store'

// Empty VITE_API_URL = offline demo on the mock catalog. Locally http://localhost:8000, on Vercel /api.
const API = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')

const read = (k: string) => {
  try {
    return localStorage.getItem(k)
  } catch {
    return null
  }
}
const write = (k: string) => {
  try {
    localStorage.setItem(k, '1')
  } catch {
    /* private mode: sync again next visit */
  }
}

/**
 * The six fixed starter cards. The local copies are the same file as the backend catalog (npm run check compares them), so
 * they are the source of truth; GET /card/new/{user_id} is called only to move the user's progress on the server, once per user
 * (Vercel Hobby: each request is a function invocation), and a stale database row can never overwrite a corrected time.
 */
export async function starterDeck(userId: string): Promise<SpottedEvent[]> {
  const done = `spootted:starter:${userId}`
  if (!API || read(done)) return STARTER
  try {
    for (let i = 0; i < STARTER.length; i++) if (!(await fetch(`${API}/card/new/${userId}`)).ok) break // 404 = all six served
    write(done) // only after the loop finished: a half-done sync is retried next time
  } catch {
    /* offline: try again next visit */
  }
  return STARTER
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

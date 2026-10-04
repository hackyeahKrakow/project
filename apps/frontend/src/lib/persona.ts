import { CATEGORIES, type CategoryId } from './categories.ts'
import { catalog, type SpottedEvent } from './events.ts'
import { weights } from './recommend.ts'
import type { Decision, Profile } from './store'

// "Jakim typem jesteś": a quiz-like label from the same category weights the deck uses (no AI, computed on the device).
// Gender-neutral on purpose: we never ask about gender, so the names are nouns that fit anyone.
const BASE: Record<CategoryId, string> = {
  nauka: 'Ciekawski umysł',
  sport: 'Wulkan energii',
  muzyka: 'Muzyczna dusza',
  gry: 'Głowa do gier',
  imprezy: 'Dusza towarzystwa',
  kultura: 'Mól książkowy',
  warsztaty: 'Złota rączka',
}
const TWIST: Record<CategoryId, string> = {
  nauka: 'z notesem pełnym pytań',
  sport: 'w ciągłym ruchu',
  muzyka: 'ze słuchawkami na uszach',
  gry: 'z kostką do gry w kieszeni',
  imprezy: 'z imprezowym pazurem',
  kultura: 'z nosem w książce',
  warsztaty: 'z własnym projektem w plecaku',
}
const BLURB: Record<CategoryId, string> = {
  nauka: 'Wykłady otwarte, koła naukowe i wszystko, po czym wiesz więcej niż wczoraj.',
  sport: 'Bieg, joga, turniej: byle się ruszać, najlepiej w grupie.',
  muzyka: 'Koncerty, jam session i wieczory, na których ktoś gra na żywo.',
  gry: 'Planszówki, turnieje i gry retro. Wygrana cieszy, ale liczy się wspólne granie.',
  imprezy: 'Integracje, nocne markety i miejsca, gdzie łatwo poznać nowych ludzi.',
  kultura: 'Spotkania autorskie, kino studenckie, teatr i spacery z przewodnikiem.',
  warsztaty: 'Warsztaty, hackathony i targi pracy: uczysz się, robiąc.',
}

export type Persona = { ids: CategoryId[]; title: string; blurb: string }

/** 1–2 category ids (strongest first) → the type's name and description. */
export const describe = (ids: CategoryId[]): Persona => ({ ids, title: ids[1] ? `${BASE[ids[0]]} ${TWIST[ids[1]]}` : BASE[ids[0]], blurb: BLURB[ids[0]] })

/** The strongest category gives the type, a close second adds a twist. Ties follow the order of interests from onboarding. null until there is a signal. */
export function persona(w: Record<CategoryId, number>, interests: CategoryId[] = []): Persona | null {
  const rank = (id: CategoryId) => (interests.includes(id) ? interests.indexOf(id) : 99)
  const [a, b] = CATEGORIES.map((c) => c.id).sort((x, y) => w[y] - w[x] || rank(x) - rank(y))
  if (w[a] <= 0.5) return null // no interests and no likes yet: every weight is 0.5
  return describe(w[b] > 0.5 && w[a] - w[b] <= 0.15 ? [a, b] : [a])
}

/** This device's type, from the same data as the deck (built-in catalog + own events). */
export const myPersona = (s: { profile: Profile; swipes: Record<string, Decision>; myEvents: SpottedEvent[] }) =>
  persona(weights(s.profile, s.swipes, [...catalog(), ...s.myEvents]), s.profile.interests)

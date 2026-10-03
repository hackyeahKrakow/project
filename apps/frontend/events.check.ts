// Run: npm run check — asserts the date, recommendation and calendar logic the pages rely on.
import assert from 'node:assert/strict'
import { at, catalog, demoCatalog, eventDays, formatDate, formatPrice, formatRange, inRange, warsawDay, whenLabel } from './src/lib/events.ts'
import { fold, ics } from './src/lib/ics.ts'
import { describe, persona } from './src/lib/persona.ts'
import { recommend, weights } from './src/lib/recommend.ts'
import { inKrakow } from './src/lib/geo.ts'
import { EMPTY_PROFILE, uuid7 } from './src/lib/store.ts'

assert.equal(formatDate('2026-10-08T19:00:00+02:00'), 'czw., 8 paź, 19:00')
assert.equal(formatPrice(0), 'Za darmo')
assert.equal(formatPrice(15), '15 zł')
// 23:30 UTC is already the next day in Warsaw
assert.equal(warsawDay('2026-10-08T23:30:00Z'), '2026-10-09')
assert.ok(inRange({ starts_at: '2026-10-08T10:00:00+02:00' }, 'dzis', '2026-10-08'))
assert.ok(!inRange({ starts_at: '2026-10-09T10:00:00+02:00' }, 'dzis', '2026-10-08'))
assert.ok(inRange({ starts_at: '2026-10-14T23:00:00+02:00' }, 'tydzien', '2026-10-08'))
assert.ok(!inRange({ starts_at: '2026-10-15T10:00:00+02:00' }, 'tydzien', '2026-10-08'))
assert.ok(!inRange({ starts_at: '2026-10-07T10:00:00+02:00' }, 'tydzien', '2026-10-08'))
assert.ok(inRange({ starts_at: '2026-11-20T10:00:00+01:00' }, 'wszystkie', '2026-10-08'))

// Multi-day events count on every day they run.
const fair = { starts_at: '2026-10-06T10:00:00+02:00', ends_at: '2026-10-09T18:00:00+02:00' }
assert.ok(inRange(fair, 'dzis', '2026-10-08'))
assert.ok(!inRange(fair, 'dzis', '2026-10-10'))
assert.ok(inRange(fair, 'tydzien', '2026-10-02'))
assert.ok(!inRange(fair, 'wszystkie', '2026-10-10'))
assert.deepEqual(eventDays(fair), ['2026-10-06', '2026-10-07', '2026-10-08', '2026-10-09'])
assert.deepEqual(eventDays(fair, '2026-10-08'), ['2026-10-08', '2026-10-09'])
// A long exhibition keeps showing up after its first month.
assert.equal(eventDays({ starts_at: '2026-10-01T10:00:00+02:00', ends_at: '2026-11-30T18:00:00+01:00' }, '2026-11-05')[0], '2026-11-05')
assert.equal(formatRange({ starts_at: '2026-10-08T19:00:00+02:00', ends_at: '2026-10-08T23:00:00+02:00' }), 'czw., 8 paź, 19:00–23:00')

// Relative demo dates keep Warsaw summer/winter offsets.
const oct3 = new Date('2026-10-03T10:00:00Z')
assert.equal(at(0, '19:00', oct3), '2026-10-03T19:00:00+02:00')
assert.equal(at(30, '19:00', oct3), '2026-11-02T19:00:00+01:00')
assert.equal(whenLabel('2026-10-04T17:30:00+02:00', '2026-10-03'), 'jutro 17:30')

// UUIDv7 as the backend expects: version 7, RFC variant, timestamp first.
const id = uuid7(Date.UTC(2026, 9, 3))
assert.match(id, /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)
assert.equal(parseInt(id.replace(/-/g, '').slice(0, 12), 16), Date.UTC(2026, 9, 3))

// Recommendations: interests and swipes move the category weights; budget is a hard filter.
const events = demoCatalog() // the ranking checks use the demo events, which the app itself no longer shows
const profile = { ...EMPTY_PROFILE, interests: ['gry', 'nauka', 'muzyka'] as const, budget: 'free' as const }
const w0 = weights({ ...profile, interests: [...profile.interests] }, {}, events)
assert.equal(w0.gry, 0.7)
assert.equal(w0.sport, 0.3)
const w1 = weights({ ...profile, interests: [...profile.interests] }, { evt_bieg: 'right', evt_planszowki: 'left' }, events)
assert.equal(Math.round(w1.sport * 100), 40)
assert.equal(Math.round(w1.gry * 100), 65)
const deck = recommend(events, { ...profile, interests: [...profile.interests] }, {}, new Set(), 10)
assert.equal(deck.length, 10)
assert.ok(deck.every((x) => x.ev.price === 0 || x.ev.price === null)) // known prices must be free
assert.ok(deck[0].reason.startsWith('Bo lubisz:'), deck[0].reason)
assert.ok(!recommend(events, { ...profile, interests: [...profile.interests] }, { [deck[0].ev.id]: 'right' }, new Set(), 50).some((x) => x.ev.id === deck[0].ev.id))

// .ics: one VEVENT per event, escaped text, UTC times.
const cal = ics([{ ...events[0], event_name: 'A, B; C' }], new Date('2026-10-03T10:00:00Z'))
assert.ok(cal.includes('SUMMARY:A\\, B\\; C'))
assert.equal(cal.match(/BEGIN:VEVENT/g)?.length, 1)
assert.match(cal, /DTSTART:\d{8}T\d{6}Z/)
// Following an organizer lifts its events and is named in the reason.
const lib = events.find((e) => e.id === 'evt_ksiazka')!
const plain = recommend(events, { ...profile, interests: [...profile.interests] }, {}, new Set(), 50).findIndex((x) => x.ev.id === lib.id)
const followedDeck = recommend(events, { ...profile, interests: [...profile.interests] }, {}, new Set(), 50, undefined, new Set([lib.organizer.id]))
const followed = followedDeck.findIndex((x) => x.ev.id === lib.id)
assert.ok(followed < plain, `${followed} < ${plain}`)
assert.ok(followedDeck[followed].reason.startsWith('Obserwujesz:'), followedDeck[followed].reason)

// .ics folding: max 75 octets per physical line, never splitting a UTF-8 character, unfolds to the original.
const long = 'DESCRIPTION:' + 'Zażółć gęślą jaźń, '.repeat(12)
const folded = fold(long)
assert.ok(folded.split('\r\n').every((l) => new TextEncoder().encode(l).length <= 75))
assert.equal(folded.replace(/\r\n /g, ''), long)
assert.equal(fold('SHORT:ok'), 'SHORT:ok')
console.log('events checks ok')

// Persona: strongest category is the type, a close second adds the twist, ties follow the onboarding order.
const flat = Object.fromEntries(Object.keys(weights(EMPTY_PROFILE, {}, [])).map((k) => [k, 0.5])) as ReturnType<typeof weights>
assert.equal(persona(flat), null)
assert.equal(persona({ ...flat, gry: 0.7, imprezy: 0.7 }, ['imprezy', 'gry'])?.title, 'Dusza towarzystwa z kostką do gry w kieszeni')
assert.equal(persona({ ...flat, gry: 0.7, imprezy: 0.7 }, ['gry', 'imprezy'])?.title, 'Głowa do gier z imprezowym pazurem')
assert.deepEqual(persona({ ...flat, nauka: 0.9, sport: 0.6 })?.ids, ['nauka'])
assert.equal(describe(['kultura']).title, 'Mól książkowy')
console.log('persona checks ok')

// The frontend copy of the backend catalog stays identical to data/events_oneoff.json (the backend test checks its own copy).
const { readFileSync } = await import('node:fs')
const read = (f: string) => JSON.parse(readFileSync(new URL(f, import.meta.url), 'utf8'))
assert.deepEqual(read('./src/lib/events_oneoff.json'), read('../../data/events_oneoff.json'))
const { CARDS, STARTER } = await import('./src/lib/events.ts')
assert.equal(CARDS.length, 20)
assert.deepEqual(STARTER, CARDS.slice(0, 6))
// The app shows only the 20 backend cards; the demo events stay in demoCatalog().
assert.deepEqual(catalog(), CARDS)
assert.ok(demoCatalog().length > CARDS.length)
// The real catalog, on a fixed day so the check outlives the events: budget users still get a deck (prices are unknown, not paid),
// a known paid price is still filtered out, and interests rank a matching category first.
const real = (budget: 'free' | 'upto20', evs = catalog()) =>
  recommend(evs, { ...EMPTY_PROFILE, interests: ['kultura'], budget }, {}, new Set(STARTER.map((e) => e.id)), 50, undefined, new Set(), '2026-10-03')
assert.equal(real('free').length, CARDS.length - STARTER.length)
assert.equal(real('upto20').length, CARDS.length - STARTER.length)
const paid = catalog().map((e) => ({ ...e, price: 30 }))
assert.equal(real('free', paid).length, 0)
assert.equal(real('free')[0].ev.category, 'kultura')
assert.ok(CARDS.every((e) => e.district && !('ends_at' in e && e.ends_at === null)))
console.log('catalog checks ok')

// Step-free users: a venue with barriers never shows up, a step-free one is preferred and says why; unknown ones stay.
const access = catalog().map((e, i) => (i === 7 ? { ...e, wheelchair: 'no' as const } : e))
const stepFree = recommend(access, { ...EMPTY_PROFILE, stepFree: true }, {}, new Set(), 50, undefined, new Set(), '2026-10-03')
assert.ok(!stepFree.some((x) => x.ev.wheelchair === 'no'))
assert.equal(stepFree.length, CARDS.length - 1)
assert.equal(stepFree[0].ev.wheelchair, 'yes')
assert.ok(stepFree[0].reason.includes('Bez barier'))
assert.equal(recommend(access, EMPTY_PROFILE, {}, new Set(), 50, undefined, new Set(), '2026-10-03').length, CARDS.length)
// A fix far from Kraków (e.g. a laptop located by IP) is not used as the start of a trip.
assert.ok(inKrakow([50.0647, 19.9232]) && !inKrakow([52.2297, 21.0122]))
console.log('accessibility checks ok')

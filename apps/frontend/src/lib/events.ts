import type { CategoryId } from './categories'

export const UNIVERSITIES = [
  { id: 'AGH', name: 'AGH — Akademia Górniczo-Hutnicza' },
  { id: 'UJ', name: 'UJ — Uniwersytet Jagielloński' },
  { id: 'PK', name: 'PK — Politechnika Krakowska' },
  { id: 'UEK', name: 'UEK — Uniwersytet Ekonomiczny w Krakowie' },
]

// Fields up to `price` mirror the backend's CardFetchResponse; the rest has no API yet.
export type SpottedEvent = {
  id: string
  event_name: string
  description: string
  starts_at: string
  address: string
  lat: number
  lng: number
  price: number
  category: CategoryId
  organizer: string
  reason?: string
  // ponytail: % position on the illustrated map, swap for lat/lng once a real map (MapLibre + OSM) lands
  pin: [number, number]
}

// ponytail: mock data until F4 adds src/lib/api.ts with VITE_API_URL
export const EVENTS: SpottedEvent[] = [
  {
    id: 'planszowki',
    event_name: 'Wieczór planszówek w Kawiarni Kości',
    description:
      'Wieczór planszówek w Kawiarni Kości! Wstęp wolny (kto chce, bierze coś do picia), zapraszamy 4–6 osób do stolika. Zapisy w komentarzach.',
    starts_at: '2026-10-08T19:00:00+02:00',
    address: 'ul. Krupnicza 5, Kraków',
    lat: 50.0629,
    lng: 19.9306,
    price: 0,
    category: 'gry',
    organizer: 'Koło Planszówkowe AGH (demo)',
    reason: 'Bo lubisz: planszówki · dziś 19:00',
    pin: [36, 52],
  },
  {
    id: 'robotyka',
    event_name: 'Dzień otwarty koła robotyki',
    description: 'Pokazy robotów, rozmowy z członkami koła i rekrutacja na nowy rok.',
    starts_at: '2026-10-09T17:00:00+02:00',
    address: 'al. Mickiewicza 30, Kraków',
    lat: 50.0647,
    lng: 19.9236,
    price: 0,
    category: 'nauka',
    organizer: 'KN Robotyków AGH (demo)',
    reason: 'Bo lubisz: nauka · jutro 17:00',
    pin: [22, 26],
  },
  {
    id: 'integracja',
    event_name: 'Integracja pierwszoroku',
    description: 'Wieczór zapoznawczy dla pierwszego roku. Muzyka, gry i dużo nowych ludzi.',
    starts_at: '2026-10-09T21:00:00+02:00',
    address: 'ul. Szewska 12, Kraków',
    lat: 50.0621,
    lng: 19.9354,
    price: 15,
    category: 'imprezy',
    organizer: 'Samorząd WEiI (demo)',
    reason: 'Bo lubisz: imprezy · jutro 21:00',
    pin: [52, 30],
  },
  {
    id: 'jam',
    event_name: 'Jam session w piwnicy',
    description: 'Otwarta scena: przynieś instrument albo po prostu posłuchaj.',
    starts_at: '2026-10-10T20:00:00+02:00',
    address: 'ul. Floriańska 3, Kraków',
    lat: 50.0624,
    lng: 19.9396,
    price: 15,
    category: 'muzyka',
    organizer: 'Klub Muzyczny UJ (demo)',
    reason: 'Bo lubisz: muzyka · sob. 20:00',
    pin: [14, 60],
  },
  {
    id: 'bieg',
    event_name: 'Bieg nad Wisłą',
    description: 'Luźne 5 km bulwarami, tempo dla każdego.',
    starts_at: '2026-10-08T10:00:00+02:00',
    address: 'Bulwar Czerwieński, Kraków',
    lat: 50.0525,
    lng: 19.9355,
    price: 0,
    category: 'sport',
    organizer: 'AZS AGH (demo)',
    pin: [28, 80],
  },
  {
    id: 'teatr',
    event_name: 'Studencki wieczór teatralny',
    description: 'Krótkie formy sceniczne grup studenckich.',
    starts_at: '2026-10-08T18:00:00+02:00',
    address: 'ul. Grodzka 52, Kraków',
    lat: 50.0566,
    lng: 19.9373,
    price: 0,
    category: 'kultura',
    organizer: 'Teatr Studencki (demo)',
    pin: [46, 72],
  },
  {
    id: 'cv',
    event_name: 'Warsztaty: CV i LinkedIn',
    description: 'Praktyczne warsztaty z rekruterami.',
    starts_at: '2026-10-08T16:00:00+02:00',
    address: 'ul. Reymonta 17, Kraków',
    lat: 50.0668,
    lng: 19.9137,
    price: 0,
    category: 'warsztaty',
    organizer: 'Biuro Karier AGH (demo)',
    pin: [60, 58],
  },
  {
    id: 'hackathon',
    event_name: 'Mini hackathon AI',
    description: '12 godzin, zespoły 2–4 osoby, pizza w cenie.',
    starts_at: '2026-10-12T09:00:00+02:00',
    address: 'ul. Kawiory 21, Kraków',
    lat: 50.0686,
    lng: 19.9087,
    price: 0,
    category: 'nauka',
    organizer: 'KN Data Science (demo)',
    pin: [8, 36],
  },
]

// Interface is Polish and times are in Europe/Warsaw, e.g. "czw., 8 paź, 19:00".
const dateFmt = new Intl.DateTimeFormat('pl-PL', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'Europe/Warsaw',
})
const timeFmt = new Intl.DateTimeFormat('pl-PL', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Warsaw' })
const dayFmt = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Warsaw' }) // yyyy-mm-dd

export const formatDate = (iso: string) => dateFmt.format(new Date(iso))
export const formatTime = (iso: string) => timeFmt.format(new Date(iso))
export const formatPrice = (price: number) => (price === 0 ? 'Za darmo' : `${price} zł`)
export const warsawDay = (iso: string) => dayFmt.format(new Date(iso))

// ponytail: fixed demo "today" so the mock events show up; use warsawDay(new Date().toISOString()) once data comes from the API
export const TODAY = '2026-10-08'

export type When = 'dzis' | 'tydzien'

/** Today, or the 7 days starting today, counted in Warsaw calendar days. */
export function inRange(startsAt: string, when: When, today = TODAY) {
  const day = warsawDay(startsAt)
  if (when === 'dzis') return day === today
  const diff = (Date.parse(day) - Date.parse(today)) / 86_400_000
  return diff >= 0 && diff < 7
}

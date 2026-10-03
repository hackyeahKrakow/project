// Demo-only data: accounts, organizer stats, packages. Nothing here is real authentication or payment.
import type { Draft } from './api'
import { LIBRARY } from './events'
import type { Account, Profile } from './store'

export const DEMO_PASSWORD = 'demo1234'

export const DEMO_ACCOUNTS: (Account & { profile?: Profile; about: string })[] = [
  {
    email: 'ola@demo',
    name: 'Ola Nowak',
    kind: 'student',
    about: 'Studentka 1. roku na AGH, mieszka w akademiku na Miasteczku.',
    profile: {
      interests: ['gry', 'nauka', 'muzyka'],
      sizes: ['small'],
      goals: ['ludzie', 'oszczedzac'],
      budget: 'upto20',
      distanceKm: 3,
      times: ['wieczory'],
      district: 'Czarna Wieś (Miasteczko AGH)',
    },
  },
  {
    email: 'biblioteka@demo',
    name: 'Marek Wiśniewski',
    kind: 'org',
    org: LIBRARY.name,
    about: 'Dyrektor biblioteki. Trzy filie: Podgórze, Krowodrza, Nowa Huta.',
  },
]

export const findAccount = (email: string, password: string) =>
  DEMO_ACCOUNTS.find((a) => a.email === email.trim().toLowerCase() && password === DEMO_PASSWORD) ?? null

export type Package = { id: string; name: string; price: number; ai: string; stats: string; boost: string; feedback: boolean }
export const PACKAGES: Package[] = [
  { id: 'iskra', name: 'Iskra', price: 10, ai: '1 wydarzenie z AI', stats: 'Wyświetlenia', boost: 'Bez wyróżnienia', feedback: false },
  {
    id: 'plomien',
    name: 'Płomień',
    price: 49,
    ai: '5 wydarzeń z AI',
    stats: 'Wyświetlenia, w prawo, w lewo, pominięte',
    boost: 'Wyróżnienie w talii i na mapie',
    feedback: true,
  },
  {
    id: 'ognisko',
    name: 'Ognisko',
    price: 149,
    ai: 'Bez limitu',
    stats: 'Pełne statystyki i zainteresowania odbiorców',
    boost: 'Mocniejsze wyróżnienie',
    feedback: true,
  },
]
export const ORG_PLAN = { package: 'plomien', aiUsed: 2, aiLimit: 5 }

// Per-event funnel for the library's events: views, right, left, neutral (seen, app closed without a swipe).
export const LIBRARY_STATS: Record<string, { views: number; right: number; left: number; neutral: number }> = {
  evt_noc_bibl: { views: 1240, right: 512, left: 461, neutral: 267 },
  evt_czytelnia: { views: 864, right: 401, left: 318, neutral: 145 },
  evt_autor: { views: 532, right: 141, left: 302, neutral: 89 },
  evt_komiks: { views: 611, right: 238, left: 271, neutral: 102 },
  evt_ksiazka: { views: 298, right: 97, left: 153, neutral: 48 },
  evt_noc_gier: { views: 702, right: 344, left: 251, neutral: 107 },
  evt_zrodla: { views: 415, right: 188, left: 172, neutral: 55 },
}

export const LIBRARY_FEEDBACK = [
  {
    event: 'Cicha czytelnia do 23:00',
    stars: 5,
    text: 'Wreszcie miejsce do nauki wieczorem, które nie jest kawiarnią. Przydałoby się więcej gniazdek przy oknach.',
  },
  { event: 'Spotkanie autorskie: kryminał po krakowsku', stars: 3, text: 'Ciekawa rozmowa, ale zaczęło się 20 minut później i sala była za mała.' },
  { event: 'Noc gier w bibliotece', stars: 5, text: 'Instruktorzy przy stołach to strzał w dziesiątkę, poznałam ekipę na kolejne granie.' },
]

// Top interests of students who swiped right on the library's events (aggregated, anonymous).
export const LIBRARY_AUDIENCE = [
  { label: 'Gry i planszówki', pct: 34 },
  { label: 'Nauka i koła naukowe', pct: 27 },
  { label: 'Kultura', pct: 22 },
  { label: 'Inne', pct: 17 },
]

export const SAMPLE_POST =
  'NOC BIBLIOTEK 📚✨ W piątek od 20:00 do rana zapraszamy do filii na Józefińskiej 20! Escape room w magazynie, quiz o Krakowie, planszówki i ciche czytanie do świtu. Wstęp wolny, liczba miejsc ok. 150. Zapisy na stronie biblioteki.'

/** What the AI fill should look like for SAMPLE_POST; used when POST /events/parse is unavailable. */
export function demoDraft(fridayIso: string): Draft {
  return {
    title: 'Noc bibliotek w filii na Józefińskiej',
    description: 'Escape room w magazynie, quiz o Krakowie, planszówki i ciche czytanie do świtu. Wstęp wolny.',
    category: 'kultura',
    starts_at: fridayIso,
    ends_at: null,
    address: 'ul. Józefińska 20, Kraków',
    price: 0,
    size: 'large',
    missing_fields: ['ends_at', 'size'],
  }
}

import { createContext, useContext } from 'react'
import type { CategoryId } from './categories'
import type { Size, SpottedEvent } from './events'

export type Goal = 'ludzie' | 'nauka' | 'zabawa' | 'ruch' | 'spokoj' | 'oszczedzac'
export type Budget = 'free' | 'upto20' | 'any'
export type TimeOfDay = 'po_zajeciach' | 'wieczory' | 'weekendy'
export type Profile = {
  interests: CategoryId[]
  sizes: Size[] // empty = no preference
  goals: Goal[]
  budget: Budget
  distanceKm: number // 0 = all of Kraków
  times: TimeOfDay[]
  district: string
  stepFree?: boolean // needs step-free venues and journeys (wheelchair, crutches, pram); missing = no
}
export type Account = { email: string; name: string; kind: 'student' | 'org'; org?: string }
export type Decision = 'right' | 'left'

export type State = {
  userId: string
  onboarded: boolean
  consent: boolean // "Rozumiem, zaczynam" on the privacy screen
  profile: Profile
  swipes: Record<string, Decision>
  follows: string[] // organizer ids (US-10)
  location: boolean
  notifications: boolean
  bigText: boolean
  theme: 'system' | 'light' | 'dark'
  highContrast: boolean
  navCollapsed: boolean // sidebar on tablets and laptops
  account: Account | null
  myEvents: SpottedEvent[]
}

/** RFC 9562 UUIDv7: 48-bit ms timestamp, version 7, variant 10, rest random (the backend validates UUID7). */
export function uuid7(now = Date.now()) {
  const b = crypto.getRandomValues(new Uint8Array(16))
  for (let i = 0; i < 6; i++) b[i] = Math.floor(now / 2 ** (8 * (5 - i))) & 0xff
  b[6] = (b[6] & 0x0f) | 0x70
  b[8] = (b[8] & 0x3f) | 0x80
  const h = [...b].map((x) => x.toString(16).padStart(2, '0')).join('')
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`
}

export const EMPTY_PROFILE: Profile = { interests: [], sizes: [], goals: [], budget: 'any', distanceKm: 0, times: [], district: 'Stare Miasto' }

export const fresh = (): State => ({
  userId: uuid7(),
  onboarded: false,
  consent: false,
  profile: EMPTY_PROFILE,
  swipes: {},
  follows: [],
  location: false,
  notifications: false,
  bigText: false,
  theme: 'system',
  highContrast: false,
  navCollapsed: false,
  account: null,
  myEvents: [],
})

const KEY = 'spootted:v1'

// Storage can be missing or throw (private mode, blocked site data): the app still works, it just forgets.
export function load(): State {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return { ...fresh(), ...JSON.parse(raw) }
  } catch {
    /* fall through */
  }
  return fresh()
}

export function save(state: State) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    /* ignore */
  }
}

export type Store = { state: State; update: (patch: Partial<State> | ((s: State) => Partial<State>)) => void; reset: () => void }
export const StoreContext = createContext<Store>(null!)
export const useStore = () => useContext(StoreContext)

import { DISTRICTS, km } from './events.ts'

export type LatLng = [number, number]

const RYNEK = DISTRICTS['Stare Miasto']
const KRAKOW_KM = 25 // farther than this the position can't be a start for a Kraków trip (e.g. IP-based fix on a laptop)
const FRESH_MS = 2 * 60_000

const MESSAGES: Record<number, string> = {
  1: 'Brak zgody na lokalizację. Włącz ją dla tej strony w ustawieniach przeglądarki.',
  2: 'Nie udało się ustalić lokalizacji. Sprawdź, czy usługi lokalizacji są włączone.',
  3: 'Ustalanie lokalizacji trwało za długo. Spróbuj jeszcze raz.',
}

let last: { at: LatLng; time: number } | undefined

/**
 * One position for the whole app: reused for 2 minutes, 10 s timeout, a Polish message when it fails.
 * Every screen asks through here, so the browser prompt shows once and all screens agree on where you are.
 */
export function locate(): Promise<LatLng> {
  if (last && Date.now() - last.time < FRESH_MS) return Promise.resolve(last.at)
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error('Ta przeglądarka nie udostępnia lokalizacji.'))
    navigator.geolocation.getCurrentPosition(
      (p) => {
        last = { at: [p.coords.latitude, p.coords.longitude], time: Date.now() }
        resolve(last.at)
      },
      (e) => reject(new Error(MESSAGES[e.code] ?? MESSAGES[2])),
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: FRESH_MS },
    )
  })
}

export const inKrakow = (at: LatLng) => km(at, RYNEK) <= KRAKOW_KM

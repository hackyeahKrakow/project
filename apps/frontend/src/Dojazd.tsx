import { Accessibility, Bus, Car, ChevronDown, Footprints, LoaderCircle, LocateFixed, Navigation, Radio, TrainFront, TramFront, TriangleAlert, type LucideIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { parkingNear, planRoute, transitNear, type ParkingNear, type RouteLeg, type RoutePlan, type TransitNear } from '@/lib/api'
import { DISTRICTS, at, daysFromToday, formatTime, type SpottedEvent } from '@/lib/events'
import { inKrakow, locate, type LatLng } from '@/lib/geo'
import { useStore } from '@/lib/store'

const MODE: Record<string, [string, LucideIcon]> = {
  WALK: ['Pieszo', Footprints],
  TRAM: ['Tramwaj', TramFront],
  BUS: ['Autobus', Bus],
  RAIL: ['Pociąg', TrainFront],
  SUBURBAN: ['Pociąg', TrainFront],
  REGIONAL_RAIL: ['Pociąg', TrainFront],
}
const mode = (m: string) => MODE[m] ?? ['Komunikacja', Bus]
// The city's own map of on-street spaces for people with disabilities (ZDMK, linked from zdmk.krakow.pl).
const ZDMK_MAP = 'https://gmk-2.maps.arcgis.com/apps/instant/nearby/index.html?appid=57ff3986574a4c26a9d0466e0870b9b3'

/** Same loading pattern as the rest of the card: keep the answer only for the event it was asked for. */
function useFor<T>(ev: SpottedEvent, load: (ev: SpottedEvent) => Promise<T | null>, enabled = true) {
  const [got, setGot] = useState<{ id: string; data: T | null }>()
  useEffect(() => {
    if (!enabled) return
    let live = true
    load(ev).then((data) => live && setGot({ id: ev.id, data }))
    return () => {
      live = false
    }
  }, [ev.id, enabled]) // eslint-disable-line react-hooks/exhaustive-deps -- one request per event
  return got?.id === ev.id ? got.data : null
}

/**
 * How to get to the event: nearest stops and ZTP disruptions, a journey that arrives before the start (Transitous over
 * the ZTP timetable, with low-floor trams marked) and, for drivers, car parks with spaces for people with disabilities.
 */
export function Dojazd({ ev }: { ev: SpottedEvent }) {
  const { state } = useStore()
  const stepFree = !!state.profile.stepFree
  const [carOpen, setCarOpen] = useState(stepFree)
  const near = useFor<TransitNear>(ev, (e) => transitNear(e.lat, e.lng))
  const parking = useFor<ParkingNear>(ev, (e) => parkingNear(e.lat, e.lng), carOpen)

  return (
    <section aria-labelledby={`dojazd-${ev.id}`} className="flex flex-col gap-2.5 border-t border-line pt-3">
      <h3 id={`dojazd-${ev.id}`} className="font-semibold">
        Dojazd
      </h3>
      {!!near?.stops.length && (
        <div className="flex flex-col gap-1.5 text-[15px] text-muted">
          {near.stops.map((s) => {
            const [label, Icon] = mode(s.mode === 'tram' ? 'TRAM' : 'BUS')
            return (
              <div key={s.mode} className="flex items-center gap-2">
                <Icon size={18} aria-hidden />
                <span>
                  <span className="sr-only">{`Przystanek, ${label.toLowerCase()}: `}</span>
                  {s.name} · {s.distance_m} m
                </span>
              </div>
            )
          })}
        </div>
      )}
      {!!near?.alerts.length && (
        <div className="flex flex-col gap-1.5 rounded-xl border border-spark-500 bg-spark-50 px-3.5 py-2.5 text-sm">
          <span className="flex items-center gap-1.5 font-semibold">
            <TriangleAlert size={16} aria-hidden />
            Utrudnienia w pobliżu (ZTP Kraków)
          </span>
          {near.alerts.slice(0, 3).map((a) => (
            <p key={a.header + a.description}>
              <span className="font-medium">{a.header}</span>
              {a.description && <span className="line-clamp-2 text-muted">{a.description}</span>}
            </p>
          ))}
        </div>
      )}

      <Journey key={ev.id} ev={ev} stepFree={stepFree} />

      <details className="group rounded-xl border border-line" open={carOpen} onToggle={(e) => setCarOpen(e.currentTarget.open)}>
        <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 px-3.5 font-semibold">
          <Car size={18} aria-hidden />
          Autem: parkingi{stepFree ? ' i miejsca dla osób z niepełnosprawnością' : ''}
          <ChevronDown size={16} className="ml-auto transition-transform group-open:rotate-180" aria-hidden />
        </summary>
        <div className="flex flex-col gap-2 px-3.5 pb-3 text-sm">
          {!parking ? (
            <p className="text-muted">{carOpen ? 'Szukam parkingów…' : ''}</p>
          ) : (
            <Parkings data={parking} stepFree={stepFree} />
          )}
          <a href={ZDMK_MAP} target="_blank" rel="noreferrer" className="flex min-h-11 items-center gap-1.5 font-medium text-link underline">
            <Accessibility size={16} aria-hidden />
            Miejska mapa miejsc dla osób z niepełnosprawnością (ZDMK)
          </a>
        </div>
      </details>
    </section>
  )
}

type Planned = { plan: RoutePlan | null; from: string; arrive: string; arriveBy: boolean; fromDistrict: boolean }

/**
 * "Zaplanuj dojazd": from your position (or your district), arriving 10 min before the start (15 min step-free).
 * The arrival time is an editable field: the backend catalog has no start times yet (00:00 = unknown), and people
 * may want to come earlier anyway.
 */
function Journey({ ev, stepFree }: { ev: SpottedEvent; stepFree: boolean }) {
  const { state, update } = useStore()
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<Planned>()
  const bufferMin = stepFree ? 15 : 10
  const known = formatTime(ev.starts_at) !== '00:00'
  const [arrival, setArrival] = useState(() => (known ? formatTime(new Date(Date.parse(ev.starts_at) - bufferMin * 60_000).toISOString()) : '18:00'))
  const fieldId = `przyjazd-${ev.id}`

  // Location off = the person's choice: plan from their district and offer an explicit "use my location" button.
  const plan = async (useLocation = state.location) => {
    setBusy(true)
    const target = at(Math.max(0, daysFromToday(ev.starts_at)), arrival) // multi-day events that are already on: today
    const started = Date.parse(target) < Date.now() // that time has passed: leave now instead
    const district = state.profile.district
    let from: LatLng = DISTRICTS[district] ?? DISTRICTS['Stare Miasto']
    let fromLabel = `z dzielnicy ${district}`
    let fromDistrict = true
    if (useLocation)
      try {
        const at = await locate()
        if (!state.location) update({ location: true }) // they just tapped "use my location" and allowed it
        if (inKrakow(at)) [from, fromLabel, fromDistrict] = [at, 'z twojej lokalizacji', false]
        else fromLabel += ' (jesteś poza Krakowem)'
      } catch (e) {
        fromLabel += ` (${(e as Error).message})`
      }
    const time = started ? new Date().toISOString() : target
    const got = await planRoute(from, [ev.lat, ev.lng], time, !started, stepFree)
    setResult({ plan: got, from: fromLabel, arrive: arrival, arriveBy: !started, fromDistrict })
    setBusy(false)
  }

  const best = result?.plan?.options[0]
  return (
    <div className="flex flex-col gap-2" aria-live="polite">
      <div className="flex flex-col gap-1.5">
        <div className="flex items-end gap-2">
          <label htmlFor={fieldId} className="flex flex-col gap-1 text-sm font-medium">
            Na miejscu o
            <input
              id={fieldId}
              type="time"
              value={arrival}
              onChange={(e) => (setArrival(e.target.value), setResult(undefined))}
              className="h-12 w-36 rounded-xl border-line bg-surface px-3 text-base focus:border-link focus:ring-link"
            />
          </label>
          <button
            type="button"
            onClick={() => plan()}
            disabled={busy || !arrival}
            className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-[14px] bg-brand-50 px-4 font-semibold text-brand-700 disabled:opacity-60"
          >
            {busy ? <LoaderCircle size={18} className="animate-spin" aria-hidden /> : <Navigation size={18} aria-hidden />}
            {busy ? 'Liczę trasę…' : 'Zaplanuj dojazd'}
          </button>
        </div>
        <p className="text-[13px] text-muted">
          {known ? `${bufferMin} min przed startem${stepFree ? ', z zapasem na wejście bez barier' : ''}.` : 'Organizator nie podał godziny. Ustaw, na którą chcesz dojechać.'}
        </p>
      </div>
      {result && !result.plan && <p className="text-sm text-muted">Planer tras jest teraz niedostępny. Użyj przycisku „Nawiguj”.</p>}
      {result?.plan && (
        <div className="flex flex-col gap-2 rounded-xl border border-line px-3.5 py-3 text-sm">
          <p className="text-muted">
            {result.from}, {result.arriveBy ? `na miejscu do ${result.arrive}` : 'ta godzina już minęła, więc wyjazd teraz'}
            {stepFree && ', trasy bez schodów'}
          </p>
          {result.fromDistrict && !busy && (
            <button type="button" onClick={() => plan(true)} className="flex min-h-11 items-center gap-1.5 self-start font-medium text-link underline">
              <LocateFixed size={16} aria-hidden />
              Licz od mojej lokalizacji
            </button>
          )}
          {best ? (
            <>
              <p className="text-[15px] font-semibold">
                {bestWay(best.legs, result.plan.walk_minutes, best.minutes)} · wyjdź o {formatTime(best.start)}, na miejscu {formatTime(best.end)}
              </p>
              <ol className="flex flex-col gap-1.5">
                {best.legs.map((leg, i) => (
                  <Leg key={i} leg={leg} stepFree={stepFree} />
                ))}
              </ol>
              {result.plan.options.length > 1 && (
                <div className="flex flex-col gap-1 border-t border-line pt-2 text-muted">
                  <span className="font-medium text-fg">Inne opcje</span>
                  {result.plan.options.slice(1).map((o) => (
                    <span key={o.start + o.end}>
                      {formatTime(o.start)} → {formatTime(o.end)} ·{' '}
                      {o.legs
                        .filter((l) => l.mode !== 'WALK')
                        .map((l) => `${mode(l.mode)[0].toLowerCase()} ${l.line ?? ''}`.trim())
                        .join(', ') || 'pieszo'}{' '}
                      · {o.minutes} min
                    </span>
                  ))}
                </div>
              )}
            </>
          ) : result.plan.walk_minutes != null ? (
            <p className="text-[15px] font-semibold">Najlepiej pieszo: {result.plan.walk_minutes} min</p>
          ) : (
            <p>Nie znalazłem połączenia na tę godzinę.</p>
          )}
          {best && result.plan.walk_minutes != null && <p className="text-muted">Pieszo cała trasa: {result.plan.walk_minutes} min.</p>}
          <p className="text-[12px] text-muted">Rozkłady i opóźnienia na żywo: ZTP Kraków. Trasy: Transitous.</p>
        </div>
      )}
    </div>
  )
}

/** "Najlepiej dziś: tramwaj 4" — the answer to "how do I get there today", in one line. */
function bestWay(legs: RouteLeg[], walk: number | null, minutes: number) {
  const rides = legs.filter((l) => l.mode !== 'WALK').map((l) => `${mode(l.mode)[0].toLowerCase()} ${l.line ?? ''}`.trim())
  if (!rides.length || (walk != null && walk <= minutes)) return 'Najlepiej pieszo'
  return `Najlepiej: ${rides.join(' + ')}`
}

function Leg({ leg, stepFree }: { leg: RouteLeg; stepFree: boolean }) {
  const [label, Icon] = mode(leg.mode)
  if (leg.mode === 'WALK')
    return (
      <li className="flex items-center gap-2 text-muted">
        <Icon size={16} aria-hidden />
        {leg.minutes} min pieszo{['START', 'END'].includes(leg.to_name) ? '' : ` do: ${leg.to_name}`}
      </li>
    )
  const vehicle = leg.mode === 'TRAM' ? 'tramwaj' : 'pojazd'
  return (
    <li className="flex items-start gap-2">
      <Icon size={16} className="mt-0.5 flex-none" aria-hidden />
      <span className="flex flex-col">
        <span className="font-medium">
          {label} {leg.line}
          {leg.headsign && ` → ${leg.headsign}`} · {formatTime(leg.start)}–{formatTime(leg.end)}
          {leg.realtime && (
            <span className="ml-1.5 inline-flex items-center gap-0.5 text-[12px] font-normal text-link">
              <Radio size={12} aria-hidden />
              na żywo
            </span>
          )}
        </span>
        <span className="text-muted">
          {leg.from_name} → {leg.to_name}
        </span>
        {leg.low_floor === true && (
          <span className="flex items-center gap-1 text-[13px] font-medium text-brand-700">
            <Accessibility size={14} aria-hidden />
            {leg.mode === 'TRAM' ? 'Tramwaj niskopodłogowy' : 'Niska podłoga, wjazd wózkiem'}
          </span>
        )}
        {leg.low_floor === false && (
          <span className="flex items-center gap-1 text-[13px] font-medium">
            <TriangleAlert size={14} aria-hidden />
            {leg.mode === 'TRAM' ? 'Tramwaj wysokopodłogowy, stopnie przy wejściu' : 'Pojazd ze stopniami przy wejściu'}
          </span>
        )}
        {leg.low_floor === null && stepFree && <span className="text-[13px] text-muted">Brak danych, czy {vehicle} ma niską podłogę</span>}
      </span>
    </li>
  )
}

function Parkings({ data, stepFree }: { data: ParkingNear; stepFree: boolean }) {
  // Step-free: car parks with spaces for people with disabilities first, then by distance.
  const list = stepFree ? [...data.parkings].sort((a, b) => Number(!!b.has_disabled_spaces) - Number(!!a.has_disabled_spaces)) : data.parkings
  const street =
    data.disabled_spaces > 0 ? (
      <p className={stepFree ? 'font-medium' : 'text-muted'}>
        Miejsca dla osób z niepełnosprawnością przy ulicy: {data.disabled_spaces} w promieniu 400 m
        {data.nearest_disabled_m != null && `, najbliższe ${data.nearest_disabled_m} m`}.
      </p>
    ) : null
  return (
    <>
      {stepFree && street}
      {list.length ? (
        <ul className="flex flex-col gap-1.5">
          {list.map((p) => (
            <li key={`${p.lat},${p.lng}`}>
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}&travelmode=driving`}
                target="_blank"
                rel="noreferrer"
                className="flex flex-col rounded-lg py-1 hover:bg-canvas"
              >
                <span className="font-medium text-link underline">
                  {p.name}
                  {p.park_ride && ' (P+R)'} · {p.distance_m} m
                </span>
                <span className="text-muted">
                  {[
                    p.capacity && `${p.capacity} miejsc`,
                    p.disabled_spaces ? `${p.disabled_spaces} dla osób z niepełnosprawnością` : p.has_disabled_spaces ? 'są miejsca dla osób z niepełnosprawnością' : null,
                    p.fee === true ? 'płatny' : p.fee === false ? 'bezpłatny' : null,
                  ]
                    .filter(Boolean)
                    .join(' · ') || 'brak szczegółów w OpenStreetMap'}
                </span>
              </a>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-muted">Brak publicznych parkingów w promieniu 800 m w OpenStreetMap.</p>
      )}
      {!stepFree && street}
      <p className="text-[12px] text-muted">Parkingi: © współtwórcy OpenStreetMap. Liczba wolnych miejsc nie jest znana.</p>
    </>
  )
}

import { BadgeCheck, CalendarPlus, Calendar, Compass, Heart, Map as MapIcon, MapPin, Megaphone, Plus, UserRound, Users, X } from 'lucide-react'
import { GeolocateControl, Map as MapLibre, Marker, setWorkerUrl } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import iconUrl from '@/assets/icon.svg'
import logoUrl from '@/assets/logo-full.svg'
// MapLibre finds its module worker next to its own file, which Vite moves; hand it the bundled worker instead.
import maplibreWorker from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'
import { useEffect, useReducer, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { type Category, category } from '@/lib/categories'
import { SIZE_LABEL, formatDate, formatPrice, type SpottedEvent } from '@/lib/events'
import { downloadIcs } from '@/lib/ics'

// Preline "Buttons" styled with spootted tokens.
export const btn =
  'inline-flex items-center justify-center gap-2 rounded-[14px] px-5 font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 disabled:opacity-50'
export const btnPrimary = `${btn} bg-brand-600 text-white hover:bg-brand-600/90`
// Orange (Iskra) is only ever a fill with ink text, never a text color.
export const btnSpark = `${btn} bg-spark-500 text-ink-900 hover:bg-spark-500/90`
export const btnOutline = `${btn} border border-line bg-white text-ink-900 hover:bg-canvas`
// Preline "Card".
export const card = 'rounded-[20px] border border-line bg-white'
// Pill chip for filters and onboarding answers (min. 44 px).
export const chip = (on: boolean) =>
  `flex min-h-11 flex-none items-center gap-1.5 rounded-full border px-4 text-[15px] font-medium ${
    on ? 'border-ink-900 bg-ink-900 text-white' : 'border-line bg-white text-ink-900'
  }`

/** The Canva export is a square with the wordmark in a band through the middle, so the image is cropped with object-fit. */
export function Logo({ height = 36, className = '' }: { height?: number; className?: string }) {
  return <img src={logoUrl} alt="spootted" width={Math.round(height * 3.2)} height={height} className={`object-cover ${className}`} />
}

// Preline "Badge": category color at 12% behind a full-color Lucide icon.
export function CategoryBadge({ cat, onDark = false, className = 'text-xs' }: { cat: Category; onDark?: boolean; className?: string }) {
  // Category = color + icon + name; color is never the only carrier.
  return (
    <span
      className={`inline-flex w-fit items-center gap-1.5 rounded-full py-1 pr-2.5 pl-2 leading-tight font-medium text-ink-900 ${className}`}
      style={{ background: onDark ? '#fff' : `${cat.color}1F` }}
    >
      <cat.Icon size={15} color={cat.color} strokeWidth={2.2} aria-hidden />
      {cat.name}
    </span>
  )
}

/** Stand-in for the 16:9 event image: category color with a large icon (docs/DESIGN.md). */
export function Thumb({ cat, iconSize, className }: { cat: Category; iconSize: number; className: string }) {
  return (
    <div className={`flex flex-none items-center justify-center ${className}`} style={{ background: cat.color }}>
      <cat.Icon size={iconSize} color="#fff" strokeWidth={iconSize > 40 ? 1.6 : 2} aria-hidden />
    </div>
  )
}

export function OrganizerLine({ ev, className = 'text-[13px] text-muted' }: { ev: SpottedEvent; className?: string }) {
  const { organizer: o } = ev
  return (
    <span className={`flex items-center gap-1.5 ${className}`}>
      {o.kind === 'student' ? <Users size={16} aria-hidden /> : o.verified && <BadgeCheck size={16} className="text-brand-600" aria-label="zweryfikowane" />}
      {o.name}
      {o.kind === 'student' && <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[11px] font-semibold text-violet-600">od studenta</span>}
    </span>
  )
}

export function PromotedTag() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-spark-500 px-2 py-0.5 text-[11px] font-semibold text-ink-900">
      <Megaphone size={12} aria-hidden />
      Promowane
    </span>
  )
}

// Preline "Card", order from docs/DESIGN.md: image → title → badge → date → address → price → organizer → description.
export function EventCard({ ev, liked, onLike }: { ev: SpottedEvent; liked: boolean; onLike: () => void }) {
  const c = category(ev.category)
  return (
    <article className="flex flex-col">
      <Thumb cat={c} iconSize={56} className="aspect-[16/7] w-full" />
      <div className="flex flex-col gap-2.5 p-4">
        <div className="flex items-start justify-between gap-2">
          <h2 className="text-xl leading-tight font-semibold">{ev.event_name}</h2>
          {ev.promoted && <PromotedTag />}
        </div>
        <div className="flex flex-wrap gap-1.5">
          <CategoryBadge cat={c} className="text-[13px]" />
          <span className="rounded-full bg-track px-2.5 py-1 text-[13px] font-medium">{SIZE_LABEL[ev.size]}</span>
        </div>
        <div className="flex flex-col gap-1.5 text-[15px]">
          <div className="flex items-center gap-2">
            <Calendar size={18} aria-hidden />
            {formatDate(ev.starts_at)}
          </div>
          <div className="flex items-center gap-2 text-muted">
            <MapPin size={18} aria-hidden />
            {ev.address}
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="rounded-lg bg-brand-50 px-2.5 py-0.5 text-sm font-semibold text-brand-700">{formatPrice(ev.price)}</span>
          <OrganizerLine ev={ev} />
        </div>
        <p className="text-sm leading-relaxed text-muted">{ev.description}</p>
        <div className="flex gap-2">
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${ev.lat},${ev.lng}`}
            target="_blank"
            rel="noreferrer"
            className={`${btnOutline} h-12 flex-1 px-3 text-[15px]`}
          >
            <MapPin size={18} strokeWidth={2.2} aria-hidden />
            Dojazd
          </a>
          <button type="button" onClick={() => downloadIcs([ev], `${ev.id}.ics`)} className={`${btnOutline} h-12 flex-1 px-3 text-[15px]`}>
            <CalendarPlus size={18} strokeWidth={2.2} aria-hidden />
            Kalendarz
          </button>
          <button
            type="button"
            onClick={onLike}
            aria-pressed={liked}
            aria-label={liked ? 'Usuń z Moje' : 'Zapisz w Moje'}
            className="flex h-12 w-12 flex-none items-center justify-center rounded-[14px] bg-brand-600"
          >
            <Heart size={22} color="#fff" fill={liked ? '#fff' : 'none'} aria-hidden />
          </button>
        </div>
      </div>
    </article>
  )
}

/** Bottom sheet on phones, floating side panel from tablet up. Focus moves in on open and back to the opener on close. */
export function Sheet({ open, onClose, label, children }: { open: boolean; onClose: () => void; label: string; children: ReactNode }) {
  const close = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (!open) return
    const opener = document.activeElement as HTMLElement | null
    close.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      if (opener?.isConnected) opener.focus()
    }
  }, [open, onClose])
  if (!open) return null
  return (
    <div
      role="dialog"
      aria-label={label}
      className="absolute inset-x-0 bottom-0 z-30 max-h-[78%] overflow-y-auto rounded-t-[22px] bg-white shadow-[0_-12px_32px_rgba(10,31,68,.22)] sm:inset-x-auto sm:top-4 sm:right-4 sm:bottom-4 sm:max-h-none sm:w-[400px] sm:rounded-[22px] sm:shadow-[0_12px_32px_rgba(10,31,68,.22)]"
    >
      <button
        ref={close}
        type="button"
        onClick={onClose}
        className="absolute top-3 right-3 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/90"
        aria-label="Zamknij"
      >
        <X size={22} aria-hidden />
      </button>
      {children}
    </div>
  )
}

export function Toggle({ label, hint, on, onChange }: { label: string; hint?: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex min-h-11 cursor-pointer items-center justify-between gap-4 py-2">
      <span className="flex flex-col">
        <span className="font-medium">{label}</span>
        {hint && <span className="text-[13px] text-muted">{hint}</span>}
      </span>
      <input type="checkbox" role="switch" checked={on} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
      {/* Off track is #6B7A99 so the switch state stays visible (3:1 against white, WCAG 1.4.11). */}
      <span className="relative h-7 w-12 flex-none rounded-full bg-[#6B7A99] transition-colors peer-checked:bg-brand-600 peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand-600 after:absolute after:top-1 after:left-1 after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-transform peer-checked:after:translate-x-5" />
    </label>
  )
}

/** Page frame: one column on phones, centered and wider on tablets and laptops. */
export function Screen({
  title,
  sub,
  action,
  wide = false,
  children,
}: {
  title: string
  sub?: ReactNode
  action?: ReactNode
  wide?: boolean
  children: ReactNode
}) {
  return (
    <div className={`mx-auto flex w-full flex-col gap-4 px-4 pt-5 pb-8 sm:px-8 sm:pt-8 ${wide ? 'max-w-6xl' : 'max-w-3xl'}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-[26px] leading-tight font-semibold tracking-[-0.02em] sm:text-[32px]">{title}</h1>
          {sub && <p className="text-[15px] text-muted">{sub}</p>}
        </div>
        {action}
      </div>
      {children}
    </div>
  )
}

export const NAV = [
  { route: 'mapa', label: 'Mapa', Icon: MapIcon },
  { route: 'odkrywaj', label: 'Odkrywaj', Icon: Compass },
  { route: 'moje', label: 'Moje', Icon: Heart },
  { route: 'konto', label: 'Konto', Icon: UserRound },
]

/** Phones: tab bar at the bottom. */
export function BottomNav({ route }: { route: string }) {
  return (
    <nav className="flex flex-none border-t border-line bg-white pb-[env(safe-area-inset-bottom)] sm:hidden" aria-label="Główna">
      {NAV.map(({ route: r, label, Icon }) => {
        const on = route === r
        return (
          <a
            key={r}
            href={`#/${r}`}
            aria-current={on ? 'page' : undefined}
            className={`flex h-16 flex-1 flex-col items-center justify-center gap-1 text-xs ${on ? 'font-semibold text-brand-600' : 'font-medium text-muted'}`}
          >
            <span className={`flex h-8 w-14 items-center justify-center rounded-full ${on ? 'bg-brand-50' : ''}`}>
              <Icon size={22} fill={on && r === 'moje' ? 'currentColor' : 'none'} aria-hidden />
            </span>
            {label}
          </a>
        )
      })}
    </nav>
  )
}

/** Tablets: icon rail on the left; laptops: sidebar with logo, labels and "Dodaj wydarzenie". */
export function SideNav({ route, canAdd }: { route: string; canAdd: boolean }) {
  return (
    <nav className="hidden w-24 flex-none flex-col gap-2 border-r border-line bg-white px-2 py-5 sm:flex md:w-64 md:px-4" aria-label="Główna">
      <a href="#/start" className="mb-4 flex justify-center md:justify-start md:px-2" aria-label="spootted, strona powitalna">
        <img src={iconUrl} alt="" width={44} height={44} className="md:hidden" />
        <Logo height={40} className="hidden md:block" />
      </a>
      {NAV.map(({ route: r, label, Icon }) => {
        const on = route === r
        return (
          <a
            key={r}
            href={`#/${r}`}
            aria-current={on ? 'page' : undefined}
            className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl text-xs md:flex-row md:justify-start md:gap-3 md:px-4 md:text-base ${
              on ? 'bg-brand-50 font-semibold text-brand-700' : 'font-medium text-muted hover:bg-canvas'
            }`}
          >
            <Icon size={22} fill={on && r === 'moje' ? 'currentColor' : 'none'} aria-hidden />
            {label}
          </a>
        )
      })}
      {canAdd && (
        <a href="#/dodaj" className={`${btnSpark} mt-3 h-12 px-0 md:px-5`} aria-label="Dodaj wydarzenie">
          <Plus size={20} aria-hidden />
          <span className="hidden md:inline">Dodaj wydarzenie</span>
        </a>
      )}
    </nav>
  )
}

function Pin({ ev, liked, selected, onClick }: { ev: SpottedEvent; liked: boolean; selected: boolean; onClick?: () => void }) {
  const cat = category(ev.category)
  const size = selected ? 50 : liked ? 44 : 34
  const badge = 'absolute -top-[7px] -right-[7px] flex h-[22px] w-[22px] items-center justify-center rounded-full border-2 border-white bg-spark-500'
  // The button is at least 44 px for touch (WCAG 2.5.5); the colored circle inside can be smaller.
  return (
    <button
      type="button"
      onClick={onClick}
      tabIndex={onClick ? 0 : -1}
      aria-label={`${ev.event_name}${liked ? ' (polubione)' : ''}${ev.promoted ? ' (promowane)' : ''}`}
      aria-pressed={onClick ? selected : undefined}
      className="flex min-h-11 min-w-11 items-center justify-center rounded-full"
    >
      <span
        className="relative flex items-center justify-center rounded-full border-[3px] border-white transition-[width,height]"
        style={{
          width: size,
          height: size,
          background: cat.color,
          opacity: liked || selected || ev.promoted ? 1 : 0.85,
          boxShadow: liked || selected ? '0 0 0 3px #0A1F44,0 4px 10px rgba(10,31,68,.3)' : '0 3px 8px rgba(10,31,68,.28)',
        }}
      >
        <cat.Icon size={size * 0.46} color="#fff" strokeWidth={2.2} aria-hidden />
        {liked ? (
          <span className={badge}>
            <Heart size={11} fill="#0A1F44" color="#0A1F44" aria-hidden />
          </span>
        ) : (
          ev.promoted && (
            <span className={badge}>
              <Megaphone size={11} color="#0A1F44" aria-hidden />
            </span>
          )
        )}
      </span>
    </button>
  )
}

setWorkerUrl(maplibreWorker)

// Vector OSM tiles without a key; we drop POI and house-number layers so only our pins show (docs/DESIGN.md).
const STYLE = 'https://tiles.openfreemap.org/styles/positron'
const RYNEK: [number, number] = [19.9372, 50.0614] // lng, lat
// Polish labels for the MapLibre controls we show (screen readers read them).
const MAP_LOCALE = {
  'GeolocateControl.FindMyLocation': 'Pokaż moją lokalizację',
  'GeolocateControl.LocationNotAvailable': 'Lokalizacja niedostępna',
  'Map.Title': 'Mapa wydarzeń w Krakowie. Te same wydarzenia są dostępne jako lista.',
}

/** MapLibre GL map of Kraków with category pins rendered by React into marker elements. */
export function EventMap({
  events,
  liked,
  selectedId,
  onSelect,
  locate = false,
  interactive = true,
  zoom = 13,
  className = '',
}: {
  events: SpottedEvent[]
  liked: Set<string>
  selectedId?: string
  onSelect?: (id: string) => void
  locate?: boolean
  interactive?: boolean
  zoom?: number
  className?: string
}) {
  const box = useRef<HTMLDivElement>(null)
  const map = useRef<MapLibre | null>(null)
  const markers = useRef(new Map<string, Marker>())
  const [, rerender] = useReducer((n: number) => n + 1, 0)
  const [mapVersion, setMapVersion] = useState(0) // a new map (e.g. locate toggled) needs new markers

  useEffect(() => {
    const m = new MapLibre({
      container: box.current!,
      style: STYLE,
      center: RYNEK,
      zoom,
      interactive,
      attributionControl: { compact: true },
      locale: MAP_LOCALE,
    })
    m.once('load', () => {
      for (const layer of m.getStyle().layers) if (/poi|housenumber/.test(layer.id)) m.removeLayer(layer.id)
    })
    if (locate) m.addControl(new GeolocateControl({ positionOptions: { enableHighAccuracy: true }, trackUserLocation: false }), 'top-right')
    map.current = m
    setMapVersion((v) => v + 1)
    const all = markers.current
    return () => {
      all.clear()
      m.remove()
    }
  }, [interactive, locate, zoom])

  useEffect(() => {
    const m = map.current!
    const cur = markers.current
    const ids = new Set(events.map((e) => e.id))
    for (const [id, mk] of cur) {
      if (!ids.has(id)) {
        mk.remove()
        cur.delete(id)
      }
    }
    for (const ev of events) {
      if (!cur.has(ev.id)) cur.set(ev.id, new Marker({ element: document.createElement('div') }).setLngLat([ev.lng, ev.lat]).addTo(m))
      cur.get(ev.id)!.getElement().style.zIndex = ev.id === selectedId ? '3' : liked.has(ev.id) ? '2' : '1'
    }
    rerender()
  }, [events, liked, selectedId, mapVersion])

  useEffect(() => {
    const ev = events.find((e) => e.id === selectedId)
    if (ev && map.current) map.current.easeTo({ center: [ev.lng, ev.lat], offset: [0, -110], duration: 500 })
  }, [selectedId]) // eslint-disable-line react-hooks/exhaustive-deps -- only when the selection changes

  return (
    <div ref={box} className={`relative bg-map ${className}`}>
      {events.map((ev) => {
        const mk = markers.current.get(ev.id)
        return (
          mk &&
          createPortal(
            <Pin ev={ev} liked={liked.has(ev.id)} selected={ev.id === selectedId} onClick={onSelect && (() => onSelect(ev.id))} />,
            mk.getElement(),
            ev.id,
          )
        )
      })}
    </div>
  )
}

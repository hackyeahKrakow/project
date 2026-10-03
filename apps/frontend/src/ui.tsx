import { BadgeCheck, CalendarPlus, Calendar, Compass, Heart, Map as MapIcon, MapPin, Megaphone, UserRound, Users, X } from 'lucide-react'
import { GeolocateControl, Map as MapLibre, Marker, setWorkerUrl } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
// MapLibre finds its module worker next to its own file, which Vite moves; hand it the bundled worker instead.
import maplibreWorker from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'
import { useEffect, useReducer, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { type Category, category } from '@/lib/categories'
import { SIZE_LABEL, formatDate, formatPrice, type SpottedEvent } from '@/lib/events'
import { downloadIcs } from '@/lib/ics'

// Preline "Buttons" styled with spotted tokens.
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

const FLAG_LIGHT = ['#0A1F44', '#7DB8FF', '#1D5CFF', '#6B4EE6', '#FF8A3D']
const FLAG_DARK = ['#FFFFFF', '#9CCBFF', '#4C8DFF', '#A58BFF', '#FF8A3D']
const WAVES = [
  'M10 6 C40 -2 70 14 100 6 C130 -2 140 2 150 6 L150 20 C140 16 130 12 100 20 C70 28 40 12 10 20Z',
  'M10 20 C40 12 70 28 100 20 C130 12 140 16 150 20 L150 34 C140 30 130 26 100 34 C70 42 40 26 10 34Z',
  'M10 34 C40 26 70 42 100 34 C130 26 140 30 150 34 L150 48 C140 44 130 40 100 48 C70 56 40 40 10 48Z',
  'M10 48 C40 40 70 56 100 48 C130 40 140 44 150 48 L150 62 C140 58 130 54 100 62 C70 70 40 54 10 62Z',
]

export function Flag({ width = 26, dark = false }: { width?: number; dark?: boolean }) {
  const [pole, ...stripes] = dark ? FLAG_DARK : FLAG_LIGHT
  return (
    <svg width={width} height={(width * 84) / 160} viewBox="0 -6 160 84" fill="none" aria-hidden="true">
      <line x1="5" y1="-3" x2="5" y2="77" stroke={pole} strokeWidth="5" strokeLinecap="round" />
      {WAVES.map((d, i) => (
        <path key={i} d={d} fill={stripes[i]} stroke={stripes[i]} strokeWidth="0.8" strokeLinejoin="round" />
      ))}
    </svg>
  )
}

export function Logo({ size = 26, dark = false }: { size?: number; dark?: boolean }) {
  return (
    <span className={`flex items-end gap-1.5 ${dark ? 'text-white' : 'text-ink-900'}`}>
      <span className="leading-none font-semibold tracking-[-0.03em]" style={{ fontSize: size }}>
        spotted <span className="font-normal opacity-70">student</span>
      </span>
      <Flag width={size * 0.9} dark={dark} />
    </span>
  )
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
          <h3 className="text-xl leading-tight font-semibold">{ev.event_name}</h3>
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
          <span className="rounded-lg bg-brand-50 px-2.5 py-0.5 text-sm font-semibold text-brand-600">{formatPrice(ev.price)}</span>
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

/** Bottom sheet inside the phone frame (Preline Offcanvas look, plain React). */
export function Sheet({ open, onClose, label, children }: { open: boolean; onClose: () => void; label: string; children: ReactNode }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])
  if (!open) return null
  return (
    <div role="dialog" aria-label={label} className="absolute inset-x-0 bottom-0 z-30 max-h-[78%] overflow-y-auto rounded-t-[22px] bg-white shadow-[0_-12px_32px_rgba(10,31,68,.22)]">
      <button type="button" onClick={onClose} className="absolute top-3 right-3 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/90" aria-label="Zamknij">
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
      <span className="relative h-7 w-12 flex-none rounded-full bg-track transition-colors peer-checked:bg-brand-600 peer-focus-visible:outline-2 peer-focus-visible:outline-brand-600 after:absolute after:top-1 after:left-1 after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-transform peer-checked:after:translate-x-5" />
    </label>
  )
}

export function Screen({ title, sub, action, children }: { title: string; sub?: ReactNode; action?: ReactNode; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-4 px-4 pt-5 pb-8">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-[26px] leading-tight font-semibold tracking-[-0.02em]">{title}</h1>
          {sub && <p className="text-[15px] text-muted">{sub}</p>}
        </div>
        {action}
      </div>
      {children}
    </div>
  )
}

const NAV = [
  { route: 'mapa', label: 'Mapa', Icon: MapIcon },
  { route: 'odkrywaj', label: 'Odkrywaj', Icon: Compass },
  { route: 'moje', label: 'Moje', Icon: Heart },
  { route: 'konto', label: 'Konto', Icon: UserRound },
]

export function BottomNav({ route }: { route: string }) {
  return (
    <nav className="flex flex-none border-t border-line bg-white pb-[env(safe-area-inset-bottom)]" aria-label="Główna">
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

function Pin({ ev, liked, selected, onClick }: { ev: SpottedEvent; liked: boolean; selected: boolean; onClick?: () => void }) {
  const cat = category(ev.category)
  const size = selected ? 50 : liked ? 44 : 34
  return (
    <button
      type="button"
      onClick={onClick}
      tabIndex={onClick ? 0 : -1}
      aria-label={`${ev.event_name}${liked ? ' (polubione)' : ''}`}
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
      {liked && (
        <span className="absolute -top-[7px] -right-[7px] flex h-[22px] w-[22px] items-center justify-center rounded-full border-2 border-white bg-spark-500">
          <Heart size={11} fill="#0A1F44" color="#0A1F44" aria-hidden />
        </span>
      )}
      {ev.promoted && !liked && (
        <span className="absolute -top-[7px] -right-[7px] flex h-[22px] w-[22px] items-center justify-center rounded-full border-2 border-white bg-spark-500">
          <Megaphone size={11} color="#0A1F44" aria-hidden />
        </span>
      )}
    </button>
  )
}

setWorkerUrl(maplibreWorker)

// Vector OSM tiles without a key; we drop POI and house-number layers so only our pins show (docs/DESIGN.md).
const STYLE = 'https://tiles.openfreemap.org/styles/positron'
const RYNEK: [number, number] = [19.9372, 50.0614] // lng, lat

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
    const m = new MapLibre({ container: box.current!, style: STYLE, center: RYNEK, zoom, interactive, attributionControl: { compact: true } })
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

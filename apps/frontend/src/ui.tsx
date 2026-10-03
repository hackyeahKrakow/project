import { Compass, Heart, Map, Plus } from 'lucide-react'
import { HSSelect } from 'preline/non-auto'
import { useEffect, useRef, type ReactNode } from 'react'
import { type Category, category } from '@/lib/categories'
import { UNIVERSITIES, type SpottedEvent } from '@/lib/events'

// Preline "Buttons" styled with spotted tokens.
export const btn =
  'inline-flex items-center justify-center gap-2 rounded-[14px] px-5 font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 disabled:opacity-50'
export const btnPrimary = `${btn} bg-brand-600 text-white hover:bg-brand-600/90`
// Orange (Iskra) is only ever a fill with ink text, never a text color.
export const btnSpark = `${btn} bg-spark-500 text-ink-900 hover:bg-spark-500/90`
export const btnOutline = `${btn} border border-line bg-white text-ink-900 hover:bg-canvas`
// Preline "Card".
export const card = 'rounded-[20px] border border-line bg-white'

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

/** Invisible native <select> over a custom-looking trigger, for filter chips and form fields. */
export function SelectOverlay({
  label,
  value,
  onChange,
  options,
  className = '',
  children,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
  className?: string
  children: ReactNode
}) {
  return (
    <div className={`relative has-focus-visible:outline-2 has-focus-visible:outline-brand-600 ${className}`}>
      {children}
      <select
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="absolute inset-0 cursor-pointer opacity-0"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  )
}

// Lucide building-2 and chevron-down as markup: Preline renders the toggle from an HTML string.
const BUILDING_SVG =
  '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1D5CFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="16" height="20" x="4" y="2" rx="2"/><path d="M9 22v-4h6v4M8 6h.01M16 6h.01M12 6h.01M12 10h.01M12 14h.01M16 10h.01M16 14h.01M8 10h.01M8 14h.01"/></svg>'
const CHEVRON_SVG =
  '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4A5B7D" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>'

/** University picker: Preline Advanced Select with search (docs/DESIGN.md). */
export function UniSelect({ value, onChange, compact = false }: { value: string; onChange: (v: string) => void; compact?: boolean }) {
  const ref = useRef<HTMLSelectElement>(null)

  // Header and onboarding share one value; push outside changes into Preline's custom UI.
  useEffect(() => {
    const item = ref.current && (HSSelect.getInstance(ref.current, true) as { element: HSSelect } | null)
    if (item && item.element.value !== value) item.element.setValue(value)
  }, [value])

  const config = {
    hasSearch: true,
    searchPlaceholder: 'Szukaj uczelni…',
    searchClasses: 'block w-full rounded-lg border-line py-2 px-3 text-sm focus:border-brand-600 focus:ring-brand-600',
    searchWrapperClasses: 'sticky top-0 bg-white p-1',
    wrapperClasses: 'relative',
    toggleTag: `<button type="button" aria-expanded="false" aria-label="Uczelnia">${BUILDING_SVG}<span data-title></span></button>`,
    // Preline appends the title last inside the toggle, so the chevron sits on top as extra markup (as in Preline's examples).
    extraMarkup: `<div class="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2">${CHEVRON_SVG}</div>`,
    toggleClasses: compact
      ? 'flex h-11 cursor-pointer items-center gap-2 rounded-xl border border-line bg-white ps-3.5 pe-9 text-[15px] font-medium focus-visible:outline-2 focus-visible:outline-brand-600'
      : 'flex h-[52px] w-full cursor-pointer items-center gap-2.5 rounded-[14px] border border-line bg-white ps-3.5 pe-10 text-start text-base focus-visible:outline-2 focus-visible:outline-brand-600',
    dropdownClasses: `absolute z-50 mt-2 max-h-72 w-full min-w-72 overflow-y-auto rounded-xl border border-line bg-white p-1 shadow-xl ${compact ? 'end-0' : ''}`,
    optionClasses: 'cursor-pointer rounded-lg px-3 py-2 text-sm hover:bg-canvas hs-selected:bg-brand-50 hs-selected:font-semibold',
    descriptionClasses: 'text-xs font-normal text-muted',
    // Preline looks up [data-title] among the template's descendants, so it needs a wrapper.
    optionTemplate: '<div><div data-title></div></div>',
  }

  // The wrapper div owns the nodes Preline inserts next to the <select>, so React can unmount them together.
  return (
    <div className={compact ? 'ml-auto sm:ml-0' : ''}>
      <select
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        data-hs-select={JSON.stringify(config)}
        className="hidden"
        aria-label="Uczelnia"
      >
        {UNIVERSITIES.map((u) => (
          <option key={u.id} value={u.id} data-hs-select-option={compact ? JSON.stringify({ description: u.name }) : undefined}>
            {compact ? u.id : u.name}
          </option>
        ))}
      </select>
    </div>
  )
}

const NAV = [
  { route: 'mapa', label: 'Mapa', Icon: Map },
  { route: 'odkrywaj', label: 'Odkrywaj', Icon: Compass },
  { route: 'moje', label: 'Moje', Icon: Heart },
]

// Preline "Navbar": Mapa / Odkrywaj / Moje + "Dodaj"; on phones the links drop to a second row.
export function Header({ route, uni, setUni }: { route: string; uni: string; setUni: (u: string) => void }) {
  return (
    <header className="flex-none border-b border-line bg-white">
      <div className="mx-auto flex max-w-[1360px] flex-wrap items-center gap-x-8 gap-y-3 px-4 py-3 sm:px-6 md:px-10">
        <a href="#/" className="flex items-end gap-2 text-ink-900" aria-label="spotted — strona główna">
          <span className="text-[30px] leading-none font-semibold tracking-[-0.03em]">spotted</span>
          <Flag />
        </a>
        <nav className="order-3 flex w-full gap-1 sm:order-none sm:w-auto sm:flex-1" aria-label="Główna">
          {NAV.map(({ route: r, label, Icon }) => (
            <a
              key={r}
              href={`#/${r}`}
              aria-current={route === r ? 'page' : undefined}
              className={`flex h-11 flex-1 items-center justify-center gap-2 rounded-xl px-2 text-base sm:flex-none sm:px-4 ${
                route === r ? 'bg-brand-50 font-semibold text-brand-600' : 'font-medium text-muted hover:bg-canvas'
              }`}
            >
              <Icon size={20} aria-hidden />
              {label}
            </a>
          ))}
        </nav>
        <UniSelect value={uni} onChange={setUni} compact />
        <a href="#/dodaj" className={`${btnSpark} h-11 text-[15px] max-sm:w-11 max-sm:px-0`} aria-label="Dodaj wydarzenie">
          <Plus size={20} strokeWidth={2.2} aria-hidden />
          <span className="hidden sm:inline">Dodaj wydarzenie</span>
        </a>
      </div>
    </header>
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

function Pin({ ev, liked, onClick }: { ev: SpottedEvent; liked: boolean; onClick?: () => void }) {
  const cat = category(ev.category)
  const size = liked ? 52 : 42
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag
      {...(onClick && { type: 'button' as const, onClick, 'aria-label': `${ev.event_name}${liked ? ' (polubione)' : ''}` })}
      className="absolute flex items-center justify-center rounded-full border-[3px] border-white"
      style={{
        left: `${ev.pin[0]}%`,
        top: `${ev.pin[1]}%`,
        width: size,
        height: size,
        margin: -size / 2,
        background: cat.color,
        boxShadow: liked ? '0 0 0 3px #0A1F44,0 4px 10px rgba(10,31,68,.3)' : '0 3px 8px rgba(10,31,68,.28)',
      }}
    >
      <cat.Icon size={liked ? 24 : 19} color="#fff" strokeWidth={2.2} aria-hidden />
      {liked && (
        <span className="absolute -top-[7px] -right-[7px] flex h-[22px] w-[22px] items-center justify-center rounded-full border-2 border-white bg-spark-500">
          <Heart size={11} fill="#0A1F44" color="#0A1F44" aria-hidden />
        </span>
      )}
    </Tag>
  )
}

// ponytail: illustrated map from the design; real map = MapLibre GL + OSM without POI, start Rynek Główny, zoom ~13
export function MapView({
  events,
  liked,
  onSelect,
  className = '',
  children,
}: {
  events: SpottedEvent[]
  liked: Set<string>
  onSelect?: (id: string) => void
  className?: string
  children?: ReactNode
}) {
  return (
    <div className={`relative overflow-hidden bg-map ${className}`}>
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <path d="M-20 520 C180 470 360 580 820 440" stroke="#C2DAFF" strokeWidth="64" fill="none" />
        <rect x="250" y="70" width="300" height="250" rx="60" fill="none" stroke="#D3E6DA" strokeWidth="22" />
        <path
          d="M400 0V150M400 250V440M0 200H320M480 200H800M0 380L800 330M130 600L250 330M650 600L580 330M0 300H800"
          stroke="#fff"
          strokeWidth="11"
          strokeLinecap="round"
          fill="none"
        />
        <rect x="350" y="150" width="100" height="100" rx="8" fill="#F8FAFD" />
      </svg>
      {events.map((ev) => (
        <Pin key={ev.id} ev={ev} liked={liked.has(ev.id)} onClick={onSelect && (() => onSelect(ev.id))} />
      ))}
      {children}
      <div className="absolute bottom-2 left-2.5 rounded bg-white/90 px-1.5 py-0.5 text-[11px] text-muted">© OpenStreetMap contributors</div>
    </div>
  )
}

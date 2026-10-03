import { Building2, ChevronDown, Compass, Heart, Map, Plus } from 'lucide-react'
import { UNIVERSITIES, category } from '@/data'
export const btn =
  'inline-flex items-center justify-center gap-2 rounded-[14px] px-5 font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 disabled:opacity-50'
export const btnPrimary = `${btn} bg-brand-600 text-white hover:bg-brand-600/90`
// Orange (Iskra) is only ever a fill with ink text, never a text color.
export const btnSpark = `${btn} bg-spark-500 text-ink-900 hover:bg-spark-500/90`
export const btnOutline = `${btn} border border-line bg-white text-ink-900 hover:bg-canvas`
export const card = 'rounded-[20px] border border-line bg-white'
const FLAG_LIGHT = ['#0A1F44', '#7DB8FF', '#1D5CFF', '#6B4EE6', '#FF8A3D']
const FLAG_DARK = ['#FFFFFF', '#9CCBFF', '#4C8DFF', '#A58BFF', '#FF8A3D']
const WAVES = [
  'M10 6 C40 -2 70 14 100 6 C130 -2 140 2 150 6 L150 20 C140 16 130 12 100 20 C70 28 40 12 10 20Z',
  'M10 20 C40 12 70 28 100 20 C130 12 140 16 150 20 L150 34 C140 30 130 26 100 34 C70 42 40 26 10 34Z',
  'M10 34 C40 26 70 42 100 34 C130 26 140 30 150 34 L150 48 C140 44 130 40 100 48 C70 56 40 40 10 48Z',
  'M10 48 C40 40 70 56 100 48 C130 40 140 44 150 48 L150 62 C140 58 130 54 100 62 C70 70 40 54 10 62Z',
]
export function Flag({ width = 26, dark = false }) {
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
/** Invisible native <select> over a custom-looking trigger: native keyboard/screen-reader behavior for free. */
export function SelectOverlay({ label, value, onChange, options, className = '', children }) {
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
export const uniOptions = UNIVERSITIES.map((u) => ({ value: u.id, label: u.name }))
const NAV = [
  { route: 'mapa', label: 'Mapa', Icon: Map },
  { route: 'odkrywaj', label: 'Odkrywaj', Icon: Compass },
  { route: 'moje', label: 'Moje', Icon: Heart },
]
export function Header({ route, uni, setUni }) {
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
              className={`flex h-11 flex-1 items-center justify-center gap-2 rounded-xl px-2 text-base sm:flex-none sm:px-4 ${route === r ? 'bg-brand-50 font-semibold text-brand-600' : 'font-medium text-muted-foreground hover:bg-canvas'}`}
            >
              <Icon size={20} aria-hidden />
              {label}
            </a>
          ))}
        </nav>
        <SelectOverlay label="Uczelnia" value={uni} onChange={setUni} options={uniOptions} className="ml-auto sm:ml-0">
          <div className="flex h-11 items-center gap-2 rounded-xl border border-line px-3.5 text-[15px] font-medium">
            <Building2 size={18} className="text-brand-600" aria-hidden />
            {uni}
            <ChevronDown size={16} strokeWidth={2.2} className="text-muted-foreground" aria-hidden />
          </div>
        </SelectOverlay>
        <a href="#/dodaj" className={`${btnSpark} h-11 text-[15px] max-sm:w-11 max-sm:px-0`} aria-label="Dodaj wydarzenie">
          <Plus size={20} strokeWidth={2.2} aria-hidden />
          <span className="hidden sm:inline">Dodaj wydarzenie</span>
        </a>
      </div>
    </header>
  )
}
export function CategoryBadge({ cat, onDark = false, className = 'text-xs' }) {
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
export function Thumb({ cat, iconSize, className }) {
  return (
    <div className={`flex flex-none items-center justify-center ${className}`} style={{ background: cat.color }}>
      <cat.Icon size={iconSize} color="#fff" strokeWidth={iconSize > 40 ? 1.6 : 2} aria-hidden />
    </div>
  )
}
function Pin({ ev, liked, onClick }) {
  const cat = category(ev.category)
  const size = liked ? 52 : 42
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag
      {...(onClick && { type: 'button', onClick, 'aria-label': `${ev.event_name}${liked ? ' (polubione)' : ''}` })}
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
// ponytail: illustrated map from the design; real map = Leaflet + OSM tiles without POI, start Rynek Główny, zoom ~13
export function MapView({ events, liked, onSelect, className = '', children }) {
  return (
    <div className={`relative overflow-hidden bg-map ${className}`}>
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 800 600"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
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
      <div className="absolute bottom-2 left-2.5 rounded bg-white/90 px-1.5 py-0.5 text-[11px] text-muted-foreground">
        © OpenStreetMap contributors
      </div>
    </div>
  )
}

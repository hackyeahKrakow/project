import { ChevronDown, Heart, Info, List, Megaphone } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { CATEGORIES, category, type CategoryId } from '@/lib/categories'
import { formatTime, inRange, whenLabel, type SpottedEvent, type When } from '@/lib/events'
import { photoUrl } from '@/lib/photos'
import { useStore } from '@/lib/store'
import { CategoryBadge, EventCard, EventMap, Sheet, Thumb, chip } from '@/ui'

const WHEN: [When, string][] = [
  ['dzis', 'Dziś'],
  ['tydzien', 'Ten tydzień'],
  ['wszystkie', 'Wszystkie'],
]

// Full-screen map, filters as chips on top, event card in a bottom sheet (docs/DESIGN.md, ekran Mapa).
export default function Mapa({ events, liked }: { events: SpottedEvent[]; liked: Set<string> }) {
  const { state, update } = useStore()
  const [when, setWhen] = useState<When>('tydzien')
  const [cat, setCat] = useState<CategoryId | ''>('')
  const [free, setFree] = useState(false)
  const [mine, setMine] = useState(false)
  const [selectedId, setSelectedId] = useState<string>()
  const [openList, setOpenList] = useState(false)
  const [legendOpen, setLegendOpen] = useState(() => window.matchMedia('(min-width: 56.25rem)').matches) // open on laptops

  const shown = useMemo(
    () =>
      events
        .filter((e) => inRange(e, when) && (!cat || e.category === cat) && (!free || e.price === 0) && (!mine || liked.has(e.id)))
        .sort((a, b) => a.starts_at.localeCompare(b.starts_at)),
    [events, when, cat, free, mine, liked],
  )
  const selected = events.find((e) => e.id === selectedId)
  const close = useCallback(() => setSelectedId(undefined), [])
  const closeList = useCallback(() => setOpenList(false), [])
  const toggleLike = (id: string) =>
    update((s) => {
      const swipes = { ...s.swipes }
      if (swipes[id] === 'right') delete swipes[id]
      else swipes[id] = 'right'
      return { swipes }
    })

  const list = (
    <ul className="flex flex-col gap-2">
      {shown.map((ev) => {
        const c = category(ev.category)
        return (
          <li key={ev.id}>
            <button
              type="button"
              onClick={() => setSelectedId(ev.id)}
              aria-current={ev.id === selectedId}
              className={`flex w-full items-center gap-3 rounded-2xl p-2.5 text-left ${ev.id === selectedId ? 'border-2 border-link bg-brand-50' : 'border border-line bg-surface'}`}
            >
              <Thumb cat={c} iconSize={26} className="h-16 w-16 rounded-xl" photo={photoUrl(ev, 160)} />
              <span className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="leading-tight font-semibold">{ev.event_name}</span>
                <CategoryBadge cat={c} />
                <span className="text-[13px] text-muted">
                  {when === 'dzis' ? formatTime(ev.starts_at) : whenLabel(ev.starts_at)} · {ev.district}
                </span>
              </span>
            </button>
          </li>
        )
      })}
    </ul>
  )
  const count = shown.length ? `${shown.length} ${shown.length === 1 ? 'wydarzenie' : 'wydarzeń'}` : 'Brak wydarzeń dla tych filtrów'

  return (
    <div className="flex min-h-0 flex-1">
      <h1 className="sr-only">Mapa wydarzeń</h1>
      {/* Laptops: the list sits next to the map; phones and tablets open it from the "Lista" button. */}
      <aside className="hidden w-[380px] flex-none flex-col gap-3 overflow-y-auto border-r border-line bg-canvas p-4 md:flex" aria-label="Lista wydarzeń">
        <h2 className="text-sm font-semibold tracking-[.04em] text-muted uppercase" aria-live="polite">
          {count}
        </h2>
        {list}
      </aside>

      <div className="relative flex min-h-0 flex-1 flex-col">
        <EventMap events={shown} liked={liked} selectedId={selectedId} onSelect={setSelectedId} locate={state.location} className="min-h-0 flex-1" />

        <div className="absolute inset-x-0 top-0 z-10 flex gap-2 overflow-x-auto px-3 pt-3 pb-2 [scrollbar-width:none]" role="group" aria-label="Filtry">
          {WHEN.map(([w, label]) => (
            <button key={w} type="button" aria-pressed={when === w} className={`${chip(when === w)} shadow-sm`} onClick={() => setWhen(w)}>
              {label}
            </button>
          ))}
          <label className={`${chip(!!cat)} relative shadow-sm has-focus-visible:outline-3 has-focus-visible:outline-offset-2 has-focus-visible:outline-link`}>
            {cat ? category(cat).short : 'Kategoria'}
            <ChevronDown size={16} aria-hidden />
            <select
              aria-label="Kategoria"
              value={cat}
              onChange={(e) => setCat(e.target.value as CategoryId | '')}
              className="absolute inset-0 cursor-pointer opacity-0"
            >
              <option value="">Wszystkie kategorie</option>
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <button type="button" aria-pressed={free} className={`${chip(free)} shadow-sm`} onClick={() => setFree(!free)}>
            Darmowe
          </button>
          <button type="button" aria-pressed={mine} className={`${chip(mine)} shadow-sm`} onClick={() => setMine(!mine)}>
            Polubione
          </button>
        </div>

        {/* Legend: what pin colors and badges mean (color is never the only carrier, so each row has the icon too). */}
        <details className="group absolute bottom-20 left-3 z-10 max-w-[240px] rounded-2xl bg-surface/95 text-sm shadow-lg md:bottom-4" open={legendOpen}>
          <summary
            className="flex min-h-11 cursor-pointer list-none items-center gap-2 px-3.5 font-semibold"
            onClick={(e) => {
              e.preventDefault()
              setLegendOpen(!legendOpen)
            }}
          >
            <Info size={18} aria-hidden />
            Legenda
            <ChevronDown size={16} className="ml-auto transition-transform group-open:rotate-180" aria-hidden />
          </summary>
          <ul className="flex flex-col gap-1.5 px-3.5 pb-3">
            {CATEGORIES.map((c) => (
              <li key={c.id} className="flex items-center gap-2">
                <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full border-2 border-white" style={{ background: c.color }}>
                  <c.Icon size={13} color="#fff" strokeWidth={2.4} aria-hidden />
                </span>
                {c.name}
              </li>
            ))}
            <li className="flex items-center gap-2 border-t border-line pt-1.5">
              <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-spark-500">
                <Heart size={12} fill="#0A1F44" color="#0A1F44" aria-hidden />
              </span>
              Polubione przez ciebie
            </li>
            <li className="flex items-center gap-2">
              <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-spark-500">
                <Megaphone size={12} color="#0A1F44" aria-hidden />
              </span>
              Promowane
            </li>
          </ul>
        </details>

        {!selected && (
          <button
            type="button"
            onClick={() => setOpenList(true)}
            className="absolute bottom-4 left-1/2 z-10 flex h-12 -translate-x-1/2 items-center gap-2 rounded-full bg-fg px-5 font-semibold text-surface shadow-lg md:hidden"
          >
            <List size={20} aria-hidden />
            Lista ({shown.length})
          </button>
        )}

        <Sheet open={openList && !selected} onClose={closeList} label="Lista wydarzeń">
          <div className="flex flex-col gap-2 p-4 pt-5">
            <h2 className="pr-12 text-lg font-semibold">{count}</h2>
            {list}
          </div>
        </Sheet>

        <Sheet open={!!selected} onClose={close} label={selected?.event_name ?? 'Wydarzenie'}>
          {selected && <EventCard ev={selected} liked={liked.has(selected.id)} onLike={() => toggleLike(selected.id)} />}
        </Sheet>
      </div>
    </div>
  )
}

import { ChevronDown, List } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { CATEGORIES, category, type CategoryId } from '@/lib/categories'
import { formatTime, inRange, whenLabel, type SpottedEvent, type When } from '@/lib/events'
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
  const [list, setList] = useState(false)

  const shown = useMemo(
    () =>
      events
        .filter((e) => inRange(e.starts_at, when) && (!cat || e.category === cat) && (!free || e.price === 0) && (!mine || liked.has(e.id)))
        .sort((a, b) => a.starts_at.localeCompare(b.starts_at)),
    [events, when, cat, free, mine, liked],
  )
  const selected = events.find((e) => e.id === selectedId)
  const close = useCallback(() => setSelectedId(undefined), [])
  const toggleLike = (id: string) =>
    update((s) => {
      const swipes = { ...s.swipes }
      if (swipes[id] === 'right') delete swipes[id]
      else swipes[id] = 'right'
      return { swipes }
    })

  return (
    <>
      <EventMap events={shown} liked={liked} selectedId={selectedId} onSelect={setSelectedId} locate={state.location} className="min-h-0 flex-1" />

      <div className="absolute inset-x-0 top-0 z-10 flex gap-2 overflow-x-auto px-3 pt-3 pb-2 [scrollbar-width:none]">
        {WHEN.map(([w, label]) => (
          <button key={w} type="button" aria-pressed={when === w} className={`${chip(when === w)} shadow-sm`} onClick={() => setWhen(w)}>
            {label}
          </button>
        ))}
        <label className={`${chip(!!cat)} relative shadow-sm`}>
          {cat ? category(cat).short : 'Kategoria'}
          <ChevronDown size={16} aria-hidden />
          <select aria-label="Kategoria" value={cat} onChange={(e) => setCat(e.target.value as CategoryId | '')} className="absolute inset-0 cursor-pointer opacity-0">
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

      {!selected && (
        <button type="button" onClick={() => setList(true)} className="absolute bottom-4 left-1/2 z-10 flex h-12 -translate-x-1/2 items-center gap-2 rounded-full bg-ink-900 px-5 font-semibold text-white shadow-lg">
          <List size={20} aria-hidden />
          Lista ({shown.length})
        </button>
      )}

      <Sheet open={list && !selected} onClose={() => setList(false)} label="Lista wydarzeń">
        <div className="flex flex-col gap-2 p-4 pt-5">
          <h2 className="pr-12 text-lg font-semibold">{shown.length ? `${shown.length} wydarzeń` : 'Brak wydarzeń dla tych filtrów'}</h2>
          {shown.map((ev) => {
            const c = category(ev.category)
            return (
              <button key={ev.id} type="button" onClick={() => setSelectedId(ev.id)} className="flex items-center gap-3 rounded-2xl border border-line bg-white p-2.5 text-left">
                <Thumb cat={c} iconSize={26} className="h-16 w-16 rounded-xl" />
                <span className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="leading-tight font-semibold">{ev.event_name}</span>
                  <CategoryBadge cat={c} />
                  <span className="text-[13px] text-muted">
                    {when === 'dzis' ? formatTime(ev.starts_at) : whenLabel(ev.starts_at)} · {ev.district}
                  </span>
                </span>
              </button>
            )
          })}
        </div>
      </Sheet>

      <Sheet open={!!selected} onClose={close} label={selected?.event_name ?? 'Wydarzenie'}>
        {selected && <EventCard ev={selected} liked={liked.has(selected.id)} onLike={() => toggleLike(selected.id)} />}
      </Sheet>
    </>
  )
}

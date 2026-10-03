import { BadgeCheck, Calendar, ChevronDown, Heart, MapPin, X } from 'lucide-react'
import { HSOverlay } from 'preline/non-auto'
import { useState } from 'react'
import { CATEGORIES, category, type CategoryId } from '@/lib/categories'
import { EVENTS, formatDate, formatPrice, formatTime, inRange, type SpottedEvent, type When } from '@/lib/events'
import { CategoryBadge, MapView, SelectOverlay, Thumb, btnOutline } from '@/ui'

const PANEL_ID = 'event-panel'
const phone = () => window.matchMedia('(max-width: 37.4375rem)').matches

// Preline "Buttons" as pill chips; active = bg-ink-900 text-white.
const chip = (on: boolean) =>
  `flex h-11 flex-none items-center gap-1.5 rounded-full border px-4 text-[15px] font-medium ${
    on ? 'border-ink-900 bg-ink-900 text-white' : 'border-line bg-white text-ink-900'
  }`

export default function Mapa({ liked, setLike }: { liked: Set<string>; setLike: (id: string, on: boolean) => void }) {
  const [when, setWhen] = useState<When>('dzis')
  const [cat, setCat] = useState('')
  const [free, setFree] = useState(false)
  const [selectedId, setSelectedId] = useState('planszowki')

  const events = EVENTS.filter((e) => inRange(e.starts_at, when) && (!cat || e.category === cat) && (!free || e.price === 0)).sort(
    (a, b) => a.starts_at.localeCompare(b.starts_at),
  )
  const selected = events.find((e) => e.id === selectedId)

  // Desktop/tablet show the card on the map; phones open it in a bottom Offcanvas.
  const select = (id: string) => {
    setSelectedId(id)
    if (phone()) HSOverlay.open(`#${PANEL_ID}`)
  }

  return (
    <>
      <div className="mx-auto flex w-full max-w-[1360px] gap-2 overflow-x-auto px-4 py-4 sm:flex-wrap sm:px-6 md:px-10">
        <button type="button" aria-pressed={when === 'dzis'} className={chip(when === 'dzis')} onClick={() => setWhen('dzis')}>
          Dziś
        </button>
        <button type="button" aria-pressed={when === 'tydzien'} className={chip(when === 'tydzien')} onClick={() => setWhen('tydzien')}>
          Ten tydzień
        </button>
        <SelectOverlay
          label="Kategoria"
          value={cat}
          onChange={setCat}
          options={[{ value: '', label: 'Wszystkie kategorie' }, ...CATEGORIES.map((c) => ({ value: c.id, label: c.name }))]}
          className="flex-none"
        >
          <div className={chip(!!cat)}>
            {cat ? category(cat as CategoryId).short : 'Kategoria'}
            <ChevronDown size={16} aria-hidden />
          </div>
        </SelectOverlay>
        <button type="button" aria-pressed={free} className={chip(free)} onClick={() => setFree(!free)}>
          Darmowe
        </button>
      </div>

      <div className="mx-auto flex w-full max-w-[1360px] flex-1 flex-wrap gap-5 px-4 pb-8 sm:px-6 md:px-10">
        <aside className="flex flex-[1_1_360px] flex-col gap-2.5 md:max-w-[420px]">
          <h2 className="text-sm font-semibold tracking-[.06em] text-muted uppercase">
            {events.length} {events.length === 1 ? 'wydarzenie' : 'wydarzeń'} · {when === 'dzis' ? 'dziś' : 'ten tydzień'}
          </h2>
          {events.length === 0 && <p className="text-muted">Brak wydarzeń dla tych filtrów.</p>}
          {events.map((ev) => {
            const c = category(ev.category)
            const on = ev.id === selectedId
            return (
              <button
                key={ev.id}
                type="button"
                onClick={() => select(ev.id)}
                aria-current={on}
                className={`flex items-center gap-3 rounded-2xl p-3 text-left ${on ? 'border-2 border-brand-600 bg-brand-50' : 'border border-line bg-white'}`}
              >
                <Thumb cat={c} iconSize={32} className="h-[76px] w-[76px] rounded-xl" />
                <div className="flex min-w-0 flex-1 flex-col gap-[5px]">
                  <div className="leading-tight font-semibold">{ev.event_name}</div>
                  <CategoryBadge cat={c} />
                  <div className="text-[13px] text-muted">
                    {formatTime(ev.starts_at)} · {formatPrice(ev.price)}
                  </div>
                </div>
              </button>
            )
          })}
        </aside>

        {/* At <=900px the map goes above the list. */}
        <MapView
          events={events}
          liked={liked}
          onSelect={select}
          className="-order-1 min-h-[780px] flex-[999_1_600px] rounded-3xl sm:min-h-[700px] md:order-none"
        >
          {selected && (
            <div className="absolute top-5 right-5 hidden w-[360px] max-w-[calc(100%-40px)] overflow-hidden rounded-[22px] bg-white shadow-[0_12px_32px_rgba(10,31,68,.22)] sm:block">
              <EventCard ev={selected} liked={liked.has(selected.id)} onLike={() => setLike(selected.id, !liked.has(selected.id))} />
            </div>
          )}
        </MapView>
      </div>

      {/* Preline Offcanvas, bottom sheet on phones. */}
      <div
        id={PANEL_ID}
        className="hs-overlay fixed inset-x-0 bottom-0 z-80 hidden max-h-[85svh] translate-y-full overflow-y-auto rounded-t-[22px] bg-white shadow-[0_-12px_32px_rgba(10,31,68,.22)] transition-all duration-300 hs-overlay-open:translate-y-0 sm:hidden"
        role="dialog"
        tabIndex={-1}
        aria-label={selected?.event_name ?? 'Wydarzenie'}
      >
        <button
          type="button"
          className="absolute top-3 right-3 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/90"
          aria-label="Zamknij"
          data-hs-overlay={`#${PANEL_ID}`}
        >
          <X size={22} aria-hidden />
        </button>
        {selected && <EventCard ev={selected} liked={liked.has(selected.id)} onLike={() => setLike(selected.id, !liked.has(selected.id))} />}
      </div>
    </>
  )
}

// Preline "Card", order from docs/DESIGN.md: image → title → badge → date → address → price → organizer → description.
function EventCard({ ev, liked, onLike }: { ev: SpottedEvent; liked: boolean; onLike: () => void }) {
  const c = category(ev.category)
  return (
    <article className="flex flex-col">
      <Thumb cat={c} iconSize={64} className="aspect-video w-full" />
      <div className="flex flex-col gap-2.5 p-4">
        <h3 className="text-[22px] leading-tight font-semibold">{ev.event_name}</h3>
        <CategoryBadge cat={c} className="text-[13px]" />
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
          <span className="flex items-center gap-1.5 text-[13px] text-muted">
            <BadgeCheck size={16} className="text-brand-600" aria-hidden />
            {ev.organizer}
          </span>
        </div>
        <details className="group">
          <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-medium text-brand-600">
            Pokaż opis
            <ChevronDown size={18} className="transition-transform group-open:rotate-180" aria-hidden />
          </summary>
          <p className="pt-2 text-sm leading-relaxed text-muted">{ev.description}</p>
        </details>
        <div className="flex gap-2">
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ev.address)}`}
            target="_blank"
            rel="noreferrer"
            className={`${btnOutline} h-12 flex-1 text-[15px]`}
          >
            <MapPin size={20} strokeWidth={2.2} aria-hidden />
            Pokaż w Google Maps
          </a>
          <button
            type="button"
            onClick={onLike}
            aria-pressed={liked}
            aria-label={liked ? 'Usuń z Moje' : 'Zapisz wydarzenie'}
            className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-brand-600"
          >
            <Heart size={22} color="#fff" fill={liked ? '#fff' : 'none'} aria-hidden />
          </button>
        </div>
      </div>
    </article>
  )
}

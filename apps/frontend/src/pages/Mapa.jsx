import { BadgeCheck, Calendar, ChevronDown, Heart, MapPin } from 'lucide-react'
import { useState } from 'react'
import { CATEGORIES, EVENTS, category, formatDate, formatPrice, formatTime, inRange } from '@/data'
import { CategoryBadge, MapView, SelectOverlay, Thumb, btnOutline } from '@/ui'
const chip = (on) =>
  `flex h-11 flex-none items-center gap-1.5 rounded-full border px-4 text-[15px] font-medium ${on ? 'border-ink-900 bg-ink-900 text-white' : 'border-line bg-white text-ink-900'}`
export default function Mapa({ liked, setLike }) {
  const [when, setWhen] = useState('dzis')
  const [cat, setCat] = useState('')
  const [free, setFree] = useState(false)
  const [selectedId, setSelectedId] = useState('planszowki')
  const events = EVENTS.filter(
    (e) => inRange(e.starts_at, when) && (!cat || e.category === cat) && (!free || e.price === 0),
  ).sort((a, b) => a.starts_at.localeCompare(b.starts_at))
  const selected = events.find((e) => e.id === selectedId)
  return (
    <>
      <div className="mx-auto flex w-full max-w-[1360px] gap-2 overflow-x-auto px-4 py-4 sm:flex-wrap sm:px-6 md:px-10">
        <button type="button" aria-pressed={when === 'dzis'} className={chip(when === 'dzis')} onClick={() => setWhen('dzis')}>
          Dziś
        </button>
        <button
          type="button"
          aria-pressed={when === 'tydzien'}
          className={chip(when === 'tydzien')}
          onClick={() => setWhen('tydzien')}
        >
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
            {cat ? category(cat).short : 'Kategoria'}
            <ChevronDown size={16} aria-hidden />
          </div>
        </SelectOverlay>
        <button type="button" aria-pressed={free} className={chip(free)} onClick={() => setFree(!free)}>
          Darmowe
        </button>
      </div>

      <div className="mx-auto flex w-full max-w-[1360px] flex-1 flex-wrap gap-5 px-4 pb-8 sm:px-6 md:px-10">
        <aside className="flex flex-[1_1_360px] flex-col gap-2.5 md:max-w-[420px]">
          <h2 className="text-sm font-semibold tracking-[.06em] text-muted-foreground uppercase">
            {events.length} {events.length === 1 ? 'wydarzenie' : 'wydarzeń'} · {when === 'dzis' ? 'dziś' : 'ten tydzień'}
          </h2>
          {events.length === 0 && <p className="text-muted-foreground">Brak wydarzeń dla tych filtrów.</p>}
          {events.map((ev) => {
            const c = category(ev.category)
            const on = ev.id === selectedId
            return (
              <button
                key={ev.id}
                type="button"
                onClick={() => setSelectedId(ev.id)}
                aria-current={on}
                className={`flex items-center gap-3 rounded-2xl p-3 text-left ${on ? 'border-2 border-brand-600 bg-brand-50' : 'border border-line bg-white'}`}
              >
                <Thumb cat={c} iconSize={32} className="h-[76px] w-[76px] rounded-xl" />
                <div className="flex min-w-0 flex-1 flex-col gap-[5px]">
                  <div className="leading-tight font-semibold">{ev.event_name}</div>
                  <CategoryBadge cat={c} />
                  <div className="text-[13px] text-muted-foreground">
                    {formatTime(ev.starts_at)} · {formatPrice(ev.price)}
                  </div>
                </div>
              </button>
            )
          })}
        </aside>

        {/* On tablet and phone the map comes first, above the list. */}
        <MapView
          events={events}
          liked={liked}
          onSelect={setSelectedId}
          className="-order-1 min-h-[780px] flex-[999_1_600px] rounded-3xl sm:min-h-[700px] md:order-none"
        >
          {selected && (
            <EventPopup
              key={selected.id}
              ev={selected}
              liked={liked.has(selected.id)}
              onLike={() => setLike(selected.id, !liked.has(selected.id))}
            />
          )}
        </MapView>
      </div>
    </>
  )
}
function EventPopup({ ev, liked, onLike }) {
  const c = category(ev.category)
  return (
    <div className="absolute inset-x-3 bottom-3 flex flex-col overflow-hidden rounded-[22px] bg-white shadow-[0_12px_32px_rgba(10,31,68,.22)] sm:inset-x-auto sm:top-5 sm:right-5 sm:bottom-auto sm:w-[360px] sm:max-w-[calc(100%-40px)]">
      <Thumb cat={c} iconSize={64} className="aspect-video w-full" />
      <div className="flex flex-col gap-2.5 p-4">
        <h3 className="text-[22px] leading-tight font-semibold">{ev.event_name}</h3>
        <CategoryBadge cat={c} className="text-[13px]" />
        <div className="flex flex-col gap-1.5 text-[15px]">
          <div className="flex items-center gap-2">
            <Calendar size={18} aria-hidden />
            {formatDate(ev.starts_at)}
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin size={18} aria-hidden />
            {ev.address}
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="rounded-lg bg-brand-50 px-2.5 py-0.5 text-sm font-semibold text-brand-600">
            {formatPrice(ev.price)}
          </span>
          <span className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
            <BadgeCheck size={16} className="text-brand-600" aria-hidden />
            {ev.organizer}
          </span>
        </div>
        <details className="group">
          <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-medium text-brand-600">
            Pokaż opis
            <ChevronDown size={18} className="transition-transform group-open:rotate-180" aria-hidden />
          </summary>
          <p className="pt-2 text-sm leading-relaxed text-muted-foreground">{ev.description}</p>
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
    </div>
  )
}

import { Calendar, Heart, MapPin, RotateCcw, Sparkles, X } from 'lucide-react'
import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react'
import { saveSwipe, starterDeck } from '@/lib/api'
import { CATEGORIES, category } from '@/lib/categories'
import { STARTER, formatDate, formatPrice, type SpottedEvent } from '@/lib/events'
import { recommend, weights, type Scored } from '@/lib/recommend'
import { useStore, type Decision } from '@/lib/store'
import { CategoryBadge, OrganizerLine, PromotedTag, btnPrimary, card } from '@/ui'

const THRESHOLD = 90
const FLY_MS = 260
const BATCH = 10
const REFILL_AT = 5

// Six fixed starter cards first, then batches of 10 recommendations; at 5 left the next 10 are added (docs/USER_FLOW.md).
export default function Odkrywaj({ events }: { events: SpottedEvent[] }) {
  const { state, update } = useStore()
  const { swipes, profile, userId } = state
  const [starter, setStarter] = useState(STARTER)
  const [queue, setQueue] = useState<Scored[]>([])
  const [here, setHere] = useState<[number, number]>()

  useEffect(() => {
    let live = true
    starterDeck(userId).then((d) => live && setStarter(d))
    return () => {
      live = false
    }
  }, [userId])
  useEffect(() => {
    if (state.location)
      navigator.geolocation?.getCurrentPosition(
        (p) => setHere([p.coords.latitude, p.coords.longitude]),
        () => {},
      )
  }, [state.location])

  const starterLeft = starter.filter((e) => !swipes[e.id])
  const pending = queue.filter((x) => !swipes[x.ev.id])
  useEffect(() => {
    if (starterLeft.length || pending.length > REFILL_AT) return
    const more = recommend(events, profile, swipes, new Set(queue.map((q) => q.ev.id)), BATCH, here, new Set(state.follows))
    if (more.length) setQueue((q) => [...q, ...more])
  }, [starterLeft.length, pending.length]) // eslint-disable-line react-hooks/exhaustive-deps -- refill only when the deck runs low

  const deck: Scored[] = starterLeft.length ? starterLeft.map((ev) => ({ ev, score: 0, distance: 0, reason: 'Karta startowa: poznajemy twój gust' })) : pending
  const top = deck[0]

  const decide = (d: Decision) => {
    if (!top) return
    update((s) => ({ swipes: { ...s.swipes, [top.ev.id]: d } }))
    if (state.consent) saveSwipe(userId, top.ev.id, d) // nothing leaves the device before "Rozumiem, zaczynam"
  }

  const w = weights(profile, swipes, events)
  const learnt = CATEGORIES.map((c) => ({ c, v: w[c.id] }))
    .sort((a, b) => b.v - a.v)
    .slice(0, 4)

  return (
    <div className="flex min-h-0 flex-1 justify-center gap-10 px-4 pt-4 pb-3 sm:px-8 sm:pt-6 sm:pb-6">
      <section className="flex min-h-0 w-full max-w-[480px] flex-col gap-3 md:max-h-[860px]" aria-labelledby="odkrywaj-h">
        <div className="flex flex-none items-center justify-between">
          <h1 id="odkrywaj-h" className="text-[26px] font-semibold tracking-[-0.02em] sm:text-[32px]">
            Odkrywaj
          </h1>
          <span className="rounded-full bg-brand-50 px-3 py-1 text-sm font-medium text-muted">
            {starterLeft.length ? `Start ${STARTER.length - starterLeft.length + 1} z ${STARTER.length}` : top ? 'Dopasowane do ciebie' : 'Koniec talii'}
          </span>
        </div>
        {/* Stays mounted while Deck remounts per card, so screen readers announce each new card. */}
        <p className="sr-only" aria-live="polite">
          {top ? `${top.ev.event_name}, ${formatDate(top.ev.starts_at)}. ${top.reason}` : 'Koniec talii'}
        </p>
        <Deck key={top?.ev.id} deck={deck} onDecide={decide} />
      </section>

      {/* Laptops: what the profile is learning, next to the deck. */}
      <aside className="hidden w-80 flex-none flex-col gap-4 pt-16 lg:flex" aria-label="Twój profil">
        <div className={`${card} flex flex-col gap-3 p-5`}>
          <h2 className="text-[15px] font-semibold">Czego się uczymy</h2>
          {learnt.map(({ c, v }) => (
            <div key={c.id} className="flex items-center gap-2.5 text-sm">
              <c.Icon size={18} color={c.color} strokeWidth={2.2} aria-hidden />
              <span className="w-24">{c.short}</span>
              <div className="h-2 flex-1 rounded bg-track" aria-hidden>
                <div className="h-2 rounded" style={{ width: `${Math.round(v * 100)}%`, background: c.color }} />
              </div>
              <span className="w-9 text-right text-muted">{Math.round(v * 100)}%</span>
            </div>
          ))}
        </div>
        <p className="text-[13px] leading-snug text-muted">
          Przeciągnij kartę w prawo, żeby polubić, w lewo, żeby pominąć. Na klawiaturze: strzałka w prawo i w lewo.
        </p>
      </aside>
    </div>
  )
}

function Deck({ deck, onDecide }: { deck: Scored[]; onDecide: (d: Decision) => void }) {
  const { reset } = useStore()
  const [dx, setDx] = useState(0)
  const [drag, setDrag] = useState(false)
  const startX = useRef(0)
  const busy = useRef(false)
  const done = !deck.length

  const fly = (dir: 1 | -1) => {
    if (busy.current || done) return
    busy.current = true
    setDrag(false)
    setDx(dir * 700)
    setTimeout(() => onDecide(dir > 0 ? 'right' : 'left'), FLY_MS) // the parent remounts Deck with the next card
  }
  const down = (e: PointerEvent) => {
    if (busy.current || done) return
    startX.current = e.clientX
    e.currentTarget.setPointerCapture(e.pointerId)
    setDrag(true)
  }
  const move = (e: PointerEvent) => drag && setDx(e.clientX - startX.current)
  const up = () => {
    if (!drag) return
    setDrag(false)
    if (dx > THRESHOLD) fly(1)
    else if (dx < -THRESHOLD) fly(-1)
    else setDx(0)
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      if (t.closest('input, textarea, select, [role=dialog]')) return
      if (e.key === 'ArrowRight') fly(1)
      if (e.key === 'ArrowLeft') fly(-1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const style = (pos: number): CSSProperties => {
    const transition = drag ? 'none' : `transform ${FLY_MS / 1000}s ease`
    if (pos === 0) return { zIndex: 3, transform: `translateX(${dx}px) rotate(${dx / 18}deg)`, transition }
    if (pos === 1) return { zIndex: 2, transform: `scale(${0.95 + Math.min(Math.abs(dx) / 1800, 0.05)}) translateY(12px)`, transition }
    return { zIndex: 1, transform: 'scale(0.9) translateY(24px)' }
  }

  return (
    <>
      <div
        className="relative min-h-0 flex-1 cursor-grab touch-pan-y select-none"
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
      >
        {deck
          .slice(0, 3)
          .map((x, k) => (
            <SwipeCard
              key={x.ev.id}
              item={x}
              style={style(k)}
              like={k ? 0 : Math.max(0, Math.min(dx / 110, 1))}
              skip={k ? 0 : Math.max(0, Math.min(-dx / 110, 1))}
            />
          ))
          .reverse()}
        {done && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-line bg-white p-6 text-center">
            <div className="text-2xl font-semibold">To już wszystko na dziś</div>
            <p className="text-muted">Polubione wydarzenia są w zakładce Moje i świecą na mapie. Możesz też poszerzyć preferencje.</p>
            <a href="#/moje" className={`${btnPrimary} h-12`}>
              Zobacz Moje
            </a>
            <button type="button" onClick={reset} className="flex items-center gap-1.5 text-sm text-muted underline">
              <RotateCcw size={14} aria-hidden />
              Zacznij demo od nowa
            </button>
          </div>
        )}
      </div>
      <div className="flex flex-none justify-center gap-10">
        <button
          type="button"
          aria-label="Pomiń wydarzenie"
          onClick={() => fly(-1)}
          disabled={done}
          className="flex h-16 w-16 items-center justify-center rounded-full border border-line bg-white shadow-[0_4px_12px_rgba(10,31,68,.14)] disabled:opacity-50"
        >
          <X size={28} strokeWidth={2.4} aria-hidden />
        </button>
        <button
          type="button"
          aria-label="Interesuje mnie"
          onClick={() => fly(1)}
          disabled={done}
          className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-600 shadow-[0_4px_12px_rgba(10,31,68,.14)] disabled:opacity-50"
        >
          <Heart size={28} color="#fff" aria-hidden />
        </button>
      </div>
    </>
  )
}

function SwipeCard({ item, style, like, skip }: { item: Scored; style: CSSProperties; like: number; skip: number }) {
  const { ev, reason } = item
  const c = category(ev.category)
  const stamp = 'absolute top-4 rounded-[10px] border-[3px] bg-white px-3 py-1 text-xl font-semibold tracking-[.06em]'
  return (
    <article
      className="absolute inset-0 flex flex-col justify-end overflow-hidden rounded-3xl shadow-[0_12px_32px_rgba(10,31,68,.22)]"
      style={{ background: c.color, ...style }}
      aria-hidden={style.zIndex !== 3}
    >
      <div className="absolute inset-x-0 top-0 bottom-[48%] flex items-center justify-center">
        <c.Icon size={96} color="#fff" strokeWidth={1.6} aria-hidden />
      </div>
      <div className={`${stamp} left-4 -rotate-10 border-brand-600 text-brand-600`} style={{ opacity: like }}>
        WCHODZĘ
      </div>
      <div className={`${stamp} right-4 rotate-10 border-ink-900 text-ink-900`} style={{ opacity: skip }}>
        NIE DLA MNIE
      </div>
      <div className="relative flex flex-col gap-2 bg-[linear-gradient(to_top,rgba(10,31,68,.97)_0%,rgba(10,31,68,.92)_62%,rgba(10,31,68,0)_100%)] px-4 pt-12 pb-4 text-white">
        <div className="flex flex-wrap items-center gap-2">
          <CategoryBadge cat={c} onDark className="text-[13px]" />
          {ev.promoted && <PromotedTag />}
        </div>
        <h2 className="text-[24px] leading-[1.15] font-semibold">{ev.event_name}</h2>
        <div className="flex items-center gap-2 text-[15px] text-brand-50">
          <Calendar size={18} aria-hidden />
          {formatDate(ev.starts_at)}
        </div>
        <div className="flex items-center gap-2 text-[15px] text-brand-50">
          <MapPin size={18} aria-hidden />
          {ev.address}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className={`rounded-lg px-2.5 py-0.5 text-sm font-semibold text-ink-900 ${ev.price ? 'bg-spark-500' : 'bg-white'}`}>
            {formatPrice(ev.price)}
          </span>
          <OrganizerLine ev={ev} className="text-[13px] text-brand-50" />
        </div>
        <div className="flex items-start gap-2 rounded-xl bg-violet-50 px-3 py-2 text-sm font-medium text-ink-900">
          <Sparkles size={18} className="mt-px flex-none text-violet-600" aria-hidden />
          {reason}
        </div>
      </div>
    </article>
  )
}

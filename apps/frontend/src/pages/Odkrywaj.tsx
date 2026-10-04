import { Calendar, Heart, MapPin, RotateCcw, Sparkles, X } from 'lucide-react'
import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react'
import { saveSwipe, starterDeck } from '@/lib/api'
import { CATEGORIES, category } from '@/lib/categories'
import { inKrakow, locate } from '@/lib/geo'
import { STARTER, formatDate, formatPrice, formatRange, type SpottedEvent } from '@/lib/events'
import { photoUrl } from '@/lib/photos'
import { recommend, weights, type Scored } from '@/lib/recommend'
import { useStore, type Decision } from '@/lib/store'
import { CategoryBadge, OrganizerLine, Photo, PromotedTag, btnPrimary, card } from '@/ui'

const THRESHOLD = 90
const FLY_MS = 300
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
      locate()
        .then((at) => inKrakow(at) && setHere(at))
        .catch(() => {}) // the switch in Konto says why; cards then measure from the profile district
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
    <div className="flex min-h-0 flex-1 justify-center gap-10 overflow-hidden px-4 pt-4 pb-3 sm:px-8 sm:pt-6 sm:pb-6">
      <section className="flex min-h-0 w-full max-w-[480px] flex-col gap-3 md:max-h-[860px]" aria-labelledby="odkrywaj-h">
        <div className="flex flex-none items-center justify-between">
          <h1 id="odkrywaj-h" className="text-[26px] font-semibold tracking-[-0.02em] sm:text-[32px]">
            Odkrywaj
          </h1>
          <span className="rounded-full bg-brand-50 px-3 py-1 text-sm font-medium text-muted">
            {starterLeft.length ? `Start ${STARTER.length - starterLeft.length + 1} z ${STARTER.length}` : top ? 'Dopasowane do ciebie' : 'Koniec talii'}
          </span>
        </div>
        {/* Outside the deck, so screen readers announce each new card. */}
        <p className="sr-only" aria-live="polite">
          {top ? `${top.ev.event_name}, ${formatDate(top.ev.starts_at)}. ${top.reason}` : 'Koniec talii'}
        </p>
        <Deck deck={deck} onDecide={decide} />
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
          Przeciągnij kartę w prawo, żeby polubić, w lewo, żeby pominąć. Na klawiaturze: strzałka w prawo i w lewo. Kliknij kartę (na klawiaturze: Enter), żeby zobaczyć opis.
        </p>
      </aside>
    </div>
  )
}

function Deck({ deck, onDecide }: { deck: Scored[]; onDecide: (d: Decision) => void }) {
  const { reset } = useStore()
  const [pos, setPos] = useState({ x: 0, y: 0, tilt: 1 })
  const [drag, setDrag] = useState(false)
  const [flying, setFlying] = useState(false)
  // Which card shows its back (the description). Keyed by id, so the next card always starts on its front.
  const [flippedId, setFlippedId] = useState<string | null>(null)
  // Gesture bookkeeping that must not re-render: active pointer, start point, last sample for velocity.
  const g = useRef({ id: -1, x0: 0, y0: 0, t: 0, x: 0, y: 0, vx: 0, vy: 0 })
  const done = !deck.length
  const flip = () => {
    if (flying || done) return
    setFlippedId((id) => (id === deck[0].ev.id ? null : deck[0].ev.id))
  }
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches

  const fly = (dir: 1 | -1, vy = 0) => {
    if (flying || done) return
    setFlying(true)
    setDrag(false)
    // Far enough to leave any screen; the page clips it (overflow-hidden), so nothing scrolls sideways.
    setPos((p) => ({ ...p, x: dir * (window.innerWidth + 200), y: p.y + vy * FLY_MS }))
    setTimeout(() => {
      onDecide(dir > 0 ? 'right' : 'left')
      // The card behind keeps its element (same key) and springs from its spot to the front.
      setPos((p) => ({ ...p, x: 0, y: 0 }))
      setFlying(false)
    }, FLY_MS)
  }
  const down = (e: PointerEvent<HTMLDivElement>) => {
    if (flying || done || g.current.id !== -1 || e.button !== 0) return // one finger, primary button
    const r = e.currentTarget.getBoundingClientRect()
    g.current = {
      id: e.pointerId,
      x0: e.clientX,
      y0: e.clientY,
      t: e.timeStamp,
      x: e.clientX,
      y: e.clientY,
      vx: 0,
      vy: 0,
    }
    setPos({ x: 0, y: 0, tilt: e.clientY < r.top + r.height / 2 ? 1 : -1 }) // grabbed low = tilts the other way, like Tinder
    e.currentTarget.setPointerCapture(e.pointerId)
    setDrag(true)
  }
  const move = (e: PointerEvent) => {
    const c = g.current
    if (e.pointerId !== c.id) return
    const dt = Math.max(e.timeStamp - c.t, 1)
    // Smoothed velocity in px/ms, so a quick flick counts even before the threshold.
    c.vx = 0.8 * ((e.clientX - c.x) / dt) + 0.2 * c.vx
    c.vy = 0.8 * ((e.clientY - c.y) / dt) + 0.2 * c.vy
    Object.assign(c, { t: e.timeStamp, x: e.clientX, y: e.clientY })
    setPos((p) => ({ ...p, x: e.clientX - c.x0, y: e.clientY - c.y0 }))
  }
  // decide = false when the browser takes the pointer away (pointercancel): snap back, never swipe by accident.
  const up = (e: PointerEvent, decide = true) => {
    const c = g.current
    if (e.pointerId !== c.id) return
    c.id = -1
    setDrag(false)
    const dx = decide ? c.x - c.x0 : 0
    // A tap, not a drag: turn the card over instead of swiping it.
    if (decide && Math.hypot(dx, c.y - c.y0) < 8) {
      flip()
      setPos((p) => ({ ...p, x: 0, y: 0 }))
      return
    }
    const flick = Math.abs(c.vx) > 0.5 && Math.abs(dx) > 30 && Math.sign(c.vx) === Math.sign(dx)
    if (dx > THRESHOLD || (flick && dx > 0)) fly(1, c.vy)
    else if (dx < -THRESHOLD || (flick && dx < 0)) fly(-1, c.vy)
    else setPos((p) => ({ ...p, x: 0, y: 0 }))
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      if (t.closest('input, textarea, select, [role=dialog]')) return
      if (e.key === 'ArrowRight') fly(1)
      if (e.key === 'ArrowLeft') fly(-1)
      if (e.key === 'Escape') setFlippedId(null) // back to the front, like every closeable panel (docs/ACCESSIBILITY.md)
      if ((e.key === 'Enter' || e.key === ' ') && !t.closest('button, a')) {
        e.preventDefault()
        flip()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  // How far the top card is out (0..1): the card behind grows into place as it goes.
  const out = Math.min(Math.abs(pos.x) / (THRESHOLD * 2), 1)
  const style = (k: number): CSSProperties => {
    // Same transform list at every position, so a card moving to the front interpolates cleanly.
    const t = (x: number, y: number, r: number, s: number) => `translate(${x}px, ${y}px) rotate(${r}deg) scale(${s})`
    // Follow the finger with no delay, fly out with an ease-out, snap back or step forward with a slight overshoot.
    const transition = drag
      ? 'none'
      : flying
        ? `transform ${FLY_MS}ms cubic-bezier(.2,.8,.2,1)`
        : `transform ${reduce ? 150 : 400}ms cubic-bezier(.34,1.56,.64,1)`
    if (k === 0) {
      const r = reduce ? 0 : Math.max(-30, Math.min(30, (pos.x / 14) * pos.tilt))
      return { zIndex: 3, transform: t(pos.x, pos.y, r, 1), transition }
    }
    if (k === 1) return { zIndex: 2, transform: t(0, 12 - 12 * out, 0, 0.95 + 0.05 * out), transition }
    return { zIndex: 1, transform: t(0, 24, 0, 0.9), transition }
  }

  return (
    <>
      <div
        className="relative min-h-0 flex-1 animate-in cursor-grab touch-none duration-300 ease-out select-none fade-in zoom-in-95 [-webkit-touch-callout:none] active:cursor-grabbing"
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={(e) => up(e, false)}
        onLostPointerCapture={(e) => up(e, false)}
      >
        {deck
          .slice(0, 3)
          .map((x, k) => (
            <SwipeCard
              key={x.ev.id}
              item={x}
              style={style(k)}
              flipped={!k && flippedId === x.ev.id}
              reduce={reduce}
              like={k ? 0 : Math.max(0, Math.min(pos.x / 110, 1))}
              skip={k ? 0 : Math.max(0, Math.min(-pos.x / 110, 1))}
            />
          ))
          .reverse()}
        {done && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-line bg-surface p-6 text-center">
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
          className="flex h-16 w-16 items-center justify-center rounded-full border border-line bg-surface shadow-[0_4px_12px_rgba(10,31,68,.14)] transition-transform hover:scale-105 active:scale-90 disabled:opacity-50 disabled:hover:scale-100"
        >
          <X size={28} strokeWidth={2.4} aria-hidden />
        </button>
        <button
          type="button"
          aria-label="Interesuje mnie"
          onClick={() => fly(1)}
          disabled={done}
          className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-600 shadow-[0_4px_12px_rgba(10,31,68,.14)] transition-transform hover:scale-105 active:scale-90 disabled:opacity-50 disabled:hover:scale-100"
        >
          <Heart size={28} color="#fff" aria-hidden />
        </button>
      </div>
    </>
  )
}

function SwipeCard({ item, style, like, skip, flipped, reduce }: { item: Scored; style: CSSProperties; like: number; skip: number; flipped: boolean; reduce: boolean }) {
  const { ev, reason } = item
  const c = category(ev.category)
  const stamp = 'absolute top-4 rounded-[10px] border-[3px] bg-white px-3 py-1 text-xl font-semibold tracking-[.06em]'
  return (
    <article
      className="absolute inset-0 overflow-hidden rounded-3xl shadow-[0_12px_32px_rgba(10,31,68,.22)] [perspective:1400px] will-change-transform"
      style={{ background: c.color, ...style }}
      aria-hidden={style.zIndex !== 3}
    >
      {/* The two faces turn together; each hides its own back, so only one is ever visible. */}
      <div
        className="absolute inset-0 transform-3d"
        style={{ transform: `rotateY(${flipped ? 180 : 0}deg)`, transition: reduce ? 'none' : 'transform 500ms cubic-bezier(.4,.2,.2,1)' }}
      >
        <div className="absolute inset-0 flex flex-col backface-hidden" aria-hidden={flipped}>
          <div className="pointer-events-none absolute inset-x-0 top-3 z-10 flex justify-center" aria-hidden>
            <span className="rounded-full bg-black/45 px-3 py-1 text-[13px] font-medium text-white backdrop-blur-sm">Kliknij, aby odwrócić</span>
          </div>
          {/* The photo gets the space above the text, so it is cropped to what shows instead of hiding under the panel. */}
          <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden">
            <c.Icon size={96} color="#fff" strokeWidth={1.6} aria-hidden />
            <Photo src={photoUrl(ev, 640)} className="pointer-events-none absolute inset-0 h-full w-full object-cover" />
          </div>
          <div className={`${stamp} left-4 -rotate-10 border-brand-600 text-brand-600`} style={{ opacity: like }}>
            WCHODZĘ
          </div>
          <div className={`${stamp} right-4 rotate-10 border-ink-900 text-ink-900`} style={{ opacity: skip }}>
            NIE DLA MNIE
          </div>
          {/* The fade is the top 4rem (-mt-16), all of it over the photo; if the text is taller than the card, the reason line is cut, never the title. */}
          <div className="relative -mt-16 flex flex-none flex-col gap-2 bg-[linear-gradient(to_top,rgba(10,31,68,.97)_0%,rgba(10,31,68,.92)_calc(100%_-_4rem),rgba(10,31,68,0)_100%)] px-4 pt-16 pb-4 text-white">
            <div className="flex flex-wrap items-center gap-2">
              <CategoryBadge cat={c} onDark className="text-[13px]" />
              {ev.promoted && <PromotedTag />}
            </div>
            <h2 className="text-[24px] leading-[1.15] font-semibold">{ev.event_name}</h2>
            <div className="flex items-center gap-2 text-[15px] text-[#E6EEFF]">
              <Calendar size={18} aria-hidden />
              {formatRange(ev)}
            </div>
            <div className="flex items-center gap-2 text-[15px] text-[#E6EEFF]">
              <MapPin size={18} aria-hidden />
              {ev.address}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className={`rounded-lg px-2.5 py-0.5 text-sm font-semibold text-ink-900 ${ev.price ? 'bg-spark-500' : 'bg-white'}`}>
                {formatPrice(ev.price)}
              </span>
              <OrganizerLine ev={ev} className="text-[13px] text-[#E6EEFF]" />
            </div>
            <div className="flex items-start gap-2 rounded-xl bg-violet-50 px-3 py-2 text-sm font-medium text-fg">
              <Sparkles size={18} className="mt-px flex-none text-violet-600" aria-hidden />
              {reason}
            </div>
          </div>
        </div>
        <div className="absolute inset-0 flex rotate-y-180 flex-col gap-3 bg-ink-900 p-5 text-white backface-hidden" aria-hidden={!flipped}>
          <div className="flex flex-wrap items-center gap-2">
            <CategoryBadge cat={c} onDark className="text-[13px]" />
            {ev.promoted && <PromotedTag />}
          </div>
          <h2 className="text-[28px] leading-[1.15] font-semibold">{ev.event_name}</h2>
          <div className="min-h-0 flex-1 overflow-y-auto">
            <p className="text-[14px] font-semibold tracking-[.06em] text-[#E6EEFF] uppercase">Opis</p>
            <p className="mt-1.5 text-[20px] leading-relaxed text-white">{ev.description || 'Organizator nie dodał jeszcze szczegółowego opisu.'}</p>
          </div>
          <div className="flex flex-none flex-col gap-2">
            <div className="flex items-center gap-2 text-[15px] text-[#E6EEFF]">
              <Calendar size={18} aria-hidden />
              {formatRange(ev)}
            </div>
            <div className="flex items-center gap-2 text-[15px] text-[#E6EEFF]">
              <MapPin size={18} aria-hidden />
              {ev.address}
            </div>
          </div>
        </div>
      </div>
      {/* Dark theme only: a thin Spark-orange edge, drawn over both faces and not turning with them. */}
      <div className="pointer-events-none absolute inset-0 z-20 hidden rounded-3xl ring-[1.5px] ring-spark-500/60 ring-inset dark:block" aria-hidden />
    </article>
  )
}

import { BadgeCheck, Calendar, Heart, MapPin, Sparkles, X } from 'lucide-react'
import { useRef, useState } from 'react'
import { CATEGORIES, EVENTS, category, formatDate, formatPrice } from '@/data'
import { CategoryBadge, card } from '@/ui'
// ponytail: fixed demo deck; GET /card/{user_id} returns one card at a time once implemented
const DECK = ['robotyka', 'planszowki', 'integracja', 'jam'].map((id) => EVENTS.find((e) => e.id === id))
const THRESHOLD = 90
const FLY_MS = 260
export default function Odkrywaj({ liked, setLike }) {
  const [i, setI] = useState(0)
  const [dx, setDx] = useState(0)
  const [drag, setDrag] = useState(false)
  const [likedHere, setLikedHere] = useState(0)
  const startX = useRef(0)
  const busy = useRef(false)
  const done = i >= DECK.length
  const fly = (dir) => {
    if (busy.current || done) return
    busy.current = true
    setDrag(false)
    setDx(dir * 900)
    setTimeout(() => {
      busy.current = false
      setLike(DECK[i].id, dir > 0)
      if (dir > 0) setLikedHere((n) => n + 1)
      setI(i + 1)
      setDx(0)
    }, FLY_MS)
  }
  const down = (e) => {
    if (busy.current || done) return
    startX.current = e.clientX
    e.currentTarget.setPointerCapture(e.pointerId)
    setDrag(true)
    setDx(0)
  }
  const move = (e) => drag && setDx(e.clientX - startX.current)
  const up = () => {
    if (!drag) return
    setDrag(false)
    if (dx > THRESHOLD) fly(1)
    else if (dx < -THRESHOLD) fly(-1)
    else setDx(0)
  }
  const cardStyle = (pos) => {
    const transition = drag ? 'none' : `transform ${FLY_MS / 1000}s ease`
    if (pos === 0) return { zIndex: 3, transform: `translateX(${dx}px) rotate(${dx / 18}deg)`, transition }
    if (pos === 1)
      return { zIndex: 2, transform: `scale(${0.95 + Math.min(Math.abs(dx) / 1800, 0.05)}) translateY(14px)`, transition }
    if (pos === 2) return { zIndex: 1, transform: 'scale(0.9) translateY(28px)' }
    return { display: 'none' }
  }
  // "What we're learning": share of liked events per category, top 3.
  const likedEvents = EVENTS.filter((e) => liked.has(e.id))
  const counts = CATEGORIES.map((c) => ({ c, n: likedEvents.filter((e) => e.category === c.id).length }))
    .filter((x) => x.n > 0)
    .sort((a, b) => b.n - a.n)
    .slice(0, 3)
  const total = likedEvents.length
  return (
    <main className="mx-auto flex min-h-0 w-full max-w-[1360px] flex-1 justify-center gap-12 px-4 pt-2.5 pb-4 sm:px-6 sm:pt-3 md:px-10">
      <section className="flex min-h-0 max-w-[520px] min-w-0 flex-1 flex-col gap-2.5">
        <div className="flex flex-none items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-[-0.02em]">Odkrywaj</h1>
          <div className="rounded-full bg-brand-50 px-3 py-1 text-sm font-medium text-muted-foreground" aria-live="polite">
            {done ? 'Koniec talii' : `${i + 1} z ${DECK.length}`}
          </div>
        </div>

        <div
          className="relative min-h-0 flex-1 cursor-grab touch-pan-y select-none"
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={up}
          onPointerCancel={up}
        >
          {DECK.map((ev, k) => (
            <SwipeCard
              key={ev.id}
              ev={ev}
              style={cardStyle(k - i)}
              like={k === i ? Math.max(0, Math.min(dx / 110, 1)) : 0}
              skip={k === i ? Math.max(0, Math.min(-dx / 110, 1)) : 0}
            />
          ))}
          {done && (
            <div className="absolute inset-0 z-[5] flex flex-col items-center justify-center gap-2.5 rounded-3xl border-2 border-dashed border-line bg-white p-6 text-center">
              <div className="text-2xl font-semibold">To już wszystko na dziś</div>
              <div className="text-muted-foreground">
                Polubione wydarzenia znajdziesz w zakładce{' '}
                <a href="#/moje" className="font-medium text-brand-600 underline">
                  Moje
                </a>
                .
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-none justify-center gap-10 pt-1">
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
      </section>

      <aside className="hidden w-80 flex-none flex-col gap-4 pt-10 min-[1100px]:flex">
        <div className={`${card} flex flex-col gap-2.5 p-5`}>
          <h2 className="text-[15px] font-semibold">Twoja talia</h2>
          <div className="text-sm text-muted-foreground">
            Polubione: {likedHere} z {Math.min(i, DECK.length)}
          </div>
        </div>
        <div className={`${card} flex flex-col gap-3 p-5`}>
          <h2 className="text-[15px] font-semibold">Czego się uczymy</h2>
          {counts.map(({ c, n }) => {
            const pct = Math.round((n / total) * 100)
            return (
              <div key={c.id} className="flex items-center gap-2.5 text-sm">
                <c.Icon size={18} color={c.color} strokeWidth={2.2} aria-hidden />
                <span className="w-[120px]">{c.short}</span>
                <div className="h-2 flex-1 rounded bg-track">
                  <div className="h-2 rounded" style={{ width: `${pct}%`, background: c.color }} />
                </div>
                <span className="w-9 text-right text-muted-foreground">{pct}%</span>
              </div>
            )
          })}
        </div>
        <p className="text-[13px] leading-snug text-muted-foreground">
          Przeciągnij kartę w prawo, żeby polubić, w lewo, żeby pominąć. Możesz też użyć przycisków.
        </p>
      </aside>
    </main>
  )
}
function SwipeCard({ ev, style, like, skip }) {
  const c = category(ev.category)
  const stamp = 'absolute top-4 rounded-[10px] border-[3px] bg-white px-3 py-1 text-xl font-semibold tracking-[.06em]'
  return (
    <article
      className="absolute inset-0 flex flex-col justify-end overflow-hidden rounded-3xl shadow-[0_12px_32px_rgba(10,31,68,.22)]"
      style={{ background: c.color, ...style }}
      aria-hidden={style.zIndex !== 3}
    >
      <div className="absolute inset-x-0 top-0 bottom-[45%] flex items-center justify-center">
        <c.Icon size={112} color="#fff" strokeWidth={1.6} aria-hidden />
      </div>
      <div className={`${stamp} left-4 -rotate-10 border-brand-600 text-brand-600`} style={{ opacity: like }}>
        POLUBIĘ
      </div>
      <div className={`${stamp} right-4 rotate-10 border-ink-900 text-ink-900`} style={{ opacity: skip }}>
        POMIŃ
      </div>
      <div className="relative flex flex-col gap-2.5 bg-[linear-gradient(to_top,rgba(10,31,68,.97)_0%,rgba(10,31,68,.92)_62%,rgba(10,31,68,0)_100%)] px-5 pt-14 pb-[18px] text-white">
        <CategoryBadge cat={c} onDark className="text-[13px]" />
        <h2 className="text-[24px] leading-[1.15] font-semibold sm:text-[28px]">{ev.event_name}</h2>
        <div className="flex items-center gap-2 text-[15px] text-brand-50">
          <Calendar size={18} aria-hidden />
          {formatDate(ev.starts_at)}
        </div>
        <div className="flex items-center gap-2 text-[15px] text-brand-50">
          <MapPin size={18} aria-hidden />
          {ev.address}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span
            className={`rounded-lg px-2.5 py-0.5 text-sm font-semibold text-ink-900 ${ev.price ? 'bg-spark-500' : 'bg-white'}`}
          >
            {formatPrice(ev.price)}
          </span>
          <span className="flex items-center gap-1.5 text-[13px] text-brand-50">
            <BadgeCheck size={16} className="text-sky-300" aria-hidden />
            {ev.organizer}
          </span>
        </div>
        {ev.reason && (
          <div className="flex items-center gap-2 rounded-xl bg-violet-50 px-3 py-[9px] text-sm font-medium text-ink-900">
            <Sparkles size={18} className="text-violet-600" aria-hidden />
            {ev.reason}
          </div>
        )}
      </div>
    </article>
  )
}

import { ArrowLeft, Eye, Heart, MessageSquareQuote, Star, ThumbsDown, TimerOff } from 'lucide-react'
import { LIBRARY_AUDIENCE, LIBRARY_FEEDBACK, LIBRARY_STATS } from '@/lib/demo'
import { catalog } from '@/lib/events'
import { useStore } from '@/lib/store'
import { btnPrimary, card } from '@/ui'

const pct = (n: number, of: number) => `${Math.round((n / of) * 100)}%`

// Organizer stats on demo data: views, right / left / neutral (seen, app closed without a swipe), feedback (US-27, US-33).
export default function Statystyki() {
  const { state } = useStore()
  if (state.account?.kind !== 'org') {
    return (
      <div className="mx-auto flex h-full max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="text-[26px] font-semibold">Statystyki są dla organizacji</h1>
        <p className="text-muted">Zaloguj się jako biblioteka@demo, żeby zobaczyć panel organizatora.</p>
        <a href="#/logowanie" className={`${btnPrimary} h-12 w-full`}>
          Zaloguj się
        </a>
      </div>
    )
  }

  const names = new Map(catalog().map((e) => [e.id, e.event_name]))
  const rows = Object.entries(LIBRARY_STATS).sort((a, b) => b[1].views - a[1].views)
  const total = rows.reduce((t, [, s]) => ({ views: t.views + s.views, right: t.right + s.right, left: t.left + s.left, neutral: t.neutral + s.neutral }), {
    views: 0,
    right: 0,
    left: 0,
    neutral: 0,
  })

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 pt-4 pb-8 sm:px-8 sm:pt-8 md:grid md:grid-cols-2 md:items-start">
      <div className="flex items-center gap-2 md:col-span-2">
        <a href="#/konto" className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-surface" aria-label="Wstecz">
          <ArrowLeft size={22} aria-hidden />
        </a>
        <div>
          <h1 className="text-[26px] leading-tight font-semibold tracking-[-0.02em]">Statystyki</h1>
          <p className="text-sm text-muted">Ostatnie 30 dni · dane zbiorcze i anonimowe</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 md:col-span-2 md:grid-cols-4">
        <Tile Icon={Eye} label="Wyświetlenia" value={total.views} />
        <Tile Icon={Heart} label="W prawo" value={total.right} sub={pct(total.right, total.views)} />
        <Tile Icon={ThumbsDown} label="W lewo" value={total.left} sub={pct(total.left, total.views)} />
        <Tile Icon={TimerOff} label="Pominięte" value={total.neutral} sub="zamknięte bez swipe'a" />
      </div>

      <section className={`${card} flex flex-col gap-3 p-4 md:row-span-2`}>
        <h2 className="font-semibold">Wydarzenia</h2>
        <div className="flex gap-3 text-xs text-muted" aria-hidden>
          <Legend color="#1D5CFF" label="w prawo" />
          <Legend color="#0A1F44" label="w lewo" />
          <Legend color="#D9E2F2" label="pominięte" />
        </div>
        {rows.map(([id, s]) => (
          <div key={id} className="flex flex-col gap-1">
            <div className="flex justify-between gap-2 text-sm">
              <span className="font-medium">{names.get(id)}</span>
              <span className="flex-none text-muted">{s.views} wyśw.</span>
            </div>
            {/* Stacked bar; the numbers are in the label for screen readers. */}
            <div className="flex h-3 overflow-hidden rounded-full" role="img" aria-label={`W prawo ${s.right}, w lewo ${s.left}, pominięte ${s.neutral}`}>
              <span style={{ width: pct(s.right, s.views), background: '#1D5CFF' }} />
              <span style={{ width: pct(s.left, s.views), background: '#0A1F44' }} />
              <span style={{ width: pct(s.neutral, s.views), background: '#D9E2F2' }} />
            </div>
            <div className="text-xs text-muted">
              {pct(s.right, s.views)} w prawo · {pct(s.left, s.views)} w lewo
            </div>
          </div>
        ))}
      </section>

      <section className={`${card} flex flex-col gap-2 p-4`}>
        <h2 className="font-semibold">Kogo interesują twoje wydarzenia</h2>
        <p className="text-[13px] text-muted">Najczęstsze zainteresowania osób, które dały swipe w prawo.</p>
        {LIBRARY_AUDIENCE.map((a) => (
          <div key={a.label} className="flex items-center gap-2.5 text-sm">
            <span className="w-40">{a.label}</span>
            <div className="h-2 flex-1 rounded bg-track">
              <div className="h-2 rounded bg-violet-600" style={{ width: `${a.pct}%` }} />
            </div>
            <span className="w-9 text-right text-muted">{a.pct}%</span>
          </div>
        ))}
      </section>

      <section className={`${card} flex flex-col gap-3 p-4`}>
        <h2 className="flex items-center gap-2 font-semibold">
          <MessageSquareQuote size={20} className="text-link" aria-hidden />
          Opinie po wydarzeniach
        </h2>
        {LIBRARY_FEEDBACK.map((f) => (
          <figure key={f.event} className="flex flex-col gap-1 border-t border-line pt-3 first:border-0 first:pt-0">
            <figcaption className="flex items-center justify-between gap-2 text-sm font-medium">
              {f.event}
              <span className="flex flex-none" role="img" aria-label={`Ocena ${f.stars} na 5`}>
                {Array.from({ length: 5 }, (_, i) => (
                  <Star key={i} size={14} className={i < f.stars ? 'fill-spark-500 text-spark-500' : 'text-line'} aria-hidden />
                ))}
                <span className="ml-1 text-xs text-muted" aria-hidden>
                  {f.stars}/5
                </span>
              </span>
            </figcaption>
            <blockquote className="text-sm text-muted">„{f.text}”</blockquote>
          </figure>
        ))}
        <p className="text-[12px] text-muted">Uczestnicy dostają krótką ankietę po wydarzeniu i zawsze mogą ją pominąć.</p>
      </section>
    </div>
  )
}

function Tile({ Icon, label, value, sub }: { Icon: typeof Eye; label: string; value: number; sub?: string }) {
  return (
    <div className={`${card} flex flex-col gap-1 p-3.5`}>
      <span className="flex items-center gap-1.5 text-sm text-muted">
        <Icon size={16} aria-hidden />
        {label}
      </span>
      <span className="text-2xl leading-none font-semibold">{value.toLocaleString('pl-PL')}</span>
      {sub && <span className="text-xs text-muted">{sub}</span>}
    </div>
  )
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1">
      <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
      {label}
    </span>
  )
}

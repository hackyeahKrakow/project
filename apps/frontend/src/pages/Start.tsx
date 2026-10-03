import { CalendarHeart, PenLine } from 'lucide-react'
import { category } from '@/lib/categories'
import { inRange, type SpottedEvent } from '@/lib/events'
import { Logo, btnOutline, btnPrimary } from '@/ui'

// Pins falling onto an illustrated map: "a lot is going on here" (docs/USER_FLOW.md, ekran powitalny).
export default function Start({ events }: { events: SpottedEvent[] }) {
  const today = events.filter((e) => inRange(e.starts_at, 'dzis'))
  const week = events.filter((e) => inRange(e.starts_at, 'tydzien'))
  const pins = week.slice(0, 18)

  return (
    // Phones: map on top, text below. Tablets and laptops: text on the left, map on the right.
    <div className="flex h-full flex-col bg-ink-900 text-white md:flex-row-reverse">
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <svg className="absolute inset-0 h-full w-full opacity-25" viewBox="0 0 400 500" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <path d="M-20 420 C90 380 180 470 420 360" stroke="#7DB8FF" strokeWidth="38" fill="none" />
          <rect x="120" y="70" width="160" height="150" rx="40" fill="none" stroke="#7DB8FF" strokeWidth="12" />
          <path
            d="M200 0V110M200 180V360M0 145H150M250 145H400M0 290L400 250M60 500L120 250M330 500L290 250"
            stroke="#fff"
            strokeWidth="6"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
        {pins.map((ev, i) => {
          const c = category(ev.category)
          // Central Kraków stretched over the screen; outskirts stick to the edges.
          const x = Math.min(90, Math.max(4, 6 + ((ev.lng - 19.9) / 0.065) * 84))
          const y = Math.min(70, Math.max(14, 14 + ((50.072 - ev.lat) / 0.03) * 56))
          return (
            <span
              key={ev.id}
              className="pin-drop absolute flex h-9 w-9 items-center justify-center rounded-full border-[3px] border-white"
              style={{ left: `${x}%`, top: `${y}%`, background: c.color, animationDelay: `${0.15 * i}s` }}
              aria-hidden
            >
              <c.Icon size={16} color="#fff" strokeWidth={2.4} />
            </span>
          )
        })}
        <div className="absolute top-5 left-5 rounded-2xl bg-white px-3 py-1.5 md:hidden">
          <Logo height={32} />
        </div>
        <div className="absolute inset-x-4 bottom-4 flex gap-2 md:inset-x-auto md:right-8 md:bottom-8 md:w-[420px]">
          <Stat value={today.length} label="dziś w Krakowie" />
          <Stat value={week.length} label="w tym tygodniu" />
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-t-[28px] bg-white px-5 pt-6 pb-7 text-ink-900 md:w-[480px] md:justify-center md:rounded-none md:px-12">
        <Logo height={56} className="mb-4 hidden self-start md:block" />
        <h1 className="text-[30px] leading-[1.05] font-semibold tracking-[-0.03em] md:text-[44px]">Zmatchuj się z eventami</h1>
        <p className="text-[15px] leading-snug text-muted">
          Swipe'uj wydarzenia jak na randkowej apce. Po minucie masz własną mapę miasta z tym, co cię kręci.
        </p>
        <a href="#/onboarding" className={`${btnPrimary} mt-1 h-14 text-lg`}>
          <CalendarHeart size={22} aria-hidden />
          Tylko przeglądam
        </a>
        <a href="#/logowanie" className={`${btnOutline} h-14 text-lg`}>
          <PenLine size={20} aria-hidden />
          Chcę tworzyć wydarzenia
        </a>
        <p className="text-center text-[13px] text-muted">Przeglądanie bez konta, maila i numeru telefonu.</p>
      </div>
    </div>
  )
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex-1 rounded-2xl bg-white/10 px-4 py-3 backdrop-blur">
      <div className="text-3xl leading-none font-semibold">{value}</div>
      <div className="text-[13px] text-sky-300">{label}</div>
    </div>
  )
}

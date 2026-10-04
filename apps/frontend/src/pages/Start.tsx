import { Accessibility, CalendarHeart, ChevronDown, PenLine } from 'lucide-react'
import { inRange, type SpottedEvent } from '@/lib/events'
import { useStore } from '@/lib/store'
import { EventMap, Logo, Toggle, btnOutline, btnPrimary } from '@/ui'

const NONE = new Set<string>()

// Pins dropping onto the OpenStreetMap map of Kraków: "a lot is going on here" (docs/USER_FLOW.md, ekran powitalny).
export default function Start({ events }: { events: SpottedEvent[] }) {
  const { state, update } = useStore()
  const today = events.filter((e) => inRange(e, 'dzis'))
  const week = events.filter((e) => inRange(e, 'tydzien'))

  return (
    // Phones: map on top, text below. Tablets and laptops: text on the left, map on the right.
    <div className="flex h-full flex-col bg-ink-900 text-white md:flex-row-reverse">
      <div className="relative min-h-0 flex-1 overflow-hidden">
        {/* Not interactive: a backdrop with every upcoming event at its real place. */}
        <div className="pin-drop-map absolute inset-0 z-0">
          <EventMap events={events} liked={NONE} interactive={false} zoom={11.5} className="h-full" />
        </div>
        <div className="absolute top-5 left-5 rounded-2xl bg-white px-3 py-1.5 md:hidden">
          <Logo height={32} />
        </div>
        {/* Above the map's bottom edge: the OpenStreetMap attribution sits there and must stay visible. */}
        <div className="absolute inset-x-4 bottom-12 flex gap-2 md:inset-x-auto md:right-8 md:bottom-14 md:w-[420px]">
          <Stat value={today.length} label="dziś w Krakowie" />
          <Stat value={week.length} label="w tym tygodniu" />
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-t-[28px] bg-surface px-5 pt-6 pb-7 text-fg md:w-[480px] md:justify-center md:rounded-none md:px-12">
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
        {/* Before onboarding, so a person who needs bigger text or step-free places sets it up first (docs/USER_FLOW.md). */}
        <details className="group rounded-2xl border border-line px-4">
          <summary className="flex min-h-12 cursor-pointer list-none items-center gap-2 font-semibold">
            <Accessibility size={20} className="text-link" aria-hidden />
            Ułatwienia dostępu
            <ChevronDown size={18} className="ml-auto transition-transform group-open:rotate-180" aria-hidden />
          </summary>
          <div className="flex flex-col divide-y divide-line pb-1">
            <Toggle label="Większy tekst" on={state.bigText} onChange={(bigText) => update({ bigText })} />
            <Toggle label="Wysoki kontrast" on={state.highContrast} onChange={(highContrast) => update({ highContrast })} />
            <Toggle
              label="Miejsca i dojazd bez barier"
              hint="Wózek, kule, wózek dziecięcy"
              on={!!state.profile.stepFree}
              onChange={(stepFree) => update((s) => ({ profile: { ...s.profile, stepFree } }))}
            />
          </div>
        </details>
        <p className="text-center text-[13px] text-muted">Przeglądanie bez konta, maila i numeru telefonu.</p>
      </div>
    </div>
  )
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex-1 rounded-2xl bg-ink-900/90 px-4 py-3 text-white backdrop-blur">
      <div className="text-3xl leading-none font-semibold">{value}</div>
      <div className="text-[13px] text-sky-300">{label}</div>
    </div>
  )
}

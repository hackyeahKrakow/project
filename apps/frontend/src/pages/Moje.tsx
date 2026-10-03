import { CalendarArrowDown, ChevronLeft, ChevronRight, Plus, Users } from 'lucide-react'
import { useState } from 'react'
import { category } from '@/lib/categories'
import { eventDays, formatDay, formatPrice, formatTime, inRange, todayYmd, warsawDay, type SpottedEvent } from '@/lib/events'
import { downloadIcs } from '@/lib/ics'
import { photoUrl } from '@/lib/photos'
import { useStore } from '@/lib/store'
import { CategoryBadge, EventCard, OrganizerLine, Screen, Sheet, Thumb, btnOutline, btnPrimary, card } from '@/ui'

const WEEKDAYS = ['pon', 'wt', 'śr', 'czw', 'pt', 'sob', 'ndz']
const monthFmt = new Intl.DateTimeFormat('pl-PL', { month: 'long', year: 'numeric', timeZone: 'UTC' })

// Liked events as an agenda or a month grid, with .ics export (docs/USER_FLOW.md, zakładka Moje).
export default function Moje({ events, liked }: { events: SpottedEvent[]; liked: Set<string> }) {
  const { state, update } = useStore()
  const [view, setView] = useState<'agenda' | 'miesiac'>('agenda')
  const [openId, setOpenId] = useState<string>()
  const today = todayYmd()
  const mine = events.filter((e) => liked.has(e.id) && inRange(e, 'wszystkie', today)).sort((a, b) => a.starts_at.localeCompare(b.starts_at))
  const open = events.find((e) => e.id === openId)

  const byDay = new Map<string, SpottedEvent[]>()
  // A multi-day event shows up on every day it runs (from today on in the agenda).
  for (const ev of mine) for (const day of eventDays(ev, today)) byDay.set(day, [...(byDay.get(day) ?? []), ev])
  const days = [...byDay.keys()].sort()

  return (
    <>
      <Screen
        wide
        title="Moje"
        sub={`${mine.length} nadchodzących polubionych`}
        action={
          state.account && (
            <a href="#/dodaj" className={`${btnPrimary} h-11 px-4`} aria-label="Dodaj wydarzenie">
              <Plus size={20} aria-hidden />
              Dodaj
            </a>
          )
        }
      >
        <div className="flex gap-2 sm:max-w-md">
          <div className="inline-flex flex-1 rounded-[14px] bg-track p-1" role="group" aria-label="Widok">
            {(['agenda', 'miesiac'] as const).map((v) => (
              <button
                key={v}
                type="button"
                aria-pressed={view === v}
                onClick={() => setView(v)}
                className={`h-10 flex-1 rounded-[11px] text-[15px] ${view === v ? 'bg-surface font-semibold shadow-[0_1px_3px_rgba(10,31,68,.15)]' : 'font-medium text-muted'}`}
              >
                {v === 'agenda' ? 'Agenda' : 'Miesiąc'}
              </button>
            ))}
          </div>
          <button
            type="button"
            disabled={!mine.length}
            onClick={() => downloadIcs(mine)}
            className={`${btnOutline} h-12 px-3`}
            aria-label="Eksportuj do kalendarza (.ics)"
          >
            <CalendarArrowDown size={20} aria-hidden />
            .ics
          </button>
        </div>

        <a href="#/organizatorzy" className={`${card} flex min-h-14 items-center gap-3 px-4 py-3 transition-colors hover:bg-canvas sm:max-w-md`}>
          <Users size={22} className="flex-none text-link" aria-hidden />
          <span className="flex flex-1 flex-col">
            <span className="font-semibold">Organizatorzy</span>
            <span className="text-[13px] text-muted">
              {state.follows.length ? `Obserwujesz: ${state.follows.length}` : 'Znajdź koła, kluby i miejsca do obserwowania'}
            </span>
          </span>
          <ChevronRight size={20} className="flex-none" aria-hidden />
        </a>

        {!mine.length ? (
          <div className={`${card} flex flex-col items-center gap-4 p-8 text-center`}>
            <p className="text-lg">Nie masz jeszcze polubionych wydarzeń.</p>
            <a href="#/odkrywaj" className={`${btnPrimary} h-12`}>
              Odkrywaj wydarzenia
            </a>
          </div>
        ) : view === 'agenda' ? (
          <div className="flex flex-col gap-5">
            {days
              .map((day) => [day, byDay.get(day)!] as const)
              .map(([day, list]) => (
                <section key={day} className="flex flex-col gap-2">
                  <h2 className="text-sm font-semibold tracking-[.04em] text-muted uppercase">{day === today ? 'Dziś' : formatDay(day)}</h2>
                  <div className="grid gap-2 lg:grid-cols-2">
                    {list.map((ev) => (
                      <Row key={ev.id} ev={ev} day={day} onOpen={() => setOpenId(ev.id)} />
                    ))}
                  </div>
                </section>
              ))}
          </div>
        ) : (
          <Month byDay={byDay} today={today} onOpen={setOpenId} />
        )}

        <p className="text-[13px] text-muted">Plik .ics otworzysz w Kalendarzu Google, Apple i Outlooku.</p>
      </Screen>

      <Sheet open={!!open} onClose={() => setOpenId(undefined)} label={open?.event_name ?? 'Wydarzenie'}>
        {open && (
          <EventCard
            ev={open}
            liked={liked.has(open.id)}
            onLike={() => {
              update((s) => {
                const swipes = { ...s.swipes }
                delete swipes[open.id]
                return { swipes }
              })
              setOpenId(undefined)
            }}
          />
        )}
      </Sheet>
    </>
  )
}

function Row({ ev, day, onOpen }: { ev: SpottedEvent; day: string; onOpen: () => void }) {
  const c = category(ev.category)
  const starts = warsawDay(ev.starts_at) === day // later days of a multi-day event say "trwa" instead of a start time
  return (
    <button type="button" onClick={onOpen} className={`${card} flex items-center gap-3 p-2.5 text-left`}>
      <div className={`w-12 flex-none text-center font-semibold ${starts ? 'text-lg' : 'text-sm text-muted'}`}>
        {starts ? formatTime(ev.starts_at) : 'trwa'}
      </div>
      <Thumb cat={c} iconSize={24} className="h-14 w-14 rounded-xl" photo={photoUrl(ev, 160)} />
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="leading-tight font-semibold">{ev.event_name}</span>
        <CategoryBadge cat={c} />
        <span className="text-[13px] text-muted">
          {ev.district} · {formatPrice(ev.price)}
          {ev.ends_at && warsawDay(ev.ends_at) !== warsawDay(ev.starts_at) && ` · do ${formatDay(warsawDay(ev.ends_at))}`}
        </span>
        <OrganizerLine ev={ev} className="text-[12px] text-muted" />
      </span>
    </button>
  )
}

function Month({ byDay, today, onOpen }: { byDay: Map<string, SpottedEvent[]>; today: string; onOpen: (id: string) => void }) {
  const [month, setMonth] = useState(today.slice(0, 7)) // yyyy-mm
  const [picked, setPicked] = useState(today)
  const first = new Date(`${month}-01T00:00:00Z`)
  const lead = (first.getUTCDay() + 6) % 7 // Monday-first
  const days = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0)).getUTCDate()
  // Moving to another month also picks a day in it: today in the current month, otherwise the 1st.
  const shift = (n: number) => {
    const next = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + n, 1)).toISOString().slice(0, 7)
    setMonth(next)
    setPicked(next === today.slice(0, 7) ? today : `${next}-01`)
  }
  const list = byDay.get(picked) ?? []

  return (
    <div className="grid items-start gap-3 md:grid-cols-[minmax(0,420px)_1fr] md:gap-6">
      <div className={`${card} p-3`}>
        <div className="mb-2 flex items-center justify-between">
          <button
            type="button"
            onClick={() => shift(-1)}
            className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-canvas"
            aria-label="Poprzedni miesiąc"
          >
            <ChevronLeft size={20} aria-hidden />
          </button>
          <span className="font-semibold capitalize">{monthFmt.format(first)}</span>
          <button
            type="button"
            onClick={() => shift(1)}
            className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-canvas"
            aria-label="Następny miesiąc"
          >
            <ChevronRight size={20} aria-hidden />
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted">
          {WEEKDAYS.map((d) => (
            <span key={d}>{d}</span>
          ))}
          {Array.from({ length: lead }, (_, i) => (
            <span key={`x${i}`} />
          ))}
          {Array.from({ length: days }, (_, i) => {
            const ymd = `${month}-${String(i + 1).padStart(2, '0')}`
            const evs = byDay.get(ymd) ?? []
            const on = ymd === picked
            return (
              <button
                key={ymd}
                type="button"
                onClick={() => setPicked(ymd)}
                aria-pressed={on}
                aria-label={`${i + 1}${evs.length ? `, ${evs.length} wydarzeń` : ''}`}
                className={`flex h-11 flex-col items-center justify-center rounded-xl text-[15px] ${on ? 'bg-brand-600 font-semibold text-white' : ymd === today ? 'bg-brand-50 font-semibold text-fg' : 'text-fg'}`}
              >
                {i + 1}
                <span className="flex h-1.5 gap-0.5">
                  {evs.slice(0, 3).map((e) => (
                    <span key={e.id} className="h-1.5 w-1.5 rounded-full" style={{ background: on ? '#fff' : category(e.category).color }} />
                  ))}
                </span>
              </button>
            )
          })}
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold tracking-[.04em] text-muted uppercase" aria-live="polite">
          {formatDay(picked)}
        </h2>
        {list.length ? (
          list.map((ev) => <Row key={ev.id} ev={ev} day={picked} onOpen={() => onOpen(ev.id)} />)
        ) : (
          <p className="text-muted">Brak polubionych wydarzeń tego dnia.</p>
        )}
      </div>
    </div>
  )
}

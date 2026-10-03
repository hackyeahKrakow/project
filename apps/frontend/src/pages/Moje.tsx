import { CalendarArrowDown, ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { useState } from 'react'
import { category } from '@/lib/categories'
import { formatDay, formatPrice, formatTime, todayYmd, warsawDay, type SpottedEvent } from '@/lib/events'
import { downloadIcs } from '@/lib/ics'
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
  const mine = events.filter((e) => liked.has(e.id) && warsawDay(e.starts_at) >= today).sort((a, b) => a.starts_at.localeCompare(b.starts_at))
  const open = events.find((e) => e.id === openId)

  const byDay = new Map<string, SpottedEvent[]>()
  for (const ev of mine) byDay.set(warsawDay(ev.starts_at), [...(byDay.get(warsawDay(ev.starts_at)) ?? []), ev])

  return (
    <>
      <Screen
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
        <div className="flex gap-2">
          <div className="inline-flex flex-1 rounded-[14px] bg-track p-1" role="tablist" aria-label="Widok">
            {(['agenda', 'miesiac'] as const).map((v) => (
              <button
                key={v}
                type="button"
                role="tab"
                aria-selected={view === v}
                onClick={() => setView(v)}
                className={`h-10 flex-1 rounded-[11px] text-[15px] ${view === v ? 'bg-white font-semibold shadow-[0_1px_3px_rgba(10,31,68,.15)]' : 'font-medium text-muted'}`}
              >
                {v === 'agenda' ? 'Agenda' : 'Miesiąc'}
              </button>
            ))}
          </div>
          <button type="button" disabled={!mine.length} onClick={() => downloadIcs(mine)} className={`${btnOutline} h-12 px-3`} aria-label="Eksportuj do kalendarza (.ics)">
            <CalendarArrowDown size={20} aria-hidden />
            .ics
          </button>
        </div>

        {!mine.length ? (
          <div className={`${card} flex flex-col items-center gap-4 p-8 text-center`}>
            <p className="text-lg">Nie masz jeszcze polubionych wydarzeń.</p>
            <a href="#/odkrywaj" className={`${btnPrimary} h-12`}>
              Odkrywaj wydarzenia
            </a>
          </div>
        ) : view === 'agenda' ? (
          <div className="flex flex-col gap-5">
            {[...byDay].map(([day, list]) => (
              <section key={day} className="flex flex-col gap-2">
                <h2 className="text-sm font-semibold tracking-[.04em] text-muted uppercase">{day === today ? 'Dziś' : formatDay(day)}</h2>
                {list.map((ev) => (
                  <Row key={ev.id} ev={ev} onOpen={() => setOpenId(ev.id)} />
                ))}
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

function Row({ ev, onOpen }: { ev: SpottedEvent; onOpen: () => void }) {
  const c = category(ev.category)
  return (
    <button type="button" onClick={onOpen} className={`${card} flex items-center gap-3 p-2.5 text-left`}>
      <div className="w-12 flex-none text-center text-lg font-semibold">{formatTime(ev.starts_at)}</div>
      <Thumb cat={c} iconSize={24} className="h-14 w-14 rounded-xl" />
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="leading-tight font-semibold">{ev.event_name}</span>
        <CategoryBadge cat={c} />
        <span className="text-[13px] text-muted">
          {ev.district} · {formatPrice(ev.price)}
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
  const shift = (n: number) => setMonth(new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + n, 1)).toISOString().slice(0, 7))
  const list = byDay.get(picked) ?? []

  return (
    <div className="flex flex-col gap-3">
      <div className={`${card} p-3`}>
        <div className="mb-2 flex items-center justify-between">
          <button type="button" onClick={() => shift(-1)} className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-canvas" aria-label="Poprzedni miesiąc">
            <ChevronLeft size={20} aria-hidden />
          </button>
          <span className="font-semibold capitalize">{monthFmt.format(first)}</span>
          <button type="button" onClick={() => shift(1)} className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-canvas" aria-label="Następny miesiąc">
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
                className={`flex h-11 flex-col items-center justify-center rounded-xl text-[15px] ${on ? 'bg-brand-600 font-semibold text-white' : ymd === today ? 'bg-brand-50 font-semibold text-ink-900' : 'text-ink-900'}`}
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
      <h2 className="text-sm font-semibold tracking-[.04em] text-muted uppercase">{formatDay(picked)}</h2>
      {list.length ? list.map((ev) => <Row key={ev.id} ev={ev} onOpen={() => onOpen(ev.id)} />) : <p className="text-muted">Brak polubionych wydarzeń tego dnia.</p>}
    </div>
  )
}

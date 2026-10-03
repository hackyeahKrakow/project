import { ChevronRight, Search } from 'lucide-react'
import { useState } from 'react'
import { category } from '@/lib/categories'
import { formatRange, inRange, type Organizer, type SpottedEvent } from '@/lib/events'
import { photoUrl } from '@/lib/photos'
import { useStore } from '@/lib/store'
import { EventCard, FollowButton, OrganizerLine, Screen, Sheet, Thumb, card, chip } from '@/ui'

const plural = new Intl.PluralRules('pl-PL')
const FORMS = { one: 'wydarzenie', few: 'wydarzenia', many: 'wydarzeń', other: 'wydarzenia' } as Record<string, string>
const countLabel = (n: number) => (n ? `${n} ${FORMS[plural.select(n)]}` : 'Brak nadchodzących wydarzeń')

// Organizers (koła, kluby, instytucje, studenci) with search and follow, so "Obserwuj" has a home (feedback from the review).
export default function Organizatorzy({ events, liked }: { events: SpottedEvent[]; liked: Set<string> }) {
  const { state, update } = useStore()
  const [q, setQ] = useState('')
  const [onlyFollowed, setOnlyFollowed] = useState(state.follows.length > 0)
  const [openId, setOpenId] = useState<string>()

  const orgs = new Map<string, { org: Organizer; upcoming: SpottedEvent[] }>()
  for (const ev of [...events].sort((a, b) => a.starts_at.localeCompare(b.starts_at))) {
    const entry = orgs.get(ev.organizer.id) ?? { org: ev.organizer, upcoming: [] }
    if (inRange(ev, 'wszystkie')) entry.upcoming.push(ev)
    orgs.set(ev.organizer.id, entry)
  }
  const needle = q.trim().toLocaleLowerCase('pl')
  const shown = [...orgs.values()]
    .filter(({ org }) => (!onlyFollowed || state.follows.includes(org.id)) && org.name.toLocaleLowerCase('pl').includes(needle))
    .sort((a, b) => b.upcoming.length - a.upcoming.length || a.org.name.localeCompare(b.org.name, 'pl'))
  const open = events.find((e) => e.id === openId)
  const toggleLike = (id: string) =>
    update((s) => {
      const swipes = { ...s.swipes }
      if (swipes[id] === 'right') delete swipes[id]
      else swipes[id] = 'right'
      return { swipes }
    })

  return (
    <>
      <Screen title="Organizatorzy" sub="Obserwuj koła, kluby i miejsca, a ich wydarzenia częściej trafią do twojej talii.">
        <label className="flex h-12 items-center gap-2 rounded-[14px] border border-line bg-surface px-3 has-focus-visible:outline-3 has-focus-visible:outline-offset-2 has-focus-visible:outline-link">
          <Search size={20} className="text-muted" aria-hidden />
          <span className="sr-only">Szukaj organizatora</span>
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Szukaj organizatora"
            className="h-full flex-1 border-0 bg-transparent p-0 text-base focus:ring-0 focus:outline-none"
          />
        </label>
        <div className="flex gap-2" role="group" aria-label="Pokaż">
          <button type="button" aria-pressed={!onlyFollowed} onClick={() => setOnlyFollowed(false)} className={chip(!onlyFollowed)}>
            Wszyscy ({orgs.size})
          </button>
          <button type="button" aria-pressed={onlyFollowed} onClick={() => setOnlyFollowed(true)} className={chip(onlyFollowed)}>
            Obserwowani ({state.follows.length})
          </button>
        </div>
        <p className="sr-only" aria-live="polite">
          Wyniki: {shown.length}
        </p>
        {shown.length === 0 && (
          <p className={`${card} p-5 text-[15px] text-muted`}>
            {onlyFollowed && !needle ? 'Nikogo jeszcze nie obserwujesz. Kliknij „Obserwuj” przy organizatorze.' : 'Brak organizatorów dla tego wyszukiwania.'}
          </p>
        )}
        <ul className="flex flex-col gap-3">
          {shown.map(({ org, upcoming }) => (
            <li key={org.id} className={`${card} flex flex-col gap-3 p-4`}>
              <div className="flex items-center gap-3">
                <span
                  className="flex h-12 w-12 flex-none items-center justify-center rounded-full bg-brand-50 text-lg font-semibold text-brand-700"
                  aria-hidden
                >
                  {org.name[0]}
                </span>
                <div className="flex min-w-0 flex-1 flex-col">
                  <h2 className="font-semibold">
                    <OrganizerLine ev={{ organizer: org }} className="text-[15px] text-fg" />
                  </h2>
                  <span className="text-[13px] text-muted">{countLabel(upcoming.length)}</span>
                </div>
                <FollowButton orgId={org.id} name={org.name} />
              </div>
              {upcoming.length > 0 && (
                <ul className="flex flex-col gap-1" aria-label={`Wydarzenia: ${org.name}`}>
                  {upcoming.slice(0, 3).map((ev) => (
                    <li key={ev.id}>
                      <button
                        type="button"
                        onClick={() => setOpenId(ev.id)}
                        className="flex min-h-11 w-full items-center gap-3 rounded-xl p-1.5 text-left hover:bg-canvas"
                      >
                        <Thumb cat={category(ev.category)} iconSize={18} className="h-10 w-10 rounded-lg" photo={photoUrl(ev, 120)} />
                        <span className="flex min-w-0 flex-1 flex-col">
                          <span className="truncate text-[15px] font-medium">{ev.event_name}</span>
                          <span className="text-[13px] text-muted">{formatRange(ev)}</span>
                        </span>
                        <ChevronRight size={18} className="text-muted" aria-hidden />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </Screen>
      <Sheet open={!!open} onClose={() => setOpenId(undefined)} label={open?.event_name ?? 'Wydarzenie'}>
        {open && <EventCard ev={open} liked={liked.has(open.id)} onLike={() => toggleLike(open.id)} />}
      </Sheet>
    </>
  )
}

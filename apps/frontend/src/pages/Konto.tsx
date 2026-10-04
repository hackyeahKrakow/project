import { BadgeCheck, BarChart3, Flame, LogIn, LogOut, Monitor, Moon, Plus, Share2, ShieldCheck, SlidersHorizontal, Sun, Trash2, UserRound } from 'lucide-react'
import { useState } from 'react'
import { CATEGORIES, category } from '@/lib/categories'
import { DEMO_ACCOUNTS, ORG_PLAN, PACKAGES } from '@/lib/demo'
import { LIBRARY, formatRange, type SpottedEvent } from '@/lib/events'
import { persona } from '@/lib/persona'
import { weights } from '@/lib/recommend'
import { useStore } from '@/lib/store'
import { LocationToggle, Screen, Toggle, btnOutline, btnPrimary, btnSpark, card } from '@/ui'

// Account tab: guest privacy and settings, or the student / organization profile (docs/USER_FLOW.md).
export default function Konto({ events }: { events: SpottedEvent[] }) {
  const { state, update, reset } = useStore()
  const { account } = state
  const demo = DEMO_ACCOUNTS.find((a) => a.email === account?.email)
  const w = weights(state.profile, state.swipes, events)
  const top = CATEGORIES.map((c) => ({ c, v: w[c.id] }))
    .sort((a, b) => b.v - a.v)
    .slice(0, 4)
  // Same organizer id as Dodaj gives new events: the demo library, or this account.
  const ownerId = account?.org === LIBRARY.name ? LIBRARY.id : account && `usr_${account.email}`
  const orgEvents = ownerId ? events.filter((e) => e.organizer.id === ownerId) : []
  const plan = PACKAGES.find((p) => p.id === ORG_PLAN.package)!
  const me = persona(w, state.profile.interests)
  const MeIcon = me ? category(me.ids[0]).Icon : UserRound
  const [shared, setShared] = useState('')
  const share = async () => {
    if (!me) return
    const text = `Mój typ w spootted: ${me.title}. A jaki jest twój?`
    try {
      if (navigator.share) await navigator.share({ text, url: location.origin })
      else {
        await navigator.clipboard.writeText(`${text} ${location.origin}`)
        setShared('Skopiowano do schowka.')
      }
    } catch {
      /* share sheet closed or clipboard blocked */
    }
  }

  return (
    <Screen wide title="Konto">
      <div className="grid items-start gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-4">
          {account ? (
            <div className={`${card} flex flex-col gap-3 p-4`}>
              <div className="flex items-center gap-3">
                <div className="flex h-14 w-14 flex-none items-center justify-center rounded-full bg-brand-50 text-xl font-semibold text-brand-700">
                  {(account.org ?? account.name).slice(0, 1)}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-lg leading-tight font-semibold">
                    {account.org ?? account.name}
                    {account.kind === 'org' && account.org === LIBRARY.name && (
                      <BadgeCheck size={18} className="flex-none text-link" aria-label="zweryfikowane" />
                    )}
                  </div>
                  <div className="text-sm text-muted">{account.kind === 'org' ? `Organizacja · ${account.name}` : 'Konto studenta'}</div>
                </div>
              </div>
              {demo && <p className="text-sm text-muted">{demo.about}</p>}
              {account.kind === 'org' && (
                <a href="#/sponsor" className="flex items-center justify-between rounded-xl bg-spark-50 px-3.5 py-2.5 text-sm">
                  <span className="flex items-center gap-2 font-semibold">
                    <Flame size={18} className="text-spark-500" aria-hidden />
                    Pakiet {plan.name}
                  </span>
                  <span className="text-muted">
                    AI: {ORG_PLAN.aiUsed} z {ORG_PLAN.aiLimit} w tym miesiącu
                  </span>
                </a>
              )}
              <div className="flex flex-wrap gap-2">
                <a href="#/dodaj" className={`${btnPrimary} h-12 flex-1`}>
                  <Plus size={20} aria-hidden />
                  Dodaj
                </a>
                {account.kind === 'org' && (
                  <a href="#/statystyki" className={`${btnOutline} h-12 flex-1`}>
                    <BarChart3 size={20} aria-hidden />
                    Statystyki
                  </a>
                )}
              </div>
            </div>
          ) : (
            <div className={`${card} flex flex-col gap-3 p-4`}>
              <div className="flex items-center gap-3">
                <div className="flex h-14 w-14 flex-none items-center justify-center rounded-full bg-track">
                  <UserRound size={28} className="text-muted" aria-hidden />
                </div>
                <div>
                  <div className="text-lg font-semibold">Przeglądasz anonimowo</div>
                  <div className="text-sm text-muted">Bez maila i numeru telefonu</div>
                </div>
              </div>
              <p className="text-sm text-muted">Konto przyda się, gdy zechcesz dodać własne wydarzenie albo nie stracić polubionych przy zmianie telefonu.</p>
              <a href="#/logowanie" className={`${btnPrimary} h-12`}>
                <LogIn size={20} aria-hidden />
                Zaloguj się lub załóż konto
              </a>
            </div>
          )}

          {orgEvents.length > 0 && (
            <section className="flex flex-col gap-2">
              <h2 className="font-semibold">{account?.kind === 'org' ? 'Wydarzenia organizacji' : 'Moje wydarzenia'}</h2>
              {orgEvents.slice(0, 8).map((e) => (
                <div key={e.id} className={`${card} flex items-center justify-between gap-2 px-4 py-3 text-sm`}>
                  <span className="font-medium">{e.event_name}</span>
                  <span className="flex-none text-muted">{formatRange(e)}</span>
                </div>
              ))}
            </section>
          )}
        </div>
        <div className="flex flex-col gap-4">
          <section className={`${card} flex flex-col gap-3 p-4`}>
            <h2 className="font-semibold">Jakim typem jesteś?</h2>
            {me ? (
              <>
                <div className="flex items-center gap-3">
                  <span className="flex h-14 w-14 flex-none items-center justify-center rounded-2xl" style={{ background: category(me.ids[0]).color }}>
                    <MeIcon size={28} color="#fff" strokeWidth={1.8} aria-hidden />
                  </span>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-lg leading-tight font-semibold">{me.title}</span>
                    <span className="text-sm text-muted">{me.blurb}</span>
                  </div>
                </div>
                <p className="text-[13px] text-muted">
                  Liczymy go na tym telefonie z zainteresowań i polubień, więc zmienia się razem z tobą.
                  {account?.kind === 'student' && ' Możesz go pokazać przy swoich wydarzeniach, żeby inni wiedzieli, czy pasujecie.'}
                </p>
                <button type="button" onClick={share} className={`${btnOutline} h-11 self-start px-4`}>
                  <Share2 size={18} aria-hidden />
                  Udostępnij
                </button>
              </>
            ) : (
              <p className="text-sm text-muted">Polub kilka wydarzeń w Odkrywaj, a powiemy ci, jakim typem jesteś.</p>
            )}
            <p role="status" className="text-[13px] text-muted empty:hidden">
              {shared}
            </p>
          </section>

          <section className={`${card} flex flex-col gap-3 p-4`}>
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Twój profil zainteresowań</h2>
              <a href="#/onboarding" className="flex items-center gap-1 text-sm font-medium text-link">
                <SlidersHorizontal size={16} aria-hidden />
                Zmień
              </a>
            </div>
            <p className="text-[13px] text-muted">Wagi rosną z każdym swipe'em w prawo i lekko maleją w lewo. Tak dobieramy talię.</p>
            {top.map(({ c, v }) => (
              <div key={c.id} className="flex items-center gap-2.5 text-sm">
                <c.Icon size={18} color={c.color} strokeWidth={2.2} aria-hidden />
                <span className="w-24">{c.short}</span>
                <div className="h-2 flex-1 rounded bg-track">
                  <div className="h-2 rounded" style={{ width: `${Math.round(v * 100)}%`, background: c.color }} />
                </div>
                <span className="w-9 text-right text-muted">{Math.round(v * 100)}%</span>
              </div>
            ))}
          </section>

          <section className={`${card} flex flex-col divide-y divide-line px-4`}>
            <LocationToggle
              hint="Odległość na kartach, kropka na mapie i start trasy dojazdu. Nie zapisujemy jej na serwerze."
              on={state.location}
              onChange={(location) => update({ location })}
            />
            <Toggle
              label="Miejsca i dojazd bez barier"
              hint="Wózek, kule, wózek dziecięcy: ukrywamy miejsca z barierami, trasy bez schodów, tramwaje niskopodłogowe"
              on={!!state.profile.stepFree}
              onChange={(stepFree) => update((s) => ({ profile: { ...s.profile, stepFree } }))}
            />
            <Toggle label="Powiadomienia" hint="Wkrótce" on={state.notifications} onChange={(notifications) => update({ notifications })} />
            <Toggle label="Większy tekst" hint="Dostępność" on={state.bigText} onChange={(bigText) => update({ bigText })} />
            <Toggle
              label="Wysoki kontrast"
              hint="Mocniejsze kolory tekstu, obramowań i fokusu"
              on={state.highContrast}
              onChange={(highContrast) => update({ highContrast })}
            />
            <div className="flex flex-col gap-2 py-3">
              <span id="motyw" className="font-medium">
                Motyw
              </span>
              <div className="inline-flex rounded-[14px] bg-track p-1" role="group" aria-labelledby="motyw">
                {(
                  [
                    ['system', 'Systemowy', Monitor],
                    ['light', 'Jasny', Sun],
                    ['dark', 'Ciemny', Moon],
                  ] as const
                ).map(([t, label, Icon]) => (
                  <button
                    key={t}
                    type="button"
                    aria-pressed={state.theme === t}
                    onClick={() => update({ theme: t })}
                    className={`flex h-10 flex-1 items-center justify-center gap-1.5 rounded-[11px] text-sm ${state.theme === t ? 'bg-surface font-semibold shadow-[0_1px_3px_rgba(10,31,68,.15)]' : 'font-medium text-muted'}`}
                  >
                    <Icon size={16} aria-hidden />
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section className="flex items-start gap-2.5 rounded-[14px] bg-violet-50 p-3.5 text-sm leading-snug">
            <ShieldCheck size={20} className="flex-none text-violet-600" aria-hidden />
            <span>
              Twój anonimowy identyfikator: <code className="text-[12px] break-all">{state.userId}</code>. Odpowiedzi z pytań, polubienia i ustawienia zgód są w
              pamięci tej przeglądarki. Twojej lokalizacji nie zapisujemy nigdzie.
            </span>
          </section>

          <div className="flex flex-col gap-2">
            {account && (
              <button type="button" onClick={() => update({ account: null })} className={`${btnOutline} h-12`}>
                <LogOut size={20} aria-hidden />
                Wyloguj
              </button>
            )}
            {account?.kind === 'org' && (
              <a href="#/sponsor" className={`${btnSpark} h-12`}>
                <Flame size={20} aria-hidden />
                Zostań sponsorem i zyskaj więcej
              </a>
            )}
            <button type="button" onClick={reset} className="flex h-12 items-center justify-center gap-2 text-[15px] font-medium text-muted">
              <Trash2 size={18} aria-hidden />
              Usuń moje dane z tego urządzenia
            </button>
          </div>
        </div>
      </div>
    </Screen>
  )
}

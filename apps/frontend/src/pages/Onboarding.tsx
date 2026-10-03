import { ArrowLeft, Bell, Check, LocateFixed, ShieldCheck } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { CATEGORIES, type CategoryId } from '@/lib/categories'
import { DISTRICTS, type Size } from '@/lib/events'
import { useStore, type Budget, type Goal, type Profile, type TimeOfDay } from '@/lib/store'
import { Toggle, btnPrimary, card, chip } from '@/ui'

const SIZES: [Size, string][] = [
  ['small', 'Kameralne (do ~30 osób)'],
  ['medium', 'Średnie (30–100)'],
  ['large', 'Duże (100+)'],
]
const GOALS: [Goal, string][] = [
  ['ludzie', 'Poznać ludzi'],
  ['nauka', 'Nauczyć się czegoś'],
  ['zabawa', 'Dobrze się bawić'],
  ['ruch', 'Ruszyć się'],
  ['spokoj', 'Kultura i spokój'],
  ['oszczedzac', 'Oszczędzić'],
]
const BUDGETS: [Budget, string][] = [
  ['free', 'Tylko darmowe'],
  ['upto20', 'Do 20 zł'],
  ['any', 'Bez limitu'],
]
const DISTANCES: [number, string][] = [
  [1, '1 km'],
  [3, '3 km'],
  [5, '5 km'],
  [0, 'Cały Kraków'],
]
const TIMES: [TimeOfDay, string][] = [
  ['po_zajeciach', 'Po zajęciach'],
  ['wieczory', 'Wieczory'],
  ['weekendy', 'Weekendy'],
]

const toggle = <T,>(list: T[], v: T, max = 99) => (list.includes(v) ? list.filter((x) => x !== v) : list.length < max ? [...list, v] : list)

// Four one-tap questions (docs/SPEC.md), optional permissions, then the privacy notice with an explicit consent button.
export default function Onboarding() {
  const { state, update } = useStore()
  const [step, setStep] = useState(0)
  const [p, setP] = useState<Profile>(state.profile)
  const [loc, setLoc] = useState(state.location)
  const [notifications, setNotifications] = useState(state.notifications)
  const set = (patch: Partial<Profile>) => setP({ ...p, ...patch })

  const finish = () => {
    update({ profile: p, location: loc, notifications, onboarded: true, consent: true })
    if (loc) navigator.geolocation?.getCurrentPosition(() => {}, () => {}) // ask the browser now, not mid-demo
    window.location.hash = '#/odkrywaj'
  }

  const steps = [
    {
      title: 'Co lubisz robić?',
      hint: 'Wybierz 3–5',
      body: (
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => {
            const on = p.interests.includes(c.id)
            return (
              <button key={c.id} type="button" aria-pressed={on} onClick={() => set({ interests: toggle<CategoryId>(p.interests, c.id, 5) })} className={chip(on)}>
                <c.Icon size={18} color={on ? '#fff' : c.color} strokeWidth={2.2} aria-hidden />
                {c.name}
              </button>
            )
          })}
        </div>
      ),
    },
    {
      title: 'Jakie wydarzenia wolisz?',
      hint: 'Możesz wybrać kilka',
      body: (
        <div className="flex flex-col gap-2">
          {SIZES.map(([s, label]) => (
            <Option key={s} on={p.sizes.includes(s)} onClick={() => set({ sizes: toggle(p.sizes, s) })} label={label} />
          ))}
          <Option on={!p.sizes.length} onClick={() => set({ sizes: [] })} label="Bez różnicy" />
        </div>
      ),
    },
    {
      title: 'Czego dziś szukasz?',
      hint: 'Do 3 odpowiedzi',
      body: (
        <div className="flex flex-wrap gap-2">
          {GOALS.map(([g, label]) => (
            <button key={g} type="button" aria-pressed={p.goals.includes(g)} onClick={() => set({ goals: toggle(p.goals, g, 3) })} className={chip(p.goals.includes(g))}>
              {label}
            </button>
          ))}
        </div>
      ),
    },
    {
      title: 'Co jest dla ciebie ważne?',
      hint: 'Budżet, okolica i pora',
      body: (
        <div className="flex flex-col gap-4">
          <Group label="Budżet">
            {BUDGETS.map(([b, label]) => (
              <button key={b} type="button" aria-pressed={p.budget === b} onClick={() => set({ budget: b })} className={chip(p.budget === b)}>
                {label}
              </button>
            ))}
          </Group>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-muted">Gdzie mieszkasz albo studiujesz?</span>
            <select value={p.district} onChange={(e) => set({ district: e.target.value })} className="h-12 rounded-xl border-line text-[15px] focus:border-brand-600 focus:ring-brand-600">
              {Object.keys(DISTRICTS).map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </label>
          <Group label="Jak daleko dojedziesz?">
            {DISTANCES.map(([d, label]) => (
              <button key={d} type="button" aria-pressed={p.distanceKm === d} onClick={() => set({ distanceKm: d })} className={chip(p.distanceKm === d)}>
                {label}
              </button>
            ))}
          </Group>
          <Group label="Kiedy masz czas?">
            {TIMES.map(([t, label]) => (
              <button key={t} type="button" aria-pressed={p.times.includes(t)} onClick={() => set({ times: toggle(p.times, t) })} className={chip(p.times.includes(t))}>
                {label}
              </button>
            ))}
          </Group>
        </div>
      ),
    },
    {
      title: 'Zgody (opcjonalne)',
      hint: 'Możesz je zmienić w każdej chwili w zakładce Konto',
      body: (
        <div className={`${card} flex flex-col divide-y divide-line px-4`}>
          <div className="flex items-center gap-3">
            <LocateFixed size={22} className="flex-none text-brand-600" aria-hidden />
            <div className="flex-1">
              <Toggle label="Lokalizacja" hint="Odległość na kartach i twoja kropka na mapie. Nie zapisujemy jej na serwerze." on={loc} onChange={setLoc} />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Bell size={22} className="flex-none text-brand-600" aria-hidden />
            <div className="flex-1">
              <Toggle label="Powiadomienia" hint="Wkrótce: przypomnienie o polubionym wydarzeniu." on={notifications} onChange={setNotifications} />
            </div>
          </div>
        </div>
      ),
    },
  ]

  const privacy = step === steps.length
  const current = steps[step]
  const canNext = step !== 0 || p.interests.length >= 3

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-none items-center gap-3 px-4 pt-4">
        <button type="button" onClick={() => (step ? setStep(step - 1) : (window.location.hash = '#/start'))} className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-white" aria-label="Wstecz">
          <ArrowLeft size={22} aria-hidden />
        </button>
        <div className="flex flex-1 gap-1.5" aria-label={`Krok ${Math.min(step + 1, 4)} z 4`}>
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className={`h-1.5 flex-1 rounded-full ${i <= step ? 'bg-brand-600' : 'bg-track'}`} />
          ))}
        </div>
        {step < 4 && (
          <button type="button" onClick={() => setStep(step + 1)} className="h-11 px-2 text-[15px] font-medium text-muted">
            Pomiń
          </button>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 pt-6 pb-4">
        {privacy ? (
          <div className="flex flex-col gap-4">
            <ShieldCheck size={44} className="text-brand-600" aria-hidden />
            <h1 className="text-[28px] leading-tight font-semibold tracking-[-0.02em]">Twoje dane, twoje zasady</h1>
            <ul className="flex flex-col gap-3 text-[15px] leading-snug">
              <Li>Nie mamy twojego maila ani numeru telefonu.</Li>
              <Li>Odpowiedzi z pytań i lokalizacja zostają na tym telefonie.</Li>
              <Li>Swipe'y kart startowych zapisujemy pod losowym, anonimowym identyfikatorem, bez danych osobowych.</Li>
              <Li>Każda karta mówi, dlaczego ją widzisz („Bo lubisz…”).</Li>
              <Li>Wyczyścisz przeglądarkę albo zmienisz telefon? Zaczynasz od nowa. Dane usuniesz też w zakładce Konto.</Li>
            </ul>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-1">
              {step < 4 && <span className="text-sm font-semibold text-brand-600">{step + 1} / 4</span>}
              <h1 className="text-[28px] leading-tight font-semibold tracking-[-0.02em]">{current.title}</h1>
              <p className="text-[15px] text-muted">{current.hint}</p>
            </div>
            {current.body}
          </div>
        )}
      </div>

      <div className="flex-none border-t border-line bg-white px-5 py-4">
        {privacy ? (
          <button type="button" onClick={finish} className={`${btnPrimary} h-14 w-full text-lg`}>
            Rozumiem, zaczynam
          </button>
        ) : (
          <button type="button" disabled={!canNext} onClick={() => setStep(step + 1)} className={`${btnPrimary} h-14 w-full text-lg`}>
            {step === 0 && !canNext ? `Wybierz jeszcze ${3 - p.interests.length}` : 'Dalej'}
          </button>
        )}
      </div>
    </div>
  )
}

function Option({ on, onClick, label }: { on: boolean; onClick: () => void; label: string }) {
  return (
    <button type="button" aria-pressed={on} onClick={onClick} className={`flex min-h-14 items-center justify-between rounded-2xl px-4 text-left text-[16px] font-medium ${on ? 'border-2 border-brand-600 bg-brand-50' : 'border border-line bg-white'}`}>
      {label}
      {on && <Check size={20} strokeWidth={2.6} className="text-brand-600" aria-hidden />}
    </button>
  )
}

function Group({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div role="group" aria-label={label} className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-muted">{label}</span>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  )
}

function Li({ children }: { children: ReactNode }) {
  return (
    <li className="flex gap-2.5">
      <Check size={20} strokeWidth={2.6} className="mt-0.5 flex-none text-brand-600" aria-hidden />
      {children}
    </li>
  )
}

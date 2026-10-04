import {
  Accessibility,
  ArrowLeft,
  Bell,
  Bike,
  BookOpen,
  Bus,
  CalendarDays,
  Check,
  Clock4,
  Coffee,
  Coins,
  Dumbbell,
  Footprints,
  Gift,
  LocateFixed,
  Map as MapIcon,
  Moon,
  PartyPopper,
  PiggyBank,
  ShieldCheck,
  Shuffle,
  User,
  Users,
  UsersRound,
  Wallet,
  type LucideIcon,
} from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { CATEGORIES, type CategoryId } from '@/lib/categories'
import { DISTRICTS, type Size } from '@/lib/events'
import { askPermission } from '@/lib/notify'
import { useStore, type Budget, type Goal, type Profile, type TimeOfDay } from '@/lib/store'
import { LocationToggle, Toggle, btnPrimary, card, chip } from '@/ui'

// Every answer chip has an icon next to its text (docs/DESIGN.md, ekran personalizacji).
type Answer<T> = [T, string, LucideIcon]
const SIZES: Answer<Size>[] = [
  ['small', 'Kameralne (do ~30 osób)', User],
  ['medium', 'Średnie (30–100)', Users],
  ['large', 'Duże (100+)', UsersRound],
]
const GOALS: Answer<Goal>[] = [
  ['ludzie', 'Poznać ludzi', Users],
  ['nauka', 'Nauczyć się czegoś', BookOpen],
  ['zabawa', 'Dobrze się bawić', PartyPopper],
  ['ruch', 'Ruszyć się', Dumbbell],
  ['spokoj', 'Kultura i spokój', Coffee],
  ['oszczedzac', 'Oszczędzić', PiggyBank],
]
const BUDGETS: Answer<Budget>[] = [
  ['free', 'Tylko darmowe', Gift],
  ['upto20', 'Do 20 zł', Coins],
  ['any', 'Bez limitu', Wallet],
]
const DISTANCES: Answer<number>[] = [
  [1, '1 km', Footprints],
  [3, '3 km', Bike],
  [5, '5 km', Bus],
  [0, 'Cały Kraków', MapIcon],
]
const TIMES: Answer<TimeOfDay>[] = [
  ['po_zajeciach', 'Po zajęciach', Clock4],
  ['wieczory', 'Wieczory', Moon],
  ['weekendy', 'Weekendy', CalendarDays],
]

const toggle = <T,>(list: T[], v: T, max = 99) => (list.includes(v) ? list.filter((x) => x !== v) : list.length < max ? [...list, v] : list)

// Four one-tap questions (docs/SPEC.md), optional permissions, then the privacy notice with an explicit consent button.
// `privacyOnly`: after login or sign-up, show just the privacy notice so consent is always an explicit button press.
export default function Onboarding({ privacyOnly = false }: { privacyOnly?: boolean }) {
  const { state, update } = useStore()
  const [step, setStep] = useState(privacyOnly ? 5 : 0)
  const [p, setP] = useState<Profile>(state.profile)
  const [loc, setLoc] = useState(state.location)
  const [notifications, setNotifications] = useState(state.notifications)
  const set = (patch: Partial<Profile>) => setP({ ...p, ...patch })

  const finish = () => {
    update(privacyOnly ? { consent: true } : { profile: p, location: loc, notifications, onboarded: true, consent: true })
    window.location.hash = state.account ? '#/konto' : '#/odkrywaj'
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
              <button
                key={c.id}
                type="button"
                aria-pressed={on}
                onClick={() => set({ interests: toggle<CategoryId>(p.interests, c.id, 5) })}
                className={chip(on)}
              >
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
          {SIZES.map(([s, label, Icon]) => (
            <Option key={s} on={p.sizes.includes(s)} onClick={() => set({ sizes: toggle(p.sizes, s) })} label={label} Icon={Icon} />
          ))}
          <Option on={!p.sizes.length} onClick={() => set({ sizes: [] })} label="Bez różnicy" Icon={Shuffle} />
        </div>
      ),
    },
    {
      title: 'Czego dziś szukasz?',
      hint: 'Do 3 odpowiedzi',
      body: (
        <div className="flex flex-wrap gap-2">
          {GOALS.map(([g, label, Icon]) => (
            <button
              key={g}
              type="button"
              aria-pressed={p.goals.includes(g)}
              onClick={() => set({ goals: toggle(p.goals, g, 3) })}
              className={chip(p.goals.includes(g))}
            >
              <Icon size={18} aria-hidden />
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
            {BUDGETS.map(([b, label, Icon]) => (
              <button key={b} type="button" aria-pressed={p.budget === b} onClick={() => set({ budget: b })} className={chip(p.budget === b)}>
                <Icon size={18} aria-hidden />
                {label}
              </button>
            ))}
          </Group>
          <div className="flex flex-col gap-1.5">
            <span id="district-label" className="text-sm font-medium text-muted">Gdzie mieszkasz albo studiujesz?</span>
            <select
              value={p.district}
              onChange={(e) => set({ district: e.target.value })}
              aria-labelledby="district-label"
              className="h-12 rounded-xl border-line bg-surface text-[15px] focus:border-link focus:ring-link"
            >
              {Object.keys(DISTRICTS).map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </div>
          <Group label="Jak daleko dojedziesz?">
            {DISTANCES.map(([d, label, Icon]) => (
              <button key={d} type="button" aria-pressed={p.distanceKm === d} onClick={() => set({ distanceKm: d })} className={chip(p.distanceKm === d)}>
                <Icon size={18} aria-hidden />
                {label}
              </button>
            ))}
          </Group>
          <Group label="Dostępność">
            <button type="button" aria-pressed={!!p.stepFree} onClick={() => set({ stepFree: !p.stepFree })} className={chip(!!p.stepFree)}>
              <Accessibility size={18} aria-hidden />
              Potrzebuję miejsc i dojazdu bez barier
            </button>
          </Group>
          <Group label="Kiedy masz czas?">
            {TIMES.map(([t, label, Icon]) => (
              <button
                key={t}
                type="button"
                aria-pressed={p.times.includes(t)}
                onClick={() => set({ times: toggle(p.times, t) })}
                className={chip(p.times.includes(t))}
              >
                <Icon size={18} aria-hidden />
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
            <LocateFixed size={22} className="flex-none text-link" aria-hidden />
            <div className="flex-1">
              <LocationToggle hint="Odległość na kartach, twoja kropka na mapie i start trasy dojazdu. Nie zapisujemy jej na serwerze." on={loc} onChange={setLoc} />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Bell size={22} className="flex-none text-link" aria-hidden />
            <div className="flex-1">
              <Toggle
                label="Powiadomienia"
                hint="Godzinę przed polubionym wydarzeniem, gdy aplikacja jest otwarta. „Dodaj do kalendarza” przypomni też przy zamkniętej."
                on={notifications}
                onChange={async (on) => setNotifications(on && (await askPermission()))}
              />
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
    <div className="mx-auto flex h-full w-full max-w-xl flex-col sm:py-6">
      <div className="flex flex-none items-center gap-3 px-4 pt-4">
        <button
          type="button"
          onClick={() => (step && !privacyOnly ? setStep(step - 1) : (window.location.hash = privacyOnly ? '#/logowanie' : '#/start'))}
          className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-surface"
          aria-label="Wstecz"
        >
          <ArrowLeft size={22} aria-hidden />
        </button>
        <div
          className={`flex flex-1 gap-1.5 ${privacyOnly ? 'invisible' : ''}`}
          role="progressbar"
          aria-label="Postęp"
          aria-valuemin={1}
          aria-valuemax={4}
          aria-valuenow={Math.min(step + 1, 4)}
          aria-valuetext={`Krok ${Math.min(step + 1, 4)} z 4`}
        >
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
            <ShieldCheck size={44} className="text-link" aria-hidden />
            <h1 className="text-[28px] leading-tight font-semibold tracking-[-0.02em]">Twoje dane, twoje zasady</h1>
            <ul className="flex flex-col gap-3 text-[15px] leading-snug">
              <Li>Nie mamy twojego maila ani numeru telefonu.</Li>
              <Li>Odpowiedzi z pytań zostają na tym telefonie.</Li>
              <Li>Lokalizację wysyłamy tylko, gdy klikniesz „Zaplanuj dojazd”: idzie do planera tras Transitous (z opcją „bez barier”, jeśli ją włączysz) i nigdzie jej nie zapisujemy.</Li>
              <Li>Swipe'y kart startowych zapisujemy pod losowym, anonimowym identyfikatorem, bez danych osobowych.</Li>
              <Li>Każda karta mówi, dlaczego ją widzisz („Bo lubisz…”).</Li>
              <Li>Wyczyścisz przeglądarkę albo zmienisz telefon? Zaczynasz od nowa. Dane usuniesz też w zakładce Konto.</Li>
            </ul>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-1">
              {step < 4 && <span className="text-sm font-semibold text-link">{step + 1} / 4</span>}
              <h1 className="text-[28px] leading-tight font-semibold tracking-[-0.02em]">{current.title}</h1>
              <p className="text-[15px] text-muted">{current.hint}</p>
            </div>
            {current.body}
          </div>
        )}
      </div>

      <div className="flex-none border-t border-line bg-surface px-5 py-4 sm:rounded-2xl sm:border-0 sm:bg-transparent">
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

function Option({ on, onClick, label, Icon }: { on: boolean; onClick: () => void; label: string; Icon: LucideIcon }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={`flex min-h-14 items-center justify-between rounded-2xl px-4 text-left text-[16px] font-medium ${on ? 'border-2 border-link bg-brand-50' : 'border border-line bg-surface'}`}
    >
      <span className="flex items-center gap-3">
        <Icon size={22} className="text-link" aria-hidden />
        {label}
      </span>
      {on && <Check size={20} strokeWidth={2.6} className="text-link" aria-hidden />}
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
      <Check size={20} strokeWidth={2.6} className="mt-0.5 flex-none text-link" aria-hidden />
      {children}
    </li>
  )
}

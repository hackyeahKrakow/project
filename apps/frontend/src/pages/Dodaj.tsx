import { ArrowLeft, CircleAlert, Info, LoaderCircle, LogIn, Sparkles } from 'lucide-react'
import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { parseEvent, searchAddress, type Draft, type Place } from '@/lib/api'
import { CATEGORIES, category, type CategoryId } from '@/lib/categories'
import { ORG_PLAN, SAMPLE_POST, demoDraft } from '@/lib/demo'
import { DISTRICTS, LIBRARY, at, daysFromToday, km, warsawDay, type Size, type SpottedEvent } from '@/lib/events'
import { myPersona } from '@/lib/persona'
import { useStore } from '@/lib/store'
import { CategoryBadge, Toggle, btnOutline, btnPrimary, btnSpark, card } from '@/ui'

type Form = {
  title: string
  category: CategoryId
  price: string
  date: string
  time: string
  endDate: string // optional: multi-day or long events
  endTime: string
  place: string
  district: string
  size: Size
  description: string
}
type Key = keyof Form

const EMPTY: Form = {
  title: '',
  category: 'gry',
  price: '0',
  date: warsawDay(new Date().toISOString()),
  time: '19:00',
  endDate: '',
  endTime: '',
  place: '',
  district: 'Stare Miasto',
  size: 'small',
  description: '',
}
const input = 'h-12 w-full rounded-xl px-3.5 text-base focus:border-link focus:ring-link'
const FIELD_OF: Record<string, Key> = {
  title: 'title',
  category: 'category',
  price: 'price',
  starts_at: 'date',
  ends_at: 'endDate',
  address: 'place',
  size: 'size',
  description: 'description',
}

/** Next Friday 20:00 in Warsaw, for the demo answer to SAMPLE_POST ("w piątek od 20:00"). */
const nextFriday = () => {
  for (let d = 0; d < 7; d++) {
    const iso = at(d, '20:00')
    if (new Date(iso).toLocaleDateString('en-GB', { weekday: 'short', timeZone: 'Europe/Warsaw' }) === 'Fri') return iso
  }
  return at(0, '20:00')
}

/** Polish message for the first invalid field, or '' when the form can be published. */
function validate(f: Form, today = warsawDay(new Date().toISOString())) {
  if (!f.title.trim()) return 'Podaj tytuł.'
  if (!/^\d{4}-\d{2}-\d{2}$/.test(f.date)) return 'Podaj datę.'
  if (f.date < today) return 'Data nie może być w przeszłości.'
  if (!/^\d{2}:\d{2}$/.test(f.time)) return 'Podaj godzinę.'
  if (f.endDate || f.endTime) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(f.endDate) || !/^\d{2}:\d{2}$/.test(f.endTime)) return 'Podaj datę i godzinę końca albo zostaw oba pola puste.'
    if (`${f.endDate}T${f.endTime}` <= `${f.date}T${f.time}`) return 'Koniec musi być po początku.'
  }
  if (!f.place.trim()) return 'Podaj adres.'
  const price = Number(f.price.replace(',', '.'))
  if (f.price.trim() === '' || !Number.isFinite(price) || price < 0) return 'Cena musi być liczbą od 0 w górę.'
  return ''
}

const hhmm = (iso: string) => new Date(iso).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Warsaw' })
const nearestDistrict = ([lat, lng]: [number, number]) => Object.keys(DISTRICTS).sort((a, b) => km(DISTRICTS[a], [lat, lng]) - km(DISTRICTS[b], [lat, lng]))[0]

function fromDraft(d: Draft, prev: Form): Form {
  const start = d.starts_at ? new Date(d.starts_at) : null
  return {
    title: d.title ?? prev.title,
    category: d.category ?? prev.category,
    price: d.price != null ? String(d.price) : prev.price,
    date: start ? warsawDay(d.starts_at!) : prev.date,
    time: start ? hhmm(d.starts_at!) : prev.time,
    endDate: d.ends_at ? warsawDay(d.ends_at) : prev.endDate,
    endTime: d.ends_at ? hhmm(d.ends_at) : prev.endTime,
    place: d.address ?? prev.place,
    district: prev.district,
    size: d.size ?? prev.size,
    description: d.description ?? prev.description,
  }
}

// Students fill the form by hand; organizations with a package paste a post and the AI fills it (docs/USER_FLOW.md).
export default function Dodaj() {
  const { state, update } = useStore()
  const { account } = state
  const org = account?.kind === 'org'
  const [paste, setPaste] = useState(SAMPLE_POST)
  const [form, setForm] = useState<Form>(EMPTY)
  const [flagged, setFlagged] = useState(new Set<Key>())
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState<'' | 'ai' | 'publish'>('')
  const [showType, setShowType] = useState(false) // publishing the type is the student's choice, off by default
  const me = myPersona(state)
  const [coords, setCoords] = useState<[number, number] | null>(null) // from a picked address suggestion

  if (!account) {
    return (
      <div className="mx-auto flex h-full max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="text-[26px] font-semibold">Dodawanie wymaga konta</h1>
        <p className="text-muted">Przeglądać możesz anonimowo. Żeby dodać wydarzenie, zaloguj się jako student albo organizacja.</p>
        <a href="#/logowanie" className={`${btnPrimary} h-12 w-full`}>
          <LogIn size={20} aria-hidden />
          Zaloguj się
        </a>
      </div>
    )
  }

  const pickPlace = (p: Place, base = form) => {
    setCoords([p.lat, p.lng])
    setForm({ ...base, place: p.label, district: nearestDistrict([p.lat, p.lng]) })
    setFlagged((f) => new Set([...f].filter((x) => x !== 'place')))
  }

  const set = (k: Key, v: string) => {
    if (k === 'place') setCoords(null) // typed by hand: no exact pin until a suggestion is picked
    setForm({ ...form, [k]: v })
    setFlagged((f) => new Set([...f].filter((x) => x !== k))) // editing a field = the person checked it
  }

  const fill = async () => {
    setBusy('ai')
    setNotice('')
    const real = await parseEvent(paste)
    if (real === 'invalid') {
      setBusy('')
      return setNotice('Tekst posta musi mieć od 10 do 4000 znaków.')
    }
    const draft = real ?? demoDraft(nextFriday())
    if (!real) setNotice('Model AI jest teraz niedostępny, więc pokazujemy przykładową odpowiedź dla tego posta.')
    const next = fromDraft(draft, form)
    // The AI gives an address as text: look it up once so the pin and district are right too.
    const [hit] = (draft.address && (await searchAddress(draft.address))) || []
    if (hit) pickPlace(hit, next)
    else {
      if (draft.address) setCoords(null) // a new address we couldn't find: don't keep the pin of the old one
      setForm(next)
    }
    setFlagged(new Set(draft.missing_fields.map((f) => FIELD_OF[f]).filter(Boolean)))
    setBusy('')
  }

  const publish = () => {
    const error = validate(form)
    if (error) return setNotice(error)
    setBusy('publish')
    const iso = at(daysFromToday(`${form.date}T12:00:00Z`), form.time)
    const endIso = form.endDate ? at(daysFromToday(`${form.endDate}T12:00:00Z`), form.endTime) : undefined
    // A picked address gives the exact pin; otherwise the district center, slightly spread so pins don't stack.
    const spread = () => (Math.random() - 0.5) * 0.006
    const [lat, lng] = coords ?? DISTRICTS[form.district].map((v) => v + spread())
    const district = form.district
    const ev: SpottedEvent = {
      id: `my_${Date.now()}`,
      event_name: form.title.trim(),
      description: form.description.trim() || form.title.trim(),
      starts_at: iso,
      ...(endIso && { ends_at: endIso }),
      address: form.place.trim(),
      lat,
      lng,
      price: Number(form.price.replace(',', '.')),
      category: form.category,
      size: form.size,
      district,
      organizer:
        org && account.org === LIBRARY.name
          ? LIBRARY
          : {
              id: `usr_${account.email}`,
              name: account.org ?? account.name,
              verified: false,
              kind: org ? 'org' : 'student',
              ...(!org && showType && me && { persona: me.ids }),
            },
    }
    // ponytail: no create-event endpoint yet, so the event lives on this device only
    update((s) => ({ myEvents: [...s.myEvents, ev], swipes: { ...s.swipes, [ev.id]: 'right' } }))
    setBusy('')
    window.location.hash = '#/moje'
  }

  const field = (k: Key, label: string, control: (cls: string) => ReactNode, grow = '') => {
    const check = flagged.has(k)
    return (
      <label className={`flex flex-col gap-1.5 ${grow}`}>
        <span className="flex items-center justify-between text-sm font-medium text-muted">
          {label}
          {check && (
            <span className="flex items-center gap-1 rounded-full bg-spark-500 px-2 py-0.5 text-xs font-semibold text-ink-900">
              <CircleAlert size={13} strokeWidth={2.4} aria-hidden />
              Sprawdź
            </span>
          )}
        </span>
        {control(`${input} ${check ? 'border-2 border-spark-500 bg-spark-50' : 'border border-line bg-surface'}`)}
      </label>
    )
  }
  const text =
    (k: Key, type = 'text') =>
    (cls: string) => <input type={type} className={cls} value={form[k]} onChange={(e) => set(k, e.target.value)} />

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 pt-4 pb-8 sm:px-8 sm:pt-8 md:grid md:grid-cols-[380px_minmax(0,1fr)] md:items-start md:gap-6">
      <div className="flex items-center gap-2 md:col-span-2">
        <a href="#/konto" className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-surface" aria-label="Wstecz">
          <ArrowLeft size={22} aria-hidden />
        </a>
        <h1 className="text-[26px] font-semibold tracking-[-0.02em] sm:text-[32px]">Dodaj wydarzenie</h1>
      </div>

      {org ? (
        <div className={`${card} flex flex-col gap-3 p-4`}>
          <div className="flex items-center justify-between">
            <label htmlFor="paste" className="font-semibold">
              Wklej tekst posta
            </label>
            <span className="text-xs text-muted">
              AI: {ORG_PLAN.aiUsed} z {ORG_PLAN.aiLimit}
            </span>
          </div>
          <textarea
            id="paste"
            maxLength={4000}
            value={paste}
            onChange={(e) => setPaste(e.target.value)}
            className="h-36 resize-none rounded-xl border border-line bg-canvas px-3.5 py-3 text-[15px] leading-[1.45] focus:border-link focus:ring-link"
          />
          <button type="button" className={`${btnSpark} h-12 w-full`} onClick={fill} disabled={!!busy || paste.trim().length < 10}>
            {busy === 'ai' ? <LoaderCircle size={20} className="animate-spin" aria-hidden /> : <Sparkles size={20} strokeWidth={2.2} aria-hidden />}
            {busy === 'ai' ? 'AI czyta post…' : 'Wypełnij z AI'}
          </button>
          <p className="flex items-start gap-2 rounded-[14px] bg-violet-50 p-3 text-sm leading-snug">
            <Sparkles size={18} className="flex-none text-violet-600" aria-hidden />
            AI tylko proponuje. Sprawdź pola oznaczone na pomarańczowo, zanim opublikujesz.
          </p>
        </div>
      ) : (
        <p className="rounded-[14px] bg-violet-50 p-3 text-sm leading-snug">Wypełnij formularz. Autouzupełnianie z AI jest w pakietach dla organizacji.</p>
      )}

      <form
        className={`${card} flex flex-col gap-4 p-4`}
        onSubmit={(e) => {
          e.preventDefault()
          publish()
        }}
      >
        {field('title', 'Tytuł', text('title'))}
        {field('category', 'Kategoria', (cls) => (
          <div className={`${cls} relative flex items-center has-focus-visible:outline-3 has-focus-visible:outline-offset-2 has-focus-visible:outline-link`}>
            <CategoryBadge cat={category(form.category)} className="text-sm" />
            <select
              aria-label="Kategoria"
              value={form.category}
              onChange={(e) => set('category', e.target.value)}
              className="absolute inset-0 cursor-pointer opacity-0"
            >
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        ))}
        <div className="flex gap-3">
          {field('date', 'Data', text('date', 'date'), 'flex-[3]')}
          {field('time', 'Godzina', text('time', 'time'), 'flex-[2]')}
        </div>
        <div className="flex gap-3">
          {field('endDate', 'Koniec: data (opcjonalnie)', text('endDate', 'date'), 'flex-[3]')}
          {field('endTime', 'Koniec: godzina', text('endTime', 'time'), 'flex-[2]')}
        </div>
        {field('place', 'Adres', (cls) => (
          <AddressInput className={cls} value={form.place} onChange={(v) => set('place', v)} onPick={(p) => pickPlace(p)} />
        ))}
        {field('district', 'Dzielnica (pin na mapie)', (cls) => (
          <select className={cls} value={form.district} onChange={(e) => set('district', e.target.value)}>
            {Object.keys(DISTRICTS).map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
        ))}
        <div className="flex gap-3">
          {field('price', 'Cena (zł, 0 = za darmo)', text('price'), 'flex-1')}
          {field(
            'size',
            'Wielkość',
            (cls) => (
              <select className={cls} value={form.size} onChange={(e) => set('size', e.target.value)}>
                <option value="small">Kameralne</option>
                <option value="medium">Średnie</option>
                <option value="large">Duże</option>
              </select>
            ),
            'flex-1',
          )}
        </div>
        {field('description', 'Opis', (cls) => (
          <textarea className={`${cls} h-28 py-3`} value={form.description} onChange={(e) => set('description', e.target.value)} />
        ))}
        {!org && me && <Toggle label="Pokaż przy wydarzeniu mój typ" hint={me.title} on={showType} onChange={setShowType} />}
        {notice && (
          <div role="status" className="flex items-start gap-2 rounded-xl border border-spark-500 bg-spark-50 px-3.5 py-2.5 text-sm">
            <Info size={18} className="flex-none" aria-hidden />
            {notice}
          </div>
        )}
        <div className="flex gap-3 border-t border-line pt-4">
          <a href="#/konto" className={`${btnOutline} h-12 flex-1`}>
            Anuluj
          </a>
          <button type="submit" disabled={!!busy} className={`${btnPrimary} h-12 flex-[2]`}>
            {busy === 'publish' && <LoaderCircle size={20} className="animate-spin" aria-hidden />}
            Opublikuj
          </button>
        </div>
      </form>
    </div>
  )
}

/** Address field with suggestions from GET /geocode (ARIA combobox: arrows, Enter, Escape). */
function AddressInput({ value, onChange, onPick, className }: { value: string; onChange: (v: string) => void; onPick: (p: Place) => void; className: string }) {
  const [items, setItems] = useState<Place[]>([])
  const [listOpen, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const picked = useRef('')
  const id = useId()
  const open = listOpen && value.trim().length >= 3 // erasing the text hides stale suggestions

  useEffect(() => {
    if (value.trim().length < 3 || value === picked.current) return
    let stale = false // a slower answer for older text must not replace the current one
    const t = setTimeout(async () => {
      const found = await searchAddress(value)
      if (stale) return
      setItems(found ?? [])
      setOpen(!!found?.length)
      setActive(-1)
    }, 350)
    return () => {
      stale = true
      clearTimeout(t)
    }
  }, [value])

  const pick = (p: Place) => {
    picked.current = p.label
    setOpen(false)
    onPick(p)
  }
  const onKey = (e: KeyboardEvent) => {
    if (!open) return
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((a) => (a + (e.key === 'ArrowDown' ? 1 : items.length - 1)) % items.length)
    } else if (e.key === 'Enter' && active >= 0) {
      e.preventDefault()
      pick(items[active])
    } else if (e.key === 'Escape') setOpen(false)
  }

  return (
    <div className="relative">
      <input
        role="combobox"
        aria-expanded={open}
        aria-controls={id}
        aria-autocomplete="list"
        aria-activedescendant={open && active >= 0 ? `${id}-${active}` : undefined}
        autoComplete="off"
        placeholder="np. Józefińska 20"
        className={className}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKey}
        onBlur={() => setOpen(false)}
      />
      <span className="sr-only" aria-live="polite">
        {open ? `${items.length} podpowiedzi adresu, wybierz strzałkami` : ''}
      </span>
      {open && (
        <ul
          id={id}
          role="listbox"
          aria-label="Podpowiedzi adresu"
          className="absolute inset-x-0 top-full z-20 mt-1 overflow-hidden rounded-xl border border-line bg-surface shadow-lg"
        >
          {items.map((p, i) => (
            <li
              key={`${p.label}-${i}`}
              id={`${id}-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => {
                e.preventDefault() // keep focus in the input
                pick(p)
              }}
              className={`flex min-h-11 cursor-pointer items-center px-3.5 text-[15px] ${i === active ? 'bg-brand-50 text-brand-700' : 'hover:bg-canvas'}`}
            >
              {p.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

import { ArrowLeft, CircleAlert, Info, LoaderCircle, LogIn, Sparkles } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { geocode, parseEvent, type Draft } from '@/lib/api'
import { CATEGORIES, category, type CategoryId } from '@/lib/categories'
import { ORG_PLAN, SAMPLE_POST, demoDraft } from '@/lib/demo'
import { DISTRICTS, LIBRARY, at, daysFromToday, km, warsawDay, type Size, type SpottedEvent } from '@/lib/events'
import { useStore } from '@/lib/store'
import { CategoryBadge, btnOutline, btnPrimary, btnSpark, card } from '@/ui'

type Form = { title: string; category: CategoryId; price: string; date: string; time: string; place: string; size: Size; description: string }
type Key = keyof Form

const EMPTY: Form = { title: '', category: 'gry', price: '0', date: warsawDay(new Date().toISOString()), time: '19:00', place: '', size: 'small', description: '' }
const input = 'h-12 w-full rounded-xl px-3.5 text-base focus:border-brand-600 focus:ring-brand-600'
const FIELD_OF: Record<string, Key> = { title: 'title', category: 'category', price: 'price', starts_at: 'date', address: 'place', size: 'size', description: 'description' }

/** Next Friday 20:00 in Warsaw, for the demo answer to SAMPLE_POST ("w piątek od 20:00"). */
const nextFriday = () => {
  for (let d = 0; d < 7; d++) {
    const iso = at(d, '20:00')
    if (new Date(iso).toLocaleDateString('en-GB', { weekday: 'short', timeZone: 'Europe/Warsaw' }) === 'Fri') return iso
  }
  return at(0, '20:00')
}

function fromDraft(d: Draft, prev: Form): Form {
  const start = d.starts_at ? new Date(d.starts_at) : null
  return {
    title: d.title ?? prev.title,
    category: d.category ?? prev.category,
    price: d.price != null ? String(d.price) : prev.price,
    date: start ? warsawDay(d.starts_at!) : prev.date,
    time: start ? start.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Warsaw' }) : prev.time,
    place: d.address ?? prev.place,
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

  if (!account) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="text-[26px] font-semibold">Dodawanie wymaga konta</h1>
        <p className="text-muted">Przeglądać możesz anonimowo. Żeby dodać wydarzenie, zaloguj się jako student albo organizacja.</p>
        <a href="#/logowanie" className={`${btnPrimary} h-12 w-full`}>
          <LogIn size={20} aria-hidden />
          Zaloguj się
        </a>
      </div>
    )
  }

  const set = (k: Key, v: string) => {
    setForm({ ...form, [k]: v })
    setFlagged((f) => new Set([...f].filter((x) => x !== k))) // editing a field = the person checked it
  }

  const fill = async () => {
    setBusy('ai')
    setNotice('')
    const real = await parseEvent(paste)
    const draft = real ?? demoDraft(nextFriday())
    if (!real) setNotice('Model AI jest teraz niedostępny, więc pokazujemy przykładową odpowiedź dla tego posta.')
    setForm(fromDraft(draft, form))
    setFlagged(new Set(draft.missing_fields.map((f) => FIELD_OF[f]).filter(Boolean)))
    setBusy('')
  }

  const publish = async () => {
    if (!form.title.trim() || !form.place.trim()) return setNotice('Uzupełnij tytuł i miejsce.')
    setBusy('publish')
    const iso = at(daysFromToday(`${form.date}T12:00:00Z`), form.time)
    const [lat, lng] = (await geocode(form.place)) ?? DISTRICTS['Stare Miasto']
    const district = Object.keys(DISTRICTS).sort((a, b) => km(DISTRICTS[a], [lat, lng]) - km(DISTRICTS[b], [lat, lng]))[0]
    const ev: SpottedEvent = {
      id: `my_${Date.now()}`,
      event_name: form.title.trim(),
      description: form.description.trim() || form.title.trim(),
      starts_at: iso,
      address: form.place.trim(),
      lat,
      lng,
      price: Number(form.price.replace(',', '.')) || 0,
      category: form.category,
      size: form.size,
      district,
      organizer:
        org && account.org === LIBRARY.name
          ? LIBRARY
          : { id: `usr_${account.email}`, name: account.org ?? account.name, verified: false, kind: org ? 'org' : 'student' },
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
        {control(`${input} ${check ? 'border-2 border-spark-500 bg-spark-50' : 'border border-line bg-white'}`)}
      </label>
    )
  }
  const text = (k: Key, type = 'text') => (cls: string) => <input type={type} className={cls} value={form[k]} onChange={(e) => set(k, e.target.value)} />

  return (
    <div className="flex flex-col gap-4 px-4 pt-4 pb-8">
      <div className="flex items-center gap-2">
        <a href="#/konto" className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-white" aria-label="Wstecz">
          <ArrowLeft size={22} aria-hidden />
        </a>
        <h1 className="text-[26px] font-semibold tracking-[-0.02em]">Dodaj wydarzenie</h1>
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
          <textarea id="paste" value={paste} onChange={(e) => setPaste(e.target.value)} className="h-36 resize-none rounded-xl border border-line bg-canvas px-3.5 py-3 text-[15px] leading-[1.45] focus:border-brand-600 focus:ring-brand-600" />
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
          <div className={`${cls} relative flex items-center`}>
            <CategoryBadge cat={category(form.category)} className="text-sm" />
            <select aria-label="Kategoria" value={form.category} onChange={(e) => set('category', e.target.value)} className="absolute inset-0 cursor-pointer opacity-0">
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
        {field('place', 'Miejsce', text('place'))}
        <div className="flex gap-3">
          {field('price', 'Cena (zł)', text('price'), 'flex-1')}
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
        {field('description', 'Opis', (cls) => <textarea className={`${cls} h-28 py-3`} value={form.description} onChange={(e) => set('description', e.target.value)} />)}
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

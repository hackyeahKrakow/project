import { ChevronDown, CircleAlert, Info, Sparkles } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { CATEGORIES, category, type CategoryId } from '@/lib/categories'
import { CategoryBadge, SelectOverlay, btnOutline, btnPrimary, btnSpark, card } from '@/ui'

const PASTE =
  'Wieczór planszówek w Kawiarni Kości! W czwartek 8.10 o 19:00 przy Krupnicza 5. Wstęp wolny (kto chce, bierze coś do picia), zapraszamy 4–6 osób do stolika. Zapisy w komentarzach.'

// Demo state from the design: what an AI fill of PASTE would return; fields AI is unsure about are flagged.
const INITIAL = {
  title: 'Wieczór planszówek w Kawiarni Kości',
  category: 'gry' as CategoryId,
  price: 'Za darmo',
  date: '2026-10-08',
  time: '19:00',
  place: 'Krupnicza 5, Kraków',
  description: PASTE,
}
type Form = typeof INITIAL
type Key = keyof Form

// Preline "Input": AI-filled fields get border-orange + bg-orange-50 and a "Sprawdź" badge.
const input = 'h-[52px] w-full rounded-xl px-3.5 text-base focus:border-brand-600 focus:ring-brand-600'

export default function Dodaj() {
  const [paste, setPaste] = useState(PASTE)
  const [form, setForm] = useState(INITIAL)
  const [flagged, setFlagged] = useState(new Set<Key>(['price', 'time', 'place']))
  const [notice, setNotice] = useState('')

  const set = (k: Key, v: string) => {
    setForm({ ...form, [k]: v })
    setFlagged((f) => new Set([...f].filter((x) => x !== k))) // editing a field = the user checked it
  }

  const field = (k: Key, label: string, control: (cls: string) => ReactNode, grow = '') => {
    const ai = flagged.has(k)
    return (
      <label className={`flex flex-col gap-1.5 ${grow}`}>
        <span className="flex items-center justify-between text-sm font-medium text-muted">
          {label}
          {ai && (
            <span className="flex items-center gap-1 rounded-full bg-spark-500 px-2 py-0.5 text-xs font-semibold text-ink-900">
              <CircleAlert size={13} strokeWidth={2.4} aria-hidden />
              Sprawdź
            </span>
          )}
        </span>
        {control(`${input} ${ai ? 'border-2 border-spark-500 bg-spark-50' : 'border border-line bg-white'}`)}
      </label>
    )
  }
  const text = (k: Key, type = 'text') => (cls: string) => (
    <input type={type} className={cls} value={form[k]} onChange={(e) => set(k, e.target.value)} />
  )

  return (
    <main className="mx-auto w-full max-w-[1360px] px-4 py-10 sm:px-6 md:px-10">
      <div className="mb-7 flex flex-col gap-1.5">
        <h1 className="text-[28px] font-semibold tracking-[-0.02em] sm:text-[34px] md:text-[40px]">Dodaj wydarzenie</h1>
        <p className="text-[17px] text-muted">Wklej tekst z posta, a my wypełnimy formularz. Ty zatwierdzasz.</p>
      </div>

      <div className="flex flex-wrap items-start gap-8">
        <div className="flex max-w-[480px] flex-[1_1_380px] flex-col gap-4">
          <div className={`${card} flex flex-col gap-3 p-5`}>
            <label htmlFor="paste" className="font-semibold">
              1. Wklej opis z posta
            </label>
            <textarea
              id="paste"
              value={paste}
              onChange={(e) => setPaste(e.target.value)}
              className="h-[180px] resize-none rounded-xl border border-line bg-canvas px-3.5 py-3 text-[15px] leading-[1.45] text-muted focus:border-brand-600 focus:ring-brand-600"
            />
            {/* ponytail: no AI endpoint in the backend yet */}
            <button type="button" className={`${btnSpark} h-[52px] w-full`} onClick={() => setNotice('Wypełnianie z AI wymaga API, które jeszcze nie istnieje.')}>
              <Sparkles size={20} strokeWidth={2.2} aria-hidden />
              Wypełnij z AI
            </button>
          </div>
          <div className="flex items-start gap-2.5 rounded-[14px] bg-violet-50 p-3.5 text-sm leading-snug">
            <Sparkles size={20} className="flex-none text-violet-600" aria-hidden />
            AI tylko proponuje. Sprawdź pola oznaczone na pomarańczowo, zanim opublikujesz wydarzenie.
          </div>
        </div>

        <form
          className={`${card} flex flex-[1.6_1_480px] flex-col gap-4 p-6`}
          onSubmit={(e) => {
            e.preventDefault()
            // ponytail: no create-event endpoint in the backend yet
            setNotice('Publikowanie wymaga API, które jeszcze nie istnieje.')
          }}
        >
          <h2 className="font-semibold">2. Sprawdź i zatwierdź</h2>
          {field('title', 'Tytuł', text('title'))}
          <div className="flex flex-wrap gap-4">
            {field(
              'category',
              'Kategoria',
              (cls) => (
                <SelectOverlay
                  label="Kategoria"
                  value={form.category}
                  onChange={(v) => set('category', v)}
                  options={CATEGORIES.map((c) => ({ value: c.id, label: c.name }))}
                >
                  <div className={`${cls} flex items-center`}>
                    <CategoryBadge cat={category(form.category)} className="text-sm" />
                  </div>
                </SelectOverlay>
              ),
              'flex-[1_1_220px]',
            )}
            {field('price', 'Cena', text('price'), 'flex-[1_1_160px]')}
          </div>
          <div className="flex flex-wrap gap-4">
            {field('date', 'Data', text('date', 'date'), 'flex-[1_1_200px]')}
            {field('time', 'Godzina', text('time', 'time'), 'flex-[1_1_160px]')}
          </div>
          {field('place', 'Miejsce', text('place'))}
          <details className="group">
            <summary className="flex cursor-pointer list-none items-center justify-between py-1 text-[15px] font-medium text-brand-600">
              Opis (rozwijany)
              <ChevronDown size={18} className="transition-transform group-open:rotate-180" aria-hidden />
            </summary>
            <textarea
              aria-label="Opis"
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              className="mt-2 h-32 w-full rounded-xl border border-line px-3.5 py-3 focus:border-brand-600 focus:ring-brand-600"
            />
          </details>
          {/* Preline "Alert" */}
          {notice && (
            <div role="alert" className="flex items-start gap-2 rounded-xl border border-spark-500 bg-spark-50 px-3.5 py-2.5 text-sm">
              <Info size={18} className="flex-none" aria-hidden />
              {notice}
            </div>
          )}
          <div className="flex flex-wrap items-center justify-end gap-3 border-t border-line pt-4">
            <a href="#/mapa" className={`${btnOutline} h-[52px]`}>
              Anuluj
            </a>
            <button type="submit" className={`${btnPrimary} h-[52px]`}>
              Opublikuj wydarzenie
            </button>
          </div>
        </form>
      </div>
    </main>
  )
}

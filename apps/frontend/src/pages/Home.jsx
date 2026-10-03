import { Building2, Check, ChevronDown, Compass, Map, Sparkles } from 'lucide-react'
import { CATEGORIES, EVENTS, UNIVERSITIES, category, formatPrice, formatTime } from '@/data'
import { MapView, SelectOverlay, Thumb, btnPrimary, card, uniOptions } from '@/ui'
const MIN = 3
const MAX = 5
const FEATURES = [
  {
    Icon: Map,
    title: 'Mapa bez zbędnych miejsc',
    text: 'Tylko wydarzenia i miejsca dla studentów, w kolorach i z ikonami kategorii.',
  },
  {
    Icon: Compass,
    title: 'Odkrywaj jak w swipe',
    text: 'Polub wydarzenia gestem lub przyciskiem. Dopasowanie uczy się z każdym ruchem.',
  },
  {
    Icon: Sparkles,
    title: 'Dodawanie z pomocą AI',
    text: 'Wklej opis z posta, a formularz wypełni się sam. Ty zatwierdzasz każde wydarzenie.',
  },
]
const HERO_IDS = ['planszowki', 'robotyka', 'integracja', 'jam', 'bieg', 'cv']
const HERO_LIKED = new Set(['planszowki', 'robotyka'])
export default function Home({ uni, setUni, interests, setInterests }) {
  const toggle = (id) => setInterests(interests.includes(id) ? interests.filter((i) => i !== id) : [...interests, id])
  const featured = EVENTS[0]
  return (
    <main className="mx-auto w-full max-w-[1360px] px-4 py-12 sm:px-6 md:px-10">
      <div className="flex flex-wrap items-stretch gap-7 md:gap-12">
        <div className="flex flex-[1_1_480px] flex-col justify-center gap-[22px]">
          <h1 className="text-[34px] leading-[1.05] font-semibold tracking-[-0.03em] sm:text-[44px] md:text-[56px]">
            Wszystko, co dzieje się dla studentów w Krakowie
          </h1>
          <p className="max-w-[560px] text-[17px] leading-[1.45] text-muted-foreground sm:text-[19px]">
            Czysta mapa tylko z wydarzeniami i miejscami dla Ciebie. Przeglądaj, polub i zobacz swoje wydarzenia wyróżnione na
            mapie.
          </p>

          <div className="flex max-w-[560px] flex-col gap-2">
            <div className="text-sm font-medium text-muted-foreground">Uczelnia</div>
            <SelectOverlay label="Uczelnia" value={uni} onChange={setUni} options={uniOptions}>
              <div className="flex h-[52px] items-center gap-2.5 rounded-[14px] border border-line bg-white px-3.5">
                <Building2 size={20} className="text-brand-600" aria-hidden />
                <span className="flex-1">{UNIVERSITIES.find((u) => u.id === uni)?.name}</span>
                <ChevronDown size={20} className="text-muted-foreground" aria-hidden />
              </div>
            </SelectOverlay>
          </div>

          <div role="group" aria-labelledby="interests" className="flex max-w-[640px] flex-col gap-2.5">
            <div className="flex justify-between text-sm font-medium text-muted-foreground">
              <span id="interests">Wybierz 3–5 zainteresowań</span>
              <span className="text-brand-600">
                {interests.length} z {MAX}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => {
                const on = interests.includes(c.id)
                return (
                  <button
                    key={c.id}
                    type="button"
                    aria-pressed={on}
                    disabled={!on && interests.length >= MAX}
                    onClick={() => toggle(c.id)}
                    className={`flex h-11 items-center gap-2 rounded-full px-3.5 text-[15px] font-medium disabled:opacity-50 ${on ? 'border-2 border-brand-600 bg-brand-50' : 'border border-line bg-white'}`}
                  >
                    <c.Icon size={18} color={c.color} strokeWidth={2.2} aria-hidden />
                    {c.name}
                    {on && <Check size={16} strokeWidth={2.6} className="text-brand-600" aria-hidden />}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <a
              href="#/mapa"
              aria-disabled={interests.length < MIN}
              className={`${btnPrimary} h-14 px-8 text-lg ${interests.length < MIN ? 'pointer-events-none opacity-50' : ''}`}
            >
              <Map size={20} strokeWidth={2.2} aria-hidden />
              Zaczynamy
            </a>
            <span className="text-sm text-muted-foreground">Bez rejestracji, zajmuje do 30 sekund.</span>
          </div>
        </div>

        <MapView
          events={EVENTS.filter((e) => HERO_IDS.includes(e.id))}
          liked={HERO_LIKED}
          className="min-h-[320px] flex-[1_1_440px] rounded-[28px] sm:min-h-[480px]"
        >
          <div className="absolute bottom-9 left-5 flex items-center gap-3 rounded-2xl bg-white px-3.5 py-3 shadow-[0_8px_20px_rgba(10,31,68,.18)]">
            <Thumb cat={category(featured.category)} iconSize={28} className="h-14 w-14 rounded-xl" />
            <div>
              <div className="font-semibold">Wieczór planszówek</div>
              <div className="text-[13px] text-muted-foreground">
                dziś {formatTime(featured.starts_at)} · {formatPrice(featured.price)}
              </div>
            </div>
          </div>
        </MapView>
      </div>

      <div className="mt-14 flex flex-wrap gap-5">
        {FEATURES.map(({ Icon, title, text }) => (
          <div key={title} className={`${card} flex flex-[1_1_280px] flex-col gap-2.5 p-6`}>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50">
              <Icon size={24} className="text-brand-600" aria-hidden />
            </div>
            <h2 className="text-xl font-semibold">{title}</h2>
            <p className="text-[15px] leading-[1.45] text-muted-foreground">{text}</p>
          </div>
        ))}
      </div>
    </main>
  )
}

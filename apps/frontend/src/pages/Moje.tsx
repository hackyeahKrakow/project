import { category } from '@/lib/categories'
import { EVENTS, formatDate, formatPrice } from '@/lib/events'
import { CategoryBadge, MapView, Thumb, btnPrimary, card } from '@/ui'

const plural = (n: number) => (n === 1 ? 'polubione wydarzenie' : n >= 2 && n <= 4 ? 'polubione wydarzenia' : 'polubionych wydarzeń')

// Preline "Tabs" (hs-tab, segmented): Preline toggles .active on the buttons and .hidden on the panels.
const tab =
  'flex h-11 items-center rounded-[11px] px-7 text-[15px] font-medium text-muted hs-tab-active:bg-white hs-tab-active:font-semibold hs-tab-active:text-ink-900 hs-tab-active:shadow-[0_1px_3px_rgba(10,31,68,.15)]'

export default function Moje({ liked }: { liked: Set<string> }) {
  const events = EVENTS.filter((e) => liked.has(e.id)).sort((a, b) => a.starts_at.localeCompare(b.starts_at))

  return (
    <main className="mx-auto w-full max-w-[1360px] px-4 py-10 sm:px-6 md:px-10">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-[28px] font-semibold tracking-[-0.02em] sm:text-[34px] md:text-[40px]">Moje</h1>
          <p className="text-[17px] text-muted">
            {events.length} {plural(events.length)}
          </p>
        </div>
        <nav className="inline-flex rounded-[14px] bg-track p-1" aria-label="Widok" role="tablist" aria-orientation="horizontal">
          <button type="button" id="tab-lista" className={`${tab} active`} aria-selected="true" data-hs-tab="#panel-lista" aria-controls="panel-lista" role="tab">
            Lista
          </button>
          <button type="button" id="tab-mapa" className={tab} aria-selected="false" data-hs-tab="#panel-mapa" aria-controls="panel-mapa" role="tab">
            Mapa
          </button>
        </nav>
      </div>

      {events.length === 0 ? (
        <div className={`${card} flex flex-col items-center gap-4 p-10 text-center`}>
          <p className="text-lg">Nie masz jeszcze polubionych wydarzeń.</p>
          <a href="#/odkrywaj" className={`${btnPrimary} h-12`}>
            Odkrywaj wydarzenia
          </a>
        </div>
      ) : (
        <>
          <div id="panel-lista" role="tabpanel" aria-labelledby="tab-lista" className="flex flex-wrap items-start gap-6">
            <div className="grid flex-[2_1_560px] grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4">
              {events.map((ev) => {
                const c = category(ev.category)
                return (
                  <article key={ev.id} className={`${card} flex flex-col overflow-hidden`}>
                    <Thumb cat={c} iconSize={48} className="aspect-video w-full" />
                    <div className="flex flex-col gap-2 px-4 pt-3.5 pb-4">
                      <h2 className="text-lg leading-tight font-semibold">{ev.event_name}</h2>
                      <CategoryBadge cat={c} />
                      <div className="text-sm text-muted">
                        {formatDate(ev.starts_at)} · {formatPrice(ev.price)}
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
            <MapView events={events} liked={liked} className="min-h-[520px] flex-[1_1_380px] rounded-3xl md:sticky md:top-5" />
          </div>
          <div id="panel-mapa" role="tabpanel" aria-labelledby="tab-mapa" className="hidden">
            <MapView events={events} liked={liked} className="min-h-[640px] w-full rounded-3xl" />
          </div>
        </>
      )}
    </main>
  )
}

import { useCallback, useEffect, useMemo, useState } from 'react'
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from '@/lib/demo'
import { catalog } from '@/lib/events'
import { StoreContext, fresh, load, save, type Store } from '@/lib/store'
import { BottomNav, Logo, btnOutline } from '@/ui'
import Dodaj from '@/pages/Dodaj'
import Konto from '@/pages/Konto'
import Logowanie from '@/pages/Logowanie'
import Mapa from '@/pages/Mapa'
import Moje from '@/pages/Moje'
import Odkrywaj from '@/pages/Odkrywaj'
import Onboarding from '@/pages/Onboarding'
import Sponsor from '@/pages/Sponsor'
import Start from '@/pages/Start'
import Statystyki from '@/pages/Statystyki'

const routeFromHash = () => location.hash.replace(/^#\/?/, '')
const NO_NAV = new Set(['start', 'onboarding', 'logowanie'])

export default function App() {
  const [state, setState] = useState(load)
  const [route, setRoute] = useState(routeFromHash)

  useEffect(() => save(state), [state])
  useEffect(() => {
    document.documentElement.style.fontSize = state.bigText ? '112.5%' : ''
  }, [state.bigText])
  useEffect(() => {
    const onHash = () => setRoute(routeFromHash())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const update = useCallback<Store['update']>((patch) => setState((s) => ({ ...s, ...(typeof patch === 'function' ? patch(s) : patch) })), [])
  const reset = useCallback(() => {
    setState(fresh())
    location.hash = '#/start'
  }, [])
  const store = useMemo(() => ({ state, update, reset }), [state, update, reset])

  // First visit lands on the welcome screen; after onboarding the app opens on Odkrywaj.
  const r = route || (state.onboarded ? 'odkrywaj' : 'start')
  const events = useMemo(() => [...catalog(), ...state.myEvents], [state.myEvents])
  const liked = useMemo(() => new Set(Object.keys(state.swipes).filter((id) => state.swipes[id] === 'right')), [state.swipes])

  const page =
    {
      start: <Start events={events} />,
      onboarding: <Onboarding />,
      odkrywaj: <Odkrywaj events={events} />,
      mapa: <Mapa events={events} liked={liked} />,
      moje: <Moje events={events} liked={liked} />,
      konto: <Konto events={events} />,
      logowanie: <Logowanie />,
      dodaj: <Dodaj />,
      statystyki: <Statystyki />,
      sponsor: <Sponsor />,
    }[r] ?? <Start events={events} />

  return (
    <StoreContext.Provider value={store}>
      <div className="flex min-h-svh items-center justify-center gap-12 bg-[#DCE5F5] sm:py-6">
        <Presenter reset={reset} />
        {/* Mobile-first app; on bigger screens it sits in a phone frame for the demo. */}
        <div className="relative flex h-svh w-full max-w-[430px] flex-col overflow-hidden bg-canvas sm:h-[min(880px,calc(100svh-48px))] sm:rounded-[44px] sm:border-[10px] sm:border-ink-900 sm:shadow-[0_30px_80px_rgba(10,31,68,.35)]">
          <main key={r} className={`relative min-h-0 flex-1 ${r === 'mapa' || r === 'odkrywaj' ? 'flex flex-col' : 'overflow-y-auto'}`}>
            {page}
          </main>
          {!NO_NAV.has(r) && <BottomNav route={r} />}
        </div>
      </div>
    </StoreContext.Provider>
  )
}

/** Cheat sheet next to the phone on a laptop, for whoever presents the demo. */
function Presenter({ reset }: { reset: () => void }) {
  return (
    <aside className="hidden w-[300px] flex-col gap-5 text-ink-900 min-[1000px]:flex">
      <Logo size={28} />
      <p className="text-[15px] leading-snug text-muted">Zmatchuj się z eventami. Demo na HackYeah 2026: dane wydarzeń są przykładowe, logowanie i płatności to atrapy.</p>
      <div className="flex flex-col gap-2 rounded-2xl bg-white p-4 text-sm">
        <div className="font-semibold">Konta demo (hasło {DEMO_PASSWORD})</div>
        {DEMO_ACCOUNTS.map((a) => (
          <div key={a.email}>
            <code className="font-semibold text-brand-600">{a.email}</code>
            <div className="text-muted">{a.kind === 'org' ? `${a.org}, ${a.name}` : `${a.name}, ${a.about}`}</div>
          </div>
        ))}
        <div className="text-muted">Drugi krok to atrapa klucza dostępu (passkey).</div>
      </div>
      <nav className="flex flex-wrap gap-2 text-sm" aria-label="Skróty demo">
        {['start', 'odkrywaj', 'mapa', 'moje', 'logowanie', 'dodaj', 'statystyki', 'sponsor'].map((r) => (
          <a key={r} href={`#/${r}`} className="rounded-full bg-white px-3 py-1.5 font-medium hover:bg-brand-50">
            {r}
          </a>
        ))}
      </nav>
      <button type="button" onClick={reset} className={`${btnOutline} h-11`}>
        Wyczyść dane demo
      </button>
    </aside>
  )
}

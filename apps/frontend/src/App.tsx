import { useCallback, useEffect, useMemo, useState } from 'react'
import { catalog } from '@/lib/events'
import { StoreContext, fresh, load, save, type Store } from '@/lib/store'
import { BottomNav, SideNav } from '@/ui'
import Dodaj from '@/pages/Dodaj'
import Konto from '@/pages/Konto'
import Logowanie from '@/pages/Logowanie'
import Mapa from '@/pages/Mapa'
import Moje from '@/pages/Moje'
import Odkrywaj from '@/pages/Odkrywaj'
import Onboarding from '@/pages/Onboarding'
import Organizatorzy from '@/pages/Organizatorzy'
import Sponsor from '@/pages/Sponsor'
import Start from '@/pages/Start'
import Statystyki from '@/pages/Statystyki'

const routeFromHash = () => location.hash.replace(/^#\/?/, '')
const NO_NAV = new Set(['start', 'onboarding', 'zgoda', 'logowanie'])
const TITLES: Record<string, string> = {
  start: 'Zmatchuj się z eventami',
  onboarding: 'Twoje zainteresowania',
  zgoda: 'Twoje dane, twoje zasady',
  odkrywaj: 'Odkrywaj',
  mapa: 'Mapa',
  moje: 'Moje',
  organizatorzy: 'Organizatorzy',
  konto: 'Konto',
  logowanie: 'Logowanie',
  dodaj: 'Dodaj wydarzenie',
  statystyki: 'Statystyki',
  sponsor: 'Zostań sponsorem',
}

export default function App() {
  const [state, setState] = useState(load)
  const [route, setRoute] = useState(routeFromHash)
  const [mapNavOpen, setMapNavOpen] = useState(false)

  useEffect(() => save(state), [state])
  useEffect(() => {
    document.documentElement.style.fontSize = state.bigText ? '112.5%' : ''
  }, [state.bigText])
  // Theme: light, dark or follow the system; high contrast stacks on top of either.
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const apply = () => {
      const root = document.documentElement
      root.classList.toggle('dark', state.theme === 'dark' || (state.theme === 'system' && media.matches))
      root.classList.toggle('hc', state.highContrast)
    }
    apply()
    media.addEventListener('change', apply)
    return () => media.removeEventListener('change', apply)
  }, [state.theme, state.highContrast])
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

  const page = {
    start: <Start events={events} />,
    onboarding: <Onboarding />,
    zgoda: <Onboarding privacyOnly />,
    odkrywaj: <Odkrywaj events={events} />,
    mapa: <Mapa events={events} liked={liked} />,
    moje: <Moje events={events} liked={liked} />,
    organizatorzy: <Organizatorzy events={events} liked={liked} />,
    konto: <Konto events={events} />,
    logowanie: <Logowanie />,
    dodaj: <Dodaj />,
    statystyki: <Statystyki />,
    sponsor: <Sponsor />,
  }[r] ?? <Start events={events} />

  useEffect(() => {
    document.title = `${TITLES[r] ?? TITLES.start} · spootted` // WCAG 2.4.2: every screen has its own title
  }, [r])

  const nav = !NO_NAV.has(r)
  const navRoute = r === 'organizatorzy' ? 'moje' : r // organizers are reached from Moje
  // The map starts with the sidebar collapsed; elsewhere the person's choice is remembered.
  const collapsed = r === 'mapa' ? !mapNavOpen : state.navCollapsed
  const toggleNav = () => (r === 'mapa' ? setMapNavOpen(!mapNavOpen) : update({ navCollapsed: !state.navCollapsed }))
  return (
    <StoreContext.Provider value={store}>
      <a
        href="#tresc"
        onClick={(e) => (e.preventDefault(), document.getElementById('tresc')?.focus())}
        className="sr-only z-50 rounded-xl bg-ink-900 px-4 py-3 text-white focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Przejdź do treści
      </a>
      {/* Mobile-first: tab bar at the bottom on phones, rail on tablets, sidebar on laptops. */}
      <div className="flex h-svh flex-col bg-canvas sm:flex-row">
        {nav && <SideNav route={navRoute} canAdd={!!state.account} collapsed={collapsed} onToggle={toggleNav} />}
        <main
          id="tresc"
          tabIndex={-1}
          key={r}
          className={`relative min-h-0 flex-1 animate-in duration-200 ease-out outline-none fade-in ${r === 'mapa' || r === 'odkrywaj' ? 'flex flex-col' : 'overflow-y-auto'}`}
        >
          {page}
        </main>
        {nav && <BottomNav route={navRoute} />}
      </div>
    </StoreContext.Provider>
  )
}

import { useEffect, useState } from 'react'
import {} from '@/data'
import { Header } from '@/ui'
import Dodaj from '@/pages/Dodaj'
import Home from '@/pages/Home'
import Mapa from '@/pages/Mapa'
import Moje from '@/pages/Moje'
import Odkrywaj from '@/pages/Odkrywaj'
const routeFromHash = () => location.hash.replace(/^#\/?/, '')
export default function App() {
  const [route, setRoute] = useState(routeFromHash)
  const [uni, setUni] = useState('AGH')
  const [interests, setInterests] = useState(['nauka', 'muzyka', 'gry', 'imprezy'])
  // ponytail: likes live in memory only; persist via POST /card/{user_id} once the backend implements it
  const [liked, setLiked] = useState(() => new Set(['planszowki', 'robotyka', 'integracja', 'jam']))
  useEffect(() => {
    const onHash = () => {
      setRoute(routeFromHash())
      window.scrollTo(0, 0)
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])
  const setLike = (id, on) =>
    setLiked((prev) => {
      const next = new Set(prev)
      if (on) next.add(id)
      else next.delete(id)
      return next
    })
  const page = {
    mapa: <Mapa liked={liked} setLike={setLike} />,
    odkrywaj: <Odkrywaj liked={liked} setLike={setLike} />,
    moje: <Moje liked={liked} />,
    dodaj: <Dodaj />,
  }[route] ?? <Home uni={uni} setUni={setUni} interests={interests} setInterests={setInterests} />
  return (
    // Odkrywaj is a full-height swipe deck; every other page scrolls normally.
    <div className={`flex flex-col ${route === 'odkrywaj' ? 'h-svh min-h-[620px] overflow-hidden' : 'min-h-svh'}`}>
      <Header route={route} uni={uni} setUni={setUni} />
      {page}
    </div>
  )
}

import { ArrowLeft, BarChart3, Check, Flame, MessageSquareQuote, Sparkles, TrendingUp } from 'lucide-react'
import { useState } from 'react'
import { ORG_PLAN, PACKAGES } from '@/lib/demo'
import { useStore } from '@/lib/store'
import { btnOutline, btnPrimary, card } from '@/ui'

// "Zostań sponsorem": three packages from 10 zł. Choosing one is a demo, there is no payment form.
export default function Sponsor() {
  const { state } = useStore()
  const current = state.account?.kind === 'org' ? ORG_PLAN.package : ''
  const [notice, setNotice] = useState('')

  return (
    <div className="flex flex-col gap-4 px-4 pt-4 pb-8">
      <div className="flex items-center gap-2">
        <a href="#/konto" className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-white" aria-label="Wstecz">
          <ArrowLeft size={22} aria-hidden />
        </a>
        <h1 className="text-[26px] leading-tight font-semibold tracking-[-0.02em]">Zostań sponsorem</h1>
      </div>
      <p className="text-[15px] leading-snug text-muted">Plakat wisi w jednym miejscu. My docieramy do studentów, którzy już interesują się twoim tematem, i pokazujemy, co działa.</p>

      <ul className="grid grid-cols-2 gap-2 text-sm">
        <Perk Icon={Sparkles} text="Funkcje AI: post zamienia się w wydarzenie" />
        <Perk Icon={TrendingUp} text="Wyróżnienie w talii i na mapie" />
        <Perk Icon={BarChart3} text="Statystyki swipe'ów" />
        <Perk Icon={MessageSquareQuote} text="Opinie uczestników" />
      </ul>

      {PACKAGES.map((p) => {
        const on = p.id === current
        return (
          <section key={p.id} className={`${card} flex flex-col gap-3 p-4 ${on ? 'border-2 border-spark-500' : ''}`}>
            <div className="flex items-start justify-between">
              <div>
                <h2 className="flex items-center gap-2 text-xl font-semibold">
                  <Flame size={20} className="text-spark-500" aria-hidden />
                  {p.name}
                </h2>
                {on && <span className="text-xs font-semibold text-muted">Twój pakiet</span>}
              </div>
              <div className="text-right">
                <span className="text-2xl font-semibold">{p.price} zł</span>
                <span className="block text-xs text-muted">miesięcznie</span>
              </div>
            </div>
            <ul className="flex flex-col gap-1.5 text-sm">
              {[p.ai, p.stats, p.boost, p.feedback ? 'Opinie po wydarzeniach' : null].filter(Boolean).map((t) => (
                <li key={t} className="flex gap-2">
                  <Check size={18} className="flex-none text-brand-600" aria-hidden />
                  {t}
                </li>
              ))}
            </ul>
            <button
              type="button"
              disabled={on}
              onClick={() => setNotice(`Wybrano pakiet ${p.name}. W demo płatności są wyłączone.`)}
              className={`${on ? btnOutline : btnPrimary} h-12`}
            >
              {on ? 'Aktywny' : `Wybierz ${p.name}`}
            </button>
          </section>
        )
      })}

      {notice && (
        <div role="status" className="rounded-xl border border-spark-500 bg-spark-50 px-3.5 py-2.5 text-sm">
          {notice}
        </div>
      )}
      <p className="text-[13px] text-muted">Uczelnie i koła naukowe dostają pakiet na start za darmo. Ceny są robocze.</p>
    </div>
  )
}

function Perk({ Icon, text }: { Icon: typeof Flame; text: string }) {
  return (
    <li className="flex items-start gap-2 rounded-xl bg-white p-3">
      <Icon size={18} className="flex-none text-brand-600" aria-hidden />
      {text}
    </li>
  )
}

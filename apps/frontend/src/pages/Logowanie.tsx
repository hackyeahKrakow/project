import { ArrowLeft, Building2, CircleAlert, Fingerprint, GraduationCap, KeyRound, LoaderCircle } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { DEMO_PASSWORD, findAccount } from '@/lib/demo'
import { useStore, type Account, type Profile } from '@/lib/store'
import { btnOutline, btnPrimary, card } from '@/ui'

const input = 'h-12 w-full rounded-xl border-line px-3.5 text-base focus:border-brand-600 focus:ring-brand-600'

// Login and sign-up are a demo: two hard-coded accounts, then a mocked passkey step. No real auth (docs/USER_FLOW.md).
export default function Logowanie() {
  const { state, update } = useStore()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [kind, setKind] = useState<Account['kind']>('student')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [pending, setPending] = useState<(Account & { profile?: Profile }) | null>(null)
  const [checking, setChecking] = useState(false)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    setError('')
    if (mode === 'login') {
      const acc = findAccount(email, password)
      if (!acc) return setError(`Nieprawidłowy e-mail lub hasło. W demo: ola@demo albo biblioteka@demo, hasło ${DEMO_PASSWORD}.`)
      setPending(acc)
    } else {
      if (!name.trim() || !email.includes('@') || password.length < 8) return setError('Podaj nazwę, poprawny e-mail i hasło (min. 8 znaków).')
      setPending({ email: email.trim().toLowerCase(), name: name.trim(), kind, org: kind === 'org' ? name.trim() : undefined })
    }
  }

  // ponytail: passkey is a mock (no WebAuthn); a real one needs a backend that stores public keys
  const confirmPasskey = () => {
    setChecking(true)
    setTimeout(() => {
      const { profile, ...account } = pending!
      // The account brings its saved preferences (US-15); a new account keeps what the guest already set.
      update({
        account: { email: account.email, name: account.name, kind: account.kind, org: account.org },
        onboarded: true,
        ...(profile && { profile }),
      })
      // Logging in is not consent: without an earlier "Rozumiem, zaczynam" the privacy notice comes next (docs/USER_FLOW.md).
      window.location.hash = state.consent ? '#/konto' : '#/zgoda'
    }, 1200)
  }

  if (pending) {
    return (
      <div className="mx-auto flex h-full max-w-md flex-col items-center justify-center gap-5 px-6 text-center">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-brand-50">
          {checking ? (
            <LoaderCircle size={44} className="animate-spin text-brand-600" aria-hidden />
          ) : (
            <Fingerprint size={48} className="text-brand-600" aria-hidden />
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <h1 className="text-[26px] leading-tight font-semibold">{mode === 'login' ? 'Potwierdź, że to ty' : 'Utwórz klucz dostępu'}</h1>
          <p className="text-[15px] text-muted">
            Drugi krok logowania: odcisk palca, twarz albo PIN telefonu. Bez kodów SMS.
            <br />
            <span className="text-[13px]">(W demo to atrapa, nic nie jest wysyłane.)</span>
          </p>
        </div>
        <button type="button" onClick={confirmPasskey} disabled={checking} className={`${btnPrimary} h-14 w-full text-lg`} aria-live="polite">
          <KeyRound size={20} aria-hidden />
          {checking ? 'Sprawdzam…' : 'Użyj klucza dostępu'}
        </button>
        <button type="button" onClick={() => setPending(null)} disabled={checking} className="text-[15px] font-medium text-muted underline">
          Wróć
        </button>
      </div>
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-5 px-5 pt-4 pb-8 sm:pt-10">
      <a href="#/start" className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-white" aria-label="Wstecz">
        <ArrowLeft size={22} aria-hidden />
      </a>
      <h1 className="text-[28px] leading-tight font-semibold tracking-[-0.02em]">{mode === 'login' ? 'Zaloguj się' : 'Załóż konto'}</h1>
      <div className="inline-flex rounded-[14px] bg-track p-1" role="group" aria-label="Logowanie lub rejestracja">
        {(['login', 'register'] as const).map((m) => (
          <button
            key={m}
            type="button"
            aria-pressed={mode === m}
            onClick={() => (setMode(m), setError(''))}
            className={`h-10 flex-1 rounded-[11px] text-[15px] ${mode === m ? 'bg-white font-semibold shadow-[0_1px_3px_rgba(10,31,68,.15)]' : 'font-medium text-muted'}`}
          >
            {m === 'login' ? 'Logowanie' : 'Rejestracja'}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="flex flex-col gap-4">
        {mode === 'register' && (
          <>
            <div role="radiogroup" aria-label="Typ konta" className="grid grid-cols-2 gap-2">
              {(
                [
                  ['student', 'Jako student', GraduationCap],
                  ['org', 'Jako organizacja', Building2],
                ] as const
              ).map(([k, label, Icon]) => (
                <button
                  key={k}
                  type="button"
                  role="radio"
                  aria-checked={kind === k}
                  onClick={() => setKind(k)}
                  className={`flex flex-col items-center gap-1.5 rounded-2xl p-4 text-[15px] font-medium ${kind === k ? 'border-2 border-brand-600 bg-brand-50' : 'border border-line bg-white'}`}
                >
                  <Icon size={26} className="text-brand-600" aria-hidden />
                  {label}
                </button>
              ))}
            </div>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-muted">{kind === 'org' ? 'Nazwa organizacji' : 'Imię'}</span>
              <input className={input} value={name} onChange={(e) => setName(e.target.value)} autoComplete={kind === 'org' ? 'organization' : 'given-name'} />
            </label>
          </>
        )}
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-muted">E-mail</span>
          <input
            className={input}
            type="text"
            inputMode="email"
            aria-invalid={!!error}
            aria-describedby={error ? 'login-error' : undefined}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
            placeholder="ola@demo"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-muted">Hasło</span>
          <input
            className={input}
            type="password"
            aria-invalid={!!error}
            aria-describedby={error ? 'login-error' : undefined}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          />
        </label>
        {error && (
          <div id="login-error" role="alert" className="flex items-start gap-2 rounded-xl border border-spark-500 bg-spark-50 px-3.5 py-2.5 text-sm">
            <CircleAlert size={18} className="flex-none" aria-hidden />
            {error}
          </div>
        )}
        <button type="submit" className={`${btnPrimary} h-14 text-lg`}>
          {mode === 'login' ? 'Dalej' : 'Załóż konto'}
        </button>
      </form>

      <div className={`${card} flex flex-col gap-1 p-4 text-sm`}>
        <span className="font-semibold">Konta demo</span>
        <span className="text-muted">
          <code>ola@demo</code> (studentka) i <code>biblioteka@demo</code> (organizacja), hasło <code>{DEMO_PASSWORD}</code>.
        </span>
      </div>
      <a href="#/onboarding" className={`${btnOutline} h-12`}>
        Wolę tylko przeglądać
      </a>
    </div>
  )
}

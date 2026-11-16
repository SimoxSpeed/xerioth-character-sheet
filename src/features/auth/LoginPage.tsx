import { useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router'
import { supabase } from '../../lib/supabase'
import { useAuth } from './AuthProvider'
import styles from './LoginPage.module.less'

type Mode = 'login' | 'register'

export function LoginPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? '/'

  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  if (user) return <Navigate to={from} replace />

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setInfo(null)
    setBusy(true)
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        navigate(from, { replace: true })
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { display_name: displayName.trim() }, emailRedirectTo: window.location.origin },
        })
        if (error) throw error
        if (!data.session) setInfo('Registrazione completata: controlla la tua email per confermare l’account.')
      }
    } catch (e) {
      setError(translateAuthError(e instanceof Error ? e.message : String(e)))
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className={styles.page}>
      <form className={styles.panel} onSubmit={handleSubmit}>
        <header className={styles.header}>
          <h1>Xerioth</h1>
          <p className="muted">Schede dei personaggi</p>
        </header>

        <div className={styles.tabs} role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'login'}
            className={mode === 'login' ? styles.tabActive : styles.tab}
            onClick={() => setMode('login')}
          >
            Accedi
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'register'}
            className={mode === 'register' ? styles.tabActive : styles.tab}
            onClick={() => setMode('register')}
          >
            Registrati
          </button>
        </div>

        {mode === 'register' && (
          <label className="field">
            <span>Nome visualizzato</span>
            <input
              className="input"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              autoComplete="nickname"
            />
          </label>
        )}

        <label className="field">
          <span>Email</span>
          <input
            className="input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </label>

        <label className="field">
          <span>Password</span>
          <input
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          />
        </label>

        {error && <p className="error-box">{error}</p>}
        {info && <p className={styles.info}>{info}</p>}

        <button className="btn btn--primary" type="submit" disabled={busy}>
          {busy ? 'Attendere…' : mode === 'login' ? 'Accedi' : 'Crea account'}
        </button>
      </form>
    </main>
  )
}

function translateAuthError(message: string): string {
  if (/invalid login credentials/i.test(message)) return 'Email o password non corretti.'
  if (/email not confirmed/i.test(message)) return 'Devi prima confermare l’email.'
  if (/already registered/i.test(message)) return 'Esiste già un account con questa email.'
  if (/password should be at least/i.test(message)) return 'La password deve avere almeno 6 caratteri.'
  return message
}

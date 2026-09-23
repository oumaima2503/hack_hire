import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { api, ApiError, PARENT_LOCKED_EVENT } from '../api'
import { useAuth } from '../auth'
import { Layout } from './Layout'

/**
 * "Grown-ups only" password check. The API enforces parent mode on every
 * parent-only route; this form just asks for the password to unlock it.
 */
export function ParentPasswordForm({ onUnlocked, onCancel, cancelLabel }: { onUnlocked: () => void; onCancel?: () => void; cancelLabel?: string }) {
  const { parent, logout, refresh } = useAuth()
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!password || busy) return
    setBusy(true)
    setError(null)
    try {
      await api.parentUnlock(password)
      setPassword('')
      refresh() // reload the (unmasked) account details for the parent pages
      onUnlocked()
    } catch (err) {
      setPassword('')
      setError(err instanceof ApiError && err.status === 401 ? 'That password isn’t right. Try again.' : err instanceof Error ? err.message : 'Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="parent-lock" onSubmit={submit}>
      <div className="parent-lock-icon" aria-hidden="true">
        🔒
      </div>
      <h2>Grown-ups only</h2>
      <p className="parent-lock-text">
        Enter the parent account password to open this area.
      </p>
      {/* Hidden username helps password managers fill the right account. */}
      <input type="text" name="username" autoComplete="username" value={parent?.email ?? ''} readOnly hidden />
      <input
        type="password"
        name="password"
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Your password"
        aria-label="Parent password"
        autoFocus
        maxLength={128}
      />
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <div className="parent-lock-actions">
        {onCancel && (
          <button type="button" className="btn ghost" onClick={onCancel}>
            {cancelLabel ?? 'Back'}
          </button>
        )}
        <button className="btn primary" disabled={!password || busy}>
          {busy ? '…' : '🔓 Unlock'}
        </button>
      </div>
      <p className="parent-lock-foot">
        Forgot it?{' '}
        <button type="button" className="linklike" onClick={() => logout()}>
          Log out
        </button>{' '}
        and log in again.
      </p>
    </form>
  )
}

/** Wraps parent-only pages: shows the password form while parent mode is locked. */
export function ParentGate({ children }: { children: ReactNode }) {
  const { parent, loading, children: kids } = useAuth()
  const [state, setState] = useState<'checking' | 'locked' | 'open'>('checking')

  useEffect(() => {
    if (loading) return
    if (!parent) {
      setState('open') // not logged in: nothing private to protect here (RequireAuth handles private pages)
      return
    }
    let alive = true
    api.parentMode().then(
      (m) => alive && setState(m.unlocked ? 'open' : 'locked'),
      () => alive && setState('locked'),
    )
    return () => {
      alive = false
    }
  }, [parent, loading])

  // Parent mode expired while on the page → ask again.
  useEffect(() => {
    const onLocked = () => setState('locked')
    window.addEventListener(PARENT_LOCKED_EVENT, onLocked)
    return () => window.removeEventListener(PARENT_LOCKED_EVENT, onLocked)
  }, [])

  if (state === 'checking') return <p className="loading">…</p>
  if (state === 'locked')
    return (
      <Layout>
        <div className="parent-lock-page">
          <ParentPasswordForm onUnlocked={() => setState('open')} />
          {kids.length > 0 && (
            <p className="parent-lock-kids">
              Not a grown-up?{' '}
              {kids.map((k, i) => (
                <span key={k.id}>
                  {i > 0 && ' · '}
                  <Link to={`/play/${k.id}`}>Back to {k.name}’s adventure</Link>
                </span>
              ))}
            </p>
          )}
        </div>
      </Layout>
    )
  return <>{children}</>
}

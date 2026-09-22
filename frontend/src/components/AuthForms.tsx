import { useState, type FormEvent } from 'react'
import type { Child } from '../api'
import { useAuth } from '../auth'
import { useI18n } from '../i18n'

/** Register / log in tabs. `onDone` receives the existing children after a login ([] after register). */
export function AuthForms({ initial = 'register', onDone }: { initial?: 'register' | 'login'; onDone: (children: Child[], mode: 'register' | 'login') => void }) {
  const { t } = useI18n()
  const { login, register } = useAuth()
  const [mode, setMode] = useState(initial)
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [consent, setConsent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      if (mode === 'register') {
        await register({ ...form, consent })
        onDone([], 'register')
      } else {
        onDone(await login(form.email, form.password), 'login')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('error_generic'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="auth-forms">
      <div className="tabs" role="tablist">
        {(['register', 'login'] as const).map((m) => (
          <button key={m} type="button" role="tab" aria-selected={mode === m} className={mode === m ? 'on' : ''} onClick={() => { setMode(m); setError(null) }}>
            {t(m === 'register' ? 'auth_register_tab' : 'auth_login_tab')}
          </button>
        ))}
      </div>

      {mode === 'register' && (
        <label className="field">
          <span>{t('auth_name')}</span>
          <input required minLength={2} maxLength={80} value={form.name} onChange={set('name')} autoComplete="name" />
        </label>
      )}
      <label className="field">
        <span>{t('auth_email')}</span>
        <input type="email" required value={form.email} onChange={set('email')} autoComplete="email" placeholder="parent@example.com" />
      </label>
      <label className="field">
        <span>{t('auth_password')}</span>
        <input
          type="password"
          required
          minLength={mode === 'register' ? 8 : 1}
          maxLength={128}
          value={form.password}
          onChange={set('password')}
          autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
        />
        {mode === 'register' && <small className="hint">{t('auth_password_hint')}</small>}
      </label>

      {mode === 'register' && (
        <>
          <label className="consent">
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
            <span>{t('s0_consent')}</span>
          </label>
          <p className="hint">🔒 {t('s0_privacy')}</p>
          <p className="hint">🤖 {t('s0_ai')}</p>
        </>
      )}

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <button type="submit" className="btn primary big" disabled={busy || (mode === 'register' && !consent)}>
        {busy ? '…' : t(mode === 'register' ? 'auth_register' : 'auth_login')}
      </button>
    </form>
  )
}

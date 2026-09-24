import { useEffect, useState } from 'react'
import { api, ApiError } from '../api'
import { PATTERN_ICONS } from './PatternPad'

const EMOJI = Object.fromEntries(PATTERN_ICONS.map((i) => [i.key, i]))
const SHOW_SECONDS = 30

/**
 * Parent recovery of a child's secret pattern: the password is typed again for this one
 * request, and the pictures are shown for 30 seconds only. (No <form>: it lives inside the edit form.)
 */
export function PatternRecovery({ childId, childName }: { childId: string; childName: string }) {
  const [asking, setAsking] = useState(false)
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pattern, setPattern] = useState<string[] | null>(null)
  const [left, setLeft] = useState(SHOW_SECONDS)

  // Hide it again automatically.
  useEffect(() => {
    if (!pattern) return
    setLeft(SHOW_SECONDS)
    const id = window.setInterval(() => setLeft((s) => s - 1), 1000)
    return () => window.clearInterval(id)
  }, [pattern])
  useEffect(() => {
    if (pattern && left <= 0) setPattern(null)
  }, [left, pattern])

  const reveal = async () => {
    if (!password || busy) return
    setBusy(true)
    setError(null)
    try {
      const res = await api.revealPattern(childId, password)
      setPattern(res.pattern)
      setAsking(false)
    } catch (e) {
      setError(e instanceof ApiError && e.code === 'wrong_password' ? 'That password isn’t right.' : e instanceof Error ? e.message : 'Could not show the pattern')
    } finally {
      setPassword('')
      setBusy(false)
    }
  }

  if (pattern)
    return (
      <div className="pattern-reveal" role="status">
        <p className="hint">
          {childName}’s secret pattern (hidden again in {left}s). Help them remember it, then keep it secret.
        </p>
        <ol className="pattern-reveal-row">
          {pattern.map((k, i) => (
            <li key={i}>
              <span aria-hidden="true">{EMOJI[k]?.emoji ?? '❔'}</span>
              <small>{EMOJI[k]?.name}</small>
            </li>
          ))}
        </ol>
        <button type="button" className="btn ghost small" onClick={() => setPattern(null)}>
          🙈 Hide
        </button>
      </div>
    )

  if (!asking)
    return (
      <button type="button" className="btn ghost" onClick={() => setAsking(true)}>
        👁 Show secret pattern
      </button>
    )

  return (
    <div className="pattern-reveal-ask">
      <label>
        <span>Type your password to see {childName}’s pattern</span>
        <input
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              reveal()
            }
          }}
          maxLength={128}
          autoFocus
        />
      </label>
      <div className="btn-row">
        <button type="button" className="btn ghost small" onClick={() => setAsking(false)}>
          Cancel
        </button>
        <button type="button" className="btn primary small" onClick={reveal} disabled={!password || busy}>
          {busy ? '…' : 'Show'}
        </button>
      </div>
      {error && <p className="error">{error}</p>}
    </div>
  )
}

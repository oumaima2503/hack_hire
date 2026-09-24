import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api, type ChildCard } from '../../api'
import { useAuth } from '../../auth'
import { Layout } from '../../components/Layout'
import { RugView } from '../../components/RugView'
import { avatarEmoji } from '../../content'
import { useSession } from '../../state'

type Toast = { kind: 'good' | 'error'; text: string }

export default function ParentDashboard() {
  const { parent, logout, refresh: refreshAuth } = useAuth()
  const { reset } = useSession()
  const navigate = useNavigate()
  const [children, setChildren] = useState<ChildCard[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [toDelete, setToDelete] = useState<ChildCard | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [toast, setToast] = useState<Toast | null>(null)

  const load = useCallback(() => api.parentDashboard().then((d) => setChildren(d.children), (e) => setError(e.message)), [])
  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (!toast) return
    const id = window.setTimeout(() => setToast(null), 4000)
    return () => window.clearTimeout(id)
  }, [toast])

  const confirmDelete = async () => {
    if (!toDelete) return
    setDeleting(true)
    try {
      await api.deleteChild(toDelete.id) // the API checks the child belongs to this parent
      setToast({ kind: 'good', text: `${toDelete.name}’s profile was deleted.` })
      setToDelete(null)
      await load()
      refreshAuth()
    } catch (e) {
      setToast({ kind: 'error', text: e instanceof Error ? e.message : 'Could not delete this profile' })
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Layout wide>
      <div className="parent">
        <header className="parent-head">
          <div>
            <p className="eyebrow light">Parent dashboard</p>
            <h1>Hi {parent?.name} 👋</h1>
          </div>
          <div className="btn-row">
            <Link to="/kids" className="btn ghost light">
              🎮 Kids’ corner
            </Link>
            <button
              className="btn ghost light"
              onClick={async () => {
                reset()
                await logout()
                navigate('/')
              }}
            >
              Log out
            </button>
          </div>
        </header>

        {error && <p className="error">{error}</p>}
        {!children && !error && <p className="loading">Loading…</p>}

        <div className="child-cards">
          {children?.map((c) => {
            const s = c.stats
            return (
              <article key={c.id} className="panel child-card" style={{ borderTopColor: c.theme.primary }}>
                <header>
                  <span className="child-avatar">{avatarEmoji(c.avatar_key)}</span>
                  <div>
                    <h2>{c.name}</h2>
                    <small>
                      {c.theme.emoji} {c.theme.name}
                      {c.has_pattern ? ' · 🔐 secret pattern set' : ' · ✨ no secret pattern yet'}
                    </small>
                  </div>
                </header>
                <dl className="child-summary">
                  <div><dt>Age</dt><dd>{c.age ?? '—'}</dd></div>
                  <div><dt>Progress</dt><dd>{c.progress_pct}%</dd></div>
                  <div><dt>Region</dt><dd>{c.region ?? '—'}</dd></div>
                </dl>
                <div className="meter" aria-label={`${c.progress_pct}% of the lessons`}>
                  <span style={{ width: `${c.progress_pct}%` }} />
                </div>
                <dl className="child-stats">
                  <div><dt>Level</dt><dd>🏆 {s.xp_level}</dd></div>
                  <div><dt>Points</dt><dd>⭐ {s.total_points}</dd></div>
                  <div><dt>Lessons</dt><dd>📚 {s.lessons_completed}/{s.lessons_total}</dd></div>
                  <div><dt>Games</dt><dd>🎮 {s.games_completed}</dd></div>
                  <div><dt>Rugs</dt><dd>🧶 {s.rugs_created}</dd></div>
                  <div><dt>Regions</dt><dd>🗺️ {s.regions_visited}/12</dd></div>
                </dl>
                <p className="ach-row" aria-label="Achievements">
                  {c.achievements.length ? c.achievements.map((a) => <span key={a.key} title={a.title}>{a.emoji}</span>) : <small className="muted">No achievements yet</small>}
                </p>
                {c.latest_rug && <RugView design={c.latest_rug.design} name={c.latest_rug.name} />}
                <p className="hint">{c.last_active ? `Last active ${new Date(c.last_active).toLocaleString()}` : 'Not started yet'}</p>
                <div className="btn-row">
                  <Link to={`/parent/children/${c.id}`} className="btn primary">📈 View progress</Link>
                  <Link to={`/parent/children/${c.id}/edit`} className="btn ghost">✏️ Edit</Link>
                </div>
                {/* Kept apart from the everyday actions to avoid accidental deletion. */}
                <div className="danger-zone">
                  <button className="btn danger small" onClick={() => setToDelete(c)}>
                    🗑 Delete
                  </button>
                </div>
              </article>
            )
          })}

          <Link to="/onboarding?new=1" className="panel child-card add-child">
            <span className="big-emoji">➕</span>
            <strong>Add a child</strong>
            <small>They’ll build their explorer card with you</small>
          </Link>
        </div>
      </div>

      {toDelete && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="delete-title">
          <div className="modal delete-modal">
            <div className="big-emoji" aria-hidden="true">🗑</div>
            <h2 id="delete-title">Are you sure you want to delete this child?</h2>
            <p>
              <strong>{toDelete.name}</strong>’s profile will be deleted permanently, with everything linked to it: progress, lessons,
              games and scores, rewards and achievements, rugs, their Morocco journey, onboarding answers, learning profile, secret
              pattern and conversations with the companion.
            </p>
            <p className="muted">This cannot be undone.</p>
            <div className="btn-row center">
              <button className="btn ghost" onClick={() => setToDelete(null)} disabled={deleting} autoFocus>
                Cancel
              </button>
              <button className="btn danger" onClick={confirmDelete} disabled={deleting}>
                {deleting ? 'Deleting…' : `Delete ${toDelete.name}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className={`parent-toast ${toast.kind}`} role="status">
          {toast.kind === 'good' ? '✅' : '⚠️'} {toast.text}
        </div>
      )}
    </Layout>
  )
}

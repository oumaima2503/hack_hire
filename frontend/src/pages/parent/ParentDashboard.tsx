import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api, type ChildCard } from '../../api'
import { useAuth } from '../../auth'
import { Layout } from '../../components/Layout'
import { RugView } from '../../components/RugView'
import { avatarEmoji } from '../../content'
import { useSession } from '../../state'

export default function ParentDashboard() {
  const { parent, logout } = useAuth()
  const { reset } = useSession()
  const navigate = useNavigate()
  const [children, setChildren] = useState<ChildCard[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.parentDashboard().then((d) => setChildren(d.children), (e) => setError(e.message))
  }, [])

  return (
    <Layout wide>
      <div className="parent">
        <header className="parent-head">
          <div>
            <p className="eyebrow light">Parent dashboard</p>
            <h1>Hi {parent?.name} 👋</h1>
          </div>
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
                      {c.age ? `${c.age} yrs · ` : ''}
                      {c.theme.emoji} {c.theme.name}
                    </small>
                  </div>
                </header>
                <dl className="child-stats">
                  <div><dt>Level</dt><dd>🏆 {s.xp_level}</dd></div>
                  <div><dt>Points</dt><dd>⭐ {s.total_points}</dd></div>
                  <div><dt>Lessons</dt><dd>📚 {s.lessons_completed}/{s.lessons_total}</dd></div>
                  <div><dt>Games</dt><dd>🎮 {s.games_completed}</dd></div>
                  <div><dt>Unlocked</dt><dd>🔓 {s.items_unlocked}</dd></div>
                  <div><dt>Rugs</dt><dd>🧶 {s.rugs_created}</dd></div>
                </dl>
                <div className="meter" aria-label={`${s.lessons_completed} of ${s.lessons_total} lessons`}>
                  <span style={{ width: `${(s.lessons_completed / Math.max(1, s.lessons_total)) * 100}%` }} />
                </div>
                <p className="ach-row" aria-label="Achievements">
                  {c.achievements.length ? c.achievements.map((a) => <span key={a.key} title={a.title}>{a.emoji}</span>) : <small className="muted">No achievements yet</small>}
                </p>
                {c.latest_rug && <RugView design={c.latest_rug.design} name={c.latest_rug.name} />}
                <p className="hint">{c.last_active ? `Last active ${new Date(c.last_active).toLocaleString()}` : 'Not started yet'}</p>
                <div className="btn-row">
                  <Link to={`/play/${c.id}`} className="btn primary">▶ Play</Link>
                  <Link to={`/parent/children/${c.id}`} className="btn ghost">📈 Progress</Link>
                  <Link to={`/parent/children/${c.id}/edit`} className="btn ghost">✏️ Edit</Link>
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
    </Layout>
  )
}

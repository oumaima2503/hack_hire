import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api, type ChildDetail as Detail } from '../../api'
import { Layout } from '../../components/Layout'
import { RugView } from '../../components/RugView'
import { avatarEmoji } from '../../content'
import { REASON_LABELS } from '../../learn/LearnContext'
import { RegionPassport } from '../../learn/RegionMap'
import { LearningProfileCard } from '../../components/LearningProfileCard'
import { StatTiles } from '../learn/Progress'

export default function ChildDetail() {
  const { childId = '' } = useParams()
  const [d, setD] = useState<Detail | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.childDetail(childId).then(setD, (e) => setError(e.message))
  }, [childId])

  if (error) return <Layout><p className="error">{error} <Link to="/parent">Back</Link></p></Layout>
  if (!d) return <Layout><p className="loading">Loading…</p></Layout>

  return (
    <Layout wide>
      <div className="parent">
        <header className="parent-head">
          <div className="parent-child-title">
            <span className="child-avatar">{avatarEmoji(d.avatar_key)}</span>
            <div>
              <p className="eyebrow light">
                <Link to="/parent">← My family</Link>
              </p>
              <h1>{d.name}’s progress</h1>
              <small className="light-text">
                {d.age} yrs · {d.theme.emoji} {d.theme.name} · difficulty {d.level ?? 1}/3 · learns by{' '}
                {{ watch: 'watching', listen: 'listening', do: 'doing' }[d.learning_style ?? 'watch']}
              </small>
            </div>
          </div>
          <div className="btn-row">
            <Link to={`/parent/children/${d.id}/edit`} className="btn ghost light">✏️ Edit</Link>
          </div>
        </header>

        <section className="panel">
          <StatTiles s={d.stats} />
          {d.progress.quiz_accuracy !== null && <p className="hint">🎯 Quiz accuracy: {Math.round(d.progress.quiz_accuracy * 100)}%</p>}
        </section>

        <section className="panel">
          <h2>🌟 Learning profile</h2>
          <p className="hint">
            From the onboarding mini-challenges. The MyRugy Guide uses it to adapt how it explains things. It never changes the games.
          </p>
          {d.learning_profile.assessed ? (
            <LearningProfileCard level={d.learning_profile.level} learningStyle={d.learning_style ?? 'watch'} language={d.language ?? 'en'} skills={d.learning_profile.skills} />
          ) : (
            <p className="muted">Not assessed yet. It will appear after the onboarding mini-challenges.</p>
          )}
        </section>

        <section className="panel">
          <h2>🗺️ Journey across Morocco ({d.progress.regions.visited}/{d.progress.regions.total} regions)</h2>
          <p className="hint">
            {d.name}’s route starts in {d.progress.regions.route[0]?.name}
            {d.progress.regions.home_region ? ' (home region)' : ''} and visits every region as the lessons are completed.
          </p>
          <RegionPassport journey={d.progress.regions} />
        </section>

        <div className="two-col">
          <section className="panel">
            <h2>📚 Lessons</h2>
            <table className="funnel">
              <thead>
                <tr><th>Stage</th><th>Status</th><th>Quiz</th></tr>
              </thead>
              <tbody>
                {d.progress.lessons.map((l) => (
                  <tr key={l.key}>
                    <td>{l.emoji} {l.title}</td>
                    <td>{l.status === 'completed' ? '✅ done' : l.unlocked ? (l.status === 'started' ? '⏳ started' : '🟢 open') : '🔒 locked'}</td>
                    <td>{l.quiz_total ? `${l.quiz_correct}/${l.quiz_total}` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="panel">
            <h2>🎮 Games</h2>
            <table className="funnel">
              <thead>
                <tr><th>Game</th><th>Best</th><th>Plays</th></tr>
              </thead>
              <tbody>
                {d.progress.games.map((g) => (
                  <tr key={g.key}>
                    <td>{g.completed ? '✅' : g.emoji} {g.title}</td>
                    <td>{g.plays ? `${g.best_score}/${g.max_score}` : '—'}</td>
                    <td>{g.plays}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>

        <div className="two-col">
          <section className="panel">
            <h2>🏅 Achievements</h2>
            <div className="achievements">
              {d.rewards.achievements.map((a) => (
                <div key={a.key} className={`achievement${a.earned ? ' earned' : ''}`}>
                  <span className="ach-emoji">{a.earned ? a.emoji : '❔'}</span>
                  <strong>{a.title}</strong>
                  <small>{a.description}</small>
                </div>
              ))}
            </div>
          </section>
          <section className="panel">
            <h2>🔓 Unlocked items</h2>
            <ol className="unlock-track">
              {d.rewards.rewards.map((r) => (
                <li key={r.key} className={r.unlocked ? 'unlocked' : 'locked'}>
                  <span className="unlock-emoji">{r.unlocked ? r.emoji : '🔒'}</span>
                  <div>
                    <strong>{r.name}</strong>
                    <small>{r.threshold} points</small>
                  </div>
                </li>
              ))}
            </ol>
            <h3>Recent points</h3>
            <ul className="progress-list">
              {d.progress.recent_points.map((e, i) => (
                <li key={i}>
                  <span>+{e.points}</span>
                  <strong>{REASON_LABELS[e.reason] ?? e.reason}</strong>
                  <small>{new Date(e.created_at).toLocaleString()}</small>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <section className="panel">
          <h2>🖼️ Created rugs ({d.rugs.length})</h2>
          {d.rugs.length ? (
            <div className="gallery">
              {d.rugs.map((r) => <RugView key={r.id} design={r.design} name={r.name} />)}
            </div>
          ) : (
            <p className="muted">No rugs yet.</p>
          )}
        </section>

        <section className="panel">
          <h2>🤖 Assistant conversations</h2>
          <p className="hint">You can review everything {d.name} asked the learning assistant (latest 30 messages).</p>
          {d.chat.length ? (
            <div className="chat-list transcript">
              {d.chat.map((m, i) => (
                <div key={i} className={`chat-msg ${m.role}`}>
                  {m.content}
                  <small>{new Date(m.created_at).toLocaleString()}</small>
                </div>
              ))}
            </div>
          ) : (
            <p className="muted">No conversations yet.</p>
          )}
        </section>
      </div>
    </Layout>
  )
}

import { useEffect, useState } from 'react'
import { api, type RewardsOverview } from '../../api'
import { useLearn } from '../../learn/LearnContext'
import { usePageDescriptor } from '../../companion/PageContext'
import { pages } from '../../companion/pageDescriptors'

export default function Rewards() {
  const { childId, exp, refresh } = useLearn()
  usePageDescriptor(() => pages.rewards(exp), [exp])
  const [data, setData] = useState<RewardsOverview | null>(null)
  const v = exp.theme.vocab

  useEffect(() => {
    api.rewards(childId).then(setData, () => setData(null))
  }, [childId, exp.progress.total_points])

  if (!data) return <p className="loading-dark">…</p>
  const next = data.next_reward
  const pct = next ? Math.min(100, Math.round((data.total_points / next.threshold) * 100)) : 100

  const switchWorld = async (key: string) => {
    await api.updateChild(childId, { selected_theme: key })
    refresh()
  }

  return (
    <div className="learn-page">
      <h1>{exp.theme.icons.rewards} Rewards</h1>

      <section className="card">
        <p className="lead-dark">
          You have <strong>{data.total_points}</strong> {v.point_emoji} {v.points}.
        </p>
        {next ? (
          <>
            <div className="meter big" aria-label={`${pct}% to ${next.name}`}>
              <span style={{ width: `${pct}%` }} />
            </div>
            <p className="hint">
              {next.threshold - data.total_points} more {v.points} to unlock {next.emoji} <strong>{next.name}</strong>
            </p>
          </>
        ) : (
          <p className="good">👑 You unlocked everything!</p>
        )}
      </section>

      <section className="card">
        <h2>🔓 Unlock track</h2>
        <ol className="unlock-track">
          {data.rewards.map((r) => (
            <li key={r.key} className={r.unlocked ? 'unlocked' : 'locked'}>
              <span className="unlock-emoji">{r.unlocked ? r.emoji : '🔒'}</span>
              <div>
                <strong>{r.name}</strong>
                <small>
                  {r.threshold} {v.points} · new {r.kind}
                </small>
              </div>
              {r.kind === 'color' && r.unlocked && <span className="swatch static" style={{ background: String(r.payload.hex) }} />}
            </li>
          ))}
        </ol>
      </section>

      <section className="card">
        <h2>🌍 My worlds</h2>
        <div className="world-switch">
          {exp.available_themes.map((w) => (
            <button key={w.key} className={`chip-btn${w.key === exp.theme.key ? ' on' : ''}`} onClick={() => switchWorld(w.key)} aria-pressed={w.key === exp.theme.key}>
              {w.emoji} {w.name}
            </button>
          ))}
        </div>
      </section>

      <section className="card">
        <h2>🏅 Achievements</h2>
        <div className="achievements">
          {data.achievements.map((a) => (
            <div key={a.key} className={`achievement${a.earned ? ' earned' : ''}`}>
              <span className="ach-emoji">{a.earned ? a.emoji : '❔'}</span>
              <strong>{a.title}</strong>
              <small>{a.description}</small>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

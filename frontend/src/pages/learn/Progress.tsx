import { useEffect, useState } from 'react'
import { api, type ProgressSummary, type Rug } from '../../api'
import { RugView } from '../../components/RugView'
import { REASON_LABELS, useLearn } from '../../learn/LearnContext'
import { RegionPassport } from '../../learn/RegionMap'
import { LearningProfileCard } from '../../components/LearningProfileCard'
import { usePageDescriptor } from '../../companion/PageContext'
import { pages } from '../../companion/pageDescriptors'

export function StatTiles({ s, pointEmoji = '⭐', pointsLabel = 'points', levelLabel = 'Level' }: {
  s: ProgressSummary['stats']
  pointEmoji?: string
  pointsLabel?: string
  levelLabel?: string
}) {
  const tiles = [
    [pointEmoji, s.total_points, pointsLabel],
    ['🏆', `${levelLabel} ${s.xp_level}`, `${s.points_to_next} to next`],
    ['📚', `${s.lessons_completed}/${s.lessons_total}`, 'lessons'],
    ['🎮', s.games_completed, 'games'],
    ['🔓', s.items_unlocked, 'items unlocked'],
    ['🏅', s.achievements, 'achievements'],
    ['🧶', s.rugs_created, 'rugs'],
    ['🔥', s.streak_days, 'day streak'],
    ['🗺️', `${s.regions_visited}/12`, 'regions'],
  ] as const
  return (
    <div className="tiles">
      {tiles.map(([e, n, l]) => (
        <div className="tile" key={l}>
          <span className="tile-emoji">{e}</span>
          <strong>{n}</strong>
          <small>{l}</small>
        </div>
      ))}
    </div>
  )
}

export default function Progress() {
  const { childId, exp } = useLearn()
  usePageDescriptor(() => pages.progress(exp), [exp])
  const [data, setData] = useState<ProgressSummary | null>(null)
  const [rugs, setRugs] = useState<Rug[]>([])
  const v = exp.theme.vocab

  useEffect(() => {
    api.progress(childId).then(setData, () => setData(null))
    api.rugs(childId).then(setRugs, () => setRugs([]))
  }, [childId, exp.progress.total_points])

  if (!data) return <p className="loading-dark">…</p>

  return (
    <div className="learn-page">
      <h1>{exp.theme.icons.progress} My progress</h1>
      <StatTiles s={data.stats} pointEmoji={v.point_emoji} pointsLabel={v.points} levelLabel={v.level} />

      <section className="card">
        <h2>🌟 How I like to learn</h2>
        <LearningProfileCard
          level={exp.learning_profile.level}
          learningStyle={exp.child.learning_style ?? 'watch'}
          language={exp.child.language ?? 'en'}
          skills={exp.learning_profile.skills}
        />
      </section>

      <section className="card">
        <h2>🛂 My Morocco passport</h2>
        <RegionPassport journey={data.regions} />
      </section>

      <section className="card">
        <h2>📚 Lessons</h2>
        <ul className="progress-list">
          {data.lessons.map((l) => (
            <li key={l.key} className={l.status}>
              <span>{l.status === 'completed' ? '✅' : l.unlocked ? l.emoji : '🔒'}</span>
              <strong>{l.title}</strong>
              <small>{l.quiz_total ? `quiz ${l.quiz_correct}/${l.quiz_total}` : ''}</small>
            </li>
          ))}
        </ul>
        {data.quiz_accuracy !== null && <p className="hint">🎯 Right answers: {Math.round(data.quiz_accuracy * 100)}%</p>}
      </section>

      <section className="card">
        <h2>🎮 Games</h2>
        <ul className="progress-list">
          {data.games.map((g) => (
            <li key={g.key} className={g.completed ? 'completed' : ''}>
              <span>{g.completed ? '✅' : g.emoji}</span>
              <strong>{g.title}</strong>
              <small>{g.plays ? `best ${g.best_score}/${g.max_score} · played ${g.plays}×` : 'not played yet'}</small>
            </li>
          ))}
        </ul>
      </section>

      {data.recent_points.length > 0 && (
        <section className="card">
          <h2>
            {v.point_emoji} Latest {v.points}
          </h2>
          <ul className="progress-list">
            {data.recent_points.map((e, i) => (
              <li key={i}>
                <span>+{e.points}</span>
                <strong>{REASON_LABELS[e.reason] ?? e.reason}</strong>
                <small>{new Date(e.created_at).toLocaleDateString()}</small>
              </li>
            ))}
          </ul>
        </section>
      )}

      {rugs.length > 0 && (
        <section className="card">
          <h2>🖼️ My rugs</h2>
          <div className="gallery">
            {rugs.map((r) => (
              <RugView key={r.id} design={r.design} name={r.name} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

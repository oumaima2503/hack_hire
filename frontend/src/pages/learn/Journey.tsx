import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, type GameSummary, type LessonSummary } from '../../api'
import { avatarEmoji } from '../../content'
import { useLearn } from '../../learn/LearnContext'
import { RegionMap } from '../../learn/RegionMap'
import { usePageDescriptor } from '../../companion/PageContext'
import { pages } from '../../companion/pageDescriptors'

/** The 8-stage Learn & Play path: each stage = video → practice game → discover → quiz. */
export function Journey({ lessons, games = [] }: { lessons: LessonSummary[]; games?: GameSummary[] }) {
  const { exp } = useLearn()
  const gameOf = (key: string | null) => games.find((g) => g.key === key)
  return (
    <ol className="journey">
      {lessons.map((l) => {
        const cls = l.status === 'completed' ? 'done' : l.unlocked ? 'open' : 'locked'
        const body = (
          <>
            <span className="journey-node">{l.status === 'completed' ? '✓' : l.unlocked ? l.emoji : '🔒'}</span>
            <span className="journey-text">
              <strong>
                {l.position}. {l.title}
              </strong>
              <small>{l.unlocked ? l.summary : 'Finish the previous stage to unlock'}</small>
              <span className="journey-regions">
                <span className={`region-chip step-chip${l.video_watched ? ' ok' : ''}`}>🎬 video{l.video_watched && ' ✓'}</span>
                {l.game && (
                  <span className={`region-chip step-chip${gameOf(l.game)?.completed ? ' ok' : ''}`}>
                    🎮 {gameOf(l.game)?.title ?? 'game'}
                    {gameOf(l.game)?.completed && ' ✓'}
                  </span>
                )}
                {l.regions.map((r) => (
                  <span key={r.key} className="region-chip">
                    {r.emoji} {r.short_name}
                  </span>
                ))}
              </span>
            </span>
            {l.status === 'completed' && <span className="journey-badge">{exp.theme.vocab.point_emoji}</span>}
          </>
        )
        return (
          <li key={l.key} className={`journey-step ${cls}`}>
            {l.unlocked ? <Link to={`/play/${exp.child.id}/learn/${l.key}`}>{body}</Link> : <div aria-disabled="true">{body}</div>}
          </li>
        )
      })}
    </ol>
  )
}

export default function JourneyPage() {
  const { childId, exp } = useLearn()
  const [lessons, setLessons] = useState<LessonSummary[]>([])
  const [games, setGames] = useState<GameSummary[]>([])
  usePageDescriptor(() => pages.learn(exp, lessons.filter((l) => l.unlocked).length, lessons.length || 8), [exp, lessons])
  useEffect(() => {
    api.lessons(childId).then(setLessons, () => setLessons([]))
    api.games(childId).then(setGames, () => setGames([]))
  }, [childId, exp.progress.total_points])
  return (
    <div className="learn-page">
      <h1>
        {exp.theme.icons.learn} Learn & Play
      </h1>
      <p className="lead-dark">
        🎬 Watch how rugs are made, then 🎮 practise right away! {exp.difficulty.label} level.
      </p>
      <Journey lessons={lessons} games={games} />
      <section className="card">
        <RegionMap journey={exp.regions} childId={childId} avatar={avatarEmoji(exp.child.avatar_key)} />
      </section>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, type LessonSummary } from '../../api'
import { useLearn } from '../../learn/LearnContext'

/** The 8-stage path. Locked stages show a padlock until the previous one is done. */
export function Journey({ lessons }: { lessons: LessonSummary[] }) {
  const { exp } = useLearn()
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
  useEffect(() => {
    api.lessons(childId).then(setLessons, () => setLessons([]))
  }, [childId, exp.progress.total_points])
  return (
    <div className="learn-page">
      <h1>
        {exp.theme.icons.learn} Learn how rugs are made
      </h1>
      <p className="lead-dark">
        {exp.learning_style.emoji} Lessons are set to “{exp.learning_style.label}” at {exp.difficulty.label} level.
      </p>
      <Journey lessons={lessons} />
    </div>
  )
}

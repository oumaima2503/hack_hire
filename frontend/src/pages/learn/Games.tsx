import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, type GameSummary } from '../../api'
import { useLearn } from '../../learn/LearnContext'

export default function Games() {
  const { childId, exp } = useLearn()
  const [games, setGames] = useState<GameSummary[] | null>(null)

  useEffect(() => {
    api.games(childId).then(setGames, () => setGames([]))
  }, [childId, exp.progress.total_points])

  return (
    <div className="learn-page">
      <h1>{exp.theme.icons.games} Games</h1>
      <p className="lead-dark">
        Every game teaches a part of rug making. Difficulty: {exp.difficulty.label}
        {exp.difficulty.speed_seconds ? ` · ⏱ ${exp.difficulty.speed_seconds}s per question` : ''}
      </p>
      <div className="game-grid">
        {games?.map((g) =>
          g.unlocked ? (
            <Link key={g.key} to={g.key} className={`game-card${g.completed ? ' done' : ''}`}>
              <span className="game-emoji">{g.emoji}</span>
              <strong>{g.title}</strong>
              <small>{g.lesson.title}</small>
              {g.completed ? <span className="badge-done">✓ {g.best_score}/{g.max_score}</span> : <span className="badge-new">Play!</span>}
            </Link>
          ) : (
            <div key={g.key} className="game-card locked" aria-disabled="true">
              <span className="game-emoji">🔒</span>
              <strong>{g.title}</strong>
              <small>Unlocks with “{g.lesson.title}”</small>
            </div>
          ),
        )}
      </div>
    </div>
  )
}

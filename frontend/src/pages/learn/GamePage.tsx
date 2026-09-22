import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api, type GameConfig, type GameResult } from '../../api'
import { BuildPattern } from '../../games/BuildPattern'
import { MatchTools } from '../../games/MatchTools'
import { OrderSteps } from '../../games/OrderSteps'
import { RugStudio } from '../../games/RugStudio'
import { useLearn } from '../../learn/LearnContext'
import { QuestionRunner } from '../../learn/QuestionRunner'

export default function GamePage() {
  const { key = '' } = useParams()
  const { childId, exp, celebrate, setFocus } = useLearn()
  const [config, setConfig] = useState<GameConfig | null>(null)
  const [result, setResult] = useState<GameResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [round, setRound] = useState(0)

  const load = useCallback(() => {
    setConfig(null)
    setResult(null)
    api.game(childId, key).then(setConfig, (e) => setError(e.message))
  }, [childId, key])

  useEffect(() => {
    load()
    setFocus({ gameKey: key })
    return () => setFocus({})
  }, [load, key, setFocus, round])

  const done = (r: GameResult) => {
    setResult(r)
    celebrate(r.award)
  }

  const submitAnswers = async (answers: Record<string, string>) => done(await api.completeGame(childId, key, { answers }))

  // Route-relative links: ".." leaves "games/:key" and lands on /play/:childId.
  if (error) return <p className="error">{error} <Link to="../games">Back to games</Link></p>
  if (!config) return <p className="loading-dark">…</p>

  const v = exp.theme.vocab
  return (
    <div className="learn-page game-page">
      <header className="lesson-head">
        <span className="lesson-emoji">{config.emoji}</span>
        <div>
          <h1>{config.title}</h1>
          <p className="bubble-line">
            {config.guide.emoji} {config.intro}
          </p>
        </div>
      </header>

      {result ? (
        <section className="card result-card">
          <div className="big-emoji">{result.passed ? '🏆' : '💪'}</div>
          <h2>{result.passed ? `${v.cheer}!` : 'Good try!'}</h2>
          {config.type !== 'create_rug' && (
            <p className="lead-dark">
              Score: {result.score} / {result.max_score}
            </p>
          )}
          {!result.passed && <p className="soft">Play again to win the {v.points}!</p>}
          <div className="btn-row">
            <button className="btn primary" onClick={() => setRound((r) => r + 1)}>
              🔁 Play again
            </button>
            <Link to="../games" className="btn ghost">
              🎮 All games
            </Link>
            {exp.next_lesson && (
              <Link to={`../learn/${exp.next_lesson.key}`} className="btn ghost">
                📚 Next lesson
              </Link>
            )}
          </div>
        </section>
      ) : (
        <section className="card" key={round}>
          {(config.type === 'choose_material' || config.type === 'challenge') && config.questions && (
            <QuestionRunner
              questions={config.questions}
              allowRetry={config.type === 'choose_material'}
              timerSeconds={config.speed_seconds}
              style={config.type === 'challenge' ? 'challenge' : 'material'}
              onFinish={submitAnswers}
            />
          )}
          {config.type === 'match_tools' && <MatchTools config={config} onDone={done} />}
          {config.type === 'build_pattern' && <BuildPattern config={config} onDone={done} />}
          {config.type === 'order_steps' && <OrderSteps config={config} onDone={done} />}
          {config.type === 'create_rug' && config.studio && (
            <RugStudio studio={config.studio} onSaved={() => setResult({ passed: true, score: 1, max_score: 1, award: null })} />
          )}
        </section>
      )}
    </div>
  )
}

import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { api, type GameConfig, type GameResult } from '../api'
import { GameIntro } from '../guide/GameIntro'
import { GuideLayer } from '../guide/GuideBuddy'
import { useLearn } from '../learn/LearnContext'
import { QuestionRunner } from '../learn/QuestionRunner'
import { BuildPattern } from './BuildPattern'
import { MatchTools } from './MatchTools'
import { OrderSteps } from './OrderSteps'
import { RugStudio } from './RugStudio'

/**
 * Loads a game's personalised config and plays it. Used inside a lesson's
 * "Practice" step (right after the video) and on the stand-alone replay page.
 */
export function GamePlayer({
  gameKey,
  onFinished,
  actions,
  showIntro = true,
}: {
  gameKey: string
  onFinished?: (r: GameResult) => void
  actions?: ReactNode // extra buttons on the result card (e.g. "Next step")
  showIntro?: boolean
}) {
  const { childId, exp, celebrate } = useLearn()
  const [config, setConfig] = useState<GameConfig | null>(null)
  const [result, setResult] = useState<GameResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [round, setRound] = useState(0)
  const [intro, setIntro] = useState(false)
  const [howTo, setHowTo] = useState(false)
  const seenKey = `myrugy.intro.${childId}.${gameKey}`

  const load = useCallback(() => {
    setConfig(null)
    setResult(null)
    setError(null)
    api.game(childId, gameKey).then((cfg) => {
      setConfig(cfg)
      // The MyRugy Guide introduces a game the first time it is opened.
      let seen = false
      try {
        seen = sessionStorage.getItem(seenKey) === '1'
      } catch {
        /* ignore */
      }
      setIntro(cfg.plays === 0 && !seen)
    }, (e) => setError(e.message))
  }, [childId, gameKey]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(load, [load, round])

  const done = (r: GameResult) => {
    setResult(r)
    celebrate(r.award)
    onFinished?.(r)
  }
  const submitAnswers = async (answers: Record<string, string>) => done(await api.completeGame(childId, gameKey, { answers }))

  if (error) return <p className="error">{error}</p>
  if (!config) return <p className="loading-dark">…</p>

  const v = exp.theme.vocab
  const endIntro = () => {
    try {
      sessionStorage.setItem(seenKey, '1')
    } catch {
      /* ignore */
    }
    setIntro(false)
  }

  if (intro) return <GameIntro game={config} prefs={exp.guide} onDone={endIntro} />

  return (
    <GuideLayer game={config} result={result} onHowToPlay={() => setHowTo(true)}>
    {howTo && (
      // "How to play" mid-game: an overlay, so the child's game state is kept.
      <div className="modal-backdrop" role="dialog" aria-modal="true" onClick={() => setHowTo(false)}>
        <div className="modal intro-modal" onClick={(e) => e.stopPropagation()}>
          <GameIntro game={config} prefs={{ ...exp.guide, intro_mode: 'demo_first' }} onDone={() => setHowTo(false)} />
        </div>
      </div>
    )}
    <div className="game-player">
      {showIntro && (
        <div className="game-intro">
          <span className="game-intro-emoji">{config.emoji}</span>
          <div>
            <h3>{config.title}</h3>
            <p className="bubble-line">
              {config.guide.emoji} {config.intro}
            </p>
          </div>
        </div>
      )}

      {result ? (
        <div className="result-card">
          <div className="big-emoji">{result.passed ? '🏆' : '💪'}</div>
          <h2>{result.passed ? `${v.cheer}!` : 'Good try!'}</h2>
          {config.type !== 'create_rug' && (
            <p className="lead-dark">
              Score: {result.score} / {result.max_score}
            </p>
          )}
          {!result.passed && <p className="soft">Play again to win the {v.points}!</p>}
          <div className="btn-row">
            <button className="btn ghost" onClick={() => setRound((r) => r + 1)}>
              🔁 Play again
            </button>
            {actions}
          </div>
        </div>
      ) : (
        <div key={round}>
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
            <RugStudio studio={config.studio} onSaved={() => done({ passed: true, score: 1, max_score: 1, award: null })} />
          )}
        </div>
      )}
    </div>
    </GuideLayer>
  )
}

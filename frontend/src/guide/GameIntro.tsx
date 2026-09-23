import { useEffect, useState } from 'react'
import type { GameConfig, GuidePrefs } from '../api'
import { Rugy } from '../components/Rugy'
import { confettiFrom, sfx, speak } from '../fun'
import { guideText } from './guideText'

/**
 * First-time introduction of an EXISTING game by the MyRugy Guide:
 *   1. explain the goal · 2. show a simple example (with a pointing hand) and let
 *   the child try it · 3. "Your turn!" → the normal game starts, unchanged.
 * Style-aware: "do" learners can jump straight in; "listen" learners hear every step.
 */
export function GameIntro({ game, prefs, onDone }: { game: GameConfig; prefs: GuidePrefs; onDone: () => void }) {
  const tx = guideText(prefs.language)
  const demo = tx.demo[game.type]
  const [step, setStep] = useState<'offer' | 0 | 1 | 2>(prefs.intro_mode === 'try_first' ? 'offer' : 0)
  const [picked, setPicked] = useState<number | null>(null)
  const [point, setPoint] = useState(false)
  const talk = prefs.intro_mode === 'talk_first' || prefs.auto_speak

  const lines: Record<string, string> = {
    offer: tx.try_first,
    0: `${tx.hello} ${tx.goal[game.type]}`,
    1: demo.prompt,
    2: tx.your_turn,
  }

  useEffect(() => {
    if (talk) speak(lines[String(step)], prefs.language)
    setPoint(false)
    if (step !== 1) return
    const id = window.setTimeout(() => setPoint(true), 3500) // demonstrate if the child hesitates
    return () => window.clearTimeout(id)
  }, [step]) // eslint-disable-line react-hooks/exhaustive-deps

  const choose = (i: number, el: HTMLElement) => {
    setPicked(i)
    if (i === demo.answer) {
      sfx.yay()
      confettiFrom(el)
      if (talk) speak(demo.correct, prefs.language)
      window.setTimeout(() => setStep(2), 1400)
    } else {
      sfx.oops()
      if (talk) speak(demo.wrong, prefs.language)
    }
  }

  const dots = [0, 1, 2] as const
  return (
    <div className="game-intro-card" dir="auto" lang={prefs.language}>
      <div className="intro-guide">
        <Rugy size={76} mood={step === 2 || picked === demo.answer ? 'wow' : 'happy'} />
        <p className="bubble">
          {lines[String(step)]}
          <button className="bubble-speak" onClick={() => speak(lines[String(step)], prefs.language)} aria-label="Read aloud">
            🔊
          </button>
        </p>
      </div>

      {step === 'offer' && (
        <div className="btn-row center-row">
          <button className="btn primary big" onClick={onDone}>
            ▶ {tx.lets_play}
          </button>
          <button className="btn ghost" onClick={() => setStep(0)}>
            👀 {tx.show_me}
          </button>
        </div>
      )}

      {step === 0 && (
        <div className="intro-goal">
          <span className="intro-game-emoji">{game.emoji}</span>
          <strong>{game.title}</strong>
          <button className="btn primary big" onClick={() => setStep(1)}>
            {tx.next} ➜
          </button>
        </div>
      )}

      {step === 1 && (
        <div className="intro-demo">
          <p className="intro-visual" dir="ltr">
            {demo.visual}
          </p>
          <div className="intro-options">
            {demo.options.map((o, i) => (
              <button
                key={o}
                className={`option${picked === i ? (i === demo.answer ? ' right' : ' wrong') : ''}`}
                onClick={(e) => choose(i, e.currentTarget)}
                disabled={picked === demo.answer}
              >
                {o}
                {point && picked === null && i === demo.answer && <span className="intro-hand" aria-hidden="true">👆</span>}
              </button>
            ))}
          </div>
          {picked !== null && <p className={picked === demo.answer ? 'good' : 'soft'}>{picked === demo.answer ? demo.correct : demo.wrong}</p>}
        </div>
      )}

      {step === 2 && (
        <div className="intro-goal">
          <span className="intro-game-emoji">🎉</span>
          <button className="btn primary big ready-bounce" onClick={onDone}>
            ▶ {tx.lets_play}
          </button>
        </div>
      )}

      {step !== 'offer' && (
        <div className="intro-footer">
          <div className="dots">
            {dots.map((d) => (
              <span key={d} className={typeof step === 'number' && d <= step ? 'on' : ''} />
            ))}
          </div>
          {step !== 2 && (
            <button className="linklike small-skip" onClick={onDone}>
              {tx.skip}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

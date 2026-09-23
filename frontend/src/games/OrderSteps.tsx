import { useEffect, useState } from 'react'
import { api, type GameConfig, type GameResult } from '../api'
import { sfx } from '../fun'
import { useGuide } from '../guide/GuideContext'
import { useLearn } from '../learn/LearnContext'

/** Game 4: put the rug-making steps in order (buttons work on touch screens and keyboards). */
export function OrderSteps({ config, onDone }: { config: GameConfig; onDone: (r: GameResult) => void }) {
  const { childId } = useLearn()
  const [steps, setSteps] = useState(config.steps ?? [])
  const [positions, setPositions] = useState<boolean[] | null>(null)
  const [picked, setPicked] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)
  const guide = useGuide()

  useEffect(() => {
    guide.setState({ order: steps.map((s) => s.id) })
  }, [steps]) // eslint-disable-line react-hooks/exhaustive-deps

  const move = (from: number, to: number) => {
    if (to < 0 || to >= steps.length) return
    sfx.whoosh()
    const next = [...steps]
    ;[next[from], next[to]] = [next[to], next[from]]
    setSteps(next)
    setPositions(null)
  }

  const tap = (i: number) => {
    if (picked === null) {
      sfx.pop()
      setPicked(i)
    }
    else {
      if (picked !== i) move(picked, i)
      setPicked(null)
    }
  }

  const check = async () => {
    setBusy(true)
    try {
      const res = await api.completeGame(childId, config.key, { order: steps.map((s) => s.id) })
      setPositions(res.correct_positions ?? null)
      if (res.passed) setTimeout(() => onDone(res), 700)
      else {
        sfx.oops()
        guide.report({ type: 'mistake' })
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="order">
      <p className="hint center">Tap two cards to swap them, or use the arrows.</p>
      <ol className="order-list">
        {steps.map((s, i) => (
          <li key={s.id} className={`order-item${picked === i ? ' on' : ''}${positions ? (positions[i] ? ' right' : ' wrong') : ''}`}>
            <span className="order-num">{i + 1}</span>
            <button className="order-card" onClick={() => tap(i)} aria-pressed={picked === i}>
              <span className="order-emoji">{s.emoji}</span> {s.label}
            </button>
            <span className="order-arrows">
              <button onClick={() => move(i, i - 1)} disabled={i === 0} aria-label={`Move ${s.label} up`}>
                ▲
              </button>
              <button onClick={() => move(i, i + 1)} disabled={i === steps.length - 1} aria-label={`Move ${s.label} down`}>
                ▼
              </button>
            </span>
          </li>
        ))}
      </ol>
      <button className="btn primary big" onClick={check} disabled={busy}>
        Check the order ✓
      </button>
      {positions && !positions.every(Boolean) && <p className="soft center">Green ones are right! Move the red ones.</p>}
    </div>
  )
}

import { useState } from 'react'
import { api, type GameConfig, type GameResult } from '../api'
import { confettiFrom, sfx } from '../fun'
import { useLearn } from '../learn/LearnContext'

/** Game 2: tap a tool, then tap its job. */
export function MatchTools({ config, onDone }: { config: GameConfig; onDone: (r: GameResult) => void }) {
  const { childId } = useLearn()
  const [selected, setSelected] = useState<string | null>(null)
  const [matched, setMatched] = useState<Record<string, string>>({})
  const [wrong, setWrong] = useState<string | null>(null)
  const [mistakes, setMistakes] = useState(0)
  const pairs = config.pairs ?? {}
  const tools = config.tools ?? []

  const pickPurpose = async (purpose: string, el: HTMLElement) => {
    if (!selected) return
    if (pairs[selected] !== purpose) {
      sfx.oops()
      setWrong(purpose)
      setMistakes((m) => m + 1)
      setTimeout(() => setWrong(null), 600)
      return
    }
    sfx.select()
    confettiFrom(el, [tools.find((t) => t.tool === selected)?.emoji ?? '✨', '✨'])
    const next = { ...matched, [selected]: purpose }
    setMatched(next)
    setSelected(null)
    if (Object.keys(next).length === tools.length) {
      onDone(await api.completeGame(childId, config.key, { pairs: next }))
    }
  }

  return (
    <div className="match">
      <p className="hint center">
        Tap a tool, then tap what it does. {mistakes > 0 && `(${mistakes} oops)`}
      </p>
      <div className="match-cols">
        <div className="match-col">
          {tools.map((t) => {
            const done = t.tool in matched
            return (
              <button
                key={t.tool}
                className={`match-item tool${selected === t.tool ? ' on' : ''}${done ? ' done' : ''}`}
                onClick={() => {
                  if (done) return
                  sfx.pop()
                  setSelected(t.tool)
                }}
                disabled={done}
                aria-pressed={selected === t.tool}
              >
                <span className="match-emoji">{t.emoji}</span> {t.tool}
              </button>
            )
          })}
        </div>
        <div className="match-col">
          {(config.purposes ?? []).map((p) => {
            const done = Object.values(matched).includes(p)
            return (
              <button
                key={p}
                className={`match-item purpose${done ? ' done' : ''}${wrong === p ? ' wrong' : ''}`}
                onClick={(e) => pickPurpose(p, e.currentTarget)}
                disabled={done || !selected}
              >
                {done && '✓ '}
                {p}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

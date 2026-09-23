import { useEffect, useState } from 'react'
import { api, type GameConfig, type GameResult, type PatternCell } from '../api'
import { sfx } from '../fun'
import { useGuide } from '../guide/GuideContext'
import { useLearn } from '../learn/LearnContext'

/** Game 3: copy the target pattern (repeating, or mirror symmetry for masters). */
export function BuildPattern({ config, onDone }: { config: GameConfig; onDone: (r: GameResult) => void }) {
  const { childId } = useLearn()
  const target = config.target ?? []
  const palette = config.palette ?? []
  const shapes = config.shapes ?? []
  const [color, setColor] = useState(palette[0])
  const [shape, setShape] = useState(shapes[0])
  const [cells, setCells] = useState<(PatternCell | null)[]>(() => target.map(() => null))
  const [positions, setPositions] = useState<boolean[] | null>(null)
  const [busy, setBusy] = useState(false)
  const guide = useGuide()

  useEffect(() => {
    guide.setState({ seed: config.seed, cells })
  }, [cells]) // eslint-disable-line react-hooks/exhaustive-deps

  const paint = (i: number) => {
    sfx.pop()
    setCells((c) => c.map((x, j) => (j === i ? { color, shape } : x)))
    setPositions(null)
  }

  const check = async () => {
    setBusy(true)
    try {
      const res = await api.completeGame(childId, config.key, { seed: config.seed, cells })
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

  const Cell = ({ c }: { c: PatternCell | null }) => (
    <span className="pcell-inner" style={{ background: c?.color ?? 'transparent', color: c && isDark(c.color) ? '#fff' : '#222' }}>
      {c?.shape ?? ''}
    </span>
  )

  return (
    <div className="pattern">
      <p className="eyebrow">Copy this row</p>
      <div className="pattern-row target" dir="ltr">
        {target.map((c, i) => (
          <span key={i} className={`pcell${config.difficulty === 3 && i === target.length / 2 ? ' mirror-line' : ''}`}>
            <Cell c={c} />
          </span>
        ))}
      </div>
      <p className="eyebrow">Your rug row: tap a square to paint it</p>
      <div className="pattern-row" dir="ltr">
        {cells.map((c, i) => (
          <button
            key={i}
            className={`pcell editable${positions ? (positions[i] ? ' right' : ' wrong') : ''}`}
            onClick={() => paint(i)}
            aria-label={`Square ${i + 1}`}
          >
            <Cell c={c} />
          </button>
        ))}
      </div>
      <div className="palette-row" role="group" aria-label="Colours">
        {palette.map((p) => (
          <button key={p} className={`swatch${p === color ? ' on' : ''}`} style={{ background: p }} onClick={() => setColor(p)} aria-label={p} aria-pressed={p === color} />
        ))}
      </div>
      <div className="palette-row" role="group" aria-label="Shapes">
        {shapes.map((s) => (
          <button key={s} className={`shape-btn${s === shape ? ' on' : ''}`} onClick={() => setShape(s)} aria-pressed={s === shape}>
            {s}
          </button>
        ))}
      </div>
      <button className="btn primary big" onClick={check} disabled={busy || cells.some((c) => !c)}>
        Check my pattern ✓
      </button>
      {positions && !positions.every(Boolean) && <p className="soft center">Almost! Fix the squares with a red border.</p>}
    </div>
  )
}

export function isDark(hex: string) {
  const n = parseInt(hex.slice(1), 16)
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255]
  return r * 0.299 + g * 0.587 + b * 0.114 < 140
}

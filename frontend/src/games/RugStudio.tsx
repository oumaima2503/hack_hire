import { useEffect, useRef, useState } from 'react'
import { api, type Award, type Rug, type Studio } from '../api'
import { sfx } from '../fun'
import { useLearn } from '../learn/LearnContext'

type Tool = 'brush' | 'row' | 'erase' | 'motif' | 'stamp'

/** Built-in and unlockable starting designs. */
function template(name: string, rows: number, cols: number, palette: string[]): (string | null)[] {
  const cells: (string | null)[] = Array(rows * cols).fill(null)
  const [cr, cc] = [(rows - 1) / 2, (cols - 1) / 2]
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) {
      const i = r * cols + c
      if (name === 'border') {
        if (r === 0 || c === 0 || r === rows - 1 || c === cols - 1) cells[i] = palette[0]
        else if (r === 1 || c === 1 || r === rows - 2 || c === cols - 2) cells[i] = palette[1]
      } else if (name === 'medallion') {
        const d = Math.round(Math.abs(r - cr) + Math.abs(c - cc))
        cells[i] = palette[Math.floor(d / 2) % Math.min(4, palette.length)]
      }
    }
  return cells
}

/** Game 5: an interactive rug canvas. Saving stores the design in the child's progress. */
export function RugStudio({ studio, onSaved }: { studio: Studio; onSaved?: (rug: Rug, award: Award | null) => void }) {
  const { childId, exp, celebrate } = useLearn()
  const { rows, cols, palette } = studio
  const [cells, setCells] = useState<(string | null)[]>(() => Array(rows * cols).fill(null))
  const [motifs, setMotifs] = useState<Record<number, string>>({})
  const [tool, setTool] = useState<Tool>('brush')
  const [color, setColor] = useState(palette[0])
  const [motif, setMotif] = useState(studio.motifs[0])
  const [stamp, setStamp] = useState(studio.stamps[0])
  const [mirror, setMirror] = useState(true)
  const [texture, setTexture] = useState(studio.textures[0])
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [saved, setSaved] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const painting = useRef(false)

  useEffect(() => {
    const up = () => (painting.current = false)
    window.addEventListener('pointerup', up)
    return () => window.removeEventListener('pointerup', up)
  }, [])

  const targets = (r: number, c: number) => {
    const out = [[r, c]]
    if (mirror && c !== cols - 1 - c) out.push([r, cols - 1 - c])
    return out
  }

  const apply = (i: number) => {
    const r = Math.floor(i / cols)
    const c = i % cols
    setSaved(null)
    if (tool === 'motif') {
      setMotifs((m) => {
        const next = { ...m }
        for (const [tr, tc] of targets(r, c)) next[tr * cols + tc] = motif
        return next
      })
      return
    }
    setCells((prev) => {
      const next = [...prev]
      const paint = (rr: number, cc: number, value: string | null) => {
        if (rr >= 0 && rr < rows && cc >= 0 && cc < cols) next[rr * cols + cc] = value
      }
      if (tool === 'row') for (let cc = 0; cc < cols; cc++) paint(r, cc, color)
      else if (tool === 'stamp') {
        const mask = stamp.mask
        const [h, w] = [mask.length, mask[0].length]
        for (const [tr, tc] of targets(r, c))
          mask.forEach((line, dr) =>
            line.forEach((on, dc) => {
              if (on) paint(tr - Math.floor(h / 2) + dr, tc - Math.floor(w / 2) + dc, color)
            }),
          )
      } else for (const [tr, tc] of targets(r, c)) paint(tr, tc, tool === 'erase' ? null : color)
      return next
    })
    if (tool === 'erase')
      setMotifs((m) => {
        const next = { ...m }
        for (const [tr, tc] of targets(r, c)) delete next[tr * cols + tc]
        return next
      })
  }

  const save = async () => {
    setBusy(true)
    setError(null)
    try {
      const res = await api.saveRug(childId, name.trim() || `${exp.child.name}'s rug`, {
        rows,
        cols,
        cells,
        texture,
        motifs: Object.entries(motifs).map(([i, e]) => ({ i: Number(i), e })),
      })
      setSaved(res.rug.name)
      celebrate(res.award)
      onSaved?.(res.rug, res.award)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save')
    } finally {
      setBusy(false)
    }
  }

  const tools: [Tool, string, string][] = [
    ['brush', '🖌️', 'Brush'],
    ['row', '➖', 'Fill row'],
    ['stamp', '🔷', 'Pattern'],
    ['motif', exp.theme.motifs[0], 'Sticker'],
    ['erase', '🧽', 'Eraser'],
  ]

  return (
    <div className="studio">
      <div className="studio-canvas">
        <div className="rug-fringe big" aria-hidden="true" />
        <div
          className={`rug-grid editable texture-${texture}`}
          style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
          onPointerLeave={() => (painting.current = false)}
        >
          {cells.map((c, i) => (
            <button
              key={i}
              style={{ background: c ?? '#f5ecd7' }}
              onPointerDown={(e) => {
                e.preventDefault()
                sfx.pop()
                painting.current = tool === 'brush' || tool === 'erase'
                apply(i)
              }}
              onPointerEnter={() => painting.current && apply(i)}
              aria-label={`Knot ${Math.floor(i / cols) + 1}-${(i % cols) + 1}`}
            >
              {motifs[i]}
            </button>
          ))}
        </div>
        <div className="rug-fringe big" aria-hidden="true" />
        {mirror && <div className="mirror-hint">🪞 Mirror is on: both sides match!</div>}
      </div>

      <div className="studio-tools">
        <div className="tool-group" role="group" aria-label="Tools">
          {tools.map(([k, icon, label]) => (
            <button key={k} className={`tool-btn${tool === k ? ' on' : ''}`} onClick={() => setTool(k)} aria-pressed={tool === k}>
              <span>{icon}</span>
              {label}
            </button>
          ))}
          <label className="toggle">
            <input type="checkbox" checked={mirror} onChange={(e) => setMirror(e.target.checked)} /> 🪞 Mirror
          </label>
        </div>

        <p className="eyebrow">Colours</p>
        <div className="palette-row">
          {palette.map((p) => (
            <button key={p} className={`swatch${p === color ? ' on' : ''}`} style={{ background: p }} onClick={() => setColor(p)} aria-label={p} aria-pressed={p === color} />
          ))}
        </div>

        {tool === 'stamp' && (
          <>
            <p className="eyebrow">Patterns</p>
            <div className="palette-row">
              {studio.stamps.map((s) => (
                <button key={s.key} className={`shape-btn${s.key === stamp.key ? ' on' : ''}`} onClick={() => setStamp(s)} title={s.name}>
                  {s.emoji}
                </button>
              ))}
            </div>
          </>
        )}
        {tool === 'motif' && (
          <>
            <p className="eyebrow">Stickers</p>
            <div className="palette-row">
              {studio.motifs.map((m) => (
                <button key={m} className={`shape-btn${m === motif ? ' on' : ''}`} onClick={() => setMotif(m)}>
                  {m}
                </button>
              ))}
            </div>
          </>
        )}

        <p className="eyebrow">Texture</p>
        <div className="palette-row">
          {studio.textures.map((tx) => (
            <button key={tx} className={`chip-btn${tx === texture ? ' on' : ''}`} onClick={() => setTexture(tx)}>
              {tx === 'wool' ? '🐑' : tx === 'cotton' ? '☁️' : '✨'} {tx}
            </button>
          ))}
        </div>

        <p className="eyebrow">Start from</p>
        <div className="palette-row">
          {['border', ...studio.templates].map((tp) => (
            <button key={tp} className="chip-btn" onClick={() => { setCells(template(tp, rows, cols, palette)); setMotifs({}) }}>
              {tp === 'medallion' ? '🏵️ Fès medallion' : '🖼️ Border'}
            </button>
          ))}
          <button className="chip-btn" onClick={() => { setCells(Array(rows * cols).fill(null)); setMotifs({}) }}>
            🧽 Clear
          </button>
        </div>

        <label className="field">
          <span>Name your rug</span>
          <input value={name} maxLength={40} onChange={(e) => setName(e.target.value)} placeholder={`${exp.child.name}'s rug`} />
        </label>
        {error && <p className="error">{error}</p>}
        {saved && <p className="good">✅ “{saved}” is saved in your gallery!</p>}
        <button className="btn primary big" onClick={save} disabled={busy || !cells.some(Boolean)}>
          ✂️ Finish & save my rug
        </button>
        {studio.workshop && <p className="hint">👑 Master Weaver Workshop: extra-big loom!</p>}
      </div>
    </div>
  )
}

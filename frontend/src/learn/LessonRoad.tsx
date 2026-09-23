interface Stop {
  key: string
  icon: string
  label: string
}

const W = 1000
const H = 180

/**
 * The lesson steps as a little road map: Watch → Practice → Discover → Quiz → Done.
 * The child's avatar stands on the current stop; finished stops get a ✓ and the
 * road behind them is coloured in.
 */
export function LessonRoad({
  stops,
  at,
  reached,
  onGo,
  avatar,
}: {
  stops: Stop[]
  at: number
  reached: (key: string) => boolean
  onGo: (key: string) => void
  avatar: string
}) {
  const n = stops.length
  const pts = stops.map((_, i) => ({ x: 100 + (i * (W - 170)) / Math.max(1, n - 1), y: i % 2 ? 122 : 62 }))
  const seg = (i: number) => {
    const a = pts[i]
    const b = pts[i + 1]
    const dx = (b.x - a.x) / 2
    return `M ${a.x} ${a.y} C ${a.x + dx} ${a.y}, ${b.x - dx} ${b.y}, ${b.x} ${b.y}`
  }
  const segments = pts.slice(0, -1).map((_, i) => seg(i))
  const lead = `M 0 ${pts[0].y} L ${pts[0].x} ${pts[0].y}`
  const tail = `M ${pts[n - 1].x} ${pts[n - 1].y} L ${W} ${pts[n - 1].y}`

  return (
    <nav className="road" aria-label="Lesson steps">
      <svg className="road-svg" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true">
        {[lead, ...segments, tail].map((d, i) => (
          <path key={`edge${i}`} d={d} className="road-edge" />
        ))}
        {[lead, ...segments, tail].map((d, i) => (
          <path key={`base${i}`} d={d} className="road-base" />
        ))}
        <path d={lead} className="road-done" />
        {segments.map((d, i) => i < at && <path key={`done${i}`} d={d} className="road-done" />)}
        {[lead, ...segments, tail].map((d, i) => (
          <path key={`line${i}`} d={d} className="road-line" />
        ))}
      </svg>

      <span className="road-flag start" style={{ left: 0, top: `${(pts[0].y / H) * 100}%` }} aria-hidden="true">
        🚩
      </span>

      <ol className="road-stops">
        {stops.map((s, i) => {
          const status = i < at ? 'done' : i === at ? 'now' : reached(s.key) ? 'open' : 'locked'
          return (
            <li key={s.key} className={`road-stop ${status}`} style={{ left: `${(pts[i].x / W) * 100}%`, top: `${(pts[i].y / H) * 100}%` }}>
              {status === 'now' && (
                <span className="road-me" aria-hidden="true">
                  {avatar}
                </span>
              )}
              <button
                type="button"
                onClick={() => status !== 'locked' && onGo(s.key)}
                disabled={status === 'locked'}
                aria-current={status === 'now' ? 'step' : undefined}
                aria-label={`${i + 1}. ${s.label}${status === 'done' ? ' (done)' : status === 'locked' ? ' (locked)' : ''}`}
              >
                <span className="road-icon">{s.icon}</span>
                {status === 'done' && <span className="road-badge ok">✓</span>}
                {status === 'locked' && <span className="road-badge lock">🔒</span>}
              </button>
              <span className="road-label">
                <b>{i + 1}</b> {s.label}
              </span>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

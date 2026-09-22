import type { RugDesign } from '../api'

/** Read-only rug preview (galleries, parent dashboard). */
export function RugView({ design, size = 'small', name }: { design: RugDesign; size?: 'small' | 'medium'; name?: string }) {
  const motifs = new Map(design.motifs?.map((m) => [m.i, m.e]))
  return (
    <figure className={`rug-view ${size}`}>
      <div className="rug-fringe" aria-hidden="true" />
      <div
        className={`rug-grid texture-${design.texture || 'wool'}`}
        style={{ gridTemplateColumns: `repeat(${design.cols}, 1fr)` }}
        role="img"
        aria-label={name ? `Rug: ${name}` : 'Rug design'}
      >
        {design.cells.map((c, i) => (
          <span key={i} style={{ background: c ?? '#f5ecd7' }}>
            {motifs.get(i)}
          </span>
        ))}
      </div>
      <div className="rug-fringe" aria-hidden="true" />
      {name && <figcaption>{name}</figcaption>}
    </figure>
  )
}

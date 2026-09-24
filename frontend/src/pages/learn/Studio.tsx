import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, type GameConfig, type Rug } from '../../api'
import { RugView } from '../../components/RugView'
import { RugStudio } from '../../games/RugStudio'
import { useLearn } from '../../learn/LearnContext'
import { usePageDescriptor } from '../../companion/PageContext'
import { pages } from '../../companion/pageDescriptors'

export default function Studio() {
  const { childId, exp } = useLearn()
  const [config, setConfig] = useState<GameConfig | null>(null)
  const [locked, setLocked] = useState(false)
  const [rugs, setRugs] = useState<Rug[]>([])
  usePageDescriptor(() => pages.studio(exp, locked, rugs.length), [exp, locked, rugs.length])

  useEffect(() => {
    api.game(childId, 'create_rug').then(setConfig, () => setLocked(true))
    api.rugs(childId).then(setRugs, () => setRugs([]))
  }, [childId, exp.progress.items_unlocked])

  return (
    <div className="learn-page">
      <h1>🧶 Create My Rug</h1>
      {locked ? (
        <section className="card center-panel">
          <div className="big-emoji">🔒</div>
          <p className="lead-dark">Finish the lessons up to “Create Your Rug” to open the studio.</p>
          <Link to="../learn" className="btn primary">
            📚 Go to lessons
          </Link>
        </section>
      ) : config?.studio ? (
        <section className="card">
          <p className="bubble-line">
            {exp.theme.guide.emoji} {config.intro} Your loom is {config.studio.cols} × {config.studio.rows} knots.
          </p>
          <RugStudio studio={config.studio} onSaved={(rug) => setRugs((r) => [rug, ...r])} />
        </section>
      ) : (
        <p className="loading-dark">…</p>
      )}

      {rugs.length > 0 && (
        <section className="card">
          <h2>🖼️ My rug gallery ({rugs.length})</h2>
          <div className="gallery">
            {rugs.map((r) => (
              <RugView key={r.id} design={r.design} name={r.name} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

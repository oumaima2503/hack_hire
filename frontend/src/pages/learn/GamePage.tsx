import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api, type GameSummary } from '../../api'
import { GamePlayer } from '../../games/GamePlayer'
import { useLearn } from '../../learn/LearnContext'
import { usePageDescriptor } from '../../companion/PageContext'
import { pages } from '../../companion/pageDescriptors'

/** Replay a game on its own (from the journey list). New players meet games inside lessons. */
export default function GamePage() {
  const { key = '' } = useParams()
  const { childId, exp, setFocus } = useLearn()
  const [info, setInfo] = useState<GameSummary | null>(null)
  useEffect(() => {
    api.games(childId).then((gs) => setInfo(gs.find((g) => g.key === key) ?? null), () => setInfo(null))
  }, [childId, key])
  usePageDescriptor(() => pages.game(exp, info && { title: info.title, type: info.type }), [exp, info])

  useEffect(() => {
    setFocus({ gameKey: key })
    return () => setFocus({})
  }, [key, setFocus])

  // Route-relative links: ".." leaves "games/:key" and lands on /play/:childId.
  return (
    <div className="learn-page game-page">
      <p>
        <Link to="../learn" className="btn ghost small">
          ⬅ Back to Learn & Play
        </Link>
      </p>
      <section className="card">
        <GamePlayer
          gameKey={key}
          actions={
            <Link to="../learn" className="btn primary">
              🗺️ Back to my journey
            </Link>
          }
        />
      </section>
    </div>
  )
}

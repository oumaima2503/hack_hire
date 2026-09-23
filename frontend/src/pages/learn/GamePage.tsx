import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { GamePlayer } from '../../games/GamePlayer'
import { useLearn } from '../../learn/LearnContext'

/** Replay a game on its own (from the journey list). New players meet games inside lessons. */
export default function GamePage() {
  const { key = '' } = useParams()
  const { setFocus } = useLearn()

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

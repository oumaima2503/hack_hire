import { useEffect, useState, type MouseEvent } from 'react'
import { Link } from 'react-router-dom'
import { api, type LessonSummary } from '../../api'
import { RUG_JOKES, confettiFrom, sfx, speak } from '../../fun'
import { avatarEmoji } from '../../content'
import { useLearn } from '../../learn/LearnContext'
import { RegionMap } from '../../learn/RegionMap'
import { Journey } from './Journey'

export default function Home() {
  const { childId, exp } = useLearn()
  const [lessons, setLessons] = useState<LessonSummary[]>([])
  const t = exp.theme
  const p = exp.progress
  const next = exp.next_lesson
  const levelPct = Math.round(((p.points_per_level - p.points_to_next) / p.points_per_level) * 100)

  const [joke, setJoke] = useState<string | null>(null)
  const [pokes, setPokes] = useState(0)

  useEffect(() => {
    api.lessons(childId).then(setLessons, () => setLessons([]))
  }, [childId, p.total_points])

  const greeting = `I’m ${t.guide.name}. ${next ? `Today let’s explore “${next.title}” together!` : 'You finished every lesson. Time to create rugs!'}`

  // Tap the guide for a (very) silly rug joke.
  const poke = (e: MouseEvent<HTMLButtonElement>) => {
    const j = RUG_JOKES[pokes % RUG_JOKES.length]
    setPokes((n) => n + 1)
    setJoke(j)
    sfx.boing()
    confettiFrom(e.currentTarget, [t.guide.emoji, '😂', t.vocab.point_emoji])
    speak(j, 'en')
  }

  return (
    <div className="learn-page">
      <section className="hero-card">
        <button className="guide-big" key={pokes} onClick={poke} aria-label={`Tap ${t.guide.name} for a joke`}>
          {t.guide.emoji}
          <span className="tap-me">Tap me!</span>
        </button>
        <div>
          <h1>
            {t.vocab.cheer}, {exp.child.name}!
          </h1>
          <p className="bubble-line">
            {joke ?? greeting}
            <button className="bubble-speak" onClick={() => speak(joke ?? greeting, 'en')} aria-label="Read aloud">
              🔊
            </button>
          </p>
          {next ? (
            <Link to={`learn/${next.key}`} className="btn primary big">
              {next.emoji} {next.status === 'started' ? 'Continue' : 'Start'}: {next.title}
            </Link>
          ) : (
            <Link to="studio" className="btn primary big">
              🧶 Create a rug
            </Link>
          )}
        </div>
      </section>

      <section className="tiles">
        <div className="tile">
          <span className="tile-emoji">{t.vocab.point_emoji}</span>
          <strong>{p.total_points}</strong>
          <small>{t.vocab.points}</small>
        </div>
        <div className="tile">
          <span className="tile-emoji">🏆</span>
          <strong>
            {t.vocab.level} {p.xp_level}
          </strong>
          <div className="meter" aria-label={`${p.points_to_next} ${t.vocab.points} to next level`}>
            <span style={{ width: `${levelPct}%` }} />
          </div>
        </div>
        <div className="tile">
          <span className="tile-emoji">📚</span>
          <strong>
            {p.lessons_completed}/{p.lessons_total}
          </strong>
          <small>lessons</small>
        </div>
        <div className="tile">
          <span className="tile-emoji">🔥</span>
          <strong>{p.streak_days}</strong>
          <small>day streak</small>
        </div>
      </section>

      <section className="card">
        <RegionMap journey={exp.regions} childId={childId} avatar={avatarEmoji(exp.child.avatar_key)} />
      </section>

      <section className="card">
        <h2>
          {t.icons.learn} Your rug-making journey
        </h2>
        <Journey lessons={lessons} />
      </section>

      <Link to={`/adventure?child=${childId}`} className="card box-card">
        <span className="box-card-emoji">🎁</span>
        <div>
          <strong>Your MyRugy Box adventure</strong>
          <small>See the real-world kit made for you</small>
        </div>
        <span aria-hidden="true">➜</span>
      </Link>
    </div>
  )
}

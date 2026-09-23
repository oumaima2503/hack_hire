import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, type GameSummary, type LessonSummary } from '../../api'
import { avatarEmoji } from '../../content'
import { useLearn } from '../../learn/LearnContext'
import { RegionMap } from '../../learn/RegionMap'
import { Journey } from './Journey'

import { TalkingAvatar } from '../../components/TalkingAvatar'

export default function Home() {
  const { childId, exp } = useLearn()
  const [lessons, setLessons] = useState<LessonSummary[]>([])
  const [games, setGames] = useState<GameSummary[]>([])
  const t = exp.theme
  const p = exp.progress
  const next = exp.next_lesson
  const levelPct = Math.round(((p.points_per_level - p.points_to_next) / p.points_per_level) * 100)

  useEffect(() => {
    api.lessons(childId).then(setLessons, () => setLessons([]))
    api.games(childId).then(setGames, () => setGames([]))
  }, [childId, p.total_points])

  const greeting = `I’m ${t.guide.name}. ${next ? `Today let’s explore “${next.title}” together!` : 'You finished every lesson. Time to create rugs!'}`

  return (
    <div className="learn-page">
      <section className="hero-card glass-panel">
        <TalkingAvatar
          say={greeting}
          lang={exp.guide?.language ?? 'en'}
          avatarEmoji={avatarEmoji(exp.child.avatar_key) || t.guide.emoji}
          guideName={t.guide.name}
          size={90}
          mood="happy"
          layout="row"
        />
        <div style={{ display: 'grid', gap: '10px' }}>
          <h1>
            {t.vocab.cheer}, {exp.child.name}!
          </h1>
          {next ? (
            <Link to={`learn/${next.key}`} className="btn primary big">
              🎬 {next.status === 'started' ? 'Continue' : 'Watch & play'}: {next.title}
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
        <Journey lessons={lessons} games={games} />
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

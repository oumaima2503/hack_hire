import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api, type Lesson as LessonT, type LessonSummary, type Question } from '../../api'
import { speak, stopSpeaking, useLearn } from '../../learn/LearnContext'
import { QuestionRunner } from '../../learn/QuestionRunner'
import { RegionStops } from '../../learn/RegionMap'
import { Storyboard } from '../../learn/Storyboard'
import { TapCards } from '../../learn/TapCards'

export default function Lesson() {
  const { key = '' } = useParams()
  const { childId, exp, celebrate, setFocus } = useLearn()
  const [lesson, setLesson] = useState<LessonT | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [quiz, setQuiz] = useState<Question[] | null>(null)
  const [quizDone, setQuizDone] = useState(false)
  const [finished, setFinished] = useState<{ next: LessonSummary | null } | null>(null)
  const lang = exp.child.language ?? 'en'

  useEffect(() => {
    setLesson(null)
    setQuiz(null)
    setQuizDone(false)
    setFinished(null)
    api.lesson(childId, key).then(setLesson, (e) => setError(e.message))
    setFocus({ lessonId: key })
    return () => {
      stopSpeaking()
      setFocus({})
    }
  }, [childId, key, setFocus])

  const onWatched = useCallback(() => {
    api.videoWatched(childId, key).then((r) => celebrate(r.award), () => undefined)
  }, [childId, key, celebrate])

  if (error) return <p className="error">{error} <Link to="../learn">Back</Link></p>
  if (!lesson) return <p className="loading-dark">…</p>

  const complete = async () => {
    const res = await api.completeLesson(childId, key)
    celebrate(res.award)
    setFinished({ next: res.next_lesson })
  }

  const readAll = () => speak([...lesson.explain, lesson.analogy].join(' '), lang)

  const sections = {
    video: (
      <section className="card" key="video">
        <h2>🎬 Watch the story</h2>
        <Storyboard
          frames={lesson.storyboard}
          videoUrl={lesson.video_url}
          lang={lang}
          autoNarrate={lesson.learning_style === 'listen'}
          onWatched={onWatched}
        />
      </section>
    ),
    explain: (
      <section className="card" key="explain">
        <div className="card-head">
          <h2>📖 Let’s learn</h2>
          <button className={`btn ${lesson.learning_style === 'listen' ? 'primary' : 'ghost'} small`} onClick={readAll}>
            🔊 Read to me
          </button>
        </div>
        <ul className={`explain level-${lesson.reading_level}`}>
          {lesson.explain.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
        <p className="analogy">{lesson.analogy}</p>
      </section>
    ),
    cards: (
      <section className="card" key="cards">
        <h2>✋ Tap to discover</h2>
        <TapCards cards={lesson.cards} />
      </section>
    ),
    quiz: (
      <section className="card" key="quiz">
        <h2>❓ Quick quiz</h2>
        {!lesson.has_quiz || quizDone ? (
          !finished && (
            <button className="btn primary big" onClick={complete}>
              ✅ I finished this lesson!
            </button>
          )
        ) : quiz ? (
          <QuestionRunner questions={quiz} allowRetry onFinish={() => setQuizDone(true)} />
        ) : (
          <button className="btn primary" onClick={() => api.quiz(childId, key).then(setQuiz)}>
            Start the quiz ({exp.difficulty.label})
          </button>
        )}
        {finished && (
          <div className="lesson-done">
            <p className="good">🎉 Lesson complete!</p>
            <div className="btn-row">
              {lesson.game && (
                <Link to={`../games/${lesson.game.key}`} className="btn primary">
                  {lesson.game.emoji} Play: {lesson.game.title}
                </Link>
              )}
              {finished.next && finished.next.key !== key && (
                <Link to={`../learn/${finished.next.key}`} className="btn ghost">
                  Next: {finished.next.emoji} {finished.next.title}
                  {finished.next.regions.length > 0 && ` · ✈️ ${finished.next.regions.map((r) => r.short_name).join(' & ')}`} ➜
                </Link>
              )}
              {key === 'unlock' && (
                <Link to="../rewards" className="btn ghost">
                  🔓 See my rewards
                </Link>
              )}
            </div>
          </div>
        )}
      </section>
    ),
  }

  return (
    <div className="learn-page lesson">
      <header className="lesson-head">
        <span className="lesson-emoji">{lesson.emoji}</span>
        <div>
          <p className="eyebrow">Stage {lesson.position} of 8</p>
          <h1>{lesson.title}</h1>
          <p className="lead-dark">{lesson.summary}</p>
          {lesson.regions.length > 0 && (
            <p className="lesson-where">
              📍 {lesson.regions.map((r) => `${r.emoji} ${r.short_name}`).join('  ➜  ')}
            </p>
          )}
        </div>
        {lesson.status === 'completed' && <span className="badge-done">✓ Done</span>}
      </header>
      <RegionStops regions={lesson.regions} lang={lang} />
      {lesson.sections.map((s) => sections[s])}
      {lesson.game && !finished && (
        <p className="hint center">
          After the quiz: {lesson.game.emoji} <Link to={`../games/${lesson.game.key}`}>{lesson.game.title}</Link>
        </p>
      )}
    </div>
  )
}

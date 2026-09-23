import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api, type GameSummary, type Lesson as LessonT, type LessonSummary, type Question } from '../../api'
import { confetti, sfx } from '../../fun'
import { GamePlayer } from '../../games/GamePlayer'
import { stopSpeaking, useLearn } from '../../learn/LearnContext'
import { QuestionRunner } from '../../learn/QuestionRunner'
import { LessonRoad } from '../../learn/LessonRoad'
import { RegionStops } from '../../learn/RegionMap'
import { Storyboard } from '../../learn/Storyboard'
import { TapCards } from '../../learn/TapCards'
import { TalkingAvatar } from '../../components/TalkingAvatar'
import { avatarEmoji } from '../../content'

type Step = 'watch' | 'practice' | 'discover' | 'quiz' | 'done'
const STEP_INFO: Record<Step, { icon: string; label: string }> = {
  watch: { icon: '🎬', label: 'Watch' },
  practice: { icon: '🎮', label: 'Practice' },
  discover: { icon: '📍', label: 'Discover' },
  quiz: { icon: '❓', label: 'Quiz' },
  done: { icon: '🏆', label: 'Done' },
}

/**
 * One stage of Learn & Play, as a guided flow:
 *   🎬 watch the rug-making video → 🎮 practise right away with the game →
 *   📍 discover the region & details → ❓ quiz → 🏆 done.
 * Lessons without their own game practise with the quiz instead.
 */
export default function Lesson() {
  const { key = '' } = useParams()
  const { childId, exp, celebrate, setFocus } = useLearn()
  const [lesson, setLesson] = useState<LessonT | null>(null)
  const [game, setGame] = useState<GameSummary | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState<Step>('watch')
  const [watched, setWatched] = useState(false)
  const [practised, setPractised] = useState(false)
  const [quiz, setQuiz] = useState<Question[] | null>(null)
  const [quizDone, setQuizDone] = useState(false)
  const [next, setNext] = useState<LessonSummary | null>(null)
  const lang = exp.child.language ?? 'en'

  useEffect(() => {
    setLesson(null)
    setGame(null)
    setStep('watch')
    setQuiz(null)
    setQuizDone(false)
    setNext(null)
    api.lesson(childId, key).then((l) => {
      setLesson(l)
      setWatched(l.video_watched)
      if (l.game) api.games(childId).then((gs) => {
        const g = gs.find((x) => x.key === l.game!.key) ?? null
        setGame(g)
        setPractised(!!g?.completed)
      })
    }, (e) => setError(e.message))
    return () => {
      stopSpeaking()
      setFocus({})
    }
  }, [childId, key, setFocus])

  // The assistant knows where the child is (and which game they are practising).
  useEffect(() => {
    setFocus(step === 'practice' && lesson?.game ? { lessonId: key, gameKey: lesson.game.key } : { lessonId: key })
  }, [step, key, lesson?.game, setFocus])

  const onWatched = useCallback(() => {
    setWatched(true)
    api.videoWatched(childId, key).then((r) => celebrate(r.award), () => undefined)
  }, [childId, key, celebrate])

  const loadQuiz = useCallback(() => {
    if (!quiz) api.quiz(childId, key).then(setQuiz)
  }, [childId, key, quiz])

  if (error) return <p className="error">{error} <Link to="../learn">Back</Link></p>
  if (!lesson) return <p className="loading-dark">…</p>

  const hasGame = !!lesson.game
  const steps: Step[] = ['watch', 'practice', 'discover', ...(hasGame && lesson.has_quiz ? (['quiz'] as Step[]) : []), 'done']
  const at = steps.indexOf(step)
  const go = (s: Step) => {
    sfx.whoosh()
    setStep(s)
    if (s === 'quiz' || (s === 'practice' && !hasGame)) loadQuiz()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  const nextStep = () => go(steps[Math.min(at + 1, steps.length - 1)])

  const complete = async () => {
    const res = await api.completeLesson(childId, key)
    celebrate(res.award)
    setNext(res.next_lesson)
    sfx.yay()
    confetti()
    go('done')
  }

  // A step is "reached" once everything before it is done (kids can go back freely).
  const reached = (s: Step) => {
    const i = steps.indexOf(s)
    if (i <= at) return true
    if (i >= 1 && !watched) return false
    if (i >= 2 && !practised) return false
    return lesson.status === 'completed'
  }

  const NextBar = ({ ready, label, hint }: { ready: boolean; label: string; hint?: string }) => (
    <div className="flow-next">
      {!ready && hint && <span className="hint">{hint}</span>}
      <button className={`btn primary big${ready ? ' ready-bounce' : ''}`} onClick={nextStep} disabled={!ready}>
        {label} ➜
      </button>
      {!ready && (
        <button className="linklike small-skip" onClick={nextStep}>
          skip for now
        </button>
      )}
    </div>
  )

  const quizFinished = () => {
    setQuizDone(true)
    setPractised(true)
  }

  return (
    <div className="learn-page lesson">
      <header className="lesson-head">
        <span className="lesson-emoji">{lesson.emoji}</span>
        <div>
          <p className="eyebrow">Stage {lesson.position} of 8</p>
          <h1>{lesson.title}</h1>
          {lesson.regions.length > 0 && (
            <p className="lesson-where">📍 {lesson.regions.map((r) => `${r.emoji} ${r.short_name}`).join('  ➜  ')}</p>
          )}
        </div>
        {lesson.status === 'completed' && <span className="badge-done">✓ Done</span>}
      </header>

      <LessonRoad
        stops={steps.map((s) => ({ key: s, icon: STEP_INFO[s].icon, label: s === 'practice' && !hasGame ? 'Practice quiz' : STEP_INFO[s].label }))}
        at={at}
        reached={(s) => reached(s as Step)}
        onGo={(s) => go(s as Step)}
        avatar={avatarEmoji(exp.child.avatar_key) || exp.theme.guide.emoji}
      />

      {step === 'watch' && (
        <section className="card flow-card">
          <h2>🎬 Watch how it's made</h2>
          <p className="lead-dark">{lesson.summary}</p>
          <Storyboard frames={lesson.storyboard} videoUrl={lesson.video_url} lang={lang} autoNarrate={lesson.learning_style === 'listen'} onWatched={onWatched} />
          <NextBar ready={watched} label={hasGame ? `Practice now: ${lesson.game!.title}` : 'Practice now'} hint="▶ Watch the video to start practising" />
        </section>
      )}

      {step === 'practice' && (
        <section className="card flow-card">
          <h2>🎮 Your turn to practise!</h2>
          {hasGame ? (
            <GamePlayer
              gameKey={lesson.game!.key}
              onFinished={() => setPractised(true)}
              actions={
                <button className="btn primary" onClick={nextStep}>
                  Keep exploring ➜
                </button>
              }
            />
          ) : quizDone ? (
            <p className="good">✅ Great practice!</p>
          ) : quiz ? (
            <QuestionRunner questions={quiz} allowRetry onFinish={quizFinished} />
          ) : (
            <p className="loading-dark">…</p>
          )}
          {game?.completed && <p className="hint center">⭐ You already won this game. Play again for fun, or keep exploring!</p>}
          <NextBar ready={practised} label="Keep exploring" hint="Finish the practice to continue" />
        </section>
      )}

      {step === 'discover' && (
        <>
          <RegionStops regions={lesson.regions} lang={lang} />
          {(lesson.learning_style === 'do' ? ['cards', 'explain'] : ['explain', 'cards']).map((part) =>
            part === 'explain' ? (
              <section className="card glass-panel" key="explain">
                <div className="card-head">
                  <h2>📖 Let’s learn more</h2>
                  <TalkingAvatar
                    say={[...lesson.explain, lesson.analogy].filter(Boolean).join(' ')}
                    lang={lang}
                    avatarEmoji={avatarEmoji(exp.child.avatar_key) || exp.theme.guide.emoji}
                    guideName={exp.theme.guide.name}
                    size={56}
                    autoPlay={lesson.learning_style === 'listen'}
                    layout="compact"
                  />
                </div>
                <ul className={`explain level-${lesson.reading_level}`}>
                  {lesson.explain.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
                <p className="analogy">{lesson.analogy}</p>
              </section>
            ) : (
              <section className="card" key="cards">
                <h2>✋ Tap to discover</h2>
                <TapCards cards={lesson.cards} />
              </section>
            ),
          )}
          <section className="card flow-card">
            {steps.includes('quiz') ? (
              <NextBar ready label="Quick quiz" />
            ) : (
              <div className="flow-next">
                <button className="btn primary big ready-bounce" onClick={complete}>
                  ✅ I finished this stage!
                </button>
              </div>
            )}
          </section>
        </>
      )}

      {step === 'quiz' && (
        <section className="card flow-card">
          <h2>❓ Quick quiz</h2>
          {quizDone ? (
            <div className="flow-next">
              <p className="good">🎉 Quiz done!</p>
              <button className="btn primary big ready-bounce" onClick={complete}>
                ✅ I finished this stage!
              </button>
            </div>
          ) : quiz ? (
            <QuestionRunner questions={quiz} allowRetry onFinish={() => setQuizDone(true)} />
          ) : (
            <p className="loading-dark">…</p>
          )}
        </section>
      )}

      {step === 'done' && (
        <section className="card flow-card lesson-finish">
          <div className="big-emoji">🏆</div>
          <h2>
            {exp.theme.vocab.cheer}! Stage {lesson.position} complete
          </h2>
          <div className="btn-row">
            {next && next.key !== key ? (
              <Link to={`../learn/${next.key}`} className="btn primary big">
                Next: {next.emoji} {next.title}
                {next.regions.length > 0 && ` · ✈️ ${next.regions.map((r) => r.short_name).join(' & ')}`} ➜
              </Link>
            ) : (
              <Link to="../studio" className="btn primary big">
                🧶 Create a rug
              </Link>
            )}
            <Link to="../learn" className="btn ghost">
              🗺️ My journey
            </Link>
            {key === 'unlock' && (
              <Link to="../rewards" className="btn ghost">
                🔓 See my rewards
              </Link>
            )}
          </div>
        </section>
      )}
    </div>
  )
}

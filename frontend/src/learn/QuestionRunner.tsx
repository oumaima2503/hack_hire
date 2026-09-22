import { useEffect, useRef, useState } from 'react'
import { api, type AnswerResult, type Question } from '../api'
import { confettiFrom, sfx } from '../fun'
import { useLearn } from './LearnContext'

/**
 * Plays a list of questions one by one. Each answer is checked by the server
 * (answers are never sent to the browser). `allowRetry` gives hints and
 * another try; otherwise one shot per question (challenge mode).
 */
export function QuestionRunner({
  questions,
  allowRetry,
  timerSeconds,
  style = 'quiz',
  onFinish,
}: {
  questions: { id: string; prompt: string; options: string[] }[]
  allowRetry: boolean
  timerSeconds?: number | null
  style?: 'quiz' | 'material' | 'challenge'
  onFinish: (answers: Record<string, string>, correctCount: number) => void
}) {
  const { childId, celebrate, setFocus, focus, exp } = useLearn()
  const [index, setIndex] = useState(0)
  const [result, setResult] = useState<(AnswerResult & { choice: string }) | null>(null)
  const [tried, setTried] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const [left, setLeft] = useState<number | null>(timerSeconds ?? null)
  const answers = useRef<Record<string, string>>({})
  const correct = useRef(0)
  const q: Question | undefined = questions[index]
  const settled = !!result && (result.correct || !allowRetry || !!result.correct_answer)

  // Let the assistant know which question is on screen (it gives hints, not answers).
  useEffect(() => {
    if (q) setFocus({ ...focus, questionId: q.id })
    return () => setFocus({ ...focus, questionId: undefined })
  }, [q?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setLeft(timerSeconds ?? null)
  }, [index, timerSeconds])

  useEffect(() => {
    if (left === null || settled) return
    if (left <= 0) {
      sfx.boing()
      answers.current[q!.id] ??= ''
      setResult({ correct: false, explanation: null, hint: '⏰ Time’s up!', correct_answer: null, award: null, choice: '' })
      return
    }
    const id = setTimeout(() => setLeft((s) => (s === null ? s : s - 1)), 1000)
    return () => clearTimeout(id)
  }, [left, settled, q])

  if (!q) return null

  const choose = async (choice: string, el: HTMLElement) => {
    if (busy || settled || tried.includes(choice)) return
    setBusy(true)
    try {
      const res = await api.answer(childId, q.id, choice)
      if (res.correct) {
        if (!res.award) sfx.yay() // with points, <Celebrate> plays it

        confettiFrom(el, [exp.theme.vocab.point_emoji, '✨', exp.theme.guide.emoji])
      } else sfx.oops()
      if (!(q.id in answers.current)) answers.current[q.id] = choice // first try counts for scoring
      if (res.correct) {
        answers.current[q.id] = allowRetry ? choice : answers.current[q.id]
        correct.current += 1
      }
      setResult({ ...res, choice })
      setTried((t) => [...t, choice])
      celebrate(res.award)
    } finally {
      setBusy(false)
    }
  }

  const next = () => {
    setResult(null)
    setTried([])
    if (index + 1 < questions.length) setIndex(index + 1)
    else onFinish(answers.current, correct.current)
  }

  return (
    <div className={`qrunner qrunner-${style}`}>
      <div className="qrunner-top">
        <span className="eyebrow">
          Question {index + 1} / {questions.length}
        </span>
        {left !== null && !settled && (
          <span className={`timer${left <= 5 ? ' low' : ''}`} aria-live="off">
            ⏱ {left}s
          </span>
        )}
      </div>
      <p className="qrunner-prompt">{q.prompt}</p>
      <div className="qrunner-options">
        {q.options.map((o) => {
          const picked = tried.includes(o)
          const cls = picked ? (result?.choice === o && result.correct ? ' right' : ' wrong') : result?.correct_answer === o ? ' reveal' : ''
          return (
            <button key={o} className={`option${cls}`} onClick={(e) => choose(o, e.currentTarget)} disabled={busy || settled || picked}>
              {o}
            </button>
          )
        })}
      </div>
      <div className="qrunner-feedback" aria-live="polite">
        {result?.correct && (
          <p className="good">
            {exp.theme.vocab.point_emoji} {exp.theme.vocab.cheer}! {result.explanation}
          </p>
        )}
        {result && !result.correct && (
          <p className="soft">
            {result.hint ? `💡 ${result.hint}` : '💪 Not quite!'}
            {result.correct_answer && <> The answer is <strong>{result.correct_answer}</strong>.</>}
            {!settled && ' Try again!'}
          </p>
        )}
      </div>
      {settled && (
        <button className="btn primary" onClick={next} autoFocus>
          {index + 1 < questions.length ? 'Next ➜' : 'Finish ✓'}
        </button>
      )}
    </div>
  )
}

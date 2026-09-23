import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type MutableRefObject, type ReactNode } from 'react'
import { api, type GameConfig, type GameResult } from '../api'
import { useCompanion, type CompanionState } from '../companion/Companion'
import { SpeechRecognitionCtor } from '../companion/speech'
import { confetti } from '../fun'
import { useLearn } from '../learn/LearnContext'
import { GuideContext, type GuideApi, type GuideEvent } from './GuideContext'
import { guideText, pick } from './guideText'

export type GuideMode = 'idle' | 'speaking' | 'listening' | 'thinking' | 'hint' | 'celebrating' | 'explaining'

// The companion (the child's 3D animal) is the Guide's body and voice.
const BODY: Record<GuideMode, CompanionState> = {
  idle: 'talking', speaking: 'talking', listening: 'listening', thinking: 'thinking', hint: 'explaining', celebrating: 'celebrating', explaining: 'explaining',
}

/**
 * Wraps an existing game: provides the Guide API to the game and shows the Guide's
 * tools (hint, ask, talk, how to play). The companion explains, hints, answers and
 * encourages; it never plays, scores or changes the game.
 */
export function GuideLayer({
  game,
  result,
  onHowToPlay,
  children,
}: {
  game: GameConfig
  result: GameResult | null
  onHowToPlay: () => void
  children: ReactNode
}) {
  const stateRef = useRef<Record<string, unknown>>({})
  const [questionId, setQuestion] = useState<string | undefined>()
  const [event, setEvent] = useState<{ e: GuideEvent; n: number } | null>(null)
  const guideApi = useMemo<GuideApi>(
    () => ({
      report: (e) => setEvent((p) => ({ e, n: (p?.n ?? 0) + 1 })),
      setState: (s) => {
        stateRef.current = { ...stateRef.current, ...s }
      },
      setQuestion,
    }),
    [],
  )
  return (
    <GuideContext.Provider value={guideApi}>
      {children}
      <GuideBuddy game={game} event={event} stateRef={stateRef} questionId={questionId} result={result} onHowToPlay={onHowToPlay} />
    </GuideContext.Provider>
  )
}

function GuideBuddy({
  game,
  event,
  stateRef,
  questionId,
  result,
  onHowToPlay,
}: {
  game: GameConfig
  event: { e: GuideEvent; n: number } | null
  stateRef: MutableRefObject<Record<string, unknown>>
  questionId: string | undefined
  result: GameResult | null
  onHowToPlay: () => void
}) {
  const { childId, exp } = useLearn()
  const companion = useCompanion()
  const prefs = exp.guide
  const tx = guideText(prefs.language)
  const support = prefs.support[game.type] ?? 'normal'
  const offerAfter = support === 'extra' ? 1 : support === 'light' ? 3 : 2

  const [offer, setOffer] = useState(false)
  const [hintLevel, setHintLevel] = useState(1)
  const [askOpen, setAskOpen] = useState(false)
  const [text, setText] = useState('')
  const counters = useRef({ mistakes: 0, streak: 0, hints: 0, lastCheer: 0 })

  const say = useCallback(
    (message: string, next: GuideMode, opts: { voice?: boolean; sticky?: boolean } = {}) =>
      companion.say(message, {
        state: BODY[next],
        voice: opts.voice || undefined,
        sticky: opts.sticky,
        tone: next === 'hint' ? 'hint' : next === 'celebrating' ? 'cheer' : undefined,
      }),
    [companion.say], // eslint-disable-line react-hooks/exhaustive-deps
  )

  // When the child talks to the companion during the game, it knows the game, question and progress.
  useEffect(() => {
    companion.setChatContext(() => ({
      gameKey: game.key,
      questionId,
      gameState: { mistakes: counters.current.mistakes, hints: counters.current.hints },
    }))
    return () => companion.setChatContext(null)
  }, [game.key, questionId]) // eslint-disable-line react-hooks/exhaustive-deps

  // A short, non-intrusive hello when the game opens.
  useEffect(() => {
    const id = window.setTimeout(() => say(pick(tx.idle), 'idle'), 1200)
    return () => window.clearTimeout(id)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // New question → fresh hints.
  useEffect(() => {
    setHintLevel(1)
    setOffer(false)
    counters.current.streak = 0
  }, [questionId])

  const requestHint = useCallback(
    async (level: number) => {
      companion.say(tx.thinking, { state: 'thinking', voice: false, sticky: true })
      try {
        const h = await api.hint(childId, game.key, level, stateRef.current, questionId)
        counters.current.hints += 1
        setHintLevel(Math.min(3, level + 1))
        setOffer(false)
        say(h.text, 'hint', { sticky: true })
      } catch (e) {
        say(e instanceof Error ? e.message : tx.almost[0], 'explaining')
      }
    },
    [childId, game.key, questionId, say, stateRef, tx], // eslint-disable-line react-hooks/exhaustive-deps
  )

  // React to what the game reports (mistakes / successes), adapting to support level.
  useEffect(() => {
    if (!event) return
    const c = counters.current
    if (event.e.type === 'mistake') {
      c.mistakes += 1
      c.streak += 1
      if (c.streak >= 3) {
        say(tx.simpler, 'explaining', { sticky: true })
        if (support !== 'light') requestHint(Math.max(2, hintLevel))
      } else {
        say(pick(tx.almost), 'explaining')
        if (c.streak >= offerAfter) setOffer(true)
      }
    } else {
      c.streak = 0
      setOffer(false)
      const now = Date.now()
      if (now - c.lastCheer > 1500) {
        c.lastCheer = now
        say(pick(tx.success), 'celebrating')
      }
    }
  }, [event]) // eslint-disable-line react-hooks/exhaustive-deps

  // Celebrate the end of the game (the game engine decided the result, not the Guide).
  useEffect(() => {
    if (!result) return
    if (result.passed) {
      say(game.type === 'create_rug' ? tx.rug_saved : tx.finished, 'celebrating')
      confetti(undefined, undefined, ['🧶', '⭐', '🎉'])
    } else say(pick(tx.almost), 'explaining')
  }, [result]) // eslint-disable-line react-hooks/exhaustive-deps

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const m = text.trim()
    if (!m) return
    setText('')
    companion.ask(m)
  }

  return (
    <aside className="guide" aria-label="MyRugy Guide">
      {askOpen && (
        <form className="guide-ask" onSubmit={submit}>
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder={tx.type_q} maxLength={300} dir="auto" aria-label={tx.type_q} />
          <button className="btn primary small" disabled={!text.trim()}>
            {tx.send}
          </button>
        </form>
      )}

      <div className="guide-actions">
        <button className={`guide-btn${offer ? ' glow' : ''}`} onClick={() => requestHint(hintLevel)}>
          💡 {hintLevel === 1 ? tx.need_hint : tx.more_help}
        </button>
        <button className="guide-btn" onClick={() => setAskOpen((o) => !o)} aria-expanded={askOpen}>
          💬 {tx.ask}
        </button>
        {SpeechRecognitionCtor && (
          <button className={`guide-btn${companion.state === 'listening' ? ' live' : ''}`} onClick={companion.listen} aria-label={tx.talk} title={tx.talk}>
            🎤
          </button>
        )}
        <button className="guide-btn" onClick={onHowToPlay} aria-label={tx.how_to_play} title={tx.how_to_play}>
          ❔
        </button>
      </div>
      {offer && <p className="guide-offer">{tx.offer_hint}</p>}
    </aside>
  )
}

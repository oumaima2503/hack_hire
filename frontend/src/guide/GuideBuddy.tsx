import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type MutableRefObject, type ReactNode } from 'react'
import { api, type GameConfig, type GameResult } from '../api'
import { Rugy, type Mood } from '../components/Rugy'
import { confetti, sfx, speak } from '../fun'
import { useLearn } from '../learn/LearnContext'
import { GuideContext, type GuideApi, type GuideEvent } from './GuideContext'
import { guideText, pick } from './guideText'

export type GuideMode = 'idle' | 'speaking' | 'listening' | 'thinking' | 'hint' | 'celebrating' | 'explaining'

const MOOD: Record<GuideMode, Mood> = {
  idle: 'happy', speaking: 'happy', listening: 'think', thinking: 'think', hint: 'happy', celebrating: 'wow', explaining: 'happy',
}
const SPEECH_LANG: Record<string, string> = { en: 'en-GB', fr: 'fr-FR', ar: 'ar-MA' }

type Recognition = {
  lang: string
  interimResults: boolean
  maxAlternatives: number
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null
  onerror: (() => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
}
const SpeechRecognitionCtor: (new () => Recognition) | undefined =
  typeof window !== 'undefined'
    ? ((window as unknown as { SpeechRecognition?: new () => Recognition }).SpeechRecognition ??
      (window as unknown as { webkitSpeechRecognition?: new () => Recognition }).webkitSpeechRecognition)
    : undefined

/**
 * Wraps an existing game: provides the Guide API to the game and renders the
 * MyRugy Guide at the edge of the screen. The Guide explains, hints, answers and
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
  const { childId, exp, focus } = useLearn()
  const prefs = exp.guide
  const lang = prefs.language
  const tx = guideText(lang)
  const support = prefs.support[game.type] ?? 'normal'
  const offerAfter = support === 'extra' ? 1 : support === 'light' ? 3 : 2

  const [mode, setMode] = useState<GuideMode>('idle')
  const [bubble, setBubble] = useState<string | null>(null)
  const [offer, setOffer] = useState(false)
  const [hintLevel, setHintLevel] = useState(1)
  const [askOpen, setAskOpen] = useState(false)
  const [text, setText] = useState('')
  const counters = useRef({ mistakes: 0, streak: 0, hints: 0, lastCheer: 0 })
  const clearTimer = useRef<number>()
  const recognition = useRef<Recognition | null>(null)

  const say = useCallback(
    (message: string, next: GuideMode, opts: { voice?: boolean; sticky?: boolean } = {}) => {
      setBubble(message)
      setMode(next)
      if (opts.voice || prefs.auto_speak) speak(message, lang)
      window.clearTimeout(clearTimer.current)
      if (!opts.sticky)
        clearTimer.current = window.setTimeout(() => {
          setBubble(null)
          setMode('idle')
        }, 7000)
    },
    [lang, prefs.auto_speak],
  )

  // A short, non-intrusive hello when the game opens.
  useEffect(() => {
    const id = window.setTimeout(() => say(pick(tx.idle), 'idle'), 1200)
    return () => {
      window.clearTimeout(id)
      window.clearTimeout(clearTimer.current)
      recognition.current?.stop()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // New question → fresh hints.
  useEffect(() => {
    setHintLevel(1)
    setOffer(false)
    counters.current.streak = 0
  }, [questionId])

  const requestHint = useCallback(
    async (level: number) => {
      setMode('thinking')
      setBubble(tx.thinking)
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
    [childId, game.key, questionId, say, stateRef, tx],
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

  const ask = async (message: string, viaVoice = false) => {
    const m = message.trim()
    if (!m) return
    setText('')
    setMode('thinking')
    setBubble(tx.thinking)
    try {
      const res = await api.chat({
        childId,
        message: m,
        lessonId: focus.lessonId,
        gameKey: game.key,
        questionId,
        gameState: { mistakes: counters.current.mistakes, hints: counters.current.hints },
      })
      say(res.reply, 'speaking', { voice: viaVoice, sticky: true })
    } catch (e) {
      say(e instanceof Error ? e.message : '…', 'explaining')
    }
  }

  const listen = () => {
    if (!SpeechRecognitionCtor) {
      say(tx.voice_off, 'explaining')
      return
    }
    sfx.pop()
    const r = new SpeechRecognitionCtor()
    recognition.current = r
    r.lang = SPEECH_LANG[lang] ?? 'en-GB'
    r.interimResults = false
    r.maxAlternatives = 1
    r.onresult = (e) => ask(e.results[0][0].transcript, true)
    r.onerror = () => setMode('idle')
    r.onend = () => setMode((m) => (m === 'listening' ? 'idle' : m))
    setAskOpen(true)
    setMode('listening')
    setBubble(tx.listening)
    r.start()
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    ask(text)
  }

  return (
    <aside className={`guide guide-${mode}`} aria-label="MyRugy Guide">
      <div className="guide-body">
        <button className="guide-avatar" onClick={() => (bubble ? speak(bubble, lang) : say(pick(tx.idle), 'idle'))} aria-label="MyRugy">
          <Rugy size={54} mood={MOOD[mode]} />
          {mode === 'listening' && <span className="guide-badge">🎤</span>}
          {mode === 'thinking' && <span className="guide-badge dots">•••</span>}
          {mode === 'celebrating' && <span className="guide-badge">🎉</span>}
          {mode === 'idle' && <span className="guide-wave">👋</span>}
        </button>
        {bubble && (
          <p className="guide-bubble" dir="auto" lang={lang} role="status">
            {bubble}
            <button className="guide-mini" onClick={() => speak(bubble, lang)} aria-label="Read aloud">
              🔊
            </button>
          </p>
        )}
      </div>

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
          <button className={`guide-btn${mode === 'listening' ? ' live' : ''}`} onClick={listen} aria-label={tx.talk} title={tx.talk}>
            🎤
          </button>
        )}
        <button className="guide-btn" onClick={onHowToPlay} aria-label={tx.how_to_play} title={tx.how_to_play}>
          ❔
        </button>
      </div>
      {offer && !bubble && <p className="guide-offer">{tx.offer_hint}</p>}
    </aside>
  )
}

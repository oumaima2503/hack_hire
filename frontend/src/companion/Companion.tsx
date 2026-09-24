import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useLocation } from 'react-router-dom'
import { api } from '../api'
import { avatarEmoji } from '../content'
import { hasVoiceFor, sfx, soundOn, speak, stopSpeaking } from '../fun'
import { useLearn } from '../learn/LearnContext'
import { Companion3D, toSpecies, type CompanionState } from './Companion3D'
import { companionText, pageFromPath } from './companionText'
import { usePage } from './PageContext'
import { playVoice, stopVoice, unlockAudioOnFirstGesture } from './voice'
import { SPEECH_LANG, SpeechRecognitionCtor, type Recognition } from './speech'

export type { CompanionState } from './Companion3D'

export interface SayOptions {
  state?: CompanionState
  /** true = always speak aloud, false = never, undefined = follow the child's guide preferences. */
  voice?: boolean
  /** Keep the bubble up for a long time (answers, hints). */
  sticky?: boolean
  tone?: 'hint' | 'cheer'
  /** What the child said (shown above the answer). */
  heard?: string
  /** Keep the "write to me" box open under the bubble. */
  keepTyping?: boolean
  /** A stored AI answer: spoken with the Gemini voice (browser voice as fallback). */
  messageId?: string
  /** Voice the first sentence separately so it starts sooner (uses 2 voice requests). */
  voiceSplit?: boolean
}
/** Extra context a game can give the companion (read-only: it never changes the game). */
export interface ChatContext {
  gameKey?: string
  questionId?: string
  gameState?: { mistakes: number; hints: number; note?: string }
}

export interface CompanionApi {
  name: string
  emoji: string
  state: CompanionState
  /** Increments after every AI answer (lets the conversation page refresh). */
  exchanges: number
  say: (text: string, opts?: SayOptions) => void
  act: (state: CompanionState, ms?: number) => void
  listen: () => void
  ask: (text: string) => Promise<string | null>
  hush: () => void
  setChatContext: (fn: (() => ChatContext) | null) => void
}

const noop = () => undefined
const CompanionContext = createContext<CompanionApi>({
  name: 'MyRugy', emoji: '🧶', state: 'idle', exchanges: 0,
  say: noop, act: noop, listen: noop, ask: async () => null, hush: noop, setChatContext: noop,
})
export const useCompanion = () => useContext(CompanionContext)

type Bubble =
  | { kind: 'say'; text: string; tone?: 'hint' | 'cheer'; heard?: string; sticky?: boolean; messageId?: string }
  | { kind: 'listen' }
  | { kind: 'thinking'; text: string; heard: string }

const pick = <T,>(xs: T[]) => xs[Math.floor(Math.random() * xs.length)]
const reducedMotion = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
const WALK_SPEED = 190 // px per second

/**
 * The child's companion: their onboarding animal as a full-body 3D character that
 * travels across the app, listens (tap → microphone), asks the AI tutor and
 * answers out loud. It floats above everything and never touches game logic.
 */
export function CompanionProvider({ children }: { children: ReactNode }) {
  const { childId, exp, focus } = useLearn()
  const loc = useLocation()
  const lang = exp.child.language ?? 'en'
  const tx = companionText(lang)
  const name = exp.theme.guide.name
  const emoji = avatarEmoji(exp.child.avatar_key)
  const page = pageFromPath(loc.pathname)
  const inGame = !!focus.gameKey
  const pageCtx = usePage()

  const [state, setStateRaw] = useState<CompanionState>('idle')
  const [bubble, setBubble] = useState<Bubble | null>(null)
  const bubbleRef = useRef<Bubble | null>(null)
  bubbleRef.current = bubble
  const [heard, setHeard] = useState('')
  const [typing, setTyping] = useState(false)
  const [writing, setWriting] = useState(false)
  const [voiceLoading, setVoiceLoading] = useState(false)
  const [voiceMissing, setVoiceMissing] = useState(false)
  const sayToken = useRef(0) // cancels a pending voice when something newer happens
  const inputRef = useRef<HTMLInputElement>(null)
  const recCancelled = useRef(false)
  const [text, setText] = useState('')
  const [exchanges, setExchanges] = useState(0)
  const [fallback, setFallback] = useState(false)
  const [size, setSize] = useState(190)
  const [side, setSide] = useState<'left' | 'right'>('left')
  const [dragging, setDragging] = useState(false)

  const engine = useRef<Companion3D | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const boxRef = useRef<HTMLDivElement>(null)
  const stateRef = useRef<CompanionState>('idle')
  const pos = useRef({ x: -200, y: -200 })
  const walk = useRef<{ x: number; y: number; then?: () => void } | null>(null)
  const perchIdx = useRef(0)
  const recRef = useRef<Recognition | null>(null)
  const chatCtx = useRef<(() => ChatContext) | null>(null)
  const timers = useRef<{ mode?: number; bubble?: number; speech?: number }>({})
  const sizeRef = useRef(size)
  sizeRef.current = size
  const focusRef = useRef(focus)
  focusRef.current = focus
  const pageRef = useRef(page)
  pageRef.current = page
  // Where the child just put the companion (viewport ratios). It stays there for a while,
  // then goes back to exploring on its own.
  const PLACED_FOR = 40000
  const placed = useRef<{ rx: number; ry: number; until: number } | null>(null)
  const isPlaced = () => !!placed.current && Date.now() < placed.current.until
  const drag = useRef<{ sx: number; sy: number; ox: number; oy: number; lastX: number; moved: boolean } | null>(null)

  const setMode = useCallback((s: CompanionState) => {
    stateRef.current = s
    engine.current?.setState(s)
    setStateRaw(s)
  }, [])

  const clear = (k: keyof typeof timers.current) => {
    window.clearTimeout(timers.current[k])
    timers.current[k] = undefined
  }

  // ───────────── where the companion can stand (feet position, viewport px) ─────────────
  const clampSpot = useCallback((x: number, y: number) => {
    const S = sizeRef.current
    return {
      x: Math.min(window.innerWidth - S * 0.3, Math.max(S * 0.3, x)),
      y: Math.min(window.innerHeight + S * 0.05, Math.max(S * 0.75, y)),
    }
  }, [])

  const perches = useCallback(() => {
    const w = window.innerWidth
    const h = window.innerHeight
    const S = sizeRef.current
    if (placed.current && isPlaced()) return [clampSpot(placed.current.rx * w, placed.current.ry * h)]
    const nav = document.querySelector('.learn-nav')?.getBoundingClientRect()
    const head = document.querySelector('.learn-top')?.getBoundingClientRect()
    const sideNav = nav && nav.height > nav.width
    const minX = (sideNav ? nav!.right : 0) + S / 2 + 4
    const maxX = w - S / 2 - 6
    const floor = (!sideNav && nav && nav.top < h ? nav.top : h) - 6
    const top = Math.max((head?.bottom ?? 60) + S, h * 0.35)
    if (focusRef.current.gameKey) {
      const g = document.querySelector('.guide')?.getBoundingClientRect()
      return [{ x: Math.max(S / 2, (g?.left ?? 16) + S / 2 - 16), y: (g?.top ?? floor - 60) + 12 }]
    }
    if (pageRef.current === 'assistant') return [{ x: maxX - 20, y: Math.min(floor, h * 0.62) }]
    return [
      { x: maxX, y: floor },
      { x: maxX, y: Math.max(top, h * 0.58) },
      { x: minX + 10, y: floor },
      { x: (minX + maxX) / 2 + 80, y: floor },
      { x: maxX - 30, y: top },
    ].filter((p) => p.x >= minX - 1)
  }, [clampSpot])

  const place = useCallback(() => {
    const el = boxRef.current
    if (!el) return
    const S = sizeRef.current
    el.style.transform = `translate3d(${pos.current.x - S / 2}px, ${pos.current.y - S}px, 0)`
    const nextSide = pos.current.x > window.innerWidth / 2 ? 'left' : 'right'
    setSide((s) => (s === nextSide ? s : nextSide))
  }, [])

  const walkTo = useCallback(
    (p: { x: number; y: number }, then?: () => void) => {
      if (reducedMotion() || pos.current.x < -100) {
        pos.current = { ...p }
        place()
        then?.()
        return
      }
      walk.current = { ...p, then }
      engine.current?.setFacing(p.x - pos.current.x)
      setMode('walking')
    },
    [place, setMode],
  )

  useEffect(() => unlockAudioOnFirstGesture(), [])

  // ───────────── 3D engine + movement loop ─────────────
  useEffect(() => {
    const small = window.innerWidth < 640
    setSize(inGame ? (small ? 118 : 150) : small ? 140 : 190)
  }, [inGame])

  useEffect(() => {
    if (!canvasRef.current) return
    try {
      engine.current = new Companion3D(canvasRef.current, toSpecies(exp.child.avatar_key), exp.theme.colors.primary)
      engine.current.setState(stateRef.current)
    } catch {
      setFallback(true)
    }
    return () => {
      engine.current?.dispose()
      engine.current = null
    }
  }, [exp.child.avatar_key, exp.theme.colors.primary])

  useEffect(() => {
    engine.current?.resize()
    place()
  }, [size, place])

  useEffect(() => {
    let raf = 0
    let last = performance.now()
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick)
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const target = walk.current
      if (!target) return
      const dx = target.x - pos.current.x
      const dy = target.y - pos.current.y
      const d = Math.hypot(dx, dy)
      const step = WALK_SPEED * dt
      if (d <= step) {
        pos.current = { x: target.x, y: target.y }
        walk.current = null
        if (stateRef.current === 'walking') setMode('idle')
        target.then?.()
      } else {
        pos.current = { x: pos.current.x + (dx / d) * step, y: pos.current.y + (dy / d) * step }
        if (Math.abs(dx) > 2) engine.current?.setFacing(dx)
      }
      place()
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [place, setMode])

  // ───────────── speaking ─────────────
  const say = useCallback(
    (message: string, o: SayOptions = {}) => {
      const token = ++sayToken.current
      stopVoice()
      walk.current = null
      clear('mode')
      clear('bubble')
      clear('speech')
      const st = o.state ?? 'talking'
      setTyping(!!o.keepTyping)
      setVoiceLoading(false)
      setVoiceMissing(false)
      setBubble({ kind: 'say', text: message, tone: o.tone, sticky: o.sticky, heard: o.heard, messageId: o.messageId })
      setMode(st)
      const done = () => {
        if (token !== sayToken.current) return
        clear('speech')
        engine.current?.setSpeaking(false)
        engine.current?.setVoiceLevel(null)
        if (stateRef.current === st) setMode('idle')
        clear('bubble')
        // Never close the bubble while the child is writing in it.
        const close = () => {
          if (inputRef.current && (inputRef.current.value || document.activeElement === inputRef.current)) {
            timers.current.bubble = window.setTimeout(close, 5000)
          } else setBubble(null)
        }
        timers.current.bubble = window.setTimeout(close, o.sticky ? 25000 : 3500)
      }
      const words = message.split(/\s+/).length
      const voiced = o.voice ?? exp.guide.auto_speak
      const browserVoice = () => {
        if (token !== sayToken.current) return
        setVoiceLoading(false)
        // Say so instead of moving the mouth in silence (e.g. no Arabic voice on this device).
        if (voiced && soundOn() && !hasVoiceFor(lang)) setVoiceMissing(true)
        const ok = voiced && speak(message, lang, { onStart: () => engine.current?.setSpeaking(true), onWord: () => engine.current?.syllable(), onEnd: done })
        engine.current?.setSpeaking(true)
        clear('speech')
        // Voice: safety net if it never ends. No voice (sound off): still "talk" while the bubble is read.
        timers.current.speech = window.setTimeout(done, ok ? words * 650 + 4000 : Math.min(9000, Math.max(1400, words * 300)))
      }

      if (o.messageId && voiced && soundOn()) {
        // The Gemini voice: explain with gestures while it is prepared, then talk with the real audio.
        setVoiceLoading(true)
        let settled = false
        timers.current.speech = window.setTimeout(() => {
          settled = true
          browserVoice() // too slow: don't keep the child waiting
        }, 12000)
        // Split: both parts are requested at once, the first sentence plays while the rest is prepared.
        // Otherwise one request for the whole answer (saves the free-tier voice quota).
        const first = api.chatSpeech(childId, o.messageId, o.voiceSplit ? 0 : undefined)
        const rest: Promise<ArrayBuffer | null> = o.voiceSplit ? api.chatSpeech(childId, o.messageId, 1).catch(() => null) : Promise.resolve(null)
        const voiceEvents = (onEnd: () => void) => ({
          onStart: () => engine.current?.setVoiceLevel(0),
          onLevel: (l: number) => engine.current?.setVoiceLevel(l),
          onEnd,
        })
        first
          .then((wav) => {
            if (settled || token !== sayToken.current) return
            settled = true
            clear('speech')
            setVoiceLoading(false)
            if (!wav) return done()
            const playRest = () => {
              if (token !== sayToken.current) return
              rest.then((more) => {
                if (token !== sayToken.current) return
                if (!more) return done()
                playVoice(more, voiceEvents(done)).then((ok) => !ok && done())
              })
            }
            return playVoice(wav, voiceEvents(playRest)).then((ok) => {
              if (!ok) browserVoice()
            })
          })
          .catch(() => {
            if (settled) return
            settled = true
            clear('speech')
            browserVoice()
          })
      } else browserVoice()
    },
    [childId, exp.guide.auto_speak, lang, setMode],
  )

  const act = useCallback(
    (s: CompanionState, ms = 2400) => {
      clear('mode')
      setMode(s)
      timers.current.mode = window.setTimeout(() => stateRef.current === s && setMode('idle'), ms)
    },
    [setMode],
  )

  const hush = useCallback(() => {
    sayToken.current++
    stopVoice()
    setVoiceLoading(false)
    stopSpeaking()
    recRef.current?.abort()
    recRef.current = null
    engine.current?.setSpeaking(false)
    clear('speech')
    setBubble(null)
    setTyping(false)
    if (stateRef.current !== 'walking') setMode('idle')
  }, [setMode])

  // ───────────── asking the AI ─────────────
  const ask = useCallback(
    async (message: string) => {
      const m = message.trim()
      if (!m) return null
      walk.current = null
      setTyping(false)
      setText('')
      setBubble({ kind: 'thinking', text: pick(tx.thinking), heard: m })
      setMode('thinking')
      const f = focusRef.current
      const extra = chatCtx.current?.() ?? {}
      // The page descriptor, only if it belongs to the page on screen (pageFromPath stays the fallback).
      const { current: pd, history } = pageCtx.snapshot()
      const desc = pd && pd.path === window.location.pathname ? pd : null
      try {
        const res = await api.chat({
          childId,
          message: m,
          lessonId: f.lessonId,
          gameKey: extra.gameKey ?? f.gameKey,
          questionId: extra.questionId ?? f.questionId,
          gameState: extra.gameState,
          page: desc?.key ?? pageRef.current,
          pageContext: desc
            ? {
                label: desc.label,
                visibleElements: desc.visibleElements,
                availableActions: desc.availableActions,
                navigation: desc.navigation.map((n) => n.label),
                meta: desc.meta,
                recentPages: history,
              }
            : undefined,
          voice: true,
        })
        setExchanges((n) => n + 1)
        say(res.reply, { state: res.reply.length > 140 ? 'explaining' : 'talking', voice: true, sticky: true, heard: m, keepTyping: true, messageId: res.message_id, voiceSplit: res.voice_split })
        return res.reply
      } catch (e) {
        say(e instanceof Error && e.message ? e.message : tx.error, { state: 'explaining', voice: false, sticky: true, keepTyping: true })
        return null
      }
    },
    [childId, say, setMode, tx, pageCtx],
  )

  // ───────────── listening (tap the companion) ─────────────
  const listen = useCallback(() => {
    if (recRef.current) {
      recRef.current.stop() // second tap = "I'm done talking"
      return
    }
    sayToken.current++
    stopVoice()
    setVoiceLoading(false)
    stopSpeaking()
    engine.current?.setSpeaking(false)
    clear('speech')
    clear('bubble')
    walk.current = null
    setTyping(true) // the child can always write instead of talking
    setWriting(false)
    if (!SpeechRecognitionCtor) {
      setMode('listening')
      setBubble({ kind: 'listen' })
      setWriting(true)
      return
    }
    const r = new SpeechRecognitionCtor()
    r.lang = SPEECH_LANG[lang] ?? 'en-GB'
    r.interimResults = true
    r.continuous = false
    r.maxAlternatives = 1
    let finalText = ''
    let partial = ''
    let failed = ''
    recCancelled.current = false
    r.onresult = (e) => {
      let interim = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i]
        if (res.isFinal) finalText += res[0].transcript
        else interim += res[0].transcript
      }
      partial = (finalText + ' ' + interim).trim()
      setHeard(partial)
    }
    r.onerror = (e) => {
      failed = e.error
    }
    r.onend = () => {
      if (recRef.current === r) recRef.current = null
      if (recCancelled.current) return // the child chose to write instead
      const said = (finalText || partial).trim()
      if (said) ask(said)
      else if (['not-allowed', 'service-not-allowed', 'audio-capture'].includes(failed)) {
        say(tx.mic_blocked, { state: 'explaining', voice: false, sticky: true, keepTyping: true })
        setWriting(true)
      } else if (failed !== 'aborted') say(tx.heard_nothing, { state: 'talking', voice: false, sticky: true, keepTyping: true })
    }
    recRef.current = r
    setHeard('')
    setBubble({ kind: 'listen' })
    setMode('listening')
    sfx.pop()
    try {
      r.start()
    } catch {
      recRef.current = null
      setWriting(true)
    }
  }, [ask, lang, say, setMode, tx])

  /** The child started writing: stop the microphone (without sending what it heard). */
  const startWriting = () => {
    if (recRef.current) {
      recCancelled.current = true
      recRef.current.abort()
      recRef.current = null
      setHeard('')
    }
    if (!writing) setWriting(true)
    clear('bubble')
  }

  const setChatContext = useCallback((fn: (() => ChatContext) | null) => {
    chatCtx.current = fn
  }, [])

  // ───────────── travelling with the child ─────────────
  const firstRoute = useRef(true)
  useEffect(() => {
    const ps = perches()
    if (firstRoute.current) {
      firstRoute.current = false
      perchIdx.current = 0
      pos.current = { x: window.innerWidth + 120, y: ps[0].y }
      place()
      const id = window.setTimeout(() => {
        walkTo(ps[0], () => {
          let greeted = false
          try {
            greeted = !!sessionStorage.getItem(`myrugy_companion_hi_${childId}`)
            sessionStorage.setItem(`myrugy_companion_hi_${childId}`, '1')
          } catch {
            /* ignore */
          }
          act('waving', 2600)
          if (!greeted) {
            setBubble({ kind: 'say', text: tx.hello(exp.child.name, name) })
            timers.current.bubble = window.setTimeout(() => setBubble(null), 7000)
          }
        })
      }, 400)
      return () => window.clearTimeout(id)
    }
    // A new page: walk there with the child (unless busy, or the child placed it somewhere).
    if (isPlaced() || ['listening', 'thinking', 'talking', 'explaining'].includes(stateRef.current)) return
    const id = window.setTimeout(() => {
      const list = perches()
      let i = Math.floor(Math.random() * list.length)
      if (list.length > 1 && i === perchIdx.current) i = (i + 1) % list.length
      perchIdx.current = i
      walkTo(list[i], () => {
        const lines = tx.arrive[pageRef.current]
        act('waving', 1800)
        if (lines && !focusRef.current.gameKey) {
          setBubble({ kind: 'say', text: pick(lines) })
          clear('bubble')
          timers.current.bubble = window.setTimeout(() => setBubble(null), 3800)
        }
      })
    }, 350)
    return () => window.clearTimeout(id)
  }, [loc.pathname, inGame]) // eslint-disable-line react-hooks/exhaustive-deps

  // Wander between spots now and then, like a real companion exploring the page.
  useEffect(() => {
    if (inGame || reducedMotion()) return
    const id = window.setInterval(() => {
      if (document.hidden || isPlaced() || drag.current || stateRef.current !== 'idle' || walk.current || recRef.current || bubbleRef.current) return
      const list = perches()
      if (list.length < 2) return
      let i = Math.floor(Math.random() * list.length)
      if (i === perchIdx.current) i = (i + 1) % list.length
      perchIdx.current = i
      walkTo(list[i], () => Math.random() < 0.35 && act('waving', 1600))
    }, 17000)
    return () => window.clearInterval(id)
  }, [inGame, perches, walkTo, act])

  useEffect(() => {
    const onResize = () => {
      const list = perches()
      pos.current = { ...list[Math.min(perchIdx.current, list.length - 1)] }
      walk.current = null
      engine.current?.resize()
      place()
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [perches, place])

  useEffect(
    () => () => {
      recRef.current?.abort()
      stopSpeaking()
      stopVoice()
      Object.values(timers.current).forEach((t) => window.clearTimeout(t))
    },
    [],
  )

  const api_ = useMemo<CompanionApi>(
    () => ({ name, emoji, state, exchanges, say, act, listen, ask, hush, setChatContext }),
    [name, emoji, state, exchanges, say, act, listen, ask, hush, setChatContext],
  )

  const submit = (e: FormEvent) => {
    e.preventDefault()
    ask(text)
  }

  // ───────────── the child can pick the companion up and move it ─────────────
  const pin = () => {
    placed.current = { rx: pos.current.x / window.innerWidth, ry: pos.current.y / window.innerHeight, until: Date.now() + PLACED_FOR }
  }
  const onPointerDown = (e: PointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0) return
    e.currentTarget.setPointerCapture(e.pointerId)
    drag.current = { sx: e.clientX, sy: e.clientY, ox: pos.current.x, oy: pos.current.y, lastX: e.clientX, moved: false }
  }
  const onPointerMove = (e: PointerEvent<HTMLButtonElement>) => {
    const d = drag.current
    if (!d) return
    const dx = e.clientX - d.sx
    const dy = e.clientY - d.sy
    if (!d.moved) {
      if (Math.hypot(dx, dy) < 8) return
      d.moved = true
      walk.current = null
      setDragging(true)
      setMode('walking') // little legs paddling while being carried
    }
    pos.current = clampSpot(d.ox + dx, d.oy + dy)
    if (Math.abs(e.clientX - d.lastX) > 1) engine.current?.setFacing(e.clientX - d.lastX)
    d.lastX = e.clientX
    place()
  }
  const onPointerUp = (e: PointerEvent<HTMLButtonElement>) => {
    const d = drag.current
    drag.current = null
    if (!d) return
    if (e.type === 'pointercancel') {
      if (d.moved) pin()
    } else if (!d.moved) {
      listen() // a simple tap = talk
      return
    } else pin()
    setDragging(false)
    sfx.pop()
    act('celebrating', 700) // a happy hop on landing
  }
  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    const step = e.shiftKey ? 60 : 24
    const moves: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }
    const m = moves[e.key]
    if (!m) return
    e.preventDefault()
    walk.current = null
    pos.current = clampSpot(pos.current.x + m[0], pos.current.y + m[1])
    if (m[0]) engine.current?.setFacing(m[0])
    place()
    pin()
  }

  const overlay = (
    <div
      ref={boxRef}
      className={`companion companion-${state} bubble-${side}${inGame ? ' in-game' : ''}${dragging ? ' dragging' : ''}`}
      style={{ width: size, height: size, ['--c-accent' as string]: exp.theme.colors.primary }}
      data-testid="companion"
    >
      {fallback ? (
        <span className="companion-fallback" aria-hidden="true">{emoji}</span>
      ) : (
        <canvas ref={canvasRef} className="companion-canvas" aria-hidden="true" />
      )}
      <button
        type="button"
        className="companion-hit"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onClick={(e) => e.detail === 0 && listen() /* keyboard Enter/Space */}
        onKeyDown={onKeyDown}
        aria-label={state === 'listening' ? `${name} is listening. Tap when you are done.` : `Talk to ${name}. Drag or use the arrow keys to move ${name}.`}
        title={tx.tap_me}
      />
      {state === 'listening' && <span className="companion-ring" aria-hidden="true" />}
      {state === 'thinking' && <span className="companion-dots" aria-hidden="true">•••</span>}
      {!bubble && !inGame && state !== 'walking' && !dragging && <span className="companion-tag">🎤 {tx.tap_me}</span>}

      {bubble && (
        <div className={`companion-bubble${bubble.kind === 'say' && bubble.tone ? ` tone-${bubble.tone}` : ''}`} role="status" aria-live="polite" dir="auto" lang={lang}>
          {bubble.kind === 'listen' && (
            <>
              {writing ? (
                <p className="cb-listen writing">
                  <span className="cb-mic">✍️</span> {tx.write_to_me}
                </p>
              ) : (
                <p className="cb-listen">
                  <span className="cb-mic">🎤</span> {tx.listening}
                </p>
              )}
              {heard && !writing && <p className="cb-heard">“{heard}”</p>}
              {!writing && <p className="cb-or">{tx.or_write}</p>}
            </>
          )}
          {bubble.kind === 'thinking' && (
            <>
              <p className="cb-heard">
                {tx.you_said}: “{bubble.heard}”
              </p>
              <p className="cb-think">{bubble.text}</p>
            </>
          )}
          {bubble.kind === 'say' && (
            <>
              {bubble.heard && (
                <p className="cb-heard">
                  {tx.you_said}: “{bubble.heard}”
                </p>
              )}
              <p className="cb-text">{bubble.text}</p>
              {voiceMissing && <p className="cb-voice-missing">{tx.no_voice_lang}</p>}
              {voiceLoading && (
                <p className="cb-voice-loading" aria-live="polite">
                  🔊 <span>•••</span>
                </p>
              )}
              <div className="cb-actions">
                <button type="button" onClick={() => say(bubble.text, { state: 'talking', voice: true, sticky: true, messageId: bubble.messageId })} aria-label="Read aloud">
                  🔊
                </button>
                {bubble.sticky && !typing && (
                  <button type="button" onClick={listen}>
                    🎤 {tx.ask_again}
                  </button>
                )}
                <button type="button" onClick={hush} aria-label="Close">
                  ✕
                </button>
              </div>
            </>
          )}
          {typing && (
            <form className="cb-form" onSubmit={submit}>
              {SpeechRecognitionCtor && (
                <button
                  type="button"
                  className={`cb-mic-btn${state === 'listening' && !writing ? ' live' : ''}`}
                  onClick={listen}
                  aria-label={tx.talk_instead}
                  title={tx.talk_instead}
                >
                  🎤
                </button>
              )}
              <input
                ref={inputRef}
                value={text}
                onChange={(e) => {
                  startWriting()
                  setText(e.target.value)
                }}
                onFocus={startWriting}
                placeholder={tx.type_here}
                maxLength={300}
                dir="auto"
                aria-label={tx.type_here}
                autoFocus={writing}
              />
              <button className="btn primary small" disabled={!text.trim()}>
                {tx.send}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  )

  return (
    <CompanionContext.Provider value={api_}>
      {children}
      {createPortal(overlay, document.body)}
    </CompanionContext.Provider>
  )
}

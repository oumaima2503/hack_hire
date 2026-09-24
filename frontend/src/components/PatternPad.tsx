import { useEffect, useMemo, useState } from 'react'
import { sfx } from '../fun'

/** Keys must match backend/services/pattern_service.py PATTERN_ICONS. */
export const PATTERN_ICONS: { key: string; emoji: string; name: string }[] = [
  { key: 'cat', emoji: '🐱', name: 'cat' },
  { key: 'lion', emoji: '🦁', name: 'lion' },
  { key: 'dino', emoji: '🦖', name: 'dinosaur' },
  { key: 'panda', emoji: '🐼', name: 'panda' },
  { key: 'camel', emoji: '🐪', name: 'camel' },
  { key: 'star', emoji: '⭐', name: 'star' },
  { key: 'moon', emoji: '🌙', name: 'moon' },
  { key: 'rocket', emoji: '🚀', name: 'rocket' },
  { key: 'rainbow', emoji: '🌈', name: 'rainbow' },
  { key: 'apple', emoji: '🍎', name: 'apple' },
  { key: 'orange', emoji: '🍊', name: 'orange' },
  { key: 'car', emoji: '🚗', name: 'car' },
  { key: 'balloon', emoji: '🎈', name: 'balloon' },
  { key: 'unicorn', emoji: '🦄', name: 'unicorn' },
  { key: 'teapot', emoji: '🫖', name: 'Moroccan teapot' },
  { key: 'lantern', emoji: '🏮', name: 'lantern' },
]
export const PATTERN_LENGTH = 4
const EMOJI = Object.fromEntries(PATTERN_ICONS.map((i) => [i.key, i.emoji]))

function shuffled<T>(xs: T[]) {
  const a = [...xs]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/**
 * The secret-pattern mini-game: tap 4 pictures in order. The chosen pictures are
 * only shown while creating; when confirming or entering, slots fill with stars.
 */
export function PatternPad({
  hidden = false,
  shuffle = false,
  disabled = false,
  status = 'idle',
  onComplete,
  undoLabel = 'Undo',
}: {
  hidden?: boolean
  shuffle?: boolean
  disabled?: boolean
  /** error: shake and clear · success: happy bounce */
  status?: 'idle' | 'error' | 'success'
  onComplete: (pattern: string[]) => void
  undoLabel?: string
}) {
  const icons = useMemo(() => (shuffle ? shuffled(PATTERN_ICONS) : PATTERN_ICONS), [shuffle])
  const [picked, setPicked] = useState<string[]>([])

  // A wrong try clears the slots after the shake.
  useEffect(() => {
    if (status !== 'error') return
    const id = window.setTimeout(() => setPicked([]), 600)
    return () => window.clearTimeout(id)
  }, [status])

  const pick = (key: string) => {
    if (disabled || picked.length >= PATTERN_LENGTH) return
    sfx.pop()
    const next = [...picked, key]
    setPicked(next)
    if (next.length === PATTERN_LENGTH) window.setTimeout(() => onComplete(next), 250)
  }

  return (
    <div className={`pattern-pad status-${status}`}>
      <ol className="pattern-slots" aria-label={`${picked.length} of ${PATTERN_LENGTH} pictures chosen`}>
        {Array.from({ length: PATTERN_LENGTH }, (_, i) => (
          <li key={i} className={i < picked.length ? 'filled' : i === picked.length ? 'next' : ''}>
            {i < picked.length ? (hidden ? '⭐' : EMOJI[picked[i]]) : ''}
            {i < PATTERN_LENGTH - 1 && <span className="pattern-arrow" aria-hidden="true">→</span>}
          </li>
        ))}
      </ol>

      <div className="pattern-grid" role="group" aria-label="Pictures">
        {icons.map((icon) => (
          <button key={icon.key} type="button" className="pattern-btn" onClick={() => pick(icon.key)} disabled={disabled} aria-label={icon.name}>
            <span aria-hidden="true">{icon.emoji}</span>
          </button>
        ))}
      </div>

      <div className="pattern-tools">
        <button type="button" className="btn ghost small" onClick={() => setPicked((p) => p.slice(0, -1))} disabled={disabled || !picked.length || picked.length === PATTERN_LENGTH}>
          ↩ {undoLabel}
        </button>
      </div>
    </div>
  )
}

/** Create + confirm a new pattern (end of onboarding, or with a grown-up in the kids' corner). */
export function PatternCreator({
  onDone,
  texts,
}: {
  onDone: (pattern: string[]) => Promise<void>
  texts: { pick: string; confirm: string; ok: string; mismatch: string; tip: string; undo: string; again: string }
}) {
  const [phase, setPhase] = useState<'create' | 'confirm' | 'saving' | 'done'>('create')
  const [first, setFirst] = useState<string[]>([])
  const [status, setStatus] = useState<'idle' | 'error' | 'success'>('idle')
  const [message, setMessage] = useState<string | null>(null)
  const [round, setRound] = useState(0) // remounts the pad for a fresh try

  const restart = (msg: string | null) => {
    setFirst([])
    setPhase('create')
    setMessage(msg)
    setRound((r) => r + 1)
  }

  const created = (p: string[]) => {
    if (new Set(p).size < 2) {
      sfx.oops()
      restart('🎨 ' + texts.pick)
      return
    }
    setFirst(p)
    setStatus('idle')
    setMessage(null)
    setPhase('confirm')
    setRound((r) => r + 1)
  }

  const confirmed = async (p: string[]) => {
    if (p.join('-') !== first.join('-')) {
      sfx.oops()
      setStatus('error')
      window.setTimeout(() => {
        setStatus('idle')
        restart(texts.mismatch)
      }, 700)
      return
    }
    setPhase('saving')
    try {
      await onDone(p)
      sfx.yay()
      setStatus('success')
      setPhase('done')
    } catch (e) {
      sfx.oops()
      restart(e instanceof Error ? e.message : texts.mismatch)
    }
  }

  return (
    <div className="pattern-creator">
      <ol className="pattern-progress" aria-hidden="true">
        <li className={phase === 'create' ? 'now' : 'done'}>1</li>
        <li className={phase === 'confirm' ? 'now' : phase === 'create' ? '' : 'done'}>2</li>
        <li className={phase === 'done' ? 'done' : ''}>✓</li>
      </ol>
      {phase === 'done' ? (
        <p className="pattern-ok">✅ {texts.ok}</p>
      ) : (
        <>
          <p className="pattern-instruction">{phase === 'create' ? texts.pick : texts.confirm}</p>
          {message && <p className="pattern-message">{message}</p>}
          <PatternPad
            key={round}
            hidden={phase !== 'create'}
            status={status}
            disabled={phase === 'saving'}
            onComplete={phase === 'create' ? created : confirmed}
            undoLabel={texts.undo}
          />
          <p className="pattern-tip">{texts.tip}</p>
        </>
      )}
    </div>
  )
}

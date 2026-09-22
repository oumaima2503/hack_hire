import { useState, type CSSProperties } from 'react'
import { confettiFrom, sfx } from '../fun'

/**
 * Living, tappable background for each world: fish swim, planets turn, dinosaurs
 * stomp by… Tap a creature and it reacts (zooms off, jumps, pops, hatches…).
 * Purely decorative: it sits behind the content and never blocks it.
 */

type Path =
  | 'swim-lr' | 'swim-rl' | 'fly-lr' | 'fly-rl' | 'walk-lr' | 'walk-rl'
  | 'float' | 'rise' | 'orbit' | 'spin' | 'shoot' | 'sway' | 'still' | 'flutter'
type Fx = 'zoom' | 'jump' | 'spin' | 'pop' | 'burst' | 'hatch' | 'swap' | 'wiggle' | 'flip'

interface Mover {
  e: string // emoji
  path: Path
  fx: Fx
  top?: string
  left?: string
  bottom?: string
  size?: number
  dur?: number // seconds for one trip
  delay?: number
  flip?: boolean // mirror the emoji (face the direction of travel)
  cycle?: string[] // for 'hatch' / 'swap'
  burst?: string[] // confetti emojis on tap
  r?: number // orbit radius
  sound?: keyof typeof sfx
}

const SCENES: Record<string, { ground?: string; movers: Mover[] }> = {
  space: {
    movers: [
      { e: '🪐', path: 'spin', fx: 'spin', top: '12%', left: '84%', size: 76, dur: 40, burst: ['🪐', '✨'] },
      { e: '🛰️', path: 'orbit', fx: 'zoom', top: '15%', left: '87%', size: 26, dur: 14, r: 78 },
      { e: '🌍', path: 'spin', fx: 'spin', top: '72%', left: '4%', size: 58, dur: 60, burst: ['🌍', '💙'] },
      { e: '🌕', path: 'float', fx: 'wiggle', top: '70%', left: '90%', size: 42, dur: 6, burst: ['🌕', '🧀'] },
      { e: '🚀', path: 'fly-lr', fx: 'zoom', top: '38%', size: 44, dur: 24, delay: 2, burst: ['🔥', '💨'], sound: 'whoosh' },
      { e: '🛸', path: 'fly-rl', fx: 'swap', top: '24%', size: 44, dur: 32, delay: 9, cycle: ['🛸', '👽'], burst: ['👽', '✨'] },
      { e: '☄️', path: 'shoot', fx: 'burst', top: '6%', size: 34, dur: 11, delay: 3, burst: ['✨', '⭐'] },
      { e: '⭐', path: 'float', fx: 'burst', top: '52%', left: '2%', size: 30, dur: 4, burst: ['⭐', '✨', '🌟'] },
      { e: '🌟', path: 'float', fx: 'burst', top: '30%', left: '95%', size: 28, dur: 5, delay: 1, burst: ['🌟', '✨'] },
      { e: '👾', path: 'float', fx: 'jump', top: '88%', left: '50%', size: 34, dur: 3 },
    ],
  },
  ocean: {
    ground: 'ocean',
    movers: [
      { e: '🐠', path: 'swim-lr', fx: 'zoom', top: '28%', size: 40, dur: 18, flip: true, sound: 'whoosh' },
      { e: '🐟', path: 'swim-lr', fx: 'zoom', top: '56%', size: 34, dur: 24, delay: 5, flip: true, sound: 'whoosh' },
      { e: '🐡', path: 'swim-lr', fx: 'swap', top: '74%', size: 38, dur: 30, delay: 11, flip: true, cycle: ['🐡', '🎈'] },
      { e: '🐬', path: 'swim-rl', fx: 'flip', top: '18%', size: 50, dur: 20, delay: 6, burst: ['💦', '🫧'] },
      { e: '🐋', path: 'swim-rl', fx: 'burst', top: '44%', size: 72, dur: 42, delay: 1, burst: ['💦', '💦', '🫧'] },
      { e: '🦈', path: 'swim-rl', fx: 'zoom', top: '64%', size: 46, dur: 26, delay: 15, sound: 'whoosh' },
      { e: '🪼', path: 'float', fx: 'wiggle', top: '32%', left: '88%', size: 42, dur: 5 },
      { e: '🐙', path: 'float', fx: 'swap', top: '78%', left: '4%', size: 46, dur: 4, cycle: ['🐙', '💨'], burst: ['🖤', '💨'] },
      { e: '🦀', path: 'walk-lr', fx: 'jump', bottom: '1%', size: 34, dur: 28, delay: 3 },
      { e: '🫧', path: 'rise', fx: 'pop', left: '12%', size: 30, dur: 9 },
      { e: '🫧', path: 'rise', fx: 'pop', left: '70%', size: 24, dur: 12, delay: 4 },
      { e: '🫧', path: 'rise', fx: 'pop', left: '93%', size: 34, dur: 10, delay: 7 },
      { e: '🌿', path: 'sway', fx: 'wiggle', bottom: '-6px', left: '2%', size: 64, dur: 4 },
      { e: '🪸', path: 'sway', fx: 'wiggle', bottom: '-6px', left: '9%', size: 52, dur: 5 },
      { e: '🌿', path: 'sway', fx: 'wiggle', bottom: '-6px', left: '94%', size: 70, dur: 4.5 },
    ],
  },
  dinosaurs: {
    ground: 'grass',
    movers: [
      { e: '🦕', path: 'walk-lr', fx: 'jump', bottom: '2%', size: 72, dur: 45, flip: true, burst: ['🦴', '🌿'], sound: 'boing' },
      { e: '🦖', path: 'walk-rl', fx: 'jump', bottom: '2%', size: 62, dur: 34, delay: 12, burst: ['💥', '🦖'], sound: 'boing' },
      { e: '🌋', path: 'still', fx: 'burst', bottom: '0', left: '86%', size: 96, burst: ['🔥', '🌋', '💨', '🪨'] },
      { e: '💨', path: 'rise', fx: 'pop', left: '89%', size: 30, dur: 7 },
      { e: '🦅', path: 'fly-lr', fx: 'zoom', top: '16%', size: 40, dur: 22, delay: 4, flip: true, sound: 'whoosh' },
      { e: '🥚', path: 'still', fx: 'hatch', bottom: '3%', left: '8%', size: 40, cycle: ['🥚', '🐣', '🦖'], burst: ['✨', '🥚'] },
      { e: '🥚', path: 'still', fx: 'hatch', bottom: '2%', left: '12%', size: 32, cycle: ['🥚', '🐣', '🦕'], burst: ['✨', '🥚'] },
      { e: '🌴', path: 'sway', fx: 'wiggle', bottom: '-4px', left: '1%', size: 90, dur: 6 },
      { e: '☁️', path: 'fly-rl', fx: 'swap', top: '6%', size: 56, dur: 60, cycle: ['☁️', '🌧️'] },
      { e: '🦴', path: 'float', fx: 'spin', top: '48%', left: '95%', size: 30, dur: 5 },
    ],
  },
  jungle: {
    ground: 'grass',
    movers: [
      { e: '🐒', path: 'sway', fx: 'jump', top: '-2%', left: '90%', size: 54, dur: 3, burst: ['🍌', '🍌'], sound: 'boing' },
      { e: '🦜', path: 'fly-lr', fx: 'zoom', top: '20%', size: 44, dur: 20, delay: 3, flip: true, burst: ['🪶'], sound: 'whoosh' },
      { e: '🦋', path: 'flutter', fx: 'zoom', top: '40%', left: '5%', size: 32, dur: 7 },
      { e: '🦋', path: 'flutter', fx: 'zoom', top: '62%', left: '92%', size: 28, dur: 9, delay: 2 },
      { e: '🐸', path: 'still', fx: 'jump', bottom: '2%', left: '10%', size: 40, burst: ['💚'], sound: 'boing' },
      { e: '🐍', path: 'walk-rl', fx: 'wiggle', bottom: '1%', size: 42, dur: 38, delay: 8 },
      { e: '🐯', path: 'walk-lr', fx: 'jump', bottom: '2%', size: 54, dur: 50, delay: 20, flip: true },
      { e: '🌴', path: 'sway', fx: 'wiggle', bottom: '-4px', left: '0%', size: 96, dur: 6 },
      { e: '🌺', path: 'float', fx: 'burst', top: '80%', left: '86%', size: 36, dur: 4, burst: ['🌺', '🌸'] },
      { e: '🍌', path: 'sway', fx: 'swap', top: '6%', left: '3%', size: 34, dur: 3.5, cycle: ['🍌', '🐵'] },
    ],
  },
  desert: {
    ground: 'dunes',
    movers: [
      { e: '🌙', path: 'float', fx: 'spin', top: '8%', left: '88%', size: 58, dur: 8, burst: ['⭐', '✨'] },
      { e: '🐪', path: 'walk-lr', fx: 'jump', bottom: '3%', size: 58, dur: 48, flip: true, sound: 'boing' },
      { e: '🐪', path: 'walk-lr', fx: 'jump', bottom: '3%', size: 50, dur: 48, delay: 4, flip: true, sound: 'boing' },
      { e: '🐫', path: 'walk-lr', fx: 'jump', bottom: '3%', size: 54, dur: 48, delay: 8, flip: true, sound: 'boing' },
      { e: '🏮', path: 'sway', fx: 'burst', top: '-4px', left: '4%', size: 42, dur: 3, burst: ['✨', '🔥'] },
      { e: '🏮', path: 'sway', fx: 'burst', top: '-4px', left: '10%', size: 34, dur: 3.6, burst: ['✨'] },
      { e: '🌴', path: 'sway', fx: 'wiggle', bottom: '-4px', left: '92%', size: 92, dur: 6 },
      { e: '🌵', path: 'still', fx: 'jump', bottom: '1%', left: '3%', size: 50 },
      { e: '🦂', path: 'walk-rl', fx: 'zoom', bottom: '1%', size: 30, dur: 30, delay: 15 },
      { e: '⭐', path: 'float', fx: 'burst', top: '26%', left: '95%', size: 28, dur: 4, burst: ['⭐', '✨'] },
      { e: '🪁', path: 'fly-rl', fx: 'spin', top: '18%', size: 38, dur: 36, delay: 6 },
    ],
  },
  fairytale: {
    ground: 'meadow',
    movers: [
      { e: '🏰', path: 'still', fx: 'burst', bottom: '0', left: '86%', size: 96, burst: ['🎆', '✨', '👑'] },
      { e: '🌈', path: 'float', fx: 'burst', top: '6%', left: '2%', size: 70, dur: 8, burst: ['🌈', '💖'] },
      { e: '🦄', path: 'walk-lr', fx: 'jump', bottom: '2%', size: 60, dur: 36, flip: true, burst: ['🌈', '✨', '💖'], sound: 'boing' },
      { e: '🧚', path: 'flutter', fx: 'burst', top: '34%', left: '92%', size: 40, dur: 6, burst: ['✨', '💫', '⭐'] },
      { e: '🐉', path: 'fly-rl', fx: 'zoom', top: '16%', size: 56, dur: 30, delay: 5, burst: ['🔥', '🔥'], sound: 'whoosh' },
      { e: '🦋', path: 'flutter', fx: 'zoom', top: '58%', left: '4%', size: 30, dur: 8 },
      { e: '🍄', path: 'still', fx: 'jump', bottom: '1%', left: '4%', size: 46, sound: 'boing' },
      { e: '🐸', path: 'still', fx: 'swap', bottom: '1%', left: '9%', size: 34, cycle: ['🐸', '🤴'], burst: ['💋', '✨'] },
      { e: '⭐', path: 'float', fx: 'burst', top: '70%', left: '95%', size: 28, dur: 4, burst: ['⭐', '✨'] },
    ],
  },
  magic: {
    movers: [
      { e: '🧞', path: 'float', fx: 'burst', top: '30%', left: '90%', size: 60, dur: 5, burst: ['✨', '💫', '🌟'] },
      { e: '🪔', path: 'still', fx: 'swap', bottom: '2%', left: '5%', size: 46, cycle: ['🪔', '🧞'], burst: ['✨', '💨'] },
      { e: '🕌', path: 'still', fx: 'burst', bottom: '0', left: '86%', size: 90, burst: ['🌙', '✨'] },
      { e: '🌙', path: 'float', fx: 'spin', top: '6%', left: '6%', size: 52, dur: 7 },
      { e: '🐫', path: 'walk-lr', fx: 'jump', bottom: '2%', size: 48, dur: 44, flip: true, sound: 'boing' },
      { e: '💎', path: 'float', fx: 'burst', top: '60%', left: '95%', size: 30, dur: 4, burst: ['💎', '✨'] },
      { e: '☄️', path: 'shoot', fx: 'burst', top: '10%', size: 32, dur: 12, delay: 5, burst: ['✨'] },
    ],
  },
}

function MoverView({ m }: { m: Mover }) {
  const [fx, setFx] = useState<string | null>(null)
  const [step, setStep] = useState(0)
  const [gone, setGone] = useState(false)
  const emoji = m.cycle ? m.cycle[step % m.cycle.length] : m.e

  const tap = (el: HTMLElement) => {
    if (fx || gone) return
    ;(m.sound ? sfx[m.sound] : m.fx === 'pop' ? sfx.pop : sfx.select)()
    if (m.burst || m.fx === 'burst') confettiFrom(el, m.burst ?? [m.e, '✨'])
    if (m.fx === 'hatch') {
      setStep((s) => s + 1)
      confettiFrom(el, m.burst ?? ['✨'])
      return
    }
    if (m.fx === 'swap') {
      setStep(1)
      setTimeout(() => setStep(0), 1800)
    }
    if (m.fx === 'pop') {
      confettiFrom(el, ['💦', '🫧'])
      setGone(true)
      setTimeout(() => setGone(false), 3000)
      return
    }
    setFx(m.fx)
    setTimeout(() => setFx(null), 1300)
  }

  const style = {
    top: m.top,
    left: m.left,
    bottom: m.bottom,
    fontSize: m.size ?? 36,
    '--dur': `${m.dur ?? 20}s`,
    '--delay': `${m.delay ?? 0}s`,
    '--r': `${m.r ?? 70}px`,
  } as CSSProperties

  return (
    <button
      type="button"
      className={`mover path-${m.path}${gone ? ' gone' : ''}`}
      style={style}
      onClick={(e) => tap(e.currentTarget)}
      tabIndex={-1}
      aria-hidden="true"
    >
      {/* path (button) → tap effect → idle wobble → facing direction: each layer owns one transform */}
      <span className={`mover-inner${fx ? ` fx-${fx}` : ''}`}>
        <span className="mover-wobble">
          <span className={`mover-face${m.flip ? ' flip' : ''}`} key={emoji}>
            {emoji}
          </span>
        </span>
      </span>
    </button>
  )
}

export function ThemeScene({ theme }: { theme: string }) {
  const scene = SCENES[theme] ?? SCENES.desert
  return (
    <div className={`scene scene-${theme}`} aria-hidden="true">
      {scene.ground && <div className={`ground ground-${scene.ground}`} />}
      {scene.movers.map((m, i) => (
        <MoverView key={`${theme}-${i}`} m={m} />
      ))}
    </div>
  )
}

/** Tiny "juice" toolbox for the kids' UI: sound effects (synthesised, no files),
 * emoji confetti and read-aloud. Everything is optional and fails silently. */

const SOUND_KEY = 'myrugy.sound'
let audio: AudioContext | null = null

export function soundOn() {
  try {
    return localStorage.getItem(SOUND_KEY) !== 'off'
  } catch {
    return true
  }
}

export function setSoundOn(on: boolean) {
  try {
    localStorage.setItem(SOUND_KEY, on ? 'on' : 'off')
  } catch {
    /* ignore */
  }
  if (!on) stopSpeaking()
}

function tone(freqs: number[], dur = 0.12, type: OscillatorType = 'sine', gap = 0.09, vol = 0.12) {
  if (!soundOn()) return
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    audio ??= new Ctx()
    const ctx = audio
    const t0 = ctx.currentTime
    freqs.forEach((f, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = type
      osc.frequency.value = f
      const start = t0 + i * gap
      gain.gain.setValueAtTime(0.0001, start)
      gain.gain.exponentialRampToValueAtTime(vol, start + 0.01)
      gain.gain.exponentialRampToValueAtTime(0.0001, start + dur)
      osc.connect(gain).connect(ctx.destination)
      osc.start(start)
      osc.stop(start + dur + 0.02)
    })
  } catch {
    /* no audio: fine */
  }
}

export const sfx = {
  pop: () => tone([660], 0.08, 'triangle'),
  select: () => tone([523, 784], 0.09, 'triangle', 0.06),
  yay: () => tone([523, 659, 784, 1047], 0.16, 'triangle', 0.08),
  oops: () => tone([330, 247], 0.16, 'square', 0.1, 0.04),
  whoosh: () => tone([392, 587, 880], 0.07, 'sine', 0.04, 0.07),
  boing: () => tone([200, 400, 300], 0.1, 'triangle', 0.05, 0.08),
}

const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

/** Emoji burst from a point (defaults to the top-middle of the screen). */
export function confetti(x?: number, y?: number, emojis = ['🎉', '⭐', '✨', '🎊', '💛']) {
  if (reducedMotion()) return
  const cx = x ?? window.innerWidth / 2
  const cy = y ?? window.innerHeight / 3
  for (let i = 0; i < 14; i++) {
    const el = document.createElement('span')
    el.className = 'confetti-bit'
    el.textContent = emojis[i % emojis.length]
    const angle = (Math.PI * 2 * i) / 14 + Math.random() * 0.4
    const dist = 70 + Math.random() * 130
    el.style.left = `${cx}px`
    el.style.top = `${cy}px`
    el.style.setProperty('--dx', `${Math.cos(angle) * dist}px`)
    el.style.setProperty('--dy', `${Math.sin(angle) * dist - 50}px`)
    document.body.appendChild(el)
    setTimeout(() => el.remove(), 1100)
  }
}

export function confettiFrom(el: Element | null | undefined, emojis?: string[]) {
  const r = el?.getBoundingClientRect()
  confetti(r ? r.left + r.width / 2 : undefined, r ? r.top + r.height / 2 : undefined, emojis)
}

const VOICES: Record<string, string> = { en: 'en-GB', fr: 'fr-FR', ar: 'ar-SA' }

export interface SpeechEvents {
  onStart?: () => void
  onWord?: () => void
  onEnd?: () => void
}
// Keep a reference to the live utterance: some browsers drop events of garbage-collected ones.
let liveUtterance: SpeechSynthesisUtterance | null = null

/** Read text aloud with the browser's speech engine (no network, no keys). */
export function speak(text: string, lang = 'en', events?: SpeechEvents) {
  if (!soundOn()) return false
  try {
    if (!('speechSynthesis' in window)) return false
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text.replace(/[\p{Extended_Pictographic}\u{FE0F}\u{200D}]/gu, ''))
    u.lang = VOICES[lang] ?? 'en-GB'
    u.rate = 0.92
    u.pitch = 1.15
    if (events) {
      u.onstart = () => events.onStart?.()
      u.onboundary = () => events.onWord?.()
      u.onend = u.onerror = () => {
        if (liveUtterance === u) liveUtterance = null
        events.onEnd?.()
      }
    }
    liveUtterance = u
    window.speechSynthesis.speak(u)
    return true
  } catch {
    return false
  }
}

/** False when the browser has voices but none for this language (e.g. no Arabic voice installed). */
export function hasVoiceFor(lang = 'en') {
  try {
    if (!('speechSynthesis' in window)) return false
    const voices = window.speechSynthesis.getVoices()
    if (!voices.length) return true // voices not loaded yet: assume yes
    const code = (VOICES[lang] ?? lang).slice(0, 2).toLowerCase()
    return voices.some((v) => v.lang.toLowerCase().startsWith(code))
  } catch {
    return false
  }
}

export function stopSpeaking() {
  try {
    window.speechSynthesis?.cancel()
  } catch {
    /* ignore */
  }
}

export const RUG_JOKES = [
  'Why did the rug go to school? To become a little more woven-wise! 😄',
  'What do you call a sleepy rug? A nap-kin! 😴',
  'Why do rugs never get lost? They always follow the pattern! 🔷',
  'What did the sheep say to the weaver? Thanks for making me famous! 🐑',
  'Why was the loom so calm? It took everything one thread at a time! 🧵',
  'What is a rug’s favourite dance? The shuffle! 💃',
]

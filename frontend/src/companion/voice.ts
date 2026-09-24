/**
 * Plays the companion's Gemini voice (WAV from our backend) and measures its
 * loudness so the 3D mouth moves with the real speech.
 */
let ctx: AudioContext | null = null
let current: { stop: () => void } | null = null

function audioContext() {
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctor) return null
    ctx = new Ctor()
  }
  return ctx
}

/** Browsers only allow sound after a tap/key press: unlock the audio context on the first one. */
export function unlockAudioOnFirstGesture() {
  const unlock = () => {
    const c = audioContext()
    if (c && c.state === 'suspended') c.resume().catch(() => undefined)
  }
  window.addEventListener('pointerdown', unlock, { passive: true })
  window.addEventListener('keydown', unlock)
  return () => {
    window.removeEventListener('pointerdown', unlock)
    window.removeEventListener('keydown', unlock)
  }
}

export interface VoiceEvents {
  onStart?: () => void
  /** 0..1 loudness, about 60 times a second while playing. */
  onLevel?: (level: number) => void
  onEnd?: () => void
}

/** Play WAV bytes. Resolves false if the audio can't be played (caller falls back to the browser voice). */
export async function playVoice(wav: ArrayBuffer, ev: VoiceEvents = {}): Promise<boolean> {
  stopVoice()
  const c = audioContext()
  if (!c) return false
  try {
    if (c.state === 'suspended') await c.resume()
    const buffer = await c.decodeAudioData(wav.slice(0))
    const source = c.createBufferSource()
    source.buffer = buffer
    const analyser = c.createAnalyser()
    analyser.fftSize = 512
    source.connect(analyser)
    analyser.connect(c.destination)
    const samples = new Uint8Array(analyser.fftSize)
    let raf = 0
    let ended = false
    const tick = () => {
      analyser.getByteTimeDomainData(samples)
      let sum = 0
      for (const s of samples) sum += ((s - 128) / 128) ** 2
      ev.onLevel?.(Math.min(1, Math.sqrt(sum / samples.length) * 4))
      raf = requestAnimationFrame(tick)
    }
    const finish = () => {
      if (ended) return
      ended = true
      cancelAnimationFrame(raf)
      ev.onLevel?.(0)
      if (current?.stop === stop) current = null
      ev.onEnd?.()
    }
    const stop = () => {
      try {
        source.stop()
      } catch {
        /* already stopped */
      }
      finish()
    }
    source.onended = finish
    current = { stop }
    source.start()
    ev.onStart?.()
    tick()
    return true
  } catch {
    return false
  }
}

export function stopVoice() {
  current?.stop()
  current = null
}

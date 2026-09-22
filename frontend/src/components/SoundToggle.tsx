import { useState } from 'react'
import { setSoundOn, sfx, soundOn } from '../fun'

export function SoundToggle({ className = 'pill-link' }: { className?: string }) {
  const [on, setOn] = useState(soundOn)
  return (
    <button
      type="button"
      className={`${className} sound-btn`}
      onClick={() => {
        setSoundOn(!on)
        setOn(!on)
        if (!on) setTimeout(sfx.pop, 30)
      }}
      aria-pressed={on}
      aria-label={on ? 'Sound on' : 'Sound off'}
      title={on ? 'Sound on' : 'Sound off'}
    >
      {on ? '🔊' : '🔇'}
    </button>
  )
}

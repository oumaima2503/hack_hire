import { useState } from 'react'
import { sfx, speak } from '../fun'

export type Mood = 'happy' | 'wow' | 'think'

/**
 * Rugy, the expedition guide: a little woven rug with a face.
 * Tap him and he giggles; 🔊 reads his bubble aloud for kids who can't read yet.
 */
export function Rugy({ size = 120, say, mood = 'happy', lang }: { size?: number; say?: string; mood?: Mood; lang?: string }) {
  const [wiggle, setWiggle] = useState(0)

  const poke = () => {
    setWiggle((w) => w + 1)
    sfx.boing()
    if (say && lang) speak(say, lang)
  }

  return (
    <div className="rugy">
      <button type="button" className="rugy-btn" onClick={poke} aria-label="Rugy">
        <svg key={wiggle} className={`rugy-svg${wiggle ? ' wiggle' : ''}${mood === 'wow' ? ' jump' : ''}`} width={size} height={size * 1.1} viewBox="0 0 100 110" aria-hidden="true">
          {Array.from({ length: 7 }, (_, i) => (
            <g key={i} stroke="#e8c79a" strokeWidth="2.2" strokeLinecap="round">
              <line x1={22 + i * 9.3} y1="10" x2={22 + i * 9.3} y2="2" />
              <line x1={22 + i * 9.3} y1="100" x2={22 + i * 9.3} y2="108" />
            </g>
          ))}
          <rect x="14" y="10" width="72" height="90" rx="12" fill="#c4501f" />
          <rect x="20" y="16" width="60" height="78" rx="8" fill="none" stroke="#f3b04a" strokeWidth="2.5" strokeDasharray="5 3" />
          <path d="M50 22 L58 30 L50 38 L42 30 Z" fill="#2f3a6b" />
          <path d="M50 74 L58 82 L50 90 L42 82 Z" fill="#2f3a6b" />
          <path d="M28 64 L34 70 L28 76 L22 70 Z M72 64 L78 70 L72 76 L66 70 Z" fill="#f3b04a" />
          {/* eyes */}
          <ellipse cx="38" cy="52" rx="7" ry={mood === 'wow' ? 9 : 8} fill="#fff" />
          <ellipse cx="62" cy="52" rx="7" ry={mood === 'wow' ? 9 : 8} fill="#fff" />
          <g className="rugy-eyes">
            <circle cx={mood === 'think' ? 41 : 39} cy={mood === 'think' ? 50 : 53} r="3.6" fill="#2a1a10" />
            <circle cx={mood === 'think' ? 65 : 63} cy={mood === 'think' ? 50 : 53} r="3.6" fill="#2a1a10" />
          </g>
          <circle cx="40.2" cy="51.6" r="1.2" fill="#fff" />
          <circle cx="64.2" cy="51.6" r="1.2" fill="#fff" />
          <ellipse cx="30" cy="61" rx="4" ry="2.4" fill="#f08a6a" opacity=".8" />
          <ellipse cx="70" cy="61" rx="4" ry="2.4" fill="#f08a6a" opacity=".8" />
          {/* mouth */}
          {mood === 'wow' ? (
            <ellipse cx="50" cy="65" rx="5" ry="6" fill="#2a1a10" />
          ) : mood === 'think' ? (
            <path d="M44 65 Q50 63 56 66" stroke="#2a1a10" strokeWidth="2.6" fill="none" strokeLinecap="round" />
          ) : (
            <path d="M42 61 Q50 71 58 61 Z" fill="#2a1a10" />
          )}
        </svg>
      </button>
      {say && (
        <p className="bubble">
          {say}
          {lang && (
            <button type="button" className="bubble-speak" onClick={() => speak(say, lang)} aria-label="Read aloud">
              🔊
            </button>
          )}
        </p>
      )}
    </div>
  )
}

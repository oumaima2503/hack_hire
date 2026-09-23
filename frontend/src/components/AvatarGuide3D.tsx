import { useState, type MouseEvent } from 'react'
import { sfx } from '../fun'
import { Rugy } from './Rugy'

export interface AvatarGuide3DProps {
  avatarEmoji?: string
  guideName?: string
  hintBadge?: string | null
  isSpeaking?: boolean
  onClick: () => void
}

/**
 * 3D Animated Floating Guide Avatar:
 * Floats gracefully over the interface with 3D depth, perspective tilts, and glowing lighting.
 * Acts as the interactive AI Assistant chatbot launcher when clicked!
 */
export function AvatarGuide3D({
  avatarEmoji,
  guideName = 'MyRugy',
  hintBadge,
  isSpeaking = false,
  onClick,
}: AvatarGuide3DProps) {
  const [tilt, setTilt] = useState({ x: 0, y: 0 })
  const [pop, setPop] = useState(false)

  const isRugySvg = !avatarEmoji || avatarEmoji === '🧶'

  const handleMouseMove = (e: MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 24
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * -24
    setTilt({ x, y })
  }

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 })
  }

  const handleClick = () => {
    setPop(true)
    sfx.boing()
    setTimeout(() => setPop(false), 500)
    onClick()
  }

  return (
    <aside className={`avatar-guide-3d-wrapper ${isSpeaking ? 'is-speaking' : ''}`}>
      {hintBadge && (
        <div className="avatar-3d-hint-bubble" onClick={handleClick} role="button" tabIndex={0}>
          <span>{hintBadge}</span>
        </div>
      )}

      <button
        type="button"
        className={`avatar-3d-btn ${pop ? 'pop-bounce' : ''}`}
        onClick={handleClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        aria-label={`Talk to your 3D Guide ${guideName}`}
        title={`Click ${guideName} to ask anything!`}
      >
        <div
          className="avatar-3d-stage"
          style={{
            transform: `perspective(800px) rotateY(${tilt.x}deg) rotateX(${tilt.y}deg) translateZ(20px)`,
          }}
        >
          <div className="avatar-3d-aura" />
          <div className="avatar-3d-graphic">
            {isRugySvg ? (
              <Rugy size={84} mood={isSpeaking ? 'wow' : 'happy'} />
            ) : (
              <div className="emoji-3d-avatar">
                <span className="emoji-3d-symbol">{avatarEmoji}</span>
              </div>
            )}
          </div>
        </div>
        <span className="avatar-3d-label">
          <span className="sparkle-icon">✨</span> Ask {guideName}
        </span>
      </button>
    </aside>
  )
}

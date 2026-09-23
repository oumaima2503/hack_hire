import { useEffect, useState } from 'react'
import { sfx, speak, stopSpeaking } from '../fun'
import { Rugy, type Mood } from './Rugy'

export interface TalkingAvatarProps {
  say?: string
  lang?: string
  avatarKey?: string
  avatarEmoji?: string
  guideName?: string
  size?: number
  mood?: Mood
  autoPlay?: boolean
  className?: string
  layout?: 'row' | 'column' | 'compact'
}

/**
 * Interactive Talking Avatar: replaces static "Read me" buttons and speaker icons.
 * The child's avatar guide wiggles, jumps, and speaks out loud when tapped!
 */
export function TalkingAvatar({
  say,
  lang,
  avatarEmoji,
  guideName,
  size = 72,
  mood = 'happy',
  autoPlay = false,
  className = '',
  layout = 'row',
}: TalkingAvatarProps) {
  const [wiggle, setWiggle] = useState(0)
  const [speaking, setSpeaking] = useState(false)

  useEffect(() => {
    if (autoPlay && say && lang) {
      speak(say, lang)
      setSpeaking(true)
      const timer = setTimeout(() => setSpeaking(false), Math.min(say.length * 80, 8000))
      return () => {
        clearTimeout(timer)
        stopSpeaking()
      }
    }
  }, [say, lang, autoPlay])

  const talk = () => {
    setWiggle((w) => w + 1)
    sfx.boing()
    if (say && lang) {
      speak(say, lang)
      setSpeaking(true)
      setTimeout(() => setSpeaking(false), Math.min(say.length * 80, 6000))
    }
  }

  const isEmojiAvatar = Boolean(avatarEmoji && avatarEmoji !== '🧶')

  return (
    <div className={`talking-avatar layout-${layout} ${className} ${speaking ? 'is-speaking' : ''}`}>
      <button
        type="button"
        className={`talking-avatar-btn ${wiggle ? 'wiggle' : ''} ${mood === 'wow' ? 'jump' : ''}`}
        onClick={talk}
        aria-label={guideName ? `Talk to ${guideName}` : 'Talk'}
        title="Tap me to listen!"
      >
        {isEmojiAvatar ? (
          <div className="emoji-avatar-wrapper" style={{ width: size, height: size, fontSize: size * 0.65 }}>
            <span className="emoji-avatar-graphic" key={wiggle}>
              {avatarEmoji}
            </span>
            <span className="talk-pulse" />
          </div>
        ) : (
          <Rugy size={size} mood={mood} />
        )}
      </button>

      {say && (
        <div className="talking-avatar-bubble" onClick={talk} role="button" tabIndex={0}>
          <div className="bubble-content">
            {guideName && <strong className="guide-name-tag">{guideName}:</strong>}
            <span>{say}</span>
          </div>
          <button
            type="button"
            className="avatar-speaker-badge"
            onClick={(e) => {
              e.stopPropagation()
              talk()
            }}
            aria-label="Read aloud"
          >
            {speaking ? '🔊' : '🗣️'}
            <span className="speak-label">Tap to listen</span>
          </button>
        </div>
      )}
    </div>
  )
}

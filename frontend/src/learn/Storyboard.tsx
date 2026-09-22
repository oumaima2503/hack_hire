import { useEffect, useRef, useState } from 'react'
import { speak, stopSpeaking } from './LearnContext'

const FRAME_MS = 3800

/**
 * The lesson's short "video": an animated, narrated storyboard (no external
 * video hosting needed). If the team adds a real `video_url`, that plays instead.
 */
export function Storyboard({
  frames,
  videoUrl,
  lang,
  autoNarrate,
  onWatched,
}: {
  frames: { emoji: string; caption: string }[]
  videoUrl: string | null
  lang: string
  autoNarrate: boolean
  onWatched: () => void
}) {
  const [index, setIndex] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [narrate, setNarrate] = useState(autoNarrate)
  const done = useRef(false)

  useEffect(() => {
    if (!playing) return
    if (narrate) speak(frames[index].caption, lang)
    const id = setTimeout(() => {
      if (index + 1 < frames.length) setIndex(index + 1)
      else {
        setPlaying(false)
        if (!done.current) {
          done.current = true
          onWatched()
        }
      }
    }, FRAME_MS)
    return () => clearTimeout(id)
  }, [playing, index, narrate, frames, lang, onWatched])

  useEffect(() => stopSpeaking, [])

  if (videoUrl) {
    return <video className="lesson-video" src={videoUrl} controls onEnded={onWatched} />
  }

  const frame = frames[index]
  return (
    <div className="storyboard">
      <div className="screen">
        <div className="screen-emoji" key={index}>
          {frame.emoji}
        </div>
        <p className="screen-caption" key={`c${index}`}>
          {frame.caption}
        </p>
        {!playing && (
          <button
            className="play-btn"
            onClick={() => {
              if (index === frames.length - 1) setIndex(0)
              setPlaying(true)
            }}
            aria-label="Play the story"
          >
            ▶
          </button>
        )}
      </div>
      <div className="screen-controls">
        <div className="dots">
          {frames.map((_, i) => (
            <span key={i} className={i <= index ? 'on' : ''} />
          ))}
        </div>
        <label className="toggle">
          <input type="checkbox" checked={narrate} onChange={(e) => setNarrate(e.target.checked)} /> 🔊 Narrate
        </label>
        {playing && (
          <button className="btn ghost small" onClick={() => { setPlaying(false); stopSpeaking() }}>
            ⏸ Pause
          </button>
        )}
      </div>
    </div>
  )
}

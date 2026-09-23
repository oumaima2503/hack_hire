import { useEffect, useRef, useState } from 'react'
import { speak, stopSpeaking } from './LearnContext'

const FRAME_MS = 3800
const LOOM_ROWS = 12

/** A loom that weaves a small rug row by row while the story plays. */
function Loom({ rows, playing }: { rows: number; playing: boolean }) {
  return (
    <div className={`loom${playing ? ' playing' : ''}`} aria-hidden="true">
      <div className="loom-beam top" />
      <div className="loom-warp">
        {Array.from({ length: 9 }, (_, i) => (
          <span key={i} />
        ))}
      </div>
      <div className="loom-rug">
        {Array.from({ length: LOOM_ROWS }, (_, i) => {
          const woven = i >= LOOM_ROWS - rows // weaving starts at the bottom
          return <span key={i} className={`loom-row r${i % 4}${woven ? ' woven' : ''}`} />
        })}
      </div>
      {playing && <span className="loom-shuttle" style={{ bottom: `${8 + (rows / LOOM_ROWS) * 76}%` }}>🧶</span>}
      <div className="loom-beam bottom" />
    </div>
  )
}

/**
 * The lesson's video: an animated, narrated story of how the rug is made, with
 * a loom weaving along. If the team adds a real `video_url`, that plays instead.
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
  const [finished, setFinished] = useState(false)
  const [narrate, setNarrate] = useState(autoNarrate)
  const done = useRef(false)

  useEffect(() => {
    if (!playing) return
    if (narrate) speak(frames[index].caption, lang)
    const id = setTimeout(() => {
      if (index + 1 < frames.length) setIndex(index + 1)
      else {
        setPlaying(false)
        setFinished(true)
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
  const woven = finished ? LOOM_ROWS : playing ? Math.round(((index + 1) / frames.length) * LOOM_ROWS) : Math.round((index / frames.length) * LOOM_ROWS)

  return (
    <div className="storyboard">
      <div className="screen">
        <div className="screen-stage">
          <div className="screen-emoji" key={index}>
            {frame.emoji}
          </div>
          <Loom rows={woven} playing={playing} />
        </div>
        <p className="screen-caption" key={`c${index}`}>
          <span className="scene-no">
            {index + 1}/{frames.length}
          </span>{' '}
          {frame.caption}
        </p>
        {!playing && (
          <button
            className="play-btn"
            onClick={() => {
              if (finished || index === frames.length - 1) {
                setIndex(0)
                setFinished(false)
              }
              setPlaying(true)
            }}
            aria-label={finished ? 'Watch again' : 'Play the video'}
          >
            {finished ? '↻' : '▶'}
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

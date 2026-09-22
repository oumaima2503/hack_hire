import { useState } from 'react'

/** Tap-to-flip fact cards: the "try it" part of a lesson. */
export function TapCards({ cards }: { cards: { emoji: string; title: string; text: string }[] }) {
  const [flipped, setFlipped] = useState<Set<number>>(new Set())
  return (
    <div className="tap-cards">
      {cards.map((c, i) => {
        const on = flipped.has(i)
        return (
          <button
            key={i}
            className={`tap-card${on ? ' flipped' : ''}`}
            onClick={() => setFlipped((s) => new Set(s).add(i))}
            aria-pressed={on}
          >
            <span className="tap-front">
              <span className="tap-emoji">{c.emoji}</span>
              <strong>{c.title}</strong>
              <small>Tap me!</small>
            </span>
            <span className="tap-back">{c.text}</span>
          </button>
        )
      })}
    </div>
  )
}

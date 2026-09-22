import { useMemo } from 'react'
import type { Theme } from '../api'

/** Floating theme particles: twinkling stars, rising bubbles, falling leaves… */
export function ThemeBackdrop({ theme }: { theme: Theme }) {
  const items = useMemo(
    () =>
      Array.from({ length: 16 }, (_, i) => ({
        emoji: theme.particles[i % theme.particles.length],
        left: (i * 37 + 11) % 100,
        top: (i * 53 + 7) % 100,
        delay: (i * 0.7) % 6,
        duration: 6 + ((i * 13) % 7),
        size: 14 + ((i * 7) % 16),
      })),
    [theme.particles],
  )
  return (
    <div className={`backdrop anim-${theme.animation}`} aria-hidden="true">
      {items.map((p, i) => (
        <span
          key={i}
          className="particle"
          style={{
            left: `${p.left}%`,
            top: `${p.top}%`,
            fontSize: p.size,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        >
          {p.emoji}
        </span>
      ))}
    </div>
  )
}

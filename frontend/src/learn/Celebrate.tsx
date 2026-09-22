import { useEffect, useState } from 'react'
import type { Award, Theme } from '../api'
import { confetti, sfx } from '../fun'

/** Points toast + unlock/achievement modal, themed with the child's vocabulary. */
export function Celebrate({ award, theme, onDone }: { award: Award | null; theme: Theme; onDone: () => void }) {
  const [toast, setToast] = useState(false)
  const unlocks = award ? [...award.new_rewards, ...award.new_achievements] : []

  useEffect(() => {
    if (!award) return
    sfx.yay()
    if (unlocks.length) confetti(undefined, undefined, ['🎉', theme.vocab.point_emoji, '🔓', theme.guide.emoji, '✨'])
    if (award.points_awarded > 0) {
      setToast(true)
      const id = setTimeout(() => {
        setToast(false)
        if (!unlocks.length) onDone()
      }, 2400)
      return () => clearTimeout(id)
    }
    if (!unlocks.length) onDone()
  }, [award]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!award) return null
  const v = theme.vocab

  return (
    <>
      {toast && (
        <div className="points-toast" role="status">
          <span className="points-toast-emoji">{v.point_emoji}</span>+{award.points_awarded} {v.points}!
          {award.breakdown.some((b) => b.reason === 'daily_streak') && <small>🔥 streak bonus</small>}
        </div>
      )}
      {unlocks.length > 0 && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="New rewards">
          <div className="modal celebrate-modal">
            <div className="burst" aria-hidden="true">
              {['🎉', v.point_emoji, '✨', theme.guide.emoji, '🎊'].map((e, i) => (
                <span key={i} style={{ animationDelay: `${i * 0.08}s` }}>
                  {e}
                </span>
              ))}
            </div>
            <h2>{v.cheer}!</h2>
            <ul className="unlock-list">
              {award.new_rewards.map((r) => (
                <li key={r.key}>
                  <span className="unlock-emoji">{r.emoji}</span>
                  <div>
                    <strong>🔓 {r.name}</strong>
                    <small>New {r.kind} unlocked!</small>
                  </div>
                </li>
              ))}
              {award.new_achievements.map((a) => (
                <li key={a.key}>
                  <span className="unlock-emoji">{a.emoji}</span>
                  <div>
                    <strong>🏅 {a.title}</strong>
                    <small>{a.description}</small>
                  </div>
                </li>
              ))}
            </ul>
            <button className="btn primary big" onClick={onDone} autoFocus>
              Yay! {theme.guide.emoji}
            </button>
          </div>
        </div>
      )}
    </>
  )
}

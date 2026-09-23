import { useCallback, useEffect, useState, type CSSProperties, type FormEvent } from 'react'
import { NavLink, Outlet, useLocation, useNavigate, useParams } from 'react-router-dom'
import { api, ApiError, type Award, type Experience } from '../api'
import { SoundToggle } from '../components/SoundToggle'
import { avatarEmoji } from '../content'
import { Celebrate } from './Celebrate'
import { ChatWidget } from './ChatWidget'
import { LearnContext, type ChatFocus } from './LearnContext'
import { ThemeBackdrop } from './ThemeBackdrop'
import { ThemeScene } from './ThemeScene'

/** The child's personalised world: every colour, icon, word and particle comes from /experience. */
export default function LearnLayout() {
  const { childId = '' } = useParams()
  const navigate = useNavigate()
  const loc = useLocation()
  const [exp, setExp] = useState<Experience | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [award, setAward] = useState<Award | null>(null)
  const [focus, setFocus] = useState<ChatFocus>({})
  const [gate, setGate] = useState(false)

  const refresh = useCallback(() => {
    api.experience(childId).then(setExp, (e) => {
      if (e instanceof ApiError && e.status === 404) navigate('/parent', { replace: true })
      else setError(e.message)
    })
  }, [childId, navigate])

  useEffect(refresh, [refresh])

  const celebrate = useCallback(
    (a: Award | null | undefined) => {
      if (!a || (a.points_awarded === 0 && !a.new_rewards.length && !a.new_achievements.length)) return
      setAward(a)
      refresh()
    },
    [refresh],
  )

  if (error) return <p className="error">{error}</p>
  if (!exp) return <div className="learn-loading">🧶</div>

  const t = exp.theme
  const style = {
    '--t-bg1': t.colors.bg1,
    '--t-bg2': t.colors.bg2,
    '--t-surface': t.colors.surface,
    '--t-text': t.colors.text,
    '--t-primary': t.colors.primary,
    '--t-on-primary': t.colors.on_primary,
    '--t-secondary': t.colors.secondary,
  } as CSSProperties
  const p = exp.progress
  const nav = [
    { to: '', end: true, icon: t.icons.home, label: 'Home' },
    { to: 'learn', icon: t.icons.learn, label: 'Learn & Play' },
    { to: 'studio', icon: t.icons.studio, label: 'Create My Rug' },
    { to: 'rewards', icon: t.icons.rewards, label: 'Rewards' },
    { to: 'progress', icon: t.icons.progress, label: 'Progress' },
    { to: 'assistant', icon: t.icons.assistant, label: `Ask ${t.guide.name}` },
  ]

  return (
    <LearnContext.Provider value={{ childId, exp, refresh, celebrate, focus, setFocus }}>
      <div className={`learn theme-${t.key}`} style={style} dir="ltr" lang="en">
        <ThemeBackdrop theme={t} />
        <ThemeScene theme={t.key} />
        <header className="learn-top">
          <div className="learn-me">
            <span className="learn-avatar">{avatarEmoji(exp.child.avatar_key)}</span>
            <div>
              <strong>{exp.child.name}</strong>
              <small>
                {t.emoji} {t.name} · {exp.difficulty.label}
              </small>
            </div>
          </div>
          <div className="learn-stats">
            <span className="stat-pill" title={`${p.total_points} ${t.vocab.points}`}>
              {t.vocab.point_emoji} {p.total_points}
            </span>
            <span className="stat-pill" title={`${p.points_to_next} to the next level`}>
              🏆 {t.vocab.level} {p.xp_level}
            </span>
            {p.streak_days > 1 && <span className="stat-pill">🔥 {p.streak_days}</span>}
            <SoundToggle className="stat-pill" />
            <button className="stat-pill grownups" onClick={() => setGate(true)}>
              👨‍👩‍👧 Grown-ups
            </button>
          </div>
        </header>

        <nav className="learn-nav" aria-label="Learning">
          {nav.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => (isActive ? 'on' : '')}>
              <span className="nav-icon">{n.icon}</span>
              <span className="nav-label">{n.label}</span>
            </NavLink>
          ))}
        </nav>

        <main className="learn-main">
          <Outlet />
        </main>

        {!loc.pathname.endsWith('/assistant') && <ChatWidget />}
        <Celebrate award={award} theme={t} onDone={() => setAward(null)} />
        {gate && <GrownUpGate onClose={() => setGate(false)} onPass={() => navigate('/parent')} />}
      </div>
    </LearnContext.Provider>
  )
}

/** A playful "ask a grown-up" check before leaving child mode (not a security boundary). */
function GrownUpGate({ onClose, onPass }: { onClose: () => void; onPass: () => void }) {
  const [[a, b]] = useState(() => [6 + Math.floor(Math.random() * 4), 6 + Math.floor(Math.random() * 4)])
  const [value, setValue] = useState('')
  const [wrong, setWrong] = useState(false)
  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (Number(value) === a * b) onPass()
    else setWrong(true)
  }
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Grown-ups only">
      <form className="modal gate" onSubmit={submit}>
        <h2>👨‍👩‍👧 Grown-ups only</h2>
        <p>
          What is {a} × {b}?
        </p>
        <input inputMode="numeric" value={value} onChange={(e) => setValue(e.target.value.replace(/\D/g, ''))} autoFocus aria-label="Answer" />
        {wrong && <p className="error">Not quite. Ask a grown-up!</p>}
        <div className="step-nav">
          <button type="button" className="btn ghost" onClick={onClose}>
            Back to learning
          </button>
          <button className="btn primary">Continue</button>
        </div>
      </form>
    </div>
  )
}

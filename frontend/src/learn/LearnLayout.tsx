import { useCallback, useEffect, useState, type CSSProperties } from 'react'
import { NavLink, Outlet, useNavigate, useParams } from 'react-router-dom'
import { api, ApiError, type Award, type Experience } from '../api'
import { ParentPasswordForm } from '../components/ParentGate'
import { SoundToggle } from '../components/SoundToggle'
import { avatarEmoji } from '../content'
import { Celebrate } from './Celebrate'
import { LearnContext, type ChatFocus } from './LearnContext'
import { ThemeBackdrop } from './ThemeBackdrop'
import { ThemeScene } from './ThemeScene'

import { AppWalkthrough } from '../guide/AppWalkthrough'
import { CompanionProvider, useCompanion } from '../companion/Companion'
import { companionText, pickLine } from '../companion/companionText'

/** The child's personalised world: every colour, icon, word and particle comes from /experience. */
export default function LearnLayout() {
  const { childId = '' } = useParams()
  const navigate = useNavigate()
  const [exp, setExp] = useState<Experience | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [award, setAward] = useState<Award | null>(null)
  const [focus, setFocus] = useState<ChatFocus>({})
  const [gate, setGate] = useState(false)
  const [showWalkthrough, setShowWalkthrough] = useState(false)

  const refresh = useCallback(() => {
    api.experience(childId).then(
      (data) => {
        setExp(data)
        try {
          if (!localStorage.getItem(`myrugy_walkthrough_${childId}`)) {
            setShowWalkthrough(true)
          }
        } catch {
          // ignore
        }
      },
      (e) => {
        if (e instanceof ApiError && e.status === 404) navigate('/parent', { replace: true })
        else setError(e.message)
      },
    )
  }, [childId, navigate])

  useEffect(refresh, [refresh])

  // Opening a child's play area switches to child mode: parent pages need the password again.
  useEffect(() => {
    api.parentLock().catch(() => undefined)
  }, [])

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
    { to: 'assistant', icon: avatarEmoji(exp.child.avatar_key), label: `Talk to ${t.guide.name}` },
  ]

  return (
    <LearnContext.Provider value={{ childId, exp, refresh, celebrate, focus, setFocus }}>
      <CompanionProvider>
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
            <button className="stat-pill grownups" onClick={() => setShowWalkthrough(true)} title="Watch App Walkthrough">
              ❓ Tour
            </button>
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

        <CompanionCheer award={award} lang={exp.child.language} />
        <Celebrate award={award} theme={t} onDone={() => setAward(null)} />
        {gate && <GrownUpGate onClose={() => setGate(false)} onPass={() => navigate('/parent')} />}
        <AppWalkthrough
          childId={childId}
          childName={exp.child.name}
          avatarEmoji={avatarEmoji(exp.child.avatar_key)}
          themeName={t.name}
          guideName={t.guide.name}
          guideEmoji={t.guide.emoji}
          lang={exp.guide?.language}
          isOpen={showWalkthrough}
          onClose={() => setShowWalkthrough(false)}
        />
      </div>
      </CompanionProvider>
    </LearnContext.Provider>
  )
}

/** The companion jumps for joy whenever the child earns points or unlocks something. */
function CompanionCheer({ award, lang }: { award: Award | null; lang: Experience['child']['language'] }) {
  const companion = useCompanion()
  useEffect(() => {
    if (!award) return
    companion.act('celebrating', 3200)
    if (award.new_rewards.length || award.new_achievements.length) companion.say(pickLine(companionText(lang).cheer), { state: 'celebrating' })
  }, [award]) // eslint-disable-line react-hooks/exhaustive-deps
  return null
}

/** Leaving child mode needs the parent's password (checked by the API, not in the browser). */
function GrownUpGate({ onClose, onPass }: { onClose: () => void; onPass: () => void }) {
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Grown-ups only">
      <div className="modal gate">
        <ParentPasswordForm onUnlocked={onPass} onCancel={onClose} cancelLabel="Back to learning" />
      </div>
    </div>
  )
}

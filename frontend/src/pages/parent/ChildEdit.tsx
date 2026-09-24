import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api, type Child } from '../../api'
import { useAuth } from '../../auth'
import { Layout } from '../../components/Layout'
import { AVATARS, FAVORITE_COLORS, ISLANDS, LEARNING_STYLES, REGIONS, RUG_STYLES, WORLDS } from '../../content'

const LABELS: Record<string, string> = {
  watch: 'Watch (videos first)', listen: 'Listen (read aloud)', do: 'Do (hands-on first)',
  berber: 'Berber diamonds', kilim: 'Kilim zigzags', floral: 'Flower garden', modern: 'Modern blocks',
  animals: 'Animals', nature: 'Nature', art: 'Colours & patterns', space: 'Stars & sky', music: 'Music', stories: 'Stories',
}

export default function ChildEdit() {
  const { childId = '' } = useParams()
  const navigate = useNavigate()
  const { refresh } = useAuth()
  const [child, setChild] = useState<Child | null>(null)
  const [themes, setThemes] = useState<{ key: string; name: string; emoji: string }[]>([])
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    api.experience(childId).then((e) => {
      setChild(e.child)
      setThemes(e.available_themes)
    }, (e) => setError(e.message))
  }, [childId])

  if (!child) return <Layout>{error ? <p className="error">{error}</p> : <p className="loading">Loading…</p>}</Layout>

  const set = <K extends keyof Child>(k: K, v: Child[K]) => {
    setChild({ ...child, [k]: v })
    setSaved(false)
  }
  const toggleInterest = (k: string) => {
    const has = child.interests.includes(k)
    set('interests', has ? child.interests.filter((x) => x !== k) : [...child.interests, k].slice(-2))
  }

  const save = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    try {
      const { name, avatar_key, age, interests, selected_theme, favorite_color, learning_style, rug_style, level, language } = child
      const fields = { name, avatar_key, age, interests, selected_theme, favorite_color, learning_style, rug_style, level, language }
      // Skip fields never set during onboarding, so validation only sees real choices.
      // home_region is always sent: null is a valid choice ("outside Morocco").
      const patch = {
        ...Object.fromEntries(Object.entries(fields).filter(([, v]) => v !== null && v !== undefined)),
        home_region: child.home_region,
      } as Partial<Child>
      await api.editChild(childId, patch)
      setSaved(true)
      refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save')
    }
  }

  const [patternMsg, setPatternMsg] = useState<string | null>(null)
  const resetPattern = async () => {
    if (!window.confirm(`Reset ${child.name}'s secret pattern? They will create a new one with you next time they play.`)) return
    try {
      await api.resetPattern(childId)
      setPatternMsg('🔐 Secret pattern reset. It will be created again with you next time.')
    } catch (err) {
      setPatternMsg(err instanceof Error ? err.message : 'Could not reset the pattern')
    }
  }

  const remove = async () => {
    if (!window.confirm(`Delete ${child.name}'s profile and all their progress, rugs and chats? This cannot be undone.`)) return
    await api.deleteChild(childId)
    refresh()
    navigate('/parent')
  }

  return (
    <Layout>
      <form className="panel child-edit" onSubmit={save}>
        <p className="eyebrow">
          <Link to={`/parent/children/${childId}`}>← Back</Link>
        </p>
        <h1>Edit {child.name}’s profile</h1>

        <label className="field">
          <span>First name</span>
          <input value={child.name} maxLength={30} required onChange={(e) => set('name', e.target.value)} />
        </label>
        <div className="field-row">
          <label className="field">
            <span>Age</span>
            <select value={child.age ?? 7} onChange={(e) => set('age', Number(e.target.value))}>
              {Array.from({ length: 9 }, (_, i) => i + 3).map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </label>
          <label className="field">
            <span>Difficulty</span>
            <select value={child.level ?? 1} onChange={(e) => set('level', Number(e.target.value) as 1 | 2 | 3)}>
              <option value={1}>Beginner</option>
              <option value={2}>Explorer</option>
              <option value={3}>Master</option>
            </select>
          </label>
          <label className="field">
            <span>Language</span>
            <select value={child.language ?? 'en'} onChange={(e) => set('language', e.target.value as Child['language'])}>
              <option value="en">English</option>
              <option value="fr">Français</option>
              <option value="ar">العربية</option>
            </select>
          </label>
        </div>

        <label className="field">
          <span>Home region (the journey across Morocco starts here)</span>
          <select value={child.home_region ?? ''} onChange={(e) => set('home_region', e.target.value || null)}>
            <option value="">Outside Morocco / not sure (start in Marrakech-Safi)</option>
            {REGIONS.map((r) => (
              <option key={r.key} value={r.key}>
                {r.emoji} {r.name}
              </option>
            ))}
          </select>
        </label>

        <fieldset>
          <legend>Buddy (favourite animal)</legend>
          <div className="choice-row">
            {AVATARS.map((a) => (
              <button type="button" key={a.key} className={`chip-btn${child.avatar_key === a.key ? ' on' : ''}`} onClick={() => set('avatar_key', a.key)} aria-pressed={child.avatar_key === a.key}>
                {a.emoji}
              </button>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend>World (theme)</legend>
          <div className="choice-row">
            {themes.map((w) => (
              <button type="button" key={w.key} className={`chip-btn${child.selected_theme === w.key ? ' on' : ''}`} onClick={() => set('selected_theme', w.key)} aria-pressed={child.selected_theme === w.key}>
                {w.emoji} {w.name}
              </button>
            ))}
          </div>
          <small className="hint">{WORLDS.length} worlds + special worlds your child unlocks.</small>
        </fieldset>
        <fieldset>
          <legend>Favourite colour</legend>
          <div className="choice-row">
            {FAVORITE_COLORS.map((c) => (
              <button type="button" key={c.key} className={`color-dot small${child.favorite_color === c.key ? ' on' : ''}`} style={{ background: c.hex }} onClick={() => set('favorite_color', c.key)} aria-label={c.key} aria-pressed={child.favorite_color === c.key} />
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend>Interests (up to 2)</legend>
          <div className="choice-row">
            {ISLANDS.map((i) => (
              <button type="button" key={i.key} className={`chip-btn${child.interests.includes(i.key) ? ' on' : ''}`} onClick={() => toggleInterest(i.key)} aria-pressed={child.interests.includes(i.key)}>
                {i.emoji} {LABELS[i.key]}
              </button>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend>Learning style</legend>
          <div className="choice-row">
            {LEARNING_STYLES.map((s) => (
              <button type="button" key={s.key} className={`chip-btn${child.learning_style === s.key ? ' on' : ''}`} onClick={() => set('learning_style', s.key)} aria-pressed={child.learning_style === s.key}>
                {s.emoji} {LABELS[s.key]}
              </button>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend>Rug style</legend>
          <div className="choice-row">
            {RUG_STYLES.map((s) => (
              <button type="button" key={s.key} className={`chip-btn${child.rug_style === s.key ? ' on' : ''}`} onClick={() => set('rug_style', s.key)} aria-pressed={child.rug_style === s.key}>
                {s.emoji} {LABELS[s.key]}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend>🔐 Secret picture pattern</legend>
          <p className="hint">
            {child.name} opens their own world with a secret picture pattern. You never see it; if it is forgotten, reset it and
            create a new one together.
          </p>
          <button type="button" className="btn ghost" onClick={resetPattern}>
            Reset secret pattern
          </button>
          {patternMsg && <p className="good">{patternMsg}</p>}
        </fieldset>

        {error && <p className="error">{error}</p>}
        {saved && <p className="good">✅ Saved. {child.name}’s world is updated.</p>}
        <div className="step-nav">
          <button type="button" className="btn danger" onClick={remove}>
            🗑 Delete profile
          </button>
          <button className="btn primary" disabled={!child.interests.length}>
            Save changes
          </button>
        </div>
      </form>
    </Layout>
  )
}

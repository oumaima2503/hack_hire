import { useEffect, useRef, useState, type CSSProperties, type FormEvent, type MouseEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { api, type AgeBand, type Lang } from '../api'
import { useAuth } from '../auth'
import { AuthForms } from '../components/AuthForms'
import { ExplorerCard } from '../components/ExplorerCard'
import { Layout } from '../components/Layout'
import { Rugy, type Mood } from '../components/Rugy'
import {
  AGES, AVATARS, CHALLENGES, FAVORITE_COLORS, ISLANDS, LEARNING_STYLES, REGIONS, RUG_STYLES, WORLDS, ageBand, avatarEmoji, levelFromScore,
} from '../content'
import { confetti, confettiFrom, sfx, speak, stopSpeaking } from '../fun'
import { LANG_FLAGS, LANG_NAMES, useI18n, type I18nKey } from '../i18n'
import { useSession, useTrack } from '../state'

const STOPS = ['🔑', '🧭', '🎂', '🏝️', '🌍', '🎨', '🧩', '💬']
const RUGY_LINES: I18nKey[] = ['s0_rugy', 's1_rugy', 's2_rugy', 's3_rugy', 'sw_rugy', 'sl_rugy', 's4_rugy', 's5_rugy']
const TITLES: I18nKey[] = ['s0_title', 's1_title', 's2_title', 's3_title', 'sw_title', 'sl_title', 's4_title', 's5_title']

export default function Onboarding() {
  const { session, update, reset } = useSession()
  const { parent, loading } = useAuth()
  const { t, lang } = useI18n()
  const track = useTrack()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const step = parent ? session.step : 0
  const lastTracked = useRef<number | null>(null)
  const handledNew = useRef(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mood, setMood] = useState<Mood>('happy')

  useEffect(() => {
    if (loading || handledNew.current || params.get('new') !== '1') return
    handledNew.current = true
    reset()
    if (parent) update({ step: 1 })
    navigate('/onboarding', { replace: true })
  }, [loading, params, parent, reset, update, navigate])

  // Track the step, and have Rugy read it out loud (for children who can't read yet).
  useEffect(() => {
    if (loading || lastTracked.current === step) return
    lastTracked.current = step
    track('step_viewed', step)
    window.scrollTo({ top: 0, behavior: 'smooth' })
    if (step > 0) speak(`${t(RUGY_LINES[step])} ${t(TITLES[step])}`, lang)
  }, [step, track, loading, t, lang])

  useEffect(() => stopSpeaking, [])

  const cheer = () => {
    sfx.yay()
    confetti()
    setMood('wow')
    setTimeout(() => setMood('happy'), 1200)
  }

  const save = async (fn: () => Promise<void>) => {
    setBusy(true)
    setError(null)
    try {
      await fn()
      cheer()
    } catch (e) {
      sfx.oops()
      setError(e instanceof Error ? e.message : t('error_generic'))
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <Layout><p className="loading">{t('loading')}</p></Layout>

  const props = { busy, save, setMood, goBack: step >= 2 ? () => { sfx.whoosh(); update({ step: step - 1 }) } : undefined }
  const world = WORLDS.find((w) => w.key === session.profile.selected_theme)
  const color = FAVORITE_COLORS.find((c) => c.key === session.profile.favorite_color)
  const stageStyle = {
    ...(world ? { '--world-from': world.from, '--world-to': world.to } : {}),
    ...(color ? { '--accent': color.hex } : {}),
  } as CSSProperties

  return (
    <Layout wide>
      <div className="onboarding">
        <section className={`stage${step === 0 ? ' grown-up' : ''}${world ? ' has-world' : ''}${color ? ' has-accent' : ''}`} style={stageStyle}>
          <ol className="trail" aria-label={t('step_label', { n: step })}>
            {STOPS.map((icon, i) => (
              <li key={i} className={i < step ? 'done' : i === step ? 'current' : ''}>
                <span>
                  {i < step ? '✓' : icon}
                  {i === step && step > 0 && (
                    <em className="walker" aria-hidden="true">
                      {avatarEmoji(session.profile.avatar_key)}
                    </em>
                  )}
                </span>
              </li>
            ))}
          </ol>
          <p className="eyebrow">{step === 0 ? `🔑 ${t('grownup_moment')}` : t('step_label', { n: step })}</p>

          <div className="stage-rugy">
            <Rugy size={78} say={t(RUGY_LINES[step])} mood={mood} lang={lang} />
          </div>

          <div className="step-body" key={step}>
            {step === 0 && <StepAccount />}
            {step === 1 && <StepName {...props} />}
            {step === 2 && <StepAge {...props} />}
            {step === 3 && <StepIslands {...props} />}
            {step === 4 && <StepWorld {...props} />}
            {step === 5 && <StepStyle {...props} />}
            {step === 6 && <StepChallenges {...props} />}
            {step === 7 && <StepLanguage {...props} />}
          </div>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
        </section>

        <aside className="card-column">
          <ExplorerCard profile={session.profile} highlight={step} />
        </aside>
      </div>
    </Layout>
  )
}

interface StepProps {
  busy: boolean
  save: (fn: () => Promise<void>) => Promise<void>
  setMood: (m: Mood) => void
  goBack?: () => void
}

/** Next button that never looks "dead": if something is missing it wiggles and says what. */
function Nav({ goBack, busy, missing, label }: { goBack?: () => void; busy: boolean; missing?: string | false; label?: string }) {
  const { t } = useI18n()
  const [hint, setHint] = useState<string | null>(null)
  const [shake, setShake] = useState(0)

  const onNext = (e: MouseEvent) => {
    if (!missing) return
    e.preventDefault()
    sfx.oops()
    setHint(missing)
    setShake((s) => s + 1)
  }

  useEffect(() => {
    if (!missing) setHint(null)
  }, [missing])

  return (
    <div className="step-nav">
      {goBack ? (
        <button type="button" className="btn ghost" onClick={goBack} disabled={busy}>
          ⬅ {t('back')}
        </button>
      ) : (
        <span />
      )}
      <div className="next-wrap">
        {hint && (
          <span className="next-hint" key={shake} role="status">
            {hint}
          </span>
        )}
        <button
          type="submit"
          key={shake}
          className={`btn primary next-btn${missing ? ' waiting' : ' ready'}${shake ? ' shake-once' : ''}`}
          disabled={busy}
          onClick={onNext}
          aria-disabled={!!missing}
        >
          {busy ? '…' : label ?? `${t('next')} ➜`}
        </button>
      </div>
    </div>
  )
}

/** Step 0: the grown-up creates a family account (with consent) or logs in. */
function StepAccount() {
  const { t } = useI18n()
  const { parent, logout } = useAuth()
  const { update, reset } = useSession()
  const track = useTrack()
  const navigate = useNavigate()

  if (parent) {
    return (
      <div className="center-panel">
        <h2>{t('auth_hello', { name: parent.name })}</h2>
        <button
          className="btn primary big"
          onClick={() => {
            sfx.yay()
            track('onboarding_started', 0)
            update({ step: 1 })
          }}
        >
          {t('auth_continue')} ➜
        </button>
        <p className="hint">
          {t('auth_not_you')}{' '}
          <button className="linklike" onClick={async () => { reset(); await logout() }}>
            {t('auth_logout')}
          </button>
        </p>
      </div>
    )
  }

  return (
    <div>
      <h2>{t('s0_title')}</h2>
      <AuthForms
        onDone={(children, mode) => {
          sfx.yay()
          track('onboarding_started', 0, { mode })
          if (mode === 'login' && children.length) navigate('/parent')
          else update({ step: 1 })
        }}
      />
      <div className="step-nav">
        <button
          type="button"
          className="btn ghost"
          onClick={() => {
            track('consent_declined', 0)
            navigate('/')
          }}
        >
          {t('s0_decline')}
        </button>
        <span />
      </div>
    </div>
  )
}

function StepName({ busy, save, goBack, setMood }: StepProps) {
  const { t } = useI18n()
  const { refresh } = useAuth()
  const { session, update, updateProfile } = useSession()
  const [name, setName] = useState(session.profile.name ?? '')
  const [avatar, setAvatar] = useState(session.profile.avatar_key ?? '')
  const trimmed = name.trim()

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!trimmed || !avatar) return
    save(async () => {
      const fields = { name: trimmed, avatar_key: avatar }
      if (session.childId) {
        await api.updateChild(session.childId, fields)
        update({ step: 2 })
      } else {
        const child = await api.createChild(fields) // the parent comes from the session, not the browser
        update({ childId: child.id, step: 2 })
        refresh()
      }
      updateProfile(fields)
    })
  }

  return (
    <form onSubmit={submit}>
      <h2>{t('s1_title')}</h2>
      <input
        className="big-input"
        value={name}
        maxLength={30}
        onChange={(e) => {
          if (e.target.value.length > name.length) sfx.pop()
          setName(e.target.value)
          updateProfile({ name: e.target.value })
          setMood('think')
        }}
        onBlur={() => setMood('happy')}
        placeholder={t('s1_name_ph')}
        autoFocus
        autoComplete="off"
      />
      <p className="sublabel">{t('s1_avatar')}</p>
      <div className="avatar-grid">
        {AVATARS.map((a) => (
          <button
            type="button"
            key={a.key}
            className={`bubble-btn${avatar === a.key ? ' on' : ''}`}
            onClick={(e) => {
              sfx.select()
              confettiFrom(e.currentTarget, [a.emoji, '✨'])
              setAvatar(a.key)
              updateProfile({ avatar_key: a.key })
            }}
            aria-pressed={avatar === a.key}
            aria-label={a.key}
          >
            {a.emoji}
          </button>
        ))}
      </div>
      {trimmed && avatar && (
        <p className="live-hello" key={avatar}>
          <span className="live-hello-buddy">{avatarEmoji(avatar)}</span> {t('hello_name', { name: trimmed })}
        </p>
      )}
      <Nav goBack={goBack} busy={busy} missing={!trimmed ? t('need_name') : !avatar && t('need_pick')} />
    </form>
  )
}

function StepAge({ busy, save, goBack }: StepProps) {
  const { t } = useI18n()
  const { session, update, updateProfile } = useSession()
  const [age, setAge] = useState<number | undefined>(session.profile.age)
  const [region, setRegion] = useState<string | null>(session.profile.home_region ?? null)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!age) return
    save(async () => {
      await api.updateChild(session.childId!, { age, home_region: region })
      updateProfile({ age, age_band: ageBand(age), home_region: region })
      update({ step: 3 })
    })
  }

  return (
    <form onSubmit={submit}>
      <h2>{t('s2_title')}</h2>
      <div className="age-grid">
        {AGES.map((a) => (
          <button
            type="button"
            key={a}
            className={`bubble-btn number${age === a ? ' on' : ''}`}
            onClick={() => {
              sfx.select()
              setAge(a)
            }}
            aria-pressed={age === a}
          >
            {a}
          </button>
        ))}
      </div>
      {age && (
        <div className="cake" key={age} aria-live="polite">
          <span className="candles" aria-hidden="true">{'🕯️'.repeat(age)}</span>
          <span className="cake-emoji" aria-hidden="true">🎂</span>
          <strong>{t('age_cake', { n: age })}</strong>
        </div>
      )}
      <p className="sublabel">📍 {t('region_q')}</p>
      <p className="hint">{t('region_hint')}</p>
      <div className="region-pick" dir="ltr">
        {REGIONS.map((r) => (
          <button
            type="button"
            key={r.key}
            className={`chip-btn${region === r.key ? ' on' : ''}`}
            onClick={() => {
              sfx.select()
              setRegion(r.key)
            }}
            aria-pressed={region === r.key}
          >
            {r.emoji} {r.name}
          </button>
        ))}
        <button
          type="button"
          className={`chip-btn${region === null ? ' on' : ''}`}
          onClick={() => {
            sfx.select()
            setRegion(null)
          }}
          aria-pressed={region === null}
        >
          🌍 {t('region_elsewhere')}
        </button>
      </div>
      <Nav goBack={goBack} busy={busy} missing={!age && t('need_pick')} />
    </form>
  )
}

function StepIslands({ busy, save, goBack }: StepProps) {
  const { t } = useI18n()
  const { session, update, updateProfile } = useSession()
  const [picked, setPicked] = useState<string[]>(session.profile.interests ?? [])

  const toggle = (key: string) => {
    sfx.select()
    setPicked((p) => (p.includes(key) ? p.filter((k) => k !== key) : p.length < 2 ? [...p, key] : [p[1], key]))
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (picked.length !== 2) return
    save(async () => {
      await api.updateChild(session.childId!, { interests: picked })
      updateProfile({ interests: picked })
      update({ step: 4 })
    })
  }

  return (
    <form onSubmit={submit}>
      <h2>{t('s3_title')}</h2>
      <div className="island-grid">
        {ISLANDS.map((i) => {
          const on = picked.includes(i.key)
          return (
            <button
              type="button"
              key={i.key}
              className={`island${on ? ' on' : ''}`}
              style={{ ['--island' as string]: i.color }}
              onClick={() => toggle(i.key)}
              aria-pressed={on}
            >
              <span className="island-emoji">{i.emoji}</span>
              <span>{t(`i_${i.key}` as I18nKey)}</span>
              {on && <span className="island-order">{picked.indexOf(i.key) + 1}</span>}
            </button>
          )
        })}
      </div>
      <p className="hint center big-count">
        {[0, 1].map((n) => (
          <span key={n} className={picked.length > n ? 'filled' : ''}>
            {picked.length > n ? ISLANDS.find((i) => i.key === picked[n])?.emoji : '❔'}
          </span>
        ))}
      </p>
      <Nav goBack={goBack} busy={busy} missing={picked.length !== 2 && t('need_two')} />
    </form>
  )
}

function StepWorld({ busy, save, goBack }: StepProps) {
  const { t } = useI18n()
  const { session, update, updateProfile } = useSession()
  const [world, setWorld] = useState(session.profile.selected_theme ?? '')
  const [color, setColor] = useState(session.profile.favorite_color ?? '')

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!world || !color) return
    save(async () => {
      await api.updateChild(session.childId!, { selected_theme: world, favorite_color: color })
      updateProfile({ selected_theme: world, favorite_color: color })
      update({ step: 5 })
    })
  }

  return (
    <form onSubmit={submit}>
      <h2>{t('sw_title')}</h2>
      <div className="world-grid">
        {WORLDS.map((w) => (
          <button
            type="button"
            key={w.key}
            className={`world${world === w.key ? ' on' : ''}`}
            style={{ background: `linear-gradient(160deg, ${w.from}, ${w.to})` }}
            onClick={(e) => {
              sfx.whoosh()
              confettiFrom(e.currentTarget, [w.emoji, '✨'])
              setWorld(w.key)
              updateProfile({ selected_theme: w.key }) // the whole page takes this world's colours
            }}
            aria-pressed={world === w.key}
          >
            <span className="world-emoji">{w.emoji}</span>
            <span>{t(`w_${w.key}` as I18nKey)}</span>
          </button>
        ))}
      </div>
      <p className="sublabel">{t('sw_color')}</p>
      <div className="color-row">
        {FAVORITE_COLORS.map((c) => (
          <button
            type="button"
            key={c.key}
            className={`color-dot${color === c.key ? ' on' : ''}`}
            style={{ background: c.hex }}
            onClick={() => {
              sfx.select()
              setColor(c.key)
              updateProfile({ favorite_color: c.key })
            }}
            aria-pressed={color === c.key}
            aria-label={c.key}
          />
        ))}
      </div>
      <Nav goBack={goBack} busy={busy} missing={(!world || !color) && t('need_pick')} />
    </form>
  )
}

function StepStyle({ busy, save, goBack }: StepProps) {
  const { t } = useI18n()
  const { session, update, updateProfile } = useSession()
  const [learn, setLearn] = useState(session.profile.learning_style ?? '')
  const [rug, setRug] = useState(session.profile.rug_style ?? '')

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!learn || !rug) return
    save(async () => {
      const patch = { learning_style: learn as 'watch' | 'listen' | 'do', rug_style: rug }
      await api.updateChild(session.childId!, patch)
      updateProfile(patch)
      update({ step: 6 })
    })
  }

  return (
    <form onSubmit={submit}>
      <h2>{t('sl_title')}</h2>
      <div className="lang-grid">
        {LEARNING_STYLES.map((s) => (
          <button
            type="button"
            key={s.key}
            className={`lang-tile${learn === s.key ? ' on' : ''}`}
            onClick={() => {
              sfx.select()
              setLearn(s.key)
            }}
            aria-pressed={learn === s.key}
          >
            <span className={`lang-flag style-${s.key}`}>{s.emoji}</span>
            {t(`ls_${s.key}` as I18nKey)}
          </button>
        ))}
      </div>
      <p className="sublabel">{t('sl_rug')}</p>
      <div className="rugstyle-grid">
        {RUG_STYLES.map((s) => (
          <button
            type="button"
            key={s.key}
            className={`rugstyle${rug === s.key ? ' on' : ''}`}
            onClick={() => {
              sfx.select()
              setRug(s.key)
            }}
            aria-pressed={rug === s.key}
          >
            <span className="rugstyle-preview" dir="ltr">{s.preview}</span>
            <span>{t(`rs_${s.key}` as I18nKey)}</span>
          </button>
        ))}
      </div>
      <Nav goBack={goBack} busy={busy} missing={(!learn || !rug) && t('need_pick')} />
    </form>
  )
}

function StepChallenges({ busy, save, goBack, setMood }: StepProps) {
  const { t } = useI18n()
  const { session, update, updateProfile } = useSession()
  const challenges = CHALLENGES[(session.profile.age_band ?? '6-8') as AgeBand]
  const [index, setIndex] = useState(0)
  const [correct, setCorrect] = useState(0)
  const [feedback, setFeedback] = useState<{ choice: string; ok: boolean } | null>(null)
  const done = index >= challenges.length
  const level = levelFromScore(correct)

  const answer = (choice: string, el: HTMLElement) => {
    if (feedback) return
    const ok = choice === challenges[index].answer
    setFeedback({ choice, ok })
    if (ok) {
      sfx.yay()
      confettiFrom(el)
      setCorrect((c) => c + 1)
      setMood('wow')
    } else {
      sfx.oops()
      setMood('think')
    }
    setTimeout(() => {
      setFeedback(null)
      setMood('happy')
      setIndex((i) => i + 1)
    }, 1200)
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    save(async () => {
      await api.updateChild(session.childId!, { level })
      updateProfile({ level })
      update({ step: 7 })
    })
  }

  if (done) {
    return (
      <form onSubmit={submit} className="level-reveal">
        <div className="confetti" aria-hidden="true">🎉</div>
        <p className="muted">{t('s4_level')}</p>
        <h2 className="level-name">
          <span className="stars">{'★'.repeat(level)}{'☆'.repeat(3 - level)}</span>
          {t(`level_${level}` as I18nKey)}
        </h2>
        <Nav goBack={goBack} busy={busy} />
      </form>
    )
  }

  const c = challenges[index]
  return (
    <div>
      <h2>{t('s4_title')}</h2>
      <div className="challenge-dots" aria-label={t('s4_progress', { n: index + 1, total: challenges.length })}>
        {challenges.map((_, i) => (
          <span key={i} className={i < index ? 'done' : i === index ? 'now' : ''} />
        ))}
      </div>
      <div className="challenge" key={index}>
        <p className="challenge-q">{t(c.prompt as I18nKey)}</p>
        {c.visual && (
          <p className="challenge-visual" dir="ltr">
            {c.visual}
          </p>
        )}
        <div className="challenge-options">
          {c.options.map((o) => (
            <button
              type="button"
              key={o}
              className={`bubble-btn number${feedback?.choice === o ? (feedback.ok ? ' right' : ' wrong') : ''}${feedback && !feedback.ok && o === c.answer ? ' reveal' : ''}`}
              onClick={(e) => answer(o, e.currentTarget)}
              disabled={!!feedback}
            >
              {o}
            </button>
          ))}
        </div>
        <p className="challenge-feedback" aria-live="polite">
          {feedback ? (feedback.ok ? `✨ ${t('s4_great')}` : `💪 ${t('s4_try')}`) : ' '}
        </p>
      </div>
      {goBack && (
        <div className="step-nav">
          <button type="button" className="btn ghost" onClick={goBack}>
            ⬅ {t('back')}
          </button>
          <span />
        </div>
      )}
    </div>
  )
}

function StepLanguage({ busy, save, goBack }: StepProps) {
  const { t, setLang } = useI18n()
  const { session, updateProfile } = useSession()
  const track = useTrack()
  const navigate = useNavigate()

  const choose = (language: Lang) =>
    save(async () => {
      await api.updateChild(session.childId!, { language })
      updateProfile({ language })
      setLang(language)
      track('onboarding_completed', 7, { language })
      setTimeout(() => navigate(`/play/${session.childId}`), 700) // let the confetti fly first
    })

  return (
    <div>
      <h2>{t('s5_title')}</h2>
      <div className="lang-grid">
        {(['ar', 'fr', 'en'] as Lang[]).map((l) => (
          <button
            key={l}
            className={`lang-tile${session.profile.language === l ? ' on' : ''}`}
            onClick={() => choose(l)}
            disabled={busy}
            lang={l}
          >
            <span className="lang-flag">{LANG_FLAGS[l]}</span>
            {LANG_NAMES[l]}
          </button>
        ))}
      </div>
      {goBack && (
        <div className="step-nav">
          <button type="button" className="btn ghost" onClick={goBack} disabled={busy}>
            ⬅ {t('back')}
          </button>
          <span />
        </div>
      )}
    </div>
  )
}

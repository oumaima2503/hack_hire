import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, type AgeBand, type Lang } from '../api'
import { ExplorerCard } from '../components/ExplorerCard'
import { Layout } from '../components/Layout'
import { Rugy } from '../components/Rugy'
import { AGES, AVATARS, CHALLENGES, ISLANDS, ageBand, levelFromScore } from '../content'
import { LANG_FLAGS, LANG_NAMES, useI18n, type I18nKey } from '../i18n'
import { useSession, useTrack } from '../state'

const STOPS = ['🔑', '🧭', '🎂', '🏝️', '🧩', '💬']
const RUGY_LINES: I18nKey[] = ['s0_rugy', 's1_rugy', 's2_rugy', 's3_rugy', 's4_rugy', 's5_rugy']

export default function Onboarding() {
  const { session, update } = useSession()
  const { t } = useI18n()
  const track = useTrack()
  const step = session.parentId ? session.step : 0
  const lastTracked = useRef<number | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (lastTracked.current === step) return
    lastTracked.current = step
    track('step_viewed', step)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [step, track])

  /** Runs a save; on success moves the expedition forward. */
  const save = async (fn: () => Promise<void>) => {
    setBusy(true)
    setError(null)
    try {
      await fn()
    } catch (e) {
      setError(e instanceof Error ? e.message : t('error_generic'))
    } finally {
      setBusy(false)
    }
  }

  const props = { busy, save, goBack: step >= 2 ? () => update({ step: step - 1 }) : undefined }

  return (
    <Layout wide>
      <div className="onboarding">
        <section className={`stage${step === 0 ? ' grown-up' : ''}`}>
          <ol className="trail" aria-label={t('step_label', { n: step })}>
            {STOPS.map((icon, i) => (
              <li key={i} className={i < step ? 'done' : i === step ? 'current' : ''}>
                <span>{i < step ? '✓' : icon}</span>
              </li>
            ))}
          </ol>
          <p className="eyebrow">{step === 0 ? `🔑 ${t('grownup_moment')}` : t('step_label', { n: step })}</p>

          <div className="stage-rugy">
            <Rugy size={72} say={t(RUGY_LINES[step])} />
          </div>

          <div className="step-body" key={step}>
            {step === 0 && <StepConsent {...props} />}
            {step === 1 && <StepName {...props} />}
            {step === 2 && <StepAge {...props} />}
            {step === 3 && <StepIslands {...props} />}
            {step === 4 && <StepChallenges {...props} />}
            {step === 5 && <StepLanguage {...props} />}
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
  goBack?: () => void
}

function Nav({ goBack, busy, disabled, label }: { goBack?: () => void; busy: boolean; disabled?: boolean; label?: string }) {
  const { t } = useI18n()
  return (
    <div className="step-nav">
      {goBack ? (
        <button type="button" className="btn ghost" onClick={goBack} disabled={busy}>
          {t('back')}
        </button>
      ) : (
        <span />
      )}
      <button type="submit" className="btn primary" disabled={busy || disabled}>
        {busy ? '…' : label ?? t('next')}
      </button>
    </div>
  )
}

function StepConsent({ busy, save }: StepProps) {
  const { t } = useI18n()
  const { update } = useSession()
  const track = useTrack()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [consent, setConsent] = useState(false)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    save(async () => {
      const parent = await api.createParent(email, consent)
      track('onboarding_started', 0)
      update({ parentId: parent.id, step: 1 })
    })
  }

  return (
    <form onSubmit={submit}>
      <h2>{t('s0_title')}</h2>
      <label className="field">
        <span>{t('s0_email')}</span>
        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="parent@example.com" autoComplete="email" />
      </label>
      <label className="consent">
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
        <span>{t('s0_consent')}</span>
      </label>
      <p className="hint">🔒 {t('s0_privacy')}</p>
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
        <button type="submit" className="btn primary" disabled={busy || !consent || !email}>
          {busy ? '…' : t('s0_submit')}
        </button>
      </div>
    </form>
  )
}

function StepName({ busy, save, goBack }: StepProps) {
  const { t } = useI18n()
  const { session, update, updateProfile } = useSession()
  const [name, setName] = useState(session.profile.name ?? '')
  const [avatar, setAvatar] = useState(session.profile.avatar_key ?? '')

  const submit = (e: FormEvent) => {
    e.preventDefault()
    save(async () => {
      const fields = { name: name.trim(), avatar_key: avatar }
      if (session.childId) {
        await api.updateChild(session.childId, fields)
        update({ step: 2 })
      } else {
        const child = await api.createChild({ parent_id: session.parentId!, ...fields })
        update({ childId: child.id, step: 2 })
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
          setName(e.target.value)
          updateProfile({ name: e.target.value })
        }}
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
            onClick={() => {
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
      <Nav goBack={goBack} busy={busy} disabled={!name.trim() || !avatar} />
    </form>
  )
}

function StepAge({ busy, save, goBack }: StepProps) {
  const { t } = useI18n()
  const { session, update, updateProfile } = useSession()
  const [age, setAge] = useState<number | undefined>(session.profile.age)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!age) return
    const band = ageBand(age)
    save(async () => {
      await api.updateChild(session.childId!, { age_band: band })
      updateProfile({ age, age_band: band })
      update({ step: 3 })
    })
  }

  return (
    <form onSubmit={submit}>
      <h2>{t('s2_title')}</h2>
      <div className="age-grid">
        {AGES.map((a) => (
          <button type="button" key={a} className={`bubble-btn number${age === a ? ' on' : ''}`} onClick={() => setAge(a)} aria-pressed={age === a}>
            {a}
          </button>
        ))}
      </div>
      <Nav goBack={goBack} busy={busy} disabled={!age} />
    </form>
  )
}

function StepIslands({ busy, save, goBack }: StepProps) {
  const { t } = useI18n()
  const { session, update, updateProfile } = useSession()
  const [picked, setPicked] = useState<string[]>(session.profile.interests ?? [])

  const toggle = (key: string) =>
    setPicked((p) => (p.includes(key) ? p.filter((k) => k !== key) : p.length < 2 ? [...p, key] : [p[1], key]))

  const submit = (e: FormEvent) => {
    e.preventDefault()
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
      <p className="hint center">{t('s3_count', { n: picked.length })}</p>
      <Nav goBack={goBack} busy={busy} disabled={picked.length !== 2} />
    </form>
  )
}

function StepChallenges({ busy, save, goBack }: StepProps) {
  const { t } = useI18n()
  const { session, update, updateProfile } = useSession()
  const challenges = CHALLENGES[(session.profile.age_band ?? '6-8') as AgeBand]
  const [index, setIndex] = useState(0)
  const [correct, setCorrect] = useState(0)
  const [feedback, setFeedback] = useState<{ choice: string; ok: boolean } | null>(null)
  const done = index >= challenges.length
  const level = levelFromScore(correct)

  const answer = (choice: string) => {
    if (feedback) return
    const ok = choice === challenges[index].answer
    setFeedback({ choice, ok })
    if (ok) setCorrect((c) => c + 1)
    setTimeout(() => {
      setFeedback(null)
      setIndex((i) => i + 1)
    }, 1100)
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    save(async () => {
      await api.updateChild(session.childId!, { level })
      updateProfile({ level })
      update({ step: 5 })
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
      <p className="eyebrow">{t('s4_progress', { n: index + 1, total: challenges.length })}</p>
      <div className="challenge">
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
              onClick={() => answer(o)}
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
            {t('back')}
          </button>
          <span />
        </div>
      )}
    </div>
  )
}

function StepLanguage({ busy, save, goBack }: StepProps) {
  const { t, setLang } = useI18n()
  const { session, update, updateProfile } = useSession()
  const track = useTrack()
  const navigate = useNavigate()

  const choose = (language: Lang) =>
    save(async () => {
      await api.updateChild(session.childId!, { language })
      updateProfile({ language })
      setLang(language)
      track('onboarding_completed', 5, { language })
      update({ step: 5 })
      navigate('/adventure')
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
            {t('back')}
          </button>
          <span />
        </div>
      )}
    </div>
  )
}

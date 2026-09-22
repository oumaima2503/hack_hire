import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout } from '../components/Layout'
import { Rugy } from '../components/Rugy'
import { useI18n } from '../i18n'
import { useSession, useTrack } from '../state'

export default function Landing() {
  const { t } = useI18n()
  const { session, reset } = useSession()
  const track = useTrack()
  const navigate = useNavigate()
  const logged = useRef(false)

  useEffect(() => {
    if (logged.current) return
    logged.current = true
    track('landing_viewed', undefined, { variant: session.variant })
  }, [track, session.variant])

  const inProgress = !!session.childId && session.step > 0 && !session.orderId

  const start = () => {
    // A finished expedition starts a new session; an unfinished one resumes.
    if (session.orderId) reset()
    navigate('/onboarding')
  }

  return (
    <Layout>
      <div className="landing">
        <section className="hero">
          <h1>{t('hero_title')}</h1>
          <p className="lead">{t('hero_sub')}</p>

          <div className="feature-list">
            {[
              ['🗺️', 'feat1_t', 'feat1_d'],
              ['🧵', 'feat2_t', 'feat2_d'],
              ['🎨', 'feat3_t', 'feat3_d'],
            ].map(([icon, title, desc]) => (
              <div className="feature" key={title}>
                <span className="feature-icon">{icon}</span>
                <div>
                  <h3>{t(title as 'feat1_t')}</h3>
                  <p>{t(desc as 'feat1_d')}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="gate-card">
          <Rugy size={110} say={t('rugy_hello')} />
          <ol className="how">
            <li>🧭 {t('how1')}</li>
            <li>🏝️ {t('how2')}</li>
            <li>📦 {t('how3')}</li>
          </ol>
          <button className="btn primary big" onClick={start}>
            {inProgress ? t('cta_resume') : t('cta_start')}
          </button>
          <p className="hint">{t('cta_hint')}</p>
          <div className="trust">
            <span>🛡️ {t('trust_3')}</span>
            <span>🇲🇦 {t('trust_2')}</span>
            <span>🧶 {t('trust_1')}</span>
          </div>
        </section>
      </div>
    </Layout>
  )
}

import { Link, Navigate, useNavigate } from 'react-router-dom'
import { ExplorerCard } from '../components/ExplorerCard'
import { Layout } from '../components/Layout'
import { Rugy } from '../components/Rugy'
import { useI18n } from '../i18n'
import { useSession } from '../state'

export default function Confirmed() {
  const { t } = useI18n()
  const { session, reset } = useSession()
  const navigate = useNavigate()

  if (!session.transactionRef) return <Navigate to="/" replace />

  return (
    <Layout>
      <div className="confirmed panel">
        <div className="confetti big" aria-hidden="true">🎉📦✨</div>
        <Rugy size={100} />
        <h1>{t('k_title')}</h1>
        <p className="lead dark">{t('k_sub', { name: session.profile.name ?? '' })}</p>
        <p className="ref">
          {t('k_ref')}: <code>{session.transactionRef}</code>
        </p>
        <div className="confirmed-card">
          <ExplorerCard profile={session.profile} />
        </div>
        <div className="result-cta">
          <Link to={`/parent-test?child=${session.childId}`} className="btn ghost">
            {t('r_parent_test')}
          </Link>
          <button
            className="btn primary"
            onClick={() => {
              const childId = session.childId
              reset()
              navigate(childId ? `/play/${childId}` : '/')
            }}
          >
            {t('k_again')}
          </button>
        </div>
      </div>
    </Layout>
  )
}

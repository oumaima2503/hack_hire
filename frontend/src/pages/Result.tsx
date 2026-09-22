import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { api, type Proposal, type Variant } from '../api'
import { Layout } from '../components/Layout'
import { ProposalView, formatPrice } from '../components/ProposalView'
import { Rugy } from '../components/Rugy'
import { useI18n } from '../i18n'
import { useSession, useTrack } from '../state'

export default function Result() {
  const { t, lang } = useI18n()
  const { session, update } = useSession()
  const track = useTrack()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const variant: Variant = (params.get('variant') as Variant) === 'generic' ? 'generic' : session.variant
  const childId = params.get('child') || session.childId
  const [proposal, setProposal] = useState<Proposal | null>(null)
  const [error, setError] = useState(false)
  const tracked = useRef(false)

  useEffect(() => {
    if (!childId) return
    setError(false)
    api.proposal(childId, variant, lang).then(setProposal, () => setError(true))
  }, [childId, variant, lang])

  useEffect(() => {
    if (!proposal || tracked.current) return
    tracked.current = true
    track('result_viewed', undefined, { variant, adventure: proposal.adventure.slug })
  }, [proposal, variant, track])

  if (!childId) return <Navigate to="/onboarding" replace />

  return (
    <Layout wide>
      {error && <p className="error">{t('error_generic')}</p>}
      {!proposal && !error && <p className="loading">{t('loading')}</p>}
      {proposal && (
        <div className="result">
          <header className="result-head">
            <Rugy size={80} />
            <div>
              <h1>{t('r_ready', { name: proposal.child.name })}</h1>
              <p className="lead dark">{t('r_sub')}</p>
            </div>
          </header>

          <ProposalView proposal={proposal} />

          <div className="result-cta">
            <button
              className="btn primary big"
              onClick={() => {
                update({ variant, childId, orderId: undefined, transactionRef: undefined })
                navigate('/checkout')
              }}
            >
              {t('r_cta', { price: formatPrice(proposal.box) })}
            </button>
            <Link to={`/parent-test?child=${childId}`} className="link">
              {t('r_parent_test')}
            </Link>
          </div>
        </div>
      )}
    </Layout>
  )
}

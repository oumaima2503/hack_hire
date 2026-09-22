import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api, type Proposal, type Variant } from '../api'
import { Layout } from '../components/Layout'
import { ProposalView } from '../components/ProposalView'
import { useI18n } from '../i18n'
import { useSession, useTrack } from '../state'

/**
 * Blind relevance test (D1.2): the parent sees the personalised and the generic
 * screen for their own child, in random order, without labels, and rates each 1-5.
 */
export default function ParentTest() {
  const { t, lang } = useI18n()
  const { session } = useSession()
  const track = useTrack()
  const [params] = useSearchParams()
  const childId = params.get('child') || session.childId
  const [order] = useState<Variant[]>(() => (Math.random() < 0.5 ? ['personalised', 'generic'] : ['generic', 'personalised']))
  const [proposals, setProposals] = useState<Partial<Record<Variant, Proposal>>>({})
  const [phase, setPhase] = useState<'intro' | 0 | 1 | 'done'>('intro')
  const [scores, setScores] = useState<Partial<Record<Variant, number>>>({})
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!childId) return
    Promise.all(order.map((v) => api.proposal(childId, v, lang)))
      .then(([a, b]) => setProposals({ [order[0]]: a, [order[1]]: b }))
      .catch(() => setError(t('error_generic')))
  }, [childId, order, lang, t])

  const submit = async () => {
    setBusy(true)
    setError(null)
    try {
      await api.rate(
        childId!,
        order.map((v, i) => ({ variant_shown: v, shown_order: (i + 1) as 1 | 2, score: scores[v]! })),
      )
      track('rating_submitted', undefined, { first_shown: order[0] })
      setPhase('done')
    } catch (e) {
      setError(e instanceof Error ? e.message : t('error_generic'))
    } finally {
      setBusy(false)
    }
  }

  let body
  if (!childId) {
    body = <p className="panel">{t('p_no_child')}</p>
  } else if (phase === 'intro') {
    body = (
      <div className="panel center-panel">
        <h1>👨‍👩‍👧 {t('p_title')}</h1>
        <p className="lead dark">{t('p_intro')}</p>
        <button className="btn primary big" onClick={() => setPhase(0)} disabled={!proposals[order[1]]}>
          {proposals[order[1]] ? t('p_start') : t('loading')}
        </button>
      </div>
    )
  } else if (phase === 'done') {
    body = (
      <div className="panel center-panel">
        <div className="confetti big">💛</div>
        <h1>{t('p_thanks')}</h1>
      </div>
    )
  } else {
    const variant = order[phase]
    const letter = phase === 0 ? 'A' : 'B'
    body = (
      <div className="parent-test">
        <p className="eyebrow">{t('p_proposal', { x: letter })}</p>
        <ProposalView proposal={proposals[variant]!} compact />
        <div className="panel rating">
          <h2>{t('p_question')}</h2>
          <div className="rating-scale" role="radiogroup">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                role="radio"
                aria-checked={scores[variant] === n}
                className={`bubble-btn number${scores[variant] === n ? ' on' : ''}`}
                onClick={() => setScores((s) => ({ ...s, [variant]: n }))}
              >
                {n}
              </button>
            ))}
          </div>
          <div className="rating-labels">
            <span>{t('p_low')}</span>
            <span>{t('p_high')}</span>
          </div>
          {phase === 0 ? (
            <button className="btn primary" disabled={!scores[variant]} onClick={() => { setPhase(1); window.scrollTo({ top: 0 }) }}>
              {t('p_next')}
            </button>
          ) : (
            <button className="btn primary" disabled={!scores[variant] || busy} onClick={submit}>
              {busy ? '…' : t('p_submit')}
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <Layout wide>
      {body}
      {error && <p className="error">{error}</p>}
    </Layout>
  )
}

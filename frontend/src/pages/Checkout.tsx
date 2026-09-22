import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { api, type Proposal } from '../api'
import { Layout } from '../components/Layout'
import { formatPrice } from '../components/ProposalView'
import { ADVENTURE_ART, BOX_EMOJI } from '../content'
import { useI18n } from '../i18n'
import { useSession, useTrack } from '../state'

export default function Checkout() {
  const { t, lang } = useI18n()
  const { session, update } = useSession()
  const track = useTrack()
  const navigate = useNavigate()
  const [proposal, setProposal] = useState<Proposal | null>(null)
  const [form, setForm] = useState({ full_name: '', line1: '', city: '', postal_code: '', country: t('c_country_default') })
  const [paying, setPaying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const tracked = useRef(false)

  useEffect(() => {
    if (!session.childId) return
    api.proposal(session.childId, session.variant, lang).then(setProposal, () => setError(t('error_generic')))
  }, [session.childId, session.variant, lang, t])

  useEffect(() => {
    if (tracked.current || !session.childId) return
    tracked.current = true
    track('checkout_started', undefined, { variant: session.variant })
  }, [track, session.variant, session.childId])

  if (!session.childId) return <Navigate to="/onboarding" replace />

  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const pay = async (e: FormEvent) => {
    e.preventDefault()
    setPaying(true)
    setError(null)
    try {
      const { full_name, ...address } = form
      const order = session.orderId
        ? { id: session.orderId }
        : await api.createOrder({ child_id: session.childId!, variant: session.variant, full_name, shipping_address: address })
      update({ orderId: order.id })
      await new Promise((r) => setTimeout(r, 1400)) // simulated Payzone redirect
      const res = await api.pay(order.id)
      track('order_confirmed', undefined, { variant: session.variant, amount: res.order.amount })
      update({ transactionRef: res.transaction_ref })
      navigate('/confirmed')
    } catch (err) {
      setError(err instanceof Error ? err.message : t('error_generic'))
      setPaying(false)
    }
  }

  const art = proposal ? ADVENTURE_ART[proposal.adventure.slug] : null

  return (
    <Layout wide>
      <div className="checkout">
        <form className="panel checkout-form" onSubmit={pay}>
          <p className="eyebrow">🔑 {t('grownup_moment')}</p>
          <h1>{t('c_title')}</h1>
          <p className="demo-banner">🧪 {t('c_demo')}</p>

          <label className="field">
            <span>{t('c_full_name')}</span>
            <input required minLength={2} value={form.full_name} onChange={set('full_name')} autoComplete="name" />
          </label>
          <label className="field">
            <span>{t('c_address')}</span>
            <input required value={form.line1} onChange={set('line1')} autoComplete="street-address" />
          </label>
          <div className="field-row">
            <label className="field">
              <span>{t('c_city')}</span>
              <input required value={form.city} onChange={set('city')} autoComplete="address-level2" />
            </label>
            <label className="field">
              <span>{t('c_postal')}</span>
              <input value={form.postal_code} onChange={set('postal_code')} autoComplete="postal-code" />
            </label>
          </div>
          <label className="field">
            <span>{t('c_country')}</span>
            <input required value={form.country} onChange={set('country')} autoComplete="country-name" />
          </label>

          {error && <p className="error">{error}</p>}
          <button className="btn payzone big" disabled={paying || !proposal}>
            {paying ? t('c_processing') : t('c_pay', { price: proposal ? formatPrice(proposal.box) : '' })}
          </button>
          <p className="hint center">🔒 Payzone · DEMO</p>
        </form>

        {proposal && art && (
          <aside className="panel summary">
            <p className="eyebrow">{t('c_summary')}</p>
            <div className="summary-cover" style={{ background: `linear-gradient(135deg, ${art.from}, ${art.to})` }}>
              <span>{art.emoji}</span>
              <strong>{proposal.adventure.title}</strong>
            </div>
            <ul className="box-items">
              {proposal.box.items.map((i) => (
                <li key={i.id}>
                  <span className="box-emoji">{BOX_EMOJI[i.interest_tag] ?? '🎁'}</span>
                  {i.name}
                </li>
              ))}
            </ul>
            <div className="total">
              <span>{t('c_total')}</span>
              <strong>{formatPrice(proposal.box)}</strong>
            </div>
          </aside>
        )}
      </div>
    </Layout>
  )
}

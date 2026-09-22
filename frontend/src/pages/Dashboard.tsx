import { useEffect, useState } from 'react'
import { api, type Dashboard as Data } from '../api'
import { Layout } from '../components/Layout'

const pct = (x: number | null | undefined) => (x == null ? '—' : `${Math.round(x * 100)}%`)
const num = (x: number | null | undefined, d = 2) => (x == null ? '—' : x.toFixed(d))

/** Team dashboard: funnel drop-off per step + evidence against the D1.2 thresholds. */
export default function Dashboard() {
  const [data, setData] = useState<Data | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = () => api.dashboard().then(setData, (e) => setError(e.message))
    load()
    const id = setInterval(load, 10000)
    return () => clearInterval(id)
  }, [])

  if (error) return <Layout wide><p className="error">{error}</p></Layout>
  if (!data) return <Layout wide><p className="loading">Loading…</p></Layout>

  const { thresholds: th, completion, relevance, funnel, orders } = data
  const top = Math.max(1, ...funnel.map((f) => f.sessions))
  const runs = funnel.find((f) => f.event === 'onboarding_started')?.sessions ?? 0

  const kpis = [
    { label: 'Onboarding completion', value: pct(completion.rate), sub: `${completion.completed} / ${completion.started} started · target ≥ ${pct(th.completion_rate)}`, ok: completion.rate != null ? completion.rate >= th.completion_rate : null },
    { label: 'Relevance gap (pers. − generic)', value: relevance.gap == null ? '—' : `${relevance.gap >= 0 ? '+' : ''}${num(relevance.gap)}`, sub: `target ≥ +${th.relevance_gap} point`, ok: relevance.gap != null ? relevance.gap >= th.relevance_gap : null },
    { label: 'Parent testers', value: String(relevance.testers), sub: `target ≥ ${th.min_testers}`, ok: relevance.testers >= th.min_testers },
    { label: 'Funnel runs', value: String(runs), sub: `target ≥ ${th.min_runs}`, ok: runs >= th.min_runs },
    { label: 'Orders confirmed', value: String(orders.confirmed), sub: `${orders.revenue.toFixed(0)} MAD (demo) · P ${orders.by_variant.personalised} / G ${orders.by_variant.generic}`, ok: null },
  ]

  return (
    <Layout wide>
      <div className="dashboard">
        <header className="dash-head">
          <h1>Funnel dashboard</h1>
          <span className={`badge ${data.storage}`}>storage: {data.storage}</span>
        </header>

        <div className="kpis">
          {kpis.map((k) => (
            <div key={k.label} className={`kpi panel ${k.ok === true ? 'pass' : k.ok === false ? 'fail' : ''}`}>
              <p className="kpi-label">{k.label}</p>
              <p className="kpi-value">{k.value}</p>
              <p className="kpi-sub">
                {k.ok === true ? '✅ ' : k.ok === false ? '⏳ ' : ''}
                {k.sub}
              </p>
            </div>
          ))}
        </div>

        <section className="panel">
          <h2>Funnel · distinct sessions per event</h2>
          <table className="funnel">
            <thead>
              <tr>
                <th>Stage</th>
                <th className="bar-col">Sessions</th>
                <th>of landing</th>
                <th>step conv.</th>
              </tr>
            </thead>
            <tbody>
              {funnel.map((f) => {
                const drop = f.of_previous != null && f.of_previous < 0.7
                return (
                  <tr key={`${f.event}-${f.step}`}>
                    <td>{f.label}</td>
                    <td className="bar-col">
                      <div className="bar" style={{ width: `${(f.sessions / top) * 100}%` }} />
                      <span className="bar-n">{f.sessions}</span>
                    </td>
                    <td>{pct(f.of_landing)}</td>
                    <td className={drop ? 'drop' : ''}>{pct(f.of_previous)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </section>

        <section className="panel">
          <h2>Parent relevance ratings (blind, random order)</h2>
          <table className="funnel">
            <thead>
              <tr>
                <th>Variant</th>
                <th>Average score (1–5)</th>
                <th>Result views</th>
                <th>Orders</th>
              </tr>
            </thead>
            <tbody>
              {(['personalised', 'generic'] as const).map((v) => (
                <tr key={v}>
                  <td>{v}</td>
                  <td>{num(relevance.avg[v])}</td>
                  <td>{data.variants.result_viewed?.[v] ?? 0}</td>
                  <td>{orders.by_variant[v]}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="hint">
            With fewer than {th.min_testers} testers the result is indicative, not statistically significant. Thresholds are
            proposals to confirm with My Rugy.
          </p>
        </section>
      </div>
    </Layout>
  )
}

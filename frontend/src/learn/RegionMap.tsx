import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { Journey, Lesson, Region, RouteStop } from '../api'
import { RugView } from '../components/RugView'
import { sfx, speak } from '../fun'
import { MOROCCO_PATH } from './moroccoMap'
import { regionRug } from './regionRug'

const STATUS_LABEL: Record<RouteStop['status'], string> = { visited: 'Visited', current: 'Exploring now', locked: 'Coming up' }

// Relief hints drawn over the real outline (clipped to the land): Rif, Middle/High Atlas, Anti-Atlas.
const MOUNTAINS = ['M67 8 Q74 6 81 8', 'M48 39 Q56 34 63 29 Q72 22 84 16', 'M61 25 Q68 20 75 16', 'M46 44 Q54 40 63 37']

/** Full card about a region: description, style theme, mini rug preview. */
export function RegionInfo({
  region,
  stop,
  status,
  children,
}: {
  region: Region & { home?: boolean }
  stop?: string
  status?: RouteStop['status']
  children?: ReactNode
}) {
  const theme = region.theme
  return (
    <article className="region-info" style={{ borderColor: region.palette[0] }}>
      <header>
        <span className="region-stop-emoji" style={{ background: `linear-gradient(135deg, ${region.palette[0]}, ${region.palette[1] ?? region.palette[0]})` }}>
          {region.emoji}
        </span>
        <div>
          <strong>{region.name}</strong>
          <small>
            📍 {region.city}
            {region.home && ' · 🏠 your home region'}
          </small>
        </div>
        {status && <span className={`status-chip ${status}`}>{STATUS_LABEL[status]}</span>}
      </header>

      <div className="region-info-body">
        <div className="region-info-text">
          <p className="region-desc">{region.description}</p>
          {stop && <p className="region-stop-text">🧶 {stop}</p>}
          {theme && (
            <div className="style-theme">
              <p className="style-theme-title">🎨 Style theme: {region.style}</p>
              <div className="style-tags">
                {theme.tags.map((t) => (
                  <span key={t}>{t}</span>
                ))}
              </div>
              <p>
                <b>Look:</b> {theme.look}
              </p>
              <p>
                <b>Story:</b> {theme.story}
              </p>
              <div className="region-palette" aria-label="Style colours">
                {theme.colors.map((c) => (
                  <span key={c} style={{ background: c }} />
                ))}
              </div>
            </div>
          )}
          <p className="region-fact">💡 {region.fact}</p>
          {children}
        </div>
        {theme && (
          <div className="region-preview">
            <RugView design={regionRug(theme)} name={`${region.style}`} />
          </div>
        )}
      </div>
    </article>
  )
}

/**
 * The child's trip across the real map of Morocco: every region on their route,
 * in order, with visited / current / upcoming status. Tap a region to learn about it.
 */
export function RegionMap({ journey, childId, avatar }: { journey: Journey; childId: string; avatar: string }) {
  const { route } = journey
  const here = route.find((r) => r.status === 'current') ?? route[route.length - 1]
  const [selected, setSelected] = useState<string>(here?.key ?? route[0]?.key)
  const sel = route.find((r) => r.key === selected)

  return (
    <div className="region-map">
      <div className="region-map-head">
        <strong>🗺️ My trip across Morocco</strong>
        <span className="region-count">
          {journey.visited}/{journey.total} regions
        </span>
      </div>
      <div className="meter" aria-hidden="true">
        <span style={{ width: `${(journey.visited / journey.total) * 100}%` }} />
      </div>

      <div className="region-map-canvas">
        <svg viewBox="0 0 100 100" role="img" aria-label={`Map of Morocco with a route through its ${journey.total} regions`}>
          <defs>
            <linearGradient id="land-grad" x1="0.7" y1="0" x2="0.2" y2="1">
              <stop offset="0" stopColor="#6f9152" />
              <stop offset="0.22" stopColor="#a39a62" />
              <stop offset="0.45" stopColor="#c9a36b" />
              <stop offset="0.75" stopColor="#dcb783" />
              <stop offset="1" stopColor="#e7c998" />
            </linearGradient>
            <filter id="land-grain" x="0" y="0" width="100%" height="100%">
              <feTurbulence type="fractalNoise" baseFrequency="1.6" numOctaves="2" seed="4" />
              <feColorMatrix values="0 0 0 0 0.35  0 0 0 0 0.25  0 0 0 0 0.12  0 0 0 0.55 0" />
              <feComposite in2="SourceGraphic" operator="in" />
            </filter>
            <filter id="soft"><feGaussianBlur stdDeviation="1.1" /></filter>
            <clipPath id="land-clip"><path d={MOROCCO_PATH} /></clipPath>
          </defs>
          <path d={MOROCCO_PATH} className="land-shadow" />
          <path d={MOROCCO_PATH} fill="url(#land-grad)" />
          <g clipPath="url(#land-clip)">
            <rect x="0" y="0" width="100" height="100" fill="#000" filter="url(#land-grain)" opacity="0.35" />
            {MOUNTAINS.map((d) => (
              <path key={d} d={d} className="mountain" filter="url(#soft)" />
            ))}
          </g>
          <path d={MOROCCO_PATH} className="land-edge" />
          <text x="10" y="30" className="sea-label">Atlantic Ocean</text>
          <text x="62" y="3.2" className="sea-label">Mediterranean Sea</text>
          {route.slice(1).map((r, i) => {
            const a = route[i]
            const done = a.status === 'visited' && r.status !== 'locked'
            // Flights arc out over the ocean (to the west), proportionally to the distance.
            const len = Math.hypot(r.x - a.x, r.y - a.y) || 1
            const nx = -(r.y - a.y) / len
            const ny = (r.x - a.x) / len
            const side = nx > 0 ? -1 : 1
            const cx = (a.x + r.x) / 2 + side * nx * len * 0.35
            const cy = (a.y + r.y) / 2 + side * ny * len * 0.35
            const d = r.travel === 'fly' ? `M${a.x} ${a.y} Q ${cx} ${cy} ${r.x} ${r.y}` : `M${a.x} ${a.y} L${r.x} ${r.y}`
            return <path key={r.key} d={d} className={`leg ${r.travel}${done ? ' done' : ''}`} />
          })}
        </svg>

        {route.map((r, i) => (
          <button
            key={r.key}
            type="button"
            className={`region-dot ${r.status}${r.home ? ' home' : ''}${r.key === selected ? ' selected' : ''} label-${r.x > 70 ? 'left' : 'right'}`}
            style={{ left: `${r.x}%`, top: `${r.y}%` }}
            onClick={() => {
              sfx.pop()
              setSelected(r.key)
            }}
            title={`${r.name} · ${STATUS_LABEL[r.status]}`}
            aria-pressed={r.key === selected}
          >
            <span className="region-dot-num">{r.status === 'visited' ? '✓' : i + 1}</span>
            <span className="region-dot-label">
              {r.emoji} {r.short_name}
            </span>
          </button>
        ))}
        {here && (
          <span className="map-avatar" style={{ left: `${here.x}%`, top: `${here.y}%` }} aria-hidden="true">
            {avatar}
          </span>
        )}
      </div>

      <p className="region-legend">
        <span className="lg visited">✓ visited</span>
        <span className="lg current">● exploring now</span>
        <span className="lg locked">● coming up</span>
        <span>✈️ dashed = flight</span>
        <span>👆 tap a region</span>
      </p>

      {sel && (
        <RegionInfo region={sel} status={sel.status} key={sel.key}>
          <p className="hint">
            Stage {sel.lesson_position}: {sel.lesson_title}
          </p>
          <div className="btn-row">
            {sel.status !== 'locked' ? (
              <Link to={`/play/${childId}/learn/${sel.lesson_key}`} className="btn primary small">
                {sel.status === 'visited' ? '🔁 Visit again' : '🚀 Go to this stage'}
              </Link>
            ) : (
              <span className="hint">🔒 Finish the stages before to travel here</span>
            )}
            <button className="btn ghost small" onClick={() => speak(`${sel.name}. ${sel.description} ${sel.theme?.look ?? ''}`, 'en')}>
              🔊 Read to me
            </button>
          </div>
        </RegionInfo>
      )}
    </div>
  )
}

/** Passport stamps: one per region, coloured with the region's palette once visited. Tap one for details. */
export function RegionPassport({ journey }: { journey: Journey }) {
  const [open, setOpen] = useState<RouteStop | null>(null)
  return (
    <>
      <div className="passport">
        {journey.route.map((r, i) => (
          <button
            type="button"
            key={r.key}
            className={`stamp-card ${r.status}`}
            style={r.status === 'visited' ? { background: `linear-gradient(135deg, ${r.palette[0]}, ${r.palette[1] ?? r.palette[0]})` } : undefined}
            onClick={() => setOpen(r)}
            title={`${r.name}: ${r.style}`}
          >
            <span className="stamp-emoji">{r.status === 'locked' ? '🔒' : r.emoji}</span>
            <strong>{r.short_name}</strong>
            <small>
              {i + 1}. {r.status === 'visited' ? r.style : STATUS_LABEL[r.status]}
              {r.home ? ' · 🏠' : ''}
            </small>
          </button>
        ))}
      </div>
      {open && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label={open.name} onClick={() => setOpen(null)}>
          <div className="modal region-modal" onClick={(e) => e.stopPropagation()}>
            <RegionInfo region={open} status={open.status}>
              <button className="btn primary small" onClick={() => setOpen(null)} autoFocus>
                Close
              </button>
            </RegionInfo>
          </div>
        </div>
      )}
    </>
  )
}

/** The regional stop(s) of a lesson: where in Morocco this lesson takes place, and its local style. */
export function RegionStops({ regions, lang }: { regions: Lesson['regions']; lang: string }) {
  if (!regions.length) return null
  return (
    <section className="card region-stops">
      <div className="card-head">
        <h2>📍 {regions.length > 1 ? 'Regional stops' : 'Regional stop'}</h2>
        <button
          className="btn ghost small"
          onClick={() => speak(regions.map((r) => `${r.name}. ${r.description} ${r.stop} ${r.theme?.look ?? ''}`).join(' '), lang)}
        >
          🔊 Read to me
        </button>
      </div>
      <div className="region-stop-list">
        {regions.map((r, i) => (
          <div key={r.key} className="region-stop-wrap">
            {i > 0 && <span className="travel-badge">➜ next stop</span>}
            <RegionInfo region={r} stop={r.stop}>
              <div className="region-palette">
                <small>🎨 These colours join your rug palette when you finish this stage!</small>
              </div>
            </RegionInfo>
          </div>
        ))}
      </div>
    </section>
  )
}

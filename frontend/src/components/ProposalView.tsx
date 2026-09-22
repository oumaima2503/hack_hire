import type { Proposal } from '../api'
import { ADVENTURE_ART, BOX_EMOJI, avatarEmoji } from '../content'
import { useI18n, type I18nKey } from '../i18n'

export const formatPrice = (p: { price: number; currency: string }) => `${p.price.toFixed(0)} ${p.currency}`

/**
 * Result screen body. The personalised and generic variants share this exact
 * layout; only the content (adventure, mission, Box) differs.
 */
export function ProposalView({ proposal, compact }: { proposal: Proposal; compact?: boolean }) {
  const { t } = useI18n()
  const { adventure, mission, box, child } = proposal
  const art = ADVENTURE_ART[adventure.slug] ?? ADVENTURE_ART['great-journey']

  return (
    <div className={compact ? 'proposal compact' : 'proposal'}>
      <section className="adventure-cover" style={{ background: `linear-gradient(135deg, ${art.from}, ${art.to})` }}>
        <div className="zellige" />
        <div className="cover-emoji">{art.emoji}</div>
        <div className="cover-text">
          <p className="eyebrow light">{t('r_adventure')}</p>
          <h2>{adventure.title}</h2>
          <p>{adventure.description}</p>
        </div>
        <div className="cover-avatar" title={child.name}>
          {avatarEmoji(child.avatar_key)}
        </div>
      </section>

      <div className="proposal-grid">
        <section className="panel">
          <p className="eyebrow">{t('r_mission')}</p>
          <h3>{mission.title}</h3>
          <p className="muted">{t(`fmt_${mission.age_band}` as I18nKey)}</p>
          <ul className="facts">
            <li>
              ⏱️ {t('r_minutes', { n: mission.content.duration_min })} · {t('r_steps', { n: mission.content.steps })}
            </li>
            <li>
              {t('r_difficulty')}: <span className="stars">{'★'.repeat(mission.difficulty)}{'☆'.repeat(3 - mission.difficulty)}</span>
            </li>
            {mission.content.with_grown_up && <li>👨‍👧 {t('r_grownup')}</li>}
          </ul>
        </section>

        <section className="panel">
          <p className="eyebrow">{t('r_box')}</p>
          <p className="muted">{t('r_box_sub')}</p>
          <ul className="box-items">
            {box.items.map((item) => (
              <li key={item.id}>
                <span className="box-emoji">{BOX_EMOJI[item.interest_tag] ?? '🎁'}</span>
                {item.name}
              </li>
            ))}
          </ul>
          <p className="price">{formatPrice(box)}</p>
        </section>
      </div>
    </div>
  )
}

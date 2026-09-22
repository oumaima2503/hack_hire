import { avatarEmoji, island } from '../content'
import { LANG_FLAGS, LANG_NAMES, useI18n, type I18nKey } from '../i18n'
import type { Profile } from '../state'

/** The explorer card Rugy builds step by step during onboarding. */
export function ExplorerCard({ profile, highlight }: { profile: Profile; highlight?: number }) {
  const { t } = useI18n()
  const slot = (n: number, filled: boolean) => `card-slot${filled ? ' filled' : ''}${highlight === n ? ' pulse' : ''}`

  return (
    <div className="explorer-card">
      <div className="explorer-card-head">
        <span>🧭 {t('card_title')}</span>
        <span className="stamp">MA</span>
      </div>
      <div className="explorer-card-body">
        <div className={`avatar-big ${slot(1, !!profile.avatar_key)}`}>{avatarEmoji(profile.avatar_key)}</div>
        <div className="explorer-card-fields">
          <div className={`card-name ${slot(1, !!profile.name)}`}>{profile.name || t('card_name_empty')}</div>
          <div className={slot(2, !!profile.age_band)}>
            {profile.age_band ? <span className="chip">🎂 {t('card_age', { band: profile.age_band })}</span> : '—'}
          </div>
        </div>
      </div>
      <dl className="explorer-card-grid">
        <div className={slot(3, !!profile.interests?.length)}>
          <dt>{t('card_islands')}</dt>
          <dd>
            {profile.interests?.length
              ? profile.interests.map((k) => (
                  <span key={k} className="chip" style={{ background: island(k)?.color }}>
                    {island(k)?.emoji} {t(`i_${k}` as I18nKey)}
                  </span>
                ))
              : '?'}
          </dd>
        </div>
        <div className={slot(4, !!profile.level)}>
          <dt>{t('card_level')}</dt>
          <dd>{profile.level ? `${'★'.repeat(profile.level)}${'☆'.repeat(3 - profile.level)} ${t(`level_${profile.level}` as I18nKey)}` : '?'}</dd>
        </div>
        <div className={slot(5, !!profile.language)}>
          <dt>{t('card_language')}</dt>
          <dd>{profile.language ? `${LANG_FLAGS[profile.language]} ${LANG_NAMES[profile.language]}` : '?'}</dd>
        </div>
      </dl>
    </div>
  )
}

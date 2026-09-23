import { SKILL_EMOJI, type SkillKey } from '../content'
import { useI18n, type I18nKey } from '../i18n'

const STYLE_KEY: Record<string, I18nKey> = { watch: 'ls_watch', listen: 'ls_listen', do: 'ls_do', Watch: 'ls_watch', Listen: 'ls_listen', Do: 'ls_do' }
const STYLE_EMOJI: Record<string, string> = { watch: '👀', listen: '👂', do: '✋' }
const LANG_LABEL: Record<string, string> = { en: 'English', fr: 'Français', ar: 'العربية', English: 'English', French: 'Français', Arabic: 'العربية' }

/**
 * The child's Learning Profile in friendly words: an adventure level, what they
 * are good at and what we can practise together. Never a score or a grade.
 */
export function LearningProfileCard({
  level,
  learningStyle,
  language,
  skills,
  compact = false,
}: {
  level: number
  learningStyle: string
  language: string
  skills: Partial<Record<SkillKey, string>>
  compact?: boolean
}) {
  const { t } = useI18n()
  const entries = Object.entries(skills) as [SkillKey, string][]
  const good = entries.filter(([, v]) => v === 'strong')
  const practise = entries.filter(([, v]) => v === 'practice')
  const styleKey = learningStyle.toLowerCase()

  return (
    <div className={`profile-card${compact ? ' compact' : ''}`}>
      <div className="profile-tiles">
        <div className="profile-tile">
          <span className="profile-emoji">{'⭐'.repeat(Math.max(1, level))}</span>
          <small>{t('pr_level')}</small>
          <strong>{t(`level_${Math.min(3, Math.max(1, level))}` as I18nKey)}</strong>
        </div>
        <div className="profile-tile">
          <span className="profile-emoji">{STYLE_EMOJI[styleKey] ?? '👀'}</span>
          <small>{t('pr_style')}</small>
          <strong>{t(STYLE_KEY[learningStyle] ?? 'ls_watch')}</strong>
        </div>
        <div className="profile-tile">
          <span className="profile-emoji">💬</span>
          <small>{t('pr_lang')}</small>
          <strong>{LANG_LABEL[language] ?? language}</strong>
        </div>
      </div>

      <div className="profile-skills">
        <div className="skill-group good">
          <p className="skill-title">🌟 {t('pr_good')}</p>
          {good.length ? (
            good.map(([k]) => (
              <span key={k} className="skill-chip">
                {SKILL_EMOJI[k]} {t(`sk_${k}` as I18nKey)}
              </span>
            ))
          ) : (
            <span className="skill-chip soft-chip">✨ {t('pr_growing')}</span>
          )}
        </div>
        <div className="skill-group practise">
          <p className="skill-title">🤝 {t('pr_practice')}</p>
          {practise.length ? (
            practise.map(([k]) => (
              <span key={k} className="skill-chip">
                {SKILL_EMOJI[k]} {t(`sk_${k}` as I18nKey)}
              </span>
            ))
          ) : (
            <span className="skill-chip soft-chip">🧶 {t('pr_growing')}</span>
          )}
        </div>
      </div>
    </div>
  )
}

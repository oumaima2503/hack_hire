import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { Lang } from '../api'
import { useAuth } from '../auth'
import { useI18n } from '../i18n'
import { SoundToggle } from './SoundToggle'

export function Logo() {
  return (
    <Link to="/" className="logo" aria-label="MyRugy Kids home">
      <span className="logo-mark">🧶</span>
      <span className="logo-word">
        Myrugy <b>Kids</b>
      </span>
    </Link>
  )
}

export function LangSwitch() {
  const { lang, setLang } = useI18n()
  return (
    <div className="lang-switch" role="group" aria-label="Language">
      {(['en', 'fr', 'ar'] as Lang[]).map((l) => (
        <button key={l} className={l === lang ? 'on' : ''} onClick={() => setLang(l)} aria-pressed={l === lang}>
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  )
}

export function Layout({ children, wide }: { children: ReactNode; wide?: boolean }) {
  const { t } = useI18n()
  const { parent } = useAuth()
  return (
    <div className="page">
      <header className="topbar">
        <div>
          <Logo />
          <p className="tagline">{t('tagline')}</p>
        </div>
        <div className="topbar-right">
          <Link to={parent ? '/parent' : '/login'} className="pill-link">
            {parent ? `👨‍👩‍👧 ${t('nav_parent')}` : `🔑 ${t('nav_login')}`}
          </Link>
          <SoundToggle />
          <LangSwitch />
        </div>
      </header>
      <main className={wide ? 'main wide' : 'main'}>{children}</main>
      <footer className="footer">
        <Link to="/parent-test">{t('f_parent_test')}</Link>
        <span>·</span>
        <Link to="/dashboard">{t('f_dashboard')}</Link>
      </footer>
    </div>
  )
}

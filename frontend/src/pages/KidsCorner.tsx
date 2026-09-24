import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { api, ApiError, type Child } from '../api'
import { useAuth } from '../auth'
import { Layout } from '../components/Layout'
import { ParentPasswordForm } from '../components/ParentGate'
import { PatternCreator, PatternPad } from '../components/PatternPad'
import { avatarEmoji } from '../content'
import { confetti, sfx } from '../fun'
import { useI18n } from '../i18n'

/**
 * Kids' corner: each child picks their profile and plays their secret picture
 * pattern. The API only opens that child's world when the pattern is right.
 */
export default function KidsCorner() {
  const { t } = useI18n()
  const { children: kids, refresh, loading } = useAuth()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const [status, setStatus] = useState<'idle' | 'error' | 'success'>('idle')
  const [message, setMessage] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [round, setRound] = useState(0)
  const [grownUpOk, setGrownUpOk] = useState(false)

  useEffect(() => {
    refresh() // fresh list (and which children already have a pattern)
  }, [refresh])

  const selected: Child | undefined = kids.find((k) => k.id === params.get('child'))
  const choose = (id: string | null) => {
    setMessage(null)
    setStatus('idle')
    setGrownUpOk(false)
    setParams(id ? { child: id } : {})
  }

  const enter = async (pattern: string[]) => {
    if (!selected) return
    setBusy(true)
    try {
      await api.enterChild(selected.id, pattern)
      setStatus('success')
      sfx.yay()
      confetti()
      setMessage(t('kc_welcome', { name: selected.name }))
      window.setTimeout(() => navigate(`/play/${selected.id}`), 900)
    } catch (e) {
      sfx.oops()
      setStatus('error')
      const code = e instanceof ApiError ? e.code : undefined
      setMessage(code === 'pattern_locked' ? t('kc_locked') : code === 'no_pattern' ? t('kc_no_pattern') : t('kc_wrong'))
      window.setTimeout(() => {
        setStatus('idle')
        setRound((r) => r + 1)
      }, 700)
      if (code === 'no_pattern') refresh()
    } finally {
      setBusy(false)
    }
  }

  const texts = {
    pick: t('pt_pick'), confirm: t('pt_confirm'), ok: t('pt_ok'), mismatch: t('pt_mismatch'),
    tip: t('pt_tip'), undo: t('pt_undo'), again: t('pt_again'),
  }

  if (loading) return <Layout><p className="loading">…</p></Layout>

  return (
    <Layout>
      <div className="kids-corner">
        {!selected ? (
          <section className="panel kids-pick">
            <h1>🎮 {t('kc_title')}</h1>
            <div className="kids-profiles">
              {kids.map((k) => (
                <button key={k.id} className="kid-profile" onClick={() => choose(k.id)}>
                  <span className="kid-avatar">{avatarEmoji(k.avatar_key)}</span>
                  <strong>{k.name}</strong>
                  <small>{k.has_pattern ? '🔐' : '✨'}</small>
                </button>
              ))}
            </div>
            <p className="kids-parent-link">
              <Link to="/parent">👨‍👩‍👧 {t('kc_parent')}</Link>
            </p>
          </section>
        ) : (
          <section className="panel kids-enter">
            <button className="btn ghost small kids-back" onClick={() => choose(null)}>
              ⬅ {t('kc_back')}
            </button>
            <div className="kids-who">
              <span className="kid-avatar big">{avatarEmoji(selected.avatar_key)}</span>
              <h1>{selected.name}</h1>
            </div>

            {selected.has_pattern ? (
              <>
                <p className="pattern-instruction">🔐 {t('kc_enter')}</p>
                {message && <p className={`pattern-message${status === 'success' ? ' good' : ''}`}>{message}</p>}
                <PatternPad key={`${selected.id}-${round}`} hidden shuffle status={status} disabled={busy || status === 'success'} onComplete={enter} undoLabel={t('pt_undo')} />
              </>
            ) : !grownUpOk ? (
              <>
                <p className="pattern-instruction">✨ {t('kc_no_pattern')}</p>
                <ParentPasswordForm onUnlocked={() => setGrownUpOk(true)} />
              </>
            ) : (
              <>
                <h2 className="pattern-title">🔐 {t('pt_title')}</h2>
                <p className="lead dark">{t('pt_rugy')}</p>
                <PatternCreator
                  texts={texts}
                  onDone={async (p) => {
                    await api.setPattern(selected.id, p)
                    await refresh()
                    confetti()
                    window.setTimeout(() => navigate(`/play/${selected.id}`), 1200)
                  }}
                />
              </>
            )}
          </section>
        )}
      </div>
    </Layout>
  )
}

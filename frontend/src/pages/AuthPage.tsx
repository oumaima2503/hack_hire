import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../auth'
import { AuthForms } from '../components/AuthForms'
import { Layout } from '../components/Layout'
import { Rugy } from '../components/Rugy'

/** Only allow in-app redirects after login (no open redirect via ?next=). */
const safeNext = (next: string | null) => (next && next.startsWith('/') && !next.startsWith('//') ? next : '/parent')

export default function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  const { parent } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const next = safeNext(params.get('next'))

  if (parent) return <Navigate to={next} replace />

  return (
    <Layout>
      <div className="panel center-panel auth-page">
        <Rugy size={80} />
        <AuthForms initial={mode} onDone={(_, m) => navigate(m === 'register' ? '/onboarding?new=1' : next, { replace: true })} />
      </div>
    </Layout>
  )
}

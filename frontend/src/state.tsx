import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { api, type AgeBand, type Lang, type Variant } from './api'

export interface Profile {
  name?: string
  avatar_key?: string
  age?: number
  age_band?: AgeBand
  interests?: string[]
  level?: 1 | 2 | 3
  language?: Lang
  selected_theme?: string
  favorite_color?: string
  learning_style?: 'watch' | 'listen' | 'do'
  rug_style?: string
}

export interface Session {
  sessionId: string
  variant: Variant
  step: number
  childId?: string
  profile: Profile
  orderId?: string
  transactionRef?: string
}

const KEY = 'myrugy.session'

function fresh(): Session {
  const variant: Variant = new URLSearchParams(location.search).get('variant') === 'generic' ? 'generic' : 'personalised'
  return { sessionId: crypto.randomUUID(), variant, step: 0, profile: {} }
}

function load(): Session {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    /* storage unavailable: start fresh */
  }
  return fresh()
}

interface Ctx {
  session: Session
  update: (patch: Partial<Session>) => void
  updateProfile: (patch: Partial<Profile>) => void
  reset: () => Session
}

const SessionContext = createContext<Ctx | null>(null)

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session>(load)

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(session))
    } catch {
      /* ignore */
    }
  }, [session])

  const update = useCallback((patch: Partial<Session>) => setSession((s) => ({ ...s, ...patch })), [])
  const updateProfile = useCallback(
    (patch: Partial<Profile>) => setSession((s) => ({ ...s, profile: { ...s.profile, ...patch } })),
    [],
  )
  const reset = useCallback(() => {
    const s = fresh()
    setSession(s)
    return s
  }, [])

  return <SessionContext.Provider value={{ session, update, updateProfile, reset }}>{children}</SessionContext.Provider>
}

export function useSession() {
  const ctx = useContext(SessionContext)
  if (!ctx) throw new Error('useSession outside provider')
  return ctx
}

/** Fire-and-forget funnel event, tagged with the browser session and child. */
export function useTrack() {
  const { session } = useSession()
  return useCallback(
    (event_name: string, step?: number, metadata?: object) => {
      api
        .event({ session_id: session.sessionId, event_name, step, child_id: session.childId, metadata })
        .catch((e) => console.warn('track failed', e))
    },
    [session.sessionId, session.childId],
  )
}

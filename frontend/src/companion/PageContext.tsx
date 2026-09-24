import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'

/**
 * What the child is looking at, so the companion can give spatially-aware help
 * ("tap the 💡 button", "go to Rewards"). Each page registers a short descriptor;
 * it is sent with chat questions and sanitised again on the server.
 */
export interface PageDescriptor {
  key: string // machine key: "home", "lesson", "studio", "game"…
  label: string // human-readable: "The rug design studio"
  visibleElements: string[] // what the child can see
  availableActions: string[] // what the child can do
  navigation: { key: string; label: string; path: string }[] // where they can go from here
  meta?: Record<string, string> // extra info: { lessonTitle: "Choose Materials" }
  /** Set by the provider: the URL the descriptor belongs to (guards against stale descriptors). */
  path?: string
}

interface PageContextValue {
  current: PageDescriptor | null
  setPage: (descriptor: PageDescriptor) => void
  history: string[] // last 5 visited page keys
  /** Latest values without re-rendering (for async callbacks such as the companion's ask). */
  snapshot: () => { current: PageDescriptor | null; history: string[] }
}

const PageContext = createContext<PageContextValue>({
  current: null,
  setPage: () => undefined,
  history: [],
  snapshot: () => ({ current: null, history: [] }),
})

export const usePage = () => useContext(PageContext)

export function PageProvider({ children }: { children: ReactNode }) {
  const [current, setCurrent] = useState<PageDescriptor | null>(null)
  const [history, setHistory] = useState<string[]>([])
  const ref = useRef<{ current: PageDescriptor | null; history: string[] }>({ current: null, history: [] })

  const setPage = useCallback((d: PageDescriptor) => {
    const prev = ref.current.current
    const next = { ...d, path: window.location.pathname }
    if (prev && prev.key !== d.key) ref.current.history = [...ref.current.history, prev.key].slice(-5)
    ref.current.current = next
    setCurrent(next)
    setHistory(ref.current.history)
  }, [])

  const snapshot = useCallback(() => ref.current, [])
  const value = useMemo(() => ({ current, setPage, history, snapshot }), [current, setPage, history, snapshot])
  return <PageContext.Provider value={value}>{children}</PageContext.Provider>
}

/** The sidebar destinations, built with the child's real paths. */
export function sidebarNav(childId: string, guideName: string) {
  const base = `/play/${childId}`
  return [
    { key: 'home', label: 'Home', path: base },
    { key: 'learn', label: 'Learn & Play', path: `${base}/learn` },
    { key: 'studio', label: 'Create My Rug', path: `${base}/studio` },
    { key: 'rewards', label: 'Rewards', path: `${base}/rewards` },
    { key: 'progress', label: 'Progress', path: `${base}/progress` },
    { key: 'assistant', label: `Talk to ${guideName}`, path: `${base}/assistant` },
  ]
}

/** Register the page descriptor whenever its inputs change. */
export function usePageDescriptor(build: () => PageDescriptor, deps: unknown[]) {
  const { setPage } = usePage()
  useEffect(() => {
    setPage(build())
  }, deps) // eslint-disable-line react-hooks/exhaustive-deps
}

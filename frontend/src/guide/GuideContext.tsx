import { createContext, useContext } from 'react'

/** What a game tells the Guide. The game engine stays the authority; this is read-only. */
export type GuideEvent = { type: 'mistake' | 'success' }

export interface GuideApi {
  report: (e: GuideEvent) => void
  /** Current game state, used only to build hints (e.g. selected tool, pattern cells, step order). */
  setState: (s: Record<string, unknown>) => void
  /** The question on screen (question-based games). */
  setQuestion: (id: string | undefined) => void
}

const noop: GuideApi = { report: () => undefined, setState: () => undefined, setQuestion: () => undefined }

export const GuideContext = createContext<GuideApi>(noop)

/** Games call this; outside a GuideLayer (e.g. a lesson quiz) it silently does nothing. */
export const useGuide = () => useContext(GuideContext)

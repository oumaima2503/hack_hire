import { createContext, useContext } from 'react'
import type { Award, Experience } from '../api'

export interface ChatFocus {
  lessonId?: string
  gameKey?: string
  questionId?: string
}

export interface LearnCtx {
  childId: string
  exp: Experience
  refresh: () => void
  celebrate: (award: Award | null | undefined) => void
  focus: ChatFocus
  setFocus: (f: ChatFocus) => void
}

export const LearnContext = createContext<LearnCtx | null>(null)

export function useLearn() {
  const ctx = useContext(LearnContext)
  if (!ctx) throw new Error('useLearn outside LearnLayout')
  return ctx
}

export const REASON_LABELS: Record<string, string> = {
  lesson_completed: 'Lesson completed',
  video_watched: 'Watched the story',
  game_completed: 'Game completed',
  correct_answer: 'Correct answer',
  challenge_completed: 'Challenge passed',
  rug_created: 'Rug created',
  daily_streak: 'Daily streak bonus',
}

export { speak, stopSpeaking } from '../fun'

import type { AgeBand } from './api'

export const AVATARS: { key: string; emoji: string }[] = [
  { key: 'fox', emoji: '🦊' },
  { key: 'camel', emoji: '🐪' },
  { key: 'owl', emoji: '🦉' },
  { key: 'turtle', emoji: '🐢' },
  { key: 'lion', emoji: '🦁' },
  { key: 'monkey', emoji: '🐒' },
]
export const avatarEmoji = (key?: string | null) => AVATARS.find((a) => a.key === key)?.emoji ?? '🧭'

export const ISLANDS: { key: string; emoji: string; color: string }[] = [
  { key: 'animals', emoji: '🐪', color: '#d9822b' },
  { key: 'nature', emoji: '🌴', color: '#4f8a3c' },
  { key: 'art', emoji: '🎨', color: '#c4501f' },
  { key: 'space', emoji: '✨', color: '#34407a' },
  { key: 'music', emoji: '🥁', color: '#a2386b' },
  { key: 'stories', emoji: '📜', color: '#8a5a2b' },
]
export const island = (key: string) => ISLANDS.find((i) => i.key === key)

export const ADVENTURE_ART: Record<string, { emoji: string; from: string; to: string }> = {
  'atlas-animals': { emoji: '🐪', from: '#e7a04b', to: '#b5561f' },
  'oasis-garden': { emoji: '🌴', from: '#7fb069', to: '#2f6b47' },
  'colour-souk': { emoji: '🎨', from: '#f0b23e', to: '#b03a2e' },
  'desert-stars': { emoji: '🌙', from: '#3a4a8c', to: '#141a3a' },
  'medina-rhythms': { emoji: '🥁', from: '#d45d79', to: '#6a2c5b' },
  'storyteller-square': { emoji: '🏮', from: '#e08d3c', to: '#6b3b1f' },
  'great-journey': { emoji: '🗺️', from: '#b8a58c', to: '#7a6a55' },
}

export const BOX_EMOJI: Record<string, string> = {
  animals: '🐾', nature: '🌱', art: '🧶', space: '🌟', music: '🎶', stories: '📖', generic: '🗺️', name_card: '🪪',
}

export const AGES = [3, 4, 5, 6, 7, 8, 9, 10, 11]
export const ageBand = (age: number): AgeBand => (age <= 5 ? '3-5' : age <= 8 ? '6-8' : '9-11')

export interface Challenge {
  prompt: string // i18n key
  visual: string
  options: string[]
  answer: string
}

// Two or three short in-game challenges, calibrated per age band (D1.4, step 4).
export const CHALLENGES: Record<AgeBand, Challenge[]> = {
  '3-5': [
    { prompt: 'ch_count_camels', visual: '🐪 🐪 🐪', options: ['2', '3', '4'], answer: '3' },
    { prompt: 'ch_next', visual: '🔴 🔵 🔴 🔵 🔴 ❓', options: ['🔴', '🔵', '🟢'], answer: '🔵' },
    { prompt: 'ch_star', visual: '', options: ['🔺', '⭐', '🟦'], answer: '⭐' },
  ],
  '6-8': [
    { prompt: 'ch_next', visual: '◆ ◇ ◇ ◆ ◇ ◇ ◆ ❓', options: ['◆', '◇', '●'], answer: '◇' },
    { prompt: 'ch_knots_rows', visual: '🧶🧶🧶 × 4', options: ['7', '12', '10'], answer: '12' },
    { prompt: 'ch_mix', visual: '🔵 + 🟡 = ❓', options: ['🟢', '🟣', '🟠'], answer: '🟢' },
  ],
  '9-11': [
    { prompt: 'ch_next', visual: '2 · 4 · 8 · 16 · ❓', options: ['24', '32', '20'], answer: '32' },
    { prompt: 'ch_knots_grid', visual: '▦  6 × 4', options: ['10', '24', '20'], answer: '24' },
    { prompt: 'ch_symmetry', visual: '◢ ┃ ❓', options: ['◣', '◢', '◤'], answer: '◣' },
  ],
}

export const levelFromScore = (correct: number): 1 | 2 | 3 => (correct >= 3 ? 3 : correct === 2 ? 2 : 1)

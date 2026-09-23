import type { AgeBand } from './api'

// The travel buddy is also the child's favourite animal / game character.
export const AVATARS: { key: string; emoji: string }[] = [
  { key: 'fox', emoji: '🦊' },
  { key: 'camel', emoji: '🐪' },
  { key: 'owl', emoji: '🦉' },
  { key: 'turtle', emoji: '🐢' },
  { key: 'lion', emoji: '🦁' },
  { key: 'monkey', emoji: '🐒' },
  { key: 'dino', emoji: '🦖' },
  { key: 'dolphin', emoji: '🐬' },
  { key: 'cat', emoji: '🐱' },
  { key: 'unicorn', emoji: '🦄' },
]
export const avatarEmoji = (key?: string | null) => AVATARS.find((a) => a.key === key)?.emoji ?? '🧭'

// Onboarding choices. Keys must match backend/learning_content.py; the backend
// turns them into the full theme, palette and lesson personalisation.
export const WORLDS: { key: string; emoji: string; from: string; to: string }[] = [
  { key: 'space', emoji: '🚀', from: '#3a2a7a', to: '#0b1030' },
  { key: 'ocean', emoji: '🐠', from: '#1597a8', to: '#073b4c' },
  { key: 'dinosaurs', emoji: '🦕', from: '#8fb34a', to: '#2f4a17' },
  { key: 'jungle', emoji: '🌴', from: '#4fa36f', to: '#133a2a' },
  { key: 'desert', emoji: '🐪', from: '#d98a3d', to: '#5b2a1a' },
  { key: 'fairytale', emoji: '🏰', from: '#b77fe0', to: '#3d1a52' },
]
export const FAVORITE_COLORS: { key: string; hex: string }[] = [
  { key: 'red', hex: '#e53935' },
  { key: 'orange', hex: '#f57c00' },
  { key: 'yellow', hex: '#f9c22e' },
  { key: 'green', hex: '#2e9d4f' },
  { key: 'blue', hex: '#1e7be0' },
  { key: 'purple', hex: '#8e24aa' },
  { key: 'pink', hex: '#e8508a' },
]
export const LEARNING_STYLES: { key: 'watch' | 'listen' | 'do'; emoji: string }[] = [
  { key: 'watch', emoji: '👀' },
  { key: 'listen', emoji: '👂' },
  { key: 'do', emoji: '✋' },
]
export const RUG_STYLES: { key: string; emoji: string; preview: string }[] = [
  { key: 'berber', emoji: '🔶', preview: '◆ ◇ ◆ ◇' },
  { key: 'kilim', emoji: '〰️', preview: '▲ ▼ ▲ ▼' },
  { key: 'floral', emoji: '🌸', preview: '✿ ❀ ✿ ❀' },
  { key: 'modern', emoji: '🟦', preview: '■ ● ■ ●' },
]

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

// The 12 regions of Morocco (north → south). Keys match backend/learning_content.py.
export const REGIONS: { key: string; name: string; emoji: string }[] = [
  { key: 'tanger_tetouan_al_hoceima', name: 'Tanger-Tétouan-Al Hoceïma', emoji: '🏔️' },
  { key: 'oriental', name: "L'Oriental", emoji: '🌴' },
  { key: 'fes_meknes', name: 'Fès-Meknès', emoji: '🎨' },
  { key: 'rabat_sale_kenitra', name: 'Rabat-Salé-Kénitra', emoji: '🏰' },
  { key: 'casablanca_settat', name: 'Casablanca-Settat', emoji: '🏙️' },
  { key: 'beni_mellal_khenifra', name: 'Béni Mellal-Khénifra', emoji: '⛰️' },
  { key: 'marrakech_safi', name: 'Marrakech-Safi', emoji: '🕌' },
  { key: 'draa_tafilalet', name: 'Drâa-Tafilalet', emoji: '🏜️' },
  { key: 'souss_massa', name: 'Souss-Massa', emoji: '🌳' },
  { key: 'guelmim_oued_noun', name: 'Guelmim-Oued Noun', emoji: '🐪' },
  { key: 'laayoune_sakia_el_hamra', name: 'Laâyoune-Sakia El Hamra', emoji: '⛺' },
  { key: 'dakhla_oued_ed_dahab', name: 'Dakhla-Oued Ed-Dahab', emoji: '🌊' },
]

export const AGES = [3, 4, 5, 6, 7, 8, 9, 10, 11]
export const ageBand = (age: number): AgeBand => (age <= 5 ? '3-5' : age <= 8 ? '6-8' : '9-11')

export type SkillKey = 'pattern_recognition' | 'sequencing' | 'visual_matching' | 'material_recognition'

export interface Challenge {
  skill: SkillKey // what this mini-challenge observes (onboarding only, never a game)
  prompt: string // i18n key
  visual: string
  options: string[]
  answer: string
}

// Onboarding mini-assessment: one playful, visual item per skill, calibrated per age band.
export const CHALLENGES: Record<AgeBand, Challenge[]> = {
  '3-5': [
    { skill: 'pattern_recognition', prompt: 'ch_next', visual: '🔴 🔵 🔴 🔵 🔴 ❓', options: ['🔴', '🔵', '🟢'], answer: '🔵' },
    { skill: 'sequencing', prompt: 'ch_first', visual: '🐔  🐣  🥚', options: ['🥚', '🐣', '🐔'], answer: '🥚' },
    { skill: 'visual_matching', prompt: 'ch_same', visual: '⭐', options: ['🔺', '⭐', '🟦'], answer: '⭐' },
    { skill: 'material_recognition', prompt: 'ch_soft', visual: '', options: ['🐑', '🪨', '🔩'], answer: '🐑' },
  ],
  '6-8': [
    { skill: 'pattern_recognition', prompt: 'ch_next', visual: '◆ ◇ ◇ ◆ ◇ ◇ ◆ ❓', options: ['◆', '◇', '●'], answer: '◇' },
    { skill: 'sequencing', prompt: 'ch_first', visual: '🍎  🌳  🌱', options: ['🌱', '🌳', '🍎'], answer: '🌱' },
    { skill: 'visual_matching', prompt: 'ch_same', visual: '🔷', options: ['🔶', '🔷', '🟦'], answer: '🔷' },
    { skill: 'material_recognition', prompt: 'ch_sheep', visual: '🐑 ➜ ❓', options: ['🧶', '🪵', '🧊'], answer: '🧶' },
  ],
  '9-11': [
    { skill: 'pattern_recognition', prompt: 'ch_next', visual: '2 · 4 · 8 · 16 · ❓', options: ['24', '32', '20'], answer: '32' },
    { skill: 'sequencing', prompt: 'ch_rug_first', visual: '🪢  🌈  🐑', options: ['🐑', '🌈', '🪢'], answer: '🐑' },
    { skill: 'visual_matching', prompt: 'ch_symmetry', visual: '◢ ┃ ❓', options: ['◣', '◢', '◤'], answer: '◣' },
    { skill: 'material_recognition', prompt: 'ch_blue_dye', visual: '🔵 🧶', options: ['🪻', '🧂', '🪨'], answer: '🪻' },
  ],
}

/** first try → strong · second try → medium · otherwise → something to practise together */
export const skillFromTries = (correctOnTry: number | null): 'strong' | 'medium' | 'practice' =>
  correctOnTry === 1 ? 'strong' : correctOnTry === 2 ? 'medium' : 'practice'

/** Adventure level from the skills (never shown as a score). */
export const levelFromSkills = (skills: Record<string, string>): 1 | 2 | 3 => {
  const points = Object.values(skills).reduce((n, s) => n + (s === 'strong' ? 2 : s === 'medium' ? 1 : 0), 0)
  return points >= 7 ? 3 : points >= 4 ? 2 : 1
}

export const SKILL_EMOJI: Record<SkillKey, string> = {
  pattern_recognition: '🔷',
  sequencing: '🔢',
  visual_matching: '🧩',
  material_recognition: '🐑',
}

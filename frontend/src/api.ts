export type Lang = 'en' | 'fr' | 'ar'
export type Variant = 'personalised' | 'generic'
export type AgeBand = '3-5' | '6-8' | '9-11'

export interface Parent {
  id: string
  name: string
  email: string
}

export interface Child {
  id: string
  name: string
  avatar_key: string | null
  age: number | null
  age_band: AgeBand | null
  level: 1 | 2 | 3 | null
  interests: string[]
  language: Lang | null
  selected_theme: string | null
  favorite_color: string | null
  learning_style: 'watch' | 'listen' | 'do' | null
  rug_style: string | null
  home_region: string | null
  learning_profile?: { skills: Partial<Record<Skill, SkillLevel>>; assessed_at?: string } | null
  total_points: number
}

export type Skill = 'pattern_recognition' | 'sequencing' | 'visual_matching' | 'material_recognition'
export type SkillLevel = 'strong' | 'medium' | 'practice'

/** Structured Learning Profile (friendly labels only, never a score). */
export interface LearningProfile {
  age: number | null
  level: number
  adventure_level: string
  interests: string[]
  learning_style: string
  language: string
  skills: Partial<Record<Skill, SkillLevel>>
  assessed: boolean
}

/** How the MyRugy Guide presents things for this child. */
export interface GuidePrefs {
  name: string
  language: Lang
  intro_mode: 'demo_first' | 'talk_first' | 'try_first'
  auto_speak: boolean
  verbosity: 'short' | 'normal' | 'detailed'
  support: Record<string, 'extra' | 'normal' | 'light'>
}

export interface Proposal {
  variant: Variant
  language: Lang
  child: Child
  adventure: { id: string; slug: string; title: string; description: string; interest_tags: string[] }
  mission: {
    title: string
    activity_type: string
    difficulty: number
    age_band: AgeBand
    content: { duration_min: number; steps: number; with_grown_up: boolean }
  }
  box: { items: { id: string; name: string; interest_tag: string; age_band: string }[]; price: number; currency: string }
}

export interface Order {
  id: string
  status: 'pending' | 'confirmed'
  amount: number
  variant: Variant
}

// ───────── Learning ─────────

export interface Theme {
  key: string
  name: string
  emoji: string
  guide: { name: string; emoji: string }
  colors: { bg1: string; bg2: string; surface: string; text: string; secondary: string; primary: string; on_primary: string }
  particles: string[]
  animation: string
  icons: Record<'home' | 'learn' | 'games' | 'studio' | 'rewards' | 'progress' | 'assistant', string>
  vocab: { points: string; point_emoji: string; level: string; friend: string; thing: string; place: string; collect: string; cheer: string }
  motifs: string[]
}

export interface Stats {
  total_points: number
  xp_level: number
  points_to_next: number
  points_per_level: number
  lessons_completed: number
  lessons_total: number
  games_completed: number
  correct_answers: number
  answers_total: number
  answers_correct: number
  rugs_created: number
  challenge_passed: number
  streak_days: number
  items_unlocked: number
  achievements: number
  regions_visited: number
}

export interface LessonSummary {
  key: string
  position: number
  title: string
  emoji: string
  summary: string
  status: 'new' | 'started' | 'completed'
  unlocked: boolean
  video_watched: boolean
  game: string | null
  regions: { key: string; short_name: string; emoji: string }[]
}

/** A Moroccan region as it appears on the child's journey. */
export interface Region {
  key: string
  name: string
  short_name: string
  emoji: string
  city: string
  style: string
  palette: string[]
  fact: string
  description: string
  theme: RegionTheme | null
  x: number
  y: number
}

/** The visual identity of a region's weaving style (drives the mini rug preview). */
export interface RegionTheme {
  look: string
  story: string
  tags: string[]
  pattern: 'stripes' | 'bands' | 'lozenge' | 'medallion' | 'patchwork' | 'playful' | 'red_field' | 'mixed' | 'fine_stripes' | 'tent' | 'stitch' | 'waves'
  colors: string[]
}

export interface RouteStop extends Region {
  status: 'visited' | 'current' | 'locked'
  lesson_key: string
  lesson_title: string
  lesson_position: number
  travel: 'start' | 'road' | 'fly'
  home: boolean
}

export interface Journey {
  home_region: string | null
  route: RouteStop[]
  visited: number
  total: number
  current: RouteStop[]
}

export interface Experience {
  child: Child
  theme: Theme
  rug_style: { key: string; name: string; emoji: string; shapes: string[]; colors: string[] }
  learning_style: { key: string; label: string; emoji: string; order: string[] }
  difficulty: { level: number; label: string; reading_level: number; speed_seconds: number | null }
  progress: Stats
  next_lesson: LessonSummary | null
  regions: Journey
  learning_profile: LearningProfile
  guide: GuidePrefs
  available_themes: { key: string; name: string; emoji: string }[]
}

export interface Lesson {
  key: string
  position: number
  title: string
  emoji: string
  summary: string
  reading_level: number
  learning_style: string
  sections: ('video' | 'explain' | 'cards' | 'quiz')[]
  explain: string[]
  analogy: string
  storyboard: { emoji: string; caption: string }[]
  cards: { emoji: string; title: string; text: string }[]
  video_url: string | null
  game: { key: string; title: string; emoji: string } | null
  status: string
  video_watched: boolean
  has_quiz: boolean
  regions: (Region & { stop: string; home: boolean })[]
}

export interface Question {
  id: string
  prompt: string
  options: string[]
}

export interface Reward {
  key: string
  kind: 'color' | 'pattern' | 'character' | 'design' | 'theme' | 'workshop'
  name: string
  emoji: string
  threshold: number
  payload: Record<string, unknown>
}

export interface Achievement {
  key: string
  title: string
  description: string
  emoji: string
}

export interface Award {
  points_awarded: number
  breakdown: { reason: string; points: number }[]
  total_points: number
  xp_level: number
  points_to_next: number
  new_rewards: Reward[]
  new_achievements: Achievement[]
}

export interface AnswerResult {
  correct: boolean
  explanation: string | null
  hint: string | null
  correct_answer: string | null
  award: Award | null
}

export interface GameSummary {
  key: string
  type: string
  title: string
  emoji: string
  lesson: { key: string; title: string }
  unlocked: boolean
  completed: boolean
  plays: number
  best_score: number
  max_score: number
}

export interface Studio {
  rows: number
  cols: number
  workshop: boolean
  palette: string[]
  motifs: string[]
  stamps: { key: string; name: string; emoji: string; mask: number[][] }[]
  templates: string[]
  textures: string[]
  shapes: string[]
}

export interface PatternCell {
  color: string
  shape: string
}

export interface GameConfig {
  key: string
  type: 'choose_material' | 'match_tools' | 'build_pattern' | 'order_steps' | 'create_rug' | 'challenge'
  title: string
  emoji: string
  intro: string
  difficulty: number
  speed_seconds: number | null
  guide: { name: string; emoji: string }
  reward_emoji: string
  motifs: string[]
  plays: number
  questions?: Question[]
  tools?: { tool: string; emoji: string }[]
  purposes?: string[]
  pairs?: Record<string, string>
  seed?: number
  palette?: string[]
  shapes?: string[]
  target?: PatternCell[]
  steps?: { id: string; emoji: string; label: string }[]
  studio?: Studio
  pass_ratio?: number
}

export interface GameResult {
  passed: boolean
  score: number
  max_score: number
  correct_positions?: boolean[]
  award: Award | null
}

export interface RugDesign {
  rows: number
  cols: number
  cells: (string | null)[]
  motifs: { i: number; e: string }[]
  texture: string
}

export interface Rug {
  id: string
  name: string
  design: RugDesign
  created_at: string
}

export interface RewardsOverview {
  total_points: number
  rewards: (Reward & { unlocked: boolean; unlocked_at: string | null })[]
  next_reward: (Reward & { unlocked: boolean }) | null
  achievements: (Achievement & { earned: boolean; earned_at: string | null })[]
}

export interface ProgressSummary {
  stats: Stats
  quiz_accuracy: number | null
  lessons: (LessonSummary & { quiz_correct: number; quiz_total: number })[]
  games: { key: string; title: string; emoji: string; plays: number; best_score: number; max_score: number; completed: boolean }[]
  regions: Journey
  recent_points: { reason: string; points: number; created_at: string }[]
}

export interface ChildCard extends Child {
  theme: { key: string; name: string; emoji: string; primary: string }
  stats: Stats
  achievements: Achievement[]
  latest_rug: Rug | null
  last_active: string | null
}

export interface ChildDetail extends ChildCard {
  learning_profile: LearningProfile
  progress: ProgressSummary
  rewards: RewardsOverview
  rugs: Rug[]
  chat: { role: 'user' | 'assistant'; content: string; created_at: string }[]
}

export interface ChatReply {
  reply: string
  source: 'gemini' | 'offline' | 'filtered'
  guide: { name: string; emoji: string }
}

// ───────── Transport ─────────

export class ApiError extends Error {
  constructor(message: string, public status: number, public code?: string) {
    super(message)
  }
}

/** Fired when the API says parent mode is locked (password needed for parent-only content). */
export const PARENT_LOCKED_EVENT = 'myrugy:parent-locked'

async function call<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`/api${path}`, {
    method,
    credentials: 'same-origin', // httpOnly session cookie; the token is never readable by JS
    headers: { 'X-Requested-With': 'fetch', ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}) },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  if (res.status === 204) return undefined as T
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    if (data.code === 'parent_locked') window.dispatchEvent(new Event(PARENT_LOCKED_EVENT))
    throw new ApiError(data.error || `Request failed (${res.status})`, res.status, data.code)
  }
  return data as T
}

const c = (id: string) => `/children/${id}`

export const api = {
  // funnel
  event: (b: { session_id: string; event_name: string; step?: number; child_id?: string; metadata?: object }) =>
    call('POST', '/events', b),
  proposal: (id: string, variant: Variant, lang: Lang) => call<Proposal>('GET', `${c(id)}/proposal?variant=${variant}&lang=${lang}`),
  createOrder: (b: {
    child_id: string
    variant: Variant
    full_name: string
    shipping_address: { line1: string; city: string; postal_code: string; country: string }
  }) => call<Order>('POST', '/orders', b),
  pay: (orderId: string) => call<{ order: Order; transaction_ref: string }>('POST', `/orders/${orderId}/pay`),
  rate: (child_id: string, ratings: { variant_shown: Variant; shown_order: 1 | 2; score: number }[]) =>
    call('POST', '/ratings', { child_id, ratings }),
  dashboard: () => call<Dashboard>('GET', '/dashboard'),

  // auth
  register: (b: { name: string; email: string; password: string; consent: boolean }) =>
    call<{ parent: Parent; children: Child[] }>('POST', '/auth/register', b),
  login: (email: string, password: string) => call<{ parent: Parent; children: Child[] }>('POST', '/auth/login', { email, password }),
  me: () => call<{ parent: Parent; children: Child[]; parent_unlocked: boolean }>('GET', '/auth/me'),
  logout: () => call('POST', '/auth/logout'),
  // parent mode: parent-only content needs the password again
  parentMode: () => call<{ unlocked: boolean; minutes: number }>('GET', '/auth/parent-mode'),
  parentUnlock: (password: string) => call<{ unlocked: boolean; minutes: number }>('POST', '/auth/parent-mode/unlock', { password }),
  parentLock: () => call<{ unlocked: boolean }>('POST', '/auth/parent-mode/lock'),

  // parent
  parentDashboard: () => call<{ parent: Parent; children: ChildCard[] }>('GET', '/parents/dashboard'),
  createChild: (b: { name: string; avatar_key: string }) => call<Child>('POST', '/parents/children', b),
  childDetail: (id: string) => call<ChildDetail>('GET', `/parents/children/${id}`),
  editChild: (id: string, patch: Partial<Child>) => call<Child>('PUT', `/parents/children/${id}`, patch),
  deleteChild: (id: string) => call<void>('DELETE', `/parents/children/${id}`),

  // child (onboarding + learning)
  updateChild: (id: string, patch: Partial<Child>) => call<Child>('PATCH', c(id), patch),
  experience: (id: string) => call<Experience>('GET', `${c(id)}/experience`),
  lessons: (id: string) => call<LessonSummary[]>('GET', `${c(id)}/lessons`),
  lesson: (id: string, key: string) => call<Lesson>('GET', `${c(id)}/lessons/${key}`),
  quiz: (id: string, key: string) => call<Question[]>('GET', `${c(id)}/lessons/${key}/quiz`),
  videoWatched: (id: string, key: string) => call<{ award: Award | null }>('POST', `${c(id)}/lessons/${key}/video-watched`),
  completeLesson: (id: string, key: string) =>
    call<{ award: Award | null; next_lesson: LessonSummary | null }>('POST', `${c(id)}/lessons/${key}/complete`),
  answer: (id: string, qid: string, choice: string) => call<AnswerResult>('POST', `${c(id)}/questions/${qid}/answer`, { choice }),
  games: (id: string) => call<GameSummary[]>('GET', `${c(id)}/games`),
  game: (id: string, key: string) => call<GameConfig>('GET', `${c(id)}/games/${key}`),
  completeGame: (id: string, key: string, payload: object) => call<GameResult>('POST', `${c(id)}/games/${key}/complete`, payload),
  hint: (id: string, key: string, level: number, state: object, questionId?: string) =>
    call<{ level: number; text: string; focus?: number }>('POST', `${c(id)}/games/${key}/hint`, { level, state, questionId }),
  learningProfile: (id: string) => call<LearningProfile>('GET', `${c(id)}/learning-profile`),
  rugs: (id: string) => call<Rug[]>('GET', `${c(id)}/rugs`),
  saveRug: (id: string, name: string, design: RugDesign) => call<{ rug: Rug; award: Award | null }>('POST', `${c(id)}/rugs`, { name, design }),
  rewards: (id: string) => call<RewardsOverview>('GET', `${c(id)}/rewards`),
  progress: (id: string) => call<ProgressSummary>('GET', `${c(id)}/progress`),

  // assistant
  chat: (b: {
    childId: string
    message: string
    lessonId?: string
    gameKey?: string
    questionId?: string
    gameState?: { mistakes: number; hints: number; note?: string }
    /** Where the child is in the app (context for the answer). */
    page?: string
    /** The answer will be spoken aloud by the companion. */
    voice?: boolean
  }) =>
    call<ChatReply>('POST', '/chat', b),
  chatHistory: (childId: string, lessonId?: string) =>
    call<{ role: 'user' | 'assistant'; content: string }[]>(
      'GET',
      `/chat/history?childId=${encodeURIComponent(childId)}${lessonId ? `&lessonId=${encodeURIComponent(lessonId)}` : ''}`,
    ),
}

export interface Dashboard {
  storage: 'memory' | 'supabase'
  thresholds: { relevance_gap: number; completion_rate: number; min_testers: number; min_runs: number }
  funnel: { event: string; step: number | null; label: string; sessions: number; of_landing: number | null; of_previous: number | null }[]
  completion: { started: number; completed: number; rate: number | null }
  relevance: { testers: number; avg: Record<Variant, number | null>; gap: number | null }
  variants: Record<string, Partial<Record<Variant, number>>>
  orders: { confirmed: number; revenue: number; by_variant: Record<Variant, number> }
}

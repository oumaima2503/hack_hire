export type Lang = 'en' | 'fr' | 'ar'
export type Variant = 'personalised' | 'generic'
export type AgeBand = '3-5' | '6-8' | '9-11'

export interface Child {
  id: string
  name: string
  avatar_key: string | null
  age_band: AgeBand | null
  level: 1 | 2 | 3 | null
  interests: string[]
  language: Lang | null
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

async function call<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`/api${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`)
  return data as T
}

export const api = {
  event: (b: { session_id: string; event_name: string; step?: number; child_id?: string; metadata?: object }) =>
    call('POST', '/events', b),
  createParent: (email: string, consent: boolean) => call<{ id: string }>('POST', '/parents', { email, consent }),
  createChild: (b: { parent_id: string; name: string; avatar_key: string }) => call<Child>('POST', '/children', b),
  updateChild: (id: string, patch: Partial<Child>) => call<Child>('PATCH', `/children/${id}`, patch),
  proposal: (id: string, variant: Variant, lang: Lang) =>
    call<Proposal>('GET', `/children/${id}/proposal?variant=${variant}&lang=${lang}`),
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

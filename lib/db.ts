import { createClient } from './supabase'
import type { Session, UserSettings, AvatarConfig, GameScore } from './types'
import { DEFAULT_SETTINGS, DEFAULT_AVATAR } from './types'

// ── AUTH ──────────────────────────────────────────────────────────────────

export async function signUp(email: string, password: string, name: string) {
  const sb = createClient()
  const { data, error } = await sb.auth.signUp({
    email: email.trim().toLowerCase(),
    password,
    options: { data: { name } }
  })
  if (error) return { user: null, error: error.message }

  // Update profile with name
  if (data.user) {
    await sb.from('profiles').upsert({ id: data.user.id, name, email: email.trim().toLowerCase() })
  }
  return { user: data.user, error: null }
}

export async function signIn(email: string, password: string) {
  const sb = createClient()
  const { data, error } = await sb.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  })
  if (error) {
    if (error.message.includes('Invalid login credentials')) {
      return { user: null, error: 'Wrong email or password. Please try again.' }
    }
    if (error.message.includes('Email not confirmed')) {
      return { user: null, error: 'Please check your email and confirm your account first.' }
    }
    return { user: null, error: error.message }
  }
  return { user: data.user, error: null }
}

export async function signOut() {
  const sb = createClient()
  await sb.auth.signOut()
}

export async function getUser() {
  const sb = createClient()
  const { data: { user } } = await sb.auth.getUser()
  return user
}

export async function getSession() {
  const sb = createClient()
  const { data: { session } } = await sb.auth.getSession()
  return session
}

// ── SESSIONS ──────────────────────────────────────────────────────────────

export async function getSessions(): Promise<Session[]> {
  const sb = createClient()
  const user = await getUser()
  if (!user) return []

  const { data, error } = await sb
    .from('sessions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error || !data) return []

  return data.map(row => ({
    id: row.id,
    date: row.created_at,
    category: row.category,
    prompt: row.prompt,
    duration: row.duration,
    fillerCount: row.filler_count,
    fillerWords: row.filler_words || [],
    pace: row.pace,
    clarityScore: row.clarity_score,
    lengthStatus: row.length_status,
    feedback: row.feedback || [],
    transcriptPreview: row.transcript_preview || '',
    tokensEarned: row.tokens_earned || 0,
  }))
}

export async function saveSession(s: Session): Promise<boolean> {
  const sb = createClient()
  const user = await getUser()
  if (!user) return false

  const { error } = await sb.from('sessions').upsert({
    id: s.id,
    user_id: user.id,
    category: s.category,
    prompt: s.prompt,
    duration: s.duration,
    filler_count: s.fillerCount,
    filler_words: s.fillerWords,
    pace: s.pace,
    clarity_score: s.clarityScore,
    length_status: s.lengthStatus,
    feedback: s.feedback,
    transcript_preview: s.transcriptPreview,
    tokens_earned: s.tokensEarned || 0,
  })
  return !error
}

export async function deleteSession(id: string): Promise<void> {
  const sb = createClient()
  await sb.from('sessions').delete().eq('id', id)
}

// ── SETTINGS ──────────────────────────────────────────────────────────────

export async function getSettings(): Promise<UserSettings> {
  const sb = createClient()
  const user = await getUser()
  if (!user) return DEFAULT_SETTINGS

  const { data } = await sb.from('user_settings').select('*').eq('user_id', user.id).single()
  if (!data) return DEFAULT_SETTINGS

  // Get name from profile
  const { data: profile } = await sb.from('profiles').select('name, email').eq('id', user.id).single()

  return {
    name: profile?.name || '',
    email: profile?.email || user.email || '',
    targetWpmMin: data.target_wpm_min || 140,
    targetWpmMax: data.target_wpm_max || 160,
    defaultCategory: data.default_category || 'Job Interviews',
    notificationsEnabled: data.notifications_enabled || false,
    remindersEnabled: data.reminders_enabled || false,
    theme: data.theme || 'dark',
  }
}

export async function saveSettings(s: UserSettings): Promise<void> {
  const sb = createClient()
  const user = await getUser()
  if (!user) return

  await sb.from('user_settings').upsert({
    user_id: user.id,
    target_wpm_min: s.targetWpmMin,
    target_wpm_max: s.targetWpmMax,
    default_category: s.defaultCategory,
    notifications_enabled: s.notificationsEnabled,
    reminders_enabled: s.remindersEnabled,
    theme: s.theme,
    updated_at: new Date().toISOString(),
  })

  await sb.from('profiles').upsert({
    id: user.id,
    name: s.name,
    email: s.email,
  })
}

// ── TOKENS ────────────────────────────────────────────────────────────────

export async function getTokenBalance(): Promise<number> {
  const sb = createClient()
  const user = await getUser()
  if (!user) return 0

  const { data } = await sb.from('token_balances').select('balance').eq('user_id', user.id).single()
  return data?.balance || 0
}

export async function addTokens(amount: number): Promise<number> {
  const sb = createClient()
  const user = await getUser()
  if (!user) return 0

  const current = await getTokenBalance()
  const newBalance = current + amount

  await sb.from('token_balances').upsert({
    user_id: user.id,
    balance: newBalance,
    updated_at: new Date().toISOString(),
  })
  return newBalance
}

export async function spendTokens(amount: number): Promise<boolean> {
  const sb = createClient()
  const user = await getUser()
  if (!user) return false

  const current = await getTokenBalance()
  if (current < amount) return false

  await sb.from('token_balances').upsert({
    user_id: user.id,
    balance: current - amount,
    updated_at: new Date().toISOString(),
  })
  return true
}

// ── AVATAR ────────────────────────────────────────────────────────────────

export async function getAvatar(): Promise<AvatarConfig> {
  const sb = createClient()
  const user = await getUser()
  if (!user) return DEFAULT_AVATAR

  const { data } = await sb.from('avatars').select('*').eq('user_id', user.id).single()
  if (!data) return DEFAULT_AVATAR

  return {
    skinColor: data.skin_color || DEFAULT_AVATAR.skinColor,
    hairStyle: data.hair_style ?? DEFAULT_AVATAR.hairStyle,
    hairColor: data.hair_color || DEFAULT_AVATAR.hairColor,
    accessory: data.accessory ?? DEFAULT_AVATAR.accessory,
    outfitColor: data.outfit_color || DEFAULT_AVATAR.outfitColor,
    bgColor: data.bg_color || DEFAULT_AVATAR.bgColor,
  }
}

export async function saveAvatar(a: AvatarConfig): Promise<void> {
  const sb = createClient()
  const user = await getUser()
  if (!user) return

  await sb.from('avatars').upsert({
    user_id: user.id,
    skin_color: a.skinColor,
    hair_style: a.hairStyle,
    hair_color: a.hairColor,
    accessory: a.accessory,
    outfit_color: a.outfitColor,
    bg_color: a.bgColor,
    updated_at: new Date().toISOString(),
  })
}

export async function getPurchasedItems(): Promise<string[]> {
  const sb = createClient()
  const user = await getUser()
  if (!user) return ['skin-lime', 'hair-0', 'hcol-dark', 'acc-0', 'out-dark', 'bg-dark']

  const { data } = await sb.from('avatars').select('purchased_items').eq('user_id', user.id).single()
  return data?.purchased_items || ['skin-lime', 'hair-0', 'hcol-dark', 'acc-0', 'out-dark', 'bg-dark']
}

export async function purchaseItem(itemId: string): Promise<void> {
  const sb = createClient()
  const user = await getUser()
  if (!user) return

  const current = await getPurchasedItems()
  if (current.includes(itemId)) return

  await sb.from('avatars').upsert({
    user_id: user.id,
    purchased_items: [...current, itemId],
    updated_at: new Date().toISOString(),
  })
}

// ── GAME SCORES ───────────────────────────────────────────────────────────

export async function saveGameScore(score: GameScore): Promise<void> {
  const sb = createClient()
  const user = await getUser()
  if (!user) return

  await sb.from('game_scores').insert({
    user_id: user.id,
    game_id: score.gameId,
    score: score.score,
    tokens_earned: score.tokensEarned || 0,
  })
}

export async function getBestScore(gameId: string): Promise<number> {
  const sb = createClient()
  const user = await getUser()
  if (!user) return 0

  const { data } = await sb
    .from('game_scores')
    .select('score')
    .eq('user_id', user.id)
    .eq('game_id', gameId)
    .order('score', { ascending: false })
    .limit(1)
    .single()

  return data?.score || 0
}

// ── STATS ─────────────────────────────────────────────────────────────────

export function computeStats(sessions: Session[]) {
  if (!sessions.length) return null
  const n = sessions.length
  const avgClarity  = Math.round(sessions.reduce((a, s) => a + s.clarityScore, 0) / n)
  const avgFillers  = parseFloat((sessions.reduce((a, s) => a + s.fillerCount, 0) / n).toFixed(1))
  const avgPace     = Math.round(sessions.reduce((a, s) => a + s.pace, 0) / n)
  const bestClarity = Math.max(...sessions.map(s => s.clarityScore))
  const totalMins   = Math.round(sessions.reduce((a, s) => a + s.duration, 0) / 60)
  const trend       = sessions.length >= 2 ? sessions[0].clarityScore - sessions[1].clarityScore : 0
  return { n, avgClarity, avgFillers, avgPace, bestClarity, totalMins, trend }
}

export function computeStreak(sessions: Session[]): number {
  if (!sessions.length) return 0
  const days = new Set(sessions.map(s => new Date(s.date).toDateString()))
  let streak = 0
  const today = new Date()
  for (let i = 0; i < 365; i++) {
    const d = new Date(today); d.setDate(d.getDate() - i)
    if (days.has(d.toDateString())) streak++
    else if (i > 0) break
  }
  return streak
}

// ── PENDING SESSION (stays in sessionStorage — ephemeral is fine) ────────

export function setPendingSession(s: object): void {
  if (typeof window !== 'undefined') sessionStorage.setItem('vocalis_pending', JSON.stringify(s))
}

export function getPendingSession(): any {
  if (typeof window === 'undefined') return null
  try {
    const r = sessionStorage.getItem('vocalis_pending')
    return r ? JSON.parse(r) : null
  } catch { return null }
}

export function clearPendingSession(): void {
  if (typeof window !== 'undefined') sessionStorage.removeItem('vocalis_pending')
}

// ── THEME (stays in localStorage — no auth needed) ────────────────────────

export function getThemeLocal(): string {
  if (typeof window === 'undefined') return 'dark'
  try { return JSON.parse(localStorage.getItem('vocalis_settings') || '{}').theme || 'dark' } catch { return 'dark' }
}

export function applyTheme(theme: string): void {
  if (typeof document !== 'undefined') document.documentElement.setAttribute('data-theme', theme)
}

// ─── Types ───────────────────────────────────────────────────────────────────

export interface FeedbackItem {
  icon: string
  title: string
  detail: string
  tag: 'HIGH IMPACT' | 'QUICK WIN' | 'STRUCTURE'
  tagColor: string
  tagBg: string
}

export interface VocalisSession {
  id: string
  createdAt: string          // ISO string
  category: string           // 'job' | 'college' | 'speaking' | 'custom'
  prompt: string
  durationSecs: number
  transcript: string
  fillerCount: number
  detectedFillers: string[]  // unique filler words found
  pacingWPM: number
  lengthStatus: 'short' | 'good' | 'long'
  clarityScore: number       // 0–100
  feedback: FeedbackItem[]
}

export interface UserPrefs {
  name: string
  targetMinWPM: number
  targetMaxWPM: number
  defaultCategory: string
  emailSummaries: boolean
  practiceReminders: boolean
}

// ─── Constants ───────────────────────────────────────────────────────────────

const SESSIONS_KEY = 'vocalis_sessions'
const PREFS_KEY    = 'vocalis_prefs'
const SCORES_KEY   = 'vocalis_game_scores'

const DEFAULT_PREFS: UserPrefs = {
  name: '',
  targetMinWPM: 140,
  targetMaxWPM: 160,
  defaultCategory: 'job',
  emailSummaries: true,
  practiceReminders: false,
}

// ─── Sessions ────────────────────────────────────────────────────────────────

export function getSessions(): VocalisSession[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(SESSIONS_KEY) || '[]') as VocalisSession[]
  } catch { return [] }
}

export function addSession(session: VocalisSession): void {
  const sessions = getSessions()
  sessions.unshift(session) // newest first
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions))
}

export function getSession(id: string): VocalisSession | null {
  return getSessions().find(s => s.id === id) ?? null
}

export function deleteSession(id: string): void {
  const filtered = getSessions().filter(s => s.id !== id)
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(filtered))
}

export function clearSessions(): void {
  localStorage.removeItem(SESSIONS_KEY)
}

// ─── Computed stats ──────────────────────────────────────────────────────────

export interface OverallStats {
  totalSessions: number
  avgClarity: number
  bestClarity: number
  avgFillers: number
  avgPace: number
  streak: number           // consecutive days with sessions
  improvement: number      // clarity change from first to last 3 avg
  clarityHistory: number[] // last 10 clarity scores (oldest→newest)
}

export function getOverallStats(): OverallStats {
  const sessions = getSessions()
  const empty: OverallStats = {
    totalSessions: 0, avgClarity: 0, bestClarity: 0,
    avgFillers: 0, avgPace: 0, streak: 0,
    improvement: 0, clarityHistory: [],
  }
  if (sessions.length === 0) return empty

  const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length

  const clarityScores = sessions.map(s => s.clarityScore)
  const last10 = sessions.slice(0, 10).reverse().map(s => s.clarityScore)

  // Improvement: compare first 3 sessions vs last 3
  const early = sessions.slice(-3).map(s => s.clarityScore)
  const recent = sessions.slice(0, 3).map(s => s.clarityScore)
  const improvement = early.length && recent.length
    ? Math.round(avg(recent) - avg(early))
    : 0

  // Streak: consecutive days with at least one session
  let streak = 0
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const days = [...new Set(sessions.map(s => {
    const d = new Date(s.createdAt)
    d.setHours(0, 0, 0, 0)
    return d.getTime()
  }))].sort((a, b) => b - a)

  for (let i = 0; i < days.length; i++) {
    const expected = today.getTime() - i * 86400000
    if (days[i] === expected) streak++
    else break
  }

  const paces = sessions.filter(s => s.pacingWPM > 0).map(s => s.pacingWPM)

  return {
    totalSessions: sessions.length,
    avgClarity: Math.round(avg(clarityScores)),
    bestClarity: Math.max(...clarityScores),
    avgFillers: Math.round(avg(sessions.map(s => s.fillerCount)) * 10) / 10,
    avgPace: paces.length ? Math.round(avg(paces)) : 0,
    streak,
    improvement,
    clarityHistory: last10,
  }
}

// ─── Preferences ─────────────────────────────────────────────────────────────

export function getPrefs(): UserPrefs {
  if (typeof window === 'undefined') return DEFAULT_PREFS
  try {
    return { ...DEFAULT_PREFS, ...JSON.parse(localStorage.getItem(PREFS_KEY) || '{}') }
  } catch { return DEFAULT_PREFS }
}

export function savePrefs(prefs: Partial<UserPrefs>): void {
  localStorage.setItem(PREFS_KEY, JSON.stringify({ ...getPrefs(), ...prefs }))
}

// ─── Game high scores ─────────────────────────────────────────────────────────

export function getHighScore(game: string): number {
  if (typeof window === 'undefined') return 0
  try {
    const scores = JSON.parse(localStorage.getItem(SCORES_KEY) || '{}')
    return scores[game] ?? 0
  } catch { return 0 }
}

export function setHighScore(game: string, score: number): void {
  const scores = JSON.parse(localStorage.getItem(SCORES_KEY) || '{}')
  if (score > (scores[game] ?? 0)) {
    scores[game] = score
    localStorage.setItem(SCORES_KEY, JSON.stringify(scores))
  }
}

// ─── Session ID generator ─────────────────────────────────────────────────────

export function newId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}

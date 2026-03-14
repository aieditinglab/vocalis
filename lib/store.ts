import type {
  Session, UserSettings, GameScore, TokenTransaction,
  AvatarConfig, LeaderboardEntry, PracticeStats, Theme
} from './types'
import { DEFAULT_SETTINGS, DEFAULT_AVATAR } from './types'

const KEYS = {
  sessions:   'vocalis_sessions',
  settings:   'vocalis_settings',
  scores:     'vocalis_game_scores',
  pending:    'vocalis_pending_session',
  tokens:     'vocalis_tokens',
  tokenHist:  'vocalis_token_history',
  avatar:     'vocalis_avatar',
  purchased:  'vocalis_purchased_items',
  leaderboard:'vocalis_leaderboard',
}

function safe<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch { return fallback }
}

function write(key: string, val: unknown) {
  if (typeof window === 'undefined') return
  localStorage.setItem(key, JSON.stringify(val))
}

// ── SESSIONS ──────────────────────────────────────────────────────────────
export function getSessions(): Session[] { return safe(KEYS.sessions, []) }
export function saveSession(s: Session) {
  const all = getSessions()
  const idx = all.findIndex(x => x.id === s.id)
  if (idx >= 0) { all[idx] = s } else { all.unshift(s) }
  write(KEYS.sessions, all)
}
export function deleteSession(id: string) {
  write(KEYS.sessions, getSessions().filter(s => s.id !== id))
}
export function clearAllSessions() {
  if (typeof window !== 'undefined') localStorage.removeItem(KEYS.sessions)
}

// ── PENDING ───────────────────────────────────────────────────────────────
export function setPendingSession(s: Partial<Session>) {
  if (typeof window !== 'undefined') sessionStorage.setItem(KEYS.pending, JSON.stringify(s))
}
export function getPendingSession(): Partial<Session> | null {
  if (typeof window === 'undefined') return null
  try { const r = sessionStorage.getItem(KEYS.pending); return r ? JSON.parse(r) : null }
  catch { return null }
}
export function clearPendingSession() {
  if (typeof window !== 'undefined') sessionStorage.removeItem(KEYS.pending)
}

// ── SETTINGS ──────────────────────────────────────────────────────────────
export function getSettings(): UserSettings {
  return { ...DEFAULT_SETTINGS, ...safe(KEYS.settings, {}) }
}
export function saveSettings(s: UserSettings) { write(KEYS.settings, s) }

// ── THEME ─────────────────────────────────────────────────────────────────
export function getTheme(): Theme { return getSettings().theme || 'dark' }
export function applyTheme(theme: Theme) {
  if (typeof document === 'undefined') return
  document.documentElement.setAttribute('data-theme', theme)
}

// ── TOKENS ────────────────────────────────────────────────────────────────
export function getTokenBalance(): number { return safe(KEYS.tokens, 50) } // start with 50 free
export function getTokenHistory(): TokenTransaction[] { return safe(KEYS.tokenHist, []) }

export function addTokens(amount: number, reason: string): number {
  const balance = getTokenBalance() + amount
  write(KEYS.tokens, balance)
  const history = getTokenHistory()
  history.unshift({ id: `t_${Date.now()}`, amount, reason, date: new Date().toISOString(), type: 'earn' })
  write(KEYS.tokenHist, history.slice(0, 200))
  return balance
}

export function spendTokens(amount: number, reason: string): boolean {
  const balance = getTokenBalance()
  if (balance < amount) return false
  write(KEYS.tokens, balance - amount)
  const history = getTokenHistory()
  history.unshift({ id: `t_${Date.now()}`, amount: -amount, reason, date: new Date().toISOString(), type: 'spend' })
  write(KEYS.tokenHist, history.slice(0, 200))
  return true
}

// ── AVATAR ────────────────────────────────────────────────────────────────
export function getAvatar(): AvatarConfig { return { ...DEFAULT_AVATAR, ...safe(KEYS.avatar, {}) } }
export function saveAvatar(a: AvatarConfig) { write(KEYS.avatar, a) }
export function getPurchasedItems(): string[] { return safe(KEYS.purchased, ['skin-lime','hair-0','hcol-dark','acc-0','out-dark','bg-dark']) }
export function purchaseItem(itemId: string) {
  const items = getPurchasedItems()
  if (!items.includes(itemId)) {
    items.push(itemId)
    write(KEYS.purchased, items)
  }
}
export function hasItem(itemId: string): boolean { return getPurchasedItems().includes(itemId) }

// ── LEADERBOARD ───────────────────────────────────────────────────────────
export function getLeaderboard(gameId: string): LeaderboardEntry[] {
  return safe(KEYS.leaderboard, []).filter((e: LeaderboardEntry) => e.gameId === gameId)
    .sort((a: LeaderboardEntry, b: LeaderboardEntry) => b.score - a.score)
    .slice(0, 20)
}

export function addLeaderboardEntry(gameId: string, score: number) {
  const settings = getSettings()
  const all: LeaderboardEntry[] = safe(KEYS.leaderboard, [])
  // Remove old entry for same person+game
  const filtered = all.filter(e => !(e.isMe && e.gameId === gameId))
  filtered.push({
    id: `lb_${Date.now()}`,
    name: settings.name || 'You',
    gameId,
    score,
    date: new Date().toISOString(),
    isMe: true,
  })
  write(KEYS.leaderboard, filtered)
}

// ── GAME SCORES ───────────────────────────────────────────────────────────
export function getGameScores(): GameScore[] { return safe(KEYS.scores, []) }
export function saveGameScore(score: GameScore) {
  const scores = getGameScores()
  scores.unshift(score)
  write(KEYS.scores, scores.slice(0, 100))
  addLeaderboardEntry(score.gameId, score.score)
}
export function getBestScore(gameId: string): number {
  return getGameScores()
    .filter(s => s.gameId === gameId)
    .reduce((best, s) => Math.max(best, s.score), 0)
}

export function getPracticeStats(): PracticeStats {
  const scores = getGameScores()
  const breakdown: Record<string, number> = {}
  scores.forEach(s => { breakdown[s.gameId] = (breakdown[s.gameId] || 0) + 1 })
  const bestScores: Record<string, number> = {}
  scores.forEach(s => { bestScores[s.gameId] = Math.max(bestScores[s.gameId] || 0, s.score) })
  return {
    totalGamesPlayed: scores.length,
    totalTokensEarned: scores.reduce((a, s) => a + (s.tokensEarned || 0), 0),
    bestScores,
    lastPlayed: scores[0]?.date || null,
    gamesBreakdown: breakdown,
  }
}

// ── STATS ─────────────────────────────────────────────────────────────────
export function computeStats(sessions: Session[]) {
  if (!sessions.length) return null
  const n   = sessions.length
  const avgClarity  = Math.round(sessions.reduce((a,s) => a + s.clarityScore, 0) / n)
  const avgFillers  = parseFloat((sessions.reduce((a,s) => a + s.fillerCount, 0) / n).toFixed(1))
  const avgPace     = Math.round(sessions.reduce((a,s) => a + s.pace, 0) / n)
  const bestClarity = Math.max(...sessions.map(s => s.clarityScore))
  const totalMins   = Math.round(sessions.reduce((a,s) => a + s.duration, 0) / 60)
  const trend = sessions.length >= 2 ? sessions[0].clarityScore - sessions[1].clarityScore : 0
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

// ── ANALYSIS ──────────────────────────────────────────────────────────────
export function analyzeTranscript(transcript: string, durationSecs: number, targetMin: number, targetMax: number) {
  const words     = transcript.trim().split(/\s+/).filter(Boolean)
  const wordCount = words.length
  const pace      = durationSecs > 0 ? Math.round((wordCount / durationSecs) * 60) : 0
  const lc        = transcript.toLowerCase()
  let fillerCount = 0
  const foundFillers: string[] = []
  const FILLERS = ['um','uh','like','you know','basically','literally','right','so','actually','honestly','kind of','sort of','i mean']
  FILLERS.forEach(f => {
    const matches = lc.match(new RegExp(`\\b${f}\\b`, 'gi'))
    if (matches) { fillerCount += matches.length; foundFillers.push(`${f} ×${matches.length}`) }
  })
  const lengthStatus: 'in-range'|'too-short'|'too-long' =
    durationSecs < 30 ? 'too-short' : durationSecs > 660 ? 'too-long' : 'in-range'
  let clarity = 100
  clarity -= Math.min(fillerCount * 4, 40)
  if (pace > targetMax + 20) clarity -= 15
  if (pace < targetMin - 20) clarity -= 10
  if (lengthStatus !== 'in-range') clarity -= 10
  clarity = Math.max(0, Math.min(100, clarity))
  const feedback = []
  if (fillerCount > 0) feedback.push({ icon:'🎯', title:'Cut the filler words', detail:`You used ${fillerCount} filler word${fillerCount>1?'s':''} (${foundFillers.slice(0,3).join(' · ')}). Pause for 1 second instead of filling silence.`, tag:'HIGH IMPACT', tagColor:'#FF3054', tagBg:'rgba(255,48,84,0.12)' })
  if (pace > targetMax) feedback.push({ icon:'🐢', title:'Slow down slightly', detail:`Your pace was ${pace} WPM — over the ideal ${targetMin}–${targetMax} range. Pause after each main idea.`, tag:'QUICK WIN', tagColor:'#FFB800', tagBg:'rgba(255,184,0,0.12)' })
  else if (pace < targetMin && pace > 0) feedback.push({ icon:'⚡', title:'Pick up the pace', detail:`${pace} WPM is below the ideal ${targetMin}–${targetMax}. A slightly faster pace keeps listeners engaged.`, tag:'PACING', tagColor:'#FFB800', tagBg:'rgba(255,184,0,0.12)' })
  feedback.push({ icon:'💡', title:'Lead with your strongest point', detail:'Open with your most powerful idea, then support it. This structure scores higher on clarity every time.', tag:'STRUCTURE', tagColor:'#AAFF00', tagBg:'rgba(170,255,0,0.10)' })
  return { wordCount, pace, fillerCount, fillerWords: foundFillers, lengthStatus, clarityScore: clarity, feedback: feedback.slice(0,3), transcriptPreview: transcript.slice(0,160)+(transcript.length>160?'…':'') }
}

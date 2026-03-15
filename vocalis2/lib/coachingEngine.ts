import type { Session, FeedbackPoint } from './types'

// ── TIER THRESHOLDS ────────────────────────────────────────────────────────
// Clarity score ranges
const TIERS = {
  EXCELLENT:  { min: 85, label: 'Excellent' },
  GOOD:       { min: 70, label: 'Good' },
  DEVELOPING: { min: 55, label: 'Developing' },
  NEEDS_WORK: { min: 0,  label: 'Needs Work' },
}

function getTier(score: number) {
  if (score >= TIERS.EXCELLENT.min)  return 'excellent'
  if (score >= TIERS.GOOD.min)       return 'good'
  if (score >= TIERS.DEVELOPING.min) return 'developing'
  return 'needs-work'
}

// ── FILLER ANALYSIS ────────────────────────────────────────────────────────

function fillerFeedback(count: number, tier: string): FeedbackPoint | null {
  if (count === 0) {
    return {
      icon: '🎯',
      title: 'Zero filler words — clean delivery',
      detail: 'You spoke without a single filler word this session. That\'s a real skill. When you feel an "um" coming, you\'re now replacing it with silence — which sounds confident.',
      tag: 'PERSONAL BEST 🏆',
      tagColor: '#AAFF00',
      tagBg: 'rgba(170,255,0,0.12)',
    }
  }
  if (count <= 3) {
    return {
      icon: '🎯',
      title: `Only ${count} filler word${count > 1 ? 's' : ''} — nearly clean`,
      detail: `${count} filler${count > 1 ? 's' : ''} is genuinely low. Most people average 10–15 per minute. Your next goal: zero. Before your next session, practice this drill — speak for 30 seconds on any topic. Every time an "um" arrives, stop, breathe, then continue. Repeat 3 times.`,
      tag: 'NEARLY CLEAN',
      tagColor: '#AAFF00',
      tagBg: 'rgba(170,255,0,0.10)',
    }
  }
  if (count <= 8) {
    return {
      icon: '🎯',
      title: `${count} filler words detected`,
      detail: `You used ${count} fillers. The fix: slow down slightly before speaking. Filler words happen when your mouth moves before your brain has the next thought. A deliberate pause — even 1 second — sounds more confident than "um."`,
      tag: 'HIGH IMPACT',
      tagColor: '#FF3054',
      tagBg: 'rgba(255,48,84,0.12)',
    }
  }
  return {
    icon: '🎯',
    title: `${count} filler words — this is your main focus`,
    detail: `${count} fillers in one response is noticeable. The root cause: you\'re speaking faster than you\'re thinking. Try this — cut your speaking speed by 20%, pause at every comma, and replace every "um" with silence. Record yourself doing this drill for 5 minutes before your next session.`,
    tag: 'NEEDS WORK',
    tagColor: '#FF3054',
    tagBg: 'rgba(255,48,84,0.15)',
  }
}

// ── PACE ANALYSIS ──────────────────────────────────────────────────────────

function paceFeedback(pace: number, targetMin: number, targetMax: number): FeedbackPoint | null {
  if (pace <= 0) return null // no transcript yet

  if (pace >= targetMin && pace <= targetMax) {
    return {
      icon: '⚡',
      title: `Perfect pace — ${pace} WPM`,
      detail: `${pace} WPM lands exactly in the ideal ${targetMin}–${targetMax} range. At this speed your listeners can absorb what you say without getting lost or bored. Keep this as your natural pace.`,
      tag: 'PACE ✓',
      tagColor: '#AAFF00',
      tagBg: 'rgba(170,255,0,0.10)',
    }
  }
  if (pace > targetMax) {
    const overage = pace - targetMax
    return {
      icon: '🐢',
      title: `Slow down — ${pace} WPM is ${overage} over ideal`,
      detail: `You spoke ${overage} WPM too fast. At high speeds, listeners miss details and you sound anxious. Try this: after your opening sentence, pause for 2 full seconds before continuing. That single pause resets your pace for the entire response.`,
      tag: 'QUICK WIN',
      tagColor: '#FFB800',
      tagBg: 'rgba(255,184,0,0.12)',
    }
  }
  return {
    icon: '⚡',
    title: `Pick up the pace — ${pace} WPM is too slow`,
    detail: `${pace} WPM is below the engaging range of ${targetMin}–${targetMax}. Slow delivery can lose listeners. Try adding more energy to your opening line and speaking your main points with deliberate emphasis — not just reading them.`,
    tag: 'PACING',
    tagColor: '#FFB800',
    tagBg: 'rgba(255,184,0,0.12)',
  }
}

// ── LENGTH ANALYSIS ────────────────────────────────────────────────────────

function lengthFeedback(duration: number, status: string): FeedbackPoint | null {
  const fmt = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`

  if (status === 'too-short') {
    return {
      icon: '⏱',
      title: `Answer too short — ${fmt(duration)} isn't enough`,
      detail: `A ${fmt(duration)} answer leaves your listener wanting more in the wrong way. Strong answers have three parts: context (why this matters), your main point, and a specific example or result. Even 45 seconds can cover all three if you\'re concise.`,
      tag: 'TOO SHORT',
      tagColor: '#FF3054',
      tagBg: 'rgba(255,48,84,0.12)',
    }
  }
  if (status === 'too-long') {
    return {
      icon: '⏱',
      title: `Strong effort — ${fmt(duration)} is a solid answer`,
      detail: `${fmt(duration)} shows you have depth to your answer. For longer responses, make sure your opening sentence delivers your main point — don\'t make your listener wait for the payoff.`,
      tag: 'LONG FORM ✓',
      tagColor: '#00AEFF',
      tagBg: 'rgba(0,174,255,0.10)',
    }
  }
  return null // in-range, no feedback needed
}

// ── STRUCTURE FEEDBACK BY TIER ────────────────────────────────────────────

function structureFeedback(tier: string, score: number): FeedbackPoint {
  const drills: Record<string, FeedbackPoint> = {
    'excellent': {
      icon: '🏆',
      title: 'Strong structure and clarity',
      detail: `A ${score}/100 clarity score shows you\'re communicating with real precision. To keep improving: record yourself answering prompts you\'ve never seen before and focus on how fast you can orient your listener in the first sentence.`,
      tag: 'ADVANCED',
      tagColor: '#AAFF00',
      tagBg: 'rgba(170,255,0,0.10)',
    },
    'good': {
      icon: '💡',
      title: 'Lead with your conclusion',
      detail: `You\'re scoring well (${score}/100) but the fastest way to the next level is opening with your main point. Don\'t warm up — land your strongest idea in the first sentence, then back it up. This alone can add 10–15 clarity points.`,
      tag: 'STRUCTURE',
      tagColor: '#AAFF00',
      tagBg: 'rgba(170,255,0,0.10)',
    },
    'developing': {
      icon: '💡',
      title: 'Build your answer in three parts',
      detail: `At ${score}/100, the most effective framework is: Point → Reason → Example. State what you think, say why, then give one specific example. This structure makes any answer sound more organized and confident immediately.`,
      tag: 'STRUCTURE',
      tagColor: '#FFB800',
      tagBg: 'rgba(255,184,0,0.12)',
    },
    'needs-work': {
      icon: '💡',
      title: 'Start with one clear sentence',
      detail: `Score: ${score}/100. The single highest-impact change right now: spend 5 seconds before recording to write one sentence that summarizes your answer. Then open with that sentence. Everything else supports it. This alone can jump your score by 15–20 points.`,
      tag: 'FOUNDATION',
      tagColor: '#FF3054',
      tagBg: 'rgba(255,48,84,0.12)',
    },
  }
  return drills[tier] || drills['developing']
}

// ── PATTERN DETECTION ACROSS SESSIONS ─────────────────────────────────────

function detectPatterns(current: Session, history: Session[]): FeedbackPoint | null {
  if (history.length < 2) return null

  const recent = history.slice(0, 3) // last 3 sessions

  // Pattern: filler words consistently high
  const avgFillers = recent.reduce((a, s) => a + s.fillerCount, 0) / recent.length
  if (current.fillerCount > 5 && avgFillers > 5) {
    return {
      icon: '📈',
      title: `Filler words are a recurring pattern`,
      detail: `Across your last ${recent.length} sessions you\'ve averaged ${avgFillers.toFixed(0)} filler words. This is your single biggest opportunity right now. Tonight: set a timer for 3 minutes and talk about your day to yourself out loud. Every time you feel a filler coming, stop and breathe. Do this daily for one week.`,
      tag: 'PATTERN ALERT',
      tagColor: '#FF3054',
      tagBg: 'rgba(255,48,84,0.12)',
    }
  }

  // Pattern: consistently improving
  const improving = history.length >= 3 &&
    history[0].clarityScore > history[1].clarityScore &&
    history[1].clarityScore > history[2].clarityScore

  if (improving) {
    const gain = history[0].clarityScore - history[2].clarityScore
    return {
      icon: '📈',
      title: `3 sessions of improvement — +${gain} points`,
      detail: `Your clarity score has gone up every single session for the last 3 reps. That\'s not luck — that\'s a habit forming. The compound effect of consistent practice is real and you\'re seeing it in your scores.`,
      tag: 'ON A STREAK 🔥',
      tagColor: '#AAFF00',
      tagBg: 'rgba(170,255,0,0.10)',
    }
  }

  // Pattern: pace consistently too fast
  const avgPace = recent.filter(s => s.pace > 0).reduce((a, s) => a + s.pace, 0) / recent.filter(s => s.pace > 0).length
  if (avgPace > 170 && current.pace > 170) {
    return {
      icon: '🐢',
      title: 'Speaking fast is a consistent habit',
      detail: `Your pace has been above 170 WPM across multiple sessions. Fast speech is often a nerves response. Before recording, try 3 deep breaths and consciously set your opening sentence at 50% of your normal speed. The rest of your answer will naturally follow.`,
      tag: 'PACE PATTERN',
      tagColor: '#FFB800',
      tagBg: 'rgba(255,184,0,0.12)',
    }
  }

  return null
}

// ── PERSONAL BEST DETECTION ────────────────────────────────────────────────

export function detectPersonalBests(current: Session, history: Session[]) {
  const bests = {
    highestClarity: false,
    lowestFillers: false,
    longestStreak: false,
    firstSession: history.length === 0,
  }

  if (history.length === 0) return bests

  const prevBestClarity = Math.max(...history.map(s => s.clarityScore))
  const prevBestFillers = Math.min(...history.map(s => s.fillerCount))

  if (current.clarityScore > prevBestClarity) bests.highestClarity = true
  if (current.fillerCount < prevBestFillers && history.length > 0) bests.lowestFillers = true

  return bests
}

// ── MAIN COACHING ENGINE ───────────────────────────────────────────────────

export function generateCoaching(
  current: Session,
  history: Session[],
  targetMin: number,
  targetMax: number
): FeedbackPoint[] {
  const tier = getTier(current.clarityScore)
  const points: FeedbackPoint[] = []

  // 1. Pattern detection first — highest priority
  const pattern = detectPatterns(current, history)
  if (pattern) points.push(pattern)

  // 2. Filler words
  const filler = fillerFeedback(current.fillerCount, tier)
  if (filler && points.length < 3) points.push(filler)

  // 3. Pace (only if we have real data)
  const pace = paceFeedback(current.pace, targetMin, targetMax)
  if (pace && points.length < 3) points.push(pace)

  // 4. Length
  const length = lengthFeedback(current.duration, current.lengthStatus)
  if (length && points.length < 3) points.push(length)

  // 5. Structure — always include, tier-specific
  if (points.length < 3) {
    points.push(structureFeedback(tier, current.clarityScore))
  }

  return points.slice(0, 3)
}

// ── CELEBRATION MESSAGE ────────────────────────────────────────────────────

export function getCelebrationMessage(
  score: number,
  bests: ReturnType<typeof detectPersonalBests>,
  isFirstSession: boolean
): string {
  if (isFirstSession) return 'First session complete. Baseline set. Now the real training begins.'
  if (bests.highestClarity) return `New personal best — ${score}/100. You just set a new standard for yourself.`
  if (bests.lowestFillers) return 'Fewest filler words ever. Your instinct to pause instead of fill is getting stronger.'
  if (score >= 85) return 'That was a strong rep. Consistency at this level is what separates good communicators from great ones.'
  if (score >= 70) return 'Solid session. You\'re building the habit — keep the reps coming.'
  if (score >= 55) return 'Every session is data. You know exactly what to work on next.'
  return 'First reps are always the hardest. The trend matters more than any single score.'
}

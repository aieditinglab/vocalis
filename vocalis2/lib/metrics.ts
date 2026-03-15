import type { FeedbackItem } from './storage'

// ─── Filler word list ─────────────────────────────────────────────────────────

export const FILLER_WORDS = [
  'um', 'uh', 'like', 'basically', 'literally', 'right',
  'actually', 'just', 'you know', 'kind of', 'sort of',
  'i mean', 'you see', 'well', 'ya know', 'so', 'okay so',
]

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MetricsResult {
  fillerCount: number
  detectedFillers: string[]   // unique filler words found
  pacingWPM: number
  lengthStatus: 'short' | 'good' | 'long'
  clarityScore: number        // 0–100
}

// ─── Core analysis ────────────────────────────────────────────────────────────

export function analyzeTranscript(transcript: string, durationSecs: number): MetricsResult {
  const text = (transcript || '').trim()
  const words = text ? text.split(/\s+/).filter(Boolean) : []
  const wordCount = words.length

  // Filler detection
  const detectedSet = new Set<string>()
  let fillerCount = 0

  FILLER_WORDS.forEach(filler => {
    const escaped = filler.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+')
    const regex = new RegExp(`\\b${escaped}\\b`, 'gi')
    const matches = text.match(regex) ?? []
    if (matches.length > 0) {
      detectedSet.add(filler)
      fillerCount += matches.length
    }
  })

  // Pace — only meaningful if we have words
  const minutes = durationSecs / 60
  const pacingWPM = minutes > 0 && wordCount > 5 ? Math.round(wordCount / minutes) : 0

  // Length
  const lengthStatus: 'short' | 'good' | 'long' =
    durationSecs < 30 ? 'short' : 'good'

  // Clarity score (deductions)
  let score = 100
  score -= Math.min(fillerCount * 4, 35)      // fillers: up to -35
  if (pacingWPM > 0) {
    if (pacingWPM > 190)      score -= 18
    else if (pacingWPM > 170) score -= 10
    else if (pacingWPM > 160) score -= 5
    if (pacingWPM < 100)      score -= 15
    else if (pacingWPM < 120) score -= 7
    else if (pacingWPM < 130) score -= 3
  } else {
    score -= 10 // no transcript = can't fully score
  }
  if (lengthStatus !== 'good') score -= 5

  const clarityScore = Math.max(5, Math.min(100, Math.round(score)))

  return {
    fillerCount,
    detectedFillers: [...detectedSet],
    pacingWPM,
    lengthStatus,
    clarityScore,
  }
}

// ─── Feedback generation ──────────────────────────────────────────────────────

export function generateFeedback(metrics: MetricsResult, transcript: string): FeedbackItem[] {
  const items: FeedbackItem[] = []
  const lower = (transcript || '').toLowerCase()

  // 1. Filler word feedback
  if (metrics.fillerCount > 0) {
    const list = metrics.detectedFillers.slice(0, 3).join(', ')
    const severity = metrics.fillerCount > 10 ? 'HIGH IMPACT' as const : 'QUICK WIN' as const
    items.push({
      icon: '🎯',
      title: `Remove ${metrics.fillerCount > 10 ? 'the filler words' : 'your fillers'}`,
      detail: `You used ${metrics.fillerCount} filler word${metrics.fillerCount !== 1 ? 's' : ''} — ${list}. Replace each one with a 1-second pause. Silence sounds confident; fillers signal uncertainty.`,
      tag: severity,
      tagColor: metrics.fillerCount > 10 ? '#FF3054' : '#FFB800',
      tagBg: metrics.fillerCount > 10 ? 'rgba(255,48,84,0.12)' : 'rgba(255,184,0,0.12)',
    })
  }

  // 2. Pace feedback
  if (metrics.pacingWPM > 0) {
    if (metrics.pacingWPM > 170) {
      items.push({
        icon: '🐢',
        title: 'Slow your pace',
        detail: `You spoke at ${metrics.pacingWPM} WPM — above the ideal 140–160 range. After each main idea, pause and breathe before moving on. This gives your listener time to absorb what you said.`,
        tag: 'QUICK WIN',
        tagColor: '#FFB800',
        tagBg: 'rgba(255,184,0,0.12)',
      })
    } else if (metrics.pacingWPM < 110) {
      items.push({
        icon: '⚡',
        title: 'Pick up the energy',
        detail: `You spoke at ${metrics.pacingWPM} WPM — below the ideal 140–160. A slightly faster pace signals confidence and keeps your audience engaged. Think natural conversation, not slow reading.`,
        tag: 'QUICK WIN',
        tagColor: '#FFB800',
        tagBg: 'rgba(255,184,0,0.12)',
      })
    }
  }

  // 3. Structure / opening feedback
  const hedges = ['i think', 'i guess', 'i feel like', 'maybe', 'kind of', 'sort of']
  const firstLine = lower.slice(0, 80)
  if (hedges.some(h => firstLine.includes(h))) {
    items.push({
      icon: '💡',
      title: 'Open with conviction',
      detail: 'You opened with a hedge like "I think" or "I guess." Lead with your main point directly — no warm-up. Confident openers immediately establish authority.',
      tag: 'STRUCTURE',
      tagColor: '#AAFF00',
      tagBg: 'rgba(170,255,0,0.10)',
    })
  }

  // 4. High score acknowledgment
  if (metrics.clarityScore >= 80 && items.length < 3) {
    items.push({
      icon: '⭐',
      title: 'Solid clarity score',
      detail: `${metrics.clarityScore}/100 is strong. Your next goal is 85+. Focus: eliminate the remaining ${metrics.fillerCount} filler${metrics.fillerCount !== 1 ? 's' : ''} and make sure your strongest point comes first.`,
      tag: 'QUICK WIN',
      tagColor: '#FFB800',
      tagBg: 'rgba(255,184,0,0.12)',
    })
  }

  // 5. Structure fallback
  if (items.length < 3) {
    items.push({
      icon: '💡',
      title: 'Lead with your point',
      detail: 'State your strongest idea first, then support it with evidence or examples. This structure consistently scores higher on clarity and grabs your listener from word one.',
      tag: 'STRUCTURE',
      tagColor: '#AAFF00',
      tagBg: 'rgba(170,255,0,0.10)',
    })
  }

  // 6. No transcript fallback
  if (metrics.pacingWPM === 0 && items.length < 3) {
    items.push({
      icon: '🎤',
      title: 'Use Chrome for full analysis',
      detail: 'Live transcription works best in Google Chrome. In other browsers, some metrics may be limited. Switch to Chrome for filler word detection and pace analysis.',
      tag: 'QUICK WIN',
      tagColor: '#FFB800',
      tagBg: 'rgba(255,184,0,0.12)',
    })
  }

  return items.slice(0, 3)
}

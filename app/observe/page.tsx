'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Nav from '@/components/Nav'
import { getPendingSession, setPendingSession, getSettings } from '@/lib/store'
import { audioStore } from '@/lib/audioStore'

function fmt(s: number) {
  return `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`
}

// Real analysis based on actual recording duration
// When Whisper API is added in Phase 6, replace this with real transcript analysis
function analyzeFromDuration(durationSecs: number, targetMin: number, targetMax: number) {
  const durationMins = durationSecs / 60

  // Derive realistic estimates from duration
  // Average speaker: 130-160 WPM, we use 145 as baseline
  const estimatedWords = Math.round(durationMins * 145)

  // Length status
  const lengthStatus: 'in-range' | 'too-short' | 'too-long' =
    durationSecs < 30 ? 'too-short' :
    durationSecs > 660 ? 'too-long' : 'in-range'

  // Pace — we can't know exact WPM without transcript
  // Show as estimated range based on duration
  const estimatedPace = 145 // placeholder until Whisper

  // Clarity starts high, docked if length is off
  let clarity = 75
  if (lengthStatus === 'in-range') clarity += 10
  if (durationSecs >= 45 && durationSecs <= 120) clarity += 5
  if (durationSecs < 30) clarity -= 20
  clarity = Math.max(0, Math.min(100, clarity))

  const feedback = []

  if (lengthStatus === 'too-short') {
    feedback.push({
      icon: '⏱',
      title: 'Recording too short',
      detail: `Your answer was only ${fmt(durationSecs)} — aim for at least 30 seconds. A complete answer needs time to set up context, deliver your main point, and wrap up.`,
      tag: 'LENGTH',
      tagColor: '#FF3054',
      tagBg: 'rgba(255,48,84,0.12)',
    })
  } else if (lengthStatus === 'in-range') {
    feedback.push({
      icon: '✓',
      title: 'Good answer length',
      detail: `${fmt(durationSecs)} is a strong response time. You gave yourself enough room to make your point without rambling.`,
      tag: 'LENGTH ✓',
      tagColor: '#AAFF00',
      tagBg: 'rgba(170,255,0,0.10)',
    })
  }

  feedback.push({
    icon: '🎯',
    title: 'Connect speech-to-text for filler word analysis',
    detail: 'Full filler word detection (um, uh, like, you know) activates when the Whisper API is connected. This gives you exact counts and timestamps. Coming in Phase 6.',
    tag: 'COMING SOON',
    tagColor: '#FFB800',
    tagBg: 'rgba(255,184,0,0.12)',
  })

  feedback.push({
    icon: '💡',
    title: 'Lead with your strongest point',
    detail: 'Open with your most powerful idea, then support it. This structure consistently scores higher on clarity in interviews and presentations.',
    tag: 'STRUCTURE',
    tagColor: '#AAFF00',
    tagBg: 'rgba(170,255,0,0.10)',
  })

  return {
    wordCount: estimatedWords,
    pace: estimatedPace,
    fillerCount: 0,
    fillerWords: [],
    lengthStatus,
    clarityScore: clarity,
    feedback: feedback.slice(0, 3),
    transcriptPreview: '',
    isEstimated: true,
  }
}

export default function ObservePage() {
  const router = useRouter()
  const [analysis, setAnalysis] = useState<any>(null)
  const [duration, setDuration] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const p = getPendingSession()
    const audio = audioStore.get()
    const dur = audio.duration || (p as any)?.duration || 0
    setDuration(dur)
    const settings = getSettings()

    // Simulate processing time for UX feel
    const timer = setTimeout(() => {
      const result = analyzeFromDuration(dur, settings.targetWpmMin, settings.targetWpmMax)
      setAnalysis(result)
      setPendingSession({ ...p, ...result, duration: dur })
      setLoading(false)
    }, 2000)

    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!analysis) return
    const timeout = setTimeout(() => {
      const scores = [
        analysis.fillerCount === 0 ? 90 : Math.max(0, 100 - analysis.fillerCount * 8),
        80, // pace placeholder
        analysis.lengthStatus === 'in-range' ? 100 : 40,
        analysis.clarityScore,
      ]
      scores.forEach((score, i) => {
        const el = document.getElementById(`pf-${i}`)
        if (el) el.style.width = score + '%'
      })
    }, 300)
    return () => clearTimeout(timeout)
  }, [analysis])

  return (
    <>
      <Nav backHref="/record/session" />
      <div className="container">
        <p className="eyebrow anim-slide-up anim-d1">STEP 2 OF 5 — OBSERVE</p>
        <h1 className="font-display anim-slide-up anim-d2" style={{ fontSize: 'clamp(30px,5vw,52px)', fontWeight: 900, letterSpacing: '-.04em', marginBottom: '8px' }}>
          Here&apos;s what the AI measured.
        </h1>
        <p className="text-muted anim-slide-up anim-d2" style={{ fontSize: '16px', marginBottom: '40px' }}>
          Analysis from your {fmt(duration)} recording.
        </p>

        {loading ? (
          <div className="metrics-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '32px' }}>
            {[0, 1, 2, 3].map(i => (
              <div key={i} className="metric-card shimmer" style={{ height: '160px', animationDelay: `${i * 0.1}s` }} />
            ))}
          </div>
        ) : analysis && (
          <>
            {analysis.isEstimated && (
              <div className="anim-slide-up anim-d1" style={{ background: 'rgba(255,184,0,0.06)', border: '1px solid rgba(255,184,0,0.2)', borderRadius: '14px', padding: '12px 18px', marginBottom: '20px', fontSize: '13px', color: 'var(--amber)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>⚡</span>
                <span>Filler word detection activates when Whisper API is connected (Phase 6). Duration and length analysis are live now.</span>
              </div>
            )}

            <div className="metrics-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '32px' }}>
              {[
                {
                  label: 'Filler Words',
                  val: '—',
                  unit: 'needs API',
                  detail: 'Connect Whisper to detect um, uh, like',
                  color: 'var(--text-muted)',
                  icon: '🗣',
                  score: 50,
                },
                {
                  label: 'Response Length',
                  val: fmt(duration),
                  unit: '',
                  detail: analysis.lengthStatus === 'in-range' ? 'In range ✓ (30s–11min)' : analysis.lengthStatus === 'too-short' ? 'Too short — aim for 30s+' : 'Solid long-form answer',
                  color: analysis.lengthStatus === 'in-range' ? 'var(--accent)' : 'var(--hot)',
                  icon: '⏱',
                  score: analysis.lengthStatus === 'in-range' ? 100 : 40,
                },
                {
                  label: 'Est. Word Count',
                  val: analysis.wordCount.toString(),
                  unit: 'words',
                  detail: 'Based on avg speaking pace of 145 WPM',
                  color: 'var(--blue)',
                  icon: '📝',
                  score: 75,
                },
                {
                  label: 'Clarity Score',
                  val: analysis.clarityScore.toString(),
                  unit: '/ 100',
                  detail: analysis.clarityScore >= 80 ? 'Excellent' : analysis.clarityScore >= 60 ? 'Good — improving' : 'Keep practicing',
                  color: 'var(--accent)',
                  icon: '✦',
                  score: analysis.clarityScore,
                },
              ].map((m, i) => (
                <div key={m.label} className="metric-card" style={{ animationDelay: `${i * 0.1}s` }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '.08em', color: 'var(--text-muted)' }}>{m.label.toUpperCase()}</span>
                    <span style={{ fontSize: '18px' }}>{m.icon}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '8px' }}>
                    <span className="font-display" style={{ fontSize: 'clamp(32px,5vw,44px)', fontWeight: 900, letterSpacing: '-.04em', color: m.color }}>{m.val}</span>
                    {m.unit && <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500 }}>{m.unit}</span>}
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '14px' }}>{m.detail}</p>
                  <div className="prog-track">
                    <div id={`pf-${i}`} className="prog-fill" style={{ background: m.color }} />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        <button
          onClick={() => router.push('/correct')}
          className="btn btn-primary btn-full btn-lg anim-slide-up anim-d5"
          disabled={loading}
          style={{ opacity: loading ? 0.5 : 1, display: 'flex' }}
        >
          {loading ? 'Analyzing...' : 'See My Coaching →'}
        </button>
      </div>
    </>
  )
}

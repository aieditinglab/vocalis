'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Nav from '@/components/Nav'
import { getPendingSession, getSettings } from '@/lib/db'
import { audioStore } from '@/lib/audioStore'

function fmt(s: number) {
  return `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`
}

export default function ObservePage() {
  const router = useRouter()
  const [analysis, setAnalysis] = useState<any>(null)
  const [duration, setDuration] = useState(0)
  const [loading, setLoading]   = useState(true)
  const [settings, setSettings] = useState<any>({ targetWpmMin: 140, targetWpmMax: 160 })

  useEffect(() => {
    const p = getPendingSession()
    const audio = audioStore.get()
    const dur = audio.duration || (p as any)?.duration || 0
    setDuration(dur)

    getSettings().then(cfg => setSettings(cfg))

    setTimeout(() => {
      if (p && (p as any).clarityScore !== undefined) {
        // Already analyzed in recording page (has transcript)
        setAnalysis(p)
      } else {
        // Fallback duration-based analysis
        const durationMins = dur / 60
        setAnalysis({
          fillerCount: 0,
          fillerWords: [],
          pace: 0,
          wordCount: Math.round(durationMins * 145),
          clarityScore: dur >= 30 ? 72 : 40,
          lengthStatus: dur < 30 ? 'too-short' : dur > 660 ? 'too-long' : 'in-range',
          transcript: '',
          isEstimated: true,
        })
      }
      setLoading(false)
    }, 1800)
  }, [])

  useEffect(() => {
    if (!analysis) return
    const t = setTimeout(() => {
      const scores = [
        analysis.fillerCount === 0 ? 95 : Math.max(20, 100 - analysis.fillerCount * 6),
        analysis.pace > 0
          ? Math.max(20, 100 - Math.abs(analysis.pace - 150) * 1.5)
          : 60,
        analysis.lengthStatus === 'in-range' ? 100 : 40,
        analysis.clarityScore,
      ]
      scores.forEach((score, i) => {
        const el = document.getElementById(`pf-${i}`)
        if (el) el.style.width = Math.round(score) + '%'
      })
    }, 300)
    return () => clearTimeout(t)
  }, [analysis])

  const hasRealTranscript = analysis && !analysis.isEstimated && analysis.transcript

  return (
    <>
      <Nav backHref="/record/session" />
      <div className="container">
        <p className="eyebrow anim-slide-up anim-d1">STEP 2 OF 5 — OBSERVE</p>
        <h1 className="font-display anim-slide-up anim-d2" style={{ fontSize: 'clamp(30px,5vw,52px)', fontWeight: 900, letterSpacing: '-.04em', marginBottom: '8px' }}>
          Here&apos;s what the AI measured.
        </h1>
        <p className="text-muted anim-slide-up anim-d2" style={{ fontSize: '16px', marginBottom: '32px' }}>
          {fmt(duration)} recording · {hasRealTranscript ? 'Real-time transcription' : 'Duration-based analysis'}
        </p>

        {loading ? (
          <div className="metrics-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '32px' }}>
            {[0, 1, 2, 3].map(i => <div key={i} className="metric-card shimmer" style={{ height: '160px' }} />)}
          </div>
        ) : analysis && (
          <>
            {!hasRealTranscript && (
              <div className="anim-slide-up anim-d1" style={{ background: 'rgba(255,184,0,.06)', border: '1px solid rgba(255,184,0,.2)', borderRadius: '14px', padding: '12px 18px', marginBottom: '20px', fontSize: '13px', color: 'var(--amber)' }}>
                ⚡ Use Chrome or Edge for real-time filler word detection and WPM analysis.
              </div>
            )}

            <div className="metrics-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '32px' }}>
              {[
                {
                  label: 'Filler Words',
                  val: hasRealTranscript ? analysis.fillerCount.toString() : '—',
                  unit: hasRealTranscript ? 'detected' : 'needs transcript',
                  detail: hasRealTranscript
                    ? (analysis.fillerCount === 0 ? '🎉 Zero fillers — clean delivery!' : analysis.fillerWords.slice(0, 4).join(' · '))
                    : 'Use Chrome for live filler detection',
                  color: !hasRealTranscript ? 'var(--text-muted)'
                    : analysis.fillerCount === 0 ? 'var(--accent)'
                    : analysis.fillerCount > 8 ? 'var(--hot)' : 'var(--amber)',
                  icon: '🗣',
                  score: hasRealTranscript ? Math.max(20, 100 - analysis.fillerCount * 6) : 60,
                },
                {
                  label: 'Speaking Pace',
                  val: analysis.pace > 0 ? analysis.pace.toString() : '—',
                  unit: analysis.pace > 0 ? 'WPM' : 'needs transcript',
                  detail: analysis.pace > 0
                    ? (analysis.pace > settings.targetWpmMax ? 'Too fast — slow down' : analysis.pace < settings.targetWpmMin ? 'Too slow — pick it up' : `Perfect — ideal range ✓`)
                    : 'Use Chrome for live pace analysis',
                  color: analysis.pace === 0 ? 'var(--text-muted)'
                    : analysis.pace > settings.targetWpmMax + 20 ? 'var(--hot)'
                    : analysis.pace < settings.targetWpmMin - 20 ? 'var(--amber)' : 'var(--accent)',
                  icon: '⚡',
                  score: analysis.pace > 0 ? Math.max(20, 100 - Math.abs(analysis.pace - 150) * 1.5) : 60,
                },
                {
                  label: 'Response Length',
                  val: fmt(duration),
                  unit: '',
                  detail: analysis.lengthStatus === 'in-range' ? 'In range ✓ (30s–11min)'
                    : analysis.lengthStatus === 'too-short' ? 'Too short — aim for 30s+'
                    : 'Great long-form response',
                  color: analysis.lengthStatus === 'in-range' ? 'var(--accent)' : 'var(--hot)',
                  icon: '⏱',
                  score: analysis.lengthStatus === 'in-range' ? 100 : 40,
                },
                {
                  label: 'Clarity Score',
                  val: analysis.clarityScore.toString(),
                  unit: '/ 100',
                  detail: analysis.clarityScore >= 85 ? 'Excellent performance'
                    : analysis.clarityScore >= 70 ? 'Good — keep improving'
                    : analysis.clarityScore >= 55 ? 'Developing — stay consistent'
                    : 'Keep practicing — you\'ll get there',
                  color: 'var(--accent)',
                  icon: '✦',
                  score: analysis.clarityScore,
                },
              ].map((m, i) => (
                <div key={m.label} className="metric-card" style={{ animationDelay: `${i * .1}s` }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '.08em', color: 'var(--text-muted)' }}>{m.label.toUpperCase()}</span>
                    <span style={{ fontSize: '18px' }}>{m.icon}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '8px' }}>
                    <span className="font-display" style={{ fontSize: 'clamp(32px,5vw,44px)', fontWeight: 900, letterSpacing: '-.04em', color: m.color }}>{m.val}</span>
                    {m.unit && <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{m.unit}</span>}
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '14px', lineHeight: 1.5 }}>{m.detail}</p>
                  <div className="prog-track"><div id={`pf-${i}`} className="prog-fill" style={{ background: m.color }} /></div>
                </div>
              ))}
            </div>

            {/* Live transcript preview */}
            {hasRealTranscript && (
              <div className="anim-slide-up anim-d4" style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '20px', marginBottom: '20px' }}>
                <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '.08em', color: 'var(--text-muted)', marginBottom: '10px' }}>TRANSCRIPT PREVIEW</p>
                <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.7, fontStyle: 'italic' }}>
                  &ldquo;{analysis.transcriptPreview}&rdquo;
                </p>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>
                  {analysis.wordCount} words · {analysis.pace} WPM · {analysis.fillerCount} fillers
                </p>
              </div>
            )}
          </>
        )}

        <button onClick={() => router.push('/correct')} className="btn btn-primary btn-full btn-lg anim-slide-up anim-d5"
          disabled={loading} style={{ opacity: loading ? 0.5 : 1, display: 'flex' }}>
          {loading ? 'Analyzing...' : 'See My Coaching →'}
        </button>
      </div>
    </>
  )
}

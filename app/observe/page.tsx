'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Nav from '@/components/Nav'
import { getPendingSession, setPendingSession, getSettings, getSessions } from '@/lib/db'
import { audioStore } from '@/lib/audioStore'
import { getAICoaching } from '@/lib/aiCoaching'
import type { AICoachingResult } from '@/lib/aiCoaching'

function fmt(s: number) {
  return `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`
}

type LoadingStep = 'measuring' | 'analyzing' | 'coaching' | 'done'

export default function ObservePage() {
  const router = useRouter()
  const [aiResult, setAiResult]   = useState<AICoachingResult | null>(null)
  const [metrics, setMetrics]     = useState<any>(null)
  const [duration, setDuration]   = useState(0)
  const [step, setStep]           = useState<LoadingStep>('measuring')
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    const run = async () => {
      const p = getPendingSession()
      const audio = audioStore.get()
      const dur = audio.duration || (p as any)?.duration || 0
      setDuration(dur)

      const settings = await getSettings()
      const history = await getSessions()

      // Step 1: Measure
      setStep('measuring')
      await new Promise(r => setTimeout(r, 800))

      // Get metrics from pending session (set during recording)
      const m = {
        fillerCount: (p as any)?.fillerCount || 0,
        fillerWords: (p as any)?.fillerWords || [],
        pace: (p as any)?.pace || 0,
        wordCount: (p as any)?.wordCount || 0,
        clarityScore: (p as any)?.clarityScore || Math.max(40, 75 - ((p as any)?.fillerCount || 0) * 3),
        lengthStatus: dur < 30 ? 'too-short' : dur > 660 ? 'too-long' : 'in-range',
        transcript: (p as any)?.transcript || '',
      }
      setMetrics(m)

      // Animate bars
      setTimeout(() => {
        const scores = [
          m.fillerCount === 0 ? 95 : Math.max(20, 100 - m.fillerCount * 6),
          m.pace > 0 ? Math.max(20, 100 - Math.abs(m.pace - 150) * 1.5) : 60,
          m.lengthStatus === 'in-range' ? 100 : 40,
          m.clarityScore,
        ]
        scores.forEach((score, i) => {
          const el = document.getElementById(`pf-${i}`)
          if (el) el.style.width = Math.round(score) + '%'
        })
      }, 300)

      // Step 2: AI Analysis
      setStep('analyzing')
      await new Promise(r => setTimeout(r, 600))

      setStep('coaching')

      // Call Claude AI
      const aiInput = {
        transcript: (p as any)?.transcript || '',
        duration: dur,
        fillerCount: m.fillerCount,
        fillerWords: m.fillerWords,
        pace: m.pace,
        clarityScore: m.clarityScore,
        lengthStatus: m.lengthStatus,
        category: (p as any)?.category || 'General',
        prompt: (p as any)?.prompt || '',
        selfRatings: (p as any)?.selfRatings,
        sessionHistory: history.slice(0, 3).map(s => ({
          clarityScore: s.clarityScore,
          fillerCount: s.fillerCount,
          pace: s.pace,
          date: s.date,
        })),
        uploadedScript: (p as any)?.uploadedScript || '',
        rubric: (p as any)?.rubric || '',
      }

      const result = await getAICoaching(aiInput)
      setAiResult(result)

      // Save updated analysis to pending session
      setPendingSession({
        ...p,
        ...m,
        duration: dur,
        clarityScore: result.overallScore,
        feedback: result.coachingPoints,
        aiAnalysis: result,
      })

      setStep('done')
      setLoading(false)
    }
    run()
  }, [])

  const selfRatings = (getPendingSession() as any)?.selfRatings

  const loadingMessages: Record<LoadingStep, string> = {
    measuring: 'Measuring your speech metrics...',
    analyzing: 'AI is reading your transcript...',
    coaching:  'Generating personalized coaching...',
    done:      'Done!',
  }

  return (
    <>
      <Nav backHref="/record/session" />
      <div className="container">
        <p className="eyebrow anim-slide-up anim-d1">STEP 2 OF 5 — OBSERVE + AI ANALYSIS</p>
        <h1 className="font-display anim-slide-up anim-d2" style={{ fontSize: 'clamp(28px,5vw,48px)', fontWeight: 900, letterSpacing: '-.04em', marginBottom: '8px' }}>
          {loading ? loadingMessages[step] : 'Your full analysis.'}
        </h1>
        <p className="text-muted anim-slide-up anim-d2" style={{ fontSize: '16px', marginBottom: '32px' }}>
          {loading ? 'AI is analyzing your specific recording...' : `${fmt(duration)} recording · AI-powered coaching`}
        </p>

        {/* Loading state */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '320px', margin: '0 auto' }}>
              {(['measuring', 'analyzing', 'coaching'] as LoadingStep[]).map((s, i) => (
                <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '12px', opacity: (['measuring', 'analyzing', 'coaching'] as LoadingStep[]).indexOf(step) >= i ? 1 : 0.3, transition: 'opacity .4s' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: step === s ? 'var(--accent)' : (['measuring', 'analyzing', 'coaching'] as LoadingStep[]).indexOf(step) > i ? 'rgba(170,255,0,.3)' : 'var(--card)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', flexShrink: 0, transition: 'all .3s' }}>
                    {(['measuring', 'analyzing', 'coaching'] as LoadingStep[]).indexOf(step) > i ? '✓' : i + 1}
                  </div>
                  <span style={{ fontSize: '14px', color: step === s ? 'var(--text-primary)' : 'var(--text-muted)' }}>{loadingMessages[s]}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Metrics */}
        {metrics && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '24px' }}>
            {[
              {
                label: 'Filler Words',
                val: metrics.fillerCount.toString(),
                unit: 'detected',
                detail: metrics.fillerCount === 0 ? '🎉 Zero fillers — clean delivery!' : metrics.fillerWords.slice(0, 3).join(' · '),
                color: metrics.fillerCount === 0 ? 'var(--accent)' : metrics.fillerCount > 8 ? 'var(--hot)' : 'var(--amber)',
                icon: '🗣',
                score: metrics.fillerCount === 0 ? 95 : Math.max(20, 100 - metrics.fillerCount * 6),
              },
              {
                label: 'Speaking Pace',
                val: metrics.pace > 0 ? metrics.pace.toString() : '—',
                unit: metrics.pace > 0 ? 'WPM' : '',
                detail: metrics.pace === 0 ? 'Use Chrome for live pace measurement' : metrics.pace > 170 ? 'Too fast — slow down' : metrics.pace < 120 ? 'Too slow — pick it up' : 'In ideal range ✓',
                color: metrics.pace === 0 ? 'var(--text-muted)' : metrics.pace > 180 ? 'var(--hot)' : metrics.pace < 110 ? 'var(--amber)' : 'var(--accent)',
                icon: '⚡',
                score: metrics.pace > 0 ? Math.max(20, 100 - Math.abs(metrics.pace - 150) * 1.5) : 60,
              },
              {
                label: 'Response Length',
                val: fmt(duration),
                unit: '',
                detail: metrics.lengthStatus === 'in-range' ? 'In range ✓ (30s–11min)' : metrics.lengthStatus === 'too-short' ? 'Too short — aim for 30s+' : 'Solid long-form answer',
                color: metrics.lengthStatus === 'in-range' ? 'var(--accent)' : 'var(--hot)',
                icon: '⏱',
                score: metrics.lengthStatus === 'in-range' ? 100 : 40,
              },
              {
                label: 'AI Clarity Score',
                val: aiResult ? aiResult.overallScore.toString() : metrics.clarityScore.toString(),
                unit: '/ 100',
                detail: aiResult ? aiResult.overallVerdict.slice(0, 60) + '...' : 'Calculating...',
                color: 'var(--accent)',
                icon: '✦',
                score: aiResult ? aiResult.overallScore : metrics.clarityScore,
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
        )}

        {/* Self vs AI comparison */}
        {!loading && aiResult?.selfVsAI && selfRatings && (
          <div className="anim-slide-up anim-d3" style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '20px', padding: '24px', marginBottom: '20px' }}>
            <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '.1em', color: 'var(--text-muted)', marginBottom: '16px' }}>YOU vs AI — SCORE COMPARISON</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {aiResult.selfVsAI.map(sv => {
                const diff = sv.aiScore - sv.selfScore
                const gapColor = Math.abs(diff) <= 15 ? 'var(--accent)' : diff > 0 ? 'var(--blue)' : 'var(--hot)'
                return (
                  <div key={sv.label}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontWeight: 600, fontSize: '14px' }}>{sv.label}</span>
                      <span style={{ fontSize: '13px', color: gapColor, fontWeight: 700 }}>
                        {Math.abs(diff) <= 15 ? '✓ Aligned' : diff > 0 ? `AI scored you higher +${Math.abs(diff)}` : `AI scored you lower -${Math.abs(diff)}`}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)', width: '60px' }}>You: {sv.selfScore}</span>
                      <div style={{ flex: 1, position: 'relative' }}>
                        <div className="prog-track">
                          <div style={{ height: '100%', borderRadius: '99px', background: 'rgba(170,255,0,.3)', width: `${sv.selfScore}%`, transition: 'width 1s' }} />
                        </div>
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0 }}>
                          <div className="prog-track" style={{ background: 'transparent' }}>
                            <div style={{ height: '100%', borderRadius: '99px', background: 'var(--accent)', width: `${sv.aiScore}%`, transition: 'width 1.2s .2s', opacity: 0.7 }} />
                          </div>
                        </div>
                      </div>
                      <span style={{ fontSize: '12px', color: 'var(--accent)', width: '60px', textAlign: 'right' }}>AI: {sv.aiScore}</span>
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic' }}>{sv.gap}</p>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* AI overall verdict */}
        {!loading && aiResult && (
          <div className="anim-slide-up anim-d3" style={{ background: 'rgba(170,255,0,.04)', border: '1px solid rgba(170,255,0,.15)', borderRadius: '20px', padding: '24px', marginBottom: '20px' }}>
            <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '.1em', color: 'var(--accent)', marginBottom: '10px' }}>AI VERDICT</p>
            <p style={{ fontSize: '16px', lineHeight: 1.7, color: 'var(--text-primary)' }}>{aiResult.overallVerdict}</p>
          </div>
        )}

        {/* Script comparison */}
        {!loading && aiResult?.scriptComparison && (
          <div className="anim-slide-up anim-d3" style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '20px', padding: '24px', marginBottom: '20px' }}>
            <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '.1em', color: 'var(--text-muted)', marginBottom: '10px' }}>SCRIPT vs DELIVERY COMPARISON</p>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.7 }}>{aiResult.scriptComparison}</p>
          </div>
        )}

        {/* Rubric feedback */}
        {!loading && aiResult?.rubricFeedback && (
          <div className="anim-slide-up anim-d3" style={{ background: 'rgba(0,174,255,.04)', border: '1px solid rgba(0,174,255,.2)', borderRadius: '20px', padding: '24px', marginBottom: '20px' }}>
            <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '.1em', color: 'var(--blue)', marginBottom: '10px' }}>RUBRIC EVALUATION</p>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.7 }}>{aiResult.rubricFeedback}</p>
          </div>
        )}

        <button onClick={() => router.push('/correct')} className="btn btn-primary btn-full btn-lg anim-slide-up anim-d5"
          disabled={loading} style={{ opacity: loading ? 0.5 : 1 }}>
          {loading ? 'AI is analyzing...' : 'See Full Coaching →'}
        </button>
      </div>
    </>
  )
}

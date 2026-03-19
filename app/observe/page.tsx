'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Nav from '@/components/Nav'
import { getPendingSession, setPendingSession, getSettings, getSessions } from '@/lib/db'
import { audioStore } from '@/lib/audioStore'

type AICoachingResult = {
  overallScore: number
  summary: string
  strengths: string[]
  improvements: string[]
  deliveryFeedback: string
  suggestedRewrite: string

  // optional fields (so TS doesn't break UI)
  overallVerdict?: string
  selfVsAI?: {
    label: string
    selfScore: number
    aiScore: number
    gap: string
  }[]
  scriptComparison?: string
  rubricFeedback?: string
}

type Metrics = {
  fillerCount: number
  fillerWords: string[]
  pace: number
  wordCount: number
  clarityScore: number
  lengthStatus: 'too-short' | 'too-long' | 'in-range'
  transcript: string
}

function fmt(s: number) {
  return `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60)
    .toString()
    .padStart(2, '0')}`
}

type LoadingStep = 'measuring' | 'analyzing' | 'coaching' | 'done'

export default function ObservePage() {
  const router = useRouter()

  const [aiResult, setAiResult] = useState<AICoachingResult | null>(null)
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [duration, setDuration] = useState(0)
  const [step, setStep] = useState<LoadingStep>('measuring')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const run = async () => {
      const p = getPendingSession() as any
      const audio = audioStore.get()

      const dur = audio.duration || p?.duration || 0
      setDuration(dur)

      const history = await getSessions()

      // STEP 1
      setStep('measuring')
      await new Promise((r) => setTimeout(r, 800))

      const m: Metrics = {
        fillerCount: p?.fillerCount || 0,
        fillerWords: p?.fillerWords || [],
        pace: p?.pace || 0,
        wordCount: p?.wordCount || 0,
        clarityScore: p?.clarityScore || Math.max(40, 75 - (p?.fillerCount || 0) * 3),
        lengthStatus:
          dur < 30 ? 'too-short' : dur > 660 ? 'too-long' : 'in-range',
        transcript: p?.transcript || '',
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

      // STEP 2
      setStep('analyzing')
      await new Promise((r) => setTimeout(r, 600))

      setStep('coaching')

      // ✅ CALL API (FIXED)
      const res = await fetch('/api/coaching', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: m.transcript }),
      })

      const result: AICoachingResult = await res.json()
      setAiResult(result)

      // Save session
      setPendingSession({
        ...p,
        ...m,
        duration: dur,
        clarityScore: result.overallScore,
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
    coaching: 'Generating personalized coaching...',
    done: 'Done!',
  }

  return (
    <>
      <Nav backHref="/record/session" />

      <div className="container">
        <h1>
          {loading ? loadingMessages[step] : 'Your full analysis.'}
        </h1>

        <p>
          {loading
            ? 'AI is analyzing your recording...'
            : `${fmt(duration)} recording`}
        </p>

        {!loading && aiResult && (
          <div>
            <h2>AI Summary</h2>
            <p>{aiResult.summary}</p>

            <h3>Strengths</h3>
            <ul>
              {aiResult.strengths.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>

            <h3>Improvements</h3>
            <ul>
              {aiResult.improvements.map((i, idx) => (
                <li key={idx}>{i}</li>
              ))}
            </ul>
          </div>
        )}

        <button
          onClick={() => router.push('/correct')}
          disabled={loading}
        >
          {loading ? 'Analyzing...' : 'Continue →'}
        </button>
      </div>
    </>
  )
}
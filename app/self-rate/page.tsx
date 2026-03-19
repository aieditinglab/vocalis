'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Nav from '@/components/Nav'
import { getPendingSession, setPendingSession } from '@/lib/db'

const CRITERIA = [
  { key: 'confidence', label: 'Confidence', desc: 'How confident did you feel and sound?', icon: '💪' },
  { key: 'clarity',    label: 'Clarity',    desc: 'Were your ideas clear and easy to follow?', icon: '💡' },
  { key: 'pacing',     label: 'Pacing',     desc: 'Was your speaking speed comfortable?', icon: '⚡' },
  { key: 'structure',  label: 'Structure',  desc: 'Did your answer have a clear beginning, middle, and end?', icon: '📐' },
]

const LABELS = ['Struggled', 'Below average', 'Average', 'Good', 'Nailed it']
const COLORS = ['var(--hot)', 'var(--amber)', '#FFD700', '#88DD00', 'var(--accent)']

export default function SelfRatePage() {
  const router = useRouter()
  const [ratings, setRatings] = useState({ confidence: 0, clarity: 0, pacing: 0, structure: 0 })
  const [submitted, setSubmitted] = useState(false)

  const allRated = Object.values(ratings).every(v => v > 0)

  const handleSubmit = () => {
    if (!allRated) return
    setSubmitted(true)
    const p = getPendingSession() || {}
    setPendingSession({ ...p, selfRatings: ratings })
    setTimeout(() => router.push('/observe'), 600)
  }

  const totalSelf = allRated
    ? Math.round(Object.values(ratings).reduce((a, b) => a + b, 0) / 4 * 20)
    : 0

  return (
    <>
      <Nav backHref="/record/session" />
      <div className="container">
        <p className="eyebrow anim-slide-up anim-d1">STEP 2A — SELF ASSESSMENT</p>
        <h1 className="font-display anim-slide-up anim-d2" style={{ fontSize: 'clamp(32px,5vw,48px)', fontWeight: 900, letterSpacing: '-.04em', marginBottom: '8px' }}>
          Rate yourself first.
        </h1>
        <p className="text-muted anim-slide-up anim-d2" style={{ fontSize: '16px', marginBottom: '8px' }}>
          Be honest — the AI will give its own score after.
        </p>
        <p className="text-muted anim-slide-up anim-d2" style={{ fontSize: '14px', marginBottom: '36px' }}>
          Then you&apos;ll see where you and the AI agree — and where you&apos;re being too hard or too easy on yourself.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '32px' }}>
          {CRITERIA.map((c, ci) => (
            <div key={c.key} className="card anim-slide-up" style={{ padding: '24px', animationDelay: `${ci * 0.1}s` }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '24px' }}>{c.icon}</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '16px' }}>{c.label}</div>
                    <div className="text-muted" style={{ fontSize: '13px' }}>{c.desc}</div>
                  </div>
                </div>
                {(ratings as any)[c.key] > 0 && (
                  <span style={{ fontSize: '14px', fontWeight: 700, color: COLORS[(ratings as any)[c.key] - 1] }}>
                    {LABELS[(ratings as any)[c.key] - 1]}
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {[1, 2, 3, 4, 5].map(n => (
                  <button key={n} onClick={() => setRatings(r => ({ ...r, [c.key]: n }))}
                    style={{
                      flex: 1, padding: '12px 0', borderRadius: '12px', border: '2px solid',
                      borderColor: (ratings as any)[c.key] === n ? COLORS[n - 1] : 'var(--border-light)',
                      background: (ratings as any)[c.key] === n ? `${COLORS[n - 1]}18` : 'transparent',
                      cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: 700,
                      fontSize: '18px', color: (ratings as any)[c.key] === n ? COLORS[n - 1] : 'var(--text-muted)',
                      transition: 'all .15s',
                    }}>
                    {n}
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>1 — Struggled</span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>5 — Nailed it</span>
              </div>
            </div>
          ))}
        </div>

        {/* Self score preview */}
        {allRated && (
          <div className="anim-fade-in" style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '20px', padding: '20px', marginBottom: '20px', textAlign: 'center' }}>
            <p className="text-muted" style={{ fontSize: '13px', marginBottom: '8px' }}>YOUR SELF-SCORE</p>
            <div className="font-display" style={{ fontSize: '52px', fontWeight: 900, color: 'var(--accent)', letterSpacing: '-.04em' }}>{totalSelf}</div>
            <p className="text-muted" style={{ fontSize: '13px', marginTop: '4px' }}>Now see what the AI thinks</p>
          </div>
        )}

        <button
          className="btn btn-primary btn-full btn-lg anim-slide-up anim-d5"
          onClick={handleSubmit}
          disabled={!allRated || submitted}
          style={{ opacity: allRated ? 1 : 0.4 }}
        >
          {submitted ? 'Getting AI Analysis...' : 'See AI Analysis →'}
        </button>

        <button
          onClick={() => router.push('/observe')}
          style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '13px', cursor: 'pointer', marginTop: '12px', display: 'block', width: '100%', textAlign: 'center', fontFamily: 'var(--font-body)' }}>
          Skip self-rating →
        </button>
      </div>
    </>
  )
}

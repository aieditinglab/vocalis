'use client'
import { useRouter } from 'next/navigation'
import Nav from '@/components/Nav'
import { getPendingSession } from '@/lib/db'
import Link from 'next/link'

export default function CorrectPage() {
  const router = useRouter()
  const pending = getPendingSession()
  const feedback = (pending as any)?.feedback || []
  const aiAnalysis = (pending as any)?.aiAnalysis
  const nextDrill = aiAnalysis?.nextStepDrill
  const celebrationMsg = aiAnalysis?.celebrationMsg

  return (
    <>
      <Nav backHref="/observe" />
      <div className="container">
        <p className="eyebrow anim-slide-up anim-d1">STEPS 3–4 — CORRECT &amp; APPLY</p>
        <h1 className="font-display anim-slide-up anim-d2" style={{ fontSize: 'clamp(32px,5vw,48px)', fontWeight: 900, letterSpacing: '-.04em', marginBottom: '8px' }}>
          AI Coaching Report.
        </h1>
        <p className="text-muted anim-slide-up anim-d2" style={{ fontSize: '16px', marginBottom: '36px' }}>
          Specific to your recording. Apply one change, then re-record immediately.
        </p>

        {/* Celebration - what they did well */}
        {celebrationMsg && (
          <div className="anim-slide-up anim-d2" style={{ background: 'rgba(170,255,0,.06)', border: '1px solid rgba(170,255,0,.2)', borderRadius: '18px', padding: '20px 24px', marginBottom: '20px', display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
            <span style={{ fontSize: '24px' }}>✨</span>
            <div>
              <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--accent)', marginBottom: '6px', letterSpacing: '.06em' }}>WHAT YOU DID WELL</p>
              <p style={{ fontSize: '15px', color: 'var(--text-primary)', lineHeight: 1.65 }}>{celebrationMsg}</p>
            </div>
          </div>
        )}

        {/* AI Coaching points */}
        {feedback.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '24px' }}>
            {feedback.map((f: any, i: number) => (
              <div key={i} className="feedback-card anim-slide-up" style={{ animationDelay: `${.15 + i * .1}s` }}>
                <div className="feedback-icon">{f.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', flexWrap: 'wrap' }}>
                    <h3 style={{ fontWeight: 700, fontSize: '16px' }}>{f.title}</h3>
                    <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '.08em', padding: '3px 8px', borderRadius: '100px', color: f.tagColor, background: f.tagBg }}>
                      {f.tag}
                    </span>
                    {f.priority === 'critical' && (
                      <span style={{ fontSize: '10px', fontWeight: 700, padding: '3px 8px', borderRadius: '100px', color: '#FF3054', background: 'rgba(255,48,84,.08)', border: '1px solid rgba(255,48,84,.2)' }}>
                        PRIORITY
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.75 }}>{f.detail}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '20px', padding: '32px', textAlign: 'center', marginBottom: '24px' }}>
            <p style={{ marginBottom: '12px' }}>No coaching loaded — go back and complete a recording first.</p>
            <Link href="/record" className="btn btn-outline btn-sm" style={{ display: 'inline-flex' }}>Start a Recording</Link>
          </div>
        )}

        {/* Next step drill */}
        {nextDrill && (
          <div className="anim-slide-up anim-d5" style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '18px', padding: '20px 24px', marginBottom: '24px', display: 'flex', gap: '14px' }}>
            <span style={{ fontSize: '24px', flexShrink: 0 }}>🎯</span>
            <div>
              <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px', letterSpacing: '.06em' }}>YOUR NEXT 5-MINUTE DRILL</p>
              <p style={{ fontSize: '15px', lineHeight: 1.65, color: 'var(--text-primary)' }}>{nextDrill}</p>
            </div>
          </div>
        )}

        {feedback.length > 0 && (
          <div className="anim-slide-up anim-d6" style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '12px' }}>
            <button className="btn btn-primary btn-lg btn-full" onClick={() => router.push('/record/session')}>
              🎤 Apply &amp; Re-Record
            </button>
            <button className="btn btn-outline btn-lg" onClick={() => router.push('/levelup')} style={{ padding: '18px 24px' }}>
              Done →
            </button>
          </div>
        )}
      </div>
    </>
  )
}

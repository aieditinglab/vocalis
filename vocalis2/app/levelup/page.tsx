'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Nav from '@/components/Nav'
import { getPendingSession, clearPendingSession, saveSession, getSessions, addTokens } from '@/lib/db'
import { generateCoaching, detectPersonalBests, getCelebrationMessage } from '@/lib/coachingEngine'
import type { Session } from '@/lib/types'

function fmt(s: number) {
  return `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`
}

function tokensForSession(clarity: number, duration: number, fillerCount: number): number {
  let t = 10
  if (clarity >= 85) t += 20
  else if (clarity >= 70) t += 12
  else if (clarity >= 55) t += 6
  if (duration >= 60) t += 5
  if (fillerCount === 0) t += 10
  return t
}

export default function LevelUpPage() {
  const router = useRouter()
  const [session, setSession] = useState<Session | null>(null)
  const [prev, setPrev] = useState<Session | null>(null)
  const [tokensEarned, setTokensEarned] = useState(0)
  const [bests, setBests] = useState<any>(null)
  const [celebration, setCelebration] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const run = async () => {
      const p = getPendingSession()
      if (!p) { setLoading(false); return }

      const history = await getSessions()
      const prev = history[0] || null
      setPrev(prev)

      // Generate coaching using the engine with history
      const settings = { targetWpmMin: 140, targetWpmMax: 160 }
      const tempSession: Session = {
        id: `s_${Date.now()}`,
        date: new Date().toISOString(),
        category: (p as any).category || 'Unknown',
        prompt: (p as any).prompt || '',
        duration: (p as any).duration || 0,
        fillerCount: (p as any).fillerCount || 0,
        fillerWords: (p as any).fillerWords || [],
        pace: (p as any).pace || 0,
        clarityScore: (p as any).clarityScore || 0,
        lengthStatus: (p as any).lengthStatus || 'in-range',
        feedback: (p as any).feedback || [],
        transcriptPreview: (p as any).transcriptPreview || '',
      }

      // Generate deep coaching
      const coaching = generateCoaching(tempSession, history, settings.targetWpmMin, settings.targetWpmMax)
      tempSession.feedback = coaching

      // Detect personal bests
      const pb = detectPersonalBests(tempSession, history)
      setBests(pb)
      setCelebration(getCelebrationMessage(tempSession.clarityScore, pb, history.length === 0))

      // Tokens
      const earned = tokensForSession(tempSession.clarityScore, tempSession.duration, tempSession.fillerCount)
      setTokensEarned(earned)
      tempSession.tokensEarned = earned

      // Save to Supabase
      await saveSession(tempSession)
      await addTokens(earned)

      setSession(tempSession)
      clearPendingSession()
      setLoading(false)
    }
    run()
  }, [])

  useEffect(() => {
    if (!session) return
    const run = async () => {
      const sessions = await getSessions()
      const pts = sessions.slice(0, 10).map(s => s.clarityScore).reverse()
      if (pts.length < 2) return
      const W = 600, H = 80
      const minV = Math.max(0, Math.min(...pts) - 10)
      const maxV = Math.min(100, Math.max(...pts) + 10)
      const tx = (i: number) => (i / (pts.length - 1)) * W
      const ty = (v: number) => H - ((v - minV) / (maxV - minV)) * H
      const pathD = pts.map((v, i) => `${i === 0 ? 'M' : 'L'} ${tx(i).toFixed(1)} ${ty(v).toFixed(1)}`).join(' ')
      const areaD = pathD + ` L ${W} ${H + 20} L 0 ${H + 20} Z`
      const dots = pts.map((v, i) => {
        const last = i === pts.length - 1
        return `<circle cx="${tx(i).toFixed(1)}" cy="${ty(v).toFixed(1)}" r="${last ? 5 : 3}" fill="${last ? '#AAFF00' : '#1C1C1C'}" stroke="#AAFF00" stroke-width="2"/>
        <text x="${tx(i).toFixed(1)}" y="${(ty(v) - 10).toFixed(1)}" text-anchor="middle" fill="#555" font-size="11" font-family="DM Sans,sans-serif">${v}</text>`
      }).join('')
      const svg = document.getElementById('chart-svg')
      if (svg) svg.innerHTML = `<defs><linearGradient id="g1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#AAFF00" stop-opacity=".22"/><stop offset="100%" stop-color="#AAFF00" stop-opacity="0"/></linearGradient></defs><path d="${areaD}" fill="url(#g1)"/><path d="${pathD}" stroke="#AAFF00" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>${dots}`
    }
    run()
  }, [session])

  if (loading) return (
    <>
      <Nav />
      <div className="container" style={{ textAlign: 'center', paddingTop: '80px' }}>
        <div className="font-display" style={{ fontSize: '18px', color: 'var(--text-muted)' }}>Saving your session...</div>
      </div>
    </>
  )

  if (!session) return (
    <>
      <Nav />
      <div className="container" style={{ textAlign: 'center', paddingTop: '80px' }}>
        <p className="text-muted">No session data found.</p>
        <button className="btn btn-outline btn-sm" style={{ marginTop: '16px' }} onClick={() => router.push('/record')}>Start Recording</button>
      </div>
    </>
  )

  const clarityDelta = prev ? session.clarityScore - prev.clarityScore : null
  const fillerDelta  = prev ? session.fillerCount - prev.fillerCount : null

  return (
    <>
      <Nav rightContent={<span className="text-muted" style={{ fontSize: '13px' }}>Session Complete ✓</span>} />
      <div className="container">
        <p className="eyebrow anim-slide-up anim-d1">STEP 5 — LEVEL UP</p>

        {/* Personal best banner */}
        {bests?.highestClarity && (
          <div className="anim-slide-up anim-d1" style={{ background: 'rgba(170,255,0,0.08)', border: '1px solid rgba(170,255,0,0.3)', borderRadius: '16px', padding: '14px 20px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '24px' }}>🏆</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--accent)' }}>New Personal Best!</div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Highest clarity score you&apos;ve ever recorded.</div>
            </div>
          </div>
        )}
        {bests?.lowestFillers && session.fillerCount >= 0 && (
          <div className="anim-slide-up anim-d1" style={{ background: 'rgba(170,255,0,0.08)', border: '1px solid rgba(170,255,0,0.3)', borderRadius: '16px', padding: '14px 20px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '24px' }}>🎯</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--accent)' }}>Fewest Filler Words Ever!</div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Your best filler word count to date.</div>
            </div>
          </div>
        )}

        {/* Tokens earned */}
        <div className="anim-slide-up anim-d1" style={{ background: 'rgba(170,255,0,0.06)', border: '1px solid rgba(170,255,0,0.2)', borderRadius: '16px', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <span style={{ fontWeight: 600 }}>Tokens earned this session</span>
          <span className="font-display" style={{ fontSize: '24px', fontWeight: 900, color: 'var(--accent)' }}>+{tokensEarned} 🪙</span>
        </div>

        {/* Clarity hero */}
        <div className="clarity-hero anim-slide-up anim-d2">
          <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '.12em', color: 'var(--accent)', marginBottom: '8px' }}>CLARITY SCORE</p>
          <div className="clarity-num">{session.clarityScore}</div>
          <p className="text-muted" style={{ marginTop: '8px' }}>out of 100</p>
          {clarityDelta !== null && (
            <p style={{ fontSize: '14px', color: clarityDelta >= 0 ? 'var(--accent)' : 'var(--hot)', marginTop: '6px' }}>
              {clarityDelta >= 0 ? `+${clarityDelta}` : clarityDelta} from last session {clarityDelta >= 0 ? '📈' : '📉'}
            </p>
          )}
          {celebration && (
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '10px', fontStyle: 'italic', maxWidth: '380px', margin: '10px auto 0', lineHeight: 1.5 }}>
              &ldquo;{celebration}&rdquo;
            </p>
          )}
        </div>

        {/* Compare vs last */}
        {prev && (
          <div className="anim-slide-up anim-d3" style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '20px', padding: '24px', marginBottom: '14px' }}>
            <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '.1em', color: 'var(--text-muted)', marginBottom: '18px' }}>VS LAST SESSION</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '12px' }}>
              {[
                { label: 'Fillers',  val: session.fillerCount, delta: fillerDelta, better: (fillerDelta ?? 0) <= 0 },
                { label: 'Pace',     val: session.pace > 0 ? `${session.pace}` : '—', delta: null, better: true },
                { label: 'Length',   val: fmt(session.duration), delta: null, better: true },
                { label: 'Clarity',  val: session.clarityScore, delta: clarityDelta, better: (clarityDelta ?? 0) >= 0, accent: true },
              ].map(c => (
                <div key={c.label} style={{ textAlign: 'center' }}>
                  <div className="text-muted" style={{ fontSize: '11px', marginBottom: '6px' }}>{c.label}</div>
                  <div style={{ fontSize: typeof c.val === 'string' && c.val.length > 4 ? '13px' : '20px', fontWeight: 700, color: (c as any).accent ? 'var(--accent)' : 'var(--text-primary)' }}>{c.val}</div>
                  {c.delta !== null && (
                    <div style={{ fontSize: '11px', marginTop: '4px', color: c.better ? 'var(--accent)' : 'var(--hot)' }}>
                      {(c.delta ?? 0) > 0 ? '+' : ''}{c.delta}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Deep coaching feedback */}
        <div className="anim-slide-up anim-d3" style={{ marginBottom: '14px' }}>
          <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '.1em', color: 'var(--text-muted)', marginBottom: '14px' }}>YOUR COACHING</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {session.feedback.map((f: any, i: number) => (
              <div key={i} className="feedback-card" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="feedback-icon">{f.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', flexWrap: 'wrap' }}>
                    <h3 style={{ fontWeight: 700, fontSize: '15px' }}>{f.title}</h3>
                    <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '.08em', padding: '3px 8px', borderRadius: '100px', color: f.tagColor, background: f.tagBg }}>{f.tag}</span>
                  </div>
                  <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.7 }}>{f.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chart */}
        <div className="anim-slide-up anim-d4" style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '20px', padding: '24px', marginBottom: '24px' }}>
          <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '.1em', color: 'var(--text-muted)', marginBottom: '20px' }}>CLARITY TREND</p>
          <svg id="chart-svg" viewBox="0 0 600 100" width="100%" style={{ display: 'block', overflow: 'visible' }} />
        </div>

        <div className="anim-slide-up anim-d5" style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '12px' }}>
          <button className="btn btn-primary btn-lg btn-full" onClick={() => router.push('/record')}>🎤 Start Another Rep</button>
          <button className="btn btn-outline btn-lg" onClick={() => router.push('/dashboard')} style={{ padding: '18px 24px' }}>Dashboard</button>
        </div>
      </div>
    </>
  )
}

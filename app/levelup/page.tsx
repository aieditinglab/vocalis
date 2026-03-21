'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Nav from '@/components/Nav'
import { getPendingSession, clearPendingSession, saveSession, getSessions, addTokens, getUser } from '@/lib/db'
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
  const [session, setSession]       = useState<Session | null>(null)
  const [prev, setPrev]             = useState<Session | null>(null)
  const [tokensEarned, setTokens]   = useState(0)
  const [bests, setBests]           = useState<any>(null)
  const [celebration, setCelebration] = useState('')
  const [loading, setLoading]       = useState(true)
  const [status, setStatus]         = useState('')

  useEffect(() => {
    const run = async () => {
      setStatus('Verifying account...')
      const user = await getUser()
      if (!user) {
        setLoading(false)
        return
      }

      const p = getPendingSession()
      if (!p) { setLoading(false); return }

      setStatus('Loading your history...')
      const history = await getSessions()
      setPrev(history[0] || null)

      const newSession: Session = {
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

      setStatus('Generating coaching...')
      const coaching = generateCoaching(newSession, history, 140, 160)
      newSession.feedback = coaching

      const pb = detectPersonalBests(newSession, history)
      setBests(pb)
      setCelebration(getCelebrationMessage(newSession.clarityScore, pb, history.length === 0))

      const earned = tokensForSession(newSession.clarityScore, newSession.duration, newSession.fillerCount)
      setTokens(earned)
      newSession.tokensEarned = earned

      setStatus('Saving session...')
      const saved = await saveSession(newSession)
      if (!saved) {
        // Retry after 1 second
        await new Promise(r => setTimeout(r, 1000))
        await saveSession({ ...newSession, id: `s_${Date.now()}_r` })
      }

      await addTokens(earned)
      clearPendingSession()
      setSession(newSession)
      setStatus('')
      setLoading(false)
    }
    run()
  }, [])

  useEffect(() => {
    if (!session) return
    const buildChart = async () => {
      const sessions = await getSessions()
      const pts = sessions.slice(0, 10).map(s => s.clarityScore).reverse()
      if (pts.length < 2) return
      const W = 600, H = 80
      const minV = Math.max(0, Math.min(...pts) - 10), maxV = Math.min(100, Math.max(...pts) + 10)
      const tx = (i: number) => (i / (pts.length - 1)) * W
      const ty = (v: number) => H - ((v - minV) / (maxV - minV)) * H
      const pathD = pts.map((v, i) => `${i === 0 ? 'M' : 'L'} ${tx(i).toFixed(1)} ${ty(v).toFixed(1)}`).join(' ')
      const areaD = pathD + ` L ${W} ${H + 20} L 0 ${H + 20} Z`
      const dots = pts.map((v, i) => {
        const last = i === pts.length - 1
        return `<circle cx="${tx(i).toFixed(1)}" cy="${ty(v).toFixed(1)}" r="${last ? 5 : 3}" fill="${last ? '#AAFF00' : '#1C1C1C'}" stroke="#AAFF00" stroke-width="2"/>
        <text x="${tx(i).toFixed(1)}" y="${(ty(v) - 10).toFixed(1)}" text-anchor="middle" fill="#555" font-size="11">${v}</text>`
      }).join('')
      const svg = document.getElementById('chart-svg')
      if (svg) svg.innerHTML = `<defs><linearGradient id="g1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#AAFF00" stop-opacity=".22"/><stop offset="100%" stop-color="#AAFF00" stop-opacity="0"/></linearGradient></defs><path d="${areaD}" fill="url(#g1)"/><path d="${pathD}" stroke="#AAFF00" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>${dots}`
    }
    buildChart()
  }, [session])

  if (loading) return (
    <>
      <Nav />
      <div className="container" style={{ textAlign: 'center', paddingTop: '80px' }}>
        <div style={{ fontSize: '48px', marginBottom: '20px' }}>✦</div>
        <div className="font-display" style={{ fontSize: '20px', color: 'var(--accent)' }}>{status || 'Processing...'}</div>
        <p className="text-muted" style={{ marginTop: '8px', fontSize: '14px' }}>Please don&apos;t close this tab</p>
      </div>
    </>
  )

  if (!session) return (
    <>
      <Nav />
      <div className="container" style={{ textAlign: 'center', paddingTop: '80px' }}>
        <p className="text-muted">No session data found.</p>
        <button className="btn btn-primary btn-lg" style={{ marginTop: '16px' }} onClick={() => router.push('/record')}>Start Recording</button>
      </div>
    </>
  )

  const clarityDelta = prev ? session.clarityScore - prev.clarityScore : null
  const fillerDelta  = prev ? session.fillerCount - prev.fillerCount : null

  return (
    <>
      <Nav rightContent={<span className="text-muted" style={{ fontSize: '13px' }}>Session Saved ✓</span>} />
      <div className="container">
        <p className="eyebrow anim-slide-up anim-d1">STEP 5 — LEVEL UP</p>

        {bests?.highestClarity && (
          <div className="anim-slide-up anim-d1" style={{ background: 'rgba(170,255,0,.08)', border: '1px solid rgba(170,255,0,.3)', borderRadius: '16px', padding: '14px 20px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '24px' }}>🏆</span>
            <div><div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--accent)' }}>New Personal Best!</div><div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Highest clarity score you&apos;ve ever recorded.</div></div>
          </div>
        )}

        <div className="anim-slide-up anim-d1" style={{ background: 'rgba(170,255,0,.06)', border: '1px solid rgba(170,255,0,.2)', borderRadius: '16px', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <span style={{ fontWeight: 600 }}>Tokens earned this session</span>
          <span className="font-display" style={{ fontSize: '24px', fontWeight: 900, color: 'var(--accent)' }}>+{tokensEarned} 🪙</span>
        </div>

        <div className="clarity-hero anim-slide-up anim-d2">
          <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '.12em', color: 'var(--accent)', marginBottom: '8px' }}>CLARITY SCORE</p>
          <div className="clarity-num">{session.clarityScore}</div>
          <p className="text-muted" style={{ marginTop: '8px' }}>out of 100</p>
          {clarityDelta !== null && (
            <p style={{ fontSize: '14px', color: clarityDelta >= 0 ? 'var(--accent)' : 'var(--hot)', marginTop: '6px' }}>
              {clarityDelta >= 0 ? `+${clarityDelta}` : clarityDelta} from last session {clarityDelta >= 0 ? '📈' : '📉'}
            </p>
          )}
          {celebration && <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '10px', fontStyle: 'italic', maxWidth: '380px', margin: '10px auto 0', lineHeight: 1.6 }}>&ldquo;{celebration}&rdquo;</p>}
        </div>

        {prev && (
          <div className="anim-slide-up anim-d3" style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '20px', padding: '24px', marginBottom: '14px' }}>
            <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '18px' }}>VS LAST SESSION</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '12px' }}>
              {[
                { label: 'Fillers', val: session.fillerCount, delta: fillerDelta, better: (fillerDelta ?? 0) <= 0 },
                { label: 'Pace', val: session.pace > 0 ? `${session.pace}` : '—', delta: null, better: true },
                { label: 'Length', val: fmt(session.duration), delta: null, better: true },
                { label: 'Clarity', val: session.clarityScore, delta: clarityDelta, better: (clarityDelta ?? 0) >= 0, accent: true },
              ].map(c => (
                <div key={c.label} style={{ textAlign: 'center' }}>
                  <div className="text-muted" style={{ fontSize: '11px', marginBottom: '6px' }}>{c.label}</div>
                  <div style={{ fontSize: String(c.val).length > 4 ? '13px' : '20px', fontWeight: 700, color: (c as any).accent ? 'var(--accent)' : 'var(--text-primary)' }}>{c.val}</div>
                  {c.delta !== null && <div style={{ fontSize: '11px', marginTop: '4px', color: c.better ? 'var(--accent)' : 'var(--hot)' }}>{(c.delta ?? 0) > 0 ? '+' : ''}{c.delta}</div>}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="anim-slide-up anim-d3" style={{ marginBottom: '14px' }}>
          <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '14px' }}>YOUR COACHING</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {session.feedback.map((f: any, i: number) => (
              <div key={i} className="feedback-card" style={{ animationDelay: `${i * .1}s` }}>
                <div className="feedback-icon">{f.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', flexWrap: 'wrap' }}>
                    <h3 style={{ fontWeight: 700, fontSize: '15px' }}>{f.title}</h3>
                    <span style={{ fontSize: '10px', fontWeight: 700, padding: '3px 8px', borderRadius: '100px', color: f.tagColor, background: f.tagBg }}>{f.tag}</span>
                  </div>
                  <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.7 }}>{f.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="anim-slide-up anim-d4" style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '20px', padding: '24px', marginBottom: '24px' }}>
          <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '20px' }}>CLARITY TREND</p>
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

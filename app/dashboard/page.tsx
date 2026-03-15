'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Nav from '@/components/Nav'
import { getSessions, computeStats, computeStreak, getSettings, deleteSession } from '@/lib/db'
import type { Session } from '@/lib/types'

function fmt(s: number) { return `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}` }
function fmtDate(iso: string) {
  const d = new Date(iso), now = new Date(), diff = Math.floor((now.getTime() - d.getTime()) / 86400000)
  return diff === 0 ? 'Today' : diff === 1 ? 'Yesterday' : diff < 7 ? `${diff} days ago` : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function DashboardPage() {
  const router = useRouter()
  const [sessions, setSessions] = useState<Session[]>([])
  const [stats, setStats] = useState<any>(null)
  const [name, setName] = useState('')
  const [streak, setStreak] = useState(0)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [tab, setTab] = useState<'overview' | 'sessions' | 'bests'>('overview')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const [s, cfg] = await Promise.all([getSessions(), getSettings()])
      setSessions(s)
      setStats(computeStats(s))
      setStreak(computeStreak(s))
      setName(cfg.name || 'there')
      setLoading(false)
    }
    load()
  }, [])

  const handleDelete = async (id: string) => {
    await deleteSession(id)
    const s = await getSessions()
    setSessions(s)
    setStats(computeStats(s))
  }

  // Personal bests computed from sessions
  const personalBests = sessions.length > 0 ? {
    bestClarity:   Math.max(...sessions.map(s => s.clarityScore)),
    bestClarityDate: sessions.find(s => s.clarityScore === Math.max(...sessions.map(s => s.clarityScore)))?.date || '',
    lowestFillers: Math.min(...sessions.map(s => s.fillerCount)),
    longestSession: Math.max(...sessions.map(s => s.duration)),
    totalSessions:  sessions.length,
    totalPracticeTime: sessions.reduce((a, s) => a + s.duration, 0),
    categoryCounts: sessions.reduce((acc: any, s) => { acc[s.category] = (acc[s.category] || 0) + 1; return acc }, {}),
  } : null

  return (
    <>
      <Nav showApp />
      <div className="container-lg">
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <p className="eyebrow anim-slide-up anim-d1">YOUR DASHBOARD</p>
          <h1 className="font-display anim-slide-up anim-d2" style={{ fontSize: 'clamp(32px,5vw,58px)', fontWeight: 900, letterSpacing: '-.04em' }}>
            {loading ? '...' : sessions.length === 0 ? `Welcome, ${name}.` : `Keep going, ${name}.`}
          </h1>
        </div>

        {/* Tabs */}
        <div className="tab-bar anim-slide-up anim-d3" style={{ marginBottom: '32px', maxWidth: '480px' }}>
          <button className={`tab-btn ${tab === 'overview' ? 'active' : ''}`} onClick={() => setTab('overview')}>Overview</button>
          <button className={`tab-btn ${tab === 'bests' ? 'active' : ''}`} onClick={() => setTab('bests')}>Personal Bests</button>
          <button className={`tab-btn ${tab === 'sessions' ? 'active' : ''}`} onClick={() => setTab('sessions')}>All Sessions</button>
        </div>

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '12px' }}>
            {[0,1,2,3].map(i => <div key={i} className="dash-card shimmer" style={{ height: '100px' }} />)}
          </div>
        ) : sessions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 40px', border: '1px dashed var(--border-light)', borderRadius: '24px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎤</div>
            <h2 className="font-display" style={{ fontSize: '28px', fontWeight: 900, marginBottom: '12px' }}>No sessions yet</h2>
            <p className="text-muted" style={{ marginBottom: '24px' }}>Complete your first VOCAL rep to see your stats here.</p>
            <button className="btn btn-primary btn-lg" onClick={() => router.push('/record')}>Start Your First Rep →</button>
          </div>
        ) : (
          <>
            {/* ── OVERVIEW TAB ── */}
            {tab === 'overview' && stats && (
              <>
                {/* Stats */}
                <div className="dash-stats-grid anim-slide-up anim-d3" style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: '12px', marginBottom: '24px' }}>
                  {[
                    { label: 'Sessions',      val: stats.n.toString(),            sub: 'total',        color: 'var(--text-primary)' },
                    { label: 'Avg Clarity',   val: stats.avgClarity.toString(),   sub: '/ 100',        color: 'var(--accent)' },
                    { label: 'Best Clarity',  val: stats.bestClarity.toString(),  sub: 'personal best',color: 'var(--accent)' },
                    { label: 'Avg Fillers',   val: stats.avgFillers.toString(),   sub: 'per session',  color: stats.avgFillers > 8 ? 'var(--hot)' : 'var(--text-primary)' },
                    { label: 'Practice Time', val: `${stats.totalMins}m`,          sub: 'total',        color: 'var(--blue)' },
                  ].map(s => (
                    <div key={s.label} className="dash-card" style={{ textAlign: 'center' }}>
                      <div className="font-display" style={{ fontSize: 'clamp(24px,3vw,38px)', fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.val}</div>
                      <div style={{ fontSize: '12px', fontWeight: 600, marginTop: '8px', color: 'var(--text-muted)' }}>{s.label}</div>
                      <div className="text-muted" style={{ fontSize: '11px', marginTop: '3px' }}>{s.sub}</div>
                    </div>
                  ))}
                </div>

                {/* Streak + trend */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
                  <div className="dash-card" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div style={{ fontSize: '52px' }}>🔥</div>
                    <div>
                      <div className="font-display" style={{ fontSize: '48px', fontWeight: 900, color: 'var(--amber)', lineHeight: 1 }}>{streak}</div>
                      <div style={{ fontWeight: 600, marginTop: '4px' }}>Day Streak</div>
                      <div className="text-muted" style={{ fontSize: '13px' }}>Keep practicing daily</div>
                    </div>
                  </div>
                  <div className="dash-card">
                    <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '.1em', color: 'var(--text-muted)', marginBottom: '16px' }}>CLARITY TREND</p>
                    {sessions.length >= 2 ? (
                      <>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                          <span className="font-display" style={{ fontSize: '32px', fontWeight: 900, color: stats.trend >= 0 ? 'var(--accent)' : 'var(--hot)' }}>
                            {stats.trend >= 0 ? '+' : ''}{stats.trend}
                          </span>
                          <span className="text-muted" style={{ fontSize: '14px' }}>vs last session</span>
                        </div>
                        <div className="prog-track"><div className="prog-fill" style={{ background: stats.trend >= 0 ? 'var(--accent)' : 'var(--hot)', width: `${Math.min(100, Math.abs(stats.trend || 0) * 5)}%` }} /></div>
                      </>
                    ) : <p className="text-muted" style={{ fontSize: '13px' }}>Complete 2+ sessions to see trend</p>}
                  </div>
                </div>

                {/* Clarity chart */}
                {sessions.length >= 2 && <DashChart sessions={sessions} />}

                {/* Recent 3 sessions */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                    <h2 style={{ fontSize: '16px', fontWeight: 700 }}>Recent Sessions</h2>
                    <button onClick={() => setTab('sessions')} style={{ background: 'transparent', border: 'none', color: 'var(--accent)', fontSize: '13px', cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: 600 }}>View all →</button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {sessions.slice(0, 3).map(s => (
                      <div key={s.id} className="dash-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                        <div style={{ flex: 1, minWidth: '180px' }}>
                          <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '300px' }}>&ldquo;{s.prompt || 'No prompt'}&rdquo;</div>
                          <div className="text-muted" style={{ fontSize: '12px' }}>{fmtDate(s.date)} · {s.category} · {fmt(s.duration)}</div>
                        </div>
                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                          {[{ k: 'CLARITY', v: s.clarityScore, c: 'var(--accent)' }, { k: 'FILLERS', v: s.fillerCount, c: s.fillerCount > 8 ? 'var(--hot)' : 'var(--text-primary)' }].map(m => (
                            <div key={m.k} style={{ textAlign: 'center' }}>
                              <div style={{ fontSize: '10px', color: '#555', marginBottom: '2px', fontWeight: 700 }}>{m.k}</div>
                              <div style={{ fontWeight: 700, color: m.c, fontSize: '16px' }}>{m.v}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* ── PERSONAL BESTS TAB ── */}
            {tab === 'bests' && personalBests && (
              <div className="anim-fade-in">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '16px', marginBottom: '32px' }}>
                  {[
                    { icon: '🏆', label: 'Highest Clarity Score', val: personalBests.bestClarity, sub: `/ 100 · ${fmtDate(personalBests.bestClarityDate)}`, color: 'var(--accent)' },
                    { icon: '🎯', label: 'Lowest Filler Words', val: personalBests.lowestFillers, sub: 'in a single session', color: personalBests.lowestFillers === 0 ? 'var(--accent)' : 'var(--white)' },
                    { icon: '⏱', label: 'Longest Session', val: fmt(personalBests.longestSession), sub: 'single recording', color: 'var(--blue)' },
                    { icon: '🔥', label: 'Current Streak', val: streak, sub: 'days consecutive', color: 'var(--amber)' },
                    { icon: '📚', label: 'Total Sessions', val: personalBests.totalSessions, sub: 'reps completed', color: 'var(--text-primary)' },
                    { icon: '⏰', label: 'Total Practice', val: `${Math.round(personalBests.totalPracticeTime / 60)}m`, sub: 'time invested', color: 'var(--blue)' },
                  ].map(b => (
                    <div key={b.label} className="dash-card" style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '32px', marginBottom: '12px' }}>{b.icon}</div>
                      <div className="font-display" style={{ fontSize: 'clamp(28px,4vw,44px)', fontWeight: 900, color: b.color, letterSpacing: '-.03em', lineHeight: 1 }}>{b.val}</div>
                      <div style={{ fontSize: '13px', fontWeight: 600, marginTop: '8px' }}>{b.label}</div>
                      <div className="text-muted" style={{ fontSize: '12px', marginTop: '4px' }}>{b.sub}</div>
                    </div>
                  ))}
                </div>

                {/* Most practiced category */}
                <div className="dash-card" style={{ marginBottom: '20px' }}>
                  <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '.1em', color: 'var(--text-muted)', marginBottom: '16px' }}>SESSIONS BY CATEGORY</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {Object.entries(personalBests.categoryCounts).sort(([,a],[,b]) => (b as number)-(a as number)).map(([cat, count]: any) => (
                      <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '14px', flex: 1, fontWeight: 500 }}>{cat}</span>
                        <div style={{ width: '120px' }}>
                          <div className="prog-track">
                            <div className="prog-fill" style={{ background: 'var(--accent)', width: `${(count / personalBests.totalSessions) * 100}%` }} />
                          </div>
                        </div>
                        <span style={{ fontSize: '13px', fontWeight: 700, minWidth: '24px', textAlign: 'right' }}>{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── SESSIONS TAB ── */}
            {tab === 'sessions' && (
              <div className="anim-fade-in">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <h2 style={{ fontSize: '18px', fontWeight: 700 }}>All Sessions</h2>
                  <span className="text-muted" style={{ fontSize: '13px' }}>{sessions.length} total</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {sessions.map(s => (
                    <div key={s.id}>
                      <div className="dash-card" style={{ cursor: 'pointer' }} onClick={() => setExpanded(expanded === s.id ? null : s.id)}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                          <div style={{ flex: 1, minWidth: '200px' }}>
                            <div style={{ fontWeight: 600, fontSize: '15px', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '340px' }}>&ldquo;{s.prompt || 'No prompt'}&rdquo;</div>
                            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                              <span className="text-muted" style={{ fontSize: '13px' }}>{fmtDate(s.date)}</span>
                              <span className="text-muted" style={{ fontSize: '13px' }}>{s.category}</span>
                              <span className="text-muted" style={{ fontSize: '13px' }}>{fmt(s.duration)}</span>
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                            {[{ k: 'CLARITY', v: s.clarityScore, c: 'var(--accent)' }, { k: 'FILLERS', v: s.fillerCount, c: s.fillerCount > 8 ? 'var(--hot)' : s.fillerCount > 3 ? 'var(--amber)' : 'var(--text-primary)' }, { k: 'WPM', v: s.pace || '—' }].map(m => (
                              <div key={m.k} style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '10px', color: '#555', marginBottom: '2px', fontWeight: 700, letterSpacing: '.06em' }}>{m.k}</div>
                                <div style={{ fontWeight: 700, color: (m as any).c || 'var(--text-primary)', fontSize: '18px' }}>{m.v}</div>
                              </div>
                            ))}
                            <span style={{ color: 'var(--text-muted)', fontSize: '16px', transform: expanded === s.id ? 'rotate(180deg)' : '', transition: 'transform .2s' }}>▼</span>
                          </div>
                        </div>
                      </div>
                      {expanded === s.id && (
                        <div className="anim-fade-in" style={{ background: 'var(--card2)', border: '1px solid var(--border-light)', borderRadius: '0 0 20px 20px', marginTop: '-10px', padding: '24px', paddingTop: '32px' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                            <div>
                              <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '12px' }}>METRICS</p>
                              {[
                                { k: 'Clarity Score', v: `${s.clarityScore}/100`, c: s.clarityScore < 60 ? 'var(--hot)' : 'var(--accent)' },
                                { k: 'Filler Words', v: s.fillerCount.toString(), c: s.fillerCount > 5 ? 'var(--hot)' : 'var(--text-primary)' },
                                { k: 'Pace', v: s.pace > 0 ? `${s.pace} WPM` : '—' },
                                { k: 'Duration', v: fmt(s.duration) },
                                { k: 'Length', v: s.lengthStatus.replace('-', ' '), c: s.lengthStatus === 'in-range' ? 'var(--accent)' : 'var(--amber)' },
                              ].map(m => (
                                <div key={m.k} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: '14px' }}>
                                  <span className="text-muted">{m.k}</span>
                                  <span style={{ fontWeight: 600, color: (m as any).c || 'var(--text-primary)' }}>{m.v}</span>
                                </div>
                              ))}
                            </div>
                            <div>
                              <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '12px' }}>COACHING GIVEN</p>
                              {s.feedback?.map((f: any, fi: number) => (
                                <div key={fi} style={{ display: 'flex', gap: '10px', marginBottom: '10px', padding: '10px', background: 'var(--card)', borderRadius: '12px' }}>
                                  <span style={{ fontSize: '18px' }}>{f.icon}</span>
                                  <div>
                                    <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '4px' }}>{f.title}</div>
                                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5 }}>{f.detail}</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <button onClick={() => handleDelete(s.id)} style={{ background: 'transparent', border: '1px solid rgba(255,48,84,.2)', color: 'var(--hot)', borderRadius: '100px', padding: '8px 16px', fontSize: '12px', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Delete Session</button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  )
}

function DashChart({ sessions }: { sessions: Session[] }) {
  const { useEffect } = require('react')
  useEffect(() => {
    const pts = sessions.slice(0, 10).map(s => s.clarityScore).reverse()
    if (pts.length < 2) return
    const W = 600, H = 80
    const minV = Math.max(0, Math.min(...pts) - 10), maxV = Math.min(100, Math.max(...pts) + 10)
    const tx = (i: number) => (i / (pts.length - 1)) * W
    const ty = (v: number) => H - ((v - minV) / (maxV - minV)) * H
    const pathD = pts.map((v, i) => `${i === 0 ? 'M' : 'L'} ${tx(i).toFixed(1)} ${ty(v).toFixed(1)}`).join(' ')
    const areaD = pathD + ` L ${W} ${H + 20} L 0 ${H + 20} Z`
    const dots = pts.map((v, i) => { const last = i === pts.length - 1; return `<circle cx="${tx(i).toFixed(1)}" cy="${ty(v).toFixed(1)}" r="${last ? 5 : 3}" fill="${last ? '#AAFF00' : '#1C1C1C'}" stroke="#AAFF00" stroke-width="2"/><text x="${tx(i).toFixed(1)}" y="${(ty(v) - 10).toFixed(1)}" text-anchor="middle" fill="#555" font-size="11" font-family="DM Sans,sans-serif">${v}</text>` }).join('')
    const svg = document.getElementById('dash-chart')
    if (svg) svg.innerHTML = `<defs><linearGradient id="dg1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#AAFF00" stop-opacity=".22"/><stop offset="100%" stop-color="#AAFF00" stop-opacity="0"/></linearGradient></defs><path d="${areaD}" fill="url(#dg1)"/><path d="${pathD}" stroke="#AAFF00" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>${dots}`
  }, [sessions])
  return (
    <div className="anim-slide-up dash-card" style={{ marginBottom: '24px' }}>
      <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '.1em', color: 'var(--text-muted)', marginBottom: '20px' }}>CLARITY OVER TIME</p>
      <svg id="dash-chart" viewBox="0 0 600 100" width="100%" style={{ display: 'block', overflow: 'visible' }} />
    </div>
  )
}



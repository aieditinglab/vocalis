'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Nav from '@/components/Nav'
import { createClient } from '@/lib/supabase'
import { getUser } from '@/lib/db'

type LeaderboardEntry = {
  user_id: string
  username: string
  best_clarity: number
  total_sessions: number
  avg_clarity: number
  streak?: number
}

type Tab = 'clarity' | 'sessions' | 'streak'
type Period = 'all' | 'weekly'

export default function LeaderboardPage() {
  const router = useRouter()
  const [entries, setEntries]   = useState<LeaderboardEntry[]>([])
  const [tab, setTab]           = useState<Tab>('clarity')
  const [period, setPeriod]     = useState<Period>('all')
  const [loading, setLoading]   = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const sb = createClient()
      const user = await getUser()
      setCurrentUserId(user?.id || null)

      // Get leaderboard data
      const { data: lb } = await sb.rpc('get_leaderboard', { period })
      const { data: streaks } = await sb.rpc('get_user_streaks')

      if (lb) {
        const streakMap: Record<string, number> = {}
        if (streaks) streaks.forEach((s: any) => { streakMap[s.user_id] = s.streak })
        const merged = lb.map((e: any) => ({ ...e, streak: streakMap[e.user_id] || 0 }))
        setEntries(merged)
      }
      setLoading(false)
    }
    load()
  }, [period])

  const sorted = [...entries].sort((a, b) => {
    if (tab === 'clarity')  return b.best_clarity - a.best_clarity
    if (tab === 'sessions') return b.total_sessions - a.total_sessions
    if (tab === 'streak')   return (b.streak || 0) - (a.streak || 0)
    return 0
  })

  const medal = (i: number) => {
    if (i === 0) return '🥇'
    if (i === 1) return '🥈'
    if (i === 2) return '🥉'
    return `#${i + 1}`
  }

  const myRank = sorted.findIndex(e => e.user_id === currentUserId)

  return (
    <>
      <Nav showApp />
      <div className="container">
        <p className="eyebrow anim-slide-up anim-d1">COMMUNITY</p>
        <h1 className="font-display anim-slide-up anim-d2" style={{ fontSize: 'clamp(32px,5vw,56px)', fontWeight: 900, letterSpacing: '-.04em', marginBottom: '8px' }}>
          Leaderboard.
        </h1>
        <p className="text-muted anim-slide-up anim-d2" style={{ fontSize: '16px', marginBottom: '32px' }}>
          Top communicators on Vocalis. Keep training to climb the ranks.
        </p>

        {/* Period toggle */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
          {(['all', 'weekly'] as Period[]).map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              style={{
                padding: '8px 18px', borderRadius: '100px', fontSize: '13px', fontWeight: 600,
                cursor: 'pointer', fontFamily: 'var(--font-body)',
                background: period === p ? 'var(--accent)' : 'var(--card)',
                color: period === p ? '#000' : 'var(--text-muted)',
                border: period === p ? 'none' : '1px solid var(--border)',
                transition: 'all .2s',
              }}>
              {p === 'all' ? 'All Time' : 'This Week'}
            </button>
          ))}
        </div>

        {/* Stat tabs */}
        <div className="tab-bar anim-slide-up anim-d3" style={{ marginBottom: '24px', maxWidth: '420px' }}>
          <button className={`tab-btn ${tab === 'clarity' ? 'active' : ''}`} onClick={() => setTab('clarity')}>Best Clarity</button>
          <button className={`tab-btn ${tab === 'sessions' ? 'active' : ''}`} onClick={() => setTab('sessions')}>Most Sessions</button>
          <button className={`tab-btn ${tab === 'streak' ? 'active' : ''}`} onClick={() => setTab('streak')}>Streak</button>
        </div>

        {/* Your rank banner */}
        {myRank >= 0 && (
          <div className="anim-slide-up anim-d3" style={{ background: 'rgba(170,255,0,.06)', border: '1px solid rgba(170,255,0,.2)', borderRadius: '16px', padding: '14px 20px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '20px' }}>{medal(myRank)}</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--accent)' }}>Your rank</div>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  {tab === 'clarity' && `Best clarity: ${sorted[myRank]?.best_clarity}/100`}
                  {tab === 'sessions' && `${sorted[myRank]?.total_sessions} sessions`}
                  {tab === 'streak' && `${sorted[myRank]?.streak || 0} day streak`}
                </div>
              </div>
            </div>
            <span className="font-display" style={{ fontSize: '28px', fontWeight: 900, color: 'var(--accent)' }}>#{myRank + 1}</span>
          </div>
        )}

        {/* Leaderboard list */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[0,1,2,3,4].map(i => (
              <div key={i} className="dash-card shimmer" style={{ height: '72px' }} />
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', border: '1px dashed var(--border)', borderRadius: '20px' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>🏆</div>
            <h3 className="font-display" style={{ fontSize: '22px', fontWeight: 900, marginBottom: '8px' }}>No data yet</h3>
            <p className="text-muted" style={{ marginBottom: '20px', fontSize: '14px' }}>
              {period === 'weekly' ? 'No sessions this week yet. Be the first!' : 'Complete sessions to appear on the leaderboard.'}
            </p>
            <button className="btn btn-primary" onClick={() => router.push('/record')}>Start Training →</button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {sorted.map((entry, i) => {
              const isMe = entry.user_id === currentUserId
              const isTop3 = i < 3
              return (
                <div key={entry.user_id} className="anim-slide-up" style={{
                  animationDelay: `${i * 0.04}s`,
                  background: isMe ? 'rgba(170,255,0,.06)' : 'var(--card)',
                  border: isMe ? '1px solid rgba(170,255,0,.25)' : '1px solid var(--border)',
                  borderRadius: '16px',
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  transition: 'transform .15s',
                }}>
                  {/* Rank */}
                  <div style={{
                    width: '36px', textAlign: 'center', flexShrink: 0,
                    fontSize: isTop3 ? '22px' : '15px',
                    fontWeight: 700,
                    color: isTop3 ? 'var(--text-primary)' : 'var(--text-muted)',
                    fontFamily: isTop3 ? 'inherit' : 'var(--font-display)',
                  }}>
                    {medal(i)}
                  </div>

                  {/* Avatar initial */}
                  <div style={{
                    width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0,
                    background: isMe ? 'var(--accent)' : 'var(--card2)',
                    border: '1px solid var(--border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '16px', fontWeight: 700,
                    color: isMe ? '#000' : 'var(--text-muted)',
                  }}>
                    {entry.username.charAt(0).toUpperCase()}
                  </div>

                  {/* Name */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {entry.username}
                      {isMe && <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--accent)', background: 'rgba(170,255,0,.12)', padding: '2px 8px', borderRadius: '100px' }}>YOU</span>}
                      {i === 0 && <span style={{ fontSize: '10px', fontWeight: 700, color: '#FFB800', background: 'rgba(255,184,0,.12)', padding: '2px 8px', borderRadius: '100px' }}>LEADER</span>}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {entry.total_sessions} session{entry.total_sessions !== 1 ? 's' : ''} · avg {entry.avg_clarity}/100
                    </div>
                  </div>

                  {/* Stat */}
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div className="font-display" style={{
                      fontSize: '26px', fontWeight: 900, lineHeight: 1,
                      color: isMe ? 'var(--accent)' : isTop3 ? 'var(--text-primary)' : 'var(--text-muted)',
                    }}>
                      {tab === 'clarity' && entry.best_clarity}
                      {tab === 'sessions' && entry.total_sessions}
                      {tab === 'streak' && (entry.streak || 0)}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {tab === 'clarity' && '/ 100'}
                      {tab === 'sessions' && 'reps'}
                      {tab === 'streak' && 'days'}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <div style={{ marginTop: '32px', textAlign: 'center' }}>
          <button className="btn btn-primary btn-lg" onClick={() => router.push('/record')}>
            🎤 Train to Climb the Ranks
          </button>
        </div>
      </div>
    </>
  )
}
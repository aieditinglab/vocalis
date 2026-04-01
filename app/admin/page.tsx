'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Nav from '@/components/Nav'
import { getIsAdmin, getFeatureFlags, toggleFeatureFlag, type FeatureFlag } from '@/lib/admin'
import { getSessions, getUser } from '@/lib/db'
import { createClient } from '@/lib/supabase'

export default function AdminPage() {
  const router = useRouter()
  const [isAdmin, setIsAdmin]   = useState<boolean | null>(null)
  const [flags, setFlags]       = useState<FeatureFlag[]>([])
  const [users, setUsers]       = useState<any[]>([])
  const [sessions, setSessions] = useState<any[]>([])
  const [loading, setLoading]   = useState(true)
  const [toggling, setToggling] = useState<string | null>(null)
  const [msg, setMsg]           = useState('')

  useEffect(() => {
    const load = async () => {
      const admin = await getIsAdmin()
      setIsAdmin(admin)
      if (!admin) { setLoading(false); return }

      const sb = createClient()
      const [flagData, profileData, sessionData] = await Promise.all([
        getFeatureFlags(),
        sb.from('profiles').select('*').order('created_at', { ascending: false }),
        sb.from('sessions').select('*').order('created_at', { ascending: false }).limit(20),
      ])

      setFlags(flagData)
      setUsers(profileData.data || [])
      setSessions(sessionData.data || [])
      setLoading(false)
    }
    load()
  }, [])

  const handleToggle = async (flag: FeatureFlag) => {
    setToggling(flag.id)
    const ok = await toggleFeatureFlag(flag.id, !flag.enabled)
    if (ok) {
      setFlags(prev => prev.map(f => f.id === flag.id ? { ...f, enabled: !f.enabled } : f))
      setMsg(`${flag.label} ${!flag.enabled ? 'enabled' : 'disabled'}`)
      setTimeout(() => setMsg(''), 2000)
    }
    setToggling(null)
  }

  if (loading) return (
    <>
      <Nav showApp />
      <div className="container" style={{ textAlign: 'center', paddingTop: '80px' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚙️</div>
        <p className="text-muted">Loading admin panel...</p>
      </div>
    </>
  )

  if (!isAdmin) return (
    <>
      <Nav showApp />
      <div className="container" style={{ textAlign: 'center', paddingTop: '80px' }}>
        <div style={{ fontSize: '64px', marginBottom: '16px' }}>🚫</div>
        <h1 style={{ fontSize: '28px', fontWeight: 900, marginBottom: '12px' }}>Access Denied</h1>
        <p className="text-muted" style={{ marginBottom: '24px' }}>This page is restricted to administrators.</p>
        <button className="btn btn-primary" onClick={() => router.push('/dashboard')}>Go to Dashboard</button>
      </div>
    </>
  )

  return (
    <>
      <Nav showApp />
      <div className="container-lg">
        <p className="eyebrow anim-slide-up anim-d1">ADMIN ONLY</p>
        <h1 className="font-display anim-slide-up anim-d2" style={{ fontSize: 'clamp(28px,5vw,48px)', fontWeight: 900, letterSpacing: '-.04em', marginBottom: '8px' }}>
          Admin Panel ⚙️
        </h1>
        <p className="text-muted anim-slide-up anim-d2" style={{ fontSize: '15px', marginBottom: '32px' }}>
          Full control over Vocalis. Only you can see this.
        </p>

        {msg && (
          <div style={{ background: 'rgba(170,255,0,.08)', border: '1px solid rgba(170,255,0,.2)', borderRadius: '12px', padding: '12px 20px', marginBottom: '20px', fontSize: '14px', fontWeight: 600, color: 'var(--accent)', textAlign: 'center' }}>
            {msg}
          </div>
        )}

        {/* Stats overview */}
        <div className="admin-stats" style={{ marginBottom: '32px' }}>
          {[
            { label: 'Total Users', val: users.length, icon: '👥' },
            { label: 'Total Sessions', val: sessions.length + '+', icon: '🎤' },
            { label: 'Feature Flags', val: `${flags.filter(f => f.enabled).length}/${flags.length} on`, icon: '🚦' },
          ].map(s => (
            <div key={s.label} className="dash-card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>{s.icon}</div>
              <div className="font-display" style={{ fontSize: '28px', fontWeight: 900, color: 'var(--accent)' }}>{s.val}</div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Feature flags */}
        <div className="dash-card" style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            🚦 Feature Flags
            <span style={{ fontSize: '12px', fontWeight: 400, color: 'var(--text-muted)' }}>— toggle to instantly enable/disable features for all users</span>
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {flags.map(flag => (
              <div key={flag.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '16px 20px', borderRadius: '14px',
                background: flag.enabled ? 'rgba(170,255,0,.04)' : 'rgba(255,48,84,.04)',
                border: `1px solid ${flag.enabled ? 'rgba(170,255,0,.15)' : 'rgba(255,48,84,.15)'}`,
                gap: '16px',
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 700, fontSize: '15px' }}>{flag.label}</span>
                    <span style={{
                      fontSize: '10px', fontWeight: 700, letterSpacing: '.06em',
                      padding: '2px 8px', borderRadius: '100px',
                      color: flag.enabled ? 'var(--accent)' : 'var(--hot)',
                      background: flag.enabled ? 'rgba(170,255,0,.12)' : 'rgba(255,48,84,.12)',
                    }}>
                      {flag.enabled ? 'LIVE' : 'DISABLED'}
                    </span>
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>{flag.description}</p>
                </div>

                {/* Toggle switch */}
                <button
                  onClick={() => handleToggle(flag)}
                  disabled={toggling === flag.id}
                  style={{
                    width: '52px', height: '28px', borderRadius: '14px', border: 'none',
                    background: flag.enabled ? 'var(--accent)' : 'var(--border)',
                    cursor: toggling === flag.id ? 'not-allowed' : 'pointer',
                    position: 'relative', transition: 'background .2s', flexShrink: 0,
                    opacity: toggling === flag.id ? 0.6 : 1,
                  }}
                >
                  <div style={{
                    position: 'absolute', top: '4px',
                    left: flag.enabled ? '28px' : '4px',
                    width: '20px', height: '20px', borderRadius: '50%',
                    background: 'white', transition: 'left .2s',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
                  }} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Users table */}
        <div className="dash-card" style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '20px' }}>👥 All Users ({users.length})</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {users.map(u => (
              <div key={u.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 16px', borderRadius: '12px',
                background: u.is_admin ? 'rgba(170,255,0,.05)' : 'var(--card2)',
                border: `1px solid ${u.is_admin ? 'rgba(170,255,0,.2)' : 'var(--border)'}`,
                gap: '12px', flexWrap: 'wrap',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
                    background: u.is_admin ? 'var(--accent)' : 'var(--card)',
                    border: '1px solid var(--border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '14px', fontWeight: 700,
                    color: u.is_admin ? '#000' : 'var(--text-muted)',
                  }}>
                    {(u.name || u.email || '?').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {u.name || 'No name'}
                      {u.is_admin && <span style={{ fontSize: '10px', color: 'var(--accent)', background: 'rgba(170,255,0,.12)', padding: '1px 6px', borderRadius: '6px', fontWeight: 700 }}>ADMIN</span>}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{u.email}</div>
                  </div>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Joined {new Date(u.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent sessions */}
        <div className="dash-card">
          <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '20px' }}>🎤 Recent Sessions (last 20)</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {sessions.length === 0 ? (
              <p className="text-muted" style={{ fontSize: '14px' }}>No sessions recorded yet.</p>
            ) : sessions.map((s: any) => (
              <div key={s.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 14px', borderRadius: '10px',
                background: 'var(--card2)', border: '1px solid var(--border)',
                gap: '12px', flexWrap: 'wrap',
              }}>
                <div style={{ flex: 1, minWidth: '180px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '280px' }}>
                    &ldquo;{s.prompt || 'No prompt'}&rdquo;
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    {s.category} · {new Date(s.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '16px' }}>
                  {[
                    { k: 'CLARITY', v: s.clarity_score, c: 'var(--accent)' },
                    { k: 'FILLERS', v: s.filler_count },
                    { k: 'WPM', v: s.pace || '—' },
                  ].map(m => (
                    <div key={m.k} style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '9px', color: '#555', fontWeight: 700, marginBottom: '1px' }}>{m.k}</div>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: (m as any).c || 'var(--text-primary)' }}>{m.v}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
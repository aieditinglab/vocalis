'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Nav from '@/components/Nav'
import { getSettings, saveSettings, signOut, applyTheme } from '@/lib/db'
import type { UserSettings } from '@/lib/types'
import { validateDisplayName } from '@/lib/profanityFilter'

export default function SettingsPage() {
  const router = useRouter()
  const [s, setS] = useState<UserSettings | null>(null)
  const [saved, setSaved] = useState(false)
  const [saveErr, setSaveErr] = useState('')
  const [del, setDel] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  useEffect(() => {
    getSettings().then(setS)
  }, [])

  const up = (p: Partial<UserSettings>) => {
    if (!s) return
    setS({ ...s, ...p })
    setSaved(false)
    setSaveErr('')
  }

  const handleTheme = (theme: 'dark' | 'light') => {
    up({ theme })
    applyTheme(theme)
  }

  const handleSave = async () => {
    if (!s) return
    const nameError = validateDisplayName(s.name)
    if (nameError) {
      setSaveErr(nameError)
      return
    }
    setSaveErr('')
    await saveSettings(s)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleLogout = async () => {
    setLoggingOut(true)
    await signOut()
    window.location.href = '/auth'
  }

  const Toggle = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
    <label className="toggle">
      <input type="checkbox" checked={checked} onChange={onChange} />
      <span className="toggle-slider" />
    </label>
  )

  if (!s) return (
    <>
      <Nav showApp />
      <div className="container" style={{ textAlign: 'center', paddingTop: '80px' }}>
        <div className="shimmer" style={{ height: '400px', borderRadius: '20px' }} />
      </div>
    </>
  )

  return (
    <>
      <Nav showApp />
      <div className="container">
        <p className="eyebrow anim-slide-up anim-d1">SETTINGS</p>
        <h1 className="font-display anim-slide-up anim-d2" style={{ fontSize: 'clamp(32px,4vw,48px)', fontWeight: 900, letterSpacing: '-.04em', marginBottom: '40px' }}>
          Your Preferences
        </h1>

        {/* Appearance */}
        <div className="anim-slide-up anim-d2" style={{ marginBottom: '20px' }}>
          <p style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '.08em', color: 'var(--text-muted)', marginBottom: '8px' }}>APPEARANCE</p>
          <div className="settings-section">
            <div className="settings-row">
              <div>
                <div style={{ fontWeight: 600 }}>Theme</div>
                <div className="text-muted" style={{ fontSize: '13px' }}>Choose light or dark mode</div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {(['dark', 'light'] as const).map(t => (
                  <button key={t} onClick={() => handleTheme(t)}
                    style={{ padding: '8px 18px', borderRadius: '100px', border: '1px solid', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', transition: 'all .2s',
                      borderColor: s.theme === t ? 'var(--accent)' : 'var(--border-light)',
                      background: s.theme === t ? 'rgba(170,255,0,.08)' : 'transparent',
                      color: s.theme === t ? 'var(--accent)' : 'var(--text-muted)' }}>
                    {t === 'dark' ? '🌙 Dark' : '☀️ Light'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Profile */}
        <div className="anim-slide-up anim-d3" style={{ marginBottom: '20px' }}>
          <p style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '.08em', color: 'var(--text-muted)', marginBottom: '8px' }}>PROFILE</p>
          <div className="settings-section">
            <div className="settings-row">
              <div><div style={{ fontWeight: 600 }}>First Name</div></div>
              <input className="input" type="text" value={s.name} onChange={e => up({ name: e.target.value })} style={{ width: '180px' }} placeholder="Your name" />
            </div>
            <div className="settings-row">
              <div><div style={{ fontWeight: 600 }}>Email</div><div className="text-muted" style={{ fontSize: '13px' }}>Your account email</div></div>
              <input className="input" type="email" value={s.email} onChange={e => up({ email: e.target.value })} style={{ width: '220px' }} placeholder="you@email.com" />
            </div>
          </div>
        </div>

        {/* Training */}
        <div className="anim-slide-up anim-d3" style={{ marginBottom: '20px' }}>
          <p style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '.08em', color: 'var(--text-muted)', marginBottom: '8px' }}>TRAINING</p>
          <div className="settings-section">
            <div className="settings-row">
              <div><div style={{ fontWeight: 600 }}>Target WPM Range</div><div className="text-muted" style={{ fontSize: '13px' }}>Used to evaluate your speaking pace</div></div>
              <select value={`${s.targetWpmMin}-${s.targetWpmMax}`}
                onChange={e => { const [min, max] = e.target.value.split('-').map(Number); up({ targetWpmMin: min, targetWpmMax: max }) }}
                style={{ background: 'var(--card2)', border: '1px solid var(--border-light)', color: 'var(--text-primary)', padding: '10px 14px', borderRadius: '10px', fontSize: '14px', outline: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
                <option value="110-130">110–130 WPM (slow)</option>
                <option value="120-140">120–140 WPM (conversational)</option>
                <option value="140-160">140–160 WPM (ideal)</option>
                <option value="150-170">150–170 WPM (natural fast)</option>
                <option value="160-180">160–180 WPM (energetic)</option>
              </select>
            </div>
            <div className="settings-row">
              <div><div style={{ fontWeight: 600 }}>Default Category</div></div>
              <select value={s.defaultCategory} onChange={e => up({ defaultCategory: e.target.value })}
                style={{ background: 'var(--card2)', border: '1px solid var(--border-light)', color: 'var(--text-primary)', padding: '10px 14px', borderRadius: '10px', fontSize: '14px', outline: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
                <option>Job Interviews</option>
                <option>College Interviews</option>
                <option>School Presentations</option>
                <option>Public Speaking</option>
                <option>My Own Prompt</option>
              </select>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="anim-slide-up anim-d4" style={{ marginBottom: '20px' }}>
          <p style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '.08em', color: 'var(--text-muted)', marginBottom: '8px' }}>NOTIFICATIONS</p>
          <div className="settings-section">
            <div className="settings-row">
              <div><div style={{ fontWeight: 600 }}>Session Summaries</div><div className="text-muted" style={{ fontSize: '13px' }}>Email recap after each session</div></div>
              <Toggle checked={s.notificationsEnabled} onChange={() => up({ notificationsEnabled: !s.notificationsEnabled })} />
            </div>
            <div className="settings-row">
              <div><div style={{ fontWeight: 600 }}>Daily Reminders</div><div className="text-muted" style={{ fontSize: '13px' }}>Keep your streak going</div></div>
              <Toggle checked={s.remindersEnabled} onChange={() => up({ remindersEnabled: !s.remindersEnabled })} />
            </div>
          </div>
        </div>

        {/* Save */}
        <div className="anim-slide-up anim-d4" style={{ marginBottom: '8px' }}>
          {saveErr && (
            <div style={{ background: 'rgba(255,48,84,.08)', border: '1px solid rgba(255,48,84,.2)', borderRadius: '12px', padding: '12px 16px', fontSize: '14px', color: 'var(--hot)', marginBottom: '12px' }}>
              {saveErr}
            </div>
          )}
          <button className="btn btn-primary btn-full" onClick={handleSave} style={{ padding: '16px', fontSize: '16px' }}>
            {saved ? '✓ Settings Saved' : 'Save Changes'}
          </button>
        </div>

        {/* Logout */}
        <div className="anim-slide-up anim-d5" style={{ marginBottom: '20px', marginTop: '12px' }}>
          <button
            className="btn btn-outline btn-full"
            onClick={handleLogout}
            disabled={loggingOut}
            style={{ padding: '16px', fontSize: '16px', borderColor: 'var(--border-light)', color: 'var(--text-muted)' }}
          >
            {loggingOut ? 'Logging out...' : '→ Log Out'}
          </button>
        </div>

        {/* Danger zone */}
        <div className="anim-slide-up anim-d5" style={{ background: 'rgba(255,48,84,.04)', border: '1px solid rgba(255,48,84,.15)', borderRadius: '20px', padding: '24px' }}>
          <p style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '.08em', color: 'var(--hot)', marginBottom: '16px' }}>DANGER ZONE</p>
          <div className="settings-row" style={{ borderBottom: 'none', paddingTop: 0 }}>
            <div>
              <div style={{ fontWeight: 600 }}>Delete All Session Data</div>
              <div className="text-muted" style={{ fontSize: '13px' }}>Permanently removes all recordings and stats</div>
            </div>
            <button onClick={() => setDel(d => !d)}
              style={{ background: del ? 'rgba(255,48,84,.1)' : 'transparent', border: `1px solid ${del ? 'var(--hot)' : 'rgba(255,48,84,.3)'}`, color: 'var(--hot)', borderRadius: '100px', padding: '9px 18px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
              {del ? 'Confirm Delete' : 'Delete All Data'}
            </button>
          </div>
        </div>

      </div>
    </>
  )
}
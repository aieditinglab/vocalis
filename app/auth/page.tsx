'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Nav from '@/components/Nav'
import { signIn, signUp } from '@/lib/db'

export default function AuthPage() {
  const [mode, setMode] = useState<'signup' | 'login'>('signup')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const submit = async () => {
    setErr('')
    if (mode === 'signup' && !name.trim()) { setErr('Please enter your first name.'); return }
    if (!email.includes('@') || !email.includes('.')) { setErr('Please enter a valid email address.'); return }
    if (pass.length < 6) { setErr('Password must be at least 6 characters.'); return }
    setLoading(true)
    try {
      if (mode === 'signup') {
        const { user, error } = await signUp(email, pass, name.trim())
        if (error) {
          setErr(error.includes('already registered') || error.includes('already exists')
            ? 'An account with this email already exists. Try logging in instead.'
            : error)
          setLoading(false)
          return
        }
        router.push('/dashboard')
      } else {
        const { user, error } = await signIn(email, pass)
        if (error) { setErr(error); setLoading(false); return }
        router.push('/dashboard')
      }
    } catch {
      setErr('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <>
      <Nav backHref="/" />
      <div style={{ minHeight: 'calc(100vh - 73px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
        <div style={{ width: '100%', maxWidth: '420px' }}>
          <div style={{ textAlign: 'center', marginBottom: '36px' }}>
            <h1 className="font-display anim-slide-up anim-d1" style={{ fontSize: '34px', fontWeight: 900, letterSpacing: '-.03em', marginBottom: '8px' }}>
              {mode === 'signup' ? 'Create your account' : 'Welcome back'}
            </h1>
            <p className="text-muted anim-slide-up anim-d2">
              {mode === 'signup' ? 'Start building your voice today.' : 'Continue your training.'}
            </p>
          </div>

          <div className="tab-bar anim-slide-up anim-d3" style={{ marginBottom: '28px' }}>
            <button className={`tab-btn ${mode === 'signup' ? 'active' : ''}`} onClick={() => { setMode('signup'); setErr('') }}>Sign Up</button>
            <button className={`tab-btn ${mode === 'login'  ? 'active' : ''}`} onClick={() => { setMode('login');  setErr('') }}>Log In</button>
          </div>

          <div className="anim-slide-up anim-d4" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {mode === 'signup' && (
              <div>
                <label className="input-label">First Name</label>
                <input className="input" type="text" placeholder="What should we call you?" value={name} onChange={e => setName(e.target.value)} disabled={loading} />
              </div>
            )}
            <div>
              <label className="input-label">Email</label>
              <input className="input" type="email" placeholder="you@email.com" value={email} onChange={e => setEmail(e.target.value)} disabled={loading} />
            </div>

            {/* Password with eye toggle */}
            <div>
              <label className="input-label">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  className="input"
                  type={showPass ? 'text' : 'password'}
                  placeholder="Min. 6 characters"
                  value={pass}
                  onChange={e => setPass(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && submit()}
                  disabled={loading}
                  style={{ paddingRight: '52px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(s => !s)}
                  tabIndex={-1}
                  style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', padding: '4px' }}
                >
                  {showPass ? (
                    // Eye open
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  ) : (
                    // Eye closed
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {err && (
              <div style={{ background: 'rgba(255,48,84,0.08)', border: '1px solid rgba(255,48,84,0.2)', borderRadius: '12px', padding: '12px 16px', fontSize: '14px', color: 'var(--hot)', lineHeight: 1.5 }}>
                {err}
              </div>
            )}

            <button className="btn btn-primary btn-full" onClick={submit} disabled={loading}
              style={{ padding: '18px', fontSize: '16px', marginTop: '4px', opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}>
              {loading
                ? (mode === 'signup' ? 'Creating account...' : 'Logging in...')
                : (mode === 'signup' ? 'Create Account →' : 'Log In →')}
            </button>
          </div>

          <p className="text-muted" style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px' }}>
            Free forever for students. No credit card needed.
          </p>
        </div>
      </div>
    </>
  )
}

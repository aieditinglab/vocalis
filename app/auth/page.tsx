'use client'
import { useState, useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import Nav from '@/components/Nav'
import { signIn, signUp } from '@/lib/db'
import { createClient } from '@/lib/supabase'

function AuthPageInner() {
  const [mode, setMode]           = useState<'signup' | 'login'>('signup')
  const [phase, setPhase]         = useState<'form' | 'verify'>('form')
  const [name, setName]           = useState('')
  const [email, setEmail]         = useState('')
  const [pass, setPass]           = useState('')
  const [showPass, setShowPass]   = useState(false)
  const [err, setErr]             = useState('')
  const [loading, setLoading]     = useState(false)
  const [countdown, setCountdown] = useState(0)
  const router = useRouter()

  useEffect(() => {
    if (countdown <= 0) return
    const t = setInterval(() => setCountdown(c => c - 1), 1000)
    return () => clearInterval(t)
  }, [countdown])

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
        setPhase('verify')
        setCountdown(60)
        setLoading(false)
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

  const resendEmail = async () => {
    if (countdown > 0) return
    setErr('')
    setLoading(true)
    try {
      const sb = createClient()
      const { error } = await sb.auth.resend({
        type: 'signup',
        email,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      })
      if (error) setErr('Could not resend: ' + error.message)
      else setCountdown(60)
    } catch {
      setErr('Could not resend email. Please try again.')
    }
    setLoading(false)
  }

  if (phase === 'verify') {
    return (
      <>
        <Nav backHref="/" />
        <div style={{ minHeight: 'calc(100vh - 73px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
          <div style={{ width: '100%', maxWidth: '440px', textAlign: 'center' }}>
            <div style={{ fontSize: '64px', marginBottom: '24px' }}>📬</div>
            <h1 className="font-display anim-slide-up anim-d1" style={{ fontSize: '30px', fontWeight: 900, letterSpacing: '-.03em', marginBottom: '12px' }}>Check your email</h1>
            <p className="text-muted anim-slide-up anim-d2" style={{ fontSize: '16px', marginBottom: '8px' }}>We sent a confirmation link to</p>
            <p className="anim-slide-up anim-d2" style={{ fontSize: '16px', fontWeight: 600, color: 'var(--accent)', marginBottom: '32px' }}>{email}</p>
            <div className="anim-slide-up anim-d3" style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '20px', padding: '24px', marginBottom: '24px', textAlign: 'left' }}>
              {[
                { num: '1', text: 'Open the email from Vocalis' },
                { num: '2', text: 'Click the confirmation link' },
                { num: '3', text: "You'll be taken to your dashboard automatically" },
              ].map(s => (
                <div key={s.num} style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(170,255,0,0.1)', border: '1px solid rgba(170,255,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '13px', fontWeight: 700, color: 'var(--accent)' }}>{s.num}</div>
                  <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>{s.text}</span>
                </div>
              ))}
            </div>
            {err && <div style={{ background: 'rgba(255,48,84,0.08)', border: '1px solid rgba(255,48,84,0.2)', borderRadius: '12px', padding: '12px 16px', fontSize: '14px', color: 'var(--hot)', marginBottom: '16px' }}>{err}</div>}
            <p className="text-muted" style={{ fontSize: '14px', marginBottom: '12px' }}>Didn&apos;t get it? Check your spam folder.</p>
            <button className="btn btn-outline btn-full" onClick={resendEmail} disabled={countdown > 0 || loading}
              style={{ opacity: countdown > 0 ? 0.5 : 1, cursor: countdown > 0 ? 'not-allowed' : 'pointer', padding: '14px' }}>
              {loading ? 'Sending...' : countdown > 0 ? `Resend in ${countdown}s` : 'Resend Confirmation Email'}
            </button>
            <button onClick={() => { setPhase('form'); setErr('') }}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '13px', cursor: 'pointer', marginTop: '16px', fontFamily: 'var(--font-body)', display: 'block', width: '100%', textAlign: 'center' }}>
              ← Back to sign up
            </button>
          </div>
        </div>
      </>
    )
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
            <p className="text-muted anim-slide-up anim-d2">{mode === 'signup' ? 'Start building your voice today.' : 'Continue your training.'}</p>
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
            <div>
              <label className="input-label">Password</label>
              <div style={{ position: 'relative' }}>
                <input className="input" type={showPass ? 'text' : 'password'} placeholder="Min. 6 characters"
                  value={pass} onChange={e => setPass(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()}
                  disabled={loading} style={{ paddingRight: '52px' }} />
                <button type="button" onClick={() => setShowPass(s => !s)} tabIndex={-1}
                  style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', padding: '4px' }}>
                  {showPass ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                    </svg>
                  ) : (
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
              {loading ? (mode === 'signup' ? 'Creating account...' : 'Logging in...') : (mode === 'signup' ? 'Create Account →' : 'Log In →')}
            </button>
          </div>
          <p className="text-muted" style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px' }}>Free forever for students. No credit card needed.</p>
        </div>
      </div>
    </>
  )
}

export default function AuthPage() {
  return (
    <Suspense>
      <AuthPageInner />
    </Suspense>
  )
}

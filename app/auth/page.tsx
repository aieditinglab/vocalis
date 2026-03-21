'use client'
import { useState, useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import Nav from '@/components/Nav'
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

  // Countdown for resend button
  useEffect(() => {
    if (countdown <= 0) return
    const t = setInterval(() => setCountdown(c => c - 1), 1000)
    return () => clearInterval(t)
  }, [countdown])

  const validate = () => {
    if (mode === 'signup' && !name.trim()) { setErr('Please enter your first name.'); return false }
    if (!email.trim().match(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)) { setErr('Please enter a valid email address.'); return false }
    if (pass.length < 6) { setErr('Password must be at least 6 characters.'); return false }
    return true
  }

  const handleSignup = async () => {
    setErr('')
    setLoading(true)
    const sb = createClient()

    try {
      const { data, error } = await sb.auth.signUp({
        email: email.trim().toLowerCase(),
        password: pass,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: { name: name.trim() }
        }
      })

      if (error) {
        const msg = error.message.toLowerCase()
        if (msg.includes('already') || msg.includes('registered') || msg.includes('exists') || msg.includes('session')) {
          setErr('This email already has an account. Switch to Log In below.')
        } else if (msg.includes('password')) {
          setErr('Password must be at least 6 characters.')
        if (error) {
  const msg = error.message.toLowerCase()
  if (msg.includes('already') || msg.includes('registered') || msg.includes('exists') || msg.includes('session')) {
    setErr('This email already has an account. Switch to Log In below.')
  } else if (msg.includes('password')) {
    setErr('Password must be at least 6 characters.')
  } else if (msg.includes('invalid') && msg.includes('email')) {
    setErr('Please enter a valid email address.')
  } else if (msg.includes('rate limit') || msg.includes('too many')) {
    setErr('Too many attempts. Please wait a minute and try again.')
  } else {
    setErr(error.message)
  }
  setLoading(false)
  return
}
        } else {
          setErr(error.message)
        }
        setLoading(false)
        return
      }

      // Create profile
      if (data.user) {
        try {
          await sb.from('profiles').upsert({
            id: data.user.id,
            name: name.trim(),
            email: email.trim().toLowerCase()
          })
          await sb.from('user_settings').upsert({ user_id: data.user.id })
          await sb.from('token_balances').upsert({ user_id: data.user.id, balance: 50 })
          await sb.from('avatars').upsert({ user_id: data.user.id })
        } catch {}
      }

      // Check if email confirmation needed
      if (data.session) {
        // Already logged in (email confirm disabled)
        router.push('/dashboard')
      } else {
        // Email confirmation required
        setPhase('verify')
        setCountdown(60)
      }
    } catch (e: any) {
      setErr('Something went wrong. Please try again.')
    }
    setLoading(false)
  }

  const handleLogin = async () => {
    setErr('')
    setLoading(true)
    const sb = createClient()

    try {
      const { data, error } = await sb.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password: pass,
      })

      if (error) {
        const msg = error.message.toLowerCase()
        if (msg.includes('invalid') || msg.includes('credentials')) {
          setErr('Wrong email or password. Please try again.')
        } else if (msg.includes('not confirmed') || msg.includes('confirm')) {
          setErr('Please verify your email first. Check your inbox.')
        } else {
          setErr(error.message)
        }
        setLoading(false)
        return
      }

      if (data.session) {
        // Hard redirect so proxy picks up the new session cookie
        window.location.href = '/dashboard'
      }
    } catch (e: any) {
      setErr('Something went wrong. Please try again.')
    }
    setLoading(false)
  }

  const handleSubmit = () => {
    if (!validate()) return
    if (mode === 'signup') handleSignup()
    else handleLogin()
  }

  const resendEmail = async () => {
    if (countdown > 0) return
    setErr('')
    setLoading(true)
    const sb = createClient()
    try {
      const { error } = await sb.auth.resend({
        type: 'signup',
        email: email.trim().toLowerCase(),
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` }
      })
      if (error) {
        setErr('Could not resend: ' + error.message)
      } else {
        setCountdown(60)
        setErr('')
      }
    } catch {
      setErr('Could not resend. Please try again.')
    }
    setLoading(false)
  }

  // ── VERIFY EMAIL SCREEN ──────────────────────────────────────────────────
  if (phase === 'verify') {
    return (
      <>
        <Nav backHref="/" />
        <div style={{ minHeight: 'calc(100vh - 73px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
          <div style={{ width: '100%', maxWidth: '440px', textAlign: 'center' }}>
            <div style={{ fontSize: '64px', marginBottom: '24px' }}>📬</div>
            <h1 className="font-display anim-slide-up" style={{ fontSize: '30px', fontWeight: 900, letterSpacing: '-.03em', marginBottom: '12px' }}>
              Check your email
            </h1>
            <p className="text-muted" style={{ fontSize: '16px', marginBottom: '8px' }}>We sent a confirmation link to</p>
            <p style={{ fontSize: '16px', fontWeight: 700, color: 'var(--accent)', marginBottom: '32px' }}>{email}</p>

            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '20px', padding: '24px', marginBottom: '24px', textAlign: 'left' }}>
              {[
                { n: '1', t: 'Open the email from Vocalis (check spam too)' },
                { n: '2', t: 'Click the "Confirm your email" link' },
                { n: '3', t: "You'll be taken to your dashboard automatically" },
              ].map(s => (
                <div key={s.n} style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: s.n === '3' ? 0 : '14px' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(170,255,0,.1)', border: '1px solid rgba(170,255,0,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '13px', fontWeight: 700, color: 'var(--accent)' }}>{s.n}</div>
                  <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>{s.t}</span>
                </div>
              ))}
            </div>

            {err && <div style={{ background: 'rgba(255,48,84,.08)', border: '1px solid rgba(255,48,84,.2)', borderRadius: '12px', padding: '12px 16px', fontSize: '14px', color: 'var(--hot)', marginBottom: '16px' }}>{err}</div>}

            <p className="text-muted" style={{ fontSize: '14px', marginBottom: '12px' }}>Didn&apos;t get it? Check your spam folder first.</p>

            <button className="btn btn-outline btn-full" onClick={resendEmail}
              disabled={countdown > 0 || loading}
              style={{ padding: '14px', opacity: countdown > 0 ? 0.5 : 1, cursor: countdown > 0 ? 'not-allowed' : 'pointer' }}>
              {loading ? 'Sending...' : countdown > 0 ? `Resend in ${countdown}s` : 'Resend Confirmation Email'}
            </button>

            <button onClick={() => { setPhase('form'); setErr('') }}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '13px', cursor: 'pointer', marginTop: '14px', fontFamily: 'var(--font-body)', display: 'block', width: '100%', textAlign: 'center' }}>
              ← Back to sign up
            </button>
          </div>
        </div>
      </>
    )
  }

  // ── FORM ──────────────────────────────────────────────────────────────────
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
            <button className={`tab-btn ${mode === 'login' ? 'active' : ''}`}  onClick={() => { setMode('login');  setErr('') }}>Log In</button>
          </div>

          <div className="anim-slide-up anim-d4" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {mode === 'signup' && (
              <div>
                <label className="input-label">First Name</label>
                <input className="input" type="text" placeholder="What should we call you?"
                  value={name} onChange={e => setName(e.target.value)} disabled={loading} />
              </div>
            )}
            <div>
              <label className="input-label">Email</label>
              <input className="input" type="email" placeholder="you@email.com"
                value={email} onChange={e => setEmail(e.target.value)} disabled={loading} />
            </div>
            <div>
              <label className="input-label">Password</label>
              <div style={{ position: 'relative' }}>
                <input className="input" type={showPass ? 'text' : 'password'} placeholder="Min. 6 characters"
                  value={pass} onChange={e => setPass(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                  disabled={loading} style={{ paddingRight: '52px' }} />
                <button type="button" onClick={() => setShowPass(s => !s)} tabIndex={-1}
                  style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', padding: '4px' }}>
                  {showPass
                    ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  }
                </button>
              </div>
            </div>

            {err && (
              <div style={{ background: 'rgba(255,48,84,.08)', border: '1px solid rgba(255,48,84,.2)', borderRadius: '12px', padding: '12px 16px', fontSize: '14px', color: 'var(--hot)', lineHeight: 1.5 }}>
                {err}
              </div>
            )}

            <button className="btn btn-primary btn-full" onClick={handleSubmit} disabled={loading}
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

export default function AuthPage() {
  return (
    <Suspense>
      <AuthPageInner />
    </Suspense>
  )
}

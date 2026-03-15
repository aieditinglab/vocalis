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
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const submit = async () => {
    setErr('')

    // Validation
    if (mode === 'signup' && !name.trim()) { setErr('Please enter your first name.'); return }
    if (!email.includes('@') || !email.includes('.')) { setErr('Please enter a valid email address.'); return }
    if (pass.length < 6) { setErr('Password must be at least 6 characters.'); return }

    setLoading(true)

    if (mode === 'signup') {
      const { user, error } = await signUp(email, pass, name.trim())
      if (error) {
        setErr(error.includes('already registered')
          ? 'An account with this email already exists. Try logging in instead.'
          : error)
        setLoading(false)
        return
      }
      router.push('/dashboard')
    } else {
      const { user, error } = await signIn(email, pass)
      if (error) {
        setErr(error)
        setLoading(false)
        return
      }
      router.push('/dashboard')
    }
  }

  return (
    <>
      <Nav backHref="/" />
      <div style={{ minHeight: 'calc(100vh - 73px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
        <div style={{ width: '100%', maxWidth: '420px' }}>

          {/* Heading */}
          <div style={{ textAlign: 'center', marginBottom: '36px' }}>
            <h1 className="font-display anim-slide-up anim-d1" style={{ fontSize: '34px', fontWeight: 900, letterSpacing: '-.03em', marginBottom: '8px' }}>
              {mode === 'signup' ? 'Create your account' : 'Welcome back'}
            </h1>
            <p className="text-muted anim-slide-up anim-d2">
              {mode === 'signup' ? 'Start building your voice today.' : 'Continue your training.'}
            </p>
          </div>

          {/* Tab bar */}
          <div className="tab-bar anim-slide-up anim-d3" style={{ marginBottom: '28px' }}>
            <button className={`tab-btn ${mode === 'signup' ? 'active' : ''}`} onClick={() => { setMode('signup'); setErr('') }}>Sign Up</button>
            <button className={`tab-btn ${mode === 'login' ? 'active' : ''}`}  onClick={() => { setMode('login');  setErr('') }}>Log In</button>
          </div>

          {/* Fields */}
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
              <input className="input" type="password" placeholder="Min. 6 characters" value={pass} onChange={e => setPass(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && submit()} disabled={loading} />
            </div>

            {/* Error message */}
            {err && (
              <div style={{ background: 'rgba(255,48,84,0.08)', border: '1px solid rgba(255,48,84,0.2)', borderRadius: '12px', padding: '12px 16px', fontSize: '14px', color: 'var(--hot)', lineHeight: 1.5 }}>
                {err}
              </div>
            )}

            <button
              className="btn btn-primary btn-full"
              onClick={submit}
              disabled={loading}
              style={{ padding: '18px', fontSize: '16px', marginTop: '4px', opacity: loading ? 0.7 : 1 }}
            >
              {loading ? '...' : mode === 'signup' ? 'Create Account →' : 'Log In →'}
            </button>
          </div>

          <p className="text-muted" style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px' }}>
            Free forever for students. No credit card needed.
          </p>

          {mode === 'login' && (
            <p className="text-muted" style={{ textAlign: 'center', marginTop: '12px', fontSize: '13px' }}>
              Forgot password? Contact support.
            </p>
          )}
        </div>
      </div>
    </>
  )
}

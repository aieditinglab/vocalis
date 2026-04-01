'use client'
import Link from 'next/link'
import Logo from './Logo'
import { getTokenBalance } from '@/lib/db'
import { getUser } from '@/lib/db'
import { useEffect, useState } from 'react'

interface NavProps {
  backHref?: string
  backLabel?: string
  rightContent?: React.ReactNode
  showAuth?: boolean
  showApp?: boolean
}

export default function Nav({ backHref, backLabel = '← Back', rightContent, showAuth, showApp }: NavProps) {
  const [tokens, setTokens] = useState<number | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    if (!showApp) return
    const load = async () => {
      const [bal, user] = await Promise.all([getTokenBalance(), getUser()])
      setTokens(bal)
      if (user?.email === 'aieditinglab@gmail.com') setIsAdmin(true)
    }
    load()
    // Refresh tokens every 30 seconds
    const interval = setInterval(load, 30000)
    return () => clearInterval(interval)
  }, [showApp])

  return (
    <nav className="nav" style={{ position: 'sticky', top: 0, zIndex: 100 }}>
      <Link href="/" style={{ textDecoration: 'none', flexShrink: 0 }}>
        <Logo size={34} showText textSize={15} />
      </Link>

      {/* Desktop nav */}
      <div className="nav-desktop" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        {rightContent}
        {showApp && (
          <>
            <Link href="/dashboard"   className="btn btn-outline btn-sm nav-hide-mobile">Dashboard</Link>
            <Link href="/practice"    className="btn btn-outline btn-sm nav-hide-mobile">Practice</Link>
            <Link href="/leaderboard" className="btn btn-outline btn-sm nav-hide-mobile">Leaderboard</Link>
            <Link href="/games"       className="btn btn-outline btn-sm nav-hide-mobile">Games</Link>
            <Link href="/avatar"      className="btn btn-outline btn-sm nav-hide-mobile">Avatar</Link>
            <Link href="/settings"    className="btn btn-outline btn-sm nav-hide-mobile">Settings</Link>
            {isAdmin && (
              <Link href="/admin" className="btn btn-outline btn-sm nav-hide-mobile"
                style={{ borderColor: 'rgba(170,255,0,.3)', color: 'var(--accent)' }}>
                ⚙️ Admin
              </Link>
            )}
            <Link href="/record" className="btn btn-primary btn-sm">🎤 New Rep</Link>
            <div className="token-pill" style={{
    background: 'var(--card)', border: '1px solid var(--border-light)',
    borderRadius: '100px', padding: '6px 12px', fontSize: '13px',
    fontWeight: 700, color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '4px'
  }}>
              🪙 {tokens === null ? '...' : tokens >= 999999 ? '∞' : tokens}
            </div>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              style={{ display: 'none', background: 'transparent', border: '1px solid var(--border-light)', borderRadius: '8px', padding: '8px 10px', cursor: 'pointer', color: 'var(--text-primary)', fontSize: '18px' }}
              className="nav-hamburger"
              aria-label="Menu"
            >
              {menuOpen ? '✕' : '☰'}
            </button>
          </>
        )}
        {showAuth && (
          <>
            <Link href="/auth" className="btn btn-outline btn-sm">Log in</Link>
            <Link href="/auth" className="btn btn-primary btn-sm">Get Started →</Link>
          </>
        )}
        {backHref && !showAuth && !showApp && (
          <Link href={backHref} className="btn btn-outline btn-sm">{backLabel}</Link>
        )}
      </div>

      {/* Mobile dropdown */}
      {showApp && menuOpen && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0,
          background: 'var(--nav-bg)', backdropFilter: 'blur(20px)',
          borderBottom: '1px solid var(--border)', padding: '16px 20px',
          display: 'flex', flexDirection: 'column', gap: '8px', zIndex: 99,
        }}>
          {[
            { href: '/dashboard',   label: 'Dashboard' },
            { href: '/practice',    label: 'Practice' },
            { href: '/leaderboard', label: 'Leaderboard' },
            { href: '/games',       label: 'Games' },
            { href: '/avatar',      label: 'Avatar' },
            { href: '/settings',    label: 'Settings' },
            ...(isAdmin ? [{ href: '/admin', label: '⚙️ Admin' }] : []),
          ].map(item => (
            <Link key={item.href} href={item.href}
              onClick={() => setMenuOpen(false)}
              style={{ padding: '12px 16px', borderRadius: '12px', background: 'var(--card)', color: 'var(--text-primary)', textDecoration: 'none', fontWeight: 600, fontSize: '15px' }}>
              {item.label}
            </Link>
          ))}
        </div>
      )}

      <style>{`
        @media (max-width: 600px) {
          .nav-hide-mobile { display: none !important; }
          .nav-hamburger   { display: block !important; }
        }
      `}</style>
    </nav>
  )
}

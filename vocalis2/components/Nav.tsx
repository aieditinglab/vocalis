'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Logo from './Logo'
import { getTokenBalance } from '@/lib/store'
import { useEffect, useState } from 'react'

interface NavProps {
  backHref?: string
  backLabel?: string
  rightContent?: React.ReactNode
  showAuth?: boolean
  showApp?: boolean
}

const APP_LINKS = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/practice',  label: 'Practice'  },
  { href: '/games',     label: 'Games'     },
  { href: '/avatar',    label: 'Avatar'    },
  { href: '/settings',  label: 'Settings'  },
]

export default function Nav({ backHref, backLabel = '← Back', rightContent, showAuth, showApp }: NavProps) {
  const [tokens, setTokens] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)
  const pathname = usePathname()
  const isActive = (href: string) => pathname === href || (pathname?.startsWith(href + '/') ?? false)

  useEffect(() => { setTokens(getTokenBalance()) }, [pathname])

  return (
    <nav className="nav" style={{ position: 'sticky', top: 0, zIndex: 100 }}>
      <Link href="/" style={{ textDecoration: 'none', flexShrink: 0 }}>
        <Logo size={34} showText textSize={15} />
      </Link>

      <div className="nav-desktop" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        {rightContent}
        {showApp && (
          <>
            {APP_LINKS.map(item => {
              const active = isActive(item.href)
              return (
                <Link key={item.href} href={item.href}
                  className="btn btn-outline btn-sm nav-hide-mobile"
                  aria-current={active ? 'page' : undefined}
                  style={active ? { borderColor: 'var(--accent)', color: 'var(--accent)', background: 'rgba(170,255,0,.06)' } : undefined}>
                  {item.label}
                </Link>
              )
            })}
            <Link href="/record" className="btn btn-primary btn-sm" aria-label="Start a new recording">New Rep</Link>
            <div className="token-display" style={{ background: 'var(--card)', border: '1px solid var(--border-light)', borderRadius: '100px', padding: '6px 12px', fontSize: '13px', fontWeight: 700, color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              {tokens} tokens
            </div>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              style={{ display: 'none', background: 'transparent', border: '1px solid var(--border-light)', borderRadius: '8px', padding: '8px 10px', cursor: 'pointer', color: 'var(--text-primary)', fontSize: '18px' }}
              className="nav-hamburger"
              aria-label="Menu"
              aria-expanded={menuOpen}
            >
              {menuOpen ? 'Close' : 'Menu'}
            </button>
          </>
        )}
        {showAuth && (
          <>
            <Link href="/auth" className="btn btn-outline btn-sm">Log in</Link>
            <Link href="/auth" className="btn btn-primary btn-sm">Get Started</Link>
          </>
        )}
        {backHref && !showAuth && !showApp && (
          <Link href={backHref} className="btn btn-outline btn-sm">{backLabel}</Link>
        )}
      </div>

      {showApp && menuOpen && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0,
          background: 'var(--nav-bg)', backdropFilter: 'blur(20px)',
          borderBottom: '1px solid var(--border)', padding: '16px 20px',
          display: 'flex', flexDirection: 'column', gap: '8px', zIndex: 99,
        }}>
          {APP_LINKS.map(item => {
            const active = isActive(item.href)
            return (
              <Link key={item.href} href={item.href}
                onClick={() => setMenuOpen(false)}
                aria-current={active ? 'page' : undefined}
                style={{ padding: '12px 16px', borderRadius: '12px', background: active ? 'rgba(170,255,0,.08)' : 'var(--card)', color: active ? 'var(--accent)' : 'var(--text-primary)', textDecoration: 'none', fontWeight: 600, fontSize: '15px', border: active ? '1px solid rgba(170,255,0,.3)' : '1px solid transparent' }}>
                {item.label}
              </Link>
            )
          })}
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

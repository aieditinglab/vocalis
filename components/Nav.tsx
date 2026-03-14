'use client'
import Link from 'next/link'
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

export default function Nav({ backHref, backLabel='← Back', rightContent, showAuth, showApp }: NavProps) {
  const [tokens, setTokens] = useState(0)
  useEffect(() => { setTokens(getTokenBalance()) }, [])

  return (
    <nav className="nav">
      <Link href="/" style={{ textDecoration:'none' }}><Logo size={36} showText textSize={16} /></Link>
      <div style={{ display:'flex', alignItems:'center', gap:'8px', flexWrap:'wrap' }}>
        {rightContent}
        {showApp && (
          <>
            <Link href="/dashboard" className="btn btn-outline btn-sm">Dashboard</Link>
            <Link href="/practice"  className="btn btn-outline btn-sm">Practice</Link>
            <Link href="/games"     className="btn btn-outline btn-sm">Games</Link>
            <Link href="/avatar"    className="btn btn-outline btn-sm">Avatar</Link>
            <Link href="/settings"  className="btn btn-outline btn-sm">Settings</Link>
            <Link href="/record"    className="btn btn-primary btn-sm">🎤 New Rep</Link>
            <div style={{ background:'var(--card)', border:'1px solid var(--border-light)', borderRadius:'100px', padding:'6px 14px', fontSize:'13px', fontWeight:700, color:'var(--accent)', display:'flex', alignItems:'center', gap:'5px' }}>
              🪙 {tokens}
            </div>
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
    </nav>
  )
}

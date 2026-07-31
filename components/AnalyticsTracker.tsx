'use client'
// Mounted once in the root layout. Emits app_open + page_view + heartbeats for
// signed-in users so the admin dashboard can compute time-on-app and DAU/WAU/MAU.
// Renders nothing and never throws; see lib/analytics.ts for the guarantees.
import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { track, trackNow, startHeartbeat } from '@/lib/analytics'

const OPEN_FLAG = 'vocalis_open_logged'

export default function AnalyticsTracker() {
  const pathname = usePathname()
  const lastPath = useRef<string | null>(null)

  // app_open — once per visit, not once per route change.
  useEffect(() => {
    let stopHeartbeat: (() => void) | undefined
    try {
      if (!sessionStorage.getItem(OPEN_FLAG)) {
        sessionStorage.setItem(OPEN_FLAG, '1')
        trackNow('app_open', {
          referrer: document.referrer || null,
          // Coarse bucket only — no fingerprinting, no full UA string stored.
          viewport: window.innerWidth < 768 ? 'mobile' : 'desktop',
        })
      }
      stopHeartbeat = startHeartbeat()
    } catch {}
    return () => { stopHeartbeat?.() }
  }, [])

  useEffect(() => {
    if (!pathname || pathname === lastPath.current) return
    lastPath.current = pathname
    void track('page_view', {}, pathname)
  }, [pathname])

  return null
}

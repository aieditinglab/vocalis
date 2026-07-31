'use client'
// ── CLIENT EVENT TRACKING ────────────────────────────────────────────────────
// Nothing in the app recorded app-opens, page views, or where users abandoned
// the 5-step flow, so "time on app", DAU/WAU/MAU-by-open, and funnel drop-off
// were all uncomputable. This is the write side; lib/adminAnalytics.ts reads.
//
// Rules this file obeys:
//   - Never throw. Analytics must not be able to break a page.
//   - Never block. Every call is fire-and-forget.
//   - No-op when signed out. app_events.user_id is NOT NULL and RLS demands
//     auth.uid() = user_id, so an anonymous insert would just be rejected.

import { createClient } from './supabase'

export type AppEvent =
  | 'app_open'
  | 'heartbeat'
  | 'page_view'
  | 'signup'
  | 'lesson_start'
  | 'recording_done'
  | 'self_rate'
  | 'observe'
  | 'correct'
  | 'session_saved'
  | 'prep_completed'
  | 'prep_skipped'
  | 'track_selected'
  | 'lesson_locked_hit'
  | 'custom_practice_start'

const SESSION_KEY_NAME = 'vocalis_session_key'
const HEARTBEAT_MS = 30_000

/** Cached so we don't hit the auth store on every single event. */
let cachedUserId: string | null = null
let cachedUserResolved = false

async function userId(): Promise<string | null> {
  if (cachedUserResolved && cachedUserId) return cachedUserId
  try {
    const { data } = await createClient().auth.getSession()
    cachedUserId = data.session?.user?.id ?? null
  } catch {
    cachedUserId = null
  }
  // Only a *positive* result is cached. Signing in mid-visit doesn't reload the
  // module, so caching "signed out" would silently drop every later event.
  cachedUserResolved = cachedUserId !== null
  return cachedUserId
}

/** Call after sign-in/sign-out so the next event re-resolves the user. */
export function resetAnalyticsUser(): void {
  cachedUserId = null
  cachedUserResolved = false
}

/**
 * One key per visit. Session duration is derived server-side by grouping on
 * this and taking max(created_at) - min(created_at), so it must survive route
 * changes but die with the tab — sessionStorage is exactly that.
 */
export function sessionKey(): string {
  if (typeof window === 'undefined') return 'ssr'
  try {
    let k = sessionStorage.getItem(SESSION_KEY_NAME)
    if (!k) {
      k = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
      sessionStorage.setItem(SESSION_KEY_NAME, k)
    }
    return k
  } catch {
    return 'nostorage'
  }
}

export async function track(
  event: AppEvent,
  props: Record<string, unknown> = {},
  path?: string,
): Promise<void> {
  if (typeof window === 'undefined') return
  try {
    const uid = await userId()
    if (!uid) return
    await createClient().from('app_events').insert({
      user_id: uid,
      event,
      path: path ?? window.location.pathname,
      props,
      session_key: sessionKey(),
    })
  } catch {
    // Swallowed on purpose — a failed metric must never surface to the user.
  }
}

/** Fire-and-forget wrapper for call sites that shouldn't await. */
export function trackNow(event: AppEvent, props: Record<string, unknown> = {}): void {
  void track(event, props)
}

// ── SESSION DURATION ────────────────────────────────────────────────────────
// A heartbeat every 30s while the tab is visible. Two consequences worth
// knowing when reading the numbers: a visit is measured to the nearest
// heartbeat, and a visit with a single event reads as 0 seconds (a bounce).

let heartbeatTimer: ReturnType<typeof setInterval> | null = null

export function startHeartbeat(): () => void {
  if (typeof window === 'undefined') return () => {}
  stopHeartbeat()

  heartbeatTimer = setInterval(() => {
    if (document.visibilityState === 'visible') trackNow('heartbeat')
  }, HEARTBEAT_MS)

  // Closing the tab is the truest "left the app" signal we get. sendBeacon
  // isn't usable here (it can't carry the Supabase auth header), so we settle
  // for one last synchronous-ish write and accept that some are lost.
  const onHide = () => {
    if (document.visibilityState === 'hidden') trackNow('heartbeat', { final: true })
  }
  document.addEventListener('visibilitychange', onHide)

  return () => {
    stopHeartbeat()
    document.removeEventListener('visibilitychange', onHide)
  }
}

export function stopHeartbeat(): void {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer)
    heartbeatTimer = null
  }
}

// ── LESSON TIMING ───────────────────────────────────────────────────────────
// "Average time per lesson" means prep + recording + review, which spans four
// routes. Stamp the start when the brief opens and read it when the session
// saves. sessionStorage so an abandoned lesson can't poison a later one.

const LESSON_CLOCK = 'vocalis_lesson_started_at'

export function markLessonStart(): void {
  if (typeof window === 'undefined') return
  try { sessionStorage.setItem(LESSON_CLOCK, String(Date.now())) } catch {}
}

/** Elapsed ms since the lesson brief opened, or null if unknown/implausible. */
export function readLessonElapsedMs(): number | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(LESSON_CLOCK)
    if (!raw) return null
    const ms = Date.now() - Number(raw)
    // Guard against a tab left open overnight skewing the average.
    if (!Number.isFinite(ms) || ms <= 0 || ms > 2 * 60 * 60 * 1000) return null
    return Math.round(ms)
  } catch {
    return null
  }
}

export function clearLessonClock(): void {
  if (typeof window === 'undefined') return
  try { sessionStorage.removeItem(LESSON_CLOCK) } catch {}
}

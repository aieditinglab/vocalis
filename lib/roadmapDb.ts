'use client'
// ── ROADMAP DATA LAYER ──────────────────────────────────────────────────────
// Additive on purpose: this file does not modify lib/db.ts, so there's nothing
// to merge. It reuses the same client + getUser() so auth behavior is identical.
//
// Guarantee from the meeting: progress is per-track and independent. Switching
// from Job Interviews to Presentations never touches the other track's place.

import { createClient } from './supabase'
import { getUser } from './db'
import { TRACKS, getTrack, trackLength, isLessonUnlocked } from './roadmaps'

export interface TrackProgress {
  trackId: string
  currentLesson: number
  completedLessons: number[]
  lastLessonAt: string | null
  startedAt: string | null
}

/**
 * getUser() throws if the Supabase client can't be constructed (missing env
 * vars) and rejects on network failures. Every caller here treats "no user" and
 * "couldn't reach auth" the same way, so swallow it rather than letting the
 * rejection escape and leave a page stuck on its loading state forever.
 */
async function currentUser() {
  try {
    return await getUser()
  } catch (e) {
    console.error('roadmapDb: auth unavailable', e)
    return null
  }
}

const empty = (trackId: string): TrackProgress => ({
  trackId,
  currentLesson: 1,
  completedLessons: [],
  lastLessonAt: null,
  startedAt: null,
})

function rowToProgress(row: any): TrackProgress {
  return {
    trackId: row.track_id,
    currentLesson: row.current_lesson ?? 1,
    completedLessons: Array.isArray(row.completed_lessons) ? row.completed_lessons : [],
    lastLessonAt: row.last_lesson_at ?? null,
    startedAt: row.started_at ?? null,
  }
}

// ── READ ────────────────────────────────────────────────────────────────────

/** Progress for every track. Tracks never started come back as empty progress. */
export async function getAllProgress(): Promise<Record<string, TrackProgress>> {
  const out: Record<string, TrackProgress> = {}
  TRACKS.forEach(t => { out[t.id] = empty(t.id) })

  const user = await currentUser()
  if (!user) return out

  try {
    const sb = createClient()
    const { data, error } = await sb
      .from('roadmap_progress')
      .select('*')
      .eq('user_id', user.id)

    if (error || !data) return out
    data.forEach((row: any) => { out[row.track_id] = rowToProgress(row) })
    return out
  } catch (e) {
    console.error('getAllProgress error:', e)
    return out
  }
}

export async function getProgress(trackId: string): Promise<TrackProgress> {
  const user = await currentUser()
  if (!user) return empty(trackId)

  try {
    const sb = createClient()
    const { data } = await sb
      .from('roadmap_progress')
      .select('*')
      .eq('user_id', user.id)
      .eq('track_id', trackId)
      .maybeSingle()

    return data ? rowToProgress(data) : empty(trackId)
  } catch {
    return empty(trackId)
  }
}

/** The track the user was last working in — powers "Resume" on the dashboard. */
export async function getActiveTrack(): Promise<string | null> {
  const user = await currentUser()
  if (!user) return null
  try {
    const sb = createClient()
    const { data } = await sb
      .from('active_track')
      .select('track_id')
      .eq('user_id', user.id)
      .maybeSingle()
    return data?.track_id ?? null
  } catch {
    return null
  }
}

/** What the user should do next: the active track + its current lesson. */
export async function getResumePoint(): Promise<{ trackId: string; lessonId: number } | null> {
  const trackId = await getActiveTrack()
  if (!trackId || !getTrack(trackId)) return null
  const progress = await getProgress(trackId)
  return { trackId, lessonId: progress.currentLesson }
}

// ── WRITE ───────────────────────────────────────────────────────────────────

/**
 * Switch tracks. Creates a progress row on first visit, otherwise leaves the
 * existing place completely untouched — this is the Duolingo French/Spanish
 * behavior from the meeting.
 */
export async function setActiveTrack(trackId: string): Promise<void> {
  const user = await currentUser()
  if (!user || !getTrack(trackId)) return

  try {
    const sb = createClient()
    await sb.from('active_track').upsert({
      user_id: user.id,
      track_id: trackId,
      updated_at: new Date().toISOString(),
    })

    // Create the row only if this track has never been started.
    const { data: existing } = await sb
      .from('roadmap_progress')
      .select('track_id')
      .eq('user_id', user.id)
      .eq('track_id', trackId)
      .maybeSingle()

    if (!existing) {
      await sb.from('roadmap_progress').insert({
        user_id: user.id,
        track_id: trackId,
        current_lesson: 1,
        completed_lessons: [],
      })
    }
  } catch (e) {
    console.error('setActiveTrack error:', e)
  }
}

/**
 * Mark a lesson complete and advance. Idempotent — replaying a lesson does not
 * double-count it or push the user past where they should be.
 */
export async function completeLesson(trackId: string, lessonId: number): Promise<TrackProgress> {
  const user = await currentUser()
  if (!user) return empty(trackId)

  const current = await getProgress(trackId)
  const completed = current.completedLessons.includes(lessonId)
    ? current.completedLessons
    : [...current.completedLessons, lessonId].sort((a, b) => a - b)

  const total = trackLength(trackId)
  // Advance to the first lesson not yet finished, capped at the track length.
  let next = 1
  while (next <= total && completed.includes(next)) next++
  const currentLesson = Math.min(next, total)

  const updated: TrackProgress = {
    trackId,
    currentLesson,
    completedLessons: completed,
    lastLessonAt: new Date().toISOString(),
    startedAt: current.startedAt,
  }

  try {
    const sb = createClient()
    await sb.from('roadmap_progress').upsert({
      user_id: user.id,
      track_id: trackId,
      current_lesson: currentLesson,
      completed_lessons: completed,
      last_lesson_at: updated.lastLessonAt,
      updated_at: new Date().toISOString(),
    })
  } catch (e) {
    console.error('completeLesson error:', e)
  }

  return updated
}

/** Reset a single track without touching the others. */
export async function resetTrack(trackId: string): Promise<void> {
  const user = await currentUser()
  if (!user) return
  try {
    const sb = createClient()
    await sb.from('roadmap_progress').upsert({
      user_id: user.id,
      track_id: trackId,
      current_lesson: 1,
      completed_lessons: [],
      last_lesson_at: null,
      updated_at: new Date().toISOString(),
    })
  } catch (e) {
    console.error('resetTrack error:', e)
  }
}

// ── GUARDS ──────────────────────────────────────────────────────────────────

/** Server-of-record check so a user can't deep-link into a locked lesson. */
export async function canStartLesson(trackId: string, lessonId: number): Promise<boolean> {
  const track = getTrack(trackId)
  if (!track) return false
  if (!track.lessons.some(l => l.id === lessonId)) return false
  const progress = await getProgress(trackId)
  return isLessonUnlocked(lessonId, progress.completedLessons)
}

// ── HANDOFF TO THE CELEBRATION SCREEN ───────────────────────────────────────
// /correct clears the pending session when it saves, but /levelup still needs
// to know which lesson just finished. Kept in sessionStorage so it dies with
// the tab and can never be mistaken for durable progress.

const LAST_LESSON_KEY = 'vocalis_last_lesson'

export function setLastLesson(v: { trackId: string; lessonId: number }): void {
  if (typeof window === 'undefined') return
  try { sessionStorage.setItem(LAST_LESSON_KEY, JSON.stringify(v)) } catch {}
}

export function getLastLesson(): { trackId: string; lessonId: number } | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(LAST_LESSON_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

export function clearLastLesson(): void {
  if (typeof window === 'undefined') return
  try { sessionStorage.removeItem(LAST_LESSON_KEY) } catch {}
}

// ── SESSION LINKING ─────────────────────────────────────────────────────────

/**
 * Stamp the most recent session with the lesson that produced it.
 * Call right after saveSession() so the session history shows lesson context.
 */
export async function tagLatestSession(trackId: string, lessonId: number): Promise<void> {
  const user = await currentUser()
  if (!user) return
  try {
    const sb = createClient()
    const { data } = await sb
      .from('sessions')
      .select('id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (data?.id) {
      await sb.from('sessions')
        .update({ track_id: trackId, lesson_id: lessonId })
        .eq('id', data.id)
        .eq('user_id', user.id)
    }
  } catch (e) {
    console.error('tagLatestSession error:', e)
  }
}

/** Sessions recorded for one track, newest first. */
export async function getTrackSessions(trackId: string) {
  const user = await currentUser()
  if (!user) return []
  try {
    const sb = createClient()
    const { data } = await sb
      .from('sessions')
      .select('*')
      .eq('user_id', user.id)
      .eq('track_id', trackId)
      .order('created_at', { ascending: false })
    return data ?? []
  } catch {
    return []
  }
}

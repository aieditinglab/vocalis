'use client'
// ── ADMIN ANALYTICS (READ SIDE) ─────────────────────────────────────────────
// Thin typed wrappers over the admin_* Postgres functions. Every one of those
// is SECURITY DEFINER and self-gates on is_admin(), so a non-admin calling
// these gets a database error rather than data — the gate is server-side, not
// the client-side email check the admin page used to rely on alone.

import { createClient } from './supabase'

export interface Overview {
  as_of: string
  total_users: number
  total_recordings: number
  total_minutes: number
  dau: number; wau: number; mau: number
  stickiness: number | null
  wau_mau: number | null
  app_session_avg_s: number | null
  app_session_median_s: number | null
  app_session_n: number
  lesson_avg_s: number | null
  lesson_n: number
  recordings_per_user_week: number | null
  signups_7d: number
  signups_30d: number
  events_total: number
}

export interface DailyRow {
  day: string; active: number; new: number
  returning: number; signups: number; recordings: number
}

export interface Growth {
  churned_14d: number; at_risk_7d: number; active_7d: number
  never_active: number; reactivated_30d: number
  signups_by_week: { week: string; signups: number }[]
}

export interface Activation {
  total_users: number
  completed_lesson1: number
  lesson1_rate: number | null
  recorded_once: number
  recorded_rate: number | null
  signup_to_first_rec_avg_h: number | null
  signup_to_first_rec_med_h: number | null
  signup_to_first_rec_n: number
  funnel: { step: string; users: number }[]
}

export interface Retention {
  eligible: number
  d1: number; d7: number; d30: number
  d1_rate: number | null; d7_rate: number | null; d30_rate: number | null
  cohorts: { cohort: string; size: number; d1: number; d7: number; d30: number }[]
  avg_lessons_before_churn: number | null
  churned_with_progress: number
}

export interface Engagement {
  tracks: { track_id: string; users_started: number; lessons_done: number; avg_lessons: number }[]
  active_track_split: { track_id: string; users: number }[]
  stop_map: { track_id: string; lesson: number; completed: number; sitting: number }[]
  lessons_per_user_week: number | null
  lesson_reps_28d: number
  custom_reps_28d: number
}

export interface Research {
  curve: { rep: number; avg_score: number; n: number }[]
  improved_users: number
  declined_users: number
  measurable_users: number
  avg_delta: number | null
  beat_misses: { beat: string; seen: number; missed: number; miss_rate: number | null }[]
  prep_split: { skipped: boolean; n: number; avg_score: number; avg_duration: number }[]
  prep_corr: number | null
  prep_n: number
  beat_n: number
}

export interface AdminUser {
  id: string; email: string; name: string
  is_admin: boolean; joined: string; last_seen: string | null
  recordings: number; minutes: number; avg_score: number | null
  lessons_done: number; tracks_started: number
}

async function rpc<T>(fn: string, args: Record<string, unknown> = {}): Promise<T | null> {
  try {
    const { data, error } = await createClient().rpc(fn, args)
    if (error) { console.error(`${fn}:`, error.message); return null }
    return data as T
  } catch (e) {
    console.error(`${fn} threw:`, e)
    return null
  }
}

/**
 * One round trip per panel, fired together. A null field means that call
 * failed — the UI shows it as unavailable rather than rendering a zero, so a
 * broken query can never be mistaken for "no activity".
 */
export async function loadAdminAnalytics(days = 30) {
  const [overview, daily, growth, activation, retention, engagement, research, users] =
    await Promise.all([
      rpc<Overview>('admin_overview'),
      rpc<DailyRow[]>('admin_daily', { p_days: days }),
      rpc<Growth>('admin_growth'),
      rpc<Activation>('admin_activation'),
      rpc<Retention>('admin_retention'),
      rpc<Engagement>('admin_engagement'),
      rpc<Research>('admin_research'),
      rpc<AdminUser[]>('admin_users'),
    ])
  return { overview, daily, growth, activation, retention, engagement, research, users }
}

export type AdminAnalytics = Awaited<ReturnType<typeof loadAdminAnalytics>>

// ── FORMATTERS ──────────────────────────────────────────────────────────────

/** Renders null as an em dash so "no data" never reads as a real zero. */
export function fmtNum(v: number | null | undefined, suffix = ''): string {
  if (v === null || v === undefined) return '—'
  return `${v}${suffix}`
}

export function fmtDuration(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined) return '—'
  if (seconds < 60) return `${Math.round(seconds)}s`
  const m = Math.floor(seconds / 60)
  const s = Math.round(seconds % 60)
  return s ? `${m}m ${s}s` : `${m}m`
}

export function fmtHours(h: number | null | undefined): string {
  if (h === null || h === undefined) return '—'
  if (h < 1) return `${Math.round(h * 60)} min`
  if (h < 48) return `${h.toFixed(1)} hr`
  return `${(h / 24).toFixed(1)} days`
}

export function fmtDate(d: string | null | undefined): string {
  if (!d) return 'never'
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })
}

export function daysAgo(d: string | null | undefined): number | null {
  if (!d) return null
  return Math.floor((Date.now() - new Date(d).getTime()) / 86_400_000)
}

export const TRACK_LABELS: Record<string, string> = {
  'presentations':      'Presentations',
  'job-interviews':     'Job Interviews',
  'college-interviews': 'College Interviews',
}

export function trackLabel(id: string): string {
  return TRACK_LABELS[id] ?? id
}

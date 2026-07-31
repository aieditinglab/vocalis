'use client'
// ── ADMIN ANALYTICS DASHBOARD ───────────────────────────────────────────────
// Every number here comes from a SECURITY DEFINER admin_* function that gates
// on is_admin(); the browser receives aggregates, never raw user rows.
//
// Honesty rule this file follows: a metric with no samples renders as "—" with
// a COLLECTING badge, never as 0. Event-based metrics (time on app, funnel)
// only have data from the day instrumentation shipped, and saying so is more
// useful than showing a confident zero.
import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Nav from '@/components/Nav'
import { getIsAdmin, getFeatureFlags, toggleFeatureFlag, type FeatureFlag } from '@/lib/admin'
import {
  loadAdminAnalytics, fmtNum, fmtDuration, fmtHours, fmtDate, daysAgo, trackLabel,
  type AdminAnalytics,
} from '@/lib/adminAnalytics'

type Tab = 'overview' | 'growth' | 'retention' | 'curriculum' | 'research' | 'users' | 'flags'

const TABS: { id: Tab; label: string }[] = [
  { id: 'overview',   label: 'Overview' },
  { id: 'growth',     label: 'Growth' },
  { id: 'retention',  label: 'Retention' },
  { id: 'curriculum', label: 'Curriculum' },
  { id: 'research',   label: 'Research' },
  { id: 'users',      label: 'Users' },
  { id: 'flags',      label: 'Flags' },
]

// ── PRIMITIVES ──────────────────────────────────────────────────────────────

function Stat({ label, value, sub, color, collecting, hint }: {
  label: string; value: string; sub?: string
  color?: string; collecting?: boolean; hint?: string
}) {
  return (
    <div className="metric-card" style={{ padding: '20px', animation: 'none' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '10px' }}>
        <span style={{ fontSize: '10.5px', fontWeight: 700, letterSpacing: '.08em', color: 'var(--text-muted)' }}>
          {label.toUpperCase()}
        </span>
        {collecting && (
          <span title="Instrumentation is live but hasn't gathered samples yet"
            style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '.06em', padding: '2px 6px',
              borderRadius: '6px', color: 'var(--amber)', background: 'rgba(255,184,0,.12)',
              border: '1px solid rgba(255,184,0,.25)', flexShrink: 0 }}>
            COLLECTING
          </span>
        )}
      </div>
      <div className="font-display" style={{ fontSize: 'clamp(24px,3.4vw,34px)', fontWeight: 900,
        letterSpacing: '-.03em', color: color || 'var(--text-primary)', lineHeight: 1.05 }}>
        {value}
      </div>
      {sub && <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '7px', lineHeight: 1.5 }}>{sub}</p>}
      {hint && <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px', opacity: .7, lineHeight: 1.5 }}>{hint}</p>}
    </div>
  )
}

function Section({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <div className="dash-card" style={{ marginBottom: '18px' }}>
      <h2 style={{ fontSize: '15px', fontWeight: 700, marginBottom: note ? '5px' : '18px' }}>{title}</h2>
      {note && <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginBottom: '18px', lineHeight: 1.6 }}>{note}</p>}
      {children}
    </div>
  )
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: '13px', color: 'var(--text-muted)', padding: '18px 0', lineHeight: 1.65 }}>
      {children}
    </p>
  )
}

/** Vertical column chart. Two stacked series so new vs returning reads at a glance. */
function DayChart({ rows }: { rows: { day: string; new: number; returning: number; signups: number }[] }) {
  const max = Math.max(1, ...rows.map(r => r.new + r.returning))
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', height: '110px', marginBottom: '10px' }}>
        {rows.map(r => {
          const total = r.new + r.returning
          return (
            <div key={r.day} style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
              height: '100%', minWidth: 0 }}
              title={`${r.day}\nreturning: ${r.returning}\nnew: ${r.new}\nsignups: ${r.signups}`}>
              {total === 0
                ? <div style={{ height: '2px', background: 'var(--border-light)', borderRadius: '2px' }} />
                : <>
                    <div style={{ height: `${(r.new / max) * 100}%`, background: 'var(--accent)',
                      borderRadius: '3px 3px 0 0', minHeight: r.new ? '3px' : 0 }} />
                    <div style={{ height: `${(r.returning / max) * 100}%`, background: 'var(--blue)',
                      borderRadius: r.new ? 0 : '3px 3px 0 0', minHeight: r.returning ? '3px' : 0 }} />
                  </>}
            </div>
          )
        })}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', color: 'var(--text-muted)' }}>
        <span>{rows[0]?.day}</span>
        <span style={{ display: 'flex', gap: '14px' }}>
          <span><span style={{ color: 'var(--accent)' }}>■</span> new</span>
          <span><span style={{ color: 'var(--blue)' }}>■</span> returning</span>
        </span>
        <span>{rows[rows.length - 1]?.day}</span>
      </div>
    </div>
  )
}

/** Horizontal bar rows — used for distributions and rankings. */
function BarRow({ label, value, max, caption, color }: {
  label: string; value: number; max: number; caption?: string; color?: string
}) {
  return (
    <div style={{ marginBottom: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
        gap: '10px', marginBottom: '6px' }}>
        <span style={{ fontSize: '13px', fontWeight: 600 }}>{label}</span>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)', flexShrink: 0 }}>
          {caption ?? value}
        </span>
      </div>
      <div className="prog-track">
        <div className="prog-fill" style={{
          width: `${max > 0 ? Math.max((value / max) * 100, value > 0 ? 2 : 0) : 0}%`,
          background: color || 'var(--accent)', transition: 'width .8s',
        }} />
      </div>
    </div>
  )
}

// ── PAGE ────────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [data, setData]       = useState<AdminAnalytics | null>(null)
  const [flags, setFlags]     = useState<FeatureFlag[]>([])
  const [tab, setTab]         = useState<Tab>('overview')
  const [days, setDays]       = useState(30)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [toggling, setToggling] = useState<string | null>(null)
  const [msg, setMsg]         = useState('')

  const load = async (d = days) => {
    const [analytics, flagData] = await Promise.all([loadAdminAnalytics(d), getFeatureFlags()])
    setData(analytics)
    setFlags(flagData)
  }

  useEffect(() => {
    const boot = async () => {
      const admin = await getIsAdmin()
      setIsAdmin(admin)
      if (admin) await load(30)
      setLoading(false)
    }
    boot()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const refresh = async () => {
    setRefreshing(true)
    await load()
    setRefreshing(false)
    setMsg('Refreshed')
    setTimeout(() => setMsg(''), 1600)
  }

  const changeRange = async (d: number) => {
    setDays(d); setRefreshing(true)
    await load(d)
    setRefreshing(false)
  }

  const handleToggle = async (flag: FeatureFlag) => {
    setToggling(flag.id)
    const ok = await toggleFeatureFlag(flag.id, !flag.enabled)
    if (ok) {
      // Re-read rather than trusting local state: the UPDATE silently affects
      // zero rows if RLS rejects it, which is exactly how this used to "work".
      const fresh = await getFeatureFlags()
      setFlags(fresh)
      const now = fresh.find(f => f.id === flag.id)
      setMsg(now?.enabled === !flag.enabled
        ? `${flag.label} ${!flag.enabled ? 'enabled' : 'disabled'}`
        : `${flag.label} did not change — permission denied`)
      setTimeout(() => setMsg(''), 2600)
    }
    setToggling(null)
  }

  const o = data?.overview
  const eventsLive = (o?.events_total ?? 0) > 0

  const stopMapByTrack = useMemo(() => {
    const map: Record<string, { lesson: number; completed: number; sitting: number }[]> = {}
    data?.engagement?.stop_map?.forEach(r => {
      ;(map[r.track_id] ||= []).push({ lesson: r.lesson, completed: r.completed, sitting: r.sitting })
    })
    return map
  }, [data])

  // ── Gates ────────────────────────────────────────────────────────────────

  if (loading) return (
    <>
      <Nav showApp />
      <div className="container" style={{ textAlign: 'center', paddingTop: '80px' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚙️</div>
        <p className="text-muted">Loading analytics…</p>
      </div>
    </>
  )

  if (!isAdmin) return (
    <>
      <Nav showApp />
      <div className="container" style={{ textAlign: 'center', paddingTop: '80px' }}>
        <div style={{ fontSize: '64px', marginBottom: '16px' }}>🚫</div>
        <h1 style={{ fontSize: '28px', fontWeight: 900, marginBottom: '12px' }}>Access Denied</h1>
        <p className="text-muted" style={{ marginBottom: '24px' }}>This page is restricted to administrators.</p>
        <button className="btn btn-primary" onClick={() => router.push('/dashboard')}>Go to Dashboard</button>
      </div>
    </>
  )

  return (
    <>
      <Nav showApp />
      <div className="container-lg" style={{ paddingBottom: '60px' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
          gap: '16px', flexWrap: 'wrap', marginBottom: '22px' }}>
          <div>
            <p className="eyebrow" style={{ marginBottom: '10px' }}>ADMIN ONLY</p>
            <h1 className="font-display" style={{ fontSize: 'clamp(26px,4.5vw,42px)', fontWeight: 900,
              letterSpacing: '-.04em', marginBottom: '6px' }}>
              Analytics
            </h1>
            <p className="text-muted" style={{ fontSize: '13.5px' }}>
              {o ? `${o.total_users} users · ${o.total_recordings} recordings · as of ${o.as_of}` : 'No data loaded'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {[7, 30, 90].map(d => (
              <button key={d} onClick={() => changeRange(d)} disabled={refreshing}
                style={{ padding: '7px 13px', borderRadius: '100px', fontSize: '12.5px', fontWeight: 600,
                  cursor: refreshing ? 'wait' : 'pointer', fontFamily: 'inherit',
                  border: `1px solid ${days === d ? 'var(--accent)' : 'var(--border-light)'}`,
                  background: days === d ? 'rgba(170,255,0,.1)' : 'transparent',
                  color: days === d ? 'var(--accent)' : 'var(--text-muted)' }}>
                {d}d
              </button>
            ))}
            <button className="btn btn-outline btn-sm" onClick={refresh} disabled={refreshing}
              style={{ padding: '8px 14px', fontSize: '12.5px' }}>
              {refreshing ? '…' : '↻ Refresh'}
            </button>
          </div>
        </div>

        {msg && (
          <div style={{ background: 'rgba(170,255,0,.08)', border: '1px solid rgba(170,255,0,.2)',
            borderRadius: '12px', padding: '11px 18px', marginBottom: '16px', fontSize: '13.5px',
            fontWeight: 600, color: 'var(--accent)' }}>
            {msg}
          </div>
        )}

        {/* Instrumentation notice — event metrics only have data from launch day. */}
        {!eventsLive && (
          <div style={{ background: 'rgba(255,184,0,.06)', border: '1px solid rgba(255,184,0,.22)',
            borderRadius: '14px', padding: '15px 20px', marginBottom: '20px', display: 'flex', gap: '12px' }}>
            <span style={{ fontSize: '18px', flexShrink: 0 }}>⏳</span>
            <div>
              <p style={{ fontSize: '13.5px', fontWeight: 700, marginBottom: '5px' }}>
                Event tracking is live but hasn&apos;t recorded anything yet
              </p>
              <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', lineHeight: 1.65 }}>
                Time-on-app, the step-by-step funnel, and prep/beat research all read from events that
                started being collected today. Anything marked COLLECTING will fill in as people use the
                app — those aren&apos;t zeros, they&apos;re empty samples. Counts built from recordings,
                signups and roadmap progress are complete and accurate right now.
              </p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', marginBottom: '22px', paddingBottom: '4px' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ padding: '9px 16px', borderRadius: '100px', cursor: 'pointer',
                fontFamily: 'inherit', fontWeight: 600, fontSize: '13.5px', whiteSpace: 'nowrap',
                background: tab === t.id ? 'var(--accent)' : 'var(--card)',
                color: tab === t.id ? '#000' : 'var(--text-muted)',
                border: `1px solid ${tab === t.id ? 'var(--accent)' : 'var(--border)'}` }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW ─────────────────────────────────────────────────────── */}
        {tab === 'overview' && (
          <>
            <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '.1em',
              color: 'var(--text-muted)', marginBottom: '12px' }}>USER VOLUME</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))',
              gap: '12px', marginBottom: '24px' }}>
              <Stat label="DAU" value={fmtNum(o?.dau)} sub="active today" color="var(--accent)" />
              <Stat label="WAU" value={fmtNum(o?.wau)} sub="last 7 days" color="var(--blue)" />
              <Stat label="MAU" value={fmtNum(o?.mau)} sub="last 30 days" />
              <Stat label="Stickiness" value={o?.stickiness != null ? `${o.stickiness}%` : '—'}
                sub="DAU ÷ MAU" hint="20%+ means habitual use"
                color={(o?.stickiness ?? 0) >= 20 ? 'var(--accent)' : 'var(--amber)'} />
              <Stat label="WAU / MAU" value={o?.wau_mau != null ? `${o.wau_mau}%` : '—'}
                sub="weekly of monthly" />
            </div>

            <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '.1em',
              color: 'var(--text-muted)', marginBottom: '12px' }}>SESSION &amp; TIME</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))',
              gap: '12px', marginBottom: '24px' }}>
              <Stat label="Avg session" value={fmtDuration(o?.app_session_avg_s)}
                sub={o?.app_session_n ? `${o.app_session_n} visits measured` : 'no visits measured yet'}
                collecting={!o?.app_session_n}
                hint="First to last event in a visit" />
              <Stat label="Median session" value={fmtDuration(o?.app_session_median_s)}
                sub="less skewed by outliers" collecting={!o?.app_session_n} />
              <Stat label="Avg time / lesson" value={fmtDuration(o?.lesson_avg_s)}
                sub={o?.lesson_n ? `${o.lesson_n} lessons measured` : 'no lessons measured yet'}
                collecting={!o?.lesson_n}
                hint="Brief open → session saved" />
              <Stat label="Reps / user / week" value={fmtNum(o?.recordings_per_user_week)}
                sub="trailing 4 weeks" />
              <Stat label="Total practice" value={o ? `${o.total_minutes}m` : '—'}
                sub={`${fmtNum(o?.total_recordings)} recordings`} />
            </div>

            <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '.1em',
              color: 'var(--text-muted)', marginBottom: '12px' }}>ACTIVATION</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))',
              gap: '12px', marginBottom: '24px' }}>
              <Stat label="Completed lesson 1"
                value={data?.activation?.lesson1_rate != null ? `${data.activation.lesson1_rate}%` : '—'}
                sub={`${fmtNum(data?.activation?.completed_lesson1)} of ${fmtNum(data?.activation?.total_users)} users`}
                color="var(--accent)" hint="Your first value moment" />
              <Stat label="Recorded at least once"
                value={data?.activation?.recorded_rate != null ? `${data.activation.recorded_rate}%` : '—'}
                sub={`${fmtNum(data?.activation?.recorded_once)} users`} />
              <Stat label="Signup → first rep"
                value={fmtHours(data?.activation?.signup_to_first_rec_med_h)}
                sub={`median of ${fmtNum(data?.activation?.signup_to_first_rec_n)}`}
                hint={`mean ${fmtHours(data?.activation?.signup_to_first_rec_avg_h)}`} />
            </div>

            <Section title="New vs returning, by day"
              note="Green is someone active on their signup day; blue is someone coming back.">
              {data?.daily?.length
                ? <DayChart rows={data.daily} />
                : <Empty>No daily data.</Empty>}
            </Section>

            <Section title="The 5-step flow"
              note="Where people fall out between starting a lesson and saving the rep.">
              {data?.activation?.funnel?.some(f => f.users > 0)
                ? (() => {
                    const top = data.activation!.funnel[0]?.users || 1
                    return data.activation!.funnel.map(f => (
                      <BarRow key={f.step} label={f.step.replace(/_/g, ' ')} value={f.users} max={top}
                        caption={`${f.users} · ${Math.round((f.users / top) * 100)}%`} />
                    ))
                  })()
                : <Empty>
                    No funnel data yet — these steps are recorded from the moment someone starts a
                    lesson, so the first completed run will populate this.
                  </Empty>}
            </Section>
          </>
        )}

        {/* ── GROWTH ───────────────────────────────────────────────────────── */}
        {tab === 'growth' && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))',
              gap: '12px', marginBottom: '20px' }}>
              <Stat label="Signups 7d"  value={fmtNum(o?.signups_7d)} color="var(--accent)" />
              <Stat label="Signups 30d" value={fmtNum(o?.signups_30d)} />
              <Stat label="Active (7d)" value={fmtNum(data?.growth?.active_7d)} color="var(--accent)" />
              <Stat label="At risk" value={fmtNum(data?.growth?.at_risk_7d)}
                sub="idle 7–14 days" color="var(--amber)" />
              <Stat label="Churned" value={fmtNum(data?.growth?.churned_14d)}
                sub="idle 14+ days" color="var(--hot)" />
              <Stat label="Reactivated" value={fmtNum(data?.growth?.reactivated_30d)}
                sub="came back after 14+ idle" color="var(--blue)" />
              <Stat label="Never active" value={fmtNum(data?.growth?.never_active)}
                sub="signed up, never used" color="var(--hot)"
                hint="Signup works, onboarding doesn't" />
            </div>

            <Section title="Signups per week" note="Last 12 weeks.">
              {data?.growth?.signups_by_week?.length
                ? (() => {
                    const max = Math.max(1, ...data.growth!.signups_by_week.map(w => w.signups))
                    return data.growth!.signups_by_week.map(w => (
                      <BarRow key={w.week} label={w.week} value={w.signups} max={max} />
                    ))
                  })()
                : <Empty>No signup history.</Empty>}
            </Section>

            <Section title="Signups per day" note={`Last ${days} days.`}>
              {data?.daily?.some(d => d.signups > 0)
                ? (() => {
                    const max = Math.max(1, ...data.daily!.map(d => d.signups))
                    return data.daily!.filter(d => d.signups > 0).map(d => (
                      <BarRow key={d.day} label={d.day} value={d.signups} max={max} />
                    ))
                  })()
                : <Empty>No signups in the last {days} days.</Empty>}
            </Section>
          </>
        )}

        {/* ── RETENTION ────────────────────────────────────────────────────── */}
        {tab === 'retention' && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))',
              gap: '12px', marginBottom: '20px' }}>
              <Stat label="Day 1 return"
                value={data?.retention?.d1_rate != null ? `${data.retention.d1_rate}%` : '—'}
                sub={`${fmtNum(data?.retention?.d1)} of ${fmtNum(data?.retention?.eligible)}`}
                color="var(--accent)" hint="Came back the next day" />
              <Stat label="Day 7 return"
                value={data?.retention?.d7_rate != null ? `${data.retention.d7_rate}%` : '—'}
                sub={`${fmtNum(data?.retention?.d7)} users`} color="var(--blue)"
                hint="Came back within a week" />
              <Stat label="Day 30 return"
                value={data?.retention?.d30_rate != null ? `${data.retention.d30_rate}%` : '—'}
                sub={`${fmtNum(data?.retention?.d30)} users`} />
              <Stat label="Lessons before churn"
                value={fmtNum(data?.retention?.avg_lessons_before_churn)}
                sub={`${fmtNum(data?.retention?.churned_with_progress)} churned with progress`}
                color="var(--amber)" hint="How far they got before stopping" />
            </div>

            <Section title="Cohorts by signup week"
              note="Each row is everyone who joined that week, and how many ever came back.">
              {data?.retention?.cohorts?.length ? (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', minWidth: '420px' }}>
                    <thead>
                      <tr style={{ color: 'var(--text-muted)', fontSize: '11px', letterSpacing: '.06em' }}>
                        {['WEEK', 'SIZE', 'D1', 'D7', 'D30'].map(h => (
                          <th key={h} style={{ textAlign: h === 'WEEK' ? 'left' : 'right',
                            padding: '8px 10px', borderBottom: '1px solid var(--border)', fontWeight: 700 }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {data.retention.cohorts.map(c => (
                        <tr key={c.cohort}>
                          <td style={{ padding: '9px 10px', borderBottom: '1px solid var(--border)', fontWeight: 600 }}>{c.cohort}</td>
                          <td style={{ padding: '9px 10px', borderBottom: '1px solid var(--border)', textAlign: 'right' }}>{c.size}</td>
                          {[c.d1, c.d7, c.d30].map((v, i) => (
                            <td key={i} style={{ padding: '9px 10px', borderBottom: '1px solid var(--border)',
                              textAlign: 'right', color: v > 0 ? 'var(--accent)' : 'var(--text-muted)' }}>
                              {v}{c.size > 0 && <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
                                {' '}({Math.round((v / c.size) * 100)}%)</span>}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : <Empty>No cohorts yet.</Empty>}
            </Section>
          </>
        )}

        {/* ── CURRICULUM ───────────────────────────────────────────────────── */}
        {tab === 'curriculum' && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))',
              gap: '12px', marginBottom: '20px' }}>
              <Stat label="Lessons / user / week" value={fmtNum(data?.engagement?.lessons_per_user_week)}
                sub="trailing 4 weeks" color="var(--accent)" />
              <Stat label="Lesson reps (28d)" value={fmtNum(data?.engagement?.lesson_reps_28d)} />
              <Stat label="Custom reps (28d)" value={fmtNum(data?.engagement?.custom_reps_28d)}
                sub="own-topic practice" hint="High vs lessons = roadmap being skipped" />
            </div>

            <Section title="Which track are users picking?"
              note="Users who have started each track, and how far they get on average.">
              {data?.engagement?.tracks?.length
                ? (() => {
                    const max = Math.max(1, ...data.engagement!.tracks.map(t => t.users_started))
                    return data.engagement!.tracks.map(t => (
                      <BarRow key={t.track_id} label={trackLabel(t.track_id)} value={t.users_started} max={max}
                        caption={`${t.users_started} users · ${t.avg_lessons} avg lessons`} />
                    ))
                  })()
                : <Empty>Nobody has started a track yet.</Empty>}
            </Section>

            <Section title="Where do people stop?"
              note="Per lesson: how many finished it (green) versus how many are parked on it right now (amber). A lesson with people stacked up and few completions is where the curriculum breaks.">
              {Object.keys(stopMapByTrack).length ? Object.entries(stopMapByTrack).map(([tid, rows]) => {
                const max = Math.max(1, ...rows.map(r => Math.max(r.completed, r.sitting)))
                return (
                  <div key={tid} style={{ marginBottom: '22px' }}>
                    <p style={{ fontSize: '12.5px', fontWeight: 700, marginBottom: '12px' }}>{trackLabel(tid)}</p>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: '80px' }}>
                      {rows.map(r => (
                        <div key={r.lesson} style={{ flex: 1, display: 'flex', flexDirection: 'column',
                          justifyContent: 'flex-end', height: '100%', gap: '2px' }}
                          title={`Lesson ${r.lesson}: ${r.completed} completed, ${r.sitting} sitting here`}>
                          <div style={{ height: `${(r.completed / max) * 60}%`, background: 'var(--accent)',
                            borderRadius: '2px', minHeight: r.completed ? '3px' : 0 }} />
                          <div style={{ height: `${(r.sitting / max) * 40}%`, background: 'var(--amber)',
                            borderRadius: '2px', minHeight: r.sitting ? '3px' : 0 }} />
                          <span style={{ fontSize: '9px', color: 'var(--text-muted)', textAlign: 'center' }}>{r.lesson}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              }) : <Empty>No lesson progress recorded yet.</Empty>}
            </Section>
          </>
        )}

        {/* ── RESEARCH ─────────────────────────────────────────────────────── */}
        {tab === 'research' && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))',
              gap: '12px', marginBottom: '20px' }}>
              <Stat label="Users improving" value={fmtNum(data?.research?.improved_users)}
                sub={`of ${fmtNum(data?.research?.measurable_users)} with enough reps`}
                color="var(--accent)" hint="Second half scored above first half" />
              <Stat label="Users declining" value={fmtNum(data?.research?.declined_users)} color="var(--hot)" />
              <Stat label="Avg score change" value={data?.research?.avg_delta != null
                  ? `${data.research.avg_delta > 0 ? '+' : ''}${data.research.avg_delta}` : '—'}
                sub="first half → second half"
                color={(data?.research?.avg_delta ?? 0) >= 0 ? 'var(--accent)' : 'var(--hot)'} />
              <Stat label="Prep ↔ score" value={data?.research?.prep_corr != null
                  ? data.research.prep_corr.toFixed(2) : '—'}
                sub={`r over ${fmtNum(data?.research?.prep_n)} reps`}
                collecting={!data?.research?.prep_n}
                hint="+1 means more think time tracks with better scores" />
            </div>

            <Section title="Does score improve with reps?"
              note="Average score at each attempt number, pooled across users. Small samples at the tail — check n before reading a trend into it.">
              {data?.research?.curve?.length
                ? (() => {
                    const max = Math.max(1, ...data.research!.curve.map(c => c.avg_score))
                    return data.research!.curve.map(c => (
                      <BarRow key={c.rep} label={`Rep ${c.rep}`} value={c.avg_score} max={max}
                        caption={`${c.avg_score} avg · n=${c.n}`}
                        color={c.n < 3 ? 'var(--border-light)' : 'var(--accent)'} />
                    ))
                  })()
                : <Empty>No recordings yet.</Empty>}
            </Section>

            <Section title="Do prep-skippers score worse?"
              note="Comparing reps where think time ran out against reps where the user skipped it.">
              {data?.research?.prep_split?.length ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: '12px' }}>
                  {data.research.prep_split.map(p => (
                    <div key={String(p.skipped)} style={{ padding: '16px', borderRadius: '14px',
                      background: p.skipped ? 'rgba(255,48,84,.05)' : 'rgba(170,255,0,.05)',
                      border: `1px solid ${p.skipped ? 'rgba(255,48,84,.2)' : 'rgba(170,255,0,.2)'}` }}>
                      <p style={{ fontSize: '12px', fontWeight: 700, marginBottom: '8px',
                        color: p.skipped ? 'var(--hot)' : 'var(--accent)' }}>
                        {p.skipped ? 'SKIPPED PREP' : 'USED FULL PREP'}
                      </p>
                      <p className="font-display" style={{ fontSize: '30px', fontWeight: 900 }}>{p.avg_score}</p>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '5px' }}>
                        avg score · {p.n} reps · {p.avg_duration}s avg
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <Empty>
                  No prep data yet. Every lesson rep from now on records whether think time was used
                  or skipped, so this fills in with the next completed lessons.
                </Empty>
              )}
            </Section>

            <Section title="Which beats do users miss?"
              note="Across all lesson reps, how often each given point went uncovered. A beat missed by most users is a beat the lesson isn't teaching clearly.">
              {data?.research?.beat_misses?.length
                ? (() => {
                    const max = Math.max(1, ...data.research!.beat_misses.map(b => b.seen))
                    return data.research!.beat_misses.slice(0, 20).map(b => (
                      <BarRow key={b.beat} label={b.beat} value={b.missed} max={max}
                        caption={`missed ${b.missed}/${b.seen}${b.miss_rate != null ? ` · ${b.miss_rate}%` : ''}`}
                        color={(b.miss_rate ?? 0) > 50 ? 'var(--hot)' : 'var(--amber)'} />
                    ))
                  })()
                : (
                  <Empty>
                    No beat data yet. The per-beat check is produced by the AI coach, so this needs
                    lesson reps completed with the Gemini key configured — the rule-based fallback
                    doesn&apos;t generate it.
                  </Empty>
                )}
            </Section>
          </>
        )}

        {/* ── USERS ────────────────────────────────────────────────────────── */}
        {tab === 'users' && (
          <Section title={`All users (${data?.users?.length ?? 0})`}
            note="Sorted by most recently active.">
            {data?.users?.length ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {data.users.map(u => {
                  const idle = daysAgo(u.last_seen)
                  const state = idle === null ? 'never'
                    : idle >= 14 ? 'churned' : idle >= 7 ? 'at risk' : 'active'
                  const stateColor = state === 'active' ? 'var(--accent)'
                    : state === 'at risk' ? 'var(--amber)' : 'var(--hot)'
                  return (
                    <div key={u.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '13px 16px', borderRadius: '13px', gap: '14px', flexWrap: 'wrap',
                      background: u.is_admin ? 'rgba(170,255,0,.04)' : 'var(--card2)',
                      border: `1px solid ${u.is_admin ? 'rgba(170,255,0,.18)' : 'var(--border)'}` }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: 1 }}>
                        <div style={{ width: '34px', height: '34px', borderRadius: '50%', flexShrink: 0,
                          background: u.is_admin ? 'var(--accent)' : 'var(--card)',
                          border: '1px solid var(--border)', display: 'flex', alignItems: 'center',
                          justifyContent: 'center', fontSize: '13px', fontWeight: 700,
                          color: u.is_admin ? '#000' : 'var(--text-muted)' }}>
                          {(u.name || u.email || '?').charAt(0).toUpperCase()}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: '13.5px', display: 'flex',
                            alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                            {u.name || 'No name'}
                            {u.is_admin && <span style={{ fontSize: '9px', color: 'var(--accent)',
                              background: 'rgba(170,255,0,.12)', padding: '1px 6px', borderRadius: '5px',
                              fontWeight: 700 }}>ADMIN</span>}
                            <span style={{ fontSize: '9px', color: stateColor, fontWeight: 700,
                              padding: '1px 6px', borderRadius: '5px', background: 'var(--card)',
                              border: `1px solid ${stateColor}33` }}>
                              {state.toUpperCase()}
                            </span>
                          </div>
                          <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', overflow: 'hidden',
                            textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {u.email} · joined {fmtDate(u.joined)}
                            {idle !== null && ` · seen ${idle}d ago`}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '18px', flexShrink: 0 }}>
                        {[
                          { k: 'REPS', v: u.recordings },
                          { k: 'MINS', v: u.minutes },
                          { k: 'LESSONS', v: u.lessons_done },
                          { k: 'AVG', v: u.avg_score ?? '—' },
                        ].map(m => (
                          <div key={m.k} style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '8.5px', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '2px' }}>{m.k}</div>
                            <div style={{ fontSize: '13.5px', fontWeight: 700 }}>{m.v}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : <Empty>No users found.</Empty>}
          </Section>
        )}

        {/* ── FLAGS ────────────────────────────────────────────────────────── */}
        {tab === 'flags' && (
          <Section title="Feature flags" note="Toggle to enable or disable features for all users instantly.">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '11px' }}>
              {flags.length === 0 && <Empty>No feature flags defined.</Empty>}
              {flags.map(flag => (
                <div key={flag.id} style={{ display: 'flex', alignItems: 'center',
                  justifyContent: 'space-between', padding: '15px 19px', borderRadius: '14px', gap: '16px',
                  background: flag.enabled ? 'rgba(170,255,0,.04)' : 'rgba(255,48,84,.04)',
                  border: `1px solid ${flag.enabled ? 'rgba(170,255,0,.15)' : 'rgba(255,48,84,.15)'}` }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 700, fontSize: '14.5px' }}>{flag.label}</span>
                      <span style={{ fontSize: '9.5px', fontWeight: 700, letterSpacing: '.06em',
                        padding: '2px 8px', borderRadius: '100px',
                        color: flag.enabled ? 'var(--accent)' : 'var(--hot)',
                        background: flag.enabled ? 'rgba(170,255,0,.12)' : 'rgba(255,48,84,.12)' }}>
                        {flag.enabled ? 'LIVE' : 'DISABLED'}
                      </span>
                    </div>
                    <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', margin: 0 }}>{flag.description}</p>
                  </div>
                  <button onClick={() => handleToggle(flag)} disabled={toggling === flag.id}
                    style={{ width: '50px', height: '27px', borderRadius: '14px', border: 'none',
                      background: flag.enabled ? 'var(--accent)' : 'var(--border-light)',
                      cursor: toggling === flag.id ? 'not-allowed' : 'pointer',
                      position: 'relative', transition: 'background .2s', flexShrink: 0,
                      opacity: toggling === flag.id ? .6 : 1 }}>
                    <div style={{ position: 'absolute', top: '4px', left: flag.enabled ? '27px' : '4px',
                      width: '19px', height: '19px', borderRadius: '50%', background: '#fff',
                      transition: 'left .2s', boxShadow: '0 1px 4px rgba(0,0,0,.3)' }} />
                  </button>
                </div>
              ))}
            </div>
          </Section>
        )}
      </div>
    </>
  )
}

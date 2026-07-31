'use client'
// ── TRACK PICKER ────────────────────────────────────────────────────────────
// The default entry point of the app. Shows every track with its own saved
// place. Picking a track never disturbs the others — that's the whole point.

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Nav from '@/components/Nav'
import { TRACKS, getLesson, trackLength, trackPercent, levelLabel } from '@/lib/roadmaps'
import { getAllProgress, setActiveTrack, getActiveTrack } from '@/lib/roadmapDb'
import type { TrackProgress } from '@/lib/roadmapDb'
import { trackNow } from '@/lib/analytics'

export default function RoadmapPage() {
  const router = useRouter()
  const [progress, setProgress] = useState<Record<string, TrackProgress> | null>(null)
  const [active, setActive] = useState<string | null>(null)
  const [going, setGoing] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      const [all, act] = await Promise.all([getAllProgress(), getActiveTrack()])
      setProgress(all)
      setActive(act)
    }
    load()
  }, [])

  const open = async (trackId: string) => {
    setGoing(trackId)
    trackNow('track_selected', { trackId })
    await setActiveTrack(trackId)
    router.push(`/roadmap/${trackId}`)
  }

  const started = progress
    ? TRACKS.filter(t => (progress[t.id]?.completedLessons.length ?? 0) > 0)
    : []
  const resumeTrack = active && progress?.[active] ? TRACKS.find(t => t.id === active) : undefined
  const resumeProgress = resumeTrack ? progress![resumeTrack.id] : undefined
  const resumeLesson = resumeTrack && resumeProgress
    ? getLesson(resumeTrack.id, resumeProgress.currentLesson)
    : undefined

  return (
    <>
      <Nav showApp />
      <div className="container-lg">
        <p className="eyebrow anim-slide-up anim-d1">YOUR ROADMAP</p>
        <h1 className="font-display anim-slide-up anim-d2" style={{ fontSize: 'clamp(32px,5vw,58px)', fontWeight: 900, letterSpacing: '-.04em', marginBottom: '10px' }}>
          {started.length > 0 ? 'Pick up where you left off.' : 'Choose your track.'}
        </h1>
        <p className="text-muted anim-slide-up anim-d2" style={{ fontSize: '16px', marginBottom: '36px', maxWidth: '580px', lineHeight: 1.6 }}>
          Every lesson gives you the structure and the points to hit before you speak.
          You&apos;re practicing delivery — never inventing content on the spot.
        </p>

        {/* Resume hero — the "you always know what's next" card */}
        {resumeTrack && resumeLesson && resumeProgress && (
          <div className="anim-slide-up anim-d3" style={{
            background: 'rgba(170,255,0,.05)', border: '1px solid rgba(170,255,0,.22)',
            borderRadius: '24px', padding: '28px 32px', marginBottom: '28px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '.12em', color: 'var(--accent)' }}>NEXT UP</span>
              <span className="text-muted" style={{ fontSize: '12px' }}>
                {resumeTrack.icon} {resumeTrack.label} · {levelLabel(resumeTrack.id, resumeLesson.level)}
              </span>
            </div>
            <h2 className="font-display" style={{ fontSize: 'clamp(22px,3vw,30px)', fontWeight: 900, letterSpacing: '-.03em', marginBottom: '8px' }}>
              Lesson {resumeLesson.id}: {resumeLesson.title}
            </h2>
            <p className="text-muted" style={{ fontSize: '15px', lineHeight: 1.6, marginBottom: '22px', maxWidth: '520px' }}>
              {resumeLesson.objective}
            </p>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <Link href={`/lesson/${resumeTrack.id}/${resumeLesson.id}`} className="btn btn-primary btn-md">
                Continue lesson {resumeLesson.id} →
              </Link>
              <button className="btn btn-outline btn-md" onClick={() => open(resumeTrack.id)}>
                See full track
              </button>
            </div>
          </div>
        )}

        {/* Tracks */}
        <div className="roadmap-track-grid anim-slide-up anim-d4">
          {TRACKS.map(track => {
            const p = progress?.[track.id]
            const done = p?.completedLessons.length ?? 0
            const total = trackLength(track.id)
            const pct = p ? trackPercent(track.id, p.completedLessons) : 0
            const current = p ? getLesson(track.id, p.currentLesson) : undefined
            const isDone = done >= total && total > 0
            const isActive = active === track.id

            return (
              <button
                key={track.id}
                className="cat-card"
                onClick={() => open(track.id)}
                disabled={going === track.id}
                style={{
                  gap: '0', padding: '28px',
                  borderColor: isActive ? 'rgba(170,255,0,.35)' : undefined,
                  opacity: going === track.id ? 0.6 : 1,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <span style={{ fontSize: '32px' }}>{track.icon}</span>
                  {isDone ? (
                    <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '.08em', background: 'rgba(170,255,0,.12)', color: 'var(--accent)', padding: '4px 10px', borderRadius: '100px' }}>
                      COMPLETE
                    </span>
                  ) : done > 0 ? (
                    <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '.08em', background: 'var(--card2)', color: 'var(--text-muted)', padding: '4px 10px', borderRadius: '100px' }}>
                      IN PROGRESS
                    </span>
                  ) : null}
                </div>

                <span style={{ fontWeight: 700, fontSize: '19px', letterSpacing: '-.02em', marginBottom: '6px' }}>{track.label}</span>
                <span className="text-muted" style={{ fontSize: '13px', lineHeight: 1.55, marginBottom: '20px' }}>{track.blurb}</span>

                <div style={{ marginTop: 'auto', width: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: done > 0 ? 'var(--accent)' : 'var(--text-muted)' }}>
                      {progress === null ? '—' : `${done} of ${total} lessons`}
                    </span>
                    <span className="text-muted" style={{ fontSize: '12px' }}>{pct}%</span>
                  </div>
                  <div className="prog-track">
                    <div className="prog-fill" style={{ background: 'var(--accent)', width: `${pct}%` }} />
                  </div>
                  <p className="text-muted" style={{ fontSize: '12px', marginTop: '12px', minHeight: '18px' }}>
                    {progress === null ? '' :
                      isDone ? 'Track finished — replay any lesson' :
                      done > 0 && current ? `Next: ${current.title}` :
                      `${track.levels.length} levels · starts with "${track.lessons[0].title}"`}
                  </p>
                </div>
              </button>
            )
          })}
        </div>

        {/* Custom topic escape hatch */}
        <div style={{ marginTop: '32px', padding: '24px 28px', border: '1px dashed var(--border-light)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px', flexWrap: 'wrap' }}>
          <div>
            <p style={{ fontWeight: 600, fontSize: '15px', marginBottom: '6px' }}>Have a real presentation or script to rehearse?</p>
            <p className="text-muted" style={{ fontSize: '13px', lineHeight: 1.55, maxWidth: '440px' }}>
              Practice your own topic instead. Paste or upload your script and the AI checks your delivery against it.
            </p>
          </div>
          <Link href="/record" className="btn btn-outline btn-md" style={{ flexShrink: 0 }}>Custom topic →</Link>
        </div>
      </div>

      <style>{`
        .roadmap-track-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
        @media (max-width: 900px) { .roadmap-track-grid { grid-template-columns: 1fr; } }
      `}</style>
    </>
  )
}

'use client'
// ── LESSON MAP ──────────────────────────────────────────────────────────────
// The Duolingo-style path for one track. Sequential, gated, and always shows
// exactly one "next" lesson so the user never has to decide what to do.

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Nav from '@/components/Nav'
import {
  getTrack, trackLength, trackPercent, isLessonUnlocked,
  lessonsInLevel, isLevelComplete,
} from '@/lib/roadmaps'
import { getProgress, setActiveTrack, resetTrack } from '@/lib/roadmapDb'
import type { TrackProgress } from '@/lib/roadmapDb'

export default function TrackPage() {
  const router = useRouter()
  const params = useParams()
  const trackId = String(params.trackId)
  const track = getTrack(trackId)

  const [progress, setProgress] = useState<TrackProgress | null>(null)
  const [confirmReset, setConfirmReset] = useState(false)
  const [resetting, setResetting] = useState(false)

  useEffect(() => {
    if (!track) return
    const load = async () => {
      // Landing here directly (bookmark, refresh) should also make this the
      // active track, so the dashboard resume card stays truthful.
      await setActiveTrack(trackId)
      setProgress(await getProgress(trackId))
    }
    load()
  }, [trackId, track])

  const handleReset = async () => {
    setResetting(true)
    await resetTrack(trackId)
    setProgress(await getProgress(trackId))
    setResetting(false)
    setConfirmReset(false)
  }

  if (!track) return (
    <>
      <Nav showApp />
      <div className="container" style={{ textAlign: 'center' }}>
        <h1 className="font-display" style={{ fontSize: '28px', fontWeight: 900, marginBottom: '12px' }}>Track not found</h1>
        <Link href="/roadmap" className="btn btn-primary btn-md">Back to roadmap</Link>
      </div>
    </>
  )

  const completed = progress?.completedLessons ?? []
  const currentLesson = progress?.currentLesson ?? 1
  const total = trackLength(trackId)
  const pct = trackPercent(trackId, completed)
  const allDone = completed.length >= total

  return (
    <>
      <Nav showApp />
      <div className="container">
        <Link href="/roadmap" className="text-muted" style={{ fontSize: '13px', textDecoration: 'none', display: 'inline-block', marginBottom: '20px' }}>
          ← All tracks
        </Link>

        {/* Track header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '20px' }}>
          <span style={{ fontSize: '40px', lineHeight: 1 }}>{track.icon}</span>
          <div style={{ flex: 1 }}>
            <h1 className="font-display anim-slide-up anim-d1" style={{ fontSize: 'clamp(28px,4vw,42px)', fontWeight: 900, letterSpacing: '-.04em', marginBottom: '6px' }}>
              {track.label}
            </h1>
            <p className="text-muted" style={{ fontSize: '14px' }}>{track.blurb}</p>
          </div>
        </div>

        {/* Overall progress */}
        <div className="anim-slide-up anim-d2" style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '18px', padding: '20px 24px', marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '10px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600 }}>
              {progress === null ? 'Loading…' : allDone ? 'Track complete 🎉' : `Lesson ${currentLesson} of ${total}`}
            </span>
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--accent)' }}>{pct}%</span>
          </div>
          <div className="prog-track">
            <div className="prog-fill" style={{ background: 'var(--accent)', width: `${pct}%` }} />
          </div>
        </div>

        {/* Levels */}
        {track.levels.map((lvl, li) => {
          const lessons = lessonsInLevel(trackId, lvl.level)
          const levelDone = isLevelComplete(trackId, lvl.level, completed)
          const levelUnlocked = lessons.some(l => isLessonUnlocked(l.id, completed)) || levelDone

          return (
            <div key={lvl.level} className="anim-slide-up" style={{ marginBottom: '32px', animationDelay: `${.15 + li * .06}s` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div style={{
                  width: '34px', height: '34px', borderRadius: '10px', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '14px', fontWeight: 800,
                  background: levelDone ? 'var(--accent)' : levelUnlocked ? 'var(--card2)' : 'var(--card)',
                  color: levelDone ? '#000' : levelUnlocked ? 'var(--text-primary)' : 'var(--text-muted)',
                  border: `1px solid ${levelDone ? 'var(--accent)' : 'var(--border-light)'}`,
                }}>
                  {levelDone ? '✓' : lvl.level}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '16px', letterSpacing: '-.02em' }}>
                    Level {lvl.level} — {lvl.name}
                  </div>
                  <div className="text-muted" style={{ fontSize: '12px' }}>{lvl.caption}</div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingLeft: '17px', borderLeft: '1px solid var(--border)' }}>
                {lessons.map(lesson => {
                  const isComplete = completed.includes(lesson.id)
                  const unlocked = isLessonUnlocked(lesson.id, completed)
                  const isCurrent = !isComplete && lesson.id === currentLesson && unlocked

                  const body = (
                    <div style={{
                      background: isCurrent ? 'rgba(170,255,0,.05)' : 'var(--card)',
                      border: `1px solid ${isCurrent ? 'rgba(170,255,0,.28)' : 'var(--border)'}`,
                      borderRadius: '16px', padding: '16px 20px',
                      display: 'flex', alignItems: 'center', gap: '14px',
                      opacity: unlocked ? 1 : 0.45,
                      transition: 'all .2s',
                    }}>
                      <div style={{
                        width: '30px', height: '30px', borderRadius: '50%', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700,
                        background: isComplete ? 'rgba(170,255,0,.15)' : 'var(--card2)',
                        color: isComplete ? 'var(--accent)' : 'var(--text-muted)',
                        border: `1px solid ${isComplete ? 'rgba(170,255,0,.3)' : 'var(--border-light)'}`,
                      }}>
                        {isComplete ? '✓' : unlocked ? lesson.id : '🔒'}
                      </div>

                      <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                        <div style={{ fontWeight: 600, fontSize: '15px', marginBottom: '3px' }}>{lesson.title}</div>
                        <div className="text-muted" style={{ fontSize: '12.5px', lineHeight: 1.5 }}>
                          {unlocked ? lesson.objective : `Finish lesson ${lesson.id - 1} to unlock`}
                        </div>
                      </div>

                      <div style={{ flexShrink: 0, textAlign: 'right' }}>
                        {isCurrent ? (
                          <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent)' }}>START →</span>
                        ) : isComplete ? (
                          <span className="text-muted" style={{ fontSize: '11px' }}>Replay</span>
                        ) : unlocked ? (
                          <span className="text-muted" style={{ fontSize: '11px' }}>Open</span>
                        ) : null}
                        <div className="text-muted" style={{ fontSize: '11px', marginTop: '3px' }}>
                          ~{lesson.targetSeconds >= 60 ? `${Math.round(lesson.targetSeconds / 60)}m` : `${lesson.targetSeconds}s`}
                        </div>
                      </div>
                    </div>
                  )

                  return unlocked ? (
                    <Link key={lesson.id} href={`/lesson/${trackId}/${lesson.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                      {body}
                    </Link>
                  ) : (
                    <div key={lesson.id} style={{ cursor: 'not-allowed' }}>{body}</div>
                  )
                })}
              </div>
            </div>
          )
        })}

        {/* Reset — mostly for beta testers re-running the cohort */}
        <div style={{ marginTop: '40px', paddingTop: '24px', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
          {!confirmReset ? (
            <button
              onClick={() => setConfirmReset(true)}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '12px', cursor: 'pointer', fontFamily: 'var(--font-body)' }}
            >
              Reset progress for this track
            </button>
          ) : (
            <div>
              <p className="text-muted" style={{ fontSize: '13px', marginBottom: '12px' }}>
                This clears your place in <strong>{track.label}</strong> only. Your other tracks and session history stay untouched.
              </p>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                <button className="btn btn-outline btn-sm" onClick={() => setConfirmReset(false)}>Cancel</button>
                <button
                  className="btn btn-sm"
                  onClick={handleReset}
                  disabled={resetting}
                  style={{ background: 'transparent', border: '1px solid rgba(255,48,84,.3)', color: 'var(--hot)' }}
                >
                  {resetting ? 'Resetting…' : 'Yes, reset this track'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

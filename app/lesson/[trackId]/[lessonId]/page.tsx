'use client'
// ── LESSON BRIEF ────────────────────────────────────────────────────────────
// The answer to "it's not a debate app". Before the mic ever opens the user
// sees the shape of a good answer (framework) and the exact points to hit
// (beats). They are practicing delivery, not inventing content under pressure.

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Nav from '@/components/Nav'
import { getTrack, getLesson, trackLength, levelLabel, minSecondsFor } from '@/lib/roadmaps'
import { getProgress, setActiveTrack } from '@/lib/roadmapDb'
import { setPendingSession } from '@/lib/db'
import { trackNow, markLessonStart } from '@/lib/analytics'

function fmtLen(s: number) {
  return s >= 60 ? `${Math.round(s / 60 * 10) / 10}m`.replace('.0m', 'm') : `${s}s`
}

export default function LessonBriefPage() {
  const router = useRouter()
  const params = useParams()
  const trackId = String(params.trackId)
  const lessonId = Number(params.lessonId)

  const track = getTrack(trackId)
  const lesson = getLesson(trackId, lessonId)

  const [unlocked, setUnlocked] = useState<boolean | null>(null)
  const [isComplete, setIsComplete] = useState(false)

  useEffect(() => {
    if (!track || !lesson) return
    const check = async () => {
      const p = await getProgress(trackId)
      // Lesson 1 is always open; otherwise the previous lesson must be done.
      setUnlocked(lessonId === 1 || p.completedLessons.includes(lessonId - 1))
      setIsComplete(p.completedLessons.includes(lessonId))
      await setActiveTrack(trackId)
    }
    check()
  }, [trackId, lessonId, track, lesson])

  const start = () => {
    if (!lesson || !track) return
    setPendingSession({
      category: track.label,
      prompt: lesson.prompt,
      uploadedScript: '',
      rubric: '',
      // Lesson context — carried through the whole 5-step flow.
      trackId,
      lessonId,
      lessonTitle: lesson.title,
      lessonObjective: lesson.objective,
      framework: lesson.framework,
      beats: lesson.beats,
      prepSeconds: lesson.prepSeconds,
      targetSeconds: lesson.targetSeconds,
      minSeconds: minSecondsFor(lesson),
      levelName: levelLabel(trackId, lesson.level),
    })
    // Starts the clock for "average time per lesson" (prep + recording + review)
    // and opens the activation funnel for this attempt.
    markLessonStart()
    trackNow('lesson_start', { trackId, lessonId, level: lesson.level })
    router.push('/record/session')
  }

  if (!track || !lesson) return (
    <>
      <Nav showApp />
      <div className="container" style={{ textAlign: 'center' }}>
        <h1 className="font-display" style={{ fontSize: '28px', fontWeight: 900, marginBottom: '12px' }}>Lesson not found</h1>
        <Link href="/roadmap" className="btn btn-primary btn-md">Back to roadmap</Link>
      </div>
    </>
  )

  if (unlocked === false) return (
    <>
      <Nav showApp />
      <div className="container" style={{ textAlign: 'center', paddingTop: '80px' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔒</div>
        <h1 className="font-display" style={{ fontSize: '28px', fontWeight: 900, marginBottom: '12px' }}>Lesson {lessonId} is locked</h1>
        <p className="text-muted" style={{ marginBottom: '24px' }}>Finish lesson {lessonId - 1} first — the track is meant to be walked in order.</p>
        <Link href={`/roadmap/${trackId}`} className="btn btn-primary btn-md">Back to {track.label}</Link>
      </div>
    </>
  )

  return (
    <>
      <Nav showApp />
      <div className="container">
        <Link href={`/roadmap/${trackId}`} className="text-muted" style={{ fontSize: '13px', textDecoration: 'none', display: 'inline-block', marginBottom: '20px' }}>
          ← {track.label}
        </Link>

        {/* Heading */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', flexWrap: 'wrap' }}>
          <span className="eyebrow" style={{ marginBottom: 0 }}>LESSON {lesson.id} OF {trackLength(trackId)}</span>
          <span className="text-muted" style={{ fontSize: '12px' }}>· {levelLabel(trackId, lesson.level)}</span>
          {isComplete && (
            <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '.08em', background: 'rgba(170,255,0,.12)', color: 'var(--accent)', padding: '4px 10px', borderRadius: '100px' }}>
              COMPLETED
            </span>
          )}
        </div>

        <h1 className="font-display anim-slide-up anim-d1" style={{ fontSize: 'clamp(30px,4.5vw,46px)', fontWeight: 900, letterSpacing: '-.04em', marginBottom: '10px' }}>
          {lesson.title}
        </h1>
        <p className="text-muted anim-slide-up anim-d1" style={{ fontSize: '16px', lineHeight: 1.6, marginBottom: '32px' }}>
          {lesson.objective}
        </p>

        {/* The prompt */}
        <div className="anim-slide-up anim-d2" style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '20px', padding: '26px 28px', marginBottom: '16px' }}>
          <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '.1em', color: 'var(--text-muted)', marginBottom: '12px' }}>YOUR PROMPT</p>
          <p style={{ fontSize: 'clamp(17px,2.4vw,21px)', fontWeight: 600, letterSpacing: '-.02em', lineHeight: 1.45 }}>
            &ldquo;{lesson.prompt}&rdquo;
          </p>
        </div>

        {/* Framework */}
        <div className="anim-slide-up anim-d2" style={{ background: 'rgba(0,174,255,.04)', border: '1px solid rgba(0,174,255,.18)', borderRadius: '20px', padding: '24px 28px', marginBottom: '16px' }}>
          <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '.1em', color: 'var(--blue)', marginBottom: '14px' }}>THE SHAPE OF A GOOD ANSWER</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
            {lesson.framework.split('→').map((part, i, arr) => (
              <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                <span style={{
                  background: 'var(--card2)', border: '1px solid var(--border-light)',
                  borderRadius: '100px', padding: '7px 15px', fontSize: '13.5px', fontWeight: 600,
                }}>
                  {part.trim()}
                </span>
                {i < arr.length - 1 && <span style={{ color: 'var(--blue)', fontSize: '14px' }}>→</span>}
              </span>
            ))}
          </div>
        </div>

        {/* Beats */}
        <div className="anim-slide-up anim-d3" style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '20px', padding: '24px 28px', marginBottom: '16px' }}>
          <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '.1em', color: 'var(--accent)', marginBottom: '6px' }}>HIT THESE POINTS</p>
          <p className="text-muted" style={{ fontSize: '12.5px', marginBottom: '18px' }}>
            You don&apos;t have to invent anything. Say these, in your own words.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {lesson.beats.map((beat, i) => (
              <div key={i} style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                <div style={{
                  width: '24px', height: '24px', borderRadius: '7px', flexShrink: 0, marginTop: '1px',
                  background: 'var(--card2)', border: '1px solid var(--border-light)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '12px', fontWeight: 700, color: 'var(--accent)',
                }}>
                  {i + 1}
                </div>
                <p style={{ fontSize: '15px', lineHeight: 1.55, paddingTop: '2px' }}>{beat}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Timing */}
        <div className="anim-slide-up anim-d3" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '28px' }}>
          {[
            { label: 'THINK TIME', val: fmtLen(lesson.prepSeconds), sub: 'before the mic opens', color: 'var(--blue)' },
            { label: 'TARGET LENGTH', val: fmtLen(lesson.targetSeconds), sub: `minimum ${fmtLen(minSecondsFor(lesson))}`, color: 'var(--accent)' },
          ].map(t => (
            <div key={t.label} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '20px' }}>
              <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '.1em', color: 'var(--text-muted)', marginBottom: '8px' }}>{t.label}</p>
              <p className="font-display" style={{ fontSize: '28px', fontWeight: 900, letterSpacing: '-.03em', color: t.color, lineHeight: 1 }}>{t.val}</p>
              <p className="text-muted" style={{ fontSize: '12px', marginTop: '6px' }}>{t.sub}</p>
            </div>
          ))}
        </div>

        <button className="btn btn-primary btn-full btn-lg anim-slide-up anim-d4" onClick={start} disabled={unlocked === null}>
          {unlocked === null ? 'Loading…' : `Start — ${fmtLen(lesson.prepSeconds)} to think first →`}
        </button>
        <p className="text-muted anim-slide-up anim-d4" style={{ fontSize: '12.5px', textAlign: 'center', marginTop: '14px', lineHeight: 1.6 }}>
          You&apos;ll get {fmtLen(lesson.prepSeconds)} with these points on screen before recording starts.
        </p>
      </div>
    </>
  )
}

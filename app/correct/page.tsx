'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Nav from '@/components/Nav'
import { getPendingSession, clearPendingSession, saveSession, computeTokensForSession } from '@/lib/db'
import { completeLesson, setLastLesson, clearLastLesson } from '@/lib/roadmapDb'
import { trackNow, readLessonElapsedMs, clearLessonClock } from '@/lib/analytics'
import Link from 'next/link'

export default function CorrectPage() {
  const router = useRouter()
  const [pending, setPending] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState('')

  useEffect(() => {
    const p = getPendingSession()
    setPending(p)
    if (p) trackNow('correct', { trackId: p.trackId ?? null, lessonId: p.lessonId ?? null })
  }, [])

  const feedback = pending?.feedback || []
  const aiAnalysis = pending?.aiAnalysis
  const nextDrill = aiAnalysis?.nextStepDrill
  const celebrationMsg = aiAnalysis?.celebrationMsg

  const handleDone = async () => {
    if (saving || saved) {
      router.push('/levelup')
      return
    }

    setSaving(true)
    setSaveError('')

    try {
      if (pending) {
        const clarityScore = pending.clarityScore ?? pending.clarity_score ?? 0
        const duration     = pending.duration || 0
        const fillerCount  = pending.fillerCount ?? pending.filler_count ?? 0
        const tokensEarned = computeTokensForSession(clarityScore, duration, fillerCount)

        const sessionToSave = {
          id:              crypto.randomUUID(),
          date:            pending.date || new Date().toISOString(),
          category:        pending.category || 'General',
          prompt:          pending.prompt || '',
          duration,
          fillerCount,
          fillerWords:     pending.fillerWords || pending.filler_words || [],
          pace:            pending.pace || 0,
          clarityScore,
          lengthStatus:    pending.lengthStatus || pending.length_status || 'in-range',
          feedback,
          transcriptPreview: pending.transcriptPreview || pending.transcript_preview || '',
          tokensEarned,
        }

        const trackId  = pending.trackId
        const lessonId = Number(pending.lessonId) || null
        const lessonMs = readLessonElapsedMs()

        // Research fields ride along with the insert. track_id/lesson_id are
        // stamped here rather than patched afterwards by tagLatestSession(),
        // which had to re-find "the newest row" and could attribute the wrong one.
        const ok = await saveSession(sessionToSave, {
          trackId:         trackId || null,
          lessonId,
          prepSecondsUsed: pending.prepSecondsUsed ?? null,
          prepSkipped:     typeof pending.prepSkipped === 'boolean' ? pending.prepSkipped : null,
          beatsTotal:      pending.beatsTotal ?? null,
          beatsHit:        pending.beatsHit ?? null,
          beatCheck:       pending.beatCheck ?? null,
          lessonMs:        trackId && lessonId ? lessonMs : null,
        })

        if (ok) {
          trackNow('session_saved', {
            trackId: trackId || null, lessonId,
            score: clarityScore, duration, lessonMs,
            prepSkipped: pending.prepSkipped ?? null,
            beatsHit: pending.beatsHit ?? null, beatsTotal: pending.beatsTotal ?? null,
          })
          clearLessonClock()

          // Roadmap bookkeeping — only when this rep came from a lesson.
          if (trackId && lessonId) {
            await completeLesson(trackId, lessonId)
            // /levelup reads this to show "lesson complete" and what's next.
            setLastLesson({ trackId, lessonId })
          } else {
            // Free practice — drop any earlier lesson or /levelup would still
            // congratulate them for a lesson they didn't just do.
            clearLastLesson()
          }

          setSaved(true)
          clearPendingSession()
        } else {
          setSaveError('Could not save session — check your connection and try again.')
        }
      }
    } catch (e) {
      console.error('Save error:', e)
      setSaveError('Something went wrong saving your session.')
    }

    setSaving(false)
    router.push('/levelup')
  }

  const handleReRecord = () => {
    router.push('/record/session')
  }

  return (
    <>
      <Nav backHref="/observe" />
      <div className="container">
        <p className="eyebrow anim-slide-up anim-d1">STEPS 3–4 — CORRECT &amp; APPLY</p>
        <h1 className="font-display anim-slide-up anim-d2" style={{ fontSize: 'clamp(32px,5vw,48px)', fontWeight: 900, letterSpacing: '-.04em', marginBottom: '8px' }}>
          AI Coaching Report.
        </h1>
        <p className="text-muted anim-slide-up anim-d2" style={{ fontSize: '16px', marginBottom: '36px' }}>
          Specific to your recording. Apply one change, then re-record immediately.
        </p>

        {/* Celebration */}
        {celebrationMsg && (
          <div className="anim-slide-up anim-d2" style={{ background: 'rgba(170,255,0,.06)', border: '1px solid rgba(170,255,0,.2)', borderRadius: '18px', padding: '20px 24px', marginBottom: '20px', display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
            <span style={{ fontSize: '24px' }}>✨</span>
            <div>
              <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--accent)', marginBottom: '6px', letterSpacing: '.06em' }}>WHAT YOU DID WELL</p>
              <p style={{ fontSize: '15px', color: 'var(--text-primary)', lineHeight: 1.65 }}>{celebrationMsg}</p>
            </div>
          </div>
        )}

        {/* Feedback cards */}
        {feedback.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '24px' }}>
            {feedback.map((f: any, i: number) => (
              <div key={i} className="feedback-card anim-slide-up" style={{ animationDelay: `${.15 + i * .1}s` }}>
                <div className="feedback-icon">{f.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', flexWrap: 'wrap' }}>
                    <h3 style={{ fontWeight: 700, fontSize: '16px' }}>{f.title}</h3>
                    <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '.08em', padding: '3px 8px', borderRadius: '100px', color: f.tagColor, background: f.tagBg }}>
                      {f.tag}
                    </span>
                  </div>
                  <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.75 }}>{f.detail}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '20px', padding: '32px', textAlign: 'center', marginBottom: '24px' }}>
            <p style={{ marginBottom: '12px' }}>No coaching loaded — go back and complete a recording first.</p>
            <Link href="/record" className="btn btn-outline btn-sm" style={{ display: 'inline-flex' }}>Start a Recording</Link>
          </div>
        )}

        {/* Next drill */}
        {nextDrill && (
          <div className="anim-slide-up anim-d5" style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '18px', padding: '20px 24px', marginBottom: '24px', display: 'flex', gap: '14px' }}>
            <span style={{ fontSize: '24px', flexShrink: 0 }}>🎯</span>
            <div>
              <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px', letterSpacing: '.06em' }}>YOUR NEXT 5-MINUTE DRILL</p>
              <p style={{ fontSize: '15px', lineHeight: 1.65, color: 'var(--text-primary)' }}>{nextDrill}</p>
            </div>
          </div>
        )}

        {/* Save error */}
        {saveError && (
          <div style={{ background: 'rgba(255,48,84,.08)', border: '1px solid rgba(255,48,84,.2)', borderRadius: '12px', padding: '12px 16px', fontSize: '14px', color: 'var(--hot)', marginBottom: '16px' }}>
            {saveError}
          </div>
        )}

        {/* Saved confirmation */}
        {saved && (
          <div style={{ background: 'rgba(170,255,0,.06)', border: '1px solid rgba(170,255,0,.2)', borderRadius: '12px', padding: '12px 16px', fontSize: '14px', color: 'var(--accent)', marginBottom: '16px' }}>
            ✓ Session saved to your history
          </div>
        )}

        {feedback.length > 0 && (
          <div className="anim-slide-up anim-d6" style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '12px' }}>
            <button className="btn btn-primary btn-lg btn-full" onClick={handleReRecord}>
              🎤 Apply &amp; Re-Record
            </button>
            <button
              className="btn btn-outline btn-lg"
              onClick={handleDone}
              disabled={saving}
              style={{ padding: '18px 24px', opacity: saving ? 0.7 : 1 }}
            >
              {saving ? 'Saving...' : 'Done →'}
            </button>
          </div>
        )}
      </div>
    </>
  )
}
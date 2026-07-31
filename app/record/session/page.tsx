'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Nav from '@/components/Nav'
import WaveBars from '@/components/WaveBars'
import { getPendingSession, setPendingSession } from '@/lib/db'
import { trackNow } from '@/lib/analytics'
import { audioStore } from '@/lib/audioStore'

const MAX = 660
function fmt(s: number) {
  return `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`
}
type Phase = 'perm' | 'idle' | 'prep' | 'recording' | 'playback'

const FILLERS = ['um', 'uh', 'like', 'you know', 'basically', 'literally', 'right', 'so', 'actually', 'honestly', 'kind of', 'sort of', 'i mean', 'yeah', 'okay', 'well']

function analyzeTranscript(transcript: string, duration: number, minSec = 30, maxSec = MAX) {
  const words = transcript.trim().split(/\s+/).filter(Boolean)
  const wordCount = words.length
  const pace = duration > 0 ? Math.round((wordCount / duration) * 60) : 0
  const lc = transcript.toLowerCase()
  let fillerCount = 0
  const foundFillers: string[] = []
  FILLERS.forEach(f => {
    const matches = lc.match(new RegExp(`\\b${f}\\b`, 'gi'))
    if (matches) { fillerCount += matches.length; foundFillers.push(`${f} ×${matches.length}`) }
  })
  // Lessons set their own floor — a 30s lesson shouldn't be graded against the
  // generic 30s minimum and come back "too short" for a valid answer.
  const lengthStatus: 'in-range' | 'too-short' | 'too-long' = duration < minSec ? 'too-short' : duration > maxSec ? 'too-long' : 'in-range'
  let clarity = 100
  clarity -= Math.min(fillerCount * 5, 45)
  if (pace > 180) clarity -= 15
  if (pace < 110 && pace > 0) clarity -= 10
  if (lengthStatus !== 'in-range') clarity -= 10
  clarity = Math.max(10, Math.min(100, clarity))
  return {
    wordCount, pace, fillerCount, fillerWords: foundFillers, lengthStatus, clarityScore: clarity,
    transcript,
    transcriptPreview: transcript.slice(0, 200) + (transcript.length > 200 ? '…' : ''),
  }
}

export default function RecordSessionPage() {
  const router = useRouter()
  const pending = getPendingSession()

  // ── Lesson context (absent for free/custom practice) ──────────────────────
  const lesson = pending?.trackId && pending?.lessonId ? {
    trackId:      String(pending.trackId),
    lessonId:     Number(pending.lessonId),
    title:        String(pending.lessonTitle || ''),
    framework:    String(pending.framework || ''),
    beats:        (Array.isArray(pending.beats) ? pending.beats : []) as string[],
    prepSeconds:  Number(pending.prepSeconds) || 45,
    targetSeconds: Number(pending.targetSeconds) || 60,
    minSeconds:   Number(pending.minSeconds) || 30,
    levelName:    String(pending.levelName || ''),
  } : null
  const MIN = lesson?.minSeconds ?? 30

  const [phase, setPhase]         = useState<Phase>('perm')
  const [secs, setSecs]           = useState(0)
  const [prepLeft, setPrepLeft]   = useState(0)
  const [tooShort, setTooShort]   = useState(false)
  const [audioUrl, setAudioUrl]   = useState<string | null>(null)
  const [duration, setDuration]   = useState(0)
  const [playTime, setPlayTime]   = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [permErr, setPermErr]     = useState('')
  const [liveTranscript, setLiveTranscript] = useState('')
  const [speechSupported, setSpeechSupported] = useState(false)

  const mediaRef       = useRef<MediaRecorder | null>(null)
  const chunksRef      = useRef<Blob[]>([])
  const timerRef       = useRef<NodeJS.Timeout | null>(null)
  const audioRef       = useRef<HTMLAudioElement | null>(null)
  const playTimerRef   = useRef<NodeJS.Timeout | null>(null)
  const finalSecs      = useRef(0)
  const recognitionRef = useRef<any>(null)
  const fullTranscriptRef = useRef('')
  const recognitionResultCountRef = useRef(0)
  const autoStartedRef = useRef(false)

  useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    setSpeechSupported(!!SR)
    return () => { clearInterval(timerRef.current!); clearInterval(playTimerRef.current!) }
  }, [])

  const requestMic = async () => {
    setPermErr('')
    try {
      const s = await navigator.mediaDevices.getUserMedia({ audio: true })
      s.getTracks().forEach(t => t.stop())
      setPhase('idle')
    } catch (e: any) {
      if (e.name === 'NotAllowedError') setPermErr('Microphone access denied. Click the lock icon in your browser address bar → Microphone → Allow.')
      else if (e.name === 'NotFoundError') setPermErr('No microphone found. Please connect one and try again.')
      else setPermErr('Could not access microphone: ' + e.message)
    }
  }

  const startSpeechRecognition = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) return
    fullTranscriptRef.current = ''
    recognitionResultCountRef.current = 0

    const r = new SR()
    r.continuous = true; r.interimResults = true; r.lang = 'en-US'; r.maxAlternatives = 1

    r.onresult = (e: any) => {
      let final = ''
      for (let i = recognitionResultCountRef.current; i < e.results.length; i++) {
        if (e.results[i].isFinal) {
          final += e.results[i][0].transcript + ' '
          recognitionResultCountRef.current = i + 1
        }
      }
      if (final) {
        fullTranscriptRef.current += final
        setLiveTranscript(fullTranscriptRef.current)
      }
    }

    r.onerror = () => {}

    r.onend = () => {
      if (mediaRef.current?.state === 'recording') {
        try { r.start() } catch {}
      }
    }

    try { r.start(); recognitionRef.current = r } catch {}
  }

  const stopSpeechRecognition = () => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop() } catch {}
      recognitionRef.current = null
    }
  }

  const startRec = async () => {
    setPermErr('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mime = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : 'audio/webm'
      const recorder = new MediaRecorder(stream, { mimeType: mime })
      chunksRef.current = []
      recorder.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      recorder.onstop = () => {
        stream.getTracks().forEach(t => t.stop())
        stopSpeechRecognition()
        const blob = new Blob(chunksRef.current, { type: mime })
        const url = URL.createObjectURL(blob)
        audioStore.set(url, finalSecs.current, mime)
        setAudioUrl(url)
        setDuration(finalSecs.current)
        setPhase('playback')
      }
      recorder.start(100)
      mediaRef.current = recorder
      setPhase('recording'); setSecs(0); finalSecs.current = 0; setTooShort(false)
      fullTranscriptRef.current = ''; setLiveTranscript('')
      recognitionResultCountRef.current = 0
      if (speechSupported) startSpeechRecognition()
      timerRef.current = setInterval(() => {
        setSecs(prev => { const n = prev + 1; finalSecs.current = n; if (n >= MAX) { stopRec(); return MAX } return n })
      }, 1000)
    } catch (e: any) { setPermErr('Could not start: ' + e.message); setPhase('perm') }
  }

  const stopRec = () => { clearInterval(timerRef.current!); if (mediaRef.current?.state !== 'inactive') mediaRef.current?.stop() }

  // ── Prep countdown — dedicated think time before the mic opens ─────────────
  const beginPrep = () => {
    if (!lesson) { startRec(); return }
    autoStartedRef.current = false
    setPrepLeft(lesson.prepSeconds)
    setPhase('prep')
  }

  /**
   * How much think time was actually consumed, and whether the user cut it
   * short. Written into the pending session so /correct can persist it — this
   * is what answers "do users who skip prep perform worse?".
   */
  const recordPrepUsage = (skipped: boolean, remaining: number) => {
    if (!lesson) return
    const used = Math.max(0, lesson.prepSeconds - Math.max(0, remaining))
    const p = getPendingSession() || {}
    setPendingSession({ ...p, prepSecondsUsed: used, prepSkipped: skipped })
    trackNow(skipped ? 'prep_skipped' : 'prep_completed', {
      trackId: lesson.trackId, lessonId: lesson.lessonId,
      prepSeconds: lesson.prepSeconds, secondsUsed: used,
    })
  }

  useEffect(() => {
    if (phase !== 'prep') return
    if (prepLeft <= 0) {
      if (!autoStartedRef.current) {
        autoStartedRef.current = true
        recordPrepUsage(false, 0)
        startRec()
      }
      return
    }
    const t = setTimeout(() => setPrepLeft(s => s - 1), 1000)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, prepLeft])

  const skipPrep = () => {
    if (autoStartedRef.current) return
    autoStartedRef.current = true
    recordPrepUsage(true, prepLeft)
    startRec()
  }

  const handleBtn = () => {
    if (phase === 'idle') { lesson ? beginPrep() : startRec() }
    else if (phase === 'recording') { if (secs < MIN) setTooShort(true); else stopRec() }
  }

  const playPause = () => {
    if (!audioRef.current) return
    if (isPlaying) { audioRef.current.pause(); clearInterval(playTimerRef.current!); setIsPlaying(false) }
    else {
      audioRef.current.play(); setIsPlaying(true)
      playTimerRef.current = setInterval(() => {
        if (!audioRef.current) return
        setPlayTime(audioRef.current.currentTime)
        if (audioRef.current.ended) { setIsPlaying(false); clearInterval(playTimerRef.current!) }
      }, 200)
    }
  }

  const goNext = () => {
    const analysis = analyzeTranscript(fullTranscriptRef.current, duration, MIN, MAX)
    const p = getPendingSession() || {}
    setPendingSession({ ...p, ...analysis, duration })
    trackNow('recording_done', {
      trackId: lesson?.trackId ?? null, lessonId: lesson?.lessonId ?? null,
      duration, lesson: !!lesson,
    })
    router.push('/self-rate')
  }

  const recordAgain = () => {
    setPhase('idle'); setSecs(0); setTooShort(false)
    setPlayTime(0); setIsPlaying(false)
    audioStore.clear(); setAudioUrl(null)
    setLiveTranscript(''); fullTranscriptRef.current = ''
    recognitionResultCountRef.current = 0
    autoStartedRef.current = false
  }

  const timerColor = phase === 'recording' ? (secs < MIN ? 'var(--hot)' : 'var(--accent)') : 'var(--text-muted)'
  const backHref = lesson ? `/lesson/${lesson.trackId}/${lesson.lessonId}` : '/record'

  // Small reusable beats list — shown during prep and (compactly) while recording
  const BeatsList = ({ compact }: { compact?: boolean }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: compact ? '7px' : '12px', textAlign: 'left' }}>
      {lesson!.beats.map((beat, i) => (
        <div key={i} style={{ display: 'flex', gap: '11px', alignItems: 'flex-start' }}>
          <div style={{
            width: compact ? '19px' : '24px', height: compact ? '19px' : '24px', borderRadius: '6px', flexShrink: 0,
            background: 'var(--card2)', border: '1px solid var(--border-light)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: compact ? '10px' : '12px', fontWeight: 700, color: 'var(--accent)', marginTop: '1px',
          }}>
            {i + 1}
          </div>
          <p style={{ fontSize: compact ? '13px' : '15px', lineHeight: 1.5, color: compact ? 'var(--text-muted)' : 'var(--text-primary)' }}>{beat}</p>
        </div>
      ))}
    </div>
  )

  return (
    <>
      <Nav backHref={backHref} rightContent={<span className="text-muted" style={{ fontSize: '13px' }}>{(pending as any)?.category || 'Recording'}</span>} />
      <div className="container" style={{ textAlign: 'center' }}>
        <p className="eyebrow anim-slide-up anim-d1">
          {lesson ? `LESSON ${lesson.lessonId} — ${lesson.title.toUpperCase()}` : 'STEP 1 OF 5 — VOICE'}
        </p>

        {phase === 'perm' && (
          <div className="mic-perm-box anim-slide-up anim-d2">
            <div style={{ fontSize: '64px', marginBottom: '20px' }}>🎙️</div>
            <h2 className="font-display" style={{ fontSize: '28px', fontWeight: 900, letterSpacing: '-.03em', marginBottom: '12px' }}>Microphone Access</h2>
            <p className="text-muted" style={{ fontSize: '15px', lineHeight: 1.65, marginBottom: '16px' }}>
              Vocalis needs your microphone to record and analyze your speech in real time.
            </p>
            <p style={{ fontSize: '14px', color: 'var(--accent)', marginBottom: '28px', fontWeight: 600 }}>
              When your browser asks — click <strong>Allow</strong>.
            </p>
            {permErr && (
              <div style={{ background: 'rgba(255,48,84,.08)', border: '1px solid rgba(255,48,84,.2)', borderRadius: '12px', padding: '14px 18px', marginBottom: '20px', fontSize: '13px', color: 'var(--hot)', textAlign: 'left', lineHeight: 1.6 }}>
                {permErr}
              </div>
            )}
            <button className="btn btn-primary btn-lg btn-full" onClick={requestMic}>Allow Microphone →</button>
          </div>
        )}

        {/* ── PREP PHASE — think time, mic still closed ── */}
        {phase === 'prep' && lesson && (
          <>
            <div className="anim-slide-up anim-d2" style={{ background: 'rgba(0,174,255,.05)', border: '1px solid rgba(0,174,255,.25)', borderRadius: '24px', padding: '32px 28px', marginBottom: '20px' }}>
              <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '.12em', color: 'var(--blue)', marginBottom: '14px' }}>
                THINK FIRST — MIC IS STILL OFF
              </p>
              <div className="font-display" style={{ fontSize: 'clamp(56px,11vw,84px)', fontWeight: 900, letterSpacing: '-.05em', lineHeight: 1, color: 'var(--blue)' }}>
                {prepLeft}
              </div>
              <p className="text-muted" style={{ fontSize: '13px', marginTop: '10px' }}>
                Recording starts automatically when this hits zero
              </p>
              <div style={{ maxWidth: '360px', margin: '18px auto 0' }}>
                <div className="prog-track">
                  <div className="prog-fill" style={{ background: 'var(--blue)', width: `${(prepLeft / lesson.prepSeconds) * 100}%`, transition: 'width 1s linear' }} />
                </div>
              </div>
            </div>

            <div className="anim-slide-up anim-d3" style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '20px', padding: '24px 26px', marginBottom: '16px', textAlign: 'left' }}>
              <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '.1em', color: 'var(--text-muted)', marginBottom: '10px' }}>YOUR PROMPT</p>
              <p style={{ fontSize: '17px', fontWeight: 600, letterSpacing: '-.02em', lineHeight: 1.45, marginBottom: '20px' }}>
                &ldquo;{pending?.prompt}&rdquo;
              </p>
              {lesson.framework && (
                <>
                  <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '.1em', color: 'var(--blue)', marginBottom: '10px' }}>STRUCTURE</p>
                  <p style={{ fontSize: '14px', fontWeight: 600, marginBottom: '20px' }}>{lesson.framework}</p>
                </>
              )}
              <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '.1em', color: 'var(--accent)', marginBottom: '14px' }}>HIT THESE POINTS</p>
              <BeatsList />
            </div>

            <button className="btn btn-primary btn-full btn-lg anim-slide-up anim-d4" onClick={skipPrep}>
              I&apos;m ready — start recording now →
            </button>
          </>
        )}

        {(phase === 'idle' || phase === 'recording') && (
          <>
            <div className="anim-slide-up anim-d2" style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '20px', padding: '24px 28px', marginBottom: '24px', textAlign: lesson ? 'left' : 'center' }}>
              <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '10px' }}>YOUR PROMPT</p>
              <p style={{ fontSize: 'clamp(16px,2.2vw,20px)', fontWeight: 600, letterSpacing: '-.02em', lineHeight: 1.4 }}>
                &ldquo;{(pending as any)?.prompt || 'Tell me about yourself.'}&rdquo;
              </p>

              {lesson && lesson.framework && (
                <p style={{ fontSize: '13px', color: 'var(--blue)', fontWeight: 600, marginTop: '14px' }}>
                  {lesson.framework}
                </p>
              )}
              {lesson && lesson.beats.length > 0 && (
                <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
                  <BeatsList compact />
                </div>
              )}

              {(pending as any)?.uploadedScript && (
                <div style={{ marginTop: '12px', padding: '10px 14px', background: 'rgba(170,255,0,.06)', borderRadius: '10px', fontSize: '12px', color: 'var(--accent)' }}>
                  📎 Script uploaded — AI will compare your delivery to your script
                </div>
              )}
              {(pending as any)?.rubric && (
                <div style={{ marginTop: '8px', padding: '10px 14px', background: 'rgba(0,174,255,.06)', borderRadius: '10px', fontSize: '12px', color: 'var(--blue)' }}>
                  📋 Rubric uploaded — AI will grade you against your criteria
                </div>
              )}
            </div>

            <div className="anim-slide-up anim-d3" style={{ marginBottom: '16px' }}>
              <div className="font-display" style={{ fontSize: 'clamp(56px,10vw,76px)', fontWeight: 900, letterSpacing: '-.05em', lineHeight: 1, color: timerColor, transition: 'color .3s' }}>{fmt(secs)}</div>
              <p className="text-muted" style={{ fontSize: '13px', marginTop: '8px' }}>
                {lesson ? `Aim for ~${lesson.targetSeconds}s · min ${MIN}s` : `Min ${MIN}s · Max 11:00`}
                {phase === 'recording' && secs >= MIN && <span style={{ color: 'var(--accent)', marginLeft: '8px' }}>● Recording</span>}
              </p>
            </div>

            {phase === 'recording' && (
              <div style={{ maxWidth: '400px', margin: '0 auto 16px' }}>
                {/* For lessons the bar fills toward the target length, not the 11-min ceiling */}
                <div className="prog-track" style={{ position: 'relative' }}>
                  <div className="prog-fill" style={{
                    background: secs < MIN ? 'var(--hot)' : 'var(--accent)',
                    width: `${Math.min(100, (secs / (lesson ? lesson.targetSeconds : MAX)) * 100)}%`,
                    transition: 'width 1s linear',
                  }} />
                </div>
                {lesson && (
                  <p className="text-muted" style={{ fontSize: '11px', marginTop: '6px' }}>
                    {secs < MIN ? `${MIN - secs}s to minimum`
                      : secs < lesson.targetSeconds ? `${lesson.targetSeconds - secs}s to target`
                      : 'Target reached — wrap up when ready'}
                  </p>
                )}
              </div>
            )}

            {phase === 'recording' && speechSupported && liveTranscript && (
              <div className="anim-fade-in" style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '14px', padding: '12px 16px', marginBottom: '16px', maxWidth: '480px', margin: '0 auto 16px', textAlign: 'left' }}>
                <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent)', marginBottom: '6px' }}>LIVE TRANSCRIPT</p>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.6, maxHeight: '56px', overflow: 'hidden' }}>{liveTranscript.slice(-200)}</p>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
              <WaveBars count={30} active={phase === 'recording'} height={44} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
              <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                {phase === 'recording' && <><div className="pulse-ring" /><div className="pulse-ring pulse-ring-2" /></>}
                <button className={`rec-btn ${phase === 'recording' ? 'recording' : 'idle'}`} onClick={handleBtn}>
                  {phase === 'idle'
                    ? <svg width="44" height="44" viewBox="0 0 24 24" fill="none"><path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z" fill="#000" /><path d="M19 10v1a7 7 0 0 1-14 0v-1M12 19v3M8 22h8" stroke="#000" strokeWidth="2" strokeLinecap="round" /></svg>
                    : <div style={{ width: '28px', height: '28px', background: '#fff', borderRadius: '5px' }} />
                  }
                </button>
              </div>
            </div>
            <p className="text-muted" style={{ fontSize: '14px' }}>
              {phase === 'idle'
                ? (lesson ? `Tap for ${lesson.prepSeconds}s of think time` : 'Tap to start recording')
                : secs < MIN ? `Keep talking... (${MIN - secs}s minimum)` : 'Tap to stop'}
            </p>
            {tooShort && <p style={{ color: 'var(--hot)', fontSize: '13px', marginTop: '8px' }}>Minimum {MIN} seconds required</p>}
          </>
        )}

        {phase === 'playback' && audioUrl && (
          <>
            <audio ref={audioRef} src={audioUrl} />
            <div className="anim-slide-up anim-d1" style={{ marginBottom: '16px' }}>
              <div style={{ background: 'rgba(170,255,0,.05)', border: '1px solid rgba(170,255,0,.15)', borderRadius: '12px', padding: '10px 18px', display: 'inline-flex', gap: '8px', fontSize: '14px', alignItems: 'center' }}>
                <span style={{ color: 'var(--accent)' }}>✓</span> {fmt(duration)}
                {liveTranscript && <span style={{ color: 'var(--accent)', fontSize: '12px' }}>· {liveTranscript.split(/\s+/).filter(Boolean).length} words transcribed</span>}
              </div>
            </div>
            <h2 className="font-display anim-slide-up anim-d2" style={{ fontSize: 'clamp(26px,4vw,38px)', fontWeight: 900, letterSpacing: '-.04em', marginBottom: '8px' }}>Hear yourself back.</h2>
            <p className="text-muted anim-slide-up anim-d2" style={{ fontSize: '16px', marginBottom: '24px' }}>Listen before you rate yourself.</p>
            <div className="audio-player anim-slide-up anim-d3" style={{ marginBottom: '20px', textAlign: 'left' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                <button onClick={playPause} style={{ width: '52px', height: '52px', borderRadius: '50%', background: 'var(--accent)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {isPlaying
                    ? <svg width="18" height="18" viewBox="0 0 24 24" fill="#000"><rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" /></svg>
                    : <svg width="18" height="18" viewBox="0 0 24 24" fill="#000"><path d="M5 3l14 9-14 9V3z" /></svg>
                  }
                </button>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                    <span>{fmt(Math.round(playTime))}</span><span>{fmt(duration)}</span>
                  </div>
                  <input type="range" className="audio-progress" min={0} max={duration} step={0.1} value={playTime}
                    onChange={e => { const t = parseFloat(e.target.value); setPlayTime(t); if (audioRef.current) audioRef.current.currentTime = t }}
                    style={{ width: '100%' }} />
                </div>
              </div>
              <WaveBars count={20} active={isPlaying} height={28} color="#AAFF00" gap={3} />
            </div>
            <div className="anim-slide-up anim-d4" style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '12px' }}>
              <button className="btn btn-primary btn-lg btn-full" onClick={goNext}>Rate Yourself →</button>
              <button className="btn btn-outline btn-lg" onClick={recordAgain} style={{ padding: '18px 24px' }}>Re-record</button>
            </div>
          </>
        )}
      </div>
    </>
  )
}

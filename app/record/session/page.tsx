'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Nav from '@/components/Nav'
import WaveBars from '@/components/WaveBars'
import { getPendingSession, setPendingSession } from '@/lib/db'
import { audioStore } from '@/lib/audioStore'

const MAX = 660
function fmt(s: number) {
  return `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`
}

type Phase = 'perm' | 'idle' | 'recording' | 'playback'

// Filler words to detect
const FILLERS = ['um','uh','like','you know','basically','literally','right','so','actually','honestly','kind of','sort of','i mean','yeah','okay','well']

function analyzeTranscript(transcript: string, durationSecs: number, targetMin: number, targetMax: number) {
  const words = transcript.trim().split(/\s+/).filter(Boolean)
  const wordCount = words.length
  const pace = durationSecs > 0 ? Math.round((wordCount / durationSecs) * 60) : 0
  const lc = transcript.toLowerCase()

  let fillerCount = 0
  const foundFillers: string[] = []
  FILLERS.forEach(f => {
    const matches = lc.match(new RegExp(`\\b${f}\\b`, 'gi'))
    if (matches) {
      fillerCount += matches.length
      foundFillers.push(`${f} ×${matches.length}`)
    }
  })

  const lengthStatus: 'in-range' | 'too-short' | 'too-long' =
    durationSecs < 30 ? 'too-short' : durationSecs > 660 ? 'too-long' : 'in-range'

  let clarity = 100
  clarity -= Math.min(fillerCount * 5, 45)
  if (pace > targetMax + 20) clarity -= 15
  if (pace < targetMin - 20) clarity -= 10
  if (lengthStatus !== 'in-range') clarity -= 10
  clarity = Math.max(10, Math.min(100, clarity))

  return {
    wordCount, pace, fillerCount, fillerWords: foundFillers,
    lengthStatus, clarityScore: clarity,
    transcriptPreview: transcript.slice(0, 200) + (transcript.length > 200 ? '…' : ''),
    transcript,
  }
}

export default function RecordSessionPage() {
  const router = useRouter()
  const pending = getPendingSession()

  const [phase, setPhase]         = useState<Phase>('perm')
  const [secs, setSecs]           = useState(0)
  const [tooShort, setTooShort]   = useState(false)
  const [audioUrl, setAudioUrl]   = useState<string | null>(null)
  const [duration, setDuration]   = useState(0)
  const [playTime, setPlayTime]   = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [permErr, setPermErr]     = useState('')
  const [transcript, setTranscript] = useState('')
  const [speechSupported, setSpeechSupported] = useState(false)

  const mediaRef     = useRef<MediaRecorder | null>(null)
  const chunksRef    = useRef<Blob[]>([])
  const timerRef     = useRef<NodeJS.Timeout | null>(null)
  const audioRef     = useRef<HTMLAudioElement | null>(null)
  const playTimerRef = useRef<NodeJS.Timeout | null>(null)
  const finalSecs    = useRef(0)
  const recognitionRef = useRef<any>(null)
  const fullTranscriptRef = useRef('')

  useEffect(() => {
    // Check Web Speech API support
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    setSpeechSupported(!!SpeechRecognition)
    return () => {
      clearInterval(timerRef.current!)
      clearInterval(playTimerRef.current!)
    }
  }, [])

  const requestMic = async () => {
    setPermErr('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach(t => t.stop())
      setPhase('idle')
    } catch (e: any) {
      if (e.name === 'NotAllowedError') {
        setPermErr('Microphone access denied. Click the lock icon in your browser address bar → Microphone → Allow.')
      } else if (e.name === 'NotFoundError') {
        setPermErr('No microphone found. Please connect a microphone and try again.')
      } else {
        setPermErr('Could not access microphone: ' + e.message)
      }
    }
  }

  const startSpeechRecognition = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) return

    fullTranscriptRef.current = ''
    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'
    recognition.maxAlternatives = 1

    recognition.onresult = (event: any) => {
      let finalText = ''
      for (let i = 0; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalText += event.results[i][0].transcript + ' '
        }
      }
      if (finalText) {
        fullTranscriptRef.current += finalText
        setTranscript(fullTranscriptRef.current)
      }
    }

    recognition.onerror = (e: any) => {
      if (e.error !== 'no-speech' && e.error !== 'aborted') {
        console.log('Speech recognition error:', e.error)
      }
    }

    recognition.onend = () => {
      // Auto-restart if still recording
      if (mediaRef.current && mediaRef.current.state === 'recording') {
        try { recognition.start() } catch {}
      }
    }

    try {
      recognition.start()
      recognitionRef.current = recognition
    } catch {}
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
      const mime = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus' : 'audio/webm'
      const recorder = new MediaRecorder(stream, { mimeType: mime })
      chunksRef.current = []

      recorder.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      recorder.onstop = () => {
        stream.getTracks().forEach(t => t.stop())
        stopSpeechRecognition()
        const blob = new Blob(chunksRef.current, { type: mime })
        const url  = URL.createObjectURL(blob)
        audioStore.set(url, finalSecs.current, mime)
        setAudioUrl(url)
        setDuration(finalSecs.current)
        setPhase('playback')
      }

      recorder.start(100)
      mediaRef.current = recorder
      setPhase('recording')
      setSecs(0)
      finalSecs.current = 0
      setTooShort(false)
      fullTranscriptRef.current = ''
      setTranscript('')

      // Start speech recognition for real transcript
      if (speechSupported) startSpeechRecognition()

      timerRef.current = setInterval(() => {
        setSecs(prev => {
          const next = prev + 1
          finalSecs.current = next
          if (next >= MAX) { stopRec(); return MAX }
          return next
        })
      }, 1000)
    } catch (e: any) {
      setPermErr('Could not start recording: ' + e.message)
      setPhase('perm')
    }
  }

  const stopRec = () => {
    clearInterval(timerRef.current!)
    if (mediaRef.current && mediaRef.current.state !== 'inactive') {
      mediaRef.current.stop()
    }
  }

  const handleBtn = () => {
    if (phase === 'idle') startRec()
    else if (phase === 'recording') {
      if (secs < 30) { setTooShort(true) }
      else stopRec()
    }
  }

  const playPause = () => {
    if (!audioRef.current) return
    if (isPlaying) {
      audioRef.current.pause()
      clearInterval(playTimerRef.current!)
      setIsPlaying(false)
    } else {
      audioRef.current.play()
      setIsPlaying(true)
      playTimerRef.current = setInterval(() => {
        if (!audioRef.current) return
        setPlayTime(audioRef.current.currentTime)
        if (audioRef.current.ended) { setIsPlaying(false); clearInterval(playTimerRef.current!) }
      }, 200)
    }
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const t = parseFloat(e.target.value)
    setPlayTime(t)
    if (audioRef.current) audioRef.current.currentTime = t
  }

  const goAnalysis = () => {
    const p = getPendingSession() || {}
    const settings = { targetWpmMin: 140, targetWpmMax: 160 }
    const analysis = analyzeTranscript(fullTranscriptRef.current, duration, settings.targetWpmMin, settings.targetWpmMax)
    setPendingSession({ ...p, ...analysis, duration })
    router.push('/observe')
  }

  const recordAgain = () => {
    setPhase('idle'); setSecs(0); setTooShort(false)
    setPlayTime(0); setIsPlaying(false)
    audioStore.clear(); setAudioUrl(null)
    setTranscript(''); fullTranscriptRef.current = ''
  }

  const timerColor = phase === 'recording'
    ? (secs < 30 ? 'var(--hot)' : 'var(--accent)')
    : 'var(--text-muted)'

  return (
    <>
      <Nav backHref="/record" rightContent={<span className="text-muted" style={{ fontSize: '13px' }}>{pending?.category || 'Recording'}</span>} />
      <div className="container" style={{ textAlign: 'center' }}>
        <p className="eyebrow anim-slide-up anim-d1">STEP 1 OF 5 — VOICE</p>

        {/* Permission screen */}
        {phase === 'perm' && (
          <div className="mic-perm-box anim-slide-up anim-d2">
            <div style={{ fontSize: '64px', marginBottom: '20px' }}>🎙️</div>
            <h2 className="font-display" style={{ fontSize: '28px', fontWeight: 900, letterSpacing: '-.03em', marginBottom: '12px' }}>Microphone Access</h2>
            <p className="text-muted" style={{ fontSize: '15px', lineHeight: 1.65, marginBottom: '16px' }}>
              Vocalis needs your microphone to record your voice and analyze your speech in real time.
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
            <p className="text-muted" style={{ fontSize: '12px', marginTop: '14px' }}>Your audio is processed on your device</p>
          </div>
        )}

        {/* Recording phase */}
        {(phase === 'idle' || phase === 'recording') && (
          <>
            <div className="anim-slide-up anim-d2" style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '20px', padding: '28px 32px', marginBottom: '28px' }}>
              <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '.1em', color: 'var(--text-muted)', marginBottom: '12px' }}>YOUR PROMPT</p>
              <p style={{ fontSize: 'clamp(16px,2.2vw,22px)', fontWeight: 600, letterSpacing: '-.02em', lineHeight: 1.4 }}>
                &ldquo;{(pending as any)?.prompt || 'Tell me about yourself and one thing that makes you stand out.'}&rdquo;
              </p>
            </div>

            {/* Timer */}
            <div className="anim-slide-up anim-d3" style={{ marginBottom: '16px' }}>
              <div className="font-display" style={{ fontSize: 'clamp(56px,10vw,76px)', fontWeight: 900, letterSpacing: '-.05em', lineHeight: 1, color: timerColor, transition: 'color .3s' }}>
                {fmt(secs)}
              </div>
              <p className="text-muted" style={{ fontSize: '13px', marginTop: '8px' }}>
                Min 30s · Max 11:00
                {phase === 'recording' && secs >= 30 && <span style={{ color: 'var(--accent)', marginLeft: '8px' }}>● Recording</span>}
              </p>
            </div>

            {/* Progress bar */}
            {phase === 'recording' && (
              <div style={{ maxWidth: '400px', margin: '0 auto 20px' }}>
                <div className="prog-track">
                  <div className="prog-fill" style={{ background: secs < 30 ? 'var(--hot)' : 'var(--accent)', width: `${(secs / MAX) * 100}%`, transition: 'width 1s linear' }} />
                </div>
              </div>
            )}

            {/* Live transcript */}
            {phase === 'recording' && speechSupported && transcript && (
              <div className="anim-fade-in" style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '14px', padding: '14px 18px', marginBottom: '20px', maxWidth: '480px', margin: '0 auto 20px', textAlign: 'left' }}>
                <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent)', marginBottom: '6px', letterSpacing: '.08em' }}>LIVE TRANSCRIPT</p>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.6, maxHeight: '60px', overflow: 'hidden' }}>
                  {transcript.slice(-200)}
                </p>
              </div>
            )}

            {/* Wave */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '28px' }}>
              <WaveBars count={30} active={phase === 'recording'} height={44} />
            </div>

            {/* Record button */}
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
              {phase === 'idle' ? 'Tap to start recording' : secs < 30 ? `Keep talking... (${30 - secs}s to minimum)` : 'Tap to stop'}
            </p>
            {tooShort && <p style={{ color: 'var(--hot)', fontSize: '13px', marginTop: '8px' }}>Minimum 30 seconds required</p>}
            {phase === 'recording' && speechSupported && (
              <p style={{ fontSize: '12px', color: 'var(--accent)', marginTop: '8px', opacity: 0.7 }}>🎙 Transcribing in real time</p>
            )}
          </>
        )}

        {/* Playback phase */}
        {phase === 'playback' && audioUrl && (
          <>
            <audio ref={audioRef} src={audioUrl} />
            <div className="anim-slide-up anim-d1" style={{ marginBottom: '16px' }}>
              <div style={{ background: 'rgba(170,255,0,.05)', border: '1px solid rgba(170,255,0,.15)', borderRadius: '12px', padding: '10px 18px', display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                <span style={{ color: 'var(--accent)' }}>✓</span>
                Recording complete — <span style={{ fontWeight: 600 }}>{fmt(duration)}</span>
                {transcript && <span style={{ color: 'var(--accent)', fontSize: '12px' }}>· {transcript.split(/\s+/).filter(Boolean).length} words</span>}
              </div>
            </div>
            <h2 className="font-display anim-slide-up anim-d2" style={{ fontSize: 'clamp(26px,4vw,38px)', fontWeight: 900, letterSpacing: '-.04em', marginBottom: '8px' }}>Hear yourself back.</h2>
            <p className="text-muted anim-slide-up anim-d2" style={{ fontSize: '16px', marginBottom: '24px' }}>Listen before seeing your analysis.</p>

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
                  <input type="range" className="audio-progress" min={0} max={duration} step={0.1} value={playTime} onChange={handleSeek} style={{ width: '100%' }} />
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <WaveBars count={20} active={isPlaying} height={28} color="#AAFF00" gap={3} />
                <span className="text-muted" style={{ fontSize: '12px', marginLeft: '8px' }}>{isPlaying ? 'Playing...' : 'Paused'}</span>
              </div>
            </div>

            <div className="anim-slide-up anim-d4" style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '12px' }}>
              <button className="btn btn-primary btn-lg btn-full" onClick={goAnalysis}>See My Analysis →</button>
              <button className="btn btn-outline btn-lg" onClick={recordAgain} style={{ padding: '18px 24px' }}>Re-record</button>
            </div>
          </>
        )}
      </div>
    </>
  )
}

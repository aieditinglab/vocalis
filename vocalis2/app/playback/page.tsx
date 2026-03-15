'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Nav from '@/components/Nav'

const WAVEFORM_H = [8,14,22,18,32,24,12,28,36,18,26,14,34,20,16,28,40,12,24,18,30,10,22,16,28,20,32,16,24,10,30,18,26,12,34,20,16,28,22,14]

export default function PlaybackPage() {
  const router = useRouter()
  const [audioUrl, setAudioUrl]         = useState('')
  const [transcript, setTranscript]     = useState('')
  const [durationSecs, setDurationSecs] = useState(0)
  const [isPlaying, setIsPlaying]       = useState(false)
  const [currentTime, setCurrentTime]   = useState(0)
  const [audioDur, setAudioDur]         = useState(0)
  const [loaded, setLoaded]             = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    const url  = sessionStorage.getItem('vocalis_audioUrl')    || ''
    const tr   = sessionStorage.getItem('vocalis_transcript')  || ''
    const dur  = parseInt(sessionStorage.getItem('vocalis_duration') || '0')

    if (!url) { router.push('/record'); return }

    setAudioUrl(url)
    setTranscript(tr)
    setDurationSecs(dur)

    const audio = new Audio(url)
    audioRef.current = audio
    audio.onloadedmetadata = () => { setAudioDur(audio.duration); setLoaded(true) }
    audio.ontimeupdate = () => setCurrentTime(audio.currentTime)
    audio.onended      = () => setIsPlaying(false)
    audio.load()
  }, [router])

  const togglePlay = () => {
    const a = audioRef.current
    if (!a) return
    if (isPlaying) { a.pause(); setIsPlaying(false) }
    else           { a.play();  setIsPlaying(true) }
  }

  const seek = (pct: number) => {
    const a = audioRef.current
    if (!a) return
    a.currentTime = pct * (audioDur || durationSecs)
  }

  const fmtTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2,'0')}:${String(Math.floor(s % 60)).padStart(2,'0')}`

  const totalDur = audioDur || durationSecs
  const progress = totalDur > 0 ? (currentTime / totalDur) * 100 : 0

  return (
    <>
      <Nav backHref="/record/session" backLabel="← Re-record" />

      <div className="container" style={{ textAlign: 'center' }}>
        <p className="eyebrow anim-slide-up anim-d1">LISTEN BACK</p>
        <h1 className="font-display anim-slide-up anim-d2"
          style={{ fontSize: 'clamp(32px,4vw,48px)', fontWeight: 900, letterSpacing: '-0.04em', marginBottom: '8px' }}>
          How did that sound?
        </h1>
        <p className="text-muted anim-slide-up anim-d2" style={{ fontSize: '16px', marginBottom: '40px' }}>
          Listen before we analyze. Re-record if you want a better take.
        </p>

        {/* Audio player */}
        <div className="anim-slide-up anim-d3 card-flat" style={{ padding: '36px', marginBottom: '20px' }}>

          {/* Visual waveform */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px', height: '56px', marginBottom: '24px' }}>
            {WAVEFORM_H.map((h, i) => {
              const filled = (i / WAVEFORM_H.length) * 100 <= progress
              return (
                <div key={i} style={{
                  width: '3px', height: h + 'px', borderRadius: '2px',
                  background: filled ? 'var(--accent)' : 'var(--border-light)',
                  transition: 'background 0.08s',
                  flexShrink: 0,
                }} />
              )
            })}
          </div>

          {/* Seek bar */}
          <div
            style={{ background: 'var(--border-light)', borderRadius: '99px', height: '5px', marginBottom: '10px', cursor: 'pointer', position: 'relative' }}
            onClick={e => {
              const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
              seek((e.clientX - rect.left) / rect.width)
            }}
          >
            <div style={{ height: '100%', borderRadius: '99px', background: 'var(--accent)', width: progress + '%', transition: 'width 0.1s', pointerEvents: 'none' }} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '28px' }}>
            <span style={{ fontSize: '13px', color: 'var(--muted-mid)' }}>{fmtTime(currentTime)}</span>
            <span style={{ fontSize: '13px', color: 'var(--muted-mid)' }}>{fmtTime(totalDur)}</span>
          </div>

          {/* Play/Pause button */}
          <button
            onClick={togglePlay}
            disabled={!loaded}
            style={{
              width: '64px', height: '64px', borderRadius: '50%',
              background: loaded ? 'var(--accent)' : 'var(--border-light)',
              border: 'none', cursor: loaded ? 'pointer' : 'not-allowed',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto', transition: 'transform 0.2s',
            }}
            onMouseEnter={e => loaded && ((e.currentTarget as HTMLElement).style.transform = 'scale(1.07)')}
            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.transform = 'scale(1)')}
          >
            {isPlaying ? (
              <svg width="20" height="20" viewBox="0 0 24 24"><rect x="6" y="5" width="4" height="14" rx="2" fill="#000"/><rect x="14" y="5" width="4" height="14" rx="2" fill="#000"/></svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24"><path d="M8 5l11 7-11 7V5z" fill="#000"/></svg>
            )}
          </button>
        </div>

        {/* Transcript preview */}
        {transcript ? (
          <div className="anim-slide-up anim-d4 card-flat" style={{ padding: '24px', marginBottom: '24px', textAlign: 'left' }}>
            <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--muted-mid)', marginBottom: '12px' }}>
              TRANSCRIPT CAPTURED
            </p>
            <p style={{ fontSize: '14px', color: 'var(--white)', lineHeight: 1.7, fontWeight: 300 }}>{transcript}</p>
            <p style={{ fontSize: '12px', color: '#555', marginTop: '10px' }}>
              {transcript.split(/\s+/).filter(Boolean).length} words &nbsp;·&nbsp; {fmtTime(durationSecs)} recorded
            </p>
          </div>
        ) : (
          <div className="anim-slide-up anim-d4 card-flat" style={{ padding: '20px', marginBottom: '24px', textAlign: 'left', borderColor: 'rgba(255,184,0,0.2)' }}>
            <p style={{ fontSize: '14px', color: 'var(--amber)', lineHeight: 1.55 }}>
              ⚠️ No transcript was captured. This can happen in Safari or Firefox. Metric analysis will be based on duration only. For full analysis, use Chrome.
            </p>
          </div>
        )}

        {/* CTA row */}
        <div className="anim-slide-up anim-d5" style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '12px' }}>
          <button className="btn btn-primary btn-lg btn-full" onClick={() => router.push('/observe')}>
            Analyze This Recording →
          </button>
          <button className="btn btn-outline btn-lg" onClick={() => router.push('/record/session')} style={{ padding: '18px 24px' }}>
            Redo
          </button>
        </div>
      </div>
    </>
  )
}

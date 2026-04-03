'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

const TOTAL_MS = 48000

const SCENES = [
  { id: 'brand',      start: 0,     end: 3500  },
  { id: 'problem',    start: 3500,  end: 10500 },
  { id: 'practice',   start: 10500, end: 23000 },
  { id: 'processing', start: 23000, end: 26500 },
  { id: 'feedback',   start: 26500, end: 36000 },
  { id: 'progress',   start: 36000, end: 43000 },
  { id: 'outro',      start: 43000, end: 48000 },
]

const FULL_SCRIPT = `
Vocalis. AI-powered communication coaching for the next generation.

Here's the reality. Most teens are never taught how to speak with confidence.
Communication is the number one skill employers look for — and it's never formally taught in school.
Until now.

Here's how a single Vocalis session works. You get a real-world prompt —
the kind you'd face in a job interview, a class presentation, or a leadership role.
You hit record, and you speak naturally.
Vocalis listens to every single word in real time, capturing your clarity, your pace, and every filler word as you go.
As you speak, your words appear as a live transcript on screen.

When you stop, the analysis happens instantly.

You get a full coaching report — three scores across Clarity, Filler Words, and Confidence.
Each score comes with specific, written feedback.
Not just a number — a reason, and exactly what to work on next time.

And every session is tracked. You can watch your clarity score climb, rep by rep.
Your streak grows. You earn tokens. You level up.

This is what deliberate practice looks like for communication.
Train your voice. Own the room.
`.trim()

const PROMPT_TEXT = '"Describe a challenge you\'ve overcome, and what it taught you about yourself."'
const FEEDBACK_ITEMS = [
  { icon:'🎯', label:'Clarity Score',  score:92, delta:'+7 from last session', color:'#c8f53a', text:'Strong opening — your main point landed in the first two sentences. Avoid trailing off at the end of key ideas.' },
  { icon:'⚡', label:'Filler Words',   score:88, delta:'2 detected  ↓ from 9',  color:'#60a5fa', text:'"Um" appeared twice near the start. Replace with a confident pause — silence reads as authority.' },
  { icon:'🔥', label:'Confidence',     score:95, delta:'Personal best ↑',        color:'#f97316', text:'Vocal tone stayed steady throughout. No hesitation on key phrases. Your energy carried well.' },
]
const PROGRESS_DATA = [72, 68, 78, 85, 92]
const STATS = [
  { num:'68%', text:'of teens struggle to speak confidently in front of others' },
  { num:'#1',  text:'skill employers want — never formally taught in school' },
  { num:'0',   text:'AI coaches built for this problem. Until now.' },
]

// ─── Music: cinematic ambient electronic ────────────────────────────────────
// Inspired by lo-fi / chillhop: warm pads, soft kick, snare on 2&4, walking bass
// Key: A minor | BPM: 88 | Volume sits UNDER the voice comfortably

function createDemoMusic(ctx: AudioContext): () => void {
  const master = ctx.createGain()
  master.gain.setValueAtTime(0, ctx.currentTime)
  master.gain.linearRampToValueAtTime(0.22, ctx.currentTime + 3.5)
  master.connect(ctx.destination)

  // Reverb effect via convolver
  function makeReverb(duration = 1.8, decay = 2.5): ConvolverNode {
    const conv = ctx.createConvolver()
    const rate = ctx.sampleRate
    const len  = rate * duration
    const buf  = ctx.createBuffer(2, len, rate)
    for (let c = 0; c < 2; c++) {
      const d = buf.getChannelData(c)
      for (let i = 0; i < len; i++) {
        d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay)
      }
    }
    conv.buffer = buf
    return conv
  }

  const reverb   = makeReverb()
  const reverbGain = ctx.createGain()
  reverbGain.gain.value = 0.28
  reverb.connect(reverbGain)
  reverbGain.connect(master)

  const bpm  = 88
  const beat = 60 / bpm
  const bar  = beat * 4
  const totalBars = Math.ceil((TOTAL_MS / 1000) / bar) + 2

  // ── Warm pad (triangle waves, slightly detuned, through low-pass) ─────────
  function pad(freq: number, start: number, dur: number, vol: number) {
    const osc1   = ctx.createOscillator()
    const osc2   = ctx.createOscillator()
    const osc3   = ctx.createOscillator()
    const filter = ctx.createBiquadFilter()
    const env    = ctx.createGain()

    osc1.type = 'triangle'; osc1.frequency.value = freq
    osc2.type = 'triangle'; osc2.frequency.value = freq * 1.004
    osc3.type = 'sine';     osc3.frequency.value = freq * 0.5 // sub octave

    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(400, start)
    filter.frequency.linearRampToValueAtTime(700, start + 1.5)
    filter.Q.value = 0.7

    env.gain.setValueAtTime(0, start)
    env.gain.linearRampToValueAtTime(vol, start + 1.2)
    env.gain.setValueAtTime(vol, start + dur - 1.8)
    env.gain.linearRampToValueAtTime(0, start + dur)

    osc1.connect(filter); osc2.connect(filter); osc3.connect(filter)
    filter.connect(env)
    env.connect(master)
    env.connect(reverb)

    osc1.start(start); osc2.start(start); osc3.start(start)
    osc1.stop(start + dur); osc2.stop(start + dur); osc3.stop(start + dur)
  }

  // Am - G - F - C chord loop (root + 5th + octave)
  const chordFreqs = [
    [110,   165,   220],   // Am: A2 E3 A3
    [98,    147,   196],   // G:  G2 D3 G3
    [87.31, 130.81,174.61],// F:  F2 C3 F3
    [65.41, 98,    130.81],// C:  C2 G2 C3
  ]

  for (let i = 0; i < totalBars; i++) {
    const t = ctx.currentTime + i * bar
    const chord = chordFreqs[i % chordFreqs.length]
    chord.forEach((f, fi) => {
      const vols = [0.055, 0.035, 0.025]
      pad(f, t, bar + 0.3, vols[fi])
    })
  }

  // ── Melody / lead (soft sine, plays a gentle riff) ────────────────────────
  // Simple pentatonic A minor melody: A4-C5-E5-D5 pattern
  const melodyNotes = [440, 523.25, 659.25, 587.33, 440, 392, 440, 523.25]
  const melodyTiming = [0, beat*0.5, beat, beat*1.5, beat*2, beat*2.5, beat*3, beat*3.5]

  function melodyNote(freq: number, start: number, dur: number, vol: number) {
    const osc  = ctx.createOscillator()
    const env  = ctx.createGain()
    const filt = ctx.createBiquadFilter()
    osc.type = 'sine'; osc.frequency.value = freq
    filt.type = 'lowpass'; filt.frequency.value = 2000
    env.gain.setValueAtTime(0, start)
    env.gain.linearRampToValueAtTime(vol, start + 0.05)
    env.gain.setValueAtTime(vol, start + dur - 0.08)
    env.gain.linearRampToValueAtTime(0, start + dur)
    osc.connect(filt); filt.connect(env)
    env.connect(master)
    env.connect(reverb)
    osc.start(start); osc.stop(start + dur)
  }

  // Play melody every 2 bars starting from bar 1
  for (let i = 1; i < totalBars; i += 2) {
    const barStart = ctx.currentTime + i * bar
    melodyNotes.forEach((note, ni) => {
      melodyNote(note, barStart + melodyTiming[ni], beat * 0.42, 0.025)
    })
  }

  // ── Kick (punchy sine sweep) ──────────────────────────────────────────────
  function kick(t: number) {
    const osc = ctx.createOscillator()
    const env = ctx.createGain()
    osc.frequency.setValueAtTime(160, t)
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.32)
    env.gain.setValueAtTime(0.55, t)
    env.gain.exponentialRampToValueAtTime(0.001, t + 0.32)
    osc.connect(env); env.connect(master)
    osc.start(t); osc.stop(t + 0.32)
  }

  // ── Snare (noise + tone blend) ────────────────────────────────────────────
  function snare(t: number) {
    // Noise component
    const bufSize = Math.floor(ctx.sampleRate * 0.15)
    const buf     = ctx.createBuffer(1, bufSize, ctx.sampleRate)
    const data    = buf.getChannelData(0)
    for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1
    const noise = ctx.createBufferSource()
    const nFilt = ctx.createBiquadFilter()
    const nEnv  = ctx.createGain()
    noise.buffer = buf
    nFilt.type = 'bandpass'; nFilt.frequency.value = 2200; nFilt.Q.value = 0.8
    nEnv.gain.setValueAtTime(0.14, t)
    nEnv.gain.exponentialRampToValueAtTime(0.001, t + 0.15)
    noise.connect(nFilt); nFilt.connect(nEnv); nEnv.connect(master)
    noise.start(t); noise.stop(t + 0.15)

    // Tone component
    const tone  = ctx.createOscillator()
    const tEnv  = ctx.createGain()
    tone.frequency.setValueAtTime(220, t)
    tone.frequency.exponentialRampToValueAtTime(120, t + 0.12)
    tEnv.gain.setValueAtTime(0.08, t)
    tEnv.gain.exponentialRampToValueAtTime(0.001, t + 0.12)
    tone.connect(tEnv); tEnv.connect(master)
    tone.start(t); tone.stop(t + 0.12)
  }

  // ── Hi-hat (crisp, short) ─────────────────────────────────────────────────
  function hat(t: number, vol = 0.055, open = false) {
    const bufSize = Math.floor(ctx.sampleRate * (open ? 0.08 : 0.025))
    const buf     = ctx.createBuffer(1, bufSize, ctx.sampleRate)
    const data    = buf.getChannelData(0)
    for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1
    const src   = ctx.createBufferSource()
    const filt  = ctx.createBiquadFilter()
    const env   = ctx.createGain()
    src.buffer  = buf
    filt.type   = 'highpass'; filt.frequency.value = 9000
    env.gain.setValueAtTime(vol, t)
    env.gain.exponentialRampToValueAtTime(0.001, t + bufSize / ctx.sampleRate)
    src.connect(filt); filt.connect(env); env.connect(master)
    src.start(t); src.stop(t + bufSize / ctx.sampleRate)
  }

  // ── Walking bass line (sine, punchy) ──────────────────────────────────────
  function bass(freq: number, t: number, dur: number) {
    const osc   = ctx.createOscillator()
    const dist  = ctx.createWaveShaper()
    const env   = ctx.createGain()
    const filt  = ctx.createBiquadFilter()

    // Very mild saturation for warmth
    const curve = new Float32Array(256)
    for (let i = 0; i < 256; i++) {
      const x = (i * 2) / 256 - 1
      curve[i] = (Math.PI + 8) * x / (Math.PI + 8 * Math.abs(x))
    }
    dist.curve = curve

    osc.type = 'sine'; osc.frequency.value = freq
    filt.type = 'lowpass'; filt.frequency.value = 280

    env.gain.setValueAtTime(0, t)
    env.gain.linearRampToValueAtTime(0.2, t + 0.025)
    env.gain.setValueAtTime(0.2, t + dur - 0.05)
    env.gain.linearRampToValueAtTime(0, t + dur)

    osc.connect(dist); dist.connect(filt); filt.connect(env); env.connect(master)
    osc.start(t); osc.stop(t + dur)
  }

  // Bass walk: A-G-F-C per bar, subdivided
  const bassWalks = [
    [55, 49],       // Am bar: A1, G1
    [49, 43.65],    // G bar:  G1, F1
    [43.65, 65.41], // F bar:  F1, C2
    [65.41, 55],    // C bar:  C2, A1
  ]

  for (let i = 0; i < totalBars; i++) {
    const t  = ctx.currentTime + i * bar
    const bw = bassWalks[i % bassWalks.length]

    // Kick: beat 1 + beat 3, with occasional ghost on beat 2.5
    kick(t)
    kick(t + beat * 2)
    if (i % 4 === 2) kick(t + beat * 2.5) // variation every 4th bar

    // Snare: beat 2 + beat 4 (classic backbeat)
    snare(t + beat)
    snare(t + beat * 3)

    // Hi-hats: every 8th note, open hat on beat 3 every other bar
    for (let h = 0; h < 8; h++) {
      const isOpen = h === 4 && i % 2 === 1
      hat(t + h * (beat / 2), h % 2 === 0 ? 0.06 : 0.03, isOpen)
    }

    // Bass: two notes per bar
    bass(bw[0], t,              beat * 1.85)
    bass(bw[1], t + beat * 2,   beat * 1.85)
  }

  // Fade out
  return () => {
    master.gain.cancelScheduledValues(ctx.currentTime)
    master.gain.setValueAtTime(master.gain.value, ctx.currentTime)
    master.gain.linearRampToValueAtTime(0, ctx.currentTime + 2.5)
  }
}

// ─── Scene Components ─────────────────────────────────────────────────────────

function SceneBrand({ v }: { v:boolean }) {
  return (
    <div style={{ position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',opacity:v?1:0,transition:'opacity 0.5s ease' }}>
      <div style={{ display:'flex',alignItems:'center',gap:16,transform:v?'scale(1)':'scale(0.8)',transition:'transform 0.6s cubic-bezier(0.34,1.56,0.64,1)',marginBottom:20 }}>
        <div style={{ width:56,height:56,background:'#c8f53a',borderRadius:14,display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 0 36px rgba(200,245,58,0.4)',flexShrink:0 }}>
          <div style={{ display:'flex',gap:4,alignItems:'center' }}>
            {[12,20,26,20,12].map((h,i)=><div key={i} style={{ width:4,height:h,background:'#0a0a0a',borderRadius:2 }}/>)}
          </div>
        </div>
        <span style={{ fontSize:'clamp(36px,5vw,62px)',fontWeight:900,color:'#fff',letterSpacing:-3,lineHeight:1 }}>Vocalis</span>
      </div>
      <div style={{ height:2,background:'linear-gradient(90deg,#c8f53a,transparent)',width:v?300:0,transition:'width 0.8s ease 0.4s',marginBottom:18 }}/>
      <p style={{ fontSize:'clamp(10px,1.4vw,12px)',fontWeight:600,color:'rgba(255,255,255,0.38)',letterSpacing:6,textTransform:'uppercase',opacity:v?1:0,transition:'opacity 0.5s ease 0.7s',textAlign:'center' }}>
        AI Communication Coaching
      </p>
    </div>
  )
}

function SceneProblem({ v, e }: { v:boolean; e:number }) {
  return (
    <div style={{ position:'absolute',inset:0,display:'flex',flexDirection:'column',justifyContent:'center',padding:'0 clamp(16px,5%,60px)',opacity:v?1:0,transition:'opacity 0.5s ease' }}>
      <div style={{ fontSize:'clamp(9px,1.2vw,11px)',fontWeight:700,letterSpacing:5,color:'#c8f53a',textTransform:'uppercase',marginBottom:18 }}>The Problem</div>
      <div style={{ display:'flex',flexDirection:'column',gap:12 }}>
        {STATS.map((s,i)=>{
          const show=e>i*1800
          return (
            <div key={i} style={{ display:'flex',alignItems:'flex-start',gap:14,opacity:show?1:0,transform:show?'translateX(0)':'translateX(-24px)',transition:'all 0.5s ease' }}>
              <div style={{ minWidth:52,fontSize:'clamp(22px,3.5vw,36px)',fontWeight:900,color:'#c8f53a',lineHeight:1,letterSpacing:-2,flexShrink:0 }}>{s.num}</div>
              <div style={{ fontSize:'clamp(10px,1.4vw,13px)',color:'rgba(255,255,255,0.5)',lineHeight:1.6,paddingTop:4 }}>{s.text}</div>
            </div>
          )
        })}
      </div>
      <div style={{ marginTop:22,paddingTop:16,borderTop:'1px solid rgba(255,255,255,0.07)',opacity:e>5500?1:0,transition:'opacity 0.5s ease',display:'flex',alignItems:'center',gap:10 }}>
        <div style={{ width:7,height:7,borderRadius:'50%',background:'#c8f53a',boxShadow:'0 0 8px rgba(200,245,58,0.9)',flexShrink:0 }}/>
        <span style={{ fontSize:'clamp(11px,1.5vw,14px)',fontWeight:700,color:'#fff' }}>Here's how one Vocalis rep works.</span>
      </div>
    </div>
  )
}

function ScenePractice({ v, e }: { v:boolean; e:number }) {
  const promptVisible=e>400
  const charCount=Math.floor(Math.max(0,Math.min((e-600)/2800,1))*PROMPT_TEXT.length)
  const btnVisible=e>2800
  const isRecording=e>3800
  const recMs=Math.max(0,e-3800)
  const showTranscript=e>5400
  const WORDS=['I','think','the','biggest','challenge','I','ever','faced','was','learning','to','speak','up','without','second-guessing','myself','every','single','time...']
  const wordCount=showTranscript?Math.min(Math.floor((e-5400)/170),WORDS.length):0
  const t=Date.now()/1000
  return (
    <div style={{ position:'absolute',inset:0,display:'flex',flexDirection:'column',justifyContent:'center',padding:'0 clamp(14px,4%,52px)',opacity:v?1:0,transition:'opacity 0.5s ease',gap:8 }}>
      <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:2 }}>
        <div style={{ width:20,height:20,borderRadius:'50%',background:'rgba(200,245,58,0.15)',border:'1px solid rgba(200,245,58,0.4)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
          <span style={{ fontSize:10,fontWeight:800,color:'#c8f53a' }}>1</span>
        </div>
        <span style={{ fontSize:'clamp(9px,1.1vw,11px)',fontWeight:700,letterSpacing:5,color:'#c8f53a',textTransform:'uppercase' }}>Record Your Rep</span>
      </div>
      <div style={{ background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.09)',borderRadius:12,padding:'clamp(10px,1.8%,16px)',opacity:promptVisible?1:0,transform:promptVisible?'translateY(0)':'translateY(16px)',transition:'all 0.4s ease' }}>
        <div style={{ fontSize:'clamp(8px,1vw,10px)',fontWeight:700,color:'rgba(255,255,255,0.25)',letterSpacing:4,textTransform:'uppercase',marginBottom:7 }}>Today's Prompt</div>
        <div style={{ fontSize:'clamp(10px,1.5vw,14px)',fontWeight:600,color:'#fff',lineHeight:1.55 }}>
          {PROMPT_TEXT.slice(0,charCount)}<span style={{ color:'#c8f53a',opacity:!isRecording&&Math.floor(Date.now()/500)%2===0?1:0 }}>|</span>
        </div>
      </div>
      <div style={{ background:isRecording?'rgba(200,245,58,0.04)':'rgba(255,255,255,0.03)',border:isRecording?'1px solid rgba(200,245,58,0.2)':'1px solid rgba(255,255,255,0.07)',borderRadius:12,padding:'clamp(9px,1.6%,14px)',opacity:btnVisible?1:0,transition:'all 0.4s ease' }}>
        <div style={{ display:'flex',alignItems:'center',gap:2.5,height:30,marginBottom:9 }}>
          {Array.from({length:46}).map((_,i)=>{
            const h=5+(isRecording?24:3)*Math.abs(Math.sin(t*4+i*0.65))
            return <div key={i} style={{ flex:1,height:h,borderRadius:2,background:isRecording?'#c8f53a':'rgba(200,245,58,0.15)',transition:'height 0.07s' }}/>
          })}
        </div>
        <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between' }}>
          <div style={{ display:'flex',alignItems:'center',gap:8 }}>
            <div style={{ width:30,height:30,borderRadius:'50%',background:isRecording?'#c8f53a':'rgba(200,245,58,0.1)',border:isRecording?'none':'2px solid rgba(200,245,58,0.25)',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:isRecording?'0 0 18px rgba(200,245,58,0.45)':'none',transition:'all 0.3s',flexShrink:0 }}>
              {isRecording?<div style={{ width:9,height:9,background:'#0a0a0a',borderRadius:2 }}/>:<div style={{ width:11,height:11,background:'#c8f53a',borderRadius:'50%' }}/>}
            </div>
            <div>
              <div style={{ fontSize:'clamp(10px,1.4vw,12px)',fontWeight:700,color:isRecording?'#c8f53a':'rgba(255,255,255,0.4)',lineHeight:1 }}>{isRecording?'● Recording...':'Tap to Record'}</div>
              {isRecording&&<div style={{ fontSize:'clamp(9px,1.1vw,10px)',color:'rgba(255,255,255,0.25)',marginTop:2 }}>Speaking naturally</div>}
            </div>
          </div>
          {isRecording&&<span style={{ fontSize:'clamp(12px,1.6vw,15px)',fontWeight:800,color:'rgba(255,255,255,0.2)',fontVariantNumeric:'tabular-nums' }}>{String(Math.floor(recMs/1000)).padStart(2,'0')}:{String(Math.floor((recMs%1000)/10)).padStart(2,'0')}</span>}
        </div>
      </div>
      {showTranscript&&(
        <div style={{ background:'rgba(200,245,58,0.03)',border:'1px solid rgba(200,245,58,0.1)',borderRadius:10,padding:'clamp(8px,1.2%,11px) clamp(10px,1.5%,13px)' }}>
          <div style={{ fontSize:'clamp(8px,1vw,9px)',fontWeight:700,color:'rgba(200,245,58,0.5)',letterSpacing:4,textTransform:'uppercase',marginBottom:5 }}>Live Transcript</div>
          <div style={{ fontSize:'clamp(9px,1.2vw,12px)',color:'rgba(255,255,255,0.48)',lineHeight:1.55 }}>
            {WORDS.slice(0,wordCount).join(' ')}{wordCount<WORDS.length&&<span style={{ color:'#c8f53a',opacity:Math.floor(Date.now()/400)%2===0?1:0 }}> |</span>}
          </div>
        </div>
      )}
    </div>
  )
}

function SceneProcessing({ v, e }: { v:boolean; e:number }) {
  const t=Date.now()/1000
  const steps=[
    { label:'Transcribing audio',         done:e>700  },
    { label:'Analyzing speech patterns',  done:e>1500 },
    { label:'Generating coaching report', done:e>2400 },
  ]
  return (
    <div style={{ position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',opacity:v?1:0,transition:'opacity 0.5s ease',gap:22 }}>
      <div style={{ position:'relative',width:64,height:64 }}>
        <div style={{ position:'absolute',inset:0,borderRadius:'50%',background:'rgba(200,245,58,0.1)',transform:`scale(${1+0.16*Math.sin(t*3)})`,transition:'transform 0.05s' }}/>
        <div style={{ position:'absolute',inset:7,borderRadius:'50%',background:'#c8f53a',display:'flex',alignItems:'center',justifyContent:'center' }}>
          <div style={{ display:'flex',gap:3,alignItems:'center' }}>
            {Array.from({length:5}).map((_,i)=>{
              const h=7+11*Math.abs(Math.sin(t*4.5+i*0.9))
              return <div key={i} style={{ width:3,height:h,background:'#0a0a0a',borderRadius:2,transition:'height 0.06s' }}/>
            })}
          </div>
        </div>
      </div>
      <div style={{ display:'flex',flexDirection:'column',gap:10,minWidth:clamp(180,220) }}>
        {steps.map((s,i)=>(
          <div key={i} style={{ display:'flex',alignItems:'center',gap:10,opacity:e>i*800?1:0.15,transition:'opacity 0.4s ease' }}>
            <div style={{ width:18,height:18,borderRadius:'50%',background:s.done?'#c8f53a':'rgba(255,255,255,0.08)',border:s.done?'none':'2px solid rgba(255,255,255,0.15)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,transition:'all 0.3s' }}>
              {s.done&&<svg width="9" height="9" viewBox="0 0 10 10"><polyline points="1.5,5 4,7.5 8.5,2.5" fill="none" stroke="#0a0a0a" strokeWidth="1.8" strokeLinecap="round"/></svg>}
            </div>
            <span style={{ fontSize:'clamp(10px,1.4vw,12px)',color:s.done?'#fff':'rgba(255,255,255,0.35)',fontWeight:s.done?600:400,transition:'all 0.3s' }}>{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function clamp(min: number, max: number) { return `clamp(${min}px, 30%, ${max}px)` }

function SceneFeedback({ v, e }: { v:boolean; e:number }) {
  return (
    <div style={{ position:'absolute',inset:0,display:'flex',flexDirection:'column',justifyContent:'center',padding:'0 clamp(14px,4%,52px)',opacity:v?1:0,transition:'opacity 0.5s ease' }}>
      <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12,flexWrap:'wrap',gap:7 }}>
        <div style={{ display:'flex',alignItems:'center',gap:8 }}>
          <div style={{ width:20,height:20,borderRadius:'50%',background:'rgba(200,245,58,0.15)',border:'1px solid rgba(200,245,58,0.4)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
            <span style={{ fontSize:10,fontWeight:800,color:'#c8f53a' }}>2</span>
          </div>
          <div>
            <div style={{ fontSize:'clamp(9px,1.1vw,11px)',fontWeight:700,letterSpacing:5,color:'#c8f53a',textTransform:'uppercase' }}>AI Coaching Report</div>
            <div style={{ fontSize:'clamp(14px,2.2vw,22px)',fontWeight:900,color:'#fff',letterSpacing:-1,lineHeight:1.1 }}>Your breakdown.</div>
          </div>
        </div>
        <div style={{ background:'rgba(200,245,58,0.07)',border:'1px solid rgba(200,245,58,0.18)',borderRadius:100,padding:'4px 11px',display:'flex',alignItems:'center',gap:6 }}>
          <div style={{ width:5,height:5,borderRadius:'50%',background:'#c8f53a',boxShadow:'0 0 5px rgba(200,245,58,0.9)' }}/>
          <span style={{ fontSize:'clamp(9px,1.1vw,10px)',fontWeight:700,color:'#c8f53a' }}>Analysis Complete</span>
        </div>
      </div>
      <div style={{ display:'flex',flexDirection:'column',gap:7 }}>
        {FEEDBACK_ITEMS.map((item,i)=>{
          const delay=i*1800
          const show=e>delay
          const barPct=show?Math.min(Math.max(0,(e-delay-500)/1000),1)*item.score:0
          return (
            <div key={item.label} style={{ background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:12,padding:'clamp(9px,1.4%,13px) clamp(11px,1.8%,17px)',opacity:show?1:0,transform:show?'translateY(0)':'translateY(14px)',transition:`opacity 0.4s ease ${delay*0.001}s,transform 0.4s ease ${delay*0.001}s` }}>
              <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:6,gap:8 }}>
                <div style={{ display:'flex',alignItems:'center',gap:7,flex:1 }}>
                  <span style={{ fontSize:14 }}>{item.icon}</span>
                  <div>
                    <div style={{ fontSize:'clamp(10px,1.3vw,12px)',fontWeight:700,color:'#fff',lineHeight:1 }}>{item.label}</div>
                    <div style={{ fontSize:'clamp(9px,1.1vw,10px)',color:item.color,fontWeight:600,marginTop:1 }}>{item.delta}</div>
                  </div>
                </div>
                <span style={{ fontSize:'clamp(16px,2vw,20px)',fontWeight:900,color:item.color,letterSpacing:-1 }}>{Math.round(barPct)}</span>
              </div>
              <div style={{ height:2.5,background:'rgba(255,255,255,0.07)',borderRadius:2,marginBottom:6,overflow:'hidden' }}>
                <div style={{ height:'100%',width:`${barPct}%`,background:`linear-gradient(90deg,${item.color},${item.color}77)`,borderRadius:2,transition:'width 0.9s ease' }}/>
              </div>
              <div style={{ fontSize:'clamp(9px,1.1vw,11px)',color:'rgba(255,255,255,0.35)',lineHeight:1.45 }}>{item.text}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function SceneProgress({ v, e }: { v:boolean; e:number }) {
  const rp=Math.min(e/2200,1)
  const num=Math.round(65+rp*27)
  const C=2*Math.PI*72
  return (
    <div style={{ position:'absolute',inset:0,display:'flex',flexDirection:'column',justifyContent:'center',padding:'0 clamp(14px,4%,52px)',opacity:v?1:0,transition:'opacity 0.5s ease' }}>
      <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:14 }}>
        <div style={{ width:20,height:20,borderRadius:'50%',background:'rgba(200,245,58,0.15)',border:'1px solid rgba(200,245,58,0.4)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
          <span style={{ fontSize:10,fontWeight:800,color:'#c8f53a' }}>3</span>
        </div>
        <span style={{ fontSize:'clamp(9px,1.1vw,11px)',fontWeight:700,letterSpacing:5,color:'#c8f53a',textTransform:'uppercase' }}>Track Your Progress</span>
      </div>
      <div style={{ display:'flex',gap:'clamp(10px,3%,22px)',alignItems:'flex-start',flexWrap:'wrap' }}>
        <div style={{ display:'flex',flexDirection:'column',alignItems:'center',gap:9,minWidth:110 }}>
          <div style={{ position:'relative',width:130,height:130 }}>
            <div style={{ position:'absolute',inset:0,borderRadius:'50%',background:'radial-gradient(circle,rgba(200,245,58,0.1) 0%,transparent 65%)' }}/>
            <svg width="130" height="130" style={{ position:'absolute',inset:0,transform:'rotate(-90deg)' }}>
              <circle cx="65" cy="65" r="72" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5"/>
              <circle cx="65" cy="65" r="72" fill="none" stroke="#c8f53a" strokeWidth="5" strokeDasharray={C} strokeDashoffset={C*(1-rp*0.94)} strokeLinecap="round"/>
            </svg>
            <div style={{ position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center' }}>
              <span style={{ fontSize:'clamp(30px,4vw,40px)',fontWeight:900,color:'#fff',letterSpacing:-3,lineHeight:1 }}>{num}</span>
              <span style={{ fontSize:'clamp(9px,1.1vw,10px)',color:'rgba(255,255,255,0.3)',letterSpacing:1 }}>/100</span>
            </div>
          </div>
          <div style={{ textAlign:'center' }}>
            <div style={{ fontSize:'clamp(10px,1.3vw,12px)',fontWeight:700,color:'#fff' }}>Clarity Score</div>
            <div style={{ fontSize:'clamp(9px,1.1vw,10px)',color:'rgba(255,255,255,0.35)',marginTop:1 }}>This session</div>
          </div>
          <div style={{ background:'#c8f53a',borderRadius:100,padding:'5px 12px',fontSize:'clamp(9px,1.2vw,11px)',fontWeight:800,color:'#0a0a0a',opacity:e>1800?1:0,transform:e>1800?'scale(1)':'scale(0.8)',transition:'all 0.4s cubic-bezier(0.34,1.56,0.64,1)' }}>
            🏆 Personal Best
          </div>
        </div>
        <div style={{ flex:1,display:'flex',flexDirection:'column',gap:8,minWidth:120 }}>
          <div style={{ background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:11,padding:'clamp(10px,1.5%,13px) clamp(12px,1.8%,15px)',opacity:e>2400?1:0,transform:e>2400?'translateY(0)':'translateY(10px)',transition:'all 0.5s ease' }}>
            <div style={{ fontSize:'clamp(8px,1vw,9px)',fontWeight:600,color:'rgba(255,255,255,0.3)',letterSpacing:3,textTransform:'uppercase',marginBottom:9 }}>Last 5 Sessions</div>
            <div style={{ display:'flex',alignItems:'flex-end',gap:4,height:40 }}>
              {PROGRESS_DATA.map((val,i)=>{
                const h=(val/100)*40
                const isLast=i===PROGRESS_DATA.length-1
                const delay=i*140
                const shown=e>2500+delay
                return (
                  <div key={i} style={{ flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:3 }}>
                    <div style={{ width:'100%',height:shown?h:0,background:isLast?'#c8f53a':'rgba(200,245,58,0.25)',borderRadius:3,transition:`height 0.5s ease ${delay}ms`,boxShadow:isLast?'0 0 8px rgba(200,245,58,0.35)':'none' }}/>
                    <span style={{ fontSize:'clamp(8px,1vw,9px)',color:isLast?'#c8f53a':'rgba(255,255,255,0.2)',fontWeight:isLast?700:400 }}>{val}</span>
                  </div>
                )
              })}
            </div>
          </div>
          <div style={{ display:'flex',gap:7 }}>
            {[{e:'🔥',n:'5',l:'Day streak',c:'#fff',d:3200},{e:'🪙',n:'+20',l:'Tokens',c:'#c8f53a',d:3500},{e:'📈',n:'↑23',l:'All time',c:'#60a5fa',d:3800}].map((s,i)=>(
              <div key={i} style={{ flex:1,background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:10,padding:'clamp(8px,1.2%,11px) clamp(9px,1.3%,12px)',opacity:e>s.d?1:0,transition:`opacity 0.4s ease ${i*0.1}s` }}>
                <div style={{ fontSize:14 }}>{s.e}</div>
                <div style={{ fontSize:'clamp(14px,2vw,18px)',fontWeight:900,color:s.c,letterSpacing:-1,marginTop:2 }}>{s.n}</div>
                <div style={{ fontSize:'clamp(8px,1vw,10px)',color:'rgba(255,255,255,0.32)',marginTop:1 }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function SceneOutro({ v }: { v:boolean }) {
  return (
    <div style={{ position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',opacity:v?1:0,transition:'opacity 0.6s ease' }}>
      <div style={{ position:'absolute',inset:0,background:'radial-gradient(ellipse 60% 50% at 50% 50%,rgba(200,245,58,0.09) 0%,transparent 70%)' }}/>
      <div style={{ fontSize:'clamp(38px,6.5vw,72px)',fontWeight:900,color:'#fff',letterSpacing:-4,lineHeight:0.92,textAlign:'center',marginBottom:14,transform:v?'translateY(0)':'translateY(28px)',transition:'transform 0.7s cubic-bezier(0.34,1.56,0.64,1) 0.1s' }}>
        Own <span style={{ color:'#c8f53a' }}>the</span><br/>room.
      </div>
      <div style={{ fontSize:'clamp(9px,1.2vw,11px)',color:'rgba(255,255,255,0.25)',letterSpacing:5,textTransform:'uppercase',marginBottom:24,opacity:v?1:0,transition:'opacity 0.5s ease 0.4s' }}>vocalis-zeta.vercel.app</div>
      <div style={{ display:'flex',alignItems:'center',gap:14,opacity:v?1:0,transition:'opacity 0.5s ease 0.7s' }}>
        <div style={{ display:'flex',alignItems:'center',gap:9 }}>
          <div style={{ width:30,height:30,background:'#c8f53a',borderRadius:7,display:'flex',alignItems:'center',justifyContent:'center' }}>
            <div style={{ display:'flex',gap:2.5,alignItems:'center' }}>
              {[7,12,16,12,7].map((h,i)=><div key={i} style={{ width:2.5,height:h,background:'#0a0a0a',borderRadius:1.5 }}/>)}
            </div>
          </div>
          <span style={{ fontSize:'clamp(18px,2.5vw,22px)',fontWeight:900,color:'#fff',letterSpacing:-1 }}>Vocalis</span>
        </div>
        <div style={{ width:1,height:20,background:'rgba(255,255,255,0.1)' }}/>
        <span style={{ fontSize:'clamp(10px,1.3vw,12px)',color:'rgba(255,255,255,0.4)',fontWeight:500 }}>Start free today →</span>
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function HowItWorksSection() {
  const sectionRef   = useRef<HTMLDivElement>(null)
  const rafRef       = useRef<number>(0)
  const startTimeRef = useRef<number>(0)
  const audioRef     = useRef<HTMLAudioElement|null>(null)
  const audioCtxRef  = useRef<AudioContext|null>(null)
  const stopMusicRef = useRef<(()=>void)|null>(null)

  const [started,      setStarted]      = useState(false)
  const [audioReady,   setAudioReady]   = useState(false)
  const [elapsed,      setElapsed]      = useState(0)
  const [sceneId,      setSceneId]      = useState('brand')
  const [sceneElapsed, setSceneElapsed] = useState(0)
  const [,             forceRender]     = useState(0)

  useEffect(()=>{
    let dead=false
    async function go() {
      try {
        const r=await fetch('/api/narrate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text:FULL_SCRIPT})})
        if (!r.ok) return
        const blob=await r.blob()
        const a=new Audio(URL.createObjectURL(blob))
        a.preload='auto'
        if (!dead){audioRef.current=a;setAudioReady(true)}
      } catch {}
    }
    go()
    return ()=>{dead=true}
  },[])

  const rafTick=useCallback(()=>{
    const ms=Math.min(Date.now()-startTimeRef.current,TOTAL_MS)
    setElapsed(ms)
    const s=SCENES.find(x=>ms>=x.start&&ms<x.end)??SCENES[SCENES.length-1]
    setSceneId(s.id); setSceneElapsed(ms-s.start); forceRender(n=>n+1)
    if (ms<TOTAL_MS) rafRef.current=requestAnimationFrame(rafTick)
    else if (stopMusicRef.current) stopMusicRef.current()
  },[])

  const startDemo=useCallback(()=>{
    cancelAnimationFrame(rafRef.current)
    window.speechSynthesis?.cancel()
    if (audioRef.current){audioRef.current.pause();audioRef.current.currentTime=0}
    if (stopMusicRef.current) stopMusicRef.current()
    if (audioCtxRef.current) audioCtxRef.current.close()

    startTimeRef.current=Date.now()
    setElapsed(0); setSceneId('brand'); setSceneElapsed(0); setStarted(true)
    rafRef.current=requestAnimationFrame(rafTick)

    // Start music
    try {
      const ctx=new (window.AudioContext||(window as any).webkitAudioContext)()
      audioCtxRef.current=ctx
      stopMusicRef.current=createDemoMusic(ctx)
    } catch {}

    // Play voice over music
    if (audioReady&&audioRef.current) {
      audioRef.current.play().catch(()=>{})
    } else if ('speechSynthesis' in window) {
      const u=new SpeechSynthesisUtterance(FULL_SCRIPT)
      u.rate=0.9; u.pitch=1.05; u.volume=1.0
      const trySpeak=()=>{
        const voices=window.speechSynthesis.getVoices()
        const pref=voices.find(v=>v.lang==='en-US'&&!v.localService)??voices.find(v=>v.lang.startsWith('en'))??voices[0]
        if (pref) u.voice=pref
        window.speechSynthesis.speak(u)
      }
      if (window.speechSynthesis.getVoices().length>0) trySpeak()
      else{window.speechSynthesis.onvoiceschanged=()=>{window.speechSynthesis.onvoiceschanged=null;trySpeak()}}
    }
  },[rafTick,audioReady])

  useEffect(()=>{
    const obs=new IntersectionObserver(([e])=>{if(e.isIntersecting&&!started)startDemo()},{threshold:0.5})
    if (sectionRef.current) obs.observe(sectionRef.current)
    return ()=>obs.disconnect()
  },[started,startDemo])

  useEffect(()=>()=>{
    cancelAnimationFrame(rafRef.current)
    if (audioRef.current) audioRef.current.pause()
    if (stopMusicRef.current) stopMusicRef.current()
    if (audioCtxRef.current) audioCtxRef.current.close()
    window.speechSynthesis?.cancel()
  },[])

  const STEP_LABELS=[{id:'practice',label:'① Record'},{id:'feedback',label:'② Get feedback'},{id:'progress',label:'③ Track progress'}]

  return (
    <section id="how-it-works" ref={sectionRef} style={{ position:'relative',padding:'clamp(48px,8vw,100px) clamp(16px,5vw,40px)',background:'#0a0a0a',overflow:'hidden' }}>
      <div style={{ position:'absolute',left:'50%',top:'25%',transform:'translate(-50%,-50%)',width:'80vw',height:'80vw',maxWidth:900,maxHeight:900,borderRadius:'50%',background:'radial-gradient(circle,rgba(200,245,58,0.04) 0%,transparent 65%)',pointerEvents:'none' }}/>

      <div style={{ maxWidth:1020,margin:'0 auto',position:'relative',zIndex:1 }}>
        {/* Header */}
        <div style={{ marginBottom:28,display:'flex',alignItems:'flex-end',justifyContent:'space-between',flexWrap:'wrap',gap:14 }}>
          <div>
            <p style={{ fontSize:11,fontWeight:700,letterSpacing:'0.35em',color:'#c8f53a',textTransform:'uppercase',margin:'0 0 8px' }}>See It In Action</p>
            <h2 style={{ fontSize:'clamp(26px,5vw,52px)',fontWeight:900,letterSpacing:'-.04em',color:'#fff',lineHeight:0.95,margin:0 }}>
              How Vocalis<br/><span style={{ color:'#c8f53a' }}>actually works.</span>
            </h2>
          </div>
          <div style={{ display:'flex',alignItems:'center',gap:10 }}>
            <div style={{ display:'flex',alignItems:'center',gap:7,opacity:0.5 }}>
              <div style={{ width:6,height:6,borderRadius:'50%',background:audioReady?'#c8f53a':'rgba(255,255,255,0.3)',transition:'background 0.3s' }}/>
              <span style={{ fontSize:11,color:'rgba(255,255,255,0.4)',fontWeight:500 }}>{audioReady?'AI voice ready':'Loading voice...'}</span>
            </div>
            {started&&<button onClick={startDemo} style={{ background:'rgba(200,245,58,0.07)',border:'1px solid rgba(200,245,58,0.2)',borderRadius:100,padding:'7px 16px',cursor:'pointer',fontSize:12,fontWeight:700,color:'#c8f53a',letterSpacing:1 }}>↺ Replay</button>}
          </div>
        </div>

        {/* Demo window — centered, max width, 16:9 */}
        <div style={{ width:'100%',maxWidth:900,margin:'0 auto' }}>
          <div style={{ position:'relative',borderRadius:16,overflow:'hidden',border:'1px solid rgba(255,255,255,0.08)',boxShadow:'0 0 80px rgba(200,245,58,0.07),0 32px 64px rgba(0,0,0,0.75)',background:'#0d0d0d',aspectRatio:'16/9' }}>
            {/* Grid bg */}
            <div style={{ position:'absolute',inset:0,backgroundImage:'linear-gradient(rgba(200,245,58,0.015) 1px,transparent 1px),linear-gradient(90deg,rgba(200,245,58,0.015) 1px,transparent 1px)',backgroundSize:'52px 52px' }}/>
            {/* Browser chrome */}
            <div style={{ position:'absolute',top:0,left:0,right:0,height:'clamp(32px,5%,42px)',background:'rgba(0,0,0,0.75)',backdropFilter:'blur(16px)',borderBottom:'1px solid rgba(255,255,255,0.06)',display:'flex',alignItems:'center',padding:'0 clamp(10px,2%,16px)',gap:8,zIndex:10 }}>
              <div style={{ display:'flex',gap:4.5 }}>{['#ff5f57','#ffbd2e','#28ca41'].map(c=><div key={c} style={{ width:'clamp(6px,1.2%,9px)',height:'clamp(6px,1.2%,9px)',borderRadius:'50%',background:c,opacity:0.65 }}/>)}</div>
              <div style={{ flex:1,display:'flex',justifyContent:'center' }}>
                <div style={{ background:'rgba(255,255,255,0.05)',borderRadius:5,padding:'2px 12px',fontSize:'clamp(8px,1.1%,10px)',color:'rgba(255,255,255,0.25)' }}>vocalis-zeta.vercel.app</div>
              </div>
              <div style={{ display:'flex',alignItems:'center',gap:6 }}>
                <div style={{ width:'clamp(16px,2.5%,22px)',height:'clamp(16px,2.5%,22px)',background:'#c8f53a',borderRadius:5,display:'flex',alignItems:'center',justifyContent:'center' }}>
                  <div style={{ display:'flex',gap:1.5,alignItems:'center' }}>{[5,8,11,8,5].map((h,i)=><div key={i} style={{ width:1.5,height:h,background:'#0a0a0a',borderRadius:1 }}/>)}</div>
                </div>
                <span style={{ fontSize:'clamp(9px,1.3%,12px)',fontWeight:800,color:'#fff' }}>Vocalis</span>
                <div style={{ fontSize:'clamp(8px,1%,10px)',fontWeight:700,color:'#0a0a0a',background:'#c8f53a',borderRadius:100,padding:'2px 8px',marginLeft:2 }}>New Rep →</div>
              </div>
            </div>

            {/* Scenes */}
            <div style={{ position:'absolute',inset:'clamp(32px,5%,42px) 0 0 0' }}>
              <SceneBrand      v={sceneId==='brand'} />
              <SceneProblem    v={sceneId==='problem'}    e={sceneElapsed} />
              <ScenePractice   v={sceneId==='practice'}   e={sceneElapsed} />
              <SceneProcessing v={sceneId==='processing'} e={sceneElapsed} />
              <SceneFeedback   v={sceneId==='feedback'}   e={sceneElapsed} />
              <SceneProgress   v={sceneId==='progress'}   e={sceneElapsed} />
              <SceneOutro      v={sceneId==='outro'} />
            </div>

            {/* Scene dots */}
            <div style={{ position:'absolute',bottom:10,left:'50%',transform:'translateX(-50%)',display:'flex',gap:5,zIndex:10 }}>
              {SCENES.map(s=><div key={s.id} style={{ width:sceneId===s.id?15:5,height:5,borderRadius:3,background:sceneId===s.id?'#c8f53a':'rgba(255,255,255,0.15)',transition:'all 0.35s ease' }}/>)}
            </div>

            {/* Pre-start overlay */}
            {!started&&(
              <div onClick={startDemo} style={{ position:'absolute',inset:0,zIndex:20,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',background:'rgba(10,10,10,0.9)',backdropFilter:'blur(6px)',cursor:'pointer' }}>
                <div style={{ width:'clamp(52px,8%,68px)',height:'clamp(52px,8%,68px)',borderRadius:'50%',background:'#c8f53a',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 0 48px rgba(200,245,58,0.45)',marginBottom:12 }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="#0a0a0a"><polygon points="5,3 19,12 5,21"/></svg>
                </div>
                <span style={{ fontSize:'clamp(12px,1.8%,15px)',color:'rgba(255,255,255,0.6)',fontWeight:600,marginBottom:5 }}>Watch the demo</span>
                <span style={{ fontSize:'clamp(10px,1.4%,12px)',color:'rgba(255,255,255,0.22)' }}>
                  {audioReady?'48 seconds · AI voice + music':'48 seconds · loading...'}
                </span>
              </div>
            )}
          </div>

          {/* Progress bar */}
          <div style={{ height:2,background:'rgba(255,255,255,0.06)',borderRadius:1,overflow:'hidden' }}>
            <div style={{ height:'100%',width:`${(elapsed/TOTAL_MS)*100}%`,background:'linear-gradient(90deg,#c8f53a,#a8e020)',transition:'width 0.1s linear' }}/>
          </div>

          {/* Labels */}
          <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginTop:12,flexWrap:'wrap',gap:8 }}>
            <div style={{ display:'flex',gap:'clamp(10px,3vw,24px)',flexWrap:'wrap' }}>
              {STEP_LABELS.map(({id,label})=>(
                <div key={id} style={{ display:'flex',alignItems:'center',gap:6 }}>
                  <div style={{ width:6,height:6,borderRadius:'50%',background:sceneId===id?'#c8f53a':'rgba(255,255,255,0.17)',boxShadow:sceneId===id?'0 0 7px rgba(200,245,58,0.7)':'none',transition:'all 0.3s',flexShrink:0 }}/>
                  <span style={{ fontSize:11,color:sceneId===id?'rgba(255,255,255,0.7)':'rgba(255,255,255,0.27)',fontWeight:500,transition:'color 0.3s' }}>{label}</span>
                </div>
              ))}
            </div>
            <span style={{ fontSize:10,color:'rgba(255,255,255,0.17)',fontWeight:500 }}>{audioReady?'🎙 AI voice  🎵 music':'48s walkthrough'}</span>
          </div>
        </div>
      </div>
    </section>
  )
}

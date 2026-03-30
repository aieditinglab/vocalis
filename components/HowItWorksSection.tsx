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

// Brief, punchy script — matches what's on screen without over-explaining
const FULL_SCRIPT = `
Vocalis. AI communication coaching for the next generation.

Most teens are never taught to speak with confidence. That ends here.

You get a prompt. You hit record. You speak.
Vocalis listens — catching every word, every pause, every filler in real time.

The moment you stop, the AI goes to work.

Three scores. Clarity, filler words, confidence.
Real feedback. Not just a number — a reason, and what to fix.

Every rep is tracked. Watch yourself improve over time.
Build your streak. Earn tokens. Level up.

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

// ─── Lo-fi ambient music via Web Audio ────────────────────────────────────────
// Slow, warm, minimal. ~85 BPM. A minor. Inspired by chill study/demo beats.

function createDemoMusic(ctx: AudioContext): () => void {
  const master = ctx.createGain()
  master.gain.setValueAtTime(0, ctx.currentTime)
  master.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 4)
  master.connect(ctx.destination)

  const bpm  = 85
  const beat = 60 / bpm
  const bar  = beat * 4
  const totalBars = Math.ceil((TOTAL_MS / 1000) / bar) + 2

  // ── Warm pad (triangle + sine, low-pass filtered) ──────────────────────────
  function pad(freq: number, start: number, dur: number, vol: number) {
    [freq, freq * 1.003, freq * 1.5].forEach((f, i) => {
      const osc = ctx.createOscillator()
      const filt = ctx.createBiquadFilter()
      const env  = ctx.createGain()
      osc.type = i === 2 ? 'sine' : 'triangle'
      osc.frequency.value = f
      filt.type = 'lowpass'; filt.frequency.value = 600; filt.Q.value = 0.8
      env.gain.setValueAtTime(0, start)
      env.gain.linearRampToValueAtTime(vol * (i === 2 ? 0.4 : 1), start + 1.2)
      env.gain.setValueAtTime(vol * (i === 2 ? 0.4 : 1), start + dur - 1.5)
      env.gain.linearRampToValueAtTime(0, start + dur)
      osc.connect(filt); filt.connect(env); env.connect(master)
      osc.start(start); osc.stop(start + dur)
    })
  }

  // Am → G → F → C (loop)
  const chords = [
    [220, 261.63, 329.63],   // Am: A3 C4 E4
    [196, 246.94, 293.66],   // G:  G3 B3 D4
    [174.61, 220, 261.63],   // F:  F3 A3 C4
    [130.81, 164.81, 196],   // C:  C3 E3 G3
  ]

  for (let i = 0; i < totalBars; i++) {
    const t = ctx.currentTime + i * bar
    const chord = chords[i % chords.length]
    chord.forEach(f => pad(f, t, bar + 0.3, 0.04))
  }

  // ── Soft kick (sine sweep) ─────────────────────────────────────────────────
  function kick(t: number) {
    const osc = ctx.createOscillator()
    const env = ctx.createGain()
    osc.frequency.setValueAtTime(120, t)
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.35)
    env.gain.setValueAtTime(0.35, t)
    env.gain.exponentialRampToValueAtTime(0.001, t + 0.35)
    osc.connect(env); env.connect(master)
    osc.start(t); osc.stop(t + 0.35)
  }

  // ── Snare (filtered noise) ─────────────────────────────────────────────────
  function snare(t: number) {
    const bufSize = Math.floor(ctx.sampleRate * 0.12)
    const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate)
    const data = buf.getChannelData(0)
    for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1)
    const src   = ctx.createBufferSource()
    const band  = ctx.createBiquadFilter()
    const env   = ctx.createGain()
    src.buffer  = buf
    band.type   = 'bandpass'; band.frequency.value = 1800; band.Q.value = 0.9
    env.gain.setValueAtTime(0.12, t)
    env.gain.exponentialRampToValueAtTime(0.001, t + 0.12)
    src.connect(band); band.connect(env); env.connect(master)
    src.start(t); src.stop(t + 0.12)
  }

  // ── Soft hi-hat (short noise burst) ───────────────────────────────────────
  function hat(t: number, vol = 0.04) {
    const bufSize = Math.floor(ctx.sampleRate * 0.03)
    const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate)
    const data = buf.getChannelData(0)
    for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1
    const src   = ctx.createBufferSource()
    const filt  = ctx.createBiquadFilter()
    const env   = ctx.createGain()
    src.buffer  = buf
    filt.type   = 'highpass'; filt.frequency.value = 8000
    env.gain.setValueAtTime(vol, t)
    env.gain.exponentialRampToValueAtTime(0.001, t + 0.03)
    src.connect(filt); filt.connect(env); env.connect(master)
    src.start(t); src.stop(t + 0.03)
  }

  // ── Warm bass (sine) ───────────────────────────────────────────────────────
  function bass(freq: number, t: number, dur: number) {
    const osc = ctx.createOscillator()
    const filt = ctx.createBiquadFilter()
    const env  = ctx.createGain()
    osc.type = 'sine'; osc.frequency.value = freq
    filt.type = 'lowpass'; filt.frequency.value = 200
    env.gain.setValueAtTime(0, t)
    env.gain.linearRampToValueAtTime(0.18, t + 0.04)
    env.gain.setValueAtTime(0.18, t + dur - 0.06)
    env.gain.linearRampToValueAtTime(0, t + dur)
    osc.connect(filt); filt.connect(env); env.connect(master)
    osc.start(t); osc.stop(t + dur)
  }

  // Bass roots: A1, G1, F1, C1
  const bassRoots = [55, 49, 43.65, 32.7]

  for (let i = 0; i < totalBars; i++) {
    const t  = ctx.currentTime + i * bar
    const br = bassRoots[i % bassRoots.length]

    // Kick: beat 1, beat 3 (sometimes beat 3+ for variation)
    kick(t)
    kick(t + beat * 2)
    if (i % 2 === 1) kick(t + beat * 2.5) // off-beat variation

    // Snare: beat 2, beat 4
    snare(t + beat)
    snare(t + beat * 3)

    // Hi-hats: every beat + off-beats (light)
    for (let h = 0; h < 8; h++) {
      hat(t + h * (beat / 2), h % 2 === 0 ? 0.05 : 0.025)
    }

    // Bass: two half-bar notes
    bass(br,                   t,              beat * 1.9)
    bass(bassRoots[(i+1) % 4], t + beat * 2,   beat * 1.9)
  }

  return () => {
    master.gain.cancelScheduledValues(ctx.currentTime)
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
        <span style={{ fontSize:'clamp(38px,5vw,62px)',fontWeight:900,color:'#fff',letterSpacing:-3,lineHeight:1 }}>Vocalis</span>
      </div>
      <div style={{ height:2,background:'linear-gradient(90deg,#c8f53a,transparent)',width:v?300:0,transition:'width 0.8s ease 0.4s',marginBottom:18 }}/>
      <p style={{ fontSize:12,fontWeight:600,color:'rgba(255,255,255,0.38)',letterSpacing:6,textTransform:'uppercase',opacity:v?1:0,transition:'opacity 0.5s ease 0.7s',textAlign:'center' }}>
        AI Communication Coaching
      </p>
    </div>
  )
}

function SceneProblem({ v, e }: { v:boolean; e:number }) {
  return (
    <div style={{ position:'absolute',inset:0,display:'flex',flexDirection:'column',justifyContent:'center',padding:'0 clamp(18px,5%,60px)',opacity:v?1:0,transition:'opacity 0.5s ease' }}>
      <div style={{ fontSize:10,fontWeight:700,letterSpacing:5,color:'#c8f53a',textTransform:'uppercase',marginBottom:20 }}>The Problem</div>
      <div style={{ display:'flex',flexDirection:'column',gap:14 }}>
        {STATS.map((s,i)=>{
          const show=e>i*1800
          return (
            <div key={i} style={{ display:'flex',alignItems:'flex-start',gap:16,opacity:show?1:0,transform:show?'translateX(0)':'translateX(-24px)',transition:'all 0.5s ease' }}>
              <div style={{ minWidth:56,fontSize:'clamp(24px,3.5vw,36px)',fontWeight:900,color:'#c8f53a',lineHeight:1,letterSpacing:-2,flexShrink:0 }}>{s.num}</div>
              <div style={{ fontSize:'clamp(11px,1.5vw,13px)',color:'rgba(255,255,255,0.5)',lineHeight:1.6,paddingTop:4 }}>{s.text}</div>
            </div>
          )
        })}
      </div>
      <div style={{ marginTop:24,paddingTop:18,borderTop:'1px solid rgba(255,255,255,0.07)',opacity:e>5800?1:0,transition:'opacity 0.5s ease',display:'flex',alignItems:'center',gap:10 }}>
        <div style={{ width:7,height:7,borderRadius:'50%',background:'#c8f53a',boxShadow:'0 0 8px rgba(200,245,58,0.9)',flexShrink:0 }}/>
        <span style={{ fontSize:'clamp(12px,1.6vw,14px)',fontWeight:700,color:'#fff' }}>Here's how one Vocalis rep works.</span>
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
    <div style={{ position:'absolute',inset:0,display:'flex',flexDirection:'column',justifyContent:'center',padding:'0 clamp(16px,4%,52px)',opacity:v?1:0,transition:'opacity 0.5s ease',gap:10 }}>
      <div style={{ display:'flex',alignItems:'center',gap:10,marginBottom:2 }}>
        <div style={{ width:22,height:22,borderRadius:'50%',background:'rgba(200,245,58,0.15)',border:'1px solid rgba(200,245,58,0.4)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
          <span style={{ fontSize:11,fontWeight:800,color:'#c8f53a' }}>1</span>
        </div>
        <span style={{ fontSize:10,fontWeight:700,letterSpacing:5,color:'#c8f53a',textTransform:'uppercase' }}>Record Your Rep</span>
      </div>
      <div style={{ background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.09)',borderRadius:12,padding:'clamp(12px,2%,18px)',opacity:promptVisible?1:0,transform:promptVisible?'translateY(0)':'translateY(16px)',transition:'all 0.4s ease' }}>
        <div style={{ fontSize:9,fontWeight:700,color:'rgba(255,255,255,0.25)',letterSpacing:4,textTransform:'uppercase',marginBottom:8 }}>Today's Prompt</div>
        <div style={{ fontSize:'clamp(11px,1.6vw,14px)',fontWeight:600,color:'#fff',lineHeight:1.6 }}>
          {PROMPT_TEXT.slice(0,charCount)}<span style={{ color:'#c8f53a',opacity:!isRecording&&Math.floor(Date.now()/500)%2===0?1:0 }}>|</span>
        </div>
      </div>
      <div style={{ background:isRecording?'rgba(200,245,58,0.04)':'rgba(255,255,255,0.03)',border:isRecording?'1px solid rgba(200,245,58,0.2)':'1px solid rgba(255,255,255,0.07)',borderRadius:12,padding:'clamp(10px,1.8%,16px)',opacity:btnVisible?1:0,transition:'all 0.4s ease' }}>
        <div style={{ display:'flex',alignItems:'center',gap:2.5,height:34,marginBottom:10 }}>
          {Array.from({length:50}).map((_,i)=>{
            const h=5+(isRecording?26:3)*Math.abs(Math.sin(t*4+i*0.65))
            return <div key={i} style={{ flex:1,height:h,borderRadius:2,background:isRecording?'#c8f53a':'rgba(200,245,58,0.15)',transition:'height 0.07s' }}/>
          })}
        </div>
        <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between' }}>
          <div style={{ display:'flex',alignItems:'center',gap:9 }}>
            <div style={{ width:32,height:32,borderRadius:'50%',background:isRecording?'#c8f53a':'rgba(200,245,58,0.1)',border:isRecording?'none':'2px solid rgba(200,245,58,0.25)',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:isRecording?'0 0 20px rgba(200,245,58,0.45)':'none',transition:'all 0.3s',flexShrink:0 }}>
              {isRecording?<div style={{ width:10,height:10,background:'#0a0a0a',borderRadius:2 }}/>:<div style={{ width:12,height:12,background:'#c8f53a',borderRadius:'50%' }}/>}
            </div>
            <div>
              <div style={{ fontSize:12,fontWeight:700,color:isRecording?'#c8f53a':'rgba(255,255,255,0.4)',lineHeight:1 }}>{isRecording?'● Recording...':'Tap to Record'}</div>
              {isRecording&&<div style={{ fontSize:10,color:'rgba(255,255,255,0.25)',marginTop:2 }}>Speaking naturally</div>}
            </div>
          </div>
          {isRecording&&<span style={{ fontSize:15,fontWeight:800,color:'rgba(255,255,255,0.2)',fontVariantNumeric:'tabular-nums' }}>{String(Math.floor(recMs/1000)).padStart(2,'0')}:{String(Math.floor((recMs%1000)/10)).padStart(2,'0')}</span>}
        </div>
      </div>
      {showTranscript&&(
        <div style={{ background:'rgba(200,245,58,0.03)',border:'1px solid rgba(200,245,58,0.1)',borderRadius:10,padding:'10px 13px' }}>
          <div style={{ fontSize:9,fontWeight:700,color:'rgba(200,245,58,0.5)',letterSpacing:4,textTransform:'uppercase',marginBottom:6 }}>Live Transcript</div>
          <div style={{ fontSize:'clamp(10px,1.3vw,12px)',color:'rgba(255,255,255,0.48)',lineHeight:1.6 }}>
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
    <div style={{ position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',opacity:v?1:0,transition:'opacity 0.5s ease',gap:24 }}>
      <div style={{ position:'relative',width:68,height:68 }}>
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
      <div style={{ display:'flex',flexDirection:'column',gap:10,minWidth:220 }}>
        {steps.map((s,i)=>(
          <div key={i} style={{ display:'flex',alignItems:'center',gap:10,opacity:e>i*800?1:0.15,transition:'opacity 0.4s ease' }}>
            <div style={{ width:18,height:18,borderRadius:'50%',background:s.done?'#c8f53a':'rgba(255,255,255,0.08)',border:s.done?'none':'2px solid rgba(255,255,255,0.15)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,transition:'all 0.3s' }}>
              {s.done&&<svg width="9" height="9" viewBox="0 0 10 10"><polyline points="1.5,5 4,7.5 8.5,2.5" fill="none" stroke="#0a0a0a" strokeWidth="1.8" strokeLinecap="round"/></svg>}
            </div>
            <span style={{ fontSize:12,color:s.done?'#fff':'rgba(255,255,255,0.35)',fontWeight:s.done?600:400,transition:'all 0.3s' }}>{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function SceneFeedback({ v, e }: { v:boolean; e:number }) {
  return (
    <div style={{ position:'absolute',inset:0,display:'flex',flexDirection:'column',justifyContent:'center',padding:'0 clamp(16px,4%,52px)',opacity:v?1:0,transition:'opacity 0.5s ease' }}>
      <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14,flexWrap:'wrap',gap:8 }}>
        <div style={{ display:'flex',alignItems:'center',gap:10 }}>
          <div style={{ width:22,height:22,borderRadius:'50%',background:'rgba(200,245,58,0.15)',border:'1px solid rgba(200,245,58,0.4)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
            <span style={{ fontSize:11,fontWeight:800,color:'#c8f53a' }}>2</span>
          </div>
          <div>
            <div style={{ fontSize:10,fontWeight:700,letterSpacing:5,color:'#c8f53a',textTransform:'uppercase' }}>AI Coaching Report</div>
            <div style={{ fontSize:'clamp(16px,2.5vw,22px)',fontWeight:900,color:'#fff',letterSpacing:-1,lineHeight:1.1 }}>Your breakdown.</div>
          </div>
        </div>
        <div style={{ background:'rgba(200,245,58,0.07)',border:'1px solid rgba(200,245,58,0.18)',borderRadius:100,padding:'5px 12px',display:'flex',alignItems:'center',gap:6 }}>
          <div style={{ width:5,height:5,borderRadius:'50%',background:'#c8f53a',boxShadow:'0 0 5px rgba(200,245,58,0.9)' }}/>
          <span style={{ fontSize:10,fontWeight:700,color:'#c8f53a' }}>Analysis Complete</span>
        </div>
      </div>
      <div style={{ display:'flex',flexDirection:'column',gap:8 }}>
        {FEEDBACK_ITEMS.map((item,i)=>{
          const delay=i*1800
          const show=e>delay
          const barPct=show?Math.min(Math.max(0,(e-delay-500)/1000),1)*item.score:0
          return (
            <div key={item.label} style={{ background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:12,padding:'clamp(10px,1.6%,15px) clamp(12px,2%,18px)',opacity:show?1:0,transform:show?'translateY(0)':'translateY(14px)',transition:`opacity 0.4s ease ${delay*0.001}s,transform 0.4s ease ${delay*0.001}s` }}>
              <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:7,gap:10 }}>
                <div style={{ display:'flex',alignItems:'center',gap:8,flex:1 }}>
                  <span style={{ fontSize:16 }}>{item.icon}</span>
                  <div>
                    <div style={{ fontSize:12,fontWeight:700,color:'#fff',lineHeight:1 }}>{item.label}</div>
                    <div style={{ fontSize:10,color:item.color,fontWeight:600,marginTop:1.5 }}>{item.delta}</div>
                  </div>
                </div>
                <span style={{ fontSize:20,fontWeight:900,color:item.color,letterSpacing:-1 }}>{Math.round(barPct)}</span>
              </div>
              <div style={{ height:2.5,background:'rgba(255,255,255,0.07)',borderRadius:2,marginBottom:7,overflow:'hidden' }}>
                <div style={{ height:'100%',width:`${barPct}%`,background:`linear-gradient(90deg,${item.color},${item.color}77)`,borderRadius:2,transition:'width 0.9s ease' }}/>
              </div>
              <div style={{ fontSize:'clamp(9px,1.2vw,11px)',color:'rgba(255,255,255,0.35)',lineHeight:1.5 }}>{item.text}</div>
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
    <div style={{ position:'absolute',inset:0,display:'flex',flexDirection:'column',justifyContent:'center',padding:'0 clamp(16px,4%,52px)',opacity:v?1:0,transition:'opacity 0.5s ease' }}>
      <div style={{ display:'flex',alignItems:'center',gap:10,marginBottom:16 }}>
        <div style={{ width:22,height:22,borderRadius:'50%',background:'rgba(200,245,58,0.15)',border:'1px solid rgba(200,245,58,0.4)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
          <span style={{ fontSize:11,fontWeight:800,color:'#c8f53a' }}>3</span>
        </div>
        <span style={{ fontSize:10,fontWeight:700,letterSpacing:5,color:'#c8f53a',textTransform:'uppercase' }}>Track Your Progress</span>
      </div>
      <div style={{ display:'flex',gap:'clamp(12px,3%,22px)',alignItems:'flex-start',flexWrap:'wrap' }}>
        <div style={{ display:'flex',flexDirection:'column',alignItems:'center',gap:10,minWidth:120 }}>
          <div style={{ position:'relative',width:140,height:140 }}>
            <div style={{ position:'absolute',inset:0,borderRadius:'50%',background:'radial-gradient(circle,rgba(200,245,58,0.1) 0%,transparent 65%)' }}/>
            <svg width="140" height="140" style={{ position:'absolute',inset:0,transform:'rotate(-90deg)' }}>
              <circle cx="70" cy="70" r="72" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5"/>
              <circle cx="70" cy="70" r="72" fill="none" stroke="#c8f53a" strokeWidth="5" strokeDasharray={C} strokeDashoffset={C*(1-rp*0.94)} strokeLinecap="round"/>
            </svg>
            <div style={{ position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center' }}>
              <span style={{ fontSize:40,fontWeight:900,color:'#fff',letterSpacing:-3,lineHeight:1 }}>{num}</span>
              <span style={{ fontSize:10,color:'rgba(255,255,255,0.3)',letterSpacing:1 }}>/100</span>
            </div>
          </div>
          <div style={{ textAlign:'center' }}>
            <div style={{ fontSize:12,fontWeight:700,color:'#fff' }}>Clarity Score</div>
            <div style={{ fontSize:10,color:'rgba(255,255,255,0.35)',marginTop:1 }}>This session</div>
          </div>
          <div style={{ background:'#c8f53a',borderRadius:100,padding:'6px 14px',fontSize:11,fontWeight:800,color:'#0a0a0a',opacity:e>1800?1:0,transform:e>1800?'scale(1)':'scale(0.8)',transition:'all 0.4s cubic-bezier(0.34,1.56,0.64,1)' }}>
            🏆 Personal Best
          </div>
        </div>
        <div style={{ flex:1,display:'flex',flexDirection:'column',gap:9,minWidth:140 }}>
          <div style={{ background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:11,padding:'13px 15px',opacity:e>2400?1:0,transform:e>2400?'translateY(0)':'translateY(10px)',transition:'all 0.5s ease' }}>
            <div style={{ fontSize:9,fontWeight:600,color:'rgba(255,255,255,0.3)',letterSpacing:3,textTransform:'uppercase',marginBottom:10 }}>Last 5 Sessions</div>
            <div style={{ display:'flex',alignItems:'flex-end',gap:5,height:46 }}>
              {PROGRESS_DATA.map((val,i)=>{
                const h=(val/100)*46
                const isLast=i===PROGRESS_DATA.length-1
                const delay=i*140
                const shown=e>2500+delay
                return (
                  <div key={i} style={{ flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:4 }}>
                    <div style={{ width:'100%',height:shown?h:0,background:isLast?'#c8f53a':'rgba(200,245,58,0.25)',borderRadius:3,transition:`height 0.5s ease ${delay}ms`,boxShadow:isLast?'0 0 10px rgba(200,245,58,0.35)':'none' }}/>
                    <span style={{ fontSize:9,color:isLast?'#c8f53a':'rgba(255,255,255,0.2)',fontWeight:isLast?700:400 }}>{val}</span>
                  </div>
                )
              })}
            </div>
          </div>
          <div style={{ display:'flex',gap:8 }}>
            {[{e:'🔥',n:'5',l:'Day streak',c:'#fff',d:3200},{e:'🪙',n:'+20',l:'Tokens',c:'#c8f53a',d:3500},{e:'📈',n:'↑23',l:'All time',c:'#60a5fa',d:3800}].map((s,i)=>(
              <div key={i} style={{ flex:1,background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:11,padding:'11px 12px',opacity:e>s.d?1:0,transition:`opacity 0.4s ease ${i*0.1}s` }}>
                <div style={{ fontSize:17 }}>{s.e}</div>
                <div style={{ fontSize:18,fontWeight:900,color:s.c,letterSpacing:-1,marginTop:3 }}>{s.n}</div>
                <div style={{ fontSize:10,color:'rgba(255,255,255,0.32)',marginTop:1 }}>{s.l}</div>
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
      <div style={{ fontSize:'clamp(42px,6.5vw,72px)',fontWeight:900,color:'#fff',letterSpacing:-4,lineHeight:0.92,textAlign:'center',marginBottom:16,transform:v?'translateY(0)':'translateY(28px)',transition:'transform 0.7s cubic-bezier(0.34,1.56,0.64,1) 0.1s' }}>
        Own <span style={{ color:'#c8f53a' }}>the</span><br/>room.
      </div>
      <div style={{ fontSize:11,color:'rgba(255,255,255,0.25)',letterSpacing:5,textTransform:'uppercase',marginBottom:28,opacity:v?1:0,transition:'opacity 0.5s ease 0.4s' }}>vocalis-zeta.vercel.app</div>
      <div style={{ display:'flex',alignItems:'center',gap:16,opacity:v?1:0,transition:'opacity 0.5s ease 0.7s' }}>
        <div style={{ display:'flex',alignItems:'center',gap:10 }}>
          <div style={{ width:32,height:32,background:'#c8f53a',borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center' }}>
            <div style={{ display:'flex',gap:2.5,alignItems:'center' }}>
              {[7,12,16,12,7].map((h,i)=><div key={i} style={{ width:2.5,height:h,background:'#0a0a0a',borderRadius:1.5 }}/>)}
            </div>
          </div>
          <span style={{ fontSize:22,fontWeight:900,color:'#fff',letterSpacing:-1 }}>Vocalis</span>
        </div>
        <div style={{ width:1,height:22,background:'rgba(255,255,255,0.1)' }}/>
        <span style={{ fontSize:12,color:'rgba(255,255,255,0.4)',fontWeight:500 }}>Start free today →</span>
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

    // Start lo-fi background music
    try {
      const ctx=new (window.AudioContext||(window as any).webkitAudioContext)()
      audioCtxRef.current=ctx
      stopMusicRef.current=createDemoMusic(ctx)
    } catch {}

    // Play voiceover
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
    <section id="how-it-works" ref={sectionRef} style={{ position:'relative',padding:'clamp(64px,8vw,100px) clamp(20px,5vw,40px)',background:'#0a0a0a',overflow:'hidden' }}>
      <div style={{ position:'absolute',left:'50%',top:'25%',transform:'translate(-50%,-50%)',width:'80vw',height:'80vw',maxWidth:900,maxHeight:900,borderRadius:'50%',background:'radial-gradient(circle,rgba(200,245,58,0.04) 0%,transparent 65%)',pointerEvents:'none' }}/>
      <div style={{ maxWidth:1020,margin:'0 auto',position:'relative',zIndex:1 }}>
        <div style={{ marginBottom:36,display:'flex',alignItems:'flex-end',justifyContent:'space-between',flexWrap:'wrap',gap:16 }}>
          <div>
            <p style={{ fontSize:11,fontWeight:700,letterSpacing:'0.35em',color:'#c8f53a',textTransform:'uppercase',margin:'0 0 10px' }}>See It In Action</p>
            <h2 style={{ fontSize:'clamp(28px,5vw,52px)',fontWeight:900,letterSpacing:'-.04em',color:'#fff',lineHeight:0.95,margin:0 }}>
              How Vocalis<br/><span style={{ color:'#c8f53a' }}>actually works.</span>
            </h2>
          </div>
          <div style={{ display:'flex',alignItems:'center',gap:12 }}>
            <div style={{ display:'flex',alignItems:'center',gap:7,opacity:0.5 }}>
              <div style={{ width:6,height:6,borderRadius:'50%',background:audioReady?'#c8f53a':'rgba(255,255,255,0.3)',transition:'background 0.3s' }}/>
              <span style={{ fontSize:11,color:'rgba(255,255,255,0.4)',fontWeight:500 }}>{audioReady?'AI voice ready':'Loading voice...'}</span>
            </div>
            {started&&<button onClick={startDemo} style={{ background:'rgba(200,245,58,0.07)',border:'1px solid rgba(200,245,58,0.2)',borderRadius:100,padding:'8px 18px',cursor:'pointer',fontSize:12,fontWeight:700,color:'#c8f53a',letterSpacing:1 }}>↺ Replay</button>}
          </div>
        </div>

        <div style={{ position:'relative',borderRadius:18,overflow:'hidden',border:'1px solid rgba(255,255,255,0.08)',boxShadow:'0 0 80px rgba(200,245,58,0.06),0 40px 80px rgba(0,0,0,0.75)',background:'#0d0d0d',aspectRatio:'16/9',minHeight:260 }}>
          <div style={{ position:'absolute',inset:0,backgroundImage:'linear-gradient(rgba(200,245,58,0.015) 1px,transparent 1px),linear-gradient(90deg,rgba(200,245,58,0.015) 1px,transparent 1px)',backgroundSize:'52px 52px' }}/>
          <div style={{ position:'absolute',top:0,left:0,right:0,height:40,background:'rgba(0,0,0,0.75)',backdropFilter:'blur(16px)',borderBottom:'1px solid rgba(255,255,255,0.06)',display:'flex',alignItems:'center',padding:'0 14px',gap:9,zIndex:10 }}>
            <div style={{ display:'flex',gap:5 }}>{['#ff5f57','#ffbd2e','#28ca41'].map(c=><div key={c} style={{ width:8,height:8,borderRadius:'50%',background:c,opacity:0.65 }}/>)}</div>
            <div style={{ flex:1,display:'flex',justifyContent:'center' }}>
              <div style={{ background:'rgba(255,255,255,0.05)',borderRadius:5,padding:'2px 14px',fontSize:9,color:'rgba(255,255,255,0.25)' }}>vocalis-zeta.vercel.app</div>
            </div>
            <div style={{ display:'flex',alignItems:'center',gap:7 }}>
              <div style={{ width:20,height:20,background:'#c8f53a',borderRadius:5,display:'flex',alignItems:'center',justifyContent:'center' }}>
                <div style={{ display:'flex',gap:1.5,alignItems:'center' }}>{[5,8,11,8,5].map((h,i)=><div key={i} style={{ width:1.5,height:h,background:'#0a0a0a',borderRadius:1 }}/>)}</div>
              </div>
              <span style={{ fontSize:11,fontWeight:800,color:'#fff' }}>Vocalis</span>
              <div style={{ fontSize:9,fontWeight:700,color:'#0a0a0a',background:'#c8f53a',borderRadius:100,padding:'2px 9px',marginLeft:2 }}>New Rep →</div>
            </div>
          </div>

          <div style={{ position:'absolute',inset:'40px 0 0 0' }}>
            <SceneBrand      v={sceneId==='brand'} />
            <SceneProblem    v={sceneId==='problem'}    e={sceneElapsed} />
            <ScenePractice   v={sceneId==='practice'}   e={sceneElapsed} />
            <SceneProcessing v={sceneId==='processing'} e={sceneElapsed} />
            <SceneFeedback   v={sceneId==='feedback'}   e={sceneElapsed} />
            <SceneProgress   v={sceneId==='progress'}   e={sceneElapsed} />
            <SceneOutro      v={sceneId==='outro'} />
          </div>

          <div style={{ position:'absolute',bottom:11,left:'50%',transform:'translateX(-50%)',display:'flex',gap:5,zIndex:10 }}>
            {SCENES.map(s=><div key={s.id} style={{ width:sceneId===s.id?16:5,height:5,borderRadius:3,background:sceneId===s.id?'#c8f53a':'rgba(255,255,255,0.15)',transition:'all 0.35s ease' }}/>)}
          </div>

          {!started&&(
            <div onClick={startDemo} style={{ position:'absolute',inset:0,zIndex:20,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',background:'rgba(10,10,10,0.9)',backdropFilter:'blur(6px)',cursor:'pointer' }}>
              <div style={{ width:64,height:64,borderRadius:'50%',background:'#c8f53a',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 0 48px rgba(200,245,58,0.45)',marginBottom:14 }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="#0a0a0a"><polygon points="5,3 19,12 5,21"/></svg>
              </div>
              <span style={{ fontSize:14,color:'rgba(255,255,255,0.6)',fontWeight:600,marginBottom:5 }}>Watch the demo</span>
              <span style={{ fontSize:11,color:'rgba(255,255,255,0.22)' }}>{audioReady?'48 seconds · AI voice + music':'48 seconds · loading...'}</span>
            </div>
          )}
        </div>

        <div style={{ height:2,background:'rgba(255,255,255,0.06)',borderRadius:1,overflow:'hidden' }}>
          <div style={{ height:'100%',width:`${(elapsed/TOTAL_MS)*100}%`,background:'linear-gradient(90deg,#c8f53a,#a8e020)',transition:'width 0.1s linear' }}/>
        </div>

        <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginTop:14,flexWrap:'wrap',gap:10 }}>
          <div style={{ display:'flex',gap:'clamp(12px,3vw,24px)',flexWrap:'wrap' }}>
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
    </section>
  )
}

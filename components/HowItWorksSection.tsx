'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

// ─── Timing ───────────────────────────────────────────────────────────────────
const TOTAL_MS = 44000

const SCENES = [
  { id: 'brand',      start: 0,     end: 4000  },
  { id: 'problem',    start: 4000,  end: 10000 },
  { id: 'practice',   start: 10000, end: 22000 },
  { id: 'processing', start: 22000, end: 25500 },
  { id: 'feedback',   start: 25500, end: 34000 },
  { id: 'progress',   start: 34000, end: 40500 },
  { id: 'outro',      start: 40500, end: 44000 },
]

const NARRATION_LINES = [
  { startMs: 600,   text: 'Meet Vocalis.' },
  { startMs: 4300,  text: "Most teens are never taught how to speak with confidence. Vocalis is the AI coach that changes that." },
  { startMs: 10300, text: "Every session starts with a real-world prompt — the kind you'd face in an interview, a presentation, or a leadership role." },
  { startMs: 15800, text: "You hit record and speak naturally. The AI listens to every word in real time." },
  { startMs: 22200, text: "When you stop, the analysis is instant." },
  { startMs: 25900, text: "You get three detailed scores — clarity, filler words, and confidence — each with specific coaching on what to improve next time." },
  { startMs: 34300, text: "And your progress is tracked over every session. You can see yourself getting better, rep by rep." },
  { startMs: 40800, text: "This is Vocalis. Train your voice. Own the room." },
]

const PROMPT_TEXT = '"Describe a challenge you\'ve overcome, and what it taught you about yourself."'

const FEEDBACK_ITEMS = [
  {
    icon: '🎯', label: 'Clarity Score', score: 92,
    delta: '+7 from last session', color: '#c8f53a',
    text: 'Strong opening — your main point landed in the first two sentences. Avoid trailing off at the end of key ideas.',
  },
  {
    icon: '⚡', label: 'Filler Words', score: 88,
    delta: '2 detected (down from 9)', color: '#60a5fa',
    text: '"Um" appeared twice near the start. Replace with a confident pause — silence reads as authority.',
  },
  {
    icon: '🔥', label: 'Confidence', score: 95,
    delta: 'Personal best', color: '#f97316',
    text: 'Vocal tone stayed steady throughout. No hesitation on key phrases. Your energy carried well.',
  },
]

const PROGRESS_DATA = [72, 68, 78, 85, 92]

// ─── Scenes ───────────────────────────────────────────────────────────────────

function SceneBrand({ v }: { v: boolean }) {
  return (
    <div style={{ position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',opacity:v?1:0,transition:'opacity 0.6s ease' }}>
      <div style={{ display:'flex',alignItems:'center',gap:18,transform:v?'scale(1) translateY(0)':'scale(0.75) translateY(24px)',transition:'transform 0.7s cubic-bezier(0.34,1.56,0.64,1) 0.1s',marginBottom:24 }}>
        <div style={{ width:60,height:60,background:'#c8f53a',borderRadius:15,display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 0 40px rgba(200,245,58,0.35)',flexShrink:0 }}>
          <div style={{ display:'flex',gap:4,alignItems:'center' }}>
            {[13,21,28,21,13].map((h,i)=><div key={i} style={{ width:4,height:h,background:'#0a0a0a',borderRadius:2 }}/>)}
          </div>
        </div>
        <span style={{ fontSize:'clamp(40px,5.5vw,66px)',fontWeight:900,color:'#fff',letterSpacing:-3,lineHeight:1 }}>Vocalis</span>
      </div>
      <div style={{ height:2,background:'linear-gradient(90deg,#c8f53a,transparent)',marginBottom:22,width:v?320:0,transition:'width 0.9s ease 0.5s' }}/>
      <p style={{ fontSize:13,fontWeight:500,color:'rgba(255,255,255,0.4)',letterSpacing:6,textTransform:'uppercase',opacity:v?1:0,transform:v?'translateY(0)':'translateY(14px)',transition:'all 0.5s ease 0.8s',textAlign:'center' }}>
        Train Your Voice. Own The Room.
      </p>
      <p style={{ fontSize:'clamp(12px,1.6vw,15px)',color:'rgba(255,255,255,0.22)',marginTop:12,opacity:v?1:0,transition:'opacity 0.5s ease 1.2s',textAlign:'center',maxWidth:380,lineHeight:1.5 }}>
        AI-powered communication coaching for the next generation.
      </p>
    </div>
  )
}

const STATS = [
  { num:'68%', text:'of teens say they struggle to speak confidently in front of others' },
  { num:'#1',  text:'skill employers want — communication — is never formally taught in school' },
  { num:'∞',   text:'potential unlocked when you learn to speak with clarity and conviction' },
]

function SceneProblem({ v, e }: { v:boolean; e:number }) {
  return (
    <div style={{ position:'absolute',inset:0,display:'flex',flexDirection:'column',justifyContent:'center',padding:'0 clamp(20px,5%,64px)',opacity:v?1:0,transition:'opacity 0.5s ease' }}>
      <div style={{ fontSize:11,fontWeight:700,letterSpacing:5,color:'#c8f53a',textTransform:'uppercase',marginBottom:22,opacity:v?1:0,transition:'opacity 0.4s ease 0.1s' }}>The Problem</div>
      <div style={{ display:'flex',flexDirection:'column',gap:16 }}>
        {STATS.map((s,i)=>{
          const show = e > i * 1300
          return (
            <div key={i} style={{ display:'flex',alignItems:'flex-start',gap:18,opacity:show?1:0,transform:show?'translateX(0)':'translateX(-28px)',transition:'all 0.5s ease' }}>
              <div style={{ minWidth:64,fontSize:'clamp(26px,3.8vw,38px)',fontWeight:900,color:'#c8f53a',lineHeight:1,letterSpacing:-2 }}>{s.num}</div>
              <div style={{ fontSize:'clamp(12px,1.5vw,14px)',color:'rgba(255,255,255,0.52)',lineHeight:1.6,paddingTop:5,maxWidth:400 }}>{s.text}</div>
            </div>
          )
        })}
      </div>
      <div style={{ marginTop:26,paddingTop:20,borderTop:'1px solid rgba(255,255,255,0.07)',opacity:e>4500?1:0,transition:'opacity 0.5s ease',display:'flex',alignItems:'center',gap:12 }}>
        <div style={{ width:8,height:8,borderRadius:'50%',background:'#c8f53a',boxShadow:'0 0 10px rgba(200,245,58,0.8)',flexShrink:0 }}/>
        <span style={{ fontSize:'clamp(13px,1.7vw,15px)',fontWeight:700,color:'#fff' }}>Vocalis fixes that. Here's how a single rep works.</span>
      </div>
    </div>
  )
}

function ScenePractice({ v, e }: { v:boolean; e:number }) {
  const promptVisible = e > 600
  const charCount     = Math.floor(Math.max(0,Math.min((e-900)/3000,1))*PROMPT_TEXT.length)
  const btnVisible    = e > 3200
  const isRecording   = e > 4400
  const recMs         = Math.max(0,e-4400)
  const showTranscript= e > 5800
  const WORDS         = ['I','think','the','biggest','challenge','I','ever','faced','was','learning','to','speak','up','in','group','settings','without','freezing...']
  const wordCount     = showTranscript ? Math.min(Math.floor((e-5800)/200),WORDS.length) : 0
  const t             = Date.now()/1000

  return (
    <div style={{ position:'absolute',inset:0,display:'flex',flexDirection:'column',justifyContent:'center',padding:'0 clamp(20px,5%,60px)',opacity:v?1:0,transition:'opacity 0.5s ease',gap:12 }}>
      <div style={{ fontSize:11,fontWeight:700,letterSpacing:5,color:'#c8f53a',textTransform:'uppercase',opacity:v?1:0,transition:'opacity 0.4s ease 0.1s' }}>Practice Mode — New Rep</div>
      <div style={{ background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.09)',borderRadius:14,padding:'clamp(14px,2%,22px)',opacity:promptVisible?1:0,transform:promptVisible?'translateY(0)':'translateY(20px)',transition:'all 0.5s ease' }}>
        <div style={{ fontSize:10,fontWeight:700,color:'rgba(255,255,255,0.28)',letterSpacing:4,textTransform:'uppercase',marginBottom:10 }}>Your Prompt</div>
        <div style={{ fontSize:'clamp(12px,1.7vw,15px)',fontWeight:600,color:'#fff',lineHeight:1.65 }}>
          {PROMPT_TEXT.slice(0,charCount)}
          <span style={{ color:'#c8f53a',opacity:!isRecording&&Math.floor(Date.now()/500)%2===0?1:0 }}>|</span>
        </div>
      </div>
      <div style={{ background:'rgba(255,255,255,0.03)',border:isRecording?'1px solid rgba(200,245,58,0.22)':'1px solid rgba(255,255,255,0.07)',borderRadius:14,padding:'clamp(12px,2%,18px)',opacity:btnVisible?1:0,transition:'all 0.4s ease, border-color 0.3s' }}>
        <div style={{ display:'flex',alignItems:'center',gap:3,height:38,marginBottom:12 }}>
          {Array.from({length:46}).map((_,i)=>{
            const amp=isRecording?28:3
            const h=6+amp*Math.abs(Math.sin(t*4+i*0.65))
            return <div key={i} style={{ flex:1,height:h,borderRadius:2,background:isRecording?'#c8f53a':'rgba(200,245,58,0.16)',transition:'height 0.07s,background 0.3s' }}/>
          })}
        </div>
        <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between' }}>
          <div style={{ display:'flex',alignItems:'center',gap:10 }}>
            <div style={{ width:36,height:36,borderRadius:'50%',background:isRecording?'#c8f53a':'rgba(200,245,58,0.1)',border:isRecording?'none':'2px solid rgba(200,245,58,0.28)',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:isRecording?'0 0 24px rgba(200,245,58,0.45)':'none',transition:'all 0.3s',flexShrink:0 }}>
              {isRecording?<div style={{ width:11,height:11,background:'#0a0a0a',borderRadius:2 }}/>:<div style={{ width:13,height:13,background:'#c8f53a',borderRadius:'50%' }}/>}
            </div>
            <div>
              <div style={{ fontSize:13,fontWeight:700,color:isRecording?'#c8f53a':'rgba(255,255,255,0.42)',transition:'color 0.3s',lineHeight:1 }}>{isRecording?'● Recording...':'Tap to Record'}</div>
              {isRecording&&<div style={{ fontSize:11,color:'rgba(255,255,255,0.28)',marginTop:3 }}>Speak clearly and naturally</div>}
            </div>
          </div>
          {isRecording&&<span style={{ fontSize:17,fontWeight:800,color:'rgba(255,255,255,0.2)',fontVariantNumeric:'tabular-nums' }}>{String(Math.floor(recMs/1000)).padStart(2,'0')}:{String(Math.floor((recMs%1000)/10)).padStart(2,'0')}</span>}
        </div>
      </div>
      {showTranscript&&(
        <div style={{ background:'rgba(200,245,58,0.03)',border:'1px solid rgba(200,245,58,0.11)',borderRadius:12,padding:'11px 15px' }}>
          <div style={{ fontSize:10,fontWeight:700,color:'rgba(200,245,58,0.55)',letterSpacing:4,textTransform:'uppercase',marginBottom:7 }}>Live Transcript</div>
          <div style={{ fontSize:'clamp(11px,1.4vw,13px)',color:'rgba(255,255,255,0.5)',lineHeight:1.6 }}>
            {WORDS.slice(0,wordCount).join(' ')}
            {wordCount<WORDS.length&&<span style={{ color:'#c8f53a',opacity:Math.floor(Date.now()/400)%2===0?1:0 }}> |</span>}
          </div>
        </div>
      )}
    </div>
  )
}

function SceneProcessing({ v, e }: { v:boolean; e:number }) {
  const t = Date.now()/1000
  const steps = [
    { label:'Transcribing audio...', done:e>800 },
    { label:'Analyzing speech patterns...', done:e>1700 },
    { label:'Generating coaching feedback...', done:e>2600 },
  ]
  return (
    <div style={{ position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',opacity:v?1:0,transition:'opacity 0.5s ease',gap:28 }}>
      <div style={{ position:'relative',width:76,height:76 }}>
        <div style={{ position:'absolute',inset:0,borderRadius:'50%',background:'rgba(200,245,58,0.1)',transform:`scale(${1+0.18*Math.sin(t*3)})`,transition:'transform 0.05s' }}/>
        <div style={{ position:'absolute',inset:8,borderRadius:'50%',background:'#c8f53a',display:'flex',alignItems:'center',justifyContent:'center' }}>
          <div style={{ display:'flex',gap:3.5,alignItems:'center' }}>
            {Array.from({length:5}).map((_,i)=>{
              const h=8+12*Math.abs(Math.sin(t*4+i*0.9))
              return <div key={i} style={{ width:3.5,height:h,background:'#0a0a0a',borderRadius:2,transition:'height 0.06s' }}/>
            })}
          </div>
        </div>
      </div>
      <div style={{ display:'flex',flexDirection:'column',gap:12,minWidth:250 }}>
        {steps.map((s,i)=>(
          <div key={i} style={{ display:'flex',alignItems:'center',gap:12,opacity:e>i*900?1:0.18,transition:'opacity 0.4s ease' }}>
            <div style={{ width:20,height:20,borderRadius:'50%',background:s.done?'#c8f53a':'rgba(255,255,255,0.08)',border:s.done?'none':'2px solid rgba(255,255,255,0.18)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,transition:'all 0.3s' }}>
              {s.done&&<svg width="10" height="10" viewBox="0 0 10 10"><polyline points="1.5,5 4,7.5 8.5,2.5" fill="none" stroke="#0a0a0a" strokeWidth="1.8" strokeLinecap="round"/></svg>}
            </div>
            <span style={{ fontSize:13,color:s.done?'#fff':'rgba(255,255,255,0.38)',fontWeight:s.done?600:400,transition:'all 0.3s' }}>{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function SceneFeedback({ v, e }: { v:boolean; e:number }) {
  return (
    <div style={{ position:'absolute',inset:0,display:'flex',flexDirection:'column',justifyContent:'center',padding:'0 clamp(20px,5%,60px)',opacity:v?1:0,transition:'opacity 0.5s ease' }}>
      <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16,flexWrap:'wrap',gap:10 }}>
        <div>
          <div style={{ fontSize:11,fontWeight:700,letterSpacing:5,color:'#c8f53a',textTransform:'uppercase',marginBottom:6 }}>AI Coaching Report</div>
          <div style={{ fontSize:'clamp(18px,2.8vw,26px)',fontWeight:900,color:'#fff',letterSpacing:-1,lineHeight:1 }}>Here&apos;s your breakdown.</div>
        </div>
        <div style={{ background:'rgba(200,245,58,0.07)',border:'1px solid rgba(200,245,58,0.18)',borderRadius:100,padding:'6px 14px',display:'flex',alignItems:'center',gap:7,opacity:v?1:0,transition:'opacity 0.4s ease 0.3s' }}>
          <div style={{ width:6,height:6,borderRadius:'50%',background:'#c8f53a',boxShadow:'0 0 6px rgba(200,245,58,0.8)' }}/>
          <span style={{ fontSize:11,fontWeight:700,color:'#c8f53a' }}>Analysis Complete</span>
        </div>
      </div>
      <div style={{ display:'flex',flexDirection:'column',gap:9 }}>
        {FEEDBACK_ITEMS.map((item,i)=>{
          const delay = i*1000
          const show  = e>delay
          const barPct= show?Math.min(Math.max(0,(e-delay-400)/900),1)*item.score:0
          return (
            <div key={item.label} style={{ background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:13,padding:'clamp(12px,1.8%,17px) clamp(14px,2.2%,20px)',opacity:show?1:0,transform:show?'translateY(0)':'translateY(16px)',transition:`opacity 0.45s ease ${delay*0.001}s,transform 0.45s ease ${delay*0.001}s` }}>
              <div style={{ display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:8,gap:12 }}>
                <div style={{ display:'flex',alignItems:'center',gap:9,flex:1 }}>
                  <span style={{ fontSize:17 }}>{item.icon}</span>
                  <div>
                    <div style={{ fontSize:13,fontWeight:700,color:'#fff',lineHeight:1 }}>{item.label}</div>
                    <div style={{ fontSize:11,color:item.color,fontWeight:600,marginTop:2 }}>{item.delta}</div>
                  </div>
                </div>
                <span style={{ fontSize:22,fontWeight:900,color:item.color,letterSpacing:-1 }}>{Math.round(barPct)}</span>
              </div>
              <div style={{ height:3,background:'rgba(255,255,255,0.07)',borderRadius:2,marginBottom:8,overflow:'hidden' }}>
                <div style={{ height:'100%',width:`${barPct}%`,background:`linear-gradient(90deg,${item.color},${item.color}88)`,borderRadius:2,transition:'width 0.8s ease' }}/>
              </div>
              <div style={{ fontSize:'clamp(10px,1.3vw,12px)',color:'rgba(255,255,255,0.36)',lineHeight:1.5 }}>{item.text}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function SceneProgress({ v, e }: { v:boolean; e:number }) {
  const rp  = Math.min(e/2000,1)
  const num = Math.round(65+rp*27)
  const C   = 2*Math.PI*76
  return (
    <div style={{ position:'absolute',inset:0,display:'flex',flexDirection:'column',justifyContent:'center',padding:'0 clamp(20px,5%,60px)',opacity:v?1:0,transition:'opacity 0.5s ease' }}>
      <div style={{ fontSize:11,fontWeight:700,letterSpacing:5,color:'#c8f53a',textTransform:'uppercase',marginBottom:18 }}>Your Progress</div>
      <div style={{ display:'flex',gap:'clamp(14px,3%,26px)',alignItems:'flex-start',flexWrap:'wrap' }}>
        <div style={{ display:'flex',flexDirection:'column',alignItems:'center',gap:12,minWidth:130 }}>
          <div style={{ position:'relative',width:152,height:152 }}>
            <div style={{ position:'absolute',inset:0,borderRadius:'50%',background:'radial-gradient(circle,rgba(200,245,58,0.1) 0%,transparent 65%)' }}/>
            <svg width="152" height="152" style={{ position:'absolute',inset:0,transform:'rotate(-90deg)' }}>
              <circle cx="76" cy="76" r="76" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5"/>
              <circle cx="76" cy="76" r="76" fill="none" stroke="#c8f53a" strokeWidth="5" strokeDasharray={C} strokeDashoffset={C*(1-rp*0.94)} strokeLinecap="round"/>
            </svg>
            <div style={{ position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center' }}>
              <span style={{ fontSize:42,fontWeight:900,color:'#fff',letterSpacing:-3,lineHeight:1 }}>{num}</span>
              <span style={{ fontSize:11,color:'rgba(255,255,255,0.32)',letterSpacing:1 }}>/100</span>
            </div>
          </div>
          <div style={{ textAlign:'center' }}>
            <div style={{ fontSize:13,fontWeight:700,color:'#fff' }}>Clarity Score</div>
            <div style={{ fontSize:11,color:'rgba(255,255,255,0.38)',marginTop:2 }}>This session</div>
          </div>
          <div style={{ background:'#c8f53a',borderRadius:100,padding:'7px 16px',fontSize:12,fontWeight:800,color:'#0a0a0a',opacity:e>1500?1:0,transform:e>1500?'scale(1)':'scale(0.8)',transition:'all 0.45s cubic-bezier(0.34,1.56,0.64,1)' }}>
            🏆 Personal Best
          </div>
        </div>
        <div style={{ flex:1,display:'flex',flexDirection:'column',gap:11,minWidth:150 }}>
          <div style={{ background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:13,padding:'15px 17px',opacity:e>2200?1:0,transform:e>2200?'translateY(0)':'translateY(12px)',transition:'all 0.5s ease' }}>
            <div style={{ fontSize:10,fontWeight:600,color:'rgba(255,255,255,0.32)',letterSpacing:3,textTransform:'uppercase',marginBottom:12 }}>Last 5 Sessions</div>
            <div style={{ display:'flex',alignItems:'flex-end',gap:6,height:50 }}>
              {PROGRESS_DATA.map((val,i)=>{
                const h     =(val/100)*50
                const isLast=i===PROGRESS_DATA.length-1
                const delay =i*160
                const shown =e>2300+delay
                return (
                  <div key={i} style={{ flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:5 }}>
                    <div style={{ width:'100%',height:shown?h:0,background:isLast?'#c8f53a':'rgba(200,245,58,0.28)',borderRadius:3,transition:`height 0.5s ease ${delay}ms`,boxShadow:isLast?'0 0 10px rgba(200,245,58,0.35)':'none' }}/>
                    <span style={{ fontSize:10,color:isLast?'#c8f53a':'rgba(255,255,255,0.22)',fontWeight:isLast?700:400 }}>{val}</span>
                  </div>
                )
              })}
            </div>
          </div>
          <div style={{ display:'flex',gap:10 }}>
            {[{e:'🔥',n:'5',l:'Day streak',d:3000},{e:'🪙',n:'+20',l:'Tokens earned',c:'#c8f53a',d:3200}].map((s,i)=>(
              <div key={i} style={{ flex:1,background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:13,padding:'13px 15px',opacity:e>s.d?1:0,transition:`opacity 0.4s ease ${i*0.15}s` }}>
                <div style={{ fontSize:19 }}>{s.e}</div>
                <div style={{ fontSize:21,fontWeight:900,color:s.c||'#fff',letterSpacing:-1,marginTop:4 }}>{s.n}</div>
                <div style={{ fontSize:11,color:'rgba(255,255,255,0.32)',marginTop:2 }}>{s.l}</div>
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
      <div style={{ position:'absolute',inset:0,background:'radial-gradient(ellipse 65% 55% at 50% 50%,rgba(200,245,58,0.08) 0%,transparent 70%)' }}/>
      <div style={{ fontSize:'clamp(46px,7vw,78px)',fontWeight:900,color:'#fff',letterSpacing:-4,lineHeight:0.92,textAlign:'center',marginBottom:18,transform:v?'translateY(0)':'translateY(32px)',transition:'transform 0.7s cubic-bezier(0.34,1.56,0.64,1) 0.1s' }}>
        Own <span style={{ color:'#c8f53a' }}>the</span><br/>room.
      </div>
      <div style={{ fontSize:12,color:'rgba(255,255,255,0.28)',letterSpacing:5,textTransform:'uppercase',marginBottom:30,opacity:v?1:0,transition:'opacity 0.5s ease 0.5s' }}>
        vocalis-zeta.vercel.app
      </div>
      <div style={{ display:'flex',alignItems:'center',gap:20,opacity:v?1:0,transition:'opacity 0.5s ease 0.8s' }}>
        <div style={{ display:'flex',alignItems:'center',gap:11 }}>
          <div style={{ width:34,height:34,background:'#c8f53a',borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center' }}>
            <div style={{ display:'flex',gap:3,alignItems:'center' }}>
              {[8,13,17,13,8].map((h,i)=><div key={i} style={{ width:3,height:h,background:'#0a0a0a',borderRadius:1.5 }}/>)}
            </div>
          </div>
          <span style={{ fontSize:24,fontWeight:900,color:'#fff',letterSpacing:-1 }}>Vocalis</span>
        </div>
        <div style={{ width:1,height:24,background:'rgba(255,255,255,0.1)' }}/>
        <span style={{ fontSize:13,color:'rgba(255,255,255,0.4)',fontWeight:500 }}>Start free today</span>
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function HowItWorksSection() {
  const sectionRef   = useRef<HTMLDivElement>(null)
  const rafRef       = useRef<number>(0)
  const startTimeRef = useRef<number>(0)
  const timeoutRefs  = useRef<ReturnType<typeof setTimeout>[]>([])
  const audioRefs    = useRef<(HTMLAudioElement|null)[]>([])

  const [started,      setStarted]      = useState(false)
  const [audioReady,   setAudioReady]   = useState(false)
  const [elapsed,      setElapsed]      = useState(0)
  const [sceneId,      setSceneId]      = useState('brand')
  const [sceneElapsed, setSceneElapsed] = useState(0)
  const [,             tick_]           = useState(0)

  // Pre-fetch ElevenLabs audio on mount
  useEffect(()=>{
    let dead=false
    async function go() {
      try {
        const clips=await Promise.all(NARRATION_LINES.map(async({text})=>{
          const r=await fetch('/api/narrate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text})})
          if (!r.ok) return null
          const blob=await r.blob()
          const a=new Audio(URL.createObjectURL(blob))
          a.preload='auto'
          return a
        }))
        if (!dead){ audioRefs.current=clips; setAudioReady(true) }
      } catch { /* fall back to Web Speech */ }
    }
    go()
    return ()=>{ dead=true }
  },[])

  const rafTick = useCallback(()=>{
    const ms=Math.min(Date.now()-startTimeRef.current,TOTAL_MS)
    setElapsed(ms)
    const s=SCENES.find(x=>ms>=x.start&&ms<x.end)??SCENES[SCENES.length-1]
    setSceneId(s.id)
    setSceneElapsed(ms-s.start)
    tick_(n=>n+1)
    if (ms<TOTAL_MS) rafRef.current=requestAnimationFrame(rafTick)
  },[])

  const startDemo=useCallback(()=>{
    cancelAnimationFrame(rafRef.current)
    timeoutRefs.current.forEach(clearTimeout); timeoutRefs.current=[]
    audioRefs.current.forEach(a=>{if(a){a.pause();a.currentTime=0}})
    window.speechSynthesis?.cancel()

    startTimeRef.current=Date.now()
    setElapsed(0); setSceneId('brand'); setSceneElapsed(0); setStarted(true)
    rafRef.current=requestAnimationFrame(rafTick)

    if (audioReady&&audioRefs.current.length) {
      // ElevenLabs: schedule each clip at its startMs
      NARRATION_LINES.forEach(({startMs},i)=>{
        const t=setTimeout(()=>{
          const a=audioRefs.current[i]
          if (!a) return
          a.currentTime=0
          a.play().catch(()=>{})
        },startMs)
        timeoutRefs.current.push(t)
      })
    } else if ('speechSynthesis' in window) {
      // ── FIXED: load voices properly on Chrome/Windows, then speak ──
      const speak = (text: string) => {
        window.speechSynthesis.cancel()
        const u = new SpeechSynthesisUtterance(text)
        u.rate = 0.88
        u.pitch = 1.05
        u.volume = 1.0
        // getVoices() is async on Chrome — wait for onvoiceschanged if empty
        const trySpeak = () => {
          const voices = window.speechSynthesis.getVoices()
          const pref = voices.find(v =>
            v.lang === 'en-US' && (v.name.includes('Google') || v.localService === false)
          ) ?? voices.find(v => v.lang.startsWith('en')) ?? voices[0]
          if (pref) u.voice = pref
          window.speechSynthesis.speak(u)
        }
        if (window.speechSynthesis.getVoices().length > 0) {
          trySpeak()
        } else {
          window.speechSynthesis.onvoiceschanged = () => {
            window.speechSynthesis.onvoiceschanged = null
            trySpeak()
          }
        }
      }

      NARRATION_LINES.forEach(({ startMs, text }) => {
        const t = setTimeout(() => speak(text), startMs)
        timeoutRefs.current.push(t)
      })
    }
  },[rafTick,audioReady])

  // Auto-play on scroll into view
  useEffect(()=>{
    const obs=new IntersectionObserver(([e])=>{ if(e.isIntersecting&&!started) startDemo() },{threshold:0.5})
    if (sectionRef.current) obs.observe(sectionRef.current)
    return ()=>obs.disconnect()
  },[started,startDemo])

  useEffect(()=>()=>{
    cancelAnimationFrame(rafRef.current)
    timeoutRefs.current.forEach(clearTimeout)
    audioRefs.current.forEach(a=>{if(a)a.pause()})
    window.speechSynthesis?.cancel()
  },[])

  const STEP_LABELS=[
    {id:'practice',label:'① Record a rep'},
    {id:'feedback',label:'② Get AI feedback'},
    {id:'progress',label:'③ Track progress'},
  ]

  return (
    <section id="how-it-works" ref={sectionRef} style={{ position:'relative',padding:'clamp(64px,8vw,100px) clamp(20px,5vw,40px)',background:'#0a0a0a',overflow:'hidden' }}>
      <div style={{ position:'absolute',left:'50%',top:'25%',transform:'translate(-50%,-50%)',width:'90vw',height:'90vw',maxWidth:1000,maxHeight:1000,borderRadius:'50%',background:'radial-gradient(circle,rgba(200,245,58,0.04) 0%,transparent 65%)',pointerEvents:'none' }}/>

      <div style={{ maxWidth:1020,margin:'0 auto',position:'relative',zIndex:1 }}>
        <div style={{ marginBottom:40,display:'flex',alignItems:'flex-end',justifyContent:'space-between',flexWrap:'wrap',gap:16 }}>
          <div>
            <p style={{ fontSize:11,fontWeight:700,letterSpacing:'0.35em',color:'#c8f53a',textTransform:'uppercase',margin:'0 0 10px' }}>See It In Action</p>
            <h2 style={{ fontSize:'clamp(30px,5vw,54px)',fontWeight:900,letterSpacing:'-.04em',color:'#fff',lineHeight:0.95,margin:0 }}>
              How Vocalis<br/><span style={{ color:'#c8f53a' }}>actually works.</span>
            </h2>
          </div>
          <div style={{ display:'flex',alignItems:'center',gap:12 }}>
            <div style={{ display:'flex',alignItems:'center',gap:7,opacity:0.45 }}>
              <div style={{ width:6,height:6,borderRadius:'50%',background:audioReady?'#c8f53a':'rgba(255,255,255,0.3)',transition:'background 0.3s' }}/>
              <span style={{ fontSize:11,color:'rgba(255,255,255,0.4)',fontWeight:500 }}>{audioReady?'AI voice ready':'Loading voice...'}</span>
            </div>
            {started&&(
              <button onClick={startDemo} style={{ background:'rgba(200,245,58,0.07)',border:'1px solid rgba(200,245,58,0.2)',borderRadius:100,padding:'9px 20px',cursor:'pointer',fontSize:12,fontWeight:700,color:'#c8f53a',letterSpacing:1 }}>
                ↺ Replay
              </button>
            )}
          </div>
        </div>

        <div style={{ position:'relative',borderRadius:20,overflow:'hidden',border:'1px solid rgba(255,255,255,0.08)',boxShadow:'0 0 80px rgba(200,245,58,0.06),0 40px 80px rgba(0,0,0,0.75)',background:'#0d0d0d',aspectRatio:'16/9',minHeight:260 }}>
          <div style={{ position:'absolute',inset:0,backgroundImage:'linear-gradient(rgba(200,245,58,0.016) 1px,transparent 1px),linear-gradient(90deg,rgba(200,245,58,0.016) 1px,transparent 1px)',backgroundSize:'56px 56px' }}/>
          <div style={{ position:'absolute',top:0,left:0,right:0,height:42,background:'rgba(0,0,0,0.72)',backdropFilter:'blur(16px)',borderBottom:'1px solid rgba(255,255,255,0.06)',display:'flex',alignItems:'center',padding:'0 16px',gap:10,zIndex:10 }}>
            <div style={{ display:'flex',gap:5.5 }}>
              {['#ff5f57','#ffbd2e','#28ca41'].map(c=><div key={c} style={{ width:9,height:9,borderRadius:'50%',background:c,opacity:0.65 }}/>)}
            </div>
            <div style={{ flex:1,display:'flex',justifyContent:'center' }}>
              <div style={{ background:'rgba(255,255,255,0.055)',borderRadius:5,padding:'3px 14px',fontSize:10,color:'rgba(255,255,255,0.28)' }}>vocalis-zeta.vercel.app</div>
            </div>
            <div style={{ display:'flex',alignItems:'center',gap:8 }}>
              <div style={{ width:22,height:22,background:'#c8f53a',borderRadius:5,display:'flex',alignItems:'center',justifyContent:'center' }}>
                <div style={{ display:'flex',gap:2,alignItems:'center' }}>
                  {[6,9,12,9,6].map((h,i)=><div key={i} style={{ width:2,height:h,background:'#0a0a0a',borderRadius:1 }}/>)}
                </div>
              </div>
              <span style={{ fontSize:12,fontWeight:800,color:'#fff' }}>Vocalis</span>
              <div style={{ marginLeft:3,fontSize:10,fontWeight:700,color:'#0a0a0a',background:'#c8f53a',borderRadius:100,padding:'3px 9px' }}>New Rep →</div>
            </div>
          </div>

          <div style={{ position:'absolute',inset:'42px 0 0 0' }}>
            <SceneBrand      v={sceneId==='brand'} />
            <SceneProblem    v={sceneId==='problem'}    e={sceneElapsed} />
            <ScenePractice   v={sceneId==='practice'}   e={sceneElapsed} />
            <SceneProcessing v={sceneId==='processing'} e={sceneElapsed} />
            <SceneFeedback   v={sceneId==='feedback'}   e={sceneElapsed} />
            <SceneProgress   v={sceneId==='progress'}   e={sceneElapsed} />
            <SceneOutro      v={sceneId==='outro'} />
          </div>

          <div style={{ position:'absolute',bottom:12,left:'50%',transform:'translateX(-50%)',display:'flex',gap:5,zIndex:10 }}>
            {SCENES.map(s=>(
              <div key={s.id} style={{ width:sceneId===s.id?17:5,height:5,borderRadius:3,background:sceneId===s.id?'#c8f53a':'rgba(255,255,255,0.16)',transition:'all 0.35s ease' }}/>
            ))}
          </div>

          {!started&&(
            <div onClick={startDemo} style={{ position:'absolute',inset:0,zIndex:20,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',background:'rgba(10,10,10,0.9)',backdropFilter:'blur(6px)',cursor:'pointer' }}>
              <div style={{ width:68,height:68,borderRadius:'50%',background:'#c8f53a',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 0 50px rgba(200,245,58,0.45)',marginBottom:16 }}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="#0a0a0a"><polygon points="5,3 19,12 5,21"/></svg>
              </div>
              <span style={{ fontSize:15,color:'rgba(255,255,255,0.6)',fontWeight:600,marginBottom:6 }}>Watch the demo</span>
              <span style={{ fontSize:11,color:'rgba(255,255,255,0.25)' }}>
                {audioReady?'44 seconds · ElevenLabs AI voice':'44 seconds · loading voice...'}
              </span>
            </div>
          )}
        </div>

        <div style={{ height:2,background:'rgba(255,255,255,0.06)',borderRadius:1,overflow:'hidden' }}>
          <div style={{ height:'100%',width:`${(elapsed/TOTAL_MS)*100}%`,background:'linear-gradient(90deg,#c8f53a,#a8e020)',transition:'width 0.1s linear' }}/>
        </div>

        <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginTop:16,flexWrap:'wrap',gap:10 }}>
          <div style={{ display:'flex',gap:'clamp(12px,3vw,26px)',flexWrap:'wrap' }}>
            {STEP_LABELS.map(({id,label})=>(
              <div key={id} style={{ display:'flex',alignItems:'center',gap:7 }}>
                <div style={{ width:6,height:6,borderRadius:'50%',background:sceneId===id?'#c8f53a':'rgba(255,255,255,0.18)',boxShadow:sceneId===id?'0 0 8px rgba(200,245,58,0.7)':'none',transition:'all 0.3s',flexShrink:0 }}/>
                <span style={{ fontSize:12,color:sceneId===id?'rgba(255,255,255,0.7)':'rgba(255,255,255,0.28)',fontWeight:500,transition:'color 0.3s' }}>{label}</span>
              </div>
            ))}
          </div>
          <span style={{ fontSize:11,color:'rgba(255,255,255,0.18)',fontWeight:500 }}>
            {audioReady?'🎙 ElevenLabs AI voice':'44s demo'}
          </span>
        </div>
      </div>
    </section>
  )
}

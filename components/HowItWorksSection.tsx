'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

// ─── Timing ───────────────────────────────────────────────────────────────────
const TOTAL_MS = 16000
const SCENES = [
  { id: 'brand',    start: 0,     end: 2500  },
  { id: 'practice', start: 2500,  end: 7000  },
  { id: 'feedback', start: 7000,  end: 12000 },
  { id: 'score',    start: 12000, end: 14500 },
  { id: 'outro',    start: 14500, end: 16000 },
]
const NARRATION = [
  { time: 400,   text: "Meet Vocalis — AI communication coaching built for teens." },
  { time: 2800,  text: "You get a prompt, hit record, and start speaking." },
  { time: 5500,  text: "The AI listens in real time — watching your clarity and filler words." },
  { time: 7200,  text: "Instant feedback after every rep. No waiting." },
  { time: 12200, text: "Your clarity score improves with every session." },
  { time: 14600, text: "Build the voice that owns every room." },
]
const FEEDBACK_ITEMS = [
  { icon: '🎯', label: 'Clarity',      score: 92, text: 'Strong structure. Key point landed in the first sentence.' },
  { icon: '⚡', label: 'Filler Words', score: 88, text: 'Only 2 fillers detected. Down from 7 last session.' },
  { icon: '🔥', label: 'Confidence',   score: 95, text: 'Tone was steady. No hesitation on key phrases.' },
]
const PROMPT_TEXT = '"Describe a challenge you\'ve overcome and what it taught you."'

// ─── Scenes ───────────────────────────────────────────────────────────────────

function SceneBrand({ visible }: { visible: boolean }) {
  return (
    <div style={{ position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',opacity:visible?1:0,transition:'opacity 0.5s ease' }}>
      <div style={{ display:'flex',alignItems:'center',gap:20,transform:visible?'scale(1)':'scale(0.8)',transition:'transform 0.6s cubic-bezier(0.34,1.56,0.64,1)',marginBottom:24 }}>
        <div style={{ width:64,height:64,background:'#c8f53a',borderRadius:16,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
          <div style={{ display:'flex',gap:4,alignItems:'center' }}>
            {[14,22,30,22,14].map((h,i)=><div key={i} style={{ width:4,height:h,background:'#0a0a0a',borderRadius:2 }}/>)}
          </div>
        </div>
        <span style={{ fontSize:'clamp(44px,6vw,72px)',fontWeight:900,color:'#fff',letterSpacing:-3,lineHeight:1 }}>Vocalis</span>
      </div>
      <div style={{ height:2,background:'linear-gradient(90deg,#c8f53a,transparent)',marginBottom:20,width:visible?340:0,transition:'width 0.8s ease 0.3s' }}/>
      <p style={{ fontSize:13,fontWeight:500,color:'rgba(255,255,255,0.4)',letterSpacing:5,textTransform:'uppercase',opacity:visible?1:0,transform:visible?'translateY(0)':'translateY(16px)',transition:'all 0.5s ease 0.6s' }}>
        Train Your Voice. Own The Room.
      </p>
    </div>
  )
}

function ScenePractice({ visible, elapsed }: { visible:boolean; elapsed:number }) {
  const progress    = Math.min(elapsed/2000,1)
  const isRecording = elapsed > 1800
  const charCount   = Math.floor(progress*PROMPT_TEXT.length)
  const t           = Date.now()/1000
  return (
    <div style={{ position:'absolute',inset:0,display:'flex',flexDirection:'column',justifyContent:'center',padding:'0 clamp(20px,5%,72px)',opacity:visible?1:0,transition:'opacity 0.4s ease' }}>
      <div style={{ fontSize:11,fontWeight:700,letterSpacing:5,color:'#c8f53a',textTransform:'uppercase',marginBottom:18,opacity:visible?1:0,transition:'opacity 0.4s ease 0.1s' }}>
        Practice Mode — New Rep
      </div>
      <div style={{ background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:20,padding:'clamp(18px,3%,32px)',transform:visible?'translateY(0)':'translateY(32px)',transition:'transform 0.5s cubic-bezier(0.34,1.56,0.64,1) 0.1s' }}>
        <div style={{ marginBottom:22 }}>
          <div style={{ fontSize:10,fontWeight:700,color:'rgba(255,255,255,0.3)',letterSpacing:4,textTransform:'uppercase',marginBottom:10 }}>Your Prompt</div>
          <div style={{ fontSize:'clamp(13px,2vw,17px)',fontWeight:600,color:'#fff',lineHeight:1.5 }}>
            {PROMPT_TEXT.slice(0,charCount)}<span style={{ color:'#c8f53a',opacity:Math.floor(Date.now()/500)%2===0?1:0 }}>|</span>
          </div>
        </div>
        <div style={{ display:'flex',alignItems:'center',gap:3,height:44,marginBottom:18 }}>
          {Array.from({length:44}).map((_,i)=>{
            const amp=isRecording?36:3
            const h=8+amp*Math.abs(Math.sin(t*3.5+i*0.6))
            return <div key={i} style={{ width:3,height:h,borderRadius:2,background:isRecording?'#c8f53a':'rgba(200,245,58,0.2)',transition:'height 0.08s' }}/>
          })}
        </div>
        <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between' }}>
          <div style={{ display:'flex',alignItems:'center',gap:12 }}>
            <div style={{ width:40,height:40,borderRadius:'50%',background:isRecording?'#c8f53a':'rgba(200,245,58,0.12)',border:isRecording?'none':'2px solid rgba(200,245,58,0.35)',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:isRecording?'0 0 20px rgba(200,245,58,0.4)':'none',transition:'all 0.3s' }}>
              {isRecording?<div style={{ width:12,height:12,background:'#0a0a0a',borderRadius:2 }}/>:<div style={{ width:14,height:14,background:'#c8f53a',borderRadius:'50%' }}/>}
            </div>
            <span style={{ fontSize:13,fontWeight:700,color:isRecording?'#c8f53a':'rgba(255,255,255,0.4)',transition:'color 0.3s' }}>
              {isRecording?'● Recording...':'Tap to Record'}
            </span>
          </div>
          {isRecording&&<span style={{ fontSize:16,fontWeight:800,color:'rgba(255,255,255,0.25)' }}>00:{String(Math.floor((elapsed-1800)/100)).padStart(2,'0')}</span>}
        </div>
      </div>
    </div>
  )
}

function SceneFeedback({ visible, elapsed }: { visible:boolean; elapsed:number }) {
  return (
    <div style={{ position:'absolute',inset:0,display:'flex',flexDirection:'column',justifyContent:'center',padding:'0 clamp(20px,5%,72px)',opacity:visible?1:0,transition:'opacity 0.4s ease' }}>
      <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:22,flexWrap:'wrap',gap:10 }}>
        <div>
          <div style={{ fontSize:11,fontWeight:700,letterSpacing:5,color:'#c8f53a',textTransform:'uppercase',marginBottom:6 }}>AI Feedback</div>
          <div style={{ fontSize:'clamp(20px,3.5vw,30px)',fontWeight:900,color:'#fff',letterSpacing:-1,lineHeight:1 }}>Here&apos;s what we found.</div>
        </div>
        <div style={{ background:'rgba(200,245,58,0.08)',border:'1px solid rgba(200,245,58,0.2)',borderRadius:100,padding:'7px 14px',display:'flex',alignItems:'center',gap:7,opacity:visible?1:0,transition:'opacity 0.4s ease 0.2s' }}>
          <div style={{ width:6,height:6,borderRadius:'50%',background:'#c8f53a' }}/>
          <span style={{ fontSize:11,fontWeight:700,color:'#c8f53a' }}>Analysis Complete</span>
        </div>
      </div>
      <div style={{ display:'flex',flexDirection:'column',gap:10 }}>
        {FEEDBACK_ITEMS.map((item,i)=>{
          const delay  =i*300
          const entered=elapsed>delay
          const barPct =entered?Math.min((elapsed-delay-200)/600,1)*item.score:0
          return (
            <div key={item.label} style={{ background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:16,padding:'16px 20px',opacity:entered?1:0,transform:entered?'translateY(0)':'translateY(20px)',transition:`opacity 0.4s ease ${delay}ms,transform 0.4s ease ${delay}ms` }}>
              <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8 }}>
                <div style={{ display:'flex',alignItems:'center',gap:9 }}>
                  <span style={{ fontSize:17 }}>{item.icon}</span>
                  <span style={{ fontSize:13,fontWeight:700,color:'#fff' }}>{item.label}</span>
                </div>
                <span style={{ fontSize:22,fontWeight:900,color:'#c8f53a' }}>{Math.round(barPct)}</span>
              </div>
              <div style={{ height:3,background:'rgba(255,255,255,0.07)',borderRadius:2,marginBottom:8,overflow:'hidden' }}>
                <div style={{ height:'100%',width:`${barPct}%`,background:'linear-gradient(90deg,#c8f53a,#a8e020)',borderRadius:2,transition:'width 0.6s ease' }}/>
              </div>
              <div style={{ fontSize:12,color:'rgba(255,255,255,0.4)',lineHeight:1.5 }}>{item.text}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function SceneScore({ visible, elapsed }: { visible:boolean; elapsed:number }) {
  const ringProgress=Math.min(elapsed/1500,1)
  const num=Math.round(60+ringProgress*35)
  const circumference=2*Math.PI*88
  const dashOffset=circumference*(1-ringProgress*0.95)
  return (
    <div style={{ position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',opacity:visible?1:0,transition:'opacity 0.5s ease' }}>
      <div style={{ position:'absolute',width:'60%',paddingBottom:'60%',borderRadius:'50%',background:'radial-gradient(circle,rgba(200,245,58,0.08) 0%,transparent 65%)',left:'50%',top:'50%',transform:'translate(-50%,-50%)' }}/>
      <div style={{ position:'relative',width:200,height:200,marginBottom:22 }}>
        <svg width="200" height="200" style={{ position:'absolute',inset:0,transform:'rotate(-90deg)' }}>
          <circle cx="100" cy="100" r="88" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6"/>
          <circle cx="100" cy="100" r="88" fill="none" stroke="#c8f53a" strokeWidth="6" strokeDasharray={circumference} strokeDashoffset={dashOffset} strokeLinecap="round"/>
        </svg>
        <div style={{ position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center' }}>
          <span style={{ fontSize:56,fontWeight:900,color:'#fff',letterSpacing:-3,lineHeight:1 }}>{num}</span>
          <span style={{ fontSize:13,color:'rgba(255,255,255,0.35)',letterSpacing:1 }}>/ 100</span>
        </div>
      </div>
      <div style={{ textAlign:'center',marginBottom:18,opacity:elapsed>400?1:0,transform:elapsed>400?'translateY(0)':'translateY(12px)',transition:'all 0.4s ease' }}>
        <div style={{ fontSize:22,fontWeight:900,color:'#fff',letterSpacing:-1 }}>Clarity Score</div>
        <div style={{ fontSize:13,color:'rgba(255,255,255,0.4)',marginTop:4 }}>Your best session yet</div>
      </div>
      <div style={{ background:'#c8f53a',borderRadius:100,padding:'10px 22px',fontSize:13,fontWeight:800,color:'#0a0a0a',letterSpacing:0.5,opacity:elapsed>800?1:0,transform:elapsed>800?'scale(1)':'scale(0.85)',transition:'all 0.4s cubic-bezier(0.34,1.56,0.64,1)' }}>
        🏆 New Personal Best
      </div>
    </div>
  )
}

function SceneOutro({ visible }: { visible:boolean }) {
  return (
    <div style={{ position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',opacity:visible?1:0,transition:'opacity 0.5s ease' }}>
      <div style={{ position:'absolute',width:'60%',paddingBottom:'60%',borderRadius:'50%',background:'radial-gradient(circle,rgba(200,245,58,0.1) 0%,transparent 65%)',left:'50%',top:'50%',transform:'translate(-50%,-50%)' }}/>
      <div style={{ fontSize:'clamp(48px,8vw,88px)',fontWeight:900,color:'#fff',letterSpacing:-4,lineHeight:0.92,textAlign:'center',marginBottom:16,transform:visible?'translateY(0)':'translateY(32px)',transition:'transform 0.6s cubic-bezier(0.34,1.56,0.64,1)' }}>
        Own <span style={{ color:'#c8f53a' }}>the</span><br/>room.
      </div>
      <div style={{ fontSize:12,color:'rgba(255,255,255,0.3)',letterSpacing:5,textTransform:'uppercase',marginBottom:32,opacity:visible?1:0,transition:'opacity 0.4s ease 0.4s' }}>vocalis-zeta.vercel.app</div>
      <div style={{ display:'flex',alignItems:'center',gap:12,opacity:visible?1:0,transition:'opacity 0.4s ease 0.6s' }}>
        <div style={{ width:36,height:36,background:'#c8f53a',borderRadius:9,display:'flex',alignItems:'center',justifyContent:'center' }}>
          <div style={{ display:'flex',gap:3,alignItems:'center' }}>
            {[9,15,19,15,9].map((h,i)=><div key={i} style={{ width:3,height:h,background:'#0a0a0a',borderRadius:1.5 }}/>)}
          </div>
        </div>
        <span style={{ fontSize:26,fontWeight:900,color:'#fff',letterSpacing:-1 }}>Vocalis</span>
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function HowItWorksSection() {
  const sectionRef    = useRef<HTMLDivElement>(null)
  const rafRef        = useRef<number>(0)
  const startTimeRef  = useRef<number>(0)
  const timeoutRefs   = useRef<ReturnType<typeof setTimeout>[]>([])

  const [started,      setStarted]      = useState(false)
  const [elapsed,      setElapsed]      = useState(0)
  const [sceneId,      setSceneId]      = useState('brand')
  const [sceneElapsed, setSceneElapsed] = useState(0)
  const [,             forceRender]     = useState(0)

  const tick = useCallback(() => {
    const ms = Math.min(Date.now()-startTimeRef.current, TOTAL_MS)
    setElapsed(ms)
    const scene = SCENES.find(s=>ms>=s.start&&ms<s.end)??SCENES[SCENES.length-1]
    setSceneId(scene.id)
    setSceneElapsed(ms-scene.start)
    forceRender(n=>n+1)
    if (ms<TOTAL_MS) rafRef.current=requestAnimationFrame(tick)
  }, [])

  const startDemo = useCallback(() => {
    cancelAnimationFrame(rafRef.current)
    timeoutRefs.current.forEach(clearTimeout)
    timeoutRefs.current=[]
    startTimeRef.current=Date.now()
    setElapsed(0); setSceneId('brand'); setSceneElapsed(0); setStarted(true)
    rafRef.current=requestAnimationFrame(tick)
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      NARRATION.forEach(({time,text})=>{
        const t=setTimeout(()=>{
          window.speechSynthesis.cancel()
          const u=new SpeechSynthesisUtterance(text)
          u.rate=0.9; u.pitch=1.05; u.volume=0.85
          const voices=window.speechSynthesis.getVoices()
          const preferred=voices.find(v=>v.name.includes('Google US')||v.name.includes('Samantha')||v.name.includes('Alex'))
          if (preferred) u.voice=preferred
          window.speechSynthesis.speak(u)
        }, time)
        timeoutRefs.current.push(t)
      })
    }
  }, [tick])

  useEffect(()=>{
    const observer=new IntersectionObserver(([e])=>{
      if (e.isIntersecting&&!started) startDemo()
    },{threshold:0.5})
    if (sectionRef.current) observer.observe(sectionRef.current)
    return ()=>observer.disconnect()
  },[started,startDemo])

  useEffect(()=>()=>{
    cancelAnimationFrame(rafRef.current)
    timeoutRefs.current.forEach(clearTimeout)
    window.speechSynthesis?.cancel()
  },[])

  return (
    <section id="how-it-works" ref={sectionRef} style={{ position:'relative',padding:'clamp(60px,8vw,100px) clamp(24px,5vw,40px)',background:'#0a0a0a',overflow:'hidden' }}>
      <div style={{ position:'absolute',left:'50%',top:'20%',transform:'translate(-50%,-50%)',width:'80vw',height:'80vw',maxWidth:900,maxHeight:900,borderRadius:'50%',background:'radial-gradient(circle,rgba(200,245,58,0.05) 0%,transparent 65%)',pointerEvents:'none' }}/>

      <div style={{ maxWidth:1000,margin:'0 auto',position:'relative',zIndex:1 }}>
        {/* Header */}
        <div style={{ marginBottom:40,display:'flex',alignItems:'flex-end',justifyContent:'space-between',flexWrap:'wrap',gap:16 }}>
          <div>
            <p style={{ fontSize:11,fontWeight:700,letterSpacing:'0.35em',color:'#c8f53a',textTransform:'uppercase',marginBottom:10 }}>See It In Action</p>
            <h2 style={{ fontSize:'clamp(32px,5vw,56px)',fontWeight:900,letterSpacing:'-.04em',color:'#fff',lineHeight:0.95,margin:0 }}>
              How Vocalis<br/><span style={{ color:'#c8f53a' }}>actually works.</span>
            </h2>
          </div>
          {started&&(
            <button onClick={startDemo} style={{ background:'rgba(200,245,58,0.07)',border:'1px solid rgba(200,245,58,0.2)',borderRadius:100,padding:'9px 20px',cursor:'pointer',fontSize:12,fontWeight:700,color:'#c8f53a',letterSpacing:1 }}>
              ↺ Replay
            </button>
          )}
        </div>

        {/* Demo window */}
        <div style={{ position:'relative',borderRadius:20,overflow:'hidden',border:'1px solid rgba(255,255,255,0.08)',boxShadow:'0 0 60px rgba(200,245,58,0.07),0 32px 64px rgba(0,0,0,0.7)',background:'#111',aspectRatio:'16/9',minHeight:280 }}>
          {/* Grid */}
          <div style={{ position:'absolute',inset:0,backgroundImage:'linear-gradient(rgba(200,245,58,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(200,245,58,0.02) 1px,transparent 1px)',backgroundSize:'60px 60px' }}/>
          {/* Nav */}
          <div style={{ position:'absolute',top:0,left:0,right:0,height:44,background:'rgba(0,0,0,0.6)',backdropFilter:'blur(12px)',borderBottom:'1px solid rgba(255,255,255,0.06)',display:'flex',alignItems:'center',padding:'0 20px',gap:10,zIndex:10 }}>
            <div style={{ width:28,height:28,background:'#c8f53a',borderRadius:7,display:'flex',alignItems:'center',justifyContent:'center' }}>
              <div style={{ display:'flex',gap:2.5,alignItems:'center' }}>
                {[7,11,14,11,7].map((h,i)=><div key={i} style={{ width:2.5,height:h,background:'#0a0a0a',borderRadius:1 }}/>)}
              </div>
            </div>
            <span style={{ fontSize:14,fontWeight:800,color:'#fff',letterSpacing:-0.5 }}>Vocalis</span>
            <div style={{ flex:1 }}/>
            <div style={{ fontSize:11,fontWeight:700,color:'#0a0a0a',background:'#c8f53a',borderRadius:100,padding:'4px 12px' }}>New Rep →</div>
          </div>

          {/* Scenes */}
          <div style={{ position:'absolute',inset:'44px 0 0 0' }}>
            <SceneBrand    visible={sceneId==='brand'} />
            <ScenePractice visible={sceneId==='practice'} elapsed={sceneElapsed} />
            <SceneFeedback visible={sceneId==='feedback'} elapsed={sceneElapsed} />
            <SceneScore    visible={sceneId==='score'}    elapsed={sceneElapsed} />
            <SceneOutro    visible={sceneId==='outro'} />
          </div>

          {/* Scene dots */}
          <div style={{ position:'absolute',bottom:14,left:'50%',transform:'translateX(-50%)',display:'flex',gap:6,zIndex:10 }}>
            {SCENES.map(s=>(
              <div key={s.id} style={{ width:sceneId===s.id?20:6,height:6,borderRadius:3,background:sceneId===s.id?'#c8f53a':'rgba(255,255,255,0.2)',transition:'all 0.3s ease' }}/>
            ))}
          </div>

          {/* Not-started overlay */}
          {!started&&(
            <div onClick={startDemo} style={{ position:'absolute',inset:0,zIndex:20,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',background:'rgba(10,10,10,0.85)',backdropFilter:'blur(4px)',cursor:'pointer' }}>
              <div style={{ width:64,height:64,borderRadius:'50%',background:'#c8f53a',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 0 40px rgba(200,245,58,0.4)',marginBottom:16 }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="#0a0a0a"><polygon points="5,3 19,12 5,21"/></svg>
              </div>
              <span style={{ fontSize:14,color:'rgba(255,255,255,0.5)',fontWeight:500 }}>Click to preview</span>
            </div>
          )}
        </div>

        {/* Progress bar */}
        <div style={{ height:2,background:'rgba(255,255,255,0.06)',borderRadius:1,overflow:'hidden' }}>
          <div style={{ height:'100%',width:`${(elapsed/TOTAL_MS)*100}%`,background:'linear-gradient(90deg,#c8f53a,#a8e020)',transition:'width 0.1s linear' }}/>
        </div>

        {/* Step labels */}
        <div style={{ display:'flex',gap:'clamp(12px,3vw,28px)',marginTop:16,flexWrap:'wrap' }}>
          {[{id:'practice',label:'① Record a rep'},{id:'feedback',label:'② Get AI feedback'},{id:'score',label:'③ Track progress'}].map(({id,label})=>(
            <div key={id} style={{ display:'flex',alignItems:'center',gap:7 }}>
              <div style={{ width:6,height:6,borderRadius:'50%',background:sceneId===id?'#c8f53a':'rgba(255,255,255,0.2)',transition:'background 0.3s',boxShadow:sceneId===id?'0 0 8px rgba(200,245,58,0.6)':'none' }}/>
              <span style={{ fontSize:12,color:sceneId===id?'rgba(255,255,255,0.7)':'rgba(255,255,255,0.3)',fontWeight:500,transition:'color 0.3s' }}>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

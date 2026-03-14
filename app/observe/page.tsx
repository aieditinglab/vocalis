'use client'
import {useEffect,useState} from 'react'
import {useRouter} from 'next/navigation'
import Nav from '@/components/Nav'
import {getPendingSession,setPendingSession,getSettings,analyzeTranscript} from '@/lib/store'
import {audioStore} from '@/lib/audioStore'

function fmt(s:number){return`${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`}

export default function ObservePage(){
  const router=useRouter()
  const [analysis,setAnalysis]=useState<any>(null)
  const [duration,setDuration]=useState(0)
  const [loading,setLoading]=useState(true)

  useEffect(()=>{
    const p=getPendingSession()
    const audio=audioStore.get()
    const dur=audio.duration||(p as any)?.duration||0
    setDuration(dur)
    const settings=getSettings()
    setTimeout(()=>{
      const transcript=(p as any)?.transcript||''
      const result=analyzeTranscript(transcript||Array(Math.round((dur/60)*150)).fill('word').join(' '),dur,settings.targetWpmMin,settings.targetWpmMax)
      setAnalysis(result)
      setPendingSession({...p,...result,duration:dur})
      setLoading(false)
    },1800)
  },[])

  useEffect(()=>{
    if(!analysis)return
    const scores=[Math.max(0,100-analysis.fillerCount*8),Math.min(100,analysis.pace>0?Math.round((160/Math.max(1,Math.abs(analysis.pace-145)))*20):50),analysis.lengthStatus==='in-range'?100:40,analysis.clarityScore]
    const t=setTimeout(()=>scores.forEach((_,i)=>{const el=document.getElementById(`pf-${i}`);if(el)el.style.width=scores[i]+'%'}),300)
    return()=>clearTimeout(t)
  },[analysis])

  const paceColor=analysis?(analysis.pace>180?'var(--hot)':analysis.pace<110?'var(--amber)':'var(--accent)'):'var(--text-muted)'

  return(<>
    <Nav backHref="/record/session"/>
    <div className="container">
      <p className="eyebrow anim-slide-up anim-d1">STEP 2 OF 5 — OBSERVE</p>
      <h1 className="font-display anim-slide-up anim-d2" style={{fontSize:'clamp(36px,5vw,52px)',fontWeight:900,letterSpacing:'-.04em',marginBottom:'8px'}}>Here&apos;s what the AI heard.</h1>
      <p className="text-muted anim-slide-up anim-d2" style={{fontSize:'16px',marginBottom:'40px'}}>4 metrics from your {fmt(duration)} recording.</p>

      {loading?(
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'14px',marginBottom:'32px'}}>
          {[0,1,2,3].map(i=><div key={i} className="metric-card shimmer" style={{height:'160px',animationDelay:`${i*.1}s`}}/>)}
        </div>
      ):analysis&&(
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'14px',marginBottom:'32px'}}>
          {[
            {label:'Filler Words', val:analysis.fillerCount.toString(), unit:'detected', detail:analysis.fillerCount>0?analysis.fillerWords.slice(0,3).join(' · '):'Clean — no fillers!', color:analysis.fillerCount>5?'var(--hot)':analysis.fillerCount>0?'var(--amber)':'var(--accent)', icon:'🗣'},
            {label:'Speaking Pace',val:analysis.pace>0?analysis.pace.toString():'—', unit:'WPM', detail:analysis.pace>180?'Too fast — slow down':analysis.pace<110?'Too slow — pick it up':'In the ideal range ✓', color:paceColor, icon:'⚡'},
            {label:'Response Length',val:fmt(duration), unit:'', detail:analysis.lengthStatus==='in-range'?'In range ✓':analysis.lengthStatus==='too-short'?'Too short — aim for 30s+':'Great long answer', color:analysis.lengthStatus==='in-range'?'var(--accent)':'var(--amber)', icon:'⏱'},
            {label:'Clarity Score', val:analysis.clarityScore.toString(), unit:'/ 100', detail:analysis.clarityScore>=80?'Excellent':analysis.clarityScore>=60?'Good — improving':'Room to grow', color:'var(--accent)', icon:'✦'},
          ].map((m,i)=>(
            <div key={m.label} className="metric-card" style={{animationDelay:`${i*.1}s`}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'16px'}}>
                <span style={{fontSize:'11px',fontWeight:700,letterSpacing:'.08em',color:'var(--text-muted)'}}>{m.label.toUpperCase()}</span>
                <span style={{fontSize:'18px'}}>{m.icon}</span>
              </div>
              <div style={{display:'flex',alignItems:'baseline',gap:'6px',marginBottom:'8px'}}>
                <span className="font-display" style={{fontSize:'44px',fontWeight:900,letterSpacing:'-.04em',color:m.color}}>{m.val}</span>
                {m.unit&&<span style={{fontSize:'13px',color:'var(--text-muted)',fontWeight:500}}>{m.unit}</span>}
              </div>
              <p style={{fontSize:'12px',color:'var(--text-muted)',marginBottom:'14px'}}>{m.detail}</p>
              <div className="prog-track"><div id={`pf-${i}`} className="prog-fill" style={{background:m.color}}/></div>
            </div>
          ))}
        </div>
      )}

      <button onClick={()=>router.push('/correct')} className="btn btn-primary btn-full btn-lg anim-slide-up anim-d5"
        disabled={loading} style={{opacity:loading?.5:1,display:'flex'}}>
        {loading?'Analyzing...':'See My Coaching →'}
      </button>
    </div>
  </>)
}

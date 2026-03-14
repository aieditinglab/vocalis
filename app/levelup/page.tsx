'use client'
import {useEffect,useState} from 'react'
import {useRouter} from 'next/navigation'
import Nav from '@/components/Nav'
import {getPendingSession,clearPendingSession,saveSession,getSessions,addTokens} from '@/lib/store'
import type {Session} from '@/lib/types'

function fmt(s:number){return`${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`}

function tokensForSession(clarity:number,duration:number,fillerCount:number):number{
  let t=10 // base
  if(clarity>=80)t+=15
  else if(clarity>=60)t+=8
  if(duration>=60)t+=5
  if(fillerCount===0)t+=10
  return t
}

export default function LevelUpPage(){
  const router=useRouter()
  const [session,setSession]=useState<Session|null>(null)
  const [prev,setPrev]=useState<Session|null>(null)
  const [tokensEarned,setTokensEarned]=useState(0)

  useEffect(()=>{
    const p=getPendingSession()
    if(!p)return
    const newSess:Session={
      id:`s_${Date.now()}`,date:new Date().toISOString(),
      category:(p as any).category||'Unknown',prompt:(p as any).prompt||'',
      duration:(p as any).duration||0,fillerCount:(p as any).fillerCount||0,
      fillerWords:(p as any).fillerWords||[],pace:(p as any).pace||0,
      clarityScore:(p as any).clarityScore||0,lengthStatus:(p as any).lengthStatus||'in-range',
      feedback:(p as any).feedback||[],transcriptPreview:(p as any).transcriptPreview||'',
    }
    const sessions=getSessions()
    setPrev(sessions[0]||null)
    saveSession(newSess)
    const earned=tokensForSession(newSess.clarityScore,newSess.duration,newSess.fillerCount)
    addTokens(earned,`Session completed — clarity ${newSess.clarityScore}`)
    setTokensEarned(earned)
    setSession(newSess)
    clearPendingSession()
  },[])

  useEffect(()=>{
    if(!session)return
    const pts=getSessions().slice(0,10).map(s=>s.clarityScore).reverse()
    if(pts.length<2)return
    const W=600,H=80,minV=Math.max(0,Math.min(...pts)-10),maxV=Math.min(100,Math.max(...pts)+10)
    const tx=(i:number)=>(i/(pts.length-1))*W
    const ty=(v:number)=>H-((v-minV)/(maxV-minV))*H
    const pathD=pts.map((v,i)=>`${i===0?'M':'L'} ${tx(i).toFixed(1)} ${ty(v).toFixed(1)}`).join(' ')
    const areaD=pathD+` L ${W} ${H+20} L 0 ${H+20} Z`
    const dots=pts.map((v,i)=>{const last=i===pts.length-1;return`<circle cx="${tx(i).toFixed(1)}" cy="${ty(v).toFixed(1)}" r="${last?5:3}" fill="${last?'#AAFF00':'#1C1C1C'}" stroke="#AAFF00" stroke-width="2"/><text x="${tx(i).toFixed(1)}" y="${(ty(v)-10).toFixed(1)}" text-anchor="middle" fill="#555" font-size="11" font-family="DM Sans,sans-serif">${v}</text>`}).join('')
    const svg=document.getElementById('chart-svg')
    if(svg)svg.innerHTML=`<defs><linearGradient id="g1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#AAFF00" stop-opacity=".22"/><stop offset="100%" stop-color="#AAFF00" stop-opacity="0"/></linearGradient></defs><path d="${areaD}" fill="url(#g1)"/><path d="${pathD}" stroke="#AAFF00" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>${dots}`
  },[session])

  if(!session)return(<><Nav/><div className="container" style={{textAlign:'center',paddingTop:'80px'}}><p className="text-muted">No session data. <button className="btn btn-outline btn-sm" style={{display:'inline-flex',marginLeft:'8px'}} onClick={()=>router.push('/record')}>Start Recording</button></p></div></>)

  const clarityDelta=prev?session.clarityScore-prev.clarityScore:null
  const fillerDelta=prev?session.fillerCount-prev.fillerCount:null
  const sessions=getSessions()

  return(<>
    <Nav rightContent={<span className="text-muted" style={{fontSize:'13px'}}>Session Complete ✓</span>}/>
    <div className="container">
      <p className="eyebrow anim-slide-up anim-d1">STEP 5 — LEVEL UP</p>

      {/* Tokens earned */}
      <div className="anim-slide-up anim-d1" style={{background:'rgba(170,255,0,.06)',border:'1px solid rgba(170,255,0,.2)',borderRadius:'16px',padding:'16px 24px',display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'20px'}}>
        <span style={{fontWeight:600}}>Tokens earned this session</span>
        <span className="font-display" style={{fontSize:'28px',fontWeight:900,color:'var(--accent)'}}>+{tokensEarned} 🪙</span>
      </div>

      {/* Clarity hero */}
      <div className="clarity-hero anim-slide-up anim-d2">
        <p style={{fontSize:'11px',fontWeight:700,letterSpacing:'.12em',color:'var(--accent)',marginBottom:'8px'}}>CLARITY SCORE</p>
        <div className="clarity-num">{session.clarityScore}</div>
        <p className="text-muted" style={{marginTop:'8px'}}>out of 100</p>
        {clarityDelta!==null&&<p style={{fontSize:'14px',color:clarityDelta>=0?'var(--accent)':'var(--hot)',marginTop:'6px'}}>{clarityDelta>=0?`+${clarityDelta}`:clarityDelta} from last session {clarityDelta>=0?'📈':'📉'}</p>}
        {!prev&&<p className="text-muted" style={{fontSize:'13px',marginTop:'6px'}}>First session — baseline set!</p>}
      </div>

      {/* Compare */}
      {prev&&(
        <div className="anim-slide-up anim-d3" style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:'20px',padding:'24px',marginBottom:'14px'}}>
          <p style={{fontSize:'11px',fontWeight:700,letterSpacing:'.1em',color:'var(--text-muted)',marginBottom:'18px'}}>VS LAST SESSION</p>
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'12px'}}>
            {[
              {label:'Fillers',val:session.fillerCount,delta:fillerDelta,better:(fillerDelta??0)<=0},
              {label:'Pace WPM',val:session.pace,delta:null,better:true},
              {label:'Length',val:fmt(session.duration),delta:null,better:true},
              {label:'Clarity',val:session.clarityScore,delta:clarityDelta,better:(clarityDelta??0)>=0,accent:true},
            ].map(c=>(
              <div key={c.label} style={{textAlign:'center'}}>
                <div className="text-muted" style={{fontSize:'11px',marginBottom:'6px'}}>{c.label}</div>
                <div style={{fontSize:typeof c.val==='string'&&c.val.length>4?'14px':'20px',fontWeight:700,color:c.accent?'var(--accent)':'var(--text-primary)'}}>{c.val}</div>
                {c.delta!==null&&<div style={{fontSize:'11px',marginTop:'4px',color:c.better?'var(--accent)':'var(--hot)'}}>{(c.delta??0)>0?'+':''}{c.delta}</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Chart */}
      {sessions.length>=2&&(
        <div className="anim-slide-up anim-d4" style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:'20px',padding:'24px',marginBottom:'24px'}}>
          <p style={{fontSize:'11px',fontWeight:700,letterSpacing:'.1em',color:'var(--text-muted)',marginBottom:'20px'}}>CLARITY TREND — LAST {Math.min(sessions.length,10)} SESSIONS</p>
          <svg id="chart-svg" viewBox="0 0 600 100" width="100%" style={{display:'block',overflow:'visible'}}/>
        </div>
      )}

      <div className="anim-slide-up anim-d5" style={{display:'grid',gridTemplateColumns:'1fr auto',gap:'12px'}}>
        <button className="btn btn-primary btn-lg btn-full" onClick={()=>router.push('/record')}>🎤 Start Another Rep</button>
        <button className="btn btn-outline btn-lg" onClick={()=>router.push('/dashboard')} style={{padding:'18px 24px'}}>Dashboard</button>
      </div>
    </div>
  </>)
}

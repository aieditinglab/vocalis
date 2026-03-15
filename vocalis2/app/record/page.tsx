'use client'
import {useState} from 'react'
import {useRouter} from 'next/navigation'
import Nav from '@/components/Nav'
import {PROMPTS} from '@/lib/types'
import {setPendingSession} from '@/lib/store'

const CATS=[
  {key:'Job Interviews',      icon:'💼',desc:'Interview prep and pitch practice'},
  {key:'College Interviews',  icon:'🎓',desc:'Common admissions questions'},
  {key:'School Presentations',icon:'📚',desc:'Class presentations and speeches'},
  {key:'Public Speaking',     icon:'🎤',desc:'Presentations, debates, and more'},
  {key:'My Own Prompt',       icon:'✏️',desc:'Type your own question'},
]

export default function RecordPage(){
  const router=useRouter()
  const [selected,setSelected]=useState<string|null>(null)
  const [promptIdx,setPromptIdx]=useState(0)
  const [custom,setCustom]=useState('')
  const prompts=selected?PROMPTS[selected]||[]:[]
  const currentPrompt=selected==='My Own Prompt'?custom:(prompts[promptIdx]||'')
  const canStart=selected&&(selected!=='My Own Prompt'||custom.trim())

  const handleStart=()=>{
    if(!canStart)return
    setPendingSession({category:selected!,prompt:currentPrompt})
    router.push('/record/session')
  }

  return(<>
    <Nav showApp/>
    <div className="container">
      <p className="eyebrow anim-slide-up anim-d1">STEP 1 OF 5 — VOICE</p>
      <h1 className="font-display anim-slide-up anim-d2" style={{fontSize:'clamp(38px,5vw,52px)',fontWeight:900,letterSpacing:'-.04em',marginBottom:'8px'}}>Pick a category.</h1>
      <p className="text-muted anim-slide-up anim-d2" style={{fontSize:'16px',marginBottom:'32px'}}>What are you practicing for today?</p>
      <div className="anim-slide-up anim-d3" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px',marginBottom:'28px'}}>
        {CATS.map(cat=>(
          <button key={cat.key} className={`cat-card ${selected===cat.key?'selected':''}`} onClick={()=>{setSelected(cat.key);setPromptIdx(0)}}>
            <span style={{fontSize:'28px'}}>{cat.icon}</span>
            <span style={{fontWeight:600,fontSize:'16px'}}>{cat.key}</span>
            <span style={{fontSize:'13px',color:'var(--text-muted)'}}>{cat.desc}</span>
          </button>
        ))}
      </div>
      {selected&&selected!=='My Own Prompt'&&(
        <div className="anim-slide-up anim-d1" style={{marginBottom:'28px'}}>
          <p style={{fontSize:'11px',fontWeight:700,letterSpacing:'.1em',color:'var(--text-muted)',marginBottom:'12px'}}>YOUR PROMPT</p>
          <div style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:'16px',padding:'24px',marginBottom:'12px'}}>
            <p style={{fontSize:'18px',fontWeight:600,letterSpacing:'-.02em',lineHeight:1.4}}>&ldquo;{currentPrompt}&rdquo;</p>
          </div>
          <div style={{display:'flex',gap:'8px',flexWrap:'wrap'}}>
            {prompts.map((p,i)=>(
              <button key={i} onClick={()=>setPromptIdx(i)} style={{padding:'6px 14px',borderRadius:'100px',border:'1px solid',fontSize:'12px',cursor:'pointer',fontFamily:'var(--font-body)',fontWeight:600,
                borderColor:i===promptIdx?'var(--accent)':'var(--border-light)',
                background:i===promptIdx?'rgba(170,255,0,.08)':'transparent',
                color:i===promptIdx?'var(--accent)':'var(--text-muted)'}}>
                Prompt {i+1}
              </button>
            ))}
          </div>
        </div>
      )}
      {selected==='My Own Prompt'&&(
        <div className="anim-slide-up anim-d1" style={{marginBottom:'28px'}}>
          <label className="input-label">Your prompt</label>
          <input className="input" type="text" placeholder="e.g. Tell me about a challenge you overcame..." value={custom} onChange={e=>setCustom(e.target.value)}/>
        </div>
      )}
      <button className="btn btn-primary btn-full btn-lg anim-slide-up anim-d4" onClick={handleStart}
        disabled={!canStart} style={{opacity:canStart?1:0.4}}>
        Start Recording →
      </button>
    </div>
  </>)
}

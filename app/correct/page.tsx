'use client'
import {useRouter} from 'next/navigation'
import Nav from '@/components/Nav'
import {getPendingSession} from '@/lib/store'
import Link from 'next/link'

export default function CorrectPage(){
  const router=useRouter()
  const pending=getPendingSession()
  const feedback=(pending as any)?.feedback||[]
  return(<>
    <Nav backHref="/observe"/>
    <div className="container">
      <p className="eyebrow anim-slide-up anim-d1">STEPS 3–4 — CORRECT &amp; APPLY</p>
      <h1 className="font-display anim-slide-up anim-d2" style={{fontSize:'clamp(36px,5vw,52px)',fontWeight:900,letterSpacing:'-.04em',marginBottom:'8px'}}>{feedback.length} things to fix.</h1>
      <p className="text-muted anim-slide-up anim-d2" style={{fontSize:'16px',marginBottom:'40px'}}>Apply one change at a time. Re-record the moment you finish reading.</p>
      <div style={{display:'flex',flexDirection:'column',gap:'14px',marginBottom:'32px'}}>
        {feedback.length>0?feedback.map((f:any,i:number)=>(
          <div key={i} className="feedback-card" style={{animationDelay:`${.15+i*.12}s`}}>
            <div className="feedback-icon">{f.icon}</div>
            <div style={{flex:1}}>
              <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'8px',flexWrap:'wrap'}}>
                <h3 style={{fontWeight:700,fontSize:'16px'}}>{f.title}</h3>
                <span style={{fontSize:'10px',fontWeight:700,letterSpacing:'.08em',padding:'3px 8px',borderRadius:'100px',color:f.tagColor,background:f.tagBg}}>{f.tag}</span>
              </div>
              <p style={{fontSize:'14px',color:'var(--text-muted)',lineHeight:1.65}}>{f.detail}</p>
            </div>
          </div>
        )):(
          <div style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:'20px',padding:'32px',textAlign:'center'}}>
            <p style={{marginBottom:'12px'}}>No feedback found — go back and record first.</p>
            <Link href="/record" className="btn btn-outline btn-sm" style={{display:'inline-flex'}}>Start a Recording</Link>
          </div>
        )}
      </div>
      {feedback.length>0&&(
        <div className="anim-slide-up anim-d4" style={{display:'grid',gridTemplateColumns:'1fr auto',gap:'12px'}}>
          <button className="btn btn-primary btn-lg btn-full" onClick={()=>router.push('/record/session')}>🎤 Apply &amp; Re-Record</button>
          <button className="btn btn-outline btn-lg" onClick={()=>router.push('/levelup')} style={{padding:'18px 24px'}}>Done →</button>
        </div>
      )}
    </div>
  </>)
}

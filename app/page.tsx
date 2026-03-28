'use client'
import Link from 'next/link'
import Nav from '@/components/Nav'
import WaveBars from '@/components/WaveBars'
import HowItWorksSection from '@/components/HowItWorksSection'

const MARQUEE=['VOICE','OBSERVE','CORRECT','APPLY','LEVEL UP','VOCAL METHOD™','AI FEEDBACK','BUILD CONFIDENCE','OWN THE ROOM','TRAIN YOUR VOICE']

export default function LandingPage(){
  return(<>
    <Nav showAuth/>
    <div className="container-lg" style={{paddingTop:'88px',paddingBottom:'40px'}}>
      <div className="badge anim-slide-up anim-d1"><div className="badge-dot"/>AI-Powered Communication Coaching for Teens</div>
      <h1 className="font-display anim-slide-up anim-d2" style={{fontSize:'clamp(68px,10.5vw,134px)',fontWeight:900,letterSpacing:'-.045em',lineHeight:.92}}>TRAIN YOUR</h1>
      <h1 className="font-display anim-slide-up anim-d2" style={{fontSize:'clamp(68px,10.5vw,134px)',fontWeight:900,letterSpacing:'-.045em',lineHeight:.92,color:'var(--accent)',marginBottom:'16px'}}>VOICE.</h1>
      <h1 className="font-display anim-slide-up anim-d3" style={{fontSize:'clamp(68px,10.5vw,134px)',fontWeight:900,letterSpacing:'-.045em',lineHeight:.92,color:'transparent',WebkitTextStroke:'1.5px #2A2A2A',marginBottom:'38px'}}>OWN THE ROOM.</h1>
      <p className="anim-slide-up anim-d4" style={{fontSize:'18px',color:'var(--text-muted)',maxWidth:'480px',lineHeight:1.65,fontWeight:300,marginBottom:'42px'}}>Practice speaking. Get instant AI feedback. Build the confidence that shows in interviews, presentations, and every room you walk into.</p>
      <div className="anim-slide-up anim-d5" style={{display:'flex',gap:'12px',flexWrap:'wrap',marginBottom:'64px'}}>
        <Link href="/auth" className="btn btn-primary btn-lg">Start Training — It&apos;s Free</Link>
        {/* ↓ Changed from Link to anchor so it scrolls to the video section below */}
        <a href="#how-it-works" className="btn btn-outline btn-lg">See How It Works</a>
      </div>
      <div className="anim-slide-up anim-d5"><WaveBars count={52} active height={48}/></div>
    </div>

    <div className="marquee-wrap">
      <div className="marquee-inner">
        {[...MARQUEE,...MARQUEE].map((w,i)=>(
          <span key={i} style={{padding:'0 22px',fontSize:'12px',fontWeight:700,letterSpacing:'.1em',color:i%3===0?'var(--accent)':'var(--border-light)',display:'inline-flex',alignItems:'center',gap:'18px'}}>
            {w}<span style={{fontSize:'8px'}}>◆</span>
          </span>
        ))}
      </div>
    </div>

    {/* ↓ Video demo section — anchored to #how-it-works */}
    <HowItWorksSection />

    <div className="container-lg" style={{paddingTop:'80px',paddingBottom:'40px'}}>
      <div style={{textAlign:'center',marginBottom:'60px'}}>
        <p className="eyebrow">THE FRAMEWORK</p>
        <h2 className="font-display" style={{fontSize:'clamp(36px,5vw,64px)',fontWeight:900,letterSpacing:'-.04em'}}>The VOCAL Method™</h2>
      </div>
      <div style={{display:'flex',justifyContent:'center',gap:'clamp(12px,3vw,52px)',marginBottom:'48px'}}>
        {['V','O','C','A','L'].map(l=><span key={l} className="vocal-letter">{l}</span>)}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:'12px'}}>
        {[{l:'V',t:'Voice',d:'Record a spoken response'},{l:'O',t:'Observe',d:'AI analyzes speech instantly'},{l:'C',t:'Correct',d:'Get 3 coaching points'},{l:'A',t:'Apply',d:'Record again with feedback'},{l:'L',t:'Level Up',d:'Track improvement over time'}].map(i=>(
          <div key={i.l} className="card" style={{padding:'22px'}}><div className="font-display" style={{fontSize:'30px',fontWeight:900,color:'var(--accent)',marginBottom:'12px'}}>{i.l}</div><div style={{fontWeight:600,fontSize:'14px',marginBottom:'6px'}}>{i.t}</div><div style={{fontSize:'12px',color:'var(--text-muted)',lineHeight:1.55}}>{i.d}</div></div>
        ))}
      </div>
    </div>

    <div style={{padding:'0 40px 80px',maxWidth:'1100px',margin:'0 auto'}}>
      <div style={{background:'rgba(170,255,0,.04)',border:'1px solid rgba(170,255,0,.15)',borderRadius:'24px',padding:'48px',display:'flex',alignItems:'center',justifyContent:'space-between',gap:'32px',flexWrap:'wrap'}}>
        <div><p className="eyebrow" style={{marginBottom:'10px'}}>PRACTICE + GAMES</p>
          <h3 className="font-display" style={{fontSize:'clamp(28px,3.5vw,44px)',fontWeight:900,letterSpacing:'-.04em',marginBottom:'12px'}}>Earn tokens.<br/><span style={{color:'var(--accent)'}}>Build your avatar.</span></h3>
          <p style={{color:'var(--text-muted)',fontSize:'15px',maxWidth:'380px',lineHeight:1.6}}>Like Duolingo — but for your voice. Earn 🪙 tokens by practicing, then spend them in the avatar shop or play token-gated arcade games.</p>
        </div>
        <Link href="/auth" className="btn btn-primary btn-lg">Start Earning Tokens →</Link>
      </div>
    </div>

    <div style={{textAlign:'center',padding:'80px 40px',borderTop:'1px solid var(--border)'}}>
      <h2 className="font-display" style={{fontSize:'clamp(40px,5.5vw,72px)',fontWeight:900,letterSpacing:'-.04em',marginBottom:'16px'}}>Your voice is already<br/><span style={{color:'var(--accent)'}}>powerful.</span></h2>
      <p className="text-muted" style={{fontSize:'18px',marginBottom:'36px'}}>Let&apos;s prove it.</p>
      <Link href="/auth" className="btn btn-primary btn-lg">Start Training — It&apos;s Free</Link>
    </div>
  </>)
}

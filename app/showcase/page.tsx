'use client'
import Link from 'next/link'
import Nav from '@/components/Nav'
import WaveBars from '@/components/WaveBars'

const VOCAL_STEPS = [
  { l:'V', t:'Voice',   d:'Record a real spoken response — interviews, speeches, or presentations.',         icon:'🎤' },
  { l:'O', t:'Observe', d:'AI instantly transcribes and analyzes every word, pause, and filler.',            icon:'🔍' },
  { l:'C', t:'Correct', d:'Get 3 specific coaching points with actionable drills — not generic tips.',       icon:'🎯' },
  { l:'A', t:'Apply',   d:'Re-record immediately applying the feedback. Build the habit in real time.',      icon:'⚡' },
  { l:'L', t:'Level Up',d:'Track your progress rep by rep. Earn tokens, build streaks, climb the ranks.',   icon:'📈' },
]

const STATS = [
  { n:'13',    l:'Arcade games',           sub:'targeting specific weaknesses' },
  { n:'5',     l:'Practice categories',    sub:'from interviews to speeches' },
  { n:'Real',  l:'AI coaching',            sub:'powered by Claude + Gemini' },
  { n:'Free',  l:'For every student',      sub:'no credit card needed' },
]

const FEATURES = [
  { icon:'🎤', t:'Voice Recording',        d:'Record any spoken response directly in the browser. Works on Chrome, Safari, and mobile.' },
  { icon:'🤖', t:'AI Feedback',            d:'Claude analyzes every session — filler words, pace, clarity, structure — with specific written coaching.' },
  { icon:'📊', t:'Progress Tracking',      d:'Every rep is saved. Charts show improvement over time. Personal bests are celebrated.' },
  { icon:'🏆', t:'Leaderboard',            d:'Compete with other students on clarity scores, session counts, and daily streaks.' },
  { icon:'🎮', t:'Training Arcade',        d:'13 games that build communication instincts — from Filler Blitz to Q&A Rapid Fire.' },
  { icon:'🪙', t:'Token System',           d:'Earn tokens by practicing. Spend them in the avatar shop or unlock premium games.' },
  { icon:'👤', t:'Avatar Shop',            d:'Customize your avatar with 60+ items across 5 categories and 4 rarity tiers.' },
  { icon:'📱', t:'Mobile Friendly',        d:'Full responsive design — practice during lunch, on the bus, or anywhere.' },
]

const PROBLEM_STATS = [
  { n:'68%', d:'of teens say they struggle to speak confidently in front of others' },
  { n:'93%', d:'of communication is judged within the first 7 seconds of speaking' },
  { n:'#1',  d:'communication is the most requested skill by employers — yet no app trains it for teens' },
]

export default function ShowcasePage() {
  return (
    <>
      <Nav showAuth />

      {/* Hero */}
      <div className="container-lg" style={{ paddingTop:'80px',paddingBottom:'40px' }}>
        <div style={{ display:'inline-flex',alignItems:'center',gap:'8px',background:'rgba(170,255,0,.08)',border:'1px solid rgba(170,255,0,.2)',borderRadius:'100px',padding:'6px 16px',marginBottom:'28px',fontSize:'12px',fontWeight:700,letterSpacing:'.08em',color:'var(--accent)' }}>
          <span>🏛</span> 2025 Congressional App Challenge Submission
        </div>
        <h1 className="font-display anim-slide-up" style={{ fontSize:'clamp(52px,9vw,110px)',fontWeight:900,letterSpacing:'-.045em',lineHeight:.92,marginBottom:'24px' }}>
          TRAIN YOUR<br/>
          <span style={{ color:'var(--accent)' }}>VOICE.</span><br/>
          <span style={{ color:'transparent',WebkitTextStroke:'1.5px #2A2A2A' }}>OWN THE ROOM.</span>
        </h1>
        <p style={{ fontSize:'clamp(16px,2vw,22px)',color:'var(--text-muted)',maxWidth:'580px',lineHeight:1.65,fontWeight:300,marginBottom:'16px' }}>
          Vocalis is an AI-powered communication coaching platform for teenagers — built by a teen, for teens.
        </p>
        <p style={{ fontSize:'clamp(14px,1.6vw,16px)',color:'var(--text-muted)',maxWidth:'520px',lineHeight:1.65,fontWeight:300,marginBottom:'40px' }}>
          Record your voice. Get instant AI feedback. Build the confidence that shows in interviews, presentations, and every room you walk into.
        </p>
        <div style={{ display:'flex',gap:'12px',flexWrap:'wrap',marginBottom:'48px' }}>
          <Link href="/auth" className="btn btn-primary btn-lg">Try Vocalis Free →</Link>
          <Link href="/#how-it-works" className="btn btn-outline btn-lg">See How It Works</Link>
        </div>
        <WaveBars count={48} active height={44} />
      </div>

      {/* Problem */}
      <div style={{ borderTop:'1px solid var(--border)',borderBottom:'1px solid var(--border)',background:'var(--surface)',padding:'64px 40px' }}>
        <div style={{ maxWidth:'1100px',margin:'0 auto' }}>
          <p className="eyebrow" style={{ marginBottom:'16px',textAlign:'center' }}>THE PROBLEM</p>
          <h2 className="font-display" style={{ fontSize:'clamp(28px,4vw,52px)',fontWeight:900,letterSpacing:'-.04em',textAlign:'center',marginBottom:'48px' }}>
            Communication is the most important skill.<br/>
            <span style={{ color:'var(--accent)' }}>Nobody teaches it.</span>
          </h2>
          <div className="stats-box" style={{ marginBottom:0 }}>
            {PROBLEM_STATS.map((s,i)=>(
              <div key={i} style={{ textAlign:'center',padding:'0 20px',borderRight:i<2?'1px solid var(--border)':undefined }}>
                <div className="stat-num">{s.n}</div>
                <div style={{ fontSize:'15px',color:'var(--text-muted)',lineHeight:1.6,marginTop:'12px' }}>{s.d}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* VOCAL Method */}
      <div className="container-lg" style={{ paddingTop:'80px',paddingBottom:'40px' }}>
        <p className="eyebrow" style={{ textAlign:'center',marginBottom:'16px' }}>THE FRAMEWORK</p>
        <h2 className="font-display" style={{ fontSize:'clamp(28px,4vw,52px)',fontWeight:900,letterSpacing:'-.04em',textAlign:'center',marginBottom:'12px' }}>
          The VOCAL Method™
        </h2>
        <p style={{ textAlign:'center',color:'var(--text-muted)',fontSize:'16px',marginBottom:'48px' }}>
          A deliberate 5-step practice loop designed to build communication skills the same way athletes build physical ones.
        </p>
        <div style={{ display:'flex',justifyContent:'center',gap:'clamp(12px,3vw,48px)',marginBottom:'48px' }}>
          {['V','O','C','A','L'].map(l=><span key={l} className="vocal-letter">{l}</span>)}
        </div>
        <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:'14px' }}>
          {VOCAL_STEPS.map(s=>(
            <div key={s.l} className="card" style={{ padding:'24px' }}>
              <div style={{ fontSize:'28px',marginBottom:'12px' }}>{s.icon}</div>
              <div className="font-display" style={{ fontSize:'28px',fontWeight:900,color:'var(--accent)',marginBottom:'8px' }}>{s.l}</div>
              <div style={{ fontWeight:700,fontSize:'15px',marginBottom:'8px' }}>{s.t}</div>
              <div style={{ fontSize:'13px',color:'var(--text-muted)',lineHeight:1.6 }}>{s.d}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Stats strip */}
      <div style={{ background:'var(--surface)',borderTop:'1px solid var(--border)',borderBottom:'1px solid var(--border)',padding:'40px' }}>
        <div style={{ maxWidth:'1100px',margin:'0 auto',display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:'24px' }}>
          {STATS.map(s=>(
            <div key={s.n} style={{ textAlign:'center' }}>
              <div className="font-display" style={{ fontSize:'clamp(36px,5vw,56px)',fontWeight:900,color:'var(--accent)',letterSpacing:'-.04em',lineHeight:1 }}>{s.n}</div>
              <div style={{ fontWeight:700,fontSize:'15px',marginTop:'8px' }}>{s.l}</div>
              <div style={{ fontSize:'13px',color:'var(--text-muted)',marginTop:'4px' }}>{s.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Features */}
      <div className="container-lg" style={{ paddingTop:'80px',paddingBottom:'40px' }}>
        <p className="eyebrow" style={{ textAlign:'center',marginBottom:'16px' }}>WHAT VOCALIS DOES</p>
        <h2 className="font-display" style={{ fontSize:'clamp(28px,4vw,52px)',fontWeight:900,letterSpacing:'-.04em',textAlign:'center',marginBottom:'48px' }}>
          Everything a communication coach does.<br/>
          <span style={{ color:'var(--accent)' }}>Available 24/7 on your phone.</span>
        </h2>
        <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))',gap:'16px' }}>
          {FEATURES.map((f,i)=>(
            <div key={i} className="card" style={{ padding:'28px' }}>
              <div style={{ fontSize:'28px',marginBottom:'14px' }}>{f.icon}</div>
              <div style={{ fontWeight:700,fontSize:'16px',marginBottom:'8px' }}>{f.t}</div>
              <div style={{ fontSize:'14px',color:'var(--text-muted)',lineHeight:1.65 }}>{f.d}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tech stack */}
      <div style={{ background:'var(--surface)',borderTop:'1px solid var(--border)',padding:'64px 40px' }}>
        <div style={{ maxWidth:'800px',margin:'0 auto',textAlign:'center' }}>
          <p className="eyebrow" style={{ marginBottom:'16px' }}>BUILT WITH</p>
          <h2 className="font-display" style={{ fontSize:'clamp(24px,3.5vw,40px)',fontWeight:900,letterSpacing:'-.04em',marginBottom:'32px' }}>
            Modern full-stack tech stack
          </h2>
          <div style={{ display:'flex',flexWrap:'wrap',gap:'12px',justifyContent:'center' }}>
            {[
              { t:'Next.js 14',        c:'#000',    bg:'#fff'   },
              { t:'TypeScript',        c:'#fff',    bg:'#3178c6'},
              { t:'Supabase',          c:'#fff',    bg:'#3ecf8e'},
              { t:'Claude AI',         c:'#000',    bg:'#c8f53a'},
              { t:'OpenAI Whisper',    c:'#fff',    bg:'#412991'},
              { t:'ElevenLabs TTS',    c:'#fff',    bg:'#FF4D00'},
              { t:'Tailwind CSS',      c:'#fff',    bg:'#06b6d4'},
              { t:'Vercel',            c:'#fff',    bg:'#000'   },
            ].map(t=>(
              <div key={t.t} style={{ padding:'8px 18px',borderRadius:'100px',background:t.bg,color:t.c,fontSize:'13px',fontWeight:700 }}>{t.t}</div>
            ))}
          </div>
          <p style={{ marginTop:'28px',color:'var(--text-muted)',fontSize:'15px',lineHeight:1.7 }}>
            Built by Ayden, a 10th grade student, over several months as a solo project.
            Every line of code, every design decision, and every feature was built to solve a real problem for real teens.
          </p>
        </div>
      </div>

      {/* CTA */}
      <div style={{ textAlign:'center',padding:'80px 40px',borderTop:'1px solid var(--border)' }}>
        <h2 className="font-display" style={{ fontSize:'clamp(36px,5vw,68px)',fontWeight:900,letterSpacing:'-.04em',marginBottom:'16px' }}>
          Your voice is already<br/><span style={{ color:'var(--accent)' }}>powerful.</span>
        </h2>
        <p style={{ color:'var(--text-muted)',fontSize:'18px',marginBottom:'36px' }}>Let's prove it.</p>
        <div style={{ display:'flex',gap:'12px',justifyContent:'center',flexWrap:'wrap' }}>
          <Link href="/auth" className="btn btn-primary btn-lg">Start Training — It's Free</Link>
          <Link href="https://github.com/aieditinglab/vocalis" target="_blank" className="btn btn-outline btn-lg">View Source Code →</Link>
        </div>
        <p style={{ marginTop:'20px',fontSize:'13px',color:'var(--text-muted)' }}>
          vocalis-zeta.vercel.app · Made with 🎤 by Ayden
        </p>
      </div>
    </>
  )
}

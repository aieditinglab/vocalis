'use client'
import {useState,useEffect,useRef} from 'react'
import {useRouter} from 'next/navigation'
import Nav from '@/components/Nav'
import {saveGameScore,getBestScore,addTokens,getTokenBalance} from '@/lib/store'

const FILLERS=['um','uh','like','you know','basically','literally','right','so','actually','honestly']
const NORMALS=['therefore','however','because','strong','clear','confident','practice','improve','focus','leader','vision','achieve','present','engage','connect','speak','listen']
const TOPICS=['Your biggest strength','A challenge you overcame','Why you want this job','Your greatest achievement','A time you failed','Your dream career','What makes you unique','A skill you want to learn','Your leadership style','A moment you were proud']
const TWISTERS=[
  {text:'She sells seashells by the seashore.',level:1},
  {text:'Red lorry, yellow lorry, red lorry, yellow lorry.',level:1},
  {text:'How much wood would a woodchuck chuck if a woodchuck could chuck wood?',level:2},
  {text:'Peter Piper picked a peck of pickled peppers.',level:2},
  {text:'The sixth sick sheikh\'s sixth sheep\'s sick.',level:3},
  {text:'Betty Botter bought some butter but the butter Betty bought was bitter.',level:3},
  {text:'Which wristwatches are Swiss wristwatches?',level:3},
  {text:'I scream, you scream, we all scream for ice cream.',level:2},
]

type GameId='none'|'filler-blitz'|'topic-sprint'|'tongue-twister'

export default function PracticePage(){
  const router=useRouter()
  const [active,setActive]=useState<GameId>('none')
  const [tokens,setTokens]=useState(0)
  useEffect(()=>setTokens(getTokenBalance()),[active])

  const b1=getBestScore('filler-blitz'),b2=getBestScore('topic-sprint'),b3=getBestScore('tongue-twister')

  if(active==='filler-blitz')return<FillerBlitz onBack={()=>setActive('none')} onEarn={(t)=>{addTokens(t,'Filler Blitz');setTokens(getTokenBalance())}}/>
  if(active==='topic-sprint')return<TopicSprint onBack={()=>setActive('none')} onEarn={(t)=>{addTokens(t,'Topic Sprint');setTokens(getTokenBalance())}}/>
  if(active==='tongue-twister')return<TongueTwister onBack={()=>setActive('none')} onEarn={(t)=>{addTokens(t,'Tongue Twister');setTokens(getTokenBalance())}}/>

  return(<>
    <Nav showApp/>
    <div className="container">
      <p className="eyebrow anim-slide-up anim-d1">PRACTICE MODE</p>
      <div style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between',flexWrap:'wrap',gap:'12px',marginBottom:'8px'}}>
        <h1 className="font-display anim-slide-up anim-d2" style={{fontSize:'clamp(36px,5vw,52px)',fontWeight:900,letterSpacing:'-.04em'}}>Train between reps.</h1>
        <div style={{background:'rgba(170,255,0,.06)',border:'1px solid rgba(170,255,0,.15)',borderRadius:'100px',padding:'8px 18px',display:'flex',alignItems:'center',gap:'8px'}}>
          <span>🪙</span><span className="font-display" style={{fontSize:'20px',fontWeight:900,color:'var(--accent)'}}>{tokens}</span>
        </div>
      </div>
      <p className="text-muted anim-slide-up anim-d2" style={{fontSize:'16px',marginBottom:'40px'}}>Earn tokens, beat high scores, and sharpen your speaking habits.</p>
      <div style={{display:'flex',flexDirection:'column',gap:'16px'}}>
        {[
          {id:'filler-blitz',icon:'⚡',title:'Filler Blitz',desc:'Words flash one at a time — tap only filler words before they disappear. Trains real-time awareness.',reward:'+15 🪙',best:b1,color:'var(--hot)'},
          {id:'topic-sprint',icon:'🎤',title:'Topic Sprint',desc:'A random topic appears. Speak for 60 seconds, then honestly rate yourself on 3 criteria.',reward:'+20 🪙',best:b2,color:'var(--accent)'},
          {id:'tongue-twister',icon:'🌀',title:'Tongue Twister',desc:'8 progressive twisters. Rate your own clarity. Trains articulation and builds speaking confidence.',reward:'+12 🪙',best:b3,color:'var(--blue)'},
        ].map((g,i)=>(
          <div key={g.id} className="game-card anim-slide-up" style={{animationDelay:`${.1+i*.1}s`}} onClick={()=>setActive(g.id as GameId)}>
            <div style={{display:'flex',alignItems:'flex-start',gap:'20px'}}>
              <div style={{fontSize:'42px',flexShrink:0}}>{g.icon}</div>
              <div style={{flex:1}}>
                <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'8px',flexWrap:'wrap'}}>
                  <h2 style={{fontSize:'20px',fontWeight:700,letterSpacing:'-.02em'}}>{g.title}</h2>
                  <span style={{fontSize:'11px',fontWeight:700,padding:'3px 10px',borderRadius:'100px',color:g.color,background:`rgba(${g.color==='var(--hot)'?'255,48,84':g.color==='var(--accent)'?'170,255,0':'0,174,255'},.1)`,border:`1px solid rgba(${g.color==='var(--hot)'?'255,48,84':g.color==='var(--accent)'?'170,255,0':'0,174,255'},.2)`}}>{g.reward}</span>
                </div>
                <p style={{fontSize:'14px',color:'var(--text-muted)',lineHeight:1.65,marginBottom:'14px'}}>{g.desc}</p>
                <div style={{display:'flex',gap:'16px',alignItems:'center'}}>
                  <span style={{fontSize:'13px',color:g.color,fontWeight:600}}>Best: {g.best>0?g.best:'—'}</span>
                  <span className="btn btn-outline btn-sm" style={{pointerEvents:'none'}}>Play →</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </>)
}

// ── FILLER BLITZ ─────────────────────────────────────────────────────────
function FillerBlitz({onBack,onEarn}:{onBack:()=>void;onEarn:(t:number)=>void}){
  const [phase,setPhase]=useState<'intro'|'playing'|'done'>('intro')
  const [score,setScore]=useState(0),[streak,setStreak]=useState(0),[best,setBest]=useState(0),[wrong,setWrong]=useState(0),[time,setTime]=useState(30),[word,setWord]=useState(''),[isFiller,setIsFiller]=useState(false),[fb,setFb]=useState<'correct'|'wrong'|null>(null)
  const timerRef=useRef<any>(null),wordRef=useRef<any>(null)
  const all=[...FILLERS,...NORMALS]
  const nextWord=()=>{
    clearTimeout(wordRef.current)
    const w=all[Math.floor(Math.random()*all.length)]
    setWord(w);setIsFiller(FILLERS.includes(w));setFb(null)
    wordRef.current=setTimeout(nextWord,1500)
  }
  const start=()=>{
    setPhase('playing');setScore(0);setWrong(0);setStreak(0);setTime(30)
    timerRef.current=setInterval(()=>setTime(t=>{if(t<=1){clearInterval(timerRef.current);clearTimeout(wordRef.current);setPhase('done');return 0}return t-1}),1000)
    nextWord()
  }
  const tap=()=>{
    clearTimeout(wordRef.current)
    if(isFiller){setFb('correct');setScore(s=>s+10);setStreak(s=>{const n=s+1;setBest(b=>Math.max(b,n));return n})}
    else{setFb('wrong');setWrong(w=>w+1);setStreak(0)}
    setTimeout(nextWord,300)
  }
  useEffect(()=>{
    if(phase==='done'){const final=Math.max(0,score-wrong*5);saveGameScore({gameId:'filler-blitz',score:final,date:new Date().toISOString(),level:1,tokensEarned:15});onEarn(15)}
  },[phase])
  useEffect(()=>()=>{clearInterval(timerRef.current);clearTimeout(wordRef.current)},[])
  return(<><Nav rightContent={<button onClick={onBack} className="btn btn-outline btn-sm">← Games</button>}/>
    <div className="container" style={{textAlign:'center'}}>
      <p className="eyebrow">FILLER BLITZ</p>
      {phase==='intro'&&(<>
        <h2 className="font-display anim-slide-up" style={{fontSize:'clamp(28px,4vw,42px)',fontWeight:900,letterSpacing:'-.04em',marginBottom:'16px'}}>Spot the fillers.</h2>
        <p className="text-muted anim-slide-up" style={{marginBottom:'8px',fontSize:'16px'}}>Words flash one at a time.</p>
        <p className="text-muted anim-slide-up" style={{marginBottom:'28px',fontSize:'16px'}}><span style={{color:'var(--hot)',fontWeight:600}}>Tap filler words.</span> Ignore normal words.</p>
        <div className="card" style={{padding:'24px',marginBottom:'28px',textAlign:'left'}}>
          <p style={{fontSize:'13px',fontWeight:700,color:'var(--text-muted)',marginBottom:'12px'}}>FILLER WORDS TO CATCH</p>
          <div style={{display:'flex',flexWrap:'wrap',gap:'8px'}}>{FILLERS.map(w=><span key={w} style={{padding:'6px 14px',borderRadius:'100px',background:'rgba(255,48,84,.1)',border:'1px solid rgba(255,48,84,.2)',fontSize:'13px',color:'var(--hot)',fontWeight:600}}>{w}</span>)}</div>
        </div>
        <button className="btn btn-primary btn-lg btn-full" onClick={start}>Start Game →</button>
      </>)}
      {phase==='playing'&&(<>
        <div style={{display:'flex',justifyContent:'space-between',marginBottom:'40px'}}>
          {[{v:score,l:'SCORE',c:'var(--accent)'},{v:time,l:'SECS',c:time<=10?'var(--hot)':'var(--text-primary)'},{v:streak,l:'STREAK',c:'var(--amber)'}].map(s=>(
            <div key={s.l}><div className="font-display" style={{fontSize:'36px',fontWeight:900,color:s.c}}>{s.v}</div><div className="text-muted" style={{fontSize:'12px'}}>{s.l}</div></div>
          ))}
        </div>
        <div style={{minHeight:'120px',display:'flex',alignItems:'center',justifyContent:'center',marginBottom:'40px'}}>
          <button className={`game-word-btn ${fb||''}`} onClick={tap} style={{fontSize:'clamp(20px,4vw,32px)'}}>{word}</button>
        </div>
        <p className="text-muted" style={{fontSize:'14px'}}>Tap if it&apos;s a filler word</p>
      </>)}
      {phase==='done'&&(<>
        <h2 className="font-display anim-slide-up" style={{fontSize:'clamp(28px,4vw,42px)',fontWeight:900,letterSpacing:'-.04em',marginBottom:'8px'}}>Game Over!</h2>
        <div style={{background:'rgba(170,255,0,.06)',border:'1px solid rgba(170,255,0,.2)',borderRadius:'16px',padding:'14px 24px',display:'inline-flex',alignItems:'center',gap:'8px',marginBottom:'24px'}}>
          <span>+15 tokens earned</span><span style={{color:'var(--accent)',fontWeight:700}}>🪙</span>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'12px',marginBottom:'28px'}}>
          {[{l:'Final Score',v:Math.max(0,score-wrong*5),c:'var(--accent)'},{l:'Best Streak',v:best,c:'var(--amber)'},{l:'Mistakes',v:wrong,c:'var(--hot)'}].map(s=>(
            <div key={s.l} className="dash-card" style={{textAlign:'center'}}><div className="font-display" style={{fontSize:'48px',fontWeight:900,color:s.c}}>{s.v}</div><div className="text-muted" style={{fontSize:'12px',marginTop:'6px'}}>{s.l}</div></div>
          ))}
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px'}}>
          <button className="btn btn-primary btn-lg" onClick={start}>Play Again</button>
          <button className="btn btn-outline btn-lg" onClick={onBack}>Back to Games</button>
        </div>
      </>)}
    </div>
  </>)
}

// ── TOPIC SPRINT ─────────────────────────────────────────────────────────
function TopicSprint({onBack,onEarn}:{onBack:()=>void;onEarn:(t:number)=>void}){
  const [phase,setPhase]=useState<'intro'|'prep'|'speaking'|'rate'|'done'>('intro')
  const [topic,setTopic]=useState(''),[prep,setPrep]=useState(5),[speak,setSpeak]=useState(60),[score,setScore]=useState(0)
  const [ratings,setRatings]=useState({paused:3,fillers:3,clarity:3})
  const timerRef=useRef<any>(null)
  const start=()=>{
    setTopic(TOPICS[Math.floor(Math.random()*TOPICS.length)]);setPhase('prep');setPrep(5)
    timerRef.current=setInterval(()=>setPrep(t=>{if(t<=1){clearInterval(timerRef.current);startSpeak();return 0}return t-1}),1000)
  }
  const startSpeak=()=>{
    setPhase('speaking');setSpeak(60)
    timerRef.current=setInterval(()=>setSpeak(t=>{if(t<=1){clearInterval(timerRef.current);setPhase('rate');return 0}return t-1}),1000)
  }
  const submit=()=>{
    const s=Math.round(((ratings.paused+ratings.fillers+ratings.clarity)/15)*100)
    setScore(s);saveGameScore({gameId:'topic-sprint',score:s,date:new Date().toISOString(),level:1,tokensEarned:20});onEarn(20);setPhase('done')
  }
  useEffect(()=>()=>clearInterval(timerRef.current),[])
  const RatingRow=({label,k,emoji}:{label:string;k:keyof typeof ratings;emoji:string})=>(
    <div style={{marginBottom:'20px'}}>
      <div style={{display:'flex',justifyContent:'space-between',marginBottom:'10px'}}><span style={{fontSize:'15px',fontWeight:600}}>{emoji} {label}</span><span style={{color:'var(--accent)',fontWeight:700}}>{ratings[k]} / 5</span></div>
      <div style={{display:'flex',gap:'8px'}}>{[1,2,3,4,5].map(n=>(
        <button key={n} onClick={()=>setRatings(r=>({...r,[k]:n}))} style={{flex:1,padding:'10px',borderRadius:'10px',border:`1px solid ${n<=ratings[k]?'var(--accent)':'var(--border-light)'}`,background:n<=ratings[k]?'rgba(170,255,0,.1)':'transparent',cursor:'pointer',fontFamily:'var(--font-body)',fontWeight:700,color:n<=ratings[k]?'var(--accent)':'var(--text-muted)',fontSize:'16px'}}>{n}</button>
      ))}</div>
    </div>
  )
  return(<><Nav rightContent={<button onClick={onBack} className="btn btn-outline btn-sm">← Games</button>}/>
    <div className="container" style={{textAlign:'center'}}>
      <p className="eyebrow">TOPIC SPRINT</p>
      {phase==='intro'&&(<><h2 className="font-display anim-slide-up" style={{fontSize:'clamp(28px,4vw,42px)',fontWeight:900,letterSpacing:'-.04em',marginBottom:'16px'}}>Speak for 60 seconds.</h2><p className="text-muted" style={{fontSize:'16px',marginBottom:'28px'}}>A topic appears. Think for 5 seconds. Then speak. Rate yourself honestly after.</p><button className="btn btn-primary btn-lg btn-full" onClick={start}>Get a Topic →</button></>)}
      {phase==='prep'&&(<><div style={{fontSize:'72px',marginBottom:'24px'}}>💭</div><p className="text-muted" style={{marginBottom:'12px',fontSize:'14px',fontWeight:700,letterSpacing:'.08em'}}>YOUR TOPIC</p><h2 className="font-display anim-count-in" style={{fontSize:'clamp(24px,4vw,38px)',fontWeight:900,letterSpacing:'-.03em',marginBottom:'32px',color:'var(--accent)'}}>{topic}</h2><div className="font-display" style={{fontSize:'80px',fontWeight:900,color:'var(--amber)'}}>{prep}</div><p className="text-muted">Get ready...</p></>)}
      {phase==='speaking'&&(<><p className="text-muted" style={{marginBottom:'12px',fontWeight:700,letterSpacing:'.08em'}}>SPEAKING ABOUT</p><h2 style={{fontSize:'clamp(20px,3vw,30px)',fontWeight:700,color:'var(--accent)',marginBottom:'32px'}}>{topic}</h2><div className="font-display" style={{fontSize:'80px',fontWeight:900,color:speak<=10?'var(--hot)':'var(--text-primary)',marginBottom:'12px'}}>{speak}</div><div style={{maxWidth:'400px',margin:'0 auto 28px'}}><div className="prog-track"><div className="prog-fill" style={{background:speak<=10?'var(--hot)':'var(--accent)',width:`${(speak/60)*100}%`,transition:'width 1s linear'}}/></div></div><button className="btn btn-outline btn-md" onClick={()=>{clearInterval(timerRef.current);setPhase('rate')}}>Done Speaking →</button></>)}
      {phase==='rate'&&(<div style={{textAlign:'left'}}><h2 className="font-display" style={{fontSize:'clamp(24px,3.5vw,36px)',fontWeight:900,letterSpacing:'-.04em',marginBottom:'8px',textAlign:'center'}}>Rate yourself honestly.</h2><p className="text-muted" style={{marginBottom:'28px',textAlign:'center'}}>1 = struggled · 5 = nailed it</p><div className="card" style={{padding:'28px',marginBottom:'20px'}}><RatingRow label="Spoke without long pauses" k="paused" emoji="⏸"/><RatingRow label="Avoided filler words" k="fillers" emoji="🗣"/><RatingRow label="Made clear, logical sense" k="clarity" emoji="💡"/></div><button className="btn btn-primary btn-lg btn-full" onClick={submit}>See My Score →</button></div>)}
      {phase==='done'&&(<><div style={{background:'rgba(170,255,0,.05)',border:'1px solid rgba(170,255,0,.2)',borderRadius:'24px',padding:'48px',marginBottom:'20px'}}><div className="clarity-num">{score}</div><p className="text-muted" style={{marginTop:'8px'}}>out of 100</p></div><div style={{background:'rgba(170,255,0,.06)',border:'1px solid rgba(170,255,0,.2)',borderRadius:'16px',padding:'12px 20px',display:'inline-flex',gap:'8px',marginBottom:'20px'}}>+20 tokens earned <span style={{color:'var(--accent)'}}>🪙</span></div><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px'}}><button className="btn btn-primary btn-lg" onClick={()=>{setPhase('intro');setRatings({paused:3,fillers:3,clarity:3})}}>Play Again</button><button className="btn btn-outline btn-lg" onClick={onBack}>Back</button></div></>)}
    </div>
  </>)
}

// ── TONGUE TWISTER ────────────────────────────────────────────────────────
function TongueTwister({onBack,onEarn}:{onBack:()=>void;onEarn:(t:number)=>void}){
  const [idx,setIdx]=useState(0),[phase,setPhase]=useState<'intro'|'playing'|'done'>('intro'),[total,setTotal]=useState(0),[attempt,setAttempt]=useState(0)
  const cur=TWISTERS[idx]||TWISTERS[0]
  const rate=(stars:number)=>{
    const pts=stars*cur.level*10
    const nt=total+pts;setTotal(nt)
    if(idx+1>=TWISTERS.length){saveGameScore({gameId:'tongue-twister',score:Math.round(nt/TWISTERS.length),date:new Date().toISOString(),level:3,tokensEarned:12});onEarn(12);setPhase('done')}
    else{setIdx(i=>i+1);setAttempt(0)}
  }
  return(<><Nav rightContent={<button onClick={onBack} className="btn btn-outline btn-sm">← Games</button>}/>
    <div className="container" style={{textAlign:'center'}}>
      <p className="eyebrow">TONGUE TWISTER CHALLENGE</p>
      {phase==='intro'&&(<><h2 className="font-display anim-slide-up" style={{fontSize:'clamp(28px,4vw,42px)',fontWeight:900,letterSpacing:'-.04em',marginBottom:'16px'}}>Twist your tongue.</h2><p className="text-muted" style={{fontSize:'16px',marginBottom:'28px'}}>{TWISTERS.length} twisters. Rate how clearly you said each one.</p><button className="btn btn-primary btn-lg btn-full" onClick={()=>setPhase('playing')}>Start →</button></>)}
      {phase==='playing'&&(<>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'32px'}}>
          <span className="text-muted" style={{fontSize:'13px'}}>{idx+1} / {TWISTERS.length}</span>
          <div style={{display:'flex',gap:'4px'}}>{TWISTERS.map((_,i)=><div key={i} style={{width:'20px',height:'4px',borderRadius:'2px',background:i<idx?'var(--accent)':i===idx?'var(--amber)':'var(--border-light)'}}/>)}</div>
          <span style={{fontSize:'13px',padding:'4px 10px',borderRadius:'100px',background:'rgba(170,255,0,.1)',color:'var(--accent)',fontWeight:700}}>{'★'.repeat(cur.level)}{'☆'.repeat(3-cur.level)}</span>
        </div>
        <div style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:'24px',padding:'48px 32px',marginBottom:'32px'}}>
          <p style={{fontSize:'clamp(18px,3vw,26px)',fontWeight:600,lineHeight:1.5}}>{cur.text}</p>
        </div>
        {attempt===0
          ?<><p className="text-muted" style={{marginBottom:'16px'}}>Say it clearly, then rate yourself</p><button className="btn btn-outline btn-lg btn-full" onClick={()=>setAttempt(1)}>I read it — rate me</button></>
          :<><p style={{fontWeight:600,marginBottom:'16px'}}>How clearly did you say it?</p>
            <div style={{display:'flex',gap:'10px',justifyContent:'center'}}>
              {[{s:1,l:'Stumbled',e:'😬'},{s:3,l:'Decent',e:'😊'},{s:5,l:'Perfect',e:'🔥'}].map(r=>(
                <button key={r.s} onClick={()=>rate(r.s)} style={{flex:1,padding:'16px 10px',borderRadius:'14px',border:'1px solid var(--border-light)',background:'var(--card)',cursor:'pointer',fontFamily:'var(--font-body)',transition:'all .2s'}}
                  onMouseEnter={e=>(e.currentTarget.style.borderColor='var(--accent)')} onMouseLeave={e=>(e.currentTarget.style.borderColor='var(--border-light)')}>
                  <div style={{fontSize:'28px',marginBottom:'6px'}}>{r.e}</div><div style={{fontWeight:700,fontSize:'13px'}}>{r.l}</div>
                </button>
              ))}
            </div>
          </>
        }
      </>)}
      {phase==='done'&&(<><div style={{fontSize:'64px',marginBottom:'16px'}}>🎉</div><h2 className="font-display" style={{fontSize:'clamp(28px,4vw,42px)',fontWeight:900,letterSpacing:'-.04em',marginBottom:'24px'}}>All done!</h2><div className="card" style={{padding:'32px',marginBottom:'20px'}}><div className="font-display" style={{fontSize:'64px',fontWeight:900,color:'var(--accent)'}}>{Math.round(total/TWISTERS.length)}</div><div className="text-muted" style={{marginTop:'8px'}}>avg score per twister</div></div><div style={{background:'rgba(170,255,0,.06)',border:'1px solid rgba(170,255,0,.2)',borderRadius:'16px',padding:'12px 20px',display:'inline-flex',gap:'8px',marginBottom:'20px'}}>+12 tokens earned <span style={{color:'var(--accent)'}}>🪙</span></div><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px'}}><button className="btn btn-primary btn-lg" onClick={()=>{setPhase('playing');setIdx(0);setTotal(0);setAttempt(0)}}>Play Again</button><button className="btn btn-outline btn-lg" onClick={onBack}>Back</button></div></>)}
    </div>
  </>)
}

'use client'
import {useState,useEffect,useRef} from 'react'
import {useRouter} from 'next/navigation'
import Nav from '@/components/Nav'
import {getTokenBalance,spendTokens,saveGameScore,getBestScore,getLeaderboard,addTokens} from '@/lib/store'

type GameId='none'|'memory-chain'|'speed-describe'|'word-association'

export default function GamesPage(){
  const router=useRouter()
  const [tokens,setTokens]=useState(0)
  const [active,setActive]=useState<GameId>('none')
  const [shareMsg,setShareMsg]=useState('')
  useEffect(()=>setTokens(getTokenBalance()),[active])

  const play=(id:GameId,cost:number)=>{
    if(tokens<cost){alert(`You need ${cost} tokens to play this game. Earn more by recording sessions!`);return}
    setActive(id)
  }

  const handleShare=(gameId:string,score:number)=>{
    const text=`I just scored ${score} on ${GAME_INFO[gameId]?.title||gameId} in Vocalis! 🎤 Training my voice one rep at a time. #Vocalis #PublicSpeaking`
    if(navigator.share){navigator.share({title:'Vocalis Score',text,url:window.location.origin}).catch(()=>{})}
    else{navigator.clipboard.writeText(text).then(()=>setShareMsg('Score copied to clipboard!')).catch(()=>{})}
  }

  const GAME_INFO:Record<string,{title:string;desc:string;cost:number;reward:number;icon:string;color:string}> = {
    'memory-chain':    {title:'Memory Chain',    desc:'A chain of words appears one at a time. Remember them all in order. Tests working memory — key for speaking without losing your place.',             cost:10,reward:25,icon:'🧠',color:'var(--accent)'},
    'speed-describe':  {title:'Speed Describe',  desc:'An image concept flashes on screen. Describe it in exactly 5 words. Fast thinking, clear language, no fillers — scored instantly.',             cost:15,reward:30,icon:'💬',color:'var(--hot)'},
    'word-association':{title:'Word Association',desc:'A word appears. Type the first connected word that comes to mind, as fast as possible. Builds mental agility and natural language flow.',    cost:10,reward:20,icon:'🔗',color:'var(--blue)'},
  }

  if(active==='memory-chain')    return<MemoryChain    onBack={()=>setActive('none')} onFinish={(s)=>{handleShare('memory-chain',s);setActive('none')}}/>
  if(active==='speed-describe')  return<SpeedDescribe  onBack={()=>setActive('none')} onFinish={(s)=>{handleShare('speed-describe',s);setActive('none')}}/>
  if(active==='word-association')return<WordAssociation onBack={()=>setActive('none')} onFinish={(s)=>{handleShare('word-association',s);setActive('none')}}/>

  return(<>
    <Nav showApp/>
    <div className="container-lg">
      <p className="eyebrow anim-slide-up anim-d1">ARCADE GAMES</p>
      <div style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between',flexWrap:'wrap',gap:'12px',marginBottom:'12px'}}>
        <h1 className="font-display anim-slide-up anim-d2" style={{fontSize:'clamp(36px,5vw,56px)',fontWeight:900,letterSpacing:'-.04em'}}>Spend tokens.<br/><span style={{color:'var(--accent)'}}>Compete. Share.</span></h1>
        <div style={{background:'rgba(170,255,0,.06)',border:'1px solid rgba(170,255,0,.15)',borderRadius:'100px',padding:'10px 20px',display:'flex',alignItems:'center',gap:'8px'}}>
          <span>🪙</span><span className="font-display" style={{fontSize:'24px',fontWeight:900,color:'var(--accent)'}}>{tokens}</span>
          <span className="text-muted" style={{fontSize:'13px'}}>tokens</span>
        </div>
      </div>
      <p className="text-muted anim-slide-up anim-d2" style={{fontSize:'16px',marginBottom:'40px'}}>Use tokens earned from practice sessions. Beat the leaderboard. Share your score.</p>

      {shareMsg&&<div style={{background:'rgba(170,255,0,.08)',border:'1px solid rgba(170,255,0,.2)',borderRadius:'12px',padding:'12px 20px',marginBottom:'20px',fontSize:'14px',color:'var(--accent)'}}>{shareMsg}</div>}

      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'16px',marginBottom:'48px'}}>
        {Object.entries(GAME_INFO).map(([id,g],i)=>{
          const best=getBestScore(id)
          const lb=getLeaderboard(id)
          return(
            <div key={id} className="anim-slide-up" style={{animationDelay:`${.1+i*.1}s`}}>
              <div className="game-card" style={{marginBottom:'12px'}}>
                <div style={{fontSize:'42px',marginBottom:'16px'}}>{g.icon}</div>
                <h2 style={{fontSize:'18px',fontWeight:700,letterSpacing:'-.02em',marginBottom:'8px'}}>{g.title}</h2>
                <p style={{fontSize:'13px',color:'var(--text-muted)',lineHeight:1.6,marginBottom:'16px'}}>{g.desc}</p>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'16px'}}>
                  <span style={{fontSize:'13px',background:'rgba(170,255,0,.08)',color:'var(--accent)',padding:'4px 12px',borderRadius:'100px',fontWeight:700}}>Cost: {g.cost} 🪙</span>
                  <span style={{fontSize:'13px',color:'var(--text-muted)'}}>Win: +{g.reward} 🪙</span>
                </div>
                {best>0&&<div style={{fontSize:'13px',color:'var(--text-muted)',marginBottom:'12px'}}>Your best: <span style={{color:g.color,fontWeight:700}}>{best}</span></div>}
                <button
                  className={`btn btn-full btn-md ${tokens>=g.cost?'btn-primary':'btn-outline'}`}
                  onClick={()=>play(id as GameId,g.cost)}
                  style={{opacity:tokens>=g.cost?1:.5}}
                >
                  {tokens>=g.cost?`Play — ${g.cost} 🪙`:`Need ${g.cost} tokens`}
                </button>
              </div>
              {/* Mini leaderboard */}
              <div className="card" style={{padding:'16px'}}>
                <p style={{fontSize:'11px',fontWeight:700,letterSpacing:'.08em',color:'var(--text-muted)',marginBottom:'12px'}}>LEADERBOARD</p>
                {lb.length===0
                  ?<p style={{fontSize:'13px',color:'var(--text-muted)',textAlign:'center',padding:'8px 0'}}>No scores yet</p>
                  :lb.slice(0,5).map((e,ri)=>(
                    <div key={e.id} className={`lb-row ${e.isMe?'me':''}`} style={{padding:'8px 12px',marginBottom:'4px'}}>
                      <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
                        <span style={{fontSize:'13px',fontWeight:700,color:ri===0?'var(--amber)':ri===1?'var(--text-muted)':ri===2?'#CD7F32':'var(--text-muted)',minWidth:'18px'}}>{ri+1}</span>
                        <span style={{fontSize:'14px',fontWeight:600}}>{e.name}{e.isMe&&' (You)'}</span>
                      </div>
                      <span style={{fontSize:'14px',fontWeight:700,color:g.color}}>{e.score}</span>
                    </div>
                  ))
                }
              </div>
            </div>
          )
        })}
      </div>

      <div style={{background:'rgba(170,255,0,.04)',border:'1px solid rgba(170,255,0,.12)',borderRadius:'20px',padding:'28px'}}>
        <p style={{fontSize:'14px',fontWeight:600,marginBottom:'8px'}}>How to earn more tokens 🪙</p>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'12px'}}>
          {[{a:'Complete a recording session',t:'+10–25 🪙'},{a:'High clarity score (80+)',t:'+15 🪙 bonus'},{a:'Zero filler words',t:'+10 🪙 bonus'},{a:'Play practice games',t:'+10–20 🪙'}].map(r=>(
            <div key={r.a} style={{padding:'14px',background:'var(--card)',borderRadius:'12px'}}>
              <div style={{fontSize:'13px',color:'var(--text-muted)',lineHeight:1.5,marginBottom:'6px'}}>{r.a}</div>
              <div style={{fontSize:'14px',fontWeight:700,color:'var(--accent)'}}>{r.t}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </>)
}

// ── MEMORY CHAIN ─────────────────────────────────────────────────────────
const CHAIN_WORDS=['microphone','confidence','pause','clarity','speech','rhythm','voice','breath','eye contact','posture','gesture','tone','volume','pace','energy','practice','feedback','improve','strength','audience']

function MemoryChain({onBack,onFinish}:{onBack:()=>void;onFinish:(s:number)=>void}){
  const [phase,setPhase]=useState<'intro'|'show'|'recall'|'done'>('intro')
  const [chain,setChain]=useState<string[]>([]),[showIdx,setShowIdx]=useState(0),[input,setInput]=useState(''),[correct,setCorrect]=useState(0),[round,setRound]=useState(1),[score,setScore]=useState(0)
  const timerRef=useRef<any>(null)

  const startRound=(r:number)=>{
    const len=r+2
    const words=[]
    const pool=[...CHAIN_WORDS]
    for(let i=0;i<len;i++){const idx=Math.floor(Math.random()*pool.length);words.push(pool.splice(idx,1)[0])}
    setChain(words);setShowIdx(0);setPhase('show')
    let i=0
    timerRef.current=setInterval(()=>{
      i++;
      if(i>=words.length){clearInterval(timerRef.current);setTimeout(()=>setPhase('recall'),500)}
      else setShowIdx(i)
    },1000)
  }

  const checkRecall=()=>{
    const userWords=input.trim().toLowerCase().split(/[,\s]+/).filter(Boolean)
    let c=0;chain.forEach((w,i)=>{if(userWords[i]&&userWords[i]===w.toLowerCase())c++})
    const pts=c*10*round
    setCorrect(c);setScore(s=>s+pts)
    if(round>=5||c<chain.length){
      const final=score+pts
      saveGameScore({gameId:'memory-chain',score:final,date:new Date().toISOString(),level:round,tokensEarned:25})
      setScore(final);setPhase('done')
    }else{setRound(r=>r+1);setInput('');setPhase('intro')}
  }

  useEffect(()=>()=>clearInterval(timerRef.current),[])

  return(<><Nav rightContent={<button onClick={onBack} className="btn btn-outline btn-sm">← Games</button>}/>
    <div className="container" style={{textAlign:'center'}}>
      <p className="eyebrow">MEMORY CHAIN — Round {round}/5</p>
      {phase==='intro'&&(<><h2 className="font-display anim-slide-up" style={{fontSize:'clamp(28px,4vw,42px)',fontWeight:900,letterSpacing:'-.04em',marginBottom:'16px'}}>Remember the chain.</h2><p className="text-muted" style={{fontSize:'16px',marginBottom:'28px'}}>{round+2} words will flash in order. Remember them all, then type them back.</p><button className="btn btn-primary btn-lg btn-full" onClick={()=>startRound(round)}>Show Words →</button></>)}
      {phase==='show'&&(<><p className="text-muted" style={{marginBottom:'24px',fontSize:'14px'}}>Word {showIdx+1} of {chain.length}</p><div style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:'24px',padding:'80px 40px',marginBottom:'24px'}}><div className="font-display anim-count-in" style={{fontSize:'clamp(32px,5vw,56px)',fontWeight:900,letterSpacing:'-.03em',color:'var(--accent)'}}>{chain[showIdx]}</div></div><div style={{display:'flex',gap:'4px',justifyContent:'center'}}>{chain.map((_,i)=><div key={i} style={{width:'24px',height:'4px',borderRadius:'2px',background:i<=showIdx?'var(--accent)':'var(--border-light)'}}/>)}</div></>)}
      {phase==='recall'&&(<><h2 className="font-display anim-slide-up" style={{fontSize:'clamp(24px,4vw,36px)',fontWeight:900,letterSpacing:'-.04em',marginBottom:'12px'}}>What were the words?</h2><p className="text-muted" style={{marginBottom:'24px'}}>Type them in order, separated by spaces or commas.</p><textarea value={input} onChange={e=>setInput(e.target.value)} placeholder="word1, word2, word3..." style={{width:'100%',background:'var(--card)',border:'1px solid var(--border)',borderRadius:'14px',padding:'16px',color:'var(--text-primary)',fontFamily:'var(--font-body)',fontSize:'16px',resize:'vertical',minHeight:'100px',outline:'none',marginBottom:'16px'}} onFocus={e=>e.target.style.borderColor='var(--accent)'} onBlur={e=>e.target.style.borderColor='var(--border)'}/><button className="btn btn-primary btn-lg btn-full" onClick={checkRecall}>Submit →</button></>)}
      {phase==='done'&&(<><div style={{fontSize:'48px',marginBottom:'16px'}}>{correct===chain.length?'🎉':'💪'}</div><div className="clarity-hero" style={{marginBottom:'20px'}}><div className="clarity-num">{score}</div><p className="text-muted" style={{marginTop:'8px'}}>final score</p></div><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px'}}><button className="btn btn-primary btn-lg" onClick={()=>{setRound(1);setScore(0);setPhase('intro')}}>Play Again</button><button className="btn btn-outline btn-lg" onClick={()=>onFinish(score)}>Done</button></div></>)}
    </div>
  </>)
}

// ── SPEED DESCRIBE ────────────────────────────────────────────────────────
const CONCEPTS=['a sunset over mountains','a busy city intersection','someone giving a speech','a crowded library','an empty stage with one spotlight','a handshake between two people','a microphone on a stand','a student presenting in class','a coach coaching an athlete','two friends having a debate']

function SpeedDescribe({onBack,onFinish}:{onBack:()=>void;onFinish:(s:number)=>void}){
  const [phase,setPhase]=useState<'intro'|'playing'|'done'>('intro')
  const [idx,setIdx]=useState(0),[input,setInput]=useState(''),[results,setResults]=useState<{concept:string;answer:string;ok:boolean}[]>([]),[time,setTime]=useState(5),[score,setScore]=useState(0)
  const timerRef=useRef<any>(null)

  const startRound=()=>{
    setTime(5)
    timerRef.current=setInterval(()=>setTime(t=>{if(t<=1){clearInterval(timerRef.current);submit();return 0}return t-1}),1000)
  }

  const submit=()=>{
    clearInterval(timerRef.current)
    const words=input.trim().split(/\s+/).filter(Boolean)
    const ok=words.length===5
    const pts=ok?20:Math.max(0,20-Math.abs(words.length-5)*5)
    setScore(s=>s+pts)
    setResults(r=>[...r,{concept:CONCEPTS[idx],answer:input.trim()||'(no answer)',ok}])
    if(idx+1>=Math.min(CONCEPTS.length,5)){
      const final=score+pts
      saveGameScore({gameId:'speed-describe',score:final,date:new Date().toISOString(),level:1,tokensEarned:30})
      setScore(final);setPhase('done')
    }else{setIdx(i=>i+1);setInput('');startRound()}
  }

  const start=()=>{setPhase('playing');setIdx(0);setResults([]);setScore(0);startRound()}
  useEffect(()=>()=>clearInterval(timerRef.current),[])

  return(<><Nav rightContent={<button onClick={onBack} className="btn btn-outline btn-sm">← Games</button>}/>
    <div className="container" style={{textAlign:'center'}}>
      <p className="eyebrow">SPEED DESCRIBE</p>
      {phase==='intro'&&(<><h2 className="font-display anim-slide-up" style={{fontSize:'clamp(28px,4vw,42px)',fontWeight:900,letterSpacing:'-.04em',marginBottom:'16px'}}>Exactly 5 words.</h2><p className="text-muted" style={{fontSize:'16px',marginBottom:'28px'}}>A concept appears. Describe it in exactly 5 words. You have 5 seconds. Trains conciseness and fast thinking.</p><button className="btn btn-primary btn-lg btn-full" onClick={start}>Start →</button></>)}
      {phase==='playing'&&(<>
        <div style={{marginBottom:'24px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <span className="text-muted" style={{fontSize:'13px'}}>Round {idx+1}/5</span>
          <div className="font-display" style={{fontSize:'48px',fontWeight:900,color:time<=2?'var(--hot)':'var(--text-primary)'}}>{time}</div>
          <span style={{fontSize:'13px',color:'var(--accent)',fontWeight:700}}>Score: {score}</span>
        </div>
        <div style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:'20px',padding:'40px',marginBottom:'24px'}}>
          <p style={{fontSize:'11px',fontWeight:700,color:'var(--text-muted)',marginBottom:'12px',letterSpacing:'.08em'}}>DESCRIBE THIS IN 5 WORDS</p>
          <p style={{fontSize:'clamp(18px,3vw,26px)',fontWeight:700,color:'var(--text-primary)'}}>{CONCEPTS[idx]}</p>
        </div>
        <input className="input" style={{fontSize:'20px',padding:'18px',marginBottom:'12px',textAlign:'center'}} value={input} onChange={e=>setInput(e.target.value)} placeholder="Type your 5 words..." onKeyDown={e=>e.key==='Enter'&&submit()} autoFocus/>
        <p style={{fontSize:'13px',color:(input.trim().split(/\s+/).filter(Boolean).length===5)?'var(--accent)':'var(--text-muted)'}}>Word count: {input.trim().split(/\s+/).filter(Boolean).length} / 5</p>
        <button className="btn btn-outline btn-md" style={{marginTop:'14px'}} onClick={submit}>Submit →</button>
      </>)}
      {phase==='done'&&(<><div className="clarity-hero" style={{marginBottom:'20px'}}><div className="clarity-num">{score}</div><p className="text-muted" style={{marginTop:'8px'}}>final score</p></div>
        <div className="card" style={{padding:'20px',marginBottom:'20px'}}>
          {results.map((r,i)=><div key={i} style={{display:'flex',alignItems:'center',gap:'12px',padding:'10px 0',borderBottom:i<results.length-1?'1px solid var(--border)':'none'}}>
            <span style={{fontSize:'18px'}}>{r.ok?'✅':'❌'}</span>
            <div style={{flex:1,textAlign:'left'}}><div style={{fontSize:'13px',color:'var(--text-muted)'}}>{r.concept}</div><div style={{fontSize:'14px',fontWeight:600,fontStyle:'italic'}}>"{r.answer}"</div></div>
          </div>)}
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px'}}><button className="btn btn-primary btn-lg" onClick={start}>Play Again</button><button className="btn btn-outline btn-lg" onClick={()=>onFinish(score)}>Done</button></div>
      </>)}
    </div>
  </>)
}

// ── WORD ASSOCIATION ──────────────────────────────────────────────────────
const ASSOC_WORDS=['confidence','microphone','stage','audience','pause','voice','practice','clarity','breath','leader','courage','speak','listen','improve','grow']

function WordAssociation({onBack,onFinish}:{onBack:()=>void;onFinish:(s:number)=>void}){
  const [phase,setPhase]=useState<'intro'|'playing'|'done'>('intro')
  const [wordIdx,setWordIdx]=useState(0),[input,setInput]=useState(''),[score,setScore]=useState(0),[times,setTimes]=useState<number[]>([]),[start,setStart]=useState(0),[round,setRound]=useState(0)
  const MAX_ROUNDS=10

  const next=()=>{
    const elapsed=(Date.now()-start)/1000
    const pts=Math.max(5,Math.round(20-(elapsed*3)))
    if(input.trim().length>0){setScore(s=>s+pts);setTimes(t=>[...t,elapsed])}
    if(round+1>=MAX_ROUNDS){
      const final=score+(input.trim().length>0?pts:0)
      saveGameScore({gameId:'word-association',score:final,date:new Date().toISOString(),level:1,tokensEarned:20})
      setScore(final);setPhase('done')
    }else{
      setRound(r=>r+1);setWordIdx(i=>(i+1)%ASSOC_WORDS.length);setInput('');setStart(Date.now())
    }
  }

  const startGame=()=>{setPhase('playing');setRound(0);setScore(0);setTimes([]);setStart(Date.now());setWordIdx(0)}

  return(<><Nav rightContent={<button onClick={onBack} className="btn btn-outline btn-sm">← Games</button>}/>
    <div className="container" style={{textAlign:'center'}}>
      <p className="eyebrow">WORD ASSOCIATION</p>
      {phase==='intro'&&(<><h2 className="font-display anim-slide-up" style={{fontSize:'clamp(28px,4vw,42px)',fontWeight:900,letterSpacing:'-.04em',marginBottom:'16px'}}>Fast thinking.</h2><p className="text-muted" style={{fontSize:'16px',marginBottom:'28px'}}>A word appears. Type the first related word that comes to mind — as fast as possible. Faster = more points.</p><button className="btn btn-primary btn-lg btn-full" onClick={startGame}>Start →</button></>)}
      {phase==='playing'&&(<>
        <div style={{display:'flex',justifyContent:'space-between',marginBottom:'32px'}}>
          <span className="text-muted" style={{fontSize:'13px'}}>{round+1}/{MAX_ROUNDS}</span>
          <span style={{fontSize:'13px',color:'var(--accent)',fontWeight:700}}>Score: {score}</span>
        </div>
        <div style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:'24px',padding:'60px 40px',marginBottom:'32px'}}>
          <p style={{fontSize:'clamp(32px,5vw,52px)',fontWeight:700,letterSpacing:'-.03em',color:'var(--accent)'}}>{ASSOC_WORDS[wordIdx]}</p>
        </div>
        <input className="input" style={{fontSize:'22px',padding:'20px',textAlign:'center',marginBottom:'14px'}} value={input} onChange={e=>setInput(e.target.value)} placeholder="First word that comes to mind..." onKeyDown={e=>e.key==='Enter'&&next()} autoFocus/>
        <button className="btn btn-primary btn-lg btn-full" onClick={next}>Next →</button>
        <div style={{marginTop:'16px'}}><div className="prog-track"><div className="prog-fill" style={{background:'var(--accent)',width:`${((round)/MAX_ROUNDS)*100}%`,transition:'width .3s'}}/></div></div>
      </>)}
      {phase==='done'&&(<><div className="clarity-hero" style={{marginBottom:'20px'}}><div className="clarity-num">{score}</div><p className="text-muted" style={{marginTop:'8px'}}>final score</p></div>
        {times.length>0&&<div className="card" style={{padding:'20px',marginBottom:'20px'}}><p style={{fontWeight:600,marginBottom:'8px'}}>Avg response time: {(times.reduce((a,b)=>a+b,0)/times.length).toFixed(1)}s</p><p className="text-muted" style={{fontSize:'13px'}}>Faster responses = stronger natural language flow</p></div>}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px'}}><button className="btn btn-primary btn-lg" onClick={startGame}>Play Again</button><button className="btn btn-outline btn-lg" onClick={()=>onFinish(score)}>Done</button></div>
      </>)}
    </div>
  </>)
}

'use client'
import {useEffect,useState} from 'react'
import {useRouter} from 'next/navigation'
import Nav from '@/components/Nav'
import {getSessions,computeStats,computeStreak,getSettings,deleteSession,getPracticeStats,getTokenBalance} from '@/lib/store'
import type {Session} from '@/lib/types'

function fmt(s:number){return`${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`}
function fmtDate(iso:string){const d=new Date(iso),now=new Date(),diff=Math.floor((now.getTime()-d.getTime())/86400000);return diff===0?'Today':diff===1?'Yesterday':diff<7?`${diff} days ago`:d.toLocaleDateString('en-US',{month:'short',day:'numeric'})}

const GAME_LABELS:Record<string,string>={'filler-blitz':'Filler Blitz','topic-sprint':'Topic Sprint','tongue-twister':'Tongue Twister','memory-chain':'Memory Chain','speed-describe':'Speed Describe','word-association':'Word Association'}

export default function DashboardPage(){
  const router=useRouter()
  const [sessions,setSessions]=useState<Session[]>([])
  const [stats,setStats]=useState<any>(null)
  const [name,setName]=useState('')
  const [streak,setStreak]=useState(0)
  const [expanded,setExpanded]=useState<string|null>(null)
  const [tab,setTab]=useState<'recording'|'practice'>('recording')
  const [pStats,setPStats]=useState<any>(null)
  const [tokens,setTokens]=useState(0)

  useEffect(()=>{
    const s=getSessions();setSessions(s);setStats(computeStats(s));setStreak(computeStreak(s))
    setName(getSettings().name||'there');setPStats(getPracticeStats());setTokens(getTokenBalance())
  },[])

  const handleDelete=(id:string)=>{
    deleteSession(id);const s=getSessions();setSessions(s);setStats(computeStats(s));setStreak(computeStreak(s))
  }

  return(<>
    <Nav showApp/>
    <div className="container-lg">
      <div style={{marginBottom:'32px',display:'flex',alignItems:'flex-end',justifyContent:'space-between',flexWrap:'wrap',gap:'16px'}}>
        <div>
          <p className="eyebrow anim-slide-up anim-d1">YOUR DASHBOARD</p>
          <h1 className="font-display anim-slide-up anim-d2" style={{fontSize:'clamp(32px,5vw,58px)',fontWeight:900,letterSpacing:'-.04em'}}>
            {sessions.length===0?`Welcome, ${name}.`:`Keep going, ${name}.`}
          </h1>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
          <div style={{background:'rgba(170,255,0,.06)',border:'1px solid rgba(170,255,0,.15)',borderRadius:'100px',padding:'10px 20px',display:'flex',alignItems:'center',gap:'8px'}}>
            <span style={{fontSize:'20px'}}>🪙</span>
            <span className="font-display" style={{fontSize:'22px',fontWeight:900,color:'var(--accent)'}}>{tokens}</span>
            <span className="text-muted" style={{fontSize:'13px'}}>tokens</span>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="tab-bar anim-slide-up anim-d3" style={{marginBottom:'32px',maxWidth:'400px'}}>
        <button className={`tab-btn ${tab==='recording'?'active':''}`} onClick={()=>setTab('recording')}>🎤 Recording Stats</button>
        <button className={`tab-btn ${tab==='practice'?'active':''}`} onClick={()=>setTab('practice')}>🎮 Practice Stats</button>
      </div>

      {/* ── RECORDING TAB ── */}
      {tab==='recording'&&(
        <>
          {sessions.length===0?(
            <div className="anim-slide-up anim-d3" style={{textAlign:'center',padding:'80px 40px',border:'1px dashed var(--border-light)',borderRadius:'24px',marginBottom:'40px'}}>
              <div style={{fontSize:'48px',marginBottom:'16px'}}>🎤</div>
              <h2 className="font-display" style={{fontSize:'28px',fontWeight:900,letterSpacing:'-.03em',marginBottom:'12px'}}>No sessions yet</h2>
              <p className="text-muted" style={{marginBottom:'24px'}}>Complete your first VOCAL rep to see your stats here.</p>
              <button className="btn btn-primary btn-lg" onClick={()=>router.push('/record')}>Start Your First Rep →</button>
            </div>
          ):(
            <>
              {/* Stats row */}
              <div className="anim-slide-up anim-d3" style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:'12px',marginBottom:'28px'}}>
                {[
                  {label:'Sessions',      val:stats?.n.toString()||'0',         sub:'total',            color:'var(--text-primary)'},
                  {label:'Avg Clarity',   val:stats?.avgClarity.toString()||'0', sub:'/ 100',            color:'var(--accent)'},
                  {label:'Best Clarity',  val:stats?.bestClarity.toString()||'0',sub:'personal best',    color:'var(--accent)'},
                  {label:'Avg Fillers',   val:stats?.avgFillers.toString()||'0', sub:'per session',      color:stats?.avgFillers>8?'var(--hot)':'var(--text-primary)'},
                  {label:'Practice Time', val:`${stats?.totalMins||0}m`,         sub:'total',            color:'var(--blue)'},
                ].map(s=>(
                  <div key={s.label} className="dash-card" style={{textAlign:'center'}}>
                    <div className="font-display" style={{fontSize:'clamp(24px,3vw,38px)',fontWeight:900,letterSpacing:'-.04em',color:s.color,lineHeight:1}}>{s.val}</div>
                    <div style={{fontSize:'12px',fontWeight:600,marginTop:'8px',color:'var(--text-muted)'}}>{s.label}</div>
                    <div className="text-muted" style={{fontSize:'11px',marginTop:'3px'}}>{s.sub}</div>
                  </div>
                ))}
              </div>

              {/* Streak + trend */}
              <div className="anim-slide-up anim-d4" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px',marginBottom:'28px'}}>
                <div className="dash-card" style={{display:'flex',alignItems:'center',gap:'20px'}}>
                  <div style={{fontSize:'52px'}}>🔥</div>
                  <div>
                    <div className="font-display" style={{fontSize:'48px',fontWeight:900,letterSpacing:'-.04em',color:'var(--amber)',lineHeight:1}}>{streak}</div>
                    <div style={{fontWeight:600,marginTop:'4px'}}>Day Streak</div>
                    <div className="text-muted" style={{fontSize:'13px'}}>Keep practicing daily</div>
                  </div>
                </div>
                <div className="dash-card">
                  <p style={{fontSize:'11px',fontWeight:700,letterSpacing:'.1em',color:'var(--text-muted)',marginBottom:'16px'}}>CLARITY TREND</p>
                  {sessions.length>=2?(
                    <>
                      <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'12px'}}>
                        <span className="font-display" style={{fontSize:'32px',fontWeight:900,color:stats?.trend>=0?'var(--accent)':'var(--hot)'}}>{stats?.trend>=0?'+':''}{stats?.trend}</span>
                        <span className="text-muted" style={{fontSize:'14px'}}>vs last session</span>
                      </div>
                      <div className="prog-track"><div className="prog-fill" style={{background:stats?.trend>=0?'var(--accent)':'var(--hot)',width:`${Math.min(100,Math.abs(stats?.trend||0)*5)}%`}}/></div>
                    </>
                  ):<p className="text-muted" style={{fontSize:'13px'}}>Complete 2+ sessions to see trend</p>}
                </div>
              </div>

              {/* Chart */}
              {sessions.length>=2&&<DashChart sessions={sessions}/>}

              {/* Sessions list */}
              <div className="anim-slide-up anim-d5">
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'16px'}}>
                  <h2 style={{fontSize:'18px',fontWeight:700}}>All Sessions</h2>
                  <span className="text-muted" style={{fontSize:'13px'}}>{sessions.length} total</span>
                </div>
                <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
                  {sessions.map(s=>(
                    <div key={s.id}>
                      <div className="dash-card" style={{cursor:'pointer'}} onClick={()=>setExpanded(expanded===s.id?null:s.id)}>
                        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:'12px'}}>
                          <div style={{flex:1,minWidth:'200px'}}>
                            <div style={{fontWeight:600,fontSize:'15px',marginBottom:'4px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:'340px'}}>&ldquo;{s.prompt||'No prompt'}&rdquo;</div>
                            <div style={{display:'flex',gap:'12px',flexWrap:'wrap'}}>
                              <span className="text-muted" style={{fontSize:'13px'}}>{fmtDate(s.date)}</span>
                              <span className="text-muted" style={{fontSize:'13px'}}>{s.category}</span>
                              <span className="text-muted" style={{fontSize:'13px'}}>{fmt(s.duration)}</span>
                            </div>
                          </div>
                          <div style={{display:'flex',gap:'20px',alignItems:'center'}}>
                            {[{k:'CLARITY',v:s.clarityScore,c:'var(--accent)'},{k:'FILLERS',v:s.fillerCount,c:s.fillerCount>8?'var(--hot)':s.fillerCount>3?'var(--amber)':'var(--text-primary)'},{k:'WPM',v:s.pace}].map(m=>(
                              <div key={m.k} style={{textAlign:'center'}}>
                                <div style={{fontSize:'10px',color:'#555',marginBottom:'2px',fontWeight:700,letterSpacing:'.06em'}}>{m.k}</div>
                                <div style={{fontWeight:700,color:m.c||'var(--text-primary)',fontSize:'18px'}}>{m.v}</div>
                              </div>
                            ))}
                            <span style={{color:'var(--text-muted)',fontSize:'16px',transform:expanded===s.id?'rotate(180deg)':'',transition:'transform .2s'}}>▼</span>
                          </div>
                        </div>
                      </div>
                      {expanded===s.id&&(
                        <div className="anim-fade-in" style={{background:'var(--card2)',border:'1px solid var(--border-light)',borderRadius:'0 0 20px 20px',marginTop:'-10px',padding:'24px',paddingTop:'32px'}}>
                          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'16px',marginBottom:'16px'}}>
                            <div>
                              <p style={{fontSize:'11px',fontWeight:700,letterSpacing:'.08em',color:'var(--text-muted)',marginBottom:'12px'}}>METRICS</p>
                              {[{k:'Clarity Score',v:`${s.clarityScore}/100`,c:s.clarityScore<60?'var(--hot)':'var(--accent)'},{k:'Filler Words',v:s.fillerCount.toString(),c:s.fillerCount>5?'var(--hot)':'var(--text-primary)'},{k:'Pace',v:`${s.pace} WPM`},{k:'Duration',v:fmt(s.duration)},{k:'Length',v:s.lengthStatus.replace('-',' '),c:s.lengthStatus==='in-range'?'var(--accent)':'var(--amber)'}].map(m=>(
                                <div key={m.k} style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid var(--border)',fontSize:'14px'}}>
                                  <span className="text-muted">{m.k}</span>
                                  <span style={{fontWeight:600,color:m.c||'var(--text-primary)'}}>{m.v}</span>
                                </div>
                              ))}
                            </div>
                            <div>
                              <p style={{fontSize:'11px',fontWeight:700,letterSpacing:'.08em',color:'var(--text-muted)',marginBottom:'12px'}}>COACHING GIVEN</p>
                              {s.feedback?.map((f:any,fi:number)=>(
                                <div key={fi} style={{display:'flex',gap:'10px',marginBottom:'10px',padding:'10px',background:'var(--card)',borderRadius:'12px'}}>
                                  <span style={{fontSize:'18px'}}>{f.icon}</span>
                                  <div><div style={{fontWeight:600,fontSize:'13px',marginBottom:'4px'}}>{f.title}</div><div style={{fontSize:'12px',color:'var(--text-muted)',lineHeight:1.5}}>{f.detail}</div></div>
                                </div>
                              ))}
                              {s.fillerWords?.length>0&&(
                                <div style={{marginTop:'8px'}}>
                                  <p style={{fontSize:'11px',color:'var(--text-muted)',marginBottom:'8px'}}>FILLERS DETECTED</p>
                                  <div style={{display:'flex',flexWrap:'wrap',gap:'6px'}}>
                                    {s.fillerWords.map((fw:string,fwi:number)=>(
                                      <span key={fwi} style={{padding:'4px 10px',borderRadius:'100px',background:'rgba(255,48,84,.1)',border:'1px solid rgba(255,48,84,.2)',fontSize:'12px',color:'var(--hot)'}}>{fw}</span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                          <div style={{display:'flex',justifyContent:'flex-end'}}>
                            <button onClick={()=>handleDelete(s.id)} style={{background:'transparent',border:'1px solid rgba(255,48,84,.2)',color:'var(--hot)',borderRadius:'100px',padding:'8px 16px',fontSize:'12px',cursor:'pointer',fontFamily:'var(--font-body)'}}>Delete Session</button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </>
      )}

      {/* ── PRACTICE TAB ── */}
      {tab==='practice'&&pStats&&(
        <div className="anim-fade-in">
          {pStats.totalGamesPlayed===0?(
            <div style={{textAlign:'center',padding:'80px 40px',border:'1px dashed var(--border-light)',borderRadius:'24px'}}>
              <div style={{fontSize:'48px',marginBottom:'16px'}}>🎮</div>
              <h2 className="font-display" style={{fontSize:'28px',fontWeight:900,letterSpacing:'-.03em',marginBottom:'12px'}}>No games played yet</h2>
              <p className="text-muted" style={{marginBottom:'24px'}}>Play practice games to see your stats here.</p>
              <button className="btn btn-primary btn-lg" onClick={()=>router.push('/practice')}>Go to Practice →</button>
            </div>
          ):(
            <>
              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'12px',marginBottom:'28px'}}>
                {[
                  {label:'Games Played',  val:pStats.totalGamesPlayed.toString(), color:'var(--text-primary)'},
                  {label:'Tokens Earned', val:`${pStats.totalTokensEarned} 🪙`,   color:'var(--accent)'},
                  {label:'Last Played',   val:pStats.lastPlayed?new Date(pStats.lastPlayed).toLocaleDateString():'—', color:'var(--text-muted)'},
                ].map(s=>(
                  <div key={s.label} className="dash-card" style={{textAlign:'center'}}>
                    <div className="font-display" style={{fontSize:'clamp(24px,3vw,38px)',fontWeight:900,color:s.color,lineHeight:1}}>{s.val}</div>
                    <div style={{fontSize:'12px',fontWeight:600,marginTop:'8px',color:'var(--text-muted)'}}>{s.label}</div>
                  </div>
                ))}
              </div>
              <h3 style={{fontSize:'16px',fontWeight:700,marginBottom:'14px'}}>Best Scores by Game</h3>
              <div style={{display:'flex',flexDirection:'column',gap:'10px',marginBottom:'28px'}}>
                {Object.entries(pStats.bestScores).map(([gameId,score]:any)=>(
                  <div key={gameId} className="dash-card" style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                    <div>
                      <div style={{fontWeight:600,fontSize:'15px'}}>{GAME_LABELS[gameId]||gameId}</div>
                      <div className="text-muted" style={{fontSize:'13px'}}>{pStats.gamesBreakdown[gameId]||0} games played</div>
                    </div>
                    <div className="font-display" style={{fontSize:'32px',fontWeight:900,color:'var(--accent)'}}>{score}</div>
                  </div>
                ))}
              </div>
              <div style={{background:'rgba(170,255,0,.04)',border:'1px solid rgba(170,255,0,.12)',borderRadius:'20px',padding:'24px'}}>
                <h3 style={{fontSize:'15px',fontWeight:700,marginBottom:'12px'}}>How Practice Helps Your Recording</h3>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px'}}>
                  {[
                    {game:'Filler Blitz',skill:'Hearing filler words in real-time trains your brain to avoid them while speaking.'},
                    {game:'Topic Sprint',skill:'Timed speaking builds the habit of organizing thoughts fast under pressure.'},
                    {game:'Tongue Twister',skill:'Articulation practice makes your words clearer and more confident.'},
                    {game:'Memory Chain',skill:'Remembering word sequences builds natural speaking flow without pausing.'},
                  ].map(t=>(
                    <div key={t.game} style={{padding:'16px',background:'var(--card)',borderRadius:'14px'}}>
                      <div style={{fontWeight:600,fontSize:'14px',color:'var(--accent)',marginBottom:'6px'}}>{t.game}</div>
                      <div style={{fontSize:'13px',color:'var(--text-muted)',lineHeight:1.55}}>{t.skill}</div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  </>)
}

function DashChart({sessions}:{sessions:Session[]}){
  useEffect(()=>{
    const pts=sessions.slice(0,10).map(s=>s.clarityScore).reverse()
    if(pts.length<2)return
    const W=600,H=80,minV=Math.max(0,Math.min(...pts)-10),maxV=Math.min(100,Math.max(...pts)+10)
    const tx=(i:number)=>(i/(pts.length-1))*W,ty=(v:number)=>H-((v-minV)/(maxV-minV))*H
    const pathD=pts.map((v,i)=>`${i===0?'M':'L'} ${tx(i).toFixed(1)} ${ty(v).toFixed(1)}`).join(' ')
    const areaD=pathD+` L ${W} ${H+20} L 0 ${H+20} Z`
    const dots=pts.map((v,i)=>{const last=i===pts.length-1;return`<circle cx="${tx(i).toFixed(1)}" cy="${ty(v).toFixed(1)}" r="${last?5:3}" fill="${last?'#AAFF00':'#1C1C1C'}" stroke="#AAFF00" stroke-width="2"/><text x="${tx(i).toFixed(1)}" y="${(ty(v)-10).toFixed(1)}" text-anchor="middle" fill="#555" font-size="11" font-family="DM Sans,sans-serif">${v}</text>`}).join('')
    const svg=document.getElementById('dash-chart')
    if(svg)svg.innerHTML=`<defs><linearGradient id="dg1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#AAFF00" stop-opacity=".22"/><stop offset="100%" stop-color="#AAFF00" stop-opacity="0"/></linearGradient></defs><path d="${areaD}" fill="url(#dg1)"/><path d="${pathD}" stroke="#AAFF00" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>${dots}`
  },[sessions])
  return(
    <div className="anim-slide-up anim-d4 dash-card" style={{marginBottom:'28px'}}>
      <p style={{fontSize:'11px',fontWeight:700,letterSpacing:'.1em',color:'var(--text-muted)',marginBottom:'20px'}}>CLARITY OVER TIME</p>
      <svg id="dash-chart" viewBox="0 0 600 100" width="100%" style={{display:'block',overflow:'visible'}}/>
    </div>
  )
}

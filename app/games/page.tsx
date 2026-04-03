'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Nav from '@/components/Nav'
import FeatureGate from '@/components/FeatureGate'
import { getTokenBalance, getBestScore, addTokens, saveGameScore } from '@/lib/db'
import { createClient } from '@/lib/supabase'
import { getAICoaching } from '@/lib/aiCoaching'

// ─── Game registry ─────────────────────────────────────────────────────────

const ALL_GAMES = [
  { id:'filler-blitz',      icon:'⚡', title:'Filler Blitz',       reward:15, desc:'Words flash one at a time — tap only filler words before they disappear.',        color:'var(--hot)',   tags:['filler-words'] },
  { id:'topic-sprint',      icon:'🎤', title:'Topic Sprint',       reward:20, desc:'A random topic appears. Speak for 60 seconds then rate yourself on 3 criteria.',   color:'var(--accent)',tags:['confidence','structure'] },
  { id:'tongue-twister',    icon:'🌀', title:'Tongue Twister',     reward:12, desc:'8 progressive twisters. Rate your clarity. Trains articulation and confidence.',   color:'var(--blue)',  tags:['clarity','pace'] },
  { id:'word-association',  icon:'💭', title:'Word Association',   reward:10, desc:'Say the first word that comes to mind. Trains quick confident responses.',        color:'var(--amber)', tags:['confidence','filler-words'] },
  { id:'mirror-mode',       icon:'🪞', title:'Mirror Mode',        reward:18, desc:'Repeat a sentence back with the same energy and pace. Trains vocal mirroring.',   color:'var(--accent)',tags:['pace','clarity'] },
  { id:'qa-rapid-fire',     icon:'🔥', title:'Q&A Rapid Fire',     reward:22, desc:'Interview questions fire back-to-back. No pausing. Trains interview reflexes.',   color:'var(--hot)',   tags:['structure','confidence'] },
  { id:'pitch-perfect',     icon:'🎯', title:'Pitch Perfect',      reward:25, desc:'30 seconds to pitch anything. Then rate your hook and clarity.',                  color:'var(--accent)',tags:['structure','clarity'] },
  { id:'filler-free-zone',  icon:'🚫', title:'Filler-Free Zone',   reward:30, desc:'Speak for 60 seconds with zero fillers. One filler and the game resets.',        color:'var(--hot)',   tags:['filler-words'] },
  { id:'speed-round',       icon:'⏩', title:'Speed Round',        reward:14, desc:'Answer 10 questions in 90 seconds — one sentence each. Trains conciseness.',     color:'var(--blue)',  tags:['pace','structure'] },
  { id:'storytelling',      icon:'📖', title:'Storytelling',       reward:20, desc:'Build a story one sentence at a time. Each round adds a twist.',                  color:'var(--amber)', tags:['structure','confidence'] },
  { id:'debate-it',         icon:'⚖️', title:'Debate It',          reward:25, desc:'Argue both sides of a topic. 30 seconds each. Trains persuasive speaking.',      color:'var(--accent)',tags:['structure','confidence'] },
  { id:'acronym-attack',    icon:'🔤', title:'Acronym Attack',     reward:12, desc:'Explain what a random acronym stands for. The stranger the better.',             color:'var(--blue)',  tags:['clarity','confidence'] },
  { id:'clarity-challenge', icon:'🏆', title:'Clarity Challenge',  reward:35, desc:'The ultimate test. 2-minute speech on a hard topic. Full AI analysis.',          color:'var(--accent)',tags:['clarity','structure','confidence'] },
]

const AI_RECOMMEND_COUNT = 3

export default function GamesPage() {
  return (
    <FeatureGate featureId="games">
      <GamesInner />
    </FeatureGate>
  )
}

function GamesInner() {
  const router = useRouter()
  const [tokens,      setTokens]      = useState(0)
  const [bestScores,  setBestScores]  = useState<Record<string,number>>({})
  const [aiPicks,     setAiPicks]     = useState<string[]>([])
  const [tab,         setTab]         = useState<'for-you'|'all'>('for-you')
  const [loading,     setLoading]     = useState(true)

  useEffect(()=>{
    const load = async () => {
      const sb = createClient()
      const bal = await getTokenBalance()
      setTokens(bal)

      // Get best scores for all games
      const scores: Record<string,number> = {}
      await Promise.all(ALL_GAMES.map(async g => {
        scores[g.id] = await getBestScore(g.id)
      }))
      setBestScores(scores)

      // AI recommendation — get last 5 sessions and find weak spots
      try {
        const { data: sessions } = await sb
          .from('sessions')
          .select('clarity_score,filler_count,pace')
          .order('created_at', { ascending: false })
          .limit(5)

        if (sessions && sessions.length > 0) {
          const avgClarity  = sessions.reduce((a:number,s:any)=>a+s.clarity_score,0)/sessions.length
          const avgFillers  = sessions.reduce((a:number,s:any)=>a+s.filler_count,0)/sessions.length
          const avgPace     = sessions.reduce((a:number,s:any)=>a+(s.pace||0),0)/sessions.length

          const weakTags: string[] = []
          if (avgFillers > 5)       weakTags.push('filler-words')
          if (avgClarity < 70)      weakTags.push('clarity')
          if (avgPace > 175 || (avgPace < 120 && avgPace > 0)) weakTags.push('pace')
          if (avgClarity < 60)      weakTags.push('structure')
          if (weakTags.length === 0) weakTags.push('confidence')

          const picks = ALL_GAMES
            .filter(g => g.tags.some(t => weakTags.includes(t)))
            .slice(0, AI_RECOMMEND_COUNT)
            .map(g => g.id)

          setAiPicks(picks.length >= AI_RECOMMEND_COUNT ? picks : ALL_GAMES.slice(0,AI_RECOMMEND_COUNT).map(g=>g.id))
        } else {
          // No sessions yet — recommend starter games
          setAiPicks(['filler-blitz','topic-sprint','tongue-twister'])
        }
      } catch {
        setAiPicks(['filler-blitz','topic-sprint','tongue-twister'])
      }

      setLoading(false)
    }
    load()
  },[])

  const displayGames = tab === 'for-you'
    ? ALL_GAMES.filter(g => aiPicks.includes(g.id))
    : ALL_GAMES

  const handlePlay = (gameId: string) => {
    router.push(`/practice?game=${gameId}`)
  }

  return (
    <>
      <Nav showApp />
      <div className="container-lg">
        {/* Header */}
        <div style={{ display:'flex',alignItems:'flex-end',justifyContent:'space-between',flexWrap:'wrap',gap:'12px',marginBottom:'8px' }}>
          <div>
            <p className="eyebrow anim-slide-up anim-d1">TRAINING ARCADE</p>
            <h1 className="font-display anim-slide-up anim-d2" style={{ fontSize:'clamp(32px,5vw,56px)',fontWeight:900,letterSpacing:'-.04em' }}>
              Train your weak spots.<br/>
              <span style={{ color:'var(--accent)' }}>Earn tokens.</span>
            </h1>
          </div>
          <div style={{ background:'rgba(170,255,0,.06)',border:'1px solid rgba(170,255,0,.2)',borderRadius:'100px',padding:'8px 18px',display:'flex',alignItems:'center',gap:'8px' }}>
            <span>🪙</span>
            <span className="font-display" style={{ fontSize:'20px',fontWeight:900,color:'var(--accent)' }}>
              {loading?'...':tokens>=999999?'∞':tokens}
            </span>
          </div>
        </div>
        <p className="text-muted anim-slide-up anim-d2" style={{ fontSize:'16px',marginBottom:'32px' }}>
          Based on your last 5 sessions — here are your personalized picks.
        </p>

        {/* Tabs */}
        <div className="tab-bar anim-slide-up anim-d3" style={{ marginBottom:'28px',maxWidth:'320px' }}>
          <button className={`tab-btn ${tab==='for-you'?'active':''}`} onClick={()=>setTab('for-you')}>
            ✦ For You
          </button>
          <button className={`tab-btn ${tab==='all'?'active':''}`} onClick={()=>setTab('all')}>
            All Games
          </button>
        </div>

        {/* AI recommendation banner */}
        {tab==='for-you'&&!loading&&(
          <div className="anim-slide-up anim-d3" style={{ background:'rgba(170,255,0,.04)',border:'1px solid rgba(170,255,0,.15)',borderRadius:'16px',padding:'14px 20px',marginBottom:'20px',display:'flex',alignItems:'center',gap:'12px' }}>
            <span style={{ fontSize:'24px' }}>🤖</span>
            <div>
              <div style={{ fontWeight:700,fontSize:'14px',color:'var(--accent)' }}>AI-PERSONALIZED FOR YOU</div>
              <div style={{ fontSize:'13px',color:'var(--text-muted)',marginTop:'2px' }}>These games target your specific weak spots from recent sessions.</div>
            </div>
          </div>
        )}

        {/* Games grid */}
        {loading ? (
          <div className="games-grid" style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:'16px' }}>
            {[0,1,2].map(i=><div key={i} className="game-card shimmer" style={{ height:'180px' }}/>)}
          </div>
        ) : (
          <div className="games-grid" style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:'16px' }}>
            {displayGames.map((g,i)=>(
              <div key={g.id} className="game-card anim-slide-up" style={{ animationDelay:`${i*.07}s` }} onClick={()=>handlePlay(g.id)}>
                <div style={{ display:'flex',alignItems:'flex-start',gap:'16px' }}>
                  <div style={{ fontSize:'36px',flexShrink:0,lineHeight:1 }}>{g.icon}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ display:'flex',alignItems:'center',gap:'10px',marginBottom:'8px',flexWrap:'wrap' }}>
                      <h2 style={{ fontSize:'18px',fontWeight:700,letterSpacing:'-.02em' }}>{g.title}</h2>
                      <span style={{ fontSize:'11px',fontWeight:700,padding:'3px 10px',borderRadius:'100px',color:g.color,background:`${g.color.replace('var(--accent)','rgba(170,255,0').replace('var(--hot)','rgba(255,48,84').replace('var(--blue)','rgba(0,174,255').replace('var(--amber)','rgba(255,184,0')},.10)`,border:`1px solid ${g.color.replace('var(--accent)','rgba(170,255,0').replace('var(--hot)','rgba(255,48,84').replace('var(--blue)','rgba(0,174,255').replace('var(--amber)','rgba(255,184,0')},.25)` }}>
                        +{g.reward} 🪙
                      </span>
                    </div>
                    <p style={{ fontSize:'13px',color:'var(--text-muted)',lineHeight:1.6,marginBottom:'14px' }}>{g.desc}</p>
                    <div style={{ display:'flex',gap:'16px',alignItems:'center' }}>
                      <span style={{ fontSize:'13px',color:g.color,fontWeight:600 }}>
                        Best: {bestScores[g.id]>0?bestScores[g.id]:'—'}
                      </span>
                      <span className="btn btn-outline btn-sm" style={{ pointerEvents:'none' }}>Play →</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab==='all'&&(
          <div style={{ textAlign:'center',marginTop:'32px' }}>
            <button className="btn btn-primary btn-lg" onClick={()=>router.push('/record')}>
              🎤 Start a Real Rep
            </button>
          </div>
        )}
      </div>
    </>
  )
}

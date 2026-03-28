'use client'
import { useState, useEffect, useRef } from 'react'
import Nav from '@/components/Nav'
import { getTokenBalance, addTokens, saveGameScore, getBestScore, getSessions } from '@/lib/db'

type GameId = 'none' | 'filler-catcher' | 'pace-trainer' | 'vocab-builder' |
  'confidence-drill' | 'structure-builder' | 'tongue-twister' |
  'rapid-fire' | 'story-chain' | 'debate-starter' | 'interview-sim' |
  'memory-chain' | 'speed-describe' | 'word-association'

interface GameInfo {
  title: string
  desc: string
  icon: string
  color: string
  category: string
  reward: number
  weakness: string[]
}

const GAMES: Record<string, GameInfo> = {
  'filler-catcher':    { title: 'Filler Catcher',      desc: 'Read sentences and tap every filler word before time runs out. Trains your ear to catch um, like, and basically in real speech.',          icon: '🎯', color: '#FF3054', category: 'Filler Words',   reward: 30, weakness: ['fillers'] },
  'pace-trainer':      { title: 'Pace Trainer',         desc: 'Read passages aloud and try to hit the ideal 130–165 WPM range. Visual feedback shows if you\'re too fast or too slow.',                   icon: '⚡', color: '#FFB800', category: 'Pacing',        reward: 25, weakness: ['pace'] },
  'vocab-builder':     { title: 'Vocab Builder',        desc: 'Weak filler phrases appear. Pick the strongest replacement. Builds the vocabulary of a confident communicator.',                             icon: '📚', color: '#4488FF', category: 'Vocabulary',    reward: 20, weakness: ['clarity'] },
  'confidence-drill':  { title: 'Confidence Drill',     desc: 'Short prompts, no time to overthink. Answer immediately and boldly. Builds the instinct to speak without hesitation.',                      icon: '💪', color: '#AAFF00', category: 'Confidence',   reward: 25, weakness: ['clarity', 'structure'] },
  'structure-builder': { title: 'Structure Builder',    desc: 'Scrambled sentences need to be reordered. Trains your brain to organize thoughts clearly before speaking.',                                  icon: '🏗', color: '#AA44FF', category: 'Structure',    reward: 30, weakness: ['structure', 'clarity'] },
  'tongue-twister':    { title: 'Pronunciation Pro',    desc: 'Nail the tongue twisters without stumbling. Builds muscle memory for clear, crisp pronunciation under pressure.',                           icon: '👅', color: '#FF6B00', category: 'Pronunciation', reward: 20, weakness: ['pace', 'clarity'] },
  'rapid-fire':        { title: 'Q&A Rapid Fire',       desc: '8 questions, 60 seconds each. Type your answer fast. More words = more points. Trains instant, articulate responses.',                     icon: '🔥', color: '#FF3054', category: 'Q&A',          reward: 35, weakness: ['fillers', 'pace'] },
  'story-chain':       { title: 'Story Chain',          desc: 'Build a story one sentence at a time. Each sentence must connect to the last. Trains narrative flow and coherent thinking.',                icon: '📖', color: '#00AEFF', category: 'Storytelling', reward: 25, weakness: ['structure'] },
  'debate-starter':    { title: 'Debate Starter',       desc: 'Given a topic and a side, build the strongest 3-point argument in 90 seconds. Trains logical structure and persuasive delivery.',           icon: '⚖️', color: '#FFD700', category: 'Debate',       reward: 35, weakness: ['structure', 'confidence'] },
  'interview-sim':     { title: 'Interview Simulator',  desc: '6 classic interview questions, 90 seconds each. Scored on word count and structure. The closest thing to the real deal.',                  icon: '💼', color: '#AAFF00', category: 'Interview',    reward: 40, weakness: ['fillers', 'structure', 'clarity'] },
  'memory-chain':      { title: 'Memory Chain',         desc: 'Words flash one by one. Remember them all in order, then type them back. Tests working memory — key for speaking without losing your place.', icon: '🧠', color: '#AAFF00', category: 'Memory',     reward: 25, weakness: ['structure'] },
  'speed-describe':    { title: 'Speed Describe',       desc: 'A concept appears. Describe it in exactly 5 words. 8 seconds per round. Trains conciseness and fast thinking under pressure.',             icon: '💬', color: '#FF3054', category: 'Conciseness',  reward: 30, weakness: ['fillers', 'pace'] },
  'word-association':  { title: 'Word Association',     desc: 'A word appears — type the first related word as fast as possible. 12 rounds. Builds mental agility and natural language flow.',             icon: '🔗', color: '#4488FF', category: 'Agility',      reward: 20, weakness: ['pace'] },
}

function getRecommendedGames(sessions: any[]): string[] {
  if (sessions.length === 0) {
    return ['interview-sim', 'confidence-drill', 'rapid-fire', 'vocab-builder', 'memory-chain']
  }
  const recent = sessions.slice(0, 5)
  const avgFillers = recent.reduce((a: number, s: any) => a + s.fillerCount, 0) / recent.length
  const avgPace = recent.filter((s: any) => s.pace > 0).reduce((a: number, s: any) => a + s.pace, 0) / Math.max(1, recent.filter((s: any) => s.pace > 0).length)
  const avgClarity = recent.reduce((a: number, s: any) => a + s.clarityScore, 0) / recent.length
  const avgDuration = recent.reduce((a: number, s: any) => a + s.duration, 0) / recent.length

  const weaknesses: string[] = []
  if (avgFillers > 5) weaknesses.push('fillers')
  if (avgPace > 175 || (avgPace < 115 && avgPace > 0)) weaknesses.push('pace')
  if (avgClarity < 70) weaknesses.push('clarity')
  if (avgClarity < 60) weaknesses.push('structure')
  if (avgDuration < 45) weaknesses.push('confidence')
  if (weaknesses.length === 0) weaknesses.push('clarity', 'structure')

  const scores: Record<string, number> = {}
  Object.entries(GAMES).forEach(([id, game]) => {
    scores[id] = game.weakness.filter(w => weaknesses.includes(w)).length * 10 + Math.random() * 3
  })

  return Object.entries(scores).sort(([, a], [, b]) => b - a).slice(0, 5).map(([id]) => id)
}

export default function GamesPage() {
  const [tokens, setTokens] = useState(0)
  const [active, setActive] = useState<GameId>('none')
  const [recommended, setRecommended] = useState<string[]>([])
  const [sessions, setSessions] = useState<any[]>([])
  const [bestScores, setBestScores] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'recommended' | 'all'>('recommended')

  useEffect(() => {
    const load = async () => {
      const [bal, userSessions] = await Promise.all([getTokenBalance(), getSessions()])
      setTokens(bal)
      setSessions(userSessions)
      setRecommended(getRecommendedGames(userSessions))
      const scores: Record<string, number> = {}
      await Promise.all(Object.keys(GAMES).map(async id => { scores[id] = await getBestScore(id) }))
      setBestScores(scores)
      setLoading(false)
    }
    load()
  }, [active])

  const handleFinish = async (gameId: string, score: number, tokensEarned: number) => {
    await saveGameScore({ gameId, score, date: new Date().toISOString(), level: 1, tokensEarned })
    const newBal = await addTokens(tokensEarned)
    setTokens(newBal)
    setActive('none')
  }

  const displayGames = filter === 'recommended'
    ? recommended.map(id => [id, GAMES[id]] as [string, GameInfo]).filter(([, g]) => g)
    : Object.entries(GAMES)

  if (active !== 'none') {
    const props = { onBack: () => setActive('none'), onFinish: (s: number, t: number) => handleFinish(active, s, t) }
    if (active === 'filler-catcher')    return <FillerCatcher {...props} />
    if (active === 'pace-trainer')      return <PaceTrainer {...props} />
    if (active === 'vocab-builder')     return <VocabBuilder {...props} />
    if (active === 'confidence-drill')  return <ConfidenceDrill {...props} />
    if (active === 'structure-builder') return <StructureBuilder {...props} />
    if (active === 'tongue-twister')    return <TongueTwister {...props} />
    if (active === 'rapid-fire')        return <RapidFire {...props} />
    if (active === 'story-chain')       return <StoryChain {...props} />
    if (active === 'debate-starter')    return <DebateStarter {...props} />
    if (active === 'interview-sim')     return <InterviewSim {...props} />
    if (active === 'memory-chain')      return <MemoryChain {...props} />
    if (active === 'speed-describe')    return <SpeedDescribe {...props} />
    if (active === 'word-association')  return <WordAssociation {...props} />
  }

  return (
    <>
      <Nav showApp />
      <div className="container-lg">
        <p className="eyebrow anim-slide-up anim-d1">TRAINING ARCADE</p>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '12px' }}>
          <h1 className="font-display anim-slide-up anim-d2" style={{ fontSize: 'clamp(32px,5vw,52px)', fontWeight: 900, letterSpacing: '-.04em' }}>
            Train your weak spots.<br /><span style={{ color: 'var(--accent)' }}>Earn tokens.</span>
          </h1>
          <div style={{ background: 'rgba(170,255,0,.06)', border: '1px solid rgba(170,255,0,.15)', borderRadius: '100px', padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>🪙</span>
            <span className="font-display" style={{ fontSize: '24px', fontWeight: 900, color: 'var(--accent)' }}>
              {tokens >= 999999 ? '∞' : tokens}
            </span>
          </div>
        </div>
        <p className="text-muted anim-slide-up anim-d2" style={{ fontSize: '16px', marginBottom: '32px' }}>
          {sessions.length > 0
            ? `Based on your last ${Math.min(sessions.length, 5)} sessions — here are your personalized picks.`
            : 'Complete a session first to get personalized recommendations.'}
        </p>

        <div className="tab-bar" style={{ marginBottom: '28px', maxWidth: '320px' }}>
          <button className={`tab-btn ${filter === 'recommended' ? 'active' : ''}`} onClick={() => setFilter('recommended')}>✨ For You</button>
          <button className={`tab-btn ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>All Games</button>
        </div>

        {filter === 'recommended' && sessions.length > 0 && (
          <div style={{ background: 'rgba(170,255,0,.04)', border: '1px solid rgba(170,255,0,.12)', borderRadius: '16px', padding: '16px 20px', marginBottom: '24px', display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '24px' }}>🤖</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '4px', color: 'var(--accent)' }}>AI-PERSONALIZED FOR YOU</div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.6 }}>These games target your specific weak spots from recent sessions.</div>
            </div>
          </div>
        )}

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            {[0,1,2,3,4].map(i => <div key={i} className="dash-card shimmer" style={{ height: '220px' }} />)}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px', marginBottom: '48px' }}>
            {displayGames.map(([id, game], i) => {
              const best = bestScores[id] || 0
              const isRec = recommended.includes(id)
              return (
                <div key={id} className="anim-slide-up dash-card" style={{ animationDelay: `${i * 0.06}s`, border: isRec && filter === 'all' ? '1px solid rgba(170,255,0,.25)' : '1px solid var(--border)', position: 'relative', overflow: 'hidden' }}>
                  {isRec && filter === 'all' && (
                    <div style={{ position: 'absolute', top: '12px', right: '12px', fontSize: '10px', fontWeight: 700, color: 'var(--accent)', background: 'rgba(170,255,0,.12)', padding: '2px 8px', borderRadius: '6px' }}>FOR YOU</div>
                  )}
                  <div style={{ fontSize: '36px', marginBottom: '12px' }}>{game.icon}</div>
                  <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '.08em', color: game.color, marginBottom: '6px' }}>{game.category.toUpperCase()}</div>
                  <h2 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '8px' }}>{game.title}</h2>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '16px' }}>{game.desc}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <span style={{ fontSize: '13px', color: 'var(--accent)', fontWeight: 700 }}>+{game.reward} 🪙</span>
                    {best > 0 && <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Best: <strong style={{ color: game.color }}>{best}</strong></span>}
                  </div>
                  <button className="btn btn-primary btn-full" onClick={() => setActive(id as GameId)}>Play →</button>
                </div>
              )
            })}
          </div>
        )}

        <div style={{ background: 'rgba(170,255,0,.04)', border: '1px solid rgba(170,255,0,.12)', borderRadius: '20px', padding: '28px' }}>
          <p style={{ fontSize: '14px', fontWeight: 700, marginBottom: '16px' }}>How to earn tokens 🪙</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
            {[
              { a: 'Complete a recording session', t: '+10–35 🪙' },
              { a: 'High clarity score (80+)', t: '+20 🪙 bonus' },
              { a: 'Zero filler words', t: '+10 🪙 bonus' },
              { a: 'Win arcade games', t: '+20–40 🪙' },
            ].map(r => (
              <div key={r.a} style={{ padding: '14px', background: 'var(--card)', borderRadius: '12px' }}>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '6px' }}>{r.a}</div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--accent)' }}>{r.t}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}

// ── SHARED ────────────────────────────────────────────────────────────────
function GameShell({ title, children, onBack }: { title: string; children: React.ReactNode; onBack: () => void }) {
  return (
    <>
      <Nav rightContent={<button onClick={onBack} className="btn btn-outline btn-sm">← Games</button>} />
      <div className="container" style={{ textAlign: 'center' }}>
        <p className="eyebrow">{title}</p>
        {children}
      </div>
    </>
  )
}

function ScoreScreen({ score, tokensEarned, onReplay, onDone }: { score: number; tokensEarned: number; onReplay: () => void; onDone: () => void }) {
  return (
    <>
      <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏆</div>
      <div className="clarity-hero" style={{ marginBottom: '16px' }}>
        <div className="clarity-num">{score}</div>
        <p className="text-muted" style={{ marginTop: '8px' }}>final score</p>
      </div>
      <div style={{ background: 'rgba(170,255,0,.06)', border: '1px solid rgba(170,255,0,.2)', borderRadius: '12px', padding: '12px 20px', marginBottom: '24px', fontSize: '16px', fontWeight: 700, color: 'var(--accent)' }}>
        +{tokensEarned} tokens earned 🪙
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <button className="btn btn-primary btn-lg" onClick={onReplay}>Play Again</button>
        <button className="btn btn-outline btn-lg" onClick={onDone}>Done →</button>
      </div>
    </>
  )
}

// ── GAME 1: FILLER CATCHER ────────────────────────────────────────────────
const FILLER_SENTENCES = [
  { text: 'I was like basically trying to um explain my point clearly', fillers: ['like', 'basically', 'um'] },
  { text: 'So you know I think we should actually just move forward', fillers: ['So', 'you know', 'actually', 'just'] },
  { text: 'I mean honestly it was kind of a really good presentation', fillers: ['I mean', 'honestly', 'kind of'] },
  { text: 'The project was literally um so basically finished yesterday', fillers: ['literally', 'um', 'basically'] },
  { text: 'Right so I was like trying to you know get the job done', fillers: ['Right', 'like', 'you know'] },
  { text: 'I guess sort of what I am trying to say is this matters', fillers: ['I guess', 'sort of'] },
  { text: 'Well actually the results were um kind of surprising to everyone', fillers: ['Well', 'actually', 'um', 'kind of'] },
  { text: 'So basically I mean we should just um try again tomorrow', fillers: ['basically', 'I mean', 'just', 'um'] },
]

function FillerCatcher({ onBack, onFinish }: { onBack: () => void; onFinish: (s: number, t: number) => void }) {
  const [phase, setPhase] = useState<'intro' | 'playing' | 'done'>('intro')
  const [idx, setIdx] = useState(0)
  const [selected, setSelected] = useState<string[]>([])
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(20)
  const timerRef = useRef<any>(null)
  const idxRef = useRef(0)
  const scoreRef = useRef(0)

  const clearTimer = () => { if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null } }

  const submit = (currentIdx: number, currentSelected: string[]) => {
    clearTimer()
    const current = FILLER_SENTENCES[currentIdx]
    const correctCount = currentSelected.filter(w => current.fillers.some(f => f.toLowerCase() === w.toLowerCase())).length
    const falsePositives = currentSelected.filter(w => !current.fillers.some(f => f.toLowerCase() === w.toLowerCase())).length
    const pts = Math.max(0, (correctCount * 15) - (falsePositives * 8))
    scoreRef.current += pts
    setScore(scoreRef.current)
    const nextIdx = currentIdx + 1
    if (nextIdx >= FILLER_SENTENCES.length) {
      setPhase('done')
    } else {
      idxRef.current = nextIdx
      setIdx(nextIdx)
      setSelected([])
      startRound(nextIdx)
    }
  }

  const startRound = (currentIdx: number) => {
    clearTimer()
    setTimeLeft(20)
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearTimer()
          setSelected(sel => { submit(idxRef.current, sel); return sel })
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const toggleWord = (word: string) => setSelected(prev => prev.includes(word) ? prev.filter(w => w !== word) : [...prev, word])
  useEffect(() => () => clearTimer(), [])

  const current = FILLER_SENTENCES[idx]
  const words = current?.text.split(' ') || []

  return (
    <GameShell title="FILLER CATCHER" onBack={onBack}>
      {phase === 'intro' && (
        <>
          <h2 className="font-display anim-slide-up" style={{ fontSize: 'clamp(26px,4vw,40px)', fontWeight: 900, letterSpacing: '-.04em', marginBottom: '16px' }}>Catch the fillers.</h2>
          <p className="text-muted" style={{ fontSize: '16px', marginBottom: '28px', maxWidth: '480px', margin: '0 auto 28px' }}>
            A sentence appears. Tap every filler word you see. You have 20 seconds per round.
          </p>
          <button className="btn btn-primary btn-lg btn-full" onClick={() => { setPhase('playing'); idxRef.current = 0; scoreRef.current = 0; startRound(0) }}>Start →</button>
        </>
      )}
      {phase === 'playing' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
            <span className="text-muted">{idx + 1}/{FILLER_SENTENCES.length}</span>
            <span className="font-display" style={{ fontSize: '32px', fontWeight: 900, color: timeLeft <= 5 ? 'var(--hot)' : 'var(--text-primary)' }}>{timeLeft}</span>
            <span style={{ color: 'var(--accent)', fontWeight: 700 }}>{score} pts</span>
          </div>
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '20px', padding: '32px', marginBottom: '24px' }}>
            <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '16px', letterSpacing: '.08em' }}>TAP THE FILLER WORDS</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
              {words.map((word, i) => {
                const isSelected = selected.includes(word)
                return (
                  <button key={i} onClick={() => toggleWord(word)} style={{ padding: '8px 14px', borderRadius: '10px', fontSize: '16px', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', transition: 'all .15s', background: isSelected ? 'var(--hot)' : 'var(--card2)', color: isSelected ? 'white' : 'var(--text-primary)', border: `1px solid ${isSelected ? 'var(--hot)' : 'var(--border)'}` }}>
                    {word}
                  </button>
                )
              })}
            </div>
          </div>
          <button className="btn btn-primary btn-lg btn-full" onClick={() => submit(idxRef.current, selected)}>Submit →</button>
        </>
      )}
      {phase === 'done' && (
        <ScoreScreen score={score} tokensEarned={GAMES['filler-catcher'].reward}
          onReplay={() => { setPhase('intro'); setIdx(0); setScore(0); setSelected([]); idxRef.current = 0; scoreRef.current = 0 }}
          onDone={() => onFinish(score, GAMES['filler-catcher'].reward)} />
      )}
    </GameShell>
  )
}

// ── GAME 2: PACE TRAINER ──────────────────────────────────────────────────
const PACE_PASSAGES = [
  'The best public speakers know that silence is powerful. A pause after a key point lets the audience absorb what you said. Most beginners rush because they fear silence. Train yourself to pause on purpose.',
  'Confidence in speaking comes from preparation and repetition. The more you practice a skill, the more automatic it becomes. When something is automatic, you can focus on connection rather than performance.',
  'Great communicators adapt to their audience. They slow down for complex ideas and speed up through transitions. They watch for confusion and adjust in real time. This is the art of reading the room.',
  'Your voice is your most powerful tool. Volume, pitch, pace, and pause — these four elements create emphasis. Master them and you can make any sentence land with impact. Most people only use two.',
]

function PaceTrainer({ onBack, onFinish }: { onBack: () => void; onFinish: (s: number, t: number) => void }) {
  const [phase, setPhase] = useState<'intro' | 'playing' | 'done'>('intro')
  const [idx, setIdx] = useState(0)
  const [score, setScore] = useState(0)
  const [results, setResults] = useState<string[]>([])
  const startTimeRef = useRef(0)

  const passage = PACE_PASSAGES[idx]
  const wordCount = passage.split(' ').length

  const startRound = () => { startTimeRef.current = Date.now() }

  const finishRound = () => {
    const elapsed = (Date.now() - startTimeRef.current) / 1000
    const wpm = Math.round((wordCount / elapsed) * 60)
    const inRange = wpm >= 130 && wpm <= 165
    const pts = inRange ? 40 : Math.max(0, 40 - Math.abs(wpm - 147) / 2)
    setScore(s => s + Math.round(pts))
    setResults(r => [...r, inRange ? `✓ ${wpm} WPM — perfect!` : wpm > 165 ? `⚡ ${wpm} WPM — too fast` : `🐢 ${wpm} WPM — too slow`])
    if (idx + 1 >= PACE_PASSAGES.length) setPhase('done')
    else { setIdx(i => i + 1); setTimeout(startRound, 300) }
  }

  return (
    <GameShell title="PACE TRAINER" onBack={onBack}>
      {phase === 'intro' && (<><h2 className="font-display anim-slide-up" style={{ fontSize: 'clamp(26px,4vw,40px)', fontWeight: 900, letterSpacing: '-.04em', marginBottom: '16px' }}>Hit the sweet spot.</h2><p className="text-muted" style={{ fontSize: '16px', marginBottom: '28px', maxWidth: '480px', margin: '0 auto 28px' }}>Read each passage out loud. Try to hit 130–165 WPM. Press Done when you finish each one.</p><button className="btn btn-primary btn-lg btn-full" onClick={() => { setPhase('playing'); startRound() }}>Start Reading →</button></>)}
      {phase === 'playing' && (<>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          <span className="text-muted">{idx + 1}/{PACE_PASSAGES.length}</span>
          <span style={{ fontSize: '14px', color: 'var(--accent)', fontWeight: 700 }}>Target: 130–165 WPM</span>
        </div>
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '20px', padding: '32px', marginBottom: '20px', textAlign: 'left' }}>
          <p style={{ fontSize: '18px', lineHeight: 1.8 }}>{passage}</p>
        </div>
        <p className="text-muted" style={{ marginBottom: '16px', fontSize: '14px' }}>{wordCount} words — read aloud, then press Done</p>
        <button className="btn btn-primary btn-lg btn-full" onClick={finishRound}>Done Reading →</button>
      </>)}
      {phase === 'done' && (<>
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '20px', marginBottom: '20px' }}>
          {results.map((r, i) => <div key={i} style={{ padding: '8px 0', borderBottom: i < results.length - 1 ? '1px solid var(--border)' : 'none', fontSize: '14px', fontWeight: 600 }}>{r}</div>)}
        </div>
        <ScoreScreen score={score} tokensEarned={GAMES['pace-trainer'].reward}
          onReplay={() => { setPhase('intro'); setIdx(0); setScore(0); setResults([]) }}
          onDone={() => onFinish(score, GAMES['pace-trainer'].reward)} />
      </>)}
    </GameShell>
  )
}

// ── GAME 3: VOCAB BUILDER ─────────────────────────────────────────────────
const VOCAB_CHALLENGES = [
  { weak: 'um... I think...', strong: ['I believe', 'My view is', "I'm convinced"], hint: 'Replace hesitation with conviction' },
  { weak: 'basically just...', strong: ['essentially', 'fundamentally', 'at its core'], hint: 'Replace vague openers with precise words' },
  { weak: 'like really good', strong: ['exceptional', 'outstanding', 'remarkable'], hint: 'Replace weak adjectives with powerful ones' },
  { weak: 'kind of important', strong: ['critical', 'essential', 'pivotal'], hint: 'Commit — remove the hedge' },
  { weak: 'a lot of people', strong: ['the majority', 'a significant portion', 'countless individuals'], hint: 'Quantify rather than vague quantities' },
  { weak: 'I guess maybe', strong: ['arguably', 'potentially', 'I propose'], hint: 'Own your ideas — replace doubt with confidence' },
  { weak: 'thing / stuff', strong: ['concept', 'principle', 'factor'], hint: 'Replace vague nouns with specific ones' },
  { weak: 'make better', strong: ['enhance', 'optimize', 'elevate'], hint: 'Use precise action verbs' },
]

function VocabBuilder({ onBack, onFinish }: { onBack: () => void; onFinish: (s: number, t: number) => void }) {
  const [phase, setPhase] = useState<'intro' | 'playing' | 'done'>('intro')
  const [idx, setIdx] = useState(0)
  const [selected, setSelected] = useState('')
  const [score, setScore] = useState(0)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [shuffled, setShuffled] = useState<string[]>([])

  const current = VOCAB_CHALLENGES[idx]

  useEffect(() => {
    if (current) {
      const wrong = ['basically', 'um... just say it', 'like... you know', 'whatever works']
      const options = [...current.strong.slice(0, 2), wrong[idx % wrong.length]].sort(() => Math.random() - 0.5)
      setShuffled(options)
    }
  }, [idx])

  const submit = (choice: string) => {
    setSelected(choice)
    const isCorrect = current.strong.includes(choice)
    setScore(s => s + (isCorrect ? 20 : 0))
    setFeedback(isCorrect ? `✓ "${choice}" is strong and clear.` : `✗ Better: ${current.strong[0]} or ${current.strong[1]}`)
    setTimeout(() => {
      setFeedback(null); setSelected('')
      if (idx + 1 >= VOCAB_CHALLENGES.length) setPhase('done')
      else setIdx(i => i + 1)
    }, 1800)
  }

  return (
    <GameShell title="VOCAB BUILDER" onBack={onBack}>
      {phase === 'intro' && (<><h2 className="font-display anim-slide-up" style={{ fontSize: 'clamp(26px,4vw,40px)', fontWeight: 900, letterSpacing: '-.04em', marginBottom: '16px' }}>Level up your words.</h2><p className="text-muted" style={{ fontSize: '16px', marginBottom: '28px', maxWidth: '480px', margin: '0 auto 28px' }}>Weak phrases appear. Pick the strongest replacement.</p><button className="btn btn-primary btn-lg btn-full" onClick={() => setPhase('playing')}>Start →</button></>)}
      {phase === 'playing' && (<>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
          <span className="text-muted">{idx + 1}/{VOCAB_CHALLENGES.length}</span>
          <span style={{ color: 'var(--accent)', fontWeight: 700 }}>{score} pts</span>
        </div>
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '20px', padding: '28px', marginBottom: '20px' }}>
          <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--hot)', marginBottom: '12px', letterSpacing: '.08em' }}>WEAK PHRASE — REPLACE IT:</p>
          <p style={{ fontSize: 'clamp(18px,3vw,26px)', fontWeight: 700, color: 'var(--hot)', marginBottom: '12px' }}>"{current.weak}"</p>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>💡 {current.hint}</p>
        </div>
        {feedback && <div style={{ background: feedback.startsWith('✓') ? 'rgba(170,255,0,.08)' : 'rgba(255,48,84,.08)', border: `1px solid ${feedback.startsWith('✓') ? 'rgba(170,255,0,.2)' : 'rgba(255,48,84,.2)'}`, borderRadius: '12px', padding: '12px 16px', marginBottom: '16px', fontSize: '14px', fontWeight: 600, color: feedback.startsWith('✓') ? 'var(--accent)' : 'var(--hot)' }}>{feedback}</div>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {shuffled.map((opt, i) => (
            <button key={i} onClick={() => !selected && submit(opt)} style={{ padding: '16px 20px', borderRadius: '14px', fontSize: '15px', fontWeight: 600, cursor: selected ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-body)', background: selected === opt ? (current.strong.includes(opt) ? 'rgba(170,255,0,.12)' : 'rgba(255,48,84,.12)') : 'var(--card)', border: `1px solid ${selected === opt ? (current.strong.includes(opt) ? 'rgba(170,255,0,.3)' : 'rgba(255,48,84,.3)') : 'var(--border)'}`, color: 'var(--text-primary)', transition: 'all .15s', textAlign: 'left' }}>{opt}</button>
          ))}
        </div>
      </>)}
      {phase === 'done' && <ScoreScreen score={score} tokensEarned={GAMES['vocab-builder'].reward} onReplay={() => { setPhase('intro'); setIdx(0); setScore(0) }} onDone={() => onFinish(score, GAMES['vocab-builder'].reward)} />}
    </GameShell>
  )
}

// ── GAME 4: CONFIDENCE DRILL ──────────────────────────────────────────────
const CONFIDENCE_PROMPTS = [
  "What's one thing you're genuinely great at?",
  'Describe yourself in three words and explain each one.',
  'What would you tell your younger self?',
  "What's a problem you've solved that you're proud of?",
  'Explain why someone should listen to you.',
  "What's your strongest quality in a team setting?",
  'Tell me the most interesting thing about you.',
  'Why are you the right person for this opportunity?',
]

function ConfidenceDrill({ onBack, onFinish }: { onBack: () => void; onFinish: (s: number, t: number) => void }) {
  const [phase, setPhase] = useState<'intro' | 'playing' | 'rating' | 'done'>('intro')
  const [idx, setIdx] = useState(0)
  const [timeLeft, setTimeLeft] = useState(60)
  const [score, setScore] = useState(0)
  const timerRef = useRef<any>(null)

  const clearTimer = () => { if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null } }

  const startRound = () => {
    clearTimer()
    setTimeLeft(60)
    timerRef.current = setInterval(() => {
      setTimeLeft(t => { if (t <= 1) { clearTimer(); setPhase('rating'); return 0 } return t - 1 })
    }, 1000)
  }

  const rate = (r: number) => {
    setScore(s => s + r * 15)
    if (idx + 1 >= CONFIDENCE_PROMPTS.length) setPhase('done')
    else { setIdx(i => i + 1); setPhase('playing'); setTimeout(startRound, 300) }
  }

  useEffect(() => () => clearTimer(), [])

  return (
    <GameShell title="CONFIDENCE DRILL" onBack={onBack}>
      {phase === 'intro' && (<><h2 className="font-display anim-slide-up" style={{ fontSize: 'clamp(26px,4vw,40px)', fontWeight: 900, letterSpacing: '-.04em', marginBottom: '16px' }}>No overthinking.</h2><p className="text-muted" style={{ fontSize: '16px', marginBottom: '28px', maxWidth: '480px', margin: '0 auto 28px' }}>A prompt appears. Answer immediately and confidently out loud. 60 seconds per prompt. Rate yourself after each one.</p><button className="btn btn-primary btn-lg btn-full" onClick={() => { setPhase('playing'); startRound() }}>Start →</button></>)}
      {phase === 'playing' && (<>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
          <span className="text-muted">{idx + 1}/{CONFIDENCE_PROMPTS.length}</span>
          <span className="font-display" style={{ fontSize: '40px', fontWeight: 900, color: timeLeft <= 15 ? 'var(--hot)' : 'var(--accent)' }}>{timeLeft}</span>
          <span style={{ color: 'var(--accent)', fontWeight: 700 }}>{score} pts</span>
        </div>
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '20px', padding: '48px 32px', marginBottom: '24px' }}>
          <p style={{ fontSize: 'clamp(18px,3vw,26px)', fontWeight: 700, lineHeight: 1.4 }}>"{CONFIDENCE_PROMPTS[idx]}"</p>
        </div>
        <p className="text-muted" style={{ fontSize: '14px' }}>Answer out loud — bold and direct</p>
        <button className="btn btn-outline btn-md" style={{ marginTop: '16px' }} onClick={() => { clearTimer(); setPhase('rating') }}>Done Answering →</button>
      </>)}
      {phase === 'rating' && (<>
        <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>How confident did you sound?</h3>
        <p className="text-muted" style={{ marginBottom: '24px' }}>Be honest with yourself.</p>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
          {[{ r: 1, l: 'Hesitant', c: 'var(--hot)' }, { r: 2, l: 'Okay', c: 'var(--amber)' }, { r: 3, l: 'Good', c: '#88BB44' }, { r: 4, l: 'Strong', c: 'var(--accent)' }, { r: 5, l: 'Nailed it', c: 'var(--accent)' }].map(({ r, l, c }) => (
            <button key={r} onClick={() => rate(r)} style={{ padding: '16px 20px', borderRadius: '14px', border: `1px solid ${c}`, background: 'transparent', color: c, fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>{r} — {l}</button>
          ))}
        </div>
      </>)}
      {phase === 'done' && <ScoreScreen score={score} tokensEarned={GAMES['confidence-drill'].reward} onReplay={() => { setPhase('intro'); setIdx(0); setScore(0) }} onDone={() => onFinish(score, GAMES['confidence-drill'].reward)} />}
    </GameShell>
  )
}

// ── GAME 5: STRUCTURE BUILDER ─────────────────────────────────────────────
const STRUCTURE_SETS = [
  { sentences: ['Therefore, you should consider adopting this approach immediately.', 'The evidence clearly supports this conclusion.', 'Studies show that practice improves performance by 40 percent.', 'Public speaking is a learnable skill, not a natural talent.'], correct: [3, 2, 1, 0] },
  { sentences: ['This single change can dramatically improve your clarity score.', 'Filler words are the number one enemy of confident speech.', 'Replace every "um" with a one-second pause instead.', 'You will sound more confident and your listeners will trust you more.'], correct: [1, 2, 0, 3] },
  { sentences: ['The result was a standing ovation from the entire audience.', 'She practiced her speech every day for two weeks.', 'On the day of the presentation, she was ready.', 'She started by identifying her three main points.'], correct: [1, 3, 2, 0] },
]

function StructureBuilder({ onBack, onFinish }: { onBack: () => void; onFinish: (s: number, t: number) => void }) {
  const [phase, setPhase] = useState<'intro' | 'playing' | 'done'>('intro')
  const [idx, setIdx] = useState(0)
  const [order, setOrder] = useState<number[]>([])
  const [score, setScore] = useState(0)
  const [feedback, setFeedback] = useState<string | null>(null)

  useEffect(() => {
    if (STRUCTURE_SETS[idx]) setOrder([...Array(STRUCTURE_SETS[idx].sentences.length).keys()].sort(() => Math.random() - 0.5))
  }, [idx])

  const moveUp = (i: number) => { if (i === 0) return; const n = [...order]; [n[i-1], n[i]] = [n[i], n[i-1]]; setOrder(n) }
  const moveDown = (i: number) => { if (i === order.length - 1) return; const n = [...order]; [n[i], n[i+1]] = [n[i+1], n[i]]; setOrder(n) }

  const submit = () => {
    const current = STRUCTURE_SETS[idx]
    let pts = 0
    order.forEach((sentIdx, pos) => { if (current.correct[pos] === sentIdx) pts += 20 })
    setScore(s => s + pts)
    const perfect = pts === current.sentences.length * 20
    setFeedback(perfect ? '🎉 Perfect order!' : `✓ ${pts / 20}/${current.sentences.length} correct`)
    setTimeout(() => {
      setFeedback(null)
      if (idx + 1 >= STRUCTURE_SETS.length) setPhase('done')
      else setIdx(i => i + 1)
    }, 2000)
  }

  const current = STRUCTURE_SETS[idx]

  return (
    <GameShell title="STRUCTURE BUILDER" onBack={onBack}>
      {phase === 'intro' && (<><h2 className="font-display anim-slide-up" style={{ fontSize: 'clamp(26px,4vw,40px)', fontWeight: 900, letterSpacing: '-.04em', marginBottom: '16px' }}>Order the argument.</h2><p className="text-muted" style={{ fontSize: '16px', marginBottom: '28px', maxWidth: '480px', margin: '0 auto 28px' }}>Sentences are scrambled. Use arrows to put them in logical order.</p><button className="btn btn-primary btn-lg btn-full" onClick={() => setPhase('playing')}>Start →</button></>)}
      {phase === 'playing' && current && (<>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
          <span className="text-muted">{idx + 1}/{STRUCTURE_SETS.length}</span>
          <span style={{ color: 'var(--accent)', fontWeight: 700 }}>{score} pts</span>
        </div>
        {feedback && <div style={{ background: 'rgba(170,255,0,.08)', border: '1px solid rgba(170,255,0,.2)', borderRadius: '12px', padding: '12px', marginBottom: '16px', fontSize: '14px', fontWeight: 700, color: 'var(--accent)' }}>{feedback}</div>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px', textAlign: 'left' }}>
          {order.map((sentIdx, pos) => (
            <div key={sentIdx} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '14px', padding: '14px 16px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent)', width: '20px' }}>{pos + 1}</span>
              <span style={{ flex: 1, fontSize: '14px', lineHeight: 1.5 }}>{current.sentences[sentIdx]}</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <button onClick={() => moveUp(pos)} style={{ background: 'var(--card2)', border: '1px solid var(--border)', borderRadius: '6px', padding: '2px 8px', cursor: pos === 0 ? 'not-allowed' : 'pointer', opacity: pos === 0 ? 0.3 : 1 }}>▲</button>
                <button onClick={() => moveDown(pos)} style={{ background: 'var(--card2)', border: '1px solid var(--border)', borderRadius: '6px', padding: '2px 8px', cursor: pos === order.length - 1 ? 'not-allowed' : 'pointer', opacity: pos === order.length - 1 ? 0.3 : 1 }}>▼</button>
              </div>
            </div>
          ))}
        </div>
        <button className="btn btn-primary btn-lg btn-full" onClick={submit}>Check Order →</button>
      </>)}
      {phase === 'done' && <ScoreScreen score={score} tokensEarned={GAMES['structure-builder'].reward} onReplay={() => { setPhase('intro'); setIdx(0); setScore(0) }} onDone={() => onFinish(score, GAMES['structure-builder'].reward)} />}
    </GameShell>
  )
}

// ── GAME 6: TONGUE TWISTER ────────────────────────────────────────────────
const TWISTERS = [
  { text: 'She sells seashells by the seashore. The shells she sells are surely seashells.', difficulty: 'Medium' },
  { text: 'How much wood would a woodchuck chuck if a woodchuck could chuck wood?', difficulty: 'Easy' },
  { text: 'Peter Piper picked a peck of pickled peppers. A peck of pickled peppers Peter Piper picked.', difficulty: 'Medium' },
  { text: 'Red lorry, yellow lorry, red lorry, yellow lorry, red lorry, yellow lorry.', difficulty: 'Hard' },
  { text: 'Unique New York, unique New York, you know you need unique New York.', difficulty: 'Hard' },
  { text: 'The thirty-three thieves thought that they thrilled the throne throughout Thursday.', difficulty: 'Hard' },
]

function TongueTwister({ onBack, onFinish }: { onBack: () => void; onFinish: (s: number, t: number) => void }) {
  const [phase, setPhase] = useState<'intro' | 'playing' | 'rating' | 'done'>('intro')
  const [idx, setIdx] = useState(0)
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(35)
  const timerRef = useRef<any>(null)
  const clearTimer = () => { if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null } }

  const startRound = () => {
    clearTimer()
    setTimeLeft(35)
    timerRef.current = setInterval(() => {
      setTimeLeft(t => { if (t <= 1) { clearTimer(); setPhase('rating'); return 0 } return t - 1 })
    }, 1000)
  }

  const rate = (r: number) => {
    const current = TWISTERS[idx]
    const diffBonus = current.difficulty === 'Hard' ? 15 : current.difficulty === 'Medium' ? 10 : 5
    setScore(s => s + r * 10 + diffBonus)
    if (idx + 1 >= TWISTERS.length) setPhase('done')
    else { setIdx(i => i + 1); setPhase('playing'); setTimeout(startRound, 300) }
  }

  useEffect(() => () => clearTimer(), [])
  const current = TWISTERS[idx]

  return (
    <GameShell title="PRONUNCIATION PRO" onBack={onBack}>
      {phase === 'intro' && (<><h2 className="font-display anim-slide-up" style={{ fontSize: 'clamp(26px,4vw,40px)', fontWeight: 900, letterSpacing: '-.04em', marginBottom: '16px' }}>Say it perfectly.</h2><p className="text-muted" style={{ fontSize: '16px', marginBottom: '28px', maxWidth: '480px', margin: '0 auto 28px' }}>Read each tongue twister out loud as fast and clearly as you can. 35 seconds per round.</p><button className="btn btn-primary btn-lg btn-full" onClick={() => { setPhase('playing'); startRound() }}>Start →</button></>)}
      {phase === 'playing' && (<>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
          <span className="text-muted">{idx + 1}/{TWISTERS.length}</span>
          <span className="font-display" style={{ fontSize: '40px', fontWeight: 900, color: timeLeft <= 10 ? 'var(--hot)' : 'var(--accent)' }}>{timeLeft}</span>
          <span style={{ fontSize: '12px', padding: '4px 10px', borderRadius: '8px', background: current.difficulty === 'Hard' ? 'rgba(255,48,84,.1)' : current.difficulty === 'Medium' ? 'rgba(255,184,0,.1)' : 'rgba(170,255,0,.1)', color: current.difficulty === 'Hard' ? 'var(--hot)' : current.difficulty === 'Medium' ? 'var(--amber)' : 'var(--accent)', fontWeight: 700 }}>{current.difficulty}</span>
        </div>
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '20px', padding: '40px 28px', marginBottom: '24px' }}>
          <p style={{ fontSize: 'clamp(16px,2.5vw,22px)', fontWeight: 700, lineHeight: 1.6 }}>{current.text}</p>
        </div>
        <p className="text-muted" style={{ marginBottom: '16px' }}>Repeat until timer runs out</p>
        <button className="btn btn-outline btn-md" onClick={() => { clearTimer(); setPhase('rating') }}>Done →</button>
      </>)}
      {phase === 'rating' && (<>
        <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '24px' }}>How was your pronunciation?</h3>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
          {[{ r: 1, l: 'Stumbled' }, { r: 2, l: 'Okay' }, { r: 3, l: 'Solid' }, { r: 4, l: 'Clean' }, { r: 5, l: 'Flawless' }].map(({ r, l }) => (
            <button key={r} onClick={() => rate(r)} className="btn btn-outline" style={{ padding: '12px 18px' }}>{r} — {l}</button>
          ))}
        </div>
      </>)}
      {phase === 'done' && <ScoreScreen score={score} tokensEarned={GAMES['tongue-twister'].reward} onReplay={() => { setPhase('intro'); setIdx(0); setScore(0) }} onDone={() => onFinish(score, GAMES['tongue-twister'].reward)} />}
    </GameShell>
  )
}

// ── GAME 7: RAPID FIRE (FIXED) ────────────────────────────────────────────
const RAPID_QUESTIONS = [
  "What's your biggest strength?", 'Describe a challenge you overcame.', 'Why should I pick you?',
  'What do you do when you disagree with someone?', 'Tell me something surprising about you.',
  'How do you handle pressure?', 'What motivates you to work hard?', "What's your favorite subject and why?",
  'Describe your leadership style.', 'What would your best friend say about you?',
  'How do you learn best?', "What's a goal you're currently working toward?",
]

function RapidFire({ onBack, onFinish }: { onBack: () => void; onFinish: (s: number, t: number) => void }) {
  const [phase, setPhase] = useState<'intro' | 'playing' | 'done'>('intro')
  const [idx, setIdx] = useState(0)
  const [answer, setAnswer] = useState('')
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(60)
  const [answers, setAnswers] = useState<{ q: string; a: string; pts: number }[]>([])
  const timerRef = useRef<any>(null)
  const questionsRef = useRef<string[]>([])
  const idxRef = useRef(0)
  const scoreRef = useRef(0)
  const answerRef = useRef('')

  const clearTimer = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
  }

  const submitAnswer = (currentIdx: number, ans: string) => {
    clearTimer()
    const words = ans.trim().split(/\s+/).filter(Boolean).length
    const pts = Math.min(30, Math.max(0, words * 2))
    scoreRef.current += pts
    setScore(scoreRef.current)
    setAnswers(prev => [...prev, { q: questionsRef.current[currentIdx], a: ans || '(no answer)', pts }])
    const nextIdx = currentIdx + 1
    if (nextIdx >= questionsRef.current.length) {
      setPhase('done')
    } else {
      idxRef.current = nextIdx
      setIdx(nextIdx)
      answerRef.current = ''
      setAnswer('')
      setTimeout(() => startRound(nextIdx), 400)
    }
  }

  const startRound = (currentIdx: number) => {
    clearTimer()
    setTimeLeft(60)
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearTimer()
          submitAnswer(idxRef.current, answerRef.current)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const handleStart = () => {
    questionsRef.current = [...RAPID_QUESTIONS].sort(() => Math.random() - 0.5).slice(0, 8)
    idxRef.current = 0
    scoreRef.current = 0
    answerRef.current = ''
    setPhase('playing')
    setIdx(0)
    setScore(0)
    setAnswers([])
    setAnswer('')
    setTimeout(() => startRound(0), 100)
  }

  useEffect(() => () => clearTimer(), [])

  const questions = questionsRef.current

  return (
    <GameShell title="Q&A RAPID FIRE" onBack={onBack}>
      {phase === 'intro' && (
        <>
          <h2 className="font-display anim-slide-up" style={{ fontSize: 'clamp(26px,4vw,40px)', fontWeight: 900, letterSpacing: '-.04em', marginBottom: '16px' }}>No hesitation.</h2>
          <p className="text-muted" style={{ fontSize: '16px', marginBottom: '28px', maxWidth: '480px', margin: '0 auto 28px' }}>
            8 questions, 60 seconds each. Type your answer fast. More words = more points.
          </p>
          <button className="btn btn-primary btn-lg btn-full" onClick={handleStart}>Start →</button>
        </>
      )}
      {phase === 'playing' && questions.length > 0 && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <span className="text-muted">{idx + 1}/8</span>
            <span className="font-display" style={{ fontSize: '40px', fontWeight: 900, color: timeLeft <= 15 ? 'var(--hot)' : 'var(--accent)' }}>{timeLeft}</span>
            <span style={{ color: 'var(--accent)', fontWeight: 700 }}>{score} pts</span>
          </div>
          <div style={{ marginBottom: '16px' }}>
            <div className="prog-track">
              <div className="prog-fill" style={{ background: timeLeft <= 15 ? 'var(--hot)' : 'var(--accent)', width: `${(timeLeft / 60) * 100}%`, transition: 'width 1s linear' }} />
            </div>
          </div>
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '20px', padding: '32px', marginBottom: '20px' }}>
            <p style={{ fontSize: 'clamp(16px,2.5vw,22px)', fontWeight: 700 }}>{questions[idx]}</p>
          </div>
          <textarea
            value={answer}
            onChange={e => { setAnswer(e.target.value); answerRef.current = e.target.value }}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitAnswer(idxRef.current, answerRef.current) } }}
            placeholder="Type your answer... (Enter to submit)"
            autoFocus
            style={{ width: '100%', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '14px', padding: '16px', color: 'var(--text-primary)', fontFamily: 'var(--font-body)', fontSize: '15px', resize: 'none', minHeight: '100px', outline: 'none', marginBottom: '8px' }}
          />
          <p className="text-muted" style={{ fontSize: '12px', marginBottom: '12px' }}>
            {answer.trim().split(/\s+/).filter(Boolean).length} words
          </p>
          <button className="btn btn-primary btn-lg btn-full" onClick={() => submitAnswer(idxRef.current, answerRef.current)}>
            Submit →
          </button>
        </>
      )}
      {phase === 'done' && (
        <>
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '16px', marginBottom: '20px', textAlign: 'left', maxHeight: '240px', overflow: 'auto' }}>
            {answers.map((a, i) => (
              <div key={i} style={{ borderBottom: i < answers.length - 1 ? '1px solid var(--border)' : 'none', padding: '10px 0' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '2px' }}>{a.q}</div>
                <div style={{ fontSize: '13px', fontStyle: 'italic', marginBottom: '2px' }}>"{a.a}"</div>
                <div style={{ fontSize: '11px', color: 'var(--accent)', fontWeight: 700 }}>+{a.pts} pts</div>
              </div>
            ))}
          </div>
          <ScoreScreen
            score={score}
            tokensEarned={GAMES['rapid-fire'].reward}
            onReplay={handleStart}
            onDone={() => onFinish(score, GAMES['rapid-fire'].reward)}
          />
        </>
      )}
    </GameShell>
  )
}

// ── GAME 8: STORY CHAIN ───────────────────────────────────────────────────
const STORY_STARTERS = [
  'It was the day of the biggest presentation of my life, and',
  'Nobody believed I could do it, but I decided to',
  'The microphone cut out right in the middle of my speech, so',
  'She had practiced for weeks. When the moment came,',
]

function StoryChain({ onBack, onFinish }: { onBack: () => void; onFinish: (s: number, t: number) => void }) {
  const [phase, setPhase] = useState<'intro' | 'playing' | 'done'>('intro')
  const [story, setStory] = useState<string[]>([])
  const [input, setInput] = useState('')
  const [score, setScore] = useState(0)
  const [round, setRound] = useState(0)
  const starterRef = useRef(STORY_STARTERS[Math.floor(Math.random() * STORY_STARTERS.length)])
  const MAX_ROUNDS = 6

  const submit = () => {
    const words = input.trim().split(/\s+/).filter(Boolean).length
    if (words < 5) return
    setScore(s => s + Math.min(25, words * 2))
    setStory(prev => [...prev, input.trim()])
    setInput('')
    if (round + 1 >= MAX_ROUNDS) setPhase('done')
    else setRound(r => r + 1)
  }

  return (
    <GameShell title="STORY CHAIN" onBack={onBack}>
      {phase === 'intro' && (<><h2 className="font-display anim-slide-up" style={{ fontSize: 'clamp(26px,4vw,40px)', fontWeight: 900, letterSpacing: '-.04em', marginBottom: '16px' }}>Build the story.</h2><p className="text-muted" style={{ fontSize: '16px', marginBottom: '28px', maxWidth: '480px', margin: '0 auto 28px' }}>Continue the story one sentence at a time. Each must connect logically. Min 5 words. 6 rounds.</p><button className="btn btn-primary btn-lg btn-full" onClick={() => setPhase('playing')}>Start →</button></>)}
      {phase === 'playing' && (<>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
          <span className="text-muted">Sentence {round + 1}/{MAX_ROUNDS}</span>
          <span style={{ color: 'var(--accent)', fontWeight: 700 }}>{score} pts</span>
        </div>
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '20px', padding: '24px', marginBottom: '20px', textAlign: 'left', maxHeight: '180px', overflow: 'auto' }}>
          <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent)', marginBottom: '8px' }}>STORY SO FAR:</p>
          <p style={{ fontSize: '15px', lineHeight: 1.7, fontStyle: 'italic' }}>{starterRef.current} {story.join(' ')}</p>
        </div>
        <textarea value={input} onChange={e => setInput(e.target.value)} placeholder="Continue the story..." autoFocus style={{ width: '100%', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '14px', padding: '16px', color: 'var(--text-primary)', fontFamily: 'var(--font-body)', fontSize: '15px', resize: 'none', minHeight: '80px', outline: 'none', marginBottom: '8px' }} />
        <p className="text-muted" style={{ fontSize: '12px', marginBottom: '12px' }}>{input.trim().split(/\s+/).filter(Boolean).length} words (min 5)</p>
        <button className="btn btn-primary btn-lg btn-full" onClick={submit} disabled={input.trim().split(/\s+/).filter(Boolean).length < 5}>Next Sentence →</button>
      </>)}
      {phase === 'done' && (<>
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '20px', marginBottom: '20px', textAlign: 'left' }}>
          <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent)', marginBottom: '10px' }}>YOUR STORY:</p>
          <p style={{ fontSize: '14px', lineHeight: 1.8, fontStyle: 'italic' }}>{starterRef.current} {story.join(' ')}</p>
        </div>
        <ScoreScreen score={score} tokensEarned={GAMES['story-chain'].reward} onReplay={() => { setPhase('intro'); setStory([]); setRound(0); setScore(0) }} onDone={() => onFinish(score, GAMES['story-chain'].reward)} />
      </>)}
    </GameShell>
  )
}

// ── GAME 9: DEBATE STARTER ────────────────────────────────────────────────
const DEBATE_TOPICS = [
  { topic: 'Social media does more harm than good for teenagers.', side: 'AGREE' },
  { topic: 'Homework should be optional in high school.', side: 'DISAGREE' },
  { topic: 'Public speaking should be required in every school.', side: 'AGREE' },
  { topic: 'AI will replace most jobs in the next 20 years.', side: 'DISAGREE' },
  { topic: 'Athletes are paid too much compared to teachers.', side: 'AGREE' },
]

function DebateStarter({ onBack, onFinish }: { onBack: () => void; onFinish: (s: number, t: number) => void }) {
  const [phase, setPhase] = useState<'intro' | 'prep' | 'playing' | 'rating' | 'done'>('intro')
  const [idx, setIdx] = useState(0)
  const [points, setPoints] = useState(['', '', ''])
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(90)
  const timerRef = useRef<any>(null)
  const clearTimer = () => { if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null } }
  const current = DEBATE_TOPICS[idx]

  const startDebate = () => {
    setPhase('playing')
    clearTimer()
    setTimeLeft(90)
    timerRef.current = setInterval(() => {
      setTimeLeft(t => { if (t <= 1) { clearTimer(); setPhase('rating'); return 0 } return t - 1 })
    }, 1000)
  }

  const rate = (r: number) => {
    const filledPoints = points.filter(p => p.trim().length > 0).length
    setScore(s => s + (r * 15) + (filledPoints * 10))
    if (idx + 1 >= DEBATE_TOPICS.length) setPhase('done')
    else { setIdx(i => i + 1); setPoints(['', '', '']); setPhase('prep') }
  }

  useEffect(() => () => clearTimer(), [])

  return (
    <GameShell title="DEBATE STARTER" onBack={onBack}>
      {phase === 'intro' && (<><h2 className="font-display anim-slide-up" style={{ fontSize: 'clamp(26px,4vw,40px)', fontWeight: 900, letterSpacing: '-.04em', marginBottom: '16px' }}>Argue your point.</h2><p className="text-muted" style={{ fontSize: '16px', marginBottom: '28px', maxWidth: '480px', margin: '0 auto 28px' }}>Topic + side. Plan 3 points, then deliver in 90 seconds.</p><button className="btn btn-primary btn-lg btn-full" onClick={() => setPhase('prep')}>Start →</button></>)}
      {phase === 'prep' && (<>
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '20px', padding: '24px', marginBottom: '20px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: current.side === 'AGREE' ? 'var(--accent)' : 'var(--hot)', marginBottom: '8px', letterSpacing: '.08em' }}>YOUR SIDE: {current.side}</div>
          <p style={{ fontSize: '18px', fontWeight: 700 }}>"{current.topic}"</p>
        </div>
        <p style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>Write your 3 strongest points:</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px', textAlign: 'left' }}>
          {points.map((p, i) => (
            <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <span style={{ color: 'var(--accent)', fontWeight: 700, width: '20px', flexShrink: 0 }}>{i + 1}.</span>
              <input className="input" placeholder={`Point ${i + 1}...`} value={p} onChange={e => { const n = [...points]; n[i] = e.target.value; setPoints(n) }} />
            </div>
          ))}
        </div>
        <button className="btn btn-primary btn-lg btn-full" onClick={startDebate}>Start 90-Second Argument →</button>
      </>)}
      {phase === 'playing' && (<>
        <div className="font-display" style={{ fontSize: '56px', fontWeight: 900, color: timeLeft <= 20 ? 'var(--hot)' : 'var(--accent)', marginBottom: '16px' }}>{timeLeft}s</div>
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '20px', padding: '24px', marginBottom: '16px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent)', marginBottom: '8px' }}>YOUR POSITION:</div>
          <p style={{ fontSize: '16px', fontWeight: 700, marginBottom: '12px' }}>{current.side} — "{current.topic}"</p>
          <div style={{ textAlign: 'left' }}>{points.filter(p => p.trim()).map((p, i) => <div key={i} style={{ display: 'flex', gap: '10px', marginBottom: '6px', fontSize: '14px' }}><span style={{ color: 'var(--accent)', fontWeight: 700 }}>{i + 1}.</span><span>{p}</span></div>)}</div>
        </div>
        <button className="btn btn-outline btn-md" onClick={() => { clearTimer(); setPhase('rating') }}>Done →</button>
      </>)}
      {phase === 'rating' && (<>
        <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '24px' }}>How was your argument?</h3>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
          {[{ r: 1, l: 'Weak' }, { r: 2, l: 'Okay' }, { r: 3, l: 'Solid' }, { r: 4, l: 'Convincing' }, { r: 5, l: 'Debate club' }].map(({ r, l }) => (
            <button key={r} onClick={() => rate(r)} className="btn btn-outline" style={{ padding: '12px 18px' }}>{r} — {l}</button>
          ))}
        </div>
      </>)}
      {phase === 'done' && <ScoreScreen score={score} tokensEarned={GAMES['debate-starter'].reward} onReplay={() => { setPhase('intro'); setIdx(0); setScore(0); setPoints(['', '', '']) }} onDone={() => onFinish(score, GAMES['debate-starter'].reward)} />}
    </GameShell>
  )
}

// ── GAME 10: INTERVIEW SIMULATOR ──────────────────────────────────────────
const INTERVIEW_QS = [
  { q: 'Tell me about yourself.', tip: 'Use: present → past → future structure' },
  { q: "What's your greatest weakness?", tip: 'Pick a real weakness and show how you\'re fixing it' },
  { q: 'Describe a time you failed and what you learned.', tip: 'Be specific — what happened, what you did, what changed' },
  { q: 'Why do you want this position?', tip: 'Connect your skills to what they need' },
  { q: 'Where do you see yourself in 5 years?', tip: 'Show ambition + alignment with the role' },
  { q: 'Tell me about a time you showed leadership.', tip: 'Use a specific story with a clear outcome' },
]

function InterviewSim({ onBack, onFinish }: { onBack: () => void; onFinish: (s: number, t: number) => void }) {
  const [phase, setPhase] = useState<'intro' | 'playing' | 'done'>('intro')
  const [idx, setIdx] = useState(0)
  const [answer, setAnswer] = useState('')
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(90)
  const [results, setResults] = useState<{ q: string; words: number; pts: number }[]>([])
  const timerRef = useRef<any>(null)
  const idxRef = useRef(0)
  const scoreRef = useRef(0)
  const answerRef = useRef('')

  const clearTimer = () => { if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null } }

  const submitAnswer = (currentIdx: number, ans: string) => {
    clearTimer()
    const words = ans.trim().split(/\s+/).filter(Boolean).length
    const wordScore = words >= 60 && words <= 150 ? 40 : words >= 30 ? 25 : Math.max(5, words)
    const fillerPenalty = (ans.toLowerCase().match(/\bum\b|\buh\b|\blike\b/g) || []).length
    const pts = Math.max(5, wordScore - fillerPenalty * 3)
    scoreRef.current += pts
    setScore(scoreRef.current)
    setResults(r => [...r, { q: INTERVIEW_QS[currentIdx].q, words, pts }])
    const nextIdx = currentIdx + 1
    if (nextIdx >= INTERVIEW_QS.length) {
      setPhase('done')
    } else {
      idxRef.current = nextIdx
      setIdx(nextIdx)
      answerRef.current = ''
      setAnswer('')
      setTimeout(() => startRound(nextIdx), 400)
    }
  }

  const startRound = (currentIdx: number) => {
    clearTimer()
    setTimeLeft(90)
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { clearTimer(); submitAnswer(idxRef.current, answerRef.current); return 0 }
        return prev - 1
      })
    }, 1000)
  }

  const handleStart = () => {
    idxRef.current = 0; scoreRef.current = 0; answerRef.current = ''
    setPhase('playing'); setIdx(0); setScore(0); setResults([]); setAnswer('')
    setTimeout(() => startRound(0), 100)
  }

  useEffect(() => () => clearTimer(), [])
  const current = INTERVIEW_QS[idx]

  return (
    <GameShell title="INTERVIEW SIMULATOR" onBack={onBack}>
      {phase === 'intro' && (<><h2 className="font-display anim-slide-up" style={{ fontSize: 'clamp(26px,4vw,40px)', fontWeight: 900, letterSpacing: '-.04em', marginBottom: '16px' }}>The real deal.</h2><p className="text-muted" style={{ fontSize: '16px', marginBottom: '28px', maxWidth: '480px', margin: '0 auto 28px' }}>6 classic interview questions, 90 seconds each. Type your answer as if speaking. Scored on word count and structure.</p><button className="btn btn-primary btn-lg btn-full" onClick={handleStart}>Start Interview →</button></>)}
      {phase === 'playing' && current && (<>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
          <span className="text-muted">Q{idx + 1}/{INTERVIEW_QS.length}</span>
          <span className="font-display" style={{ fontSize: '36px', fontWeight: 900, color: timeLeft <= 20 ? 'var(--hot)' : 'var(--accent)' }}>{timeLeft}s</span>
          <span style={{ color: 'var(--accent)', fontWeight: 700 }}>{score} pts</span>
        </div>
        <div style={{ marginBottom: '16px' }}>
          <div className="prog-track"><div className="prog-fill" style={{ background: timeLeft <= 20 ? 'var(--hot)' : 'var(--accent)', width: `${(timeLeft / 90) * 100}%`, transition: 'width 1s linear' }} /></div>
        </div>
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '20px', padding: '24px', marginBottom: '16px' }}>
          <p style={{ fontSize: 'clamp(16px,2.5vw,20px)', fontWeight: 700, marginBottom: '10px' }}>"{current.q}"</p>
          <p style={{ fontSize: '13px', color: 'var(--accent)', fontWeight: 600 }}>💡 {current.tip}</p>
        </div>
        <textarea value={answer} onChange={e => { setAnswer(e.target.value); answerRef.current = e.target.value }} placeholder="Type your answer as if speaking..." autoFocus style={{ width: '100%', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '14px', padding: '16px', color: 'var(--text-primary)', fontFamily: 'var(--font-body)', fontSize: '15px', resize: 'none', minHeight: '120px', outline: 'none', marginBottom: '8px' }} />
        <p className="text-muted" style={{ fontSize: '12px', marginBottom: '12px' }}>{answer.trim().split(/\s+/).filter(Boolean).length} words (aim for 60–120)</p>
        <button className="btn btn-primary btn-lg btn-full" onClick={() => submitAnswer(idxRef.current, answerRef.current)}>Submit Answer →</button>
      </>)}
      {phase === 'done' && (<>
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '16px', marginBottom: '20px', textAlign: 'left' }}>
          <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent)', marginBottom: '10px' }}>RESULTS:</p>
          {results.map((r, i) => <div key={i} style={{ borderBottom: i < results.length - 1 ? '1px solid var(--border)' : 'none', padding: '8px 0' }}><div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{r.q}</div><div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--accent)' }}>+{r.pts} pts · {r.words} words</div></div>)}
        </div>
        <ScoreScreen score={score} tokensEarned={GAMES['interview-sim'].reward} onReplay={handleStart} onDone={() => onFinish(score, GAMES['interview-sim'].reward)} />
      </>)}
    </GameShell>
  )
}

// ── GAME 11: MEMORY CHAIN ─────────────────────────────────────────────────
const CHAIN_WORDS = ['microphone','confidence','pause','clarity','speech','rhythm','voice','breath','eye contact','posture','gesture','tone','volume','pace','energy','practice','feedback','improve','strength','audience']

function MemoryChain({ onBack, onFinish }: { onBack: () => void; onFinish: (s: number, t: number) => void }) {
  const [phase, setPhase] = useState<'intro'|'show'|'recall'|'done'>('intro')
  const [chain, setChain] = useState<string[]>([])
  const [showIdx, setShowIdx] = useState(0)
  const [input, setInput] = useState('')
  const [score, setScore] = useState(0)
  const [round, setRound] = useState(1)
  const timerRef = useRef<any>(null)
  const clearTimer = () => { if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null } }

  const startRound = (r: number) => {
    const len = r + 2
    const pool = [...CHAIN_WORDS]
    const words: string[] = []
    for (let i = 0; i < len; i++) { const idx = Math.floor(Math.random() * pool.length); words.push(pool.splice(idx, 1)[0]) }
    setChain(words); setShowIdx(0); setPhase('show')
    let i = 0
    clearTimer()
    timerRef.current = setInterval(() => {
      i++
      if (i >= words.length) { clearTimer(); setTimeout(() => setPhase('recall'), 500) }
      else setShowIdx(i)
    }, 1200)
  }

  const checkRecall = () => {
    const userWords = input.trim().toLowerCase().split(/[,\s]+/).filter(Boolean)
    let c = 0; chain.forEach((w, i) => { if (userWords[i] && userWords[i] === w.toLowerCase()) c++ })
    const pts = c * 10 * round
    const newScore = score + pts
    if (round >= 5 || c < chain.length) { setScore(newScore); setPhase('done') }
    else { setRound(r => r + 1); setInput(''); setScore(newScore); setPhase('intro') }
  }

  useEffect(() => () => clearTimer(), [])

  return (
    <GameShell title={`MEMORY CHAIN — Round ${round}/5`} onBack={onBack}>
      {phase === 'intro' && (<><h2 className="font-display anim-slide-up" style={{ fontSize: 'clamp(26px,4vw,40px)', fontWeight: 900, letterSpacing: '-.04em', marginBottom: '16px' }}>Remember the chain.</h2><p className="text-muted" style={{ fontSize: '16px', marginBottom: '28px' }}>{round + 2} words will flash. Remember them all in order.</p><button className="btn btn-primary btn-lg btn-full" onClick={() => startRound(round)}>Show Words →</button></>)}
      {phase === 'show' && (<><p className="text-muted" style={{ marginBottom: '24px' }}>Word {showIdx + 1} of {chain.length}</p><div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '24px', padding: '80px 40px', marginBottom: '24px' }}><div className="font-display" style={{ fontSize: 'clamp(32px,5vw,52px)', fontWeight: 900, color: 'var(--accent)' }}>{chain[showIdx]}</div></div><div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>{chain.map((_, i) => <div key={i} style={{ width: '24px', height: '4px', borderRadius: '2px', background: i <= showIdx ? 'var(--accent)' : 'var(--border-light)' }} />)}</div></>)}
      {phase === 'recall' && (<><h2 className="font-display anim-slide-up" style={{ fontSize: 'clamp(22px,4vw,34px)', fontWeight: 900, marginBottom: '12px' }}>What were the words?</h2><p className="text-muted" style={{ marginBottom: '20px' }}>Type them in order, separated by spaces or commas.</p><textarea value={input} onChange={e => setInput(e.target.value)} placeholder="word1, word2, word3..." style={{ width: '100%', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '14px', padding: '16px', color: 'var(--text-primary)', fontFamily: 'var(--font-body)', fontSize: '16px', resize: 'none', minHeight: '100px', outline: 'none', marginBottom: '16px' }} /><button className="btn btn-primary btn-lg btn-full" onClick={checkRecall}>Submit →</button></>)}
      {phase === 'done' && <ScoreScreen score={score} tokensEarned={GAMES['memory-chain'].reward} onReplay={() => { setRound(1); setScore(0); setPhase('intro') }} onDone={() => onFinish(score, GAMES['memory-chain'].reward)} />}
    </GameShell>
  )
}

// ── GAME 12: SPEED DESCRIBE ───────────────────────────────────────────────
const CONCEPTS = ['a sunset over mountains','a busy city intersection','someone giving a speech','a crowded library','an empty stage with one spotlight','a handshake between two people','a microphone on a stand','a student presenting in class','a coach training an athlete','two friends having a debate']

function SpeedDescribe({ onBack, onFinish }: { onBack: () => void; onFinish: (s: number, t: number) => void }) {
  const [phase, setPhase] = useState<'intro'|'playing'|'done'>('intro')
  const [idx, setIdx] = useState(0)
  const [input, setInput] = useState('')
  const [results, setResults] = useState<{ concept: string; answer: string; ok: boolean }[]>([])
  const [time, setTime] = useState(8)
  const [score, setScore] = useState(0)
  const timerRef = useRef<any>(null)
  const idxRef = useRef(0)
  const scoreRef = useRef(0)
  const inputRef = useRef('')

  const clearTimer = () => { if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null } }

  const submit = (currentIdx: number, currentInput: string) => {
    clearTimer()
    const words = currentInput.trim().split(/\s+/).filter(Boolean)
    const ok = words.length === 5
    const pts = ok ? 20 : Math.max(0, 20 - Math.abs(words.length - 5) * 4)
    scoreRef.current += pts
    setScore(scoreRef.current)
    setResults(r => [...r, { concept: CONCEPTS[currentIdx], answer: currentInput.trim() || '(no answer)', ok }])
    const nextIdx = currentIdx + 1
    if (nextIdx >= 5) { setPhase('done') }
    else {
      idxRef.current = nextIdx
      setIdx(nextIdx)
      inputRef.current = ''
      setInput('')
      setTimeout(() => startRound(nextIdx), 300)
    }
  }

  const startRound = (currentIdx: number) => {
    clearTimer()
    setTime(8)
    timerRef.current = setInterval(() => {
      setTime(t => {
        if (t <= 1) { clearTimer(); submit(idxRef.current, inputRef.current); return 0 }
        return t - 1
      })
    }, 1000)
  }

  const start = () => {
    idxRef.current = 0; scoreRef.current = 0; inputRef.current = ''
    setPhase('playing'); setIdx(0); setResults([]); setScore(0); setInput('')
    startRound(0)
  }

  useEffect(() => () => clearTimer(), [])

  return (
    <GameShell title="SPEED DESCRIBE" onBack={onBack}>
      {phase === 'intro' && (<><h2 className="font-display anim-slide-up" style={{ fontSize: 'clamp(26px,4vw,40px)', fontWeight: 900, letterSpacing: '-.04em', marginBottom: '16px' }}>Exactly 5 words.</h2><p className="text-muted" style={{ fontSize: '16px', marginBottom: '28px' }}>A concept appears. Describe it in exactly 5 words. 8 seconds per round.</p><button className="btn btn-primary btn-lg btn-full" onClick={start}>Start →</button></>)}
      {phase === 'playing' && (<>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          <span className="text-muted">Round {idx + 1}/5</span>
          <div className="font-display" style={{ fontSize: '48px', fontWeight: 900, color: time <= 3 ? 'var(--hot)' : 'var(--text-primary)' }}>{time}</div>
          <span style={{ color: 'var(--accent)', fontWeight: 700 }}>{score} pts</span>
        </div>
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '20px', padding: '40px', marginBottom: '24px' }}>
          <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '12px', letterSpacing: '.08em' }}>DESCRIBE IN 5 WORDS</p>
          <p style={{ fontSize: 'clamp(18px,3vw,24px)', fontWeight: 700 }}>{CONCEPTS[idx]}</p>
        </div>
        <input className="input" style={{ fontSize: '20px', padding: '18px', marginBottom: '12px', textAlign: 'center' }} value={input} onChange={e => { setInput(e.target.value); inputRef.current = e.target.value }} placeholder="Type your 5 words..." onKeyDown={e => e.key === 'Enter' && submit(idxRef.current, inputRef.current)} autoFocus />
        <p style={{ fontSize: '13px', color: input.trim().split(/\s+/).filter(Boolean).length === 5 ? 'var(--accent)' : 'var(--text-muted)', marginBottom: '12px' }}>Word count: {input.trim().split(/\s+/).filter(Boolean).length} / 5</p>
        <button className="btn btn-primary btn-full" onClick={() => submit(idxRef.current, inputRef.current)}>Submit →</button>
      </>)}
      {phase === 'done' && (<>
        <div className="card" style={{ padding: '16px', marginBottom: '16px' }}>
          {results.map((r, i) => <div key={i} style={{ display: 'flex', gap: '10px', padding: '8px 0', borderBottom: i < results.length - 1 ? '1px solid var(--border)' : 'none' }}><span>{r.ok ? '✅' : '❌'}</span><div style={{ textAlign: 'left' }}><div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{r.concept}</div><div style={{ fontSize: '13px', fontStyle: 'italic' }}>"{r.answer}"</div></div></div>)}
        </div>
        <ScoreScreen score={score} tokensEarned={GAMES['speed-describe'].reward} onReplay={start} onDone={() => onFinish(score, GAMES['speed-describe'].reward)} />
      </>)}
    </GameShell>
  )
}

// ── GAME 13: WORD ASSOCIATION ─────────────────────────────────────────────
const ASSOC_WORDS = ['confidence','microphone','stage','audience','pause','voice','practice','clarity','breath','leader','courage','speak','listen','improve','grow','impact','persuade','connect','inspire','deliver']

function WordAssociation({ onBack, onFinish }: { onBack: () => void; onFinish: (s: number, t: number) => void }) {
  const [phase, setPhase] = useState<'intro'|'playing'|'done'>('intro')
  const [wordIdx, setWordIdx] = useState(0)
  const [input, setInput] = useState('')
  const [score, setScore] = useState(0)
  const [times, setTimes] = useState<number[]>([])
  const [startTime, setStartTime] = useState(0)
  const [round, setRound] = useState(0)
  const MAX_ROUNDS = 12

  const next = () => {
    const elapsed = (Date.now() - startTime) / 1000
    const pts = Math.max(5, Math.round(20 - (elapsed * 2.5)))
    if (input.trim().length > 0) { setScore(s => s + pts); setTimes(t => [...t, elapsed]) }
    if (round + 1 >= MAX_ROUNDS) setPhase('done')
    else { setRound(r => r + 1); setWordIdx(i => (i + 1) % ASSOC_WORDS.length); setInput(''); setStartTime(Date.now()) }
  }

  const startGame = () => { setPhase('playing'); setRound(0); setScore(0); setTimes([]); setStartTime(Date.now()); setWordIdx(0); setInput('') }

  return (
    <GameShell title="WORD ASSOCIATION" onBack={onBack}>
      {phase === 'intro' && (<><h2 className="font-display anim-slide-up" style={{ fontSize: 'clamp(26px,4vw,40px)', fontWeight: 900, letterSpacing: '-.04em', marginBottom: '16px' }}>Fast thinking.</h2><p className="text-muted" style={{ fontSize: '16px', marginBottom: '28px' }}>A word appears. Type the first related word as fast as possible. 12 rounds.</p><button className="btn btn-primary btn-lg btn-full" onClick={startGame}>Start →</button></>)}
      {phase === 'playing' && (<>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '32px' }}>
          <span className="text-muted">{round + 1}/{MAX_ROUNDS}</span>
          <span style={{ color: 'var(--accent)', fontWeight: 700 }}>{score} pts</span>
        </div>
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '24px', padding: '60px 40px', marginBottom: '32px' }}>
          <p style={{ fontSize: 'clamp(32px,5vw,52px)', fontWeight: 700, color: 'var(--accent)' }}>{ASSOC_WORDS[wordIdx]}</p>
        </div>
        <input className="input" style={{ fontSize: '22px', padding: '20px', textAlign: 'center', marginBottom: '14px' }} value={input} onChange={e => setInput(e.target.value)} placeholder="First word that comes to mind..." onKeyDown={e => e.key === 'Enter' && next()} autoFocus />
        <button className="btn btn-primary btn-lg btn-full" onClick={next}>Next →</button>
        <div style={{ marginTop: '16px' }}><div className="prog-track"><div className="prog-fill" style={{ background: 'var(--accent)', width: `${(round / MAX_ROUNDS) * 100}%` }} /></div></div>
      </>)}
      {phase === 'done' && (<>
        {times.length > 0 && <div className="card" style={{ padding: '16px', marginBottom: '16px' }}><p style={{ fontWeight: 600, marginBottom: '4px' }}>Avg response: {(times.reduce((a, b) => a + b, 0) / times.length).toFixed(1)}s</p><p className="text-muted" style={{ fontSize: '13px' }}>Faster = stronger language instincts</p></div>}
        <ScoreScreen score={score} tokensEarned={GAMES['word-association'].reward} onReplay={startGame} onDone={() => onFinish(score, GAMES['word-association'].reward)} />
      </>)}
    </GameShell>
  )
}
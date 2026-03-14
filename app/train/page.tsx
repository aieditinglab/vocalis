'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Nav from '@/components/Nav'
import { getOverallStats, getHighScore, setHighScore, getPrefs } from '@/lib/storage'
import type { OverallStats } from '@/lib/storage'
import { FILLER_WORDS } from '@/lib/metrics'

// ─── Types ────────────────────────────────────────────────────────────────────
type GameId = 'filler-hunt' | 'pace-tap' | 'quick-draw'
type GameState = 'idle' | 'countdown' | 'playing' | 'done'

// ─── Game 1 data ──────────────────────────────────────────────────────────────
const WORD_POOL_NORMAL = ['conference','project','deadline','strategy','impact','results','network','clearly','because','therefore','however','example','evidence','solution','benefit','achieve','develop','deliver','improve','strong','leader','skill','manage','create','build','learn','earn','support','growth','prove']
const GAME1_DECK = (() => {
  const arr: { word: string; isFiller: boolean }[] = []
  const fillers = ['um','uh','like','basically','literally','you know','i mean','right','actually']
  WORD_POOL_NORMAL.forEach(w => arr.push({ word: w, isFiller: false }))
  fillers.forEach(w => arr.push({ word: w, isFiller: true }))
  return arr.sort(() => Math.random() - 0.5)
})()

// ─── Game 3 data ──────────────────────────────────────────────────────────────
const QUICK_DRAW_ROUNDS = [
  {
    q: 'You\'re asked: "What is your greatest strength?"',
    options: [
      { text: '"Um, I think maybe my greatest strength is..."', correct: false, explain: 'Opens with filler words and hedging. Signals uncertainty.' },
      { text: '"My greatest strength is analytical thinking — here\'s an example..."', correct: true, explain: 'Direct opener, states the answer, signals confidence.' },
      { text: '"Well, you know, I\'m pretty good at a lot of things..."', correct: false, explain: '"Well" and "you know" are filler. "Pretty good" undersells you.' },
    ],
  },
  {
    q: 'You need to disagree with your manager in a meeting.',
    options: [
      { text: '"I don\'t think that\'s right..."', correct: false, explain: 'Sounds dismissive. Negative framing before any context.' },
      { text: '"That\'s a great point — can I add one more angle to consider?"', correct: true, explain: 'Validates first, then introduces your perspective. Professional.' },
      { text: '"Actually, I was literally just thinking the opposite..."', correct: false, explain: '"Actually" and "literally" as openers sound combative.' },
    ],
  },
  {
    q: 'Opening sentence of a 2-minute speech about your project.',
    options: [
      { text: '"Okay so, basically what I did was like, I worked on this project..."', correct: false, explain: '4 fillers in one sentence. Lost the audience immediately.' },
      { text: '"In six weeks, we reduced response time by 40%. Here\'s how."', correct: true, explain: 'Leads with results. Specific. Creates instant curiosity.' },
      { text: '"Good morning. My name is... and today I will be talking about..."', correct: false, explain: 'Cliché opener. Wastes the audience\'s most attentive moment.' },
    ],
  },
  {
    q: 'Someone asks: "Why do you want to go to this school?"',
    options: [
      { text: '"Because it\'s a really good school and I feel like I\'d fit in."', correct: false, explain: 'Vague. No specifics. Every applicant says this.' },
      { text: '"Your entrepreneurship program with its real-world startup lab is exactly where I want to build Vocalis."', correct: true, explain: 'Specific. Shows research. Connects their program to your goals.' },
      { text: '"I\'m not sure, I just sort of always wanted to come here, you know?"', correct: false, explain: '3 fillers. "Not sure" is the last thing an interviewer wants to hear.' },
    ],
  },
]

export default function TrainPage() {
  const [stats, setStats]       = useState<OverallStats | null>(null)
  const [name, setName]         = useState('')
  const [activeGame, setActiveGame] = useState<GameId | null>(null)

  // Game 1 state
  const [g1State, setG1State]   = useState<GameState>('idle')
  const [g1Idx, setG1Idx]       = useState(0)
  const [g1Score, setG1Score]   = useState(0)
  const [g1Total, setG1Total]   = useState(0)
  const [g1CD, setG1CD]         = useState(3)
  const [g1Hi, setG1Hi]         = useState(0)
  const [g1Flash, setG1Flash]   = useState<'correct'|'wrong'|null>(null)
  const g1TimerRef = useRef<NodeJS.Timeout|null>(null)
  const g1WordTimer = useRef<NodeJS.Timeout|null>(null)
  const [g1Deck, setG1Deck]     = useState<typeof GAME1_DECK>([])
  const [g1Secs, setG1Secs]     = useState(60)

  // Game 2 state
  const [g2State, setG2State]   = useState<GameState>('idle')
  const [g2WordIdx, setG2WordIdx] = useState(0)
  const [g2Taps, setG2Taps]     = useState<number[]>([])
  const [g2Words] = useState(['Practice','makes','permanent','so','focus','on','quality','over','quantity','every','single','session','counts'])
  const [g2Score, setG2Score]   = useState(0)
  const [g2Hi, setG2Hi]         = useState(0)
  const g2TimerRef = useRef<NodeJS.Timeout|null>(null)

  // Game 3 state
  const [g3State, setG3State]   = useState<GameState>('idle')
  const [g3Round, setG3Round]   = useState(0)
  const [g3Score, setG3Score]   = useState(0)
  const [g3Selected, setG3Sel]  = useState<number|null>(null)
  const [g3Hi, setG3Hi]         = useState(0)

  useEffect(() => {
    setStats(getOverallStats())
    setName(getPrefs().name || 'there')
    setG1Hi(getHighScore('filler-hunt'))
    setG2Hi(getHighScore('pace-tap'))
    setG3Hi(getHighScore('quick-draw'))
    setG1Deck([...GAME1_DECK].sort(() => Math.random() - 0.5))
  }, [])

  // ─── Game 1: Filler Hunt ─────────────────────────────────────────────────
  const startG1 = () => {
    setG1State('countdown')
    setG1Score(0); setG1Total(0); setG1Idx(0)
    setG1Secs(60)
    setG1Deck([...GAME1_DECK].sort(() => Math.random() - 0.5))
    let cd = 3
    setG1CD(cd)
    const t = setInterval(() => {
      cd--
      setG1CD(cd)
      if (cd <= 0) { clearInterval(t); setG1State('playing'); startG1Timer() }
    }, 1000)
  }

  const startG1Timer = () => {
    let s = 60
    g1TimerRef.current = setInterval(() => {
      s--
      setG1Secs(s)
      if (s <= 0) endG1()
    }, 1000)
    nextG1Word()
  }

  const nextG1Word = () => {
    setG1Flash(null)
    g1WordTimer.current = setTimeout(() => {
      setG1Idx(i => i + 1)
      setG1Flash('wrong') // missed filler = wrong
      setG1Total(t => t + 1)
      nextG1Word()
    }, 2000)
  }

  const tapG1 = () => {
    clearTimeout(g1WordTimer.current!)
    const card = g1Deck[g1Idx % g1Deck.length]
    if (card?.isFiller) {
      setG1Score(s => s + 1)
      setG1Flash('correct')
    } else {
      setG1Flash('wrong')
    }
    setG1Total(t => t + 1)
    setTimeout(() => { setG1Idx(i => i + 1); nextG1Word() }, 400)
  }

  const endG1 = () => {
    clearInterval(g1TimerRef.current!)
    clearTimeout(g1WordTimer.current!)
    setG1State('done')
    setHighScore('filler-hunt', g1Score)
    setG1Hi(prev => Math.max(prev, g1Score))
  }

  // ─── Game 2: Pace Tap ────────────────────────────────────────────────────
  const TARGET_MS = 400 // 150 WPM = 1 word per 400ms
  const startG2 = () => {
    setG2State('playing')
    setG2WordIdx(0); setG2Taps([])
    let i = 0
    g2TimerRef.current = setInterval(() => {
      i++
      setG2WordIdx(i)
      if (i >= g2Words.length) endG2()
    }, TARGET_MS)
  }

  const tapG2 = () => {
    setG2Taps(t => [...t, Date.now()])
  }

  const endG2 = () => {
    clearInterval(g2TimerRef.current!)
    const score = g2Taps.length > 0
      ? Math.min(100, Math.round((g2Taps.length / g2Words.length) * 100))
      : 0
    setG2Score(score)
    setHighScore('pace-tap', score)
    setG2Hi(prev => Math.max(prev, score))
    setG2State('done')
  }

  // ─── Game 3: Quick Draw ──────────────────────────────────────────────────
  const selectG3 = (idx: number) => {
    if (g3Selected !== null) return
    setG3Sel(idx)
    if (QUICK_DRAW_ROUNDS[g3Round].options[idx].correct) {
      setG3Score(s => s + 1)
    }
  }

  const nextG3 = () => {
    if (g3Round + 1 >= QUICK_DRAW_ROUNDS.length) {
      setHighScore('quick-draw', g3Score + (QUICK_DRAW_ROUNDS[g3Round].options[g3Selected!]?.correct ? 1 : 0))
      setG3Hi(prev => Math.max(prev, g3Score))
      setG3State('done')
    } else {
      setG3Round(r => r + 1)
      setG3Sel(null)
    }
  }

  const startG3 = () => {
    setG3State('playing')
    setG3Round(0); setG3Score(0); setG3Sel(null)
  }

  const GAMES = [
    {
      id: 'filler-hunt' as GameId,
      emoji: '🎯',
      title: 'Filler Hunt',
      desc: 'Words flash by. Tap the fillers before they disappear.',
      hi: g1Hi,
      color: '#FF3054',
    },
    {
      id: 'pace-tap' as GameId,
      emoji: '⚡',
      title: 'Pace Tap',
      desc: 'Words appear at 150 WPM. Tap along to find your rhythm.',
      hi: g2Hi,
      color: '#FFB800',
    },
    {
      id: 'quick-draw' as GameId,
      emoji: '💡',
      title: 'Quick Draw',
      desc: 'Pick the strongest opener in real speaking scenarios.',
      hi: g3Hi,
      color: '#AAFF00',
    },
  ]

  if (activeGame === 'filler-hunt') return <FillerHuntGame state={g1State} deck={g1Deck} idx={g1Idx} score={g1Score} secs={g1Secs} countdown={g1CD} flash={g1Flash} hi={g1Hi} onStart={startG1} onTap={tapG1} onDone={() => { setActiveGame(null); setG1State('idle') }} />
  if (activeGame === 'pace-tap')    return <PaceTapGame    state={g2State} words={g2Words} wordIdx={g2WordIdx} score={g2Score} hi={g2Hi} onStart={startG2} onTap={tapG2} onDone={() => { setActiveGame(null); setG2State('idle') }} />
  if (activeGame === 'quick-draw')  return <QuickDrawGame  state={g3State} round={g3Round} score={g3Score} selected={g3Selected} hi={g3Hi} onStart={startG3} onSelect={selectG3} onNext={nextG3} onDone={() => { setActiveGame(null); setG3State('idle') }} />

  return (
    <>
      <Nav showDashLinks rightContent={<Link href="/record" className="btn btn-primary btn-sm">New Rep 🎤</Link>} />

      <div className="container-lg">
        {/* Greeting */}
        <div style={{ marginBottom: '48px' }}>
          <p className="eyebrow anim-slide-up anim-d1">TRAINING HUB</p>
          <h1 className="font-display anim-slide-up anim-d2"
            style={{ fontSize: 'clamp(36px,5vw,60px)', fontWeight: 900, letterSpacing: '-0.04em' }}>
            {stats?.totalSessions ? `Keep going, ${name}.` : `Let's start, ${name}.`}
          </h1>
          {stats?.totalSessions ? (
            <p className="text-muted anim-slide-up anim-d3" style={{ fontSize: '16px', marginTop: '8px' }}>
              {stats.totalSessions} session{stats.totalSessions !== 1 ? 's' : ''} completed &nbsp;·&nbsp; avg clarity {stats.avgClarity} &nbsp;·&nbsp; {stats.streak} day streak 🔥
            </p>
          ) : (
            <p className="text-muted anim-slide-up anim-d3" style={{ fontSize: '16px', marginTop: '8px' }}>
              Record your first session to start building your baseline.
            </p>
          )}
        </div>

        {/* Quick stats if sessions exist */}
        {stats && stats.totalSessions > 0 && (
          <div className="anim-slide-up anim-d3" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '12px', marginBottom: '48px' }}>
            {[
              { label: 'Sessions',     val: String(stats.totalSessions),   sub: 'total' },
              { label: 'Best Clarity', val: String(stats.bestClarity),     sub: '/ 100' },
              { label: 'Avg Fillers',  val: String(stats.avgFillers),      sub: 'per session' },
              { label: 'Improvement', val: (stats.improvement >= 0 ? '+' : '') + stats.improvement, sub: 'pts clarity', color: stats.improvement >= 0 ? 'var(--accent)' : 'var(--hot)' },
            ].map(s => (
              <div key={s.label} className="dash-stat">
                <div className="font-display" style={{ fontSize: '36px', fontWeight: 900, letterSpacing: '-0.04em', color: (s as any).color || 'var(--accent)', lineHeight: 1 }}>{s.val}</div>
                <div style={{ fontSize: '13px', fontWeight: 600, marginTop: '6px' }}>{s.label}</div>
                <div className="text-muted" style={{ fontSize: '12px', marginTop: '3px' }}>{s.sub}</div>
              </div>
            ))}
          </div>
        )}

        {/* Start new session CTA */}
        <div className="anim-slide-up anim-d3" style={{ background: 'rgba(170,255,0,0.05)', border: '1px solid rgba(170,255,0,0.15)', borderRadius: '24px', padding: '36px', marginBottom: '48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <h2 className="font-display" style={{ fontSize: '24px', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: '6px' }}>
              Ready for a rep?
            </h2>
            <p className="text-muted" style={{ fontSize: '14px' }}>Practice a real prompt. Get real feedback. Track real progress.</p>
          </div>
          <Link href="/record" className="btn btn-primary btn-lg">Start Recording →</Link>
        </div>

        {/* Games section */}
        <div style={{ marginBottom: '20px' }}>
          <p className="eyebrow anim-slide-up anim-d1">SKILL GAMES</p>
          <h2 className="font-display anim-slide-up anim-d2" style={{ fontSize: 'clamp(24px,3vw,36px)', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: '6px' }}>
            Train the reflexes.
          </h2>
          <p className="text-muted anim-slide-up anim-d3" style={{ fontSize: '15px', marginBottom: '28px' }}>
            Three games that build real speaking instincts — like Duolingo for your voice.
          </p>
        </div>

        <div className="anim-slide-up anim-d4" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '16px' }}>
          {GAMES.map(g => (
            <button key={g.id} className="game-card" onClick={() => setActiveGame(g.id)}>
              <div style={{ fontSize: '40px', marginBottom: '16px' }}>{g.emoji}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', flexWrap: 'wrap' }}>
                <h3 className="font-display" style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '-0.02em', color: g.color }}>{g.title}</h3>
                {g.hi > 0 && <span style={{ fontSize: '11px', color: '#555', fontWeight: 600 }}>Best: {g.hi}</span>}
              </div>
              <p style={{ fontSize: '14px', color: 'var(--muted-mid)', lineHeight: 1.55, marginBottom: '20px' }}>{g.desc}</p>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'var(--card2)', border: '1px solid var(--border-light)', borderRadius: '100px', padding: '8px 16px', fontSize: '13px', fontWeight: 600, color: g.color }}>
                Play now →
              </div>
            </button>
          ))}
        </div>
      </div>
    </>
  )
}

// ─── Game 1: Filler Hunt Component ───────────────────────────────────────────
function FillerHuntGame({ state, deck, idx, score, secs, countdown, flash, hi, onStart, onTap, onDone }: any) {
  const current = deck[idx % deck.length]
  return (
    <>
      <Nav backHref="/train" backLabel="← Exit" />
      <div className="container" style={{ textAlign: 'center' }}>
        <p className="eyebrow">🎯 FILLER HUNT</p>
        {state === 'idle' && (
          <>
            <h1 className="font-display" style={{ fontSize: '40px', fontWeight: 900, letterSpacing: '-0.04em', marginBottom: '16px' }}>Filler Hunt</h1>
            <p className="text-muted" style={{ fontSize: '16px', marginBottom: '12px' }}>Words flash by every 2 seconds. Tap/click if it&apos;s a filler word. Miss it = wrong.</p>
            {hi > 0 && <p className="text-accent" style={{ fontSize: '14px', marginBottom: '24px' }}>Your best: {hi} correct</p>}
            <button className="btn btn-primary btn-lg" onClick={onStart}>Start Game</button>
          </>
        )}
        {state === 'countdown' && (
          <div className="font-display" style={{ fontSize: '120px', fontWeight: 900, color: 'var(--accent)', animation: 'countIn .4s cubic-bezier(.16,1,.3,1) both' }}>{countdown}</div>
        )}
        {state === 'playing' && current && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '40px' }}>
              <div><div style={{ fontSize: '11px', color: '#555', marginBottom: '4px' }}>SCORE</div><div className="font-display" style={{ fontSize: '32px', fontWeight: 900, color: 'var(--accent)' }}>{score}</div></div>
              <div><div style={{ fontSize: '11px', color: '#555', marginBottom: '4px' }}>TIME</div><div className="font-display" style={{ fontSize: '32px', fontWeight: 900, color: secs <= 10 ? 'var(--hot)' : 'var(--white)' }}>{secs}s</div></div>
            </div>
            <div
              onClick={onTap}
              style={{
                background: flash === 'correct' ? 'rgba(170,255,0,0.12)' : flash === 'wrong' ? 'rgba(255,48,84,0.1)' : 'var(--card)',
                border: `2px solid ${flash === 'correct' ? 'var(--accent)' : flash === 'wrong' ? 'var(--hot)' : 'var(--border)'}`,
                borderRadius: '24px', padding: '60px 40px', cursor: 'pointer',
                transition: 'all 0.15s', marginBottom: '24px',
              }}
            >
              <div className="font-display" style={{ fontSize: 'clamp(48px,8vw,80px)', fontWeight: 900, letterSpacing: '-0.04em' }}>
                {current.word}
              </div>
            </div>
            <p className="text-muted" style={{ fontSize: '14px' }}>Tap if it&apos;s a filler word</p>
          </>
        )}
        {state === 'done' && (
          <>
            <h1 className="font-display anim-pop" style={{ fontSize: '40px', fontWeight: 900, letterSpacing: '-0.04em', marginBottom: '16px' }}>Game Over!</h1>
            <div className="clarity-hero" style={{ marginBottom: '24px' }}>
              <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '.1em', color: 'var(--accent)', marginBottom: '8px' }}>SCORE</p>
              <div className="clarity-num">{score}</div>
              <p className="text-muted" style={{ marginTop: '8px' }}>fillers caught correctly</p>
              {score >= hi && score > 0 && <p className="text-accent" style={{ marginTop: '8px', fontSize: '14px', fontWeight: 600 }}>🏆 New high score!</p>}
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button className="btn btn-primary btn-lg" onClick={onStart}>Play Again</button>
              <button className="btn btn-outline btn-lg" onClick={onDone}>Back</button>
            </div>
          </>
        )}
      </div>
    </>
  )
}

// ─── Game 2: Pace Tap Component ───────────────────────────────────────────────
function PaceTapGame({ state, words, wordIdx, score, hi, onStart, onTap, onDone }: any) {
  const current = words[Math.min(wordIdx, words.length - 1)]
  return (
    <>
      <Nav backHref="/train" backLabel="← Exit" />
      <div className="container" style={{ textAlign: 'center' }}>
        <p className="eyebrow">⚡ PACE TAP</p>
        {state === 'idle' && (
          <>
            <h1 className="font-display" style={{ fontSize: '40px', fontWeight: 900, letterSpacing: '-0.04em', marginBottom: '16px' }}>Pace Tap</h1>
            <p className="text-muted" style={{ fontSize: '16px', marginBottom: '8px' }}>Words appear at 150 WPM. Tap the screen with each word to build your rhythm.</p>
            <p className="text-muted" style={{ fontSize: '14px', marginBottom: '24px' }}>This trains the physical feeling of speaking at the ideal pace.</p>
            {hi > 0 && <p className="text-accent" style={{ fontSize: '14px', marginBottom: '24px' }}>Your best: {hi}% sync</p>}
            <button className="btn btn-primary btn-lg" onClick={onStart}>Start</button>
          </>
        )}
        {state === 'playing' && (
          <>
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '12px', color: '#555', marginBottom: '6px' }}>TARGET: 150 WPM</div>
              <div className="prog-track" style={{ maxWidth: '320px', margin: '0 auto' }}>
                <div className="prog-fill" style={{ background: 'var(--accent)', width: ((wordIdx / words.length) * 100) + '%', transition: 'width 0.4s' }} />
              </div>
            </div>
            <div
              onClick={onTap}
              style={{ background: 'var(--card)', border: '2px solid var(--border)', borderRadius: '24px', padding: '60px 40px', cursor: 'pointer', marginBottom: '24px', transition: 'border-color 0.1s' }}
            >
              <div className="font-display" style={{ fontSize: 'clamp(48px,8vw,80px)', fontWeight: 900, letterSpacing: '-0.04em', color: 'var(--accent)' }}>
                {current}
              </div>
            </div>
            <p className="text-muted" style={{ fontSize: '14px' }}>Tap along with each word</p>
          </>
        )}
        {state === 'done' && (
          <>
            <h1 className="font-display anim-pop" style={{ fontSize: '40px', fontWeight: 900, letterSpacing: '-0.04em', marginBottom: '16px' }}>Done!</h1>
            <div className="clarity-hero" style={{ marginBottom: '24px' }}>
              <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '.1em', color: 'var(--accent)', marginBottom: '8px' }}>SYNC RATE</p>
              <div className="clarity-num">{score}%</div>
              <p className="text-muted" style={{ marginTop: '8px' }}>tapped in rhythm</p>
              {score >= hi && score > 0 && <p className="text-accent" style={{ marginTop: '8px', fontSize: '14px', fontWeight: 600 }}>🏆 New high score!</p>}
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button className="btn btn-primary btn-lg" onClick={onStart}>Play Again</button>
              <button className="btn btn-outline btn-lg" onClick={onDone}>Back</button>
            </div>
          </>
        )}
      </div>
    </>
  )
}

// ─── Game 3: Quick Draw Component ─────────────────────────────────────────────
function QuickDrawGame({ state, round, score, selected, hi, onStart, onSelect, onNext, onDone }: any) {
  const current = QUICK_DRAW_ROUNDS[round]
  const total   = QUICK_DRAW_ROUNDS.length
  return (
    <>
      <Nav backHref="/train" backLabel="← Exit" />
      <div className="container">
        <p className="eyebrow" style={{ textAlign: 'center' }}>💡 QUICK DRAW</p>
        {state === 'idle' && (
          <div style={{ textAlign: 'center' }}>
            <h1 className="font-display" style={{ fontSize: '40px', fontWeight: 900, letterSpacing: '-0.04em', marginBottom: '16px' }}>Quick Draw</h1>
            <p className="text-muted" style={{ fontSize: '16px', marginBottom: '8px' }}>Real speaking scenarios. Pick the strongest opener.</p>
            <p className="text-muted" style={{ fontSize: '14px', marginBottom: '24px' }}>{total} rounds — learn the patterns that command attention.</p>
            {hi > 0 && <p className="text-accent" style={{ fontSize: '14px', marginBottom: '24px' }}>Your best: {hi}/{total}</p>}
            <button className="btn btn-primary btn-lg" onClick={onStart}>Start</button>
          </div>
        )}
        {state === 'playing' && current && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
              <span style={{ fontSize: '13px', color: '#555' }}>Round {round + 1} / {total}</span>
              <span className="text-accent" style={{ fontSize: '13px', fontWeight: 600 }}>{score} correct</span>
            </div>
            <div className="card-flat" style={{ padding: '24px', marginBottom: '24px' }}>
              <p style={{ fontSize: '16px', fontWeight: 500, lineHeight: 1.5 }}>{current.q}</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {current.options.map((opt: any, i: number) => {
                const isSelected = selected === i
                const showResult = selected !== null
                const borderColor = !showResult ? 'var(--border)' : isSelected ? (opt.correct ? 'var(--accent)' : 'var(--hot)') : opt.correct ? 'var(--accent)' : 'var(--border)'
                return (
                  <button
                    key={i}
                    onClick={() => onSelect(i)}
                    disabled={selected !== null}
                    style={{
                      background: isSelected && showResult ? (opt.correct ? 'rgba(170,255,0,0.06)' : 'rgba(255,48,84,0.06)') : 'var(--card)',
                      border: `1px solid ${borderColor}`,
                      borderRadius: '14px', padding: '18px 20px', textAlign: 'left',
                      color: 'var(--white)', fontFamily: 'var(--font-body)', fontSize: '15px',
                      cursor: selected !== null ? 'default' : 'pointer', lineHeight: 1.45, width: '100%',
                      transition: 'all 0.2s',
                    }}
                  >
                    {opt.text}
                    {showResult && isSelected && (
                      <div style={{ fontSize: '12px', marginTop: '8px', color: opt.correct ? 'var(--accent)' : 'var(--hot)' }}>
                        {opt.correct ? '✓ ' : '✗ '}{opt.explain}
                      </div>
                    )}
                    {showResult && !isSelected && opt.correct && (
                      <div style={{ fontSize: '12px', marginTop: '8px', color: 'var(--accent)' }}>
                        ✓ {opt.explain}
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
            {selected !== null && (
              <button className="btn btn-primary btn-full btn-lg" onClick={onNext} style={{ marginTop: '20px' }}>
                {round + 1 >= total ? 'See Results →' : 'Next Round →'}
              </button>
            )}
          </>
        )}
        {state === 'done' && (
          <div style={{ textAlign: 'center' }}>
            <h1 className="font-display anim-pop" style={{ fontSize: '40px', fontWeight: 900, letterSpacing: '-0.04em', marginBottom: '16px' }}>Done!</h1>
            <div className="clarity-hero" style={{ marginBottom: '24px' }}>
              <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '.1em', color: 'var(--accent)', marginBottom: '8px' }}>SCORE</p>
              <div className="clarity-num">{score}/{total}</div>
              <p className="text-muted" style={{ marginTop: '8px' }}>correct picks</p>
              {score === total && <p className="text-accent" style={{ marginTop: '8px', fontSize: '14px', fontWeight: 600 }}>🏆 Perfect round!</p>}
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button className="btn btn-primary btn-lg" onClick={onStart}>Play Again</button>
              <button className="btn btn-outline btn-lg" onClick={onDone}>Back</button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

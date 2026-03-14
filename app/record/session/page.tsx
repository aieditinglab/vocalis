'use client'
import {useState,useEffect,useRef,useCallback} from 'react'
import {useRouter} from 'next/navigation'
import Nav from '@/components/Nav'
import WaveBars from '@/components/WaveBars'
import {getPendingSession,setPendingSession} from '@/lib/store'
import {audioStore} from '@/lib/audioStore'

const MAX=660
function fmt(s:number){return`${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`}
type Phase='perm'|'idle'|'recording'|'playback'

export default function RecordSessionPage(){
  const router=useRouter()
  const pending=getPendingSession()
  const [phase,setPhase]=useState<Phase>('perm')
  const [secs,setSecs]=useState(0)
  const [tooShort,setTooShort]=useState(false)
  const [audioUrl,setAudioUrl]=useState<string|null>(null)
  const [duration,setDuration]=useState(0)
  const [playTime,setPlayTime]=useState(0)
  const [isPlaying,setIsPlaying]=useState(false)
  const [permErr,setPermErr]=useState('')
  const mediaRef=useRef<MediaRecorder|null>(null)
  const chunksRef=useRef<Blob[]>([])
  const timerRef=useRef<NodeJS.Timeout|null>(null)
  const audioRef=useRef<HTMLAudioElement|null>(null)
  const playTimerRef=useRef<NodeJS.Timeout|null>(null)
  const finalSecs=useRef(0)

  useEffect(()=>()=>{clearInterval(timerRef.current!);clearInterval(playTimerRef.current!)},[])

  // ── PERMISSION REQUEST ──────────────────────────────────────────────────
  const requestMic=async()=>{
    setPermErr('')
    try{
      // Test permission — stop immediately, just checking
      const stream=await navigator.mediaDevices.getUserMedia({audio:true})
      stream.getTracks().forEach(t=>t.stop())
      setPhase('idle')
    }catch(e:any){
      if(e.name==='NotAllowedError'||e.name==='PermissionDeniedError'){
        setPermErr('Microphone access was denied. Open your browser settings, find "Microphone", and set it to Allow for this site.')
      } else if(e.name==='NotFoundError'){
        setPermErr('No microphone found. Please connect a microphone and try again.')
      } else {
        setPermErr('Could not access microphone: '+e.message)
      }
    }
  }

  // ── RECORDING ───────────────────────────────────────────────────────────
  const startRec=async()=>{
    setPermErr('')
    try{
      const stream=await navigator.mediaDevices.getUserMedia({audio:true})
      const mime=MediaRecorder.isTypeSupported('audio/webm;codecs=opus')?'audio/webm;codecs=opus':'audio/webm'
      const recorder=new MediaRecorder(stream,{mimeType:mime})
      chunksRef.current=[]
      recorder.ondataavailable=e=>{if(e.data.size>0)chunksRef.current.push(e.data)}
      recorder.onstop=()=>{
        stream.getTracks().forEach(t=>t.stop())
        const blob=new Blob(chunksRef.current,{type:mime})
        const url=URL.createObjectURL(blob)
        audioStore.set(url,finalSecs.current,mime)
        setAudioUrl(url)
        setDuration(finalSecs.current)
        setPhase('playback')
      }
      recorder.start(100)
      mediaRef.current=recorder
      setPhase('recording')
      setSecs(0)
      finalSecs.current=0
      setTooShort(false)
      timerRef.current=setInterval(()=>{
        setSecs(prev=>{
          const next=prev+1
          finalSecs.current=next
          if(next>=MAX){stopRec();return MAX}
          return next
        })
      },1000)
    }catch(e:any){
      setPermErr('Could not start recording: '+e.message)
      setPhase('perm')
    }
  }

  const stopRec=()=>{
    clearInterval(timerRef.current!)
    if(mediaRef.current&&mediaRef.current.state!=='inactive')mediaRef.current.stop()
  }

  const handleBtn=()=>{
    if(phase==='idle')startRec()
    else if(phase==='recording'){
      if(secs<30){setTooShort(true)}
      else stopRec()
    }
  }

  // ── PLAYBACK ─────────────────────────────────────────────────────────────
  const playPause=()=>{
    if(!audioRef.current)return
    if(isPlaying){
      audioRef.current.pause()
      clearInterval(playTimerRef.current!)
      setIsPlaying(false)
    }else{
      audioRef.current.play()
      setIsPlaying(true)
      playTimerRef.current=setInterval(()=>{
        if(!audioRef.current)return
        setPlayTime(audioRef.current.currentTime)
        if(audioRef.current.ended){setIsPlaying(false);clearInterval(playTimerRef.current!)}
      },200)
    }
  }

  const handleSeek=(e:React.ChangeEvent<HTMLInputElement>)=>{
    const t=parseFloat(e.target.value)
    setPlayTime(t)
    if(audioRef.current)audioRef.current.currentTime=t
  }

  const goAnalysis=()=>{
    const p=getPendingSession()||{}
    setPendingSession({...p,duration})
    router.push('/observe')
  }

  const recordAgain=()=>{
    setPhase('idle');setSecs(0);setTooShort(false)
    setPlayTime(0);setIsPlaying(false)
    audioStore.clear();setAudioUrl(null)
  }

  const timerColor=phase==='recording'?(secs<30?'var(--hot)':'var(--accent)'):'var(--text-muted)'

  return(<>
    <Nav backHref="/record" rightContent={<span className="text-muted" style={{fontSize:'13px'}}>{pending?.category||'Recording'}</span>}/>
    <div className="container" style={{textAlign:'center'}}>
      <p className="eyebrow anim-slide-up anim-d1">STEP 1 OF 5 — VOICE</p>

      {/* ── PERMISSION SCREEN ── */}
      {phase==='perm'&&(
        <div className="mic-perm-box anim-slide-up anim-d2">
          <div style={{fontSize:'64px',marginBottom:'20px',animation:'float 3s ease-in-out infinite'}}>🎙️</div>
          <h2 className="font-display" style={{fontSize:'28px',fontWeight:900,letterSpacing:'-.03em',marginBottom:'12px'}}>Microphone Access</h2>
          <p className="text-muted" style={{fontSize:'15px',lineHeight:1.65,marginBottom:'28px'}}>
            Vocalis needs your microphone to record your voice.<br/>
            When your browser asks — click <strong style={{color:'var(--text-primary)'}}>Allow</strong>.
          </p>
          {permErr&&(
            <div style={{background:'rgba(255,48,84,.08)',border:'1px solid rgba(255,48,84,.2)',borderRadius:'12px',padding:'14px 18px',marginBottom:'20px',fontSize:'13px',color:'var(--hot)',textAlign:'left',lineHeight:1.6}}>
              {permErr}
              <div style={{marginTop:'10px'}}>
                <strong>How to fix:</strong><br/>
                Chrome: Click the 🔒 lock icon in the address bar → Microphone → Allow<br/>
                Firefox: Click the 🎙 icon in the address bar → Allow
              </div>
            </div>
          )}
          <button className="btn btn-primary btn-lg btn-full" onClick={requestMic}>
            Allow Microphone →
          </button>
          <p className="text-muted" style={{fontSize:'12px',marginTop:'14px'}}>Your audio never leaves your device in Phase 1</p>
        </div>
      )}

      {/* ── PROMPT BOX ── */}
      {(phase==='idle'||phase==='recording')&&(
        <>
          <div className="anim-slide-up anim-d2" style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:'20px',padding:'28px 32px',marginBottom:'32px'}}>
            <p style={{fontSize:'11px',fontWeight:700,letterSpacing:'.1em',color:'var(--text-muted)',marginBottom:'12px'}}>YOUR PROMPT</p>
            <p style={{fontSize:'clamp(18px,2.2vw,24px)',fontWeight:600,letterSpacing:'-.02em',lineHeight:1.4}}>
              &ldquo;{pending?.prompt||'Tell me about yourself and one thing that makes you stand out.'}&rdquo;
            </p>
          </div>

          {/* Timer */}
          <div className="anim-slide-up anim-d3" style={{marginBottom:'20px'}}>
            <div className="font-display" style={{fontSize:'76px',fontWeight:900,letterSpacing:'-.05em',lineHeight:1,color:timerColor,transition:'color .3s'}}>{fmt(secs)}</div>
            <p className="text-muted" style={{fontSize:'13px',marginTop:'8px'}}>
              Min 30s · Max 11:00
              {phase==='recording'&&secs>=30&&<span style={{color:'var(--accent)',marginLeft:'8px'}}>● Recording</span>}
            </p>
          </div>

          {/* Progress bar */}
          {phase==='recording'&&(
            <div style={{maxWidth:'400px',margin:'0 auto 20px'}}>
              <div className="prog-track">
                <div className="prog-fill" style={{background:secs<30?'var(--hot)':'var(--accent)',width:`${(secs/MAX)*100}%`,transition:'width 1s linear'}}/>
              </div>
              <div style={{display:'flex',justifyContent:'space-between',marginTop:'6px'}}>
                <span style={{fontSize:'11px',color:'var(--text-muted)'}}>0:00</span>
                <span style={{fontSize:'11px',color:'var(--text-muted)'}}>11:00</span>
              </div>
            </div>
          )}

          {/* Wave */}
          <div style={{display:'flex',justifyContent:'center',marginBottom:'28px'}}>
            <WaveBars count={30} active={phase==='recording'} height={44}/>
          </div>

          {/* Record button */}
          <div className="anim-slide-up anim-d4" style={{display:'flex',alignItems:'center',justifyContent:'center',marginBottom:'16px'}}>
            <div style={{position:'relative',display:'inline-flex',alignItems:'center',justifyContent:'center'}}>
              {phase==='recording'&&<><div className="pulse-ring"/><div className="pulse-ring pulse-ring-2"/></>}
              <button className={`rec-btn ${phase==='recording'?'recording':'idle'}`} onClick={handleBtn}>
                {phase==='idle'
                  ?<svg width="44" height="44" viewBox="0 0 24 24" fill="none"><path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z" fill="#000"/><path d="M19 10v1a7 7 0 0 1-14 0v-1M12 19v3M8 22h8" stroke="#000" strokeWidth="2" strokeLinecap="round"/></svg>
                  :<div style={{width:'28px',height:'28px',background:'#fff',borderRadius:'5px'}}/>
                }
              </button>
            </div>
          </div>

          <p className="text-muted" style={{fontSize:'14px'}}>
            {phase==='idle'?'Tap to start recording':secs<30?`Keep talking... (${30-secs}s to minimum)`:'Tap to stop'}
          </p>
          {tooShort&&<p style={{color:'var(--hot)',fontSize:'13px',marginTop:'8px'}}>Minimum 30 seconds required</p>}
        </>
      )}

      {/* ── PLAYBACK PHASE ── */}
      {phase==='playback'&&audioUrl&&(
        <>
          <audio ref={audioRef} src={audioUrl}/>
          <div className="anim-slide-up anim-d1" style={{marginBottom:'16px'}}>
            <div style={{background:'rgba(170,255,0,.05)',border:'1px solid rgba(170,255,0,.15)',borderRadius:'12px',padding:'10px 18px',display:'inline-flex',alignItems:'center',gap:'8px',fontSize:'14px'}}>
              <span style={{color:'var(--accent)'}}>✓</span>
              Recording complete — <span style={{fontWeight:600}}>{fmt(duration)}</span>
            </div>
          </div>
          <h2 className="font-display anim-slide-up anim-d2" style={{fontSize:'clamp(28px,4vw,40px)',fontWeight:900,letterSpacing:'-.04em',marginBottom:'8px'}}>Hear yourself back.</h2>
          <p className="text-muted anim-slide-up anim-d2" style={{fontSize:'16px',marginBottom:'28px'}}>Listen to what others hear. Then see your analysis.</p>
          <div className="audio-player anim-slide-up anim-d3" style={{marginBottom:'20px',textAlign:'left'}}>
            <div style={{display:'flex',alignItems:'center',gap:'16px',marginBottom:'16px'}}>
              <button onClick={playPause} style={{width:'52px',height:'52px',borderRadius:'50%',background:'var(--accent)',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,transition:'all .2s'}}>
                {isPlaying
                  ?<svg width="18" height="18" viewBox="0 0 24 24" fill="#000"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>
                  :<svg width="18" height="18" viewBox="0 0 24 24" fill="#000"><path d="M5 3l14 9-14 9V3z"/></svg>
                }
              </button>
              <div style={{flex:1}}>
                <div style={{display:'flex',justifyContent:'space-between',fontSize:'12px',color:'var(--text-muted)',marginBottom:'8px'}}>
                  <span>{fmt(Math.round(playTime))}</span><span>{fmt(duration)}</span>
                </div>
                <input type="range" className="audio-progress" min={0} max={duration} step={0.1} value={playTime} onChange={handleSeek} style={{width:'100%'}}/>
              </div>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
              <WaveBars count={20} active={isPlaying} height={28} color="#AAFF00" gap={3}/>
              <span className="text-muted" style={{fontSize:'12px',marginLeft:'8px'}}>{isPlaying?'Playing...':'Paused'}</span>
            </div>
          </div>
          <div className="anim-slide-up anim-d4" style={{display:'grid',gridTemplateColumns:'1fr auto',gap:'12px'}}>
            <button className="btn btn-primary btn-lg btn-full" onClick={goAnalysis}>See My Analysis →</button>
            <button className="btn btn-outline btn-lg" onClick={recordAgain} style={{padding:'18px 24px'}}>Re-record</button>
          </div>
        </>
      )}
    </div>
  </>)
}

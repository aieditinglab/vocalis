'use client'
import {useState} from 'react'
import {useRouter} from 'next/navigation'
import Nav from '@/components/Nav'
import {getSettings,saveSettings} from '@/lib/store'
export default function AuthPage(){
  const [mode,setMode]=useState<'signup'|'login'>('signup')
  const [name,setName]=useState(''),[email,setEmail]=useState(''),[pass,setPass]=useState(''),[err,setErr]=useState('')
  const router=useRouter()
  const submit=()=>{
    if(mode==='signup'&&!name.trim()){setErr('Please enter your first name.');return}
    if(!email.includes('@')){setErr('Please enter a valid email.');return}
    if(pass.length<6){setErr('Password must be at least 6 characters.');return}
    const s=getSettings();saveSettings({...s,name:name||s.name,email});router.push('/record')
  }
  return(<><Nav backHref="/"/>
    <div style={{minHeight:'calc(100vh - 73px)',display:'flex',alignItems:'center',justifyContent:'center',padding:'40px 20px'}}>
      <div style={{width:'100%',maxWidth:'420px'}}>
        <div style={{textAlign:'center',marginBottom:'36px'}}>
          <h1 className="font-display anim-slide-up anim-d1" style={{fontSize:'34px',fontWeight:900,letterSpacing:'-.03em',marginBottom:'8px'}}>{mode==='signup'?'Create your account':'Welcome back'}</h1>
          <p className="text-muted anim-slide-up anim-d2">{mode==='signup'?'Start building your voice today.':'Continue your training.'}</p>
        </div>
        <div className="tab-bar anim-slide-up anim-d3" style={{marginBottom:'28px'}}>
          <button className={`tab-btn ${mode==='signup'?'active':''}`} onClick={()=>{setMode('signup');setErr('')}}>Sign Up</button>
          <button className={`tab-btn ${mode==='login'?'active':''}`} onClick={()=>{setMode('login');setErr('')}}>Log In</button>
        </div>
        <div className="anim-slide-up anim-d4" style={{display:'flex',flexDirection:'column',gap:'16px'}}>
          {mode==='signup'&&<div><label className="input-label">First Name</label><input className="input" type="text" placeholder="What should we call you?" value={name} onChange={e=>setName(e.target.value)}/></div>}
          <div><label className="input-label">Email</label><input className="input" type="email" placeholder="you@email.com" value={email} onChange={e=>setEmail(e.target.value)}/></div>
          <div><label className="input-label">Password</label><input className="input" type="password" placeholder="Min. 6 characters" value={pass} onChange={e=>setPass(e.target.value)} onKeyDown={e=>e.key==='Enter'&&submit()}/></div>
          {err&&<p style={{color:'var(--hot)',fontSize:'13px'}}>{err}</p>}
          <button className="btn btn-primary btn-full" onClick={submit} style={{padding:'18px',fontSize:'16px',marginTop:'8px'}}>{mode==='signup'?'Create Account →':'Log In →'}</button>
        </div>
        <p className="text-muted" style={{textAlign:'center',marginTop:'20px',fontSize:'13px'}}>Free forever for students. No credit card needed.</p>
      </div>
    </div>
  </>)
}

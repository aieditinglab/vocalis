'use client'
import {useState,useEffect} from 'react'
import {useRouter} from 'next/navigation'
import Nav from '@/components/Nav'
import AvatarDisplay from '@/components/AvatarDisplay'
import {getAvatar,saveAvatar,getTokenBalance,spendTokens,getPurchasedItems,purchaseItem,hasItem} from '@/lib/store'
import {AVATAR_SHOP_ITEMS} from '@/lib/types'
import type {AvatarConfig} from '@/lib/types'

type Tab='skin'|'hair'|'accessory'|'outfit'|'background'
const TAB_LABELS:Record<Tab,string>={skin:'Skin Color',hair:'Hair',accessory:'Accessories',outfit:'Outfit',background:'Background'}

export default function AvatarPage(){
  const router=useRouter()
  const [avatar,setAvatar]=useState<AvatarConfig|null>(null)
  const [tokens,setTokens]=useState(0)
  const [owned,setOwned]=useState<string[]>([])
  const [tab,setTab]=useState<Tab>('skin')
  const [msg,setMsg]=useState('')
  const [saved,setSaved]=useState(false)

  useEffect(()=>{
    setAvatar(getAvatar());setTokens(getTokenBalance());setOwned(getPurchasedItems())
  },[])

  const showMsg=(m:string)=>{setMsg(m);setTimeout(()=>setMsg(''),2200)}

  const handleBuy=(itemId:string,price:number)=>{
    if(price===0){purchaseItem(itemId);setOwned(getPurchasedItems());return}
    if(!spendTokens(price,`Bought avatar item ${itemId}`)){showMsg('Not enough tokens!');return}
    purchaseItem(itemId);setOwned(getPurchasedItems());setTokens(getTokenBalance());showMsg(`Purchased! 🎉`)
  }

  const handleEquip=(item:any)=>{
    if(!avatar)return
    if(!owned.includes(item.id)&&item.price>0){handleBuy(item.id,item.price);return}
    if(!owned.includes(item.id))handleBuy(item.id,0)
    let updated={...avatar}
    if(item.category==='skin')         updated={...updated,skinColor:item.value as string}
    else if(item.category==='hair'&&typeof item.value==='number') updated={...updated,hairStyle:item.value}
    else if(item.category==='hair'&&typeof item.value==='string') updated={...updated,hairColor:item.value}
    else if(item.category==='accessory') updated={...updated,accessory:item.value as number}
    else if(item.category==='outfit')    updated={...updated,outfitColor:item.value as string}
    else if(item.category==='background')updated={...updated,bgColor:item.value as string}
    setAvatar(updated)
    setSaved(false)
  }

  const handleSave=()=>{
    if(!avatar)return
    saveAvatar(avatar);setSaved(true);showMsg('Avatar saved! ✓');setTimeout(()=>setSaved(false),2000)
  }

  const tabItems=AVATAR_SHOP_ITEMS.filter(i=>i.category===tab||(tab==='hair'&&i.category==='hair'))

  const isEquipped=(item:any)=>{
    if(!avatar)return false
    if(item.category==='skin')return avatar.skinColor===item.value
    if(item.category==='hair'&&typeof item.value==='number')return avatar.hairStyle===item.value
    if(item.category==='hair'&&typeof item.value==='string')return avatar.hairColor===item.value
    if(item.category==='accessory')return avatar.accessory===item.value
    if(item.category==='outfit')return avatar.outfitColor===item.value
    if(item.category==='background')return avatar.bgColor===item.value
    return false
  }

  if(!avatar)return null

  return(<>
    <Nav showApp/>
    <div className="container-lg">
      <p className="eyebrow anim-slide-up anim-d1">AVATAR SHOP</p>
      <div style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between',flexWrap:'wrap',gap:'12px',marginBottom:'32px'}}>
        <h1 className="font-display anim-slide-up anim-d2" style={{fontSize:'clamp(32px,5vw,52px)',fontWeight:900,letterSpacing:'-.04em'}}>Build your look.</h1>
        <div style={{display:'flex',gap:'10px',alignItems:'center'}}>
          <div style={{background:'rgba(170,255,0,.06)',border:'1px solid rgba(170,255,0,.15)',borderRadius:'100px',padding:'8px 18px',display:'flex',alignItems:'center',gap:'8px'}}>
            <span>🪙</span><span className="font-display" style={{fontSize:'20px',fontWeight:900,color:'var(--accent)'}}>{tokens}</span>
          </div>
        </div>
      </div>

      {msg&&<div style={{background:'rgba(170,255,0,.08)',border:'1px solid rgba(170,255,0,.2)',borderRadius:'12px',padding:'12px 20px',marginBottom:'20px',fontSize:'14px',color:'var(--accent)',textAlign:'center'}}>{msg}</div>}

      <div style={{display:'grid',gridTemplateColumns:'300px 1fr',gap:'32px',alignItems:'start'}}>
        {/* Avatar preview */}
        <div style={{position:'sticky',top:'90px'}}>
          <div className="card" style={{padding:'32px',textAlign:'center',marginBottom:'12px'}}>
            <div style={{display:'flex',justifyContent:'center',marginBottom:'16px'}}>
              <AvatarDisplay config={avatar} size={160}/>
            </div>
            <p style={{fontWeight:600,fontSize:'14px',marginBottom:'4px'}}>Your Avatar</p>
            <p className="text-muted" style={{fontSize:'12px',marginBottom:'16px'}}>Equip items, then save</p>
            <button className="btn btn-primary btn-full" onClick={handleSave} style={{marginBottom:'8px'}}>
              {saved?'✓ Saved!':'Save Avatar'}
            </button>
            <p className="text-muted" style={{fontSize:'11px'}}>Start with 50 free tokens — earn more by recording sessions and playing games.</p>
          </div>
          {/* Owned count */}
          <div className="card" style={{padding:'16px',textAlign:'center'}}>
            <div className="font-display" style={{fontSize:'28px',fontWeight:900,color:'var(--accent)'}}>{owned.length}</div>
            <div style={{fontSize:'13px',color:'var(--text-muted)'}}>items owned</div>
          </div>
        </div>

        {/* Shop */}
        <div>
          {/* Category tabs */}
          <div style={{display:'flex',gap:'8px',flexWrap:'wrap',marginBottom:'24px'}}>
            {(Object.keys(TAB_LABELS) as Tab[]).map(t=>(
              <button key={t} onClick={()=>setTab(t)}
                style={{padding:'8px 18px',borderRadius:'100px',border:'1px solid',fontSize:'13px',fontWeight:600,cursor:'pointer',fontFamily:'var(--font-body)',transition:'all .2s',
                  borderColor:tab===t?'var(--accent)':'var(--border-light)',
                  background:tab===t?'rgba(170,255,0,.08)':'transparent',
                  color:tab===t?'var(--accent)':'var(--text-muted)'}}>
                {TAB_LABELS[t]}
              </button>
            ))}
          </div>

          {/* Items grid */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(120px,1fr))',gap:'12px'}}>
            {tabItems.map(item=>{
              const ownedItem=owned.includes(item.id)
              const equipped=isEquipped(item)
              return(
                <div key={item.id} className={`shop-item ${equipped?'equipped':ownedItem?'owned':''}`}
                  onClick={()=>handleEquip(item)}>
                  {/* Preview */}
                  <div style={{marginBottom:'10px',display:'flex',justifyContent:'center'}}>
                    {item.category==='skin'&&<div style={{width:'40px',height:'40px',borderRadius:'50%',background:item.preview}}/>}
                    {item.category==='hair'&&typeof item.value==='string'&&<div style={{width:'40px',height:'40px',borderRadius:'50%',background:item.preview}}/>}
                    {item.category==='hair'&&typeof item.value==='number'&&<div style={{fontSize:'28px',lineHeight:'40px'}}>{['📃','〜','🌀','📏','🔙'][item.value as number]||'✂️'}</div>}
                    {item.category==='accessory'&&<div style={{fontSize:'28px',lineHeight:'40px'}}>{['◻️','👓','🧢','🎧','👑'][item.value as number]||'🔲'}</div>}
                    {item.category==='outfit'&&<div style={{width:'40px',height:'40px',borderRadius:'8px',background:item.preview}}/>}
                    {item.category==='background'&&<div style={{width:'40px',height:'40px',borderRadius:'8px',background:item.preview,border:'1px solid var(--border)'}}/>}
                  </div>
                  <div style={{fontSize:'12px',fontWeight:600,marginBottom:'4px'}}>{item.label}</div>
                  {equipped
                    ?<div style={{fontSize:'11px',color:'var(--accent)',fontWeight:700}}>Equipped ✓</div>
                    :ownedItem
                    ?<div style={{fontSize:'11px',color:'var(--text-muted)'}}>Tap to equip</div>
                    :<div style={{fontSize:'11px',color:'var(--amber)',fontWeight:700}}>{item.price} 🪙</div>
                  }
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  </>)
}

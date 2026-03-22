'use client'
import { useState, useEffect } from 'react'
import Nav from '@/components/Nav'
import AvatarDisplay from '@/components/AvatarDisplay'
import { getAvatar, saveAvatar, getTokenBalance, spendTokens, getPurchasedItems, purchaseItem } from '@/lib/db'
import { AVATAR_SHOP_ITEMS, RARITY_CONFIG, type AvatarConfig, type AvatarShopItem, type ItemRarity } from '@/lib/types'

type Tab = 'skin' | 'hair' | 'accessory' | 'outfit' | 'background'
const TABS: { key: Tab; label: string; emoji: string }[] = [
  { key: 'skin',       label: 'Skin',        emoji: '🎨' },
  { key: 'hair',       label: 'Hair',        emoji: '✂️' },
  { key: 'accessory',  label: 'Accessories', emoji: '👑' },
  { key: 'outfit',     label: 'Outfit',      emoji: '👕' },
  { key: 'background', label: 'Background',  emoji: '🌌' },
]

export default function AvatarPage() {
  const [avatar,       setAvatar]       = useState<AvatarConfig | null>(null)
  const [previewAvatar, setPreviewAvatar] = useState<AvatarConfig | null>(null)
  const [tokens,       setTokens]       = useState(0)
  const [owned,        setOwned]        = useState<string[]>([])
  const [tab,          setTab]          = useState<Tab>('skin')
  const [msg,          setMsg]          = useState('')
  const [msgType,      setMsgType]      = useState<'success' | 'error'>('success')
  const [saved,        setSaved]        = useState(false)
  const [confirmItem,  setConfirmItem]  = useState<AvatarShopItem | null>(null)
  const [loading,      setLoading]      = useState(true)
  const [saving,       setSaving]       = useState(false)
  const [rarityFilter, setRarityFilter] = useState<ItemRarity | 'all'>('all')

  useEffect(() => {
    const load = async () => {
      const [av, bal, ownedItems] = await Promise.all([
        getAvatar(), getTokenBalance(), getPurchasedItems()
      ])
      setAvatar(av)
      setTokens(bal)
      setOwned(ownedItems)
      setLoading(false)
    }
    load()
  }, [])

  const showMsg = (m: string, type: 'success' | 'error' = 'success') => {
    setMsg(m); setMsgType(type)
    setTimeout(() => setMsg(''), 2400)
  }

  const applyItemToConfig = (config: AvatarConfig, item: AvatarShopItem): AvatarConfig => {
    const updated = { ...config }
    if (item.category === 'skin')       updated.skinColor   = item.value as string
    if (item.category === 'hair' && typeof item.value === 'number') updated.hairStyle = item.value
    if (item.category === 'hair' && typeof item.value === 'string') updated.hairColor = item.value
    if (item.category === 'accessory')  updated.accessory   = item.value as number
    if (item.category === 'outfit')     updated.outfitColor = item.value as string
    if (item.category === 'background') updated.bgColor     = item.value as string
    return updated
  }

  const handlePreview = (item: AvatarShopItem) => {
    if (!avatar) return
    setPreviewAvatar(applyItemToConfig(avatar, item))
  }

  const clearPreview = () => setPreviewAvatar(null)

  const handleEquip = (item: AvatarShopItem) => {
    if (!avatar) return
    const isOwned = owned.includes(item.id)

    if (!isOwned && item.price > 0) {
      setConfirmItem(item)
      return
    }

    if (!isOwned) {
      purchaseItem(item.id)
      setOwned(prev => [...prev, item.id])
    }

    const updated = applyItemToConfig(avatar, item)
    setAvatar(updated)
    setPreviewAvatar(null)
    setSaved(false)
  }

  const handleBuyAndEquip = async () => {
    if (!confirmItem || !avatar) return
    if (tokens < confirmItem.price) {
      showMsg('Not enough tokens! Complete sessions to earn more. 🎤', 'error')
      setConfirmItem(null)
      return
    }
    const ok = await spendTokens(confirmItem.price)
    if (!ok) { showMsg('Not enough tokens!', 'error'); setConfirmItem(null); return }
    await purchaseItem(confirmItem.id)
    const newBal = await getTokenBalance()
    setTokens(newBal)
    setOwned(prev => [...prev, confirmItem.id])
    const updated = applyItemToConfig(avatar, confirmItem)
    setAvatar(updated)
    setPreviewAvatar(null)
    setSaved(false)
    showMsg(`${confirmItem.label} equipped! 🎉`)
    setConfirmItem(null)
  }

  const handleSave = async () => {
    if (!avatar || saving) return
    setSaving(true)
    await saveAvatar(avatar)
    setSaved(true)
    setSaving(false)
    showMsg('Avatar saved! ✓')
    setTimeout(() => setSaved(false), 2000)
  }

  const isEquipped = (item: AvatarShopItem): boolean => {
    if (!avatar) return false
    if (item.category === 'skin')       return avatar.skinColor   === item.value
    if (item.category === 'hair' && typeof item.value === 'number') return avatar.hairStyle === item.value
    if (item.category === 'hair' && typeof item.value === 'string') return avatar.hairColor === item.value
    if (item.category === 'accessory')  return avatar.accessory   === item.value
    if (item.category === 'outfit')     return avatar.outfitColor === item.value
    if (item.category === 'background') return avatar.bgColor     === item.value
    return false
  }

  const tabItems = AVATAR_SHOP_ITEMS.filter(i => {
    const catMatch = i.category === tab || (tab === 'hair' && i.category === 'hair')
    const rarityMatch = rarityFilter === 'all' || i.rarity === rarityFilter
    return catMatch && rarityMatch
  })

  const displayAvatar = previewAvatar || avatar

  if (loading) return (
    <>
      <Nav showApp />
      <div className="container" style={{ textAlign: 'center', paddingTop: '80px' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>✦</div>
        <p className="text-muted">Loading your avatar...</p>
      </div>
    </>
  )

  if (!avatar || !displayAvatar) return null

  return (
    <>
      <Nav showApp />
      <div className="container-lg">

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '32px' }}>
          <div>
            <p className="eyebrow anim-slide-up anim-d1">AVATAR SHOP</p>
            <h1 className="font-display anim-slide-up anim-d2" style={{ fontSize: 'clamp(28px,5vw,48px)', fontWeight: 900, letterSpacing: '-.04em' }}>
              Build your look.
            </h1>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <div style={{ background: 'rgba(170,255,0,.06)', border: '1px solid rgba(170,255,0,.2)', borderRadius: '100px', padding: '8px 18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🪙</span>
              <span className="font-display" style={{ fontSize: '20px', fontWeight: 900, color: 'var(--accent)' }}>{tokens}</span>
            </div>
          </div>
        </div>

        {/* Toast */}
        {msg && (
          <div style={{
            background: msgType === 'success' ? 'rgba(170,255,0,.08)' : 'rgba(255,48,84,.08)',
            border: `1px solid ${msgType === 'success' ? 'rgba(170,255,0,.25)' : 'rgba(255,48,84,.25)'}`,
            borderRadius: '12px', padding: '12px 20px', marginBottom: '20px',
            fontSize: '14px', fontWeight: 600,
            color: msgType === 'success' ? 'var(--accent)' : 'var(--hot)',
            textAlign: 'center',
          }}>{msg}</div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '28px', alignItems: 'start' }}>

          {/* ── Left panel: Avatar preview ─────────────────────── */}
          <div style={{ position: 'sticky', top: '88px' }}>
            <div className="dash-card" style={{ padding: '28px', textAlign: 'center', marginBottom: '12px' }}>

              {previewAvatar && (
                <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '.08em', color: 'var(--amber)', marginBottom: '10px', background: 'rgba(255,184,0,.08)', border: '1px solid rgba(255,184,0,.2)', borderRadius: '8px', padding: '4px 10px', display: 'inline-block' }}>
                  PREVIEW
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
                <AvatarDisplay config={displayAvatar} size={160} />
              </div>

              <p style={{ fontWeight: 700, fontSize: '14px', marginBottom: '4px' }}>Your Avatar</p>
              <p className="text-muted" style={{ fontSize: '12px', marginBottom: '16px' }}>
                {previewAvatar ? 'Previewing item — click to equip' : 'Click items to preview & equip'}
              </p>

              {previewAvatar && (
                <button className="btn btn-outline btn-full" onClick={clearPreview} style={{ marginBottom: '8px', fontSize: '13px' }}>
                  Clear Preview
                </button>
              )}

              <button
                className="btn btn-primary btn-full"
                onClick={handleSave}
                disabled={saving || saved}
                style={{ opacity: saving ? 0.7 : 1 }}
              >
                {saving ? 'Saving...' : saved ? '✓ Saved!' : 'Save Avatar'}
              </button>

              <p className="text-muted" style={{ fontSize: '11px', marginTop: '12px', lineHeight: 1.5 }}>
                Earn tokens by completing sessions and playing games.
              </p>
            </div>

            {/* Owned count */}
            <div className="dash-card" style={{ padding: '16px', textAlign: 'center' }}>
              <div className="font-display" style={{ fontSize: '28px', fontWeight: 900, color: 'var(--accent)' }}>{owned.length}</div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>items owned</div>
            </div>
          </div>

          {/* ── Right panel: Shop ──────────────────────────────── */}
          <div>

            {/* Category tabs */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
              {TABS.map(t => (
                <button key={t.key} onClick={() => { setTab(t.key); setRarityFilter('all') }}
                  style={{
                    padding: '8px 16px', borderRadius: '100px', fontSize: '13px', fontWeight: 600,
                    cursor: 'pointer', fontFamily: 'var(--font-body)', transition: 'all .2s',
                    border: '1px solid',
                    borderColor: tab === t.key ? 'var(--accent)' : 'var(--border-light)',
                    background: tab === t.key ? 'rgba(170,255,0,.08)' : 'transparent',
                    color: tab === t.key ? 'var(--accent)' : 'var(--text-muted)',
                  }}>
                  {t.emoji} {t.label}
                </button>
              ))}
            </div>

            {/* Rarity filter */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '20px' }}>
              {(['all', 'common', 'rare', 'epic', 'legendary'] as const).map(r => {
                const cfg = r === 'all' ? null : RARITY_CONFIG[r]
                return (
                  <button key={r} onClick={() => setRarityFilter(r)}
                    style={{
                      padding: '5px 12px', borderRadius: '100px', fontSize: '11px', fontWeight: 700,
                      cursor: 'pointer', fontFamily: 'var(--font-body)', transition: 'all .2s',
                      letterSpacing: '.05em',
                      border: `1px solid ${rarityFilter === r ? (cfg?.border || 'var(--accent)') : 'var(--border)'}`,
                      background: rarityFilter === r ? (cfg?.bg || 'rgba(170,255,0,.08)') : 'transparent',
                      color: rarityFilter === r ? (cfg?.color || 'var(--accent)') : 'var(--text-muted)',
                    }}>
                    {r === 'all' ? 'ALL' : RARITY_CONFIG[r].label}
                  </button>
                )
              })}
            </div>

            {/* Items grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '10px' }}>
              {tabItems.map(item => {
                const isOwned    = owned.includes(item.id)
                const equipped   = isEquipped(item)
                const rCfg       = RARITY_CONFIG[item.rarity]
                const isLegendary = item.rarity === 'legendary'

                return (
                  <div
                    key={item.id}
                    onClick={() => handleEquip(item)}
                    onMouseEnter={() => handlePreview(item)}
                    onMouseLeave={clearPreview}
                    style={{
                      background: equipped ? 'rgba(170,255,0,.08)' : 'var(--card)',
                      border: `1px solid ${equipped ? 'rgba(170,255,0,.35)' : isLegendary && !isOwned ? 'rgba(255,215,0,.2)' : 'var(--border)'}`,
                      borderRadius: '16px',
                      padding: '14px 12px',
                      cursor: 'pointer',
                      transition: 'all .15s',
                      position: 'relative',
                      overflow: 'hidden',
                      boxShadow: isLegendary && !isOwned ? '0 0 12px rgba(255,215,0,0.08)' : 'none',
                    }}
                  >
                    {/* Rarity badge */}
                    <div style={{
                      position: 'absolute', top: '8px', right: '8px',
                      fontSize: '9px', fontWeight: 700, letterSpacing: '.05em',
                      color: rCfg.color, background: rCfg.bg,
                      border: `1px solid ${rCfg.border}`,
                      borderRadius: '6px', padding: '2px 5px',
                    }}>
                      {rCfg.label}
                    </div>

                    {/* Lock icon if not owned and costs tokens */}
                    {!isOwned && item.price > 0 && (
                      <div style={{ position: 'absolute', top: '8px', left: '8px', fontSize: '12px', opacity: 0.5 }}>
                        🔒
                      </div>
                    )}

                    {/* Preview swatch */}
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px', marginTop: '8px' }}>
                      {(item.category === 'skin' || (item.category === 'hair' && typeof item.value === 'string') || item.category === 'outfit') && (
                        <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: item.preview, border: '2px solid var(--border)' }}/>
                      )}
                      {item.category === 'background' && (
                        <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: item.preview, border: '2px solid var(--border)', opacity: 0.9 }}/>
                      )}
                      {item.category === 'hair' && typeof item.value === 'number' && (
                        <div style={{ fontSize: '30px', lineHeight: '44px' }}>
                          {['✂️','〜','🌀','⬇️','🎀','🍡','⚡','🪢','✨'][item.value as number] || '💇'}
                        </div>
                      )}
                      {item.category === 'accessory' && (
                        <div style={{ fontSize: '30px', lineHeight: '44px' }}>
                          {[' ','👓','🧢','☀️','👂','🎧','👑'][(item.value as number)] || '❓'}
                        </div>
                      )}
                    </div>

                    {/* Label */}
                    <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '4px', textAlign: 'center' }}>
                      {item.label}
                    </div>

                    {/* Status */}
                    <div style={{ textAlign: 'center' }}>
                      {equipped ? (
                        <span style={{ fontSize: '11px', color: 'var(--accent)', fontWeight: 700 }}>Equipped ✓</span>
                      ) : isOwned ? (
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Tap to equip</span>
                      ) : item.price === 0 ? (
                        <span style={{ fontSize: '11px', color: 'var(--accent)', fontWeight: 600 }}>Free</span>
                      ) : (
                        <span style={{ fontSize: '11px', color: rCfg.color, fontWeight: 700 }}>{item.price} 🪙</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── Purchase Confirmation Modal ──────────────────────── */}
      {confirmItem && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 999, padding: '20px',
        }}
          onClick={() => setConfirmItem(null)}
        >
          <div style={{
            background: 'var(--card)', border: '1px solid var(--border)',
            borderRadius: '24px', padding: '32px', maxWidth: '360px', width: '100%',
            textAlign: 'center',
          }}
            onClick={e => e.stopPropagation()}
          >
            {/* Rarity badge */}
            {(() => {
              const rCfg = RARITY_CONFIG[confirmItem.rarity]
              return (
                <div style={{ display: 'inline-block', fontSize: '11px', fontWeight: 700, letterSpacing: '.07em', color: rCfg.color, background: rCfg.bg, border: `1px solid ${rCfg.border}`, borderRadius: '8px', padding: '4px 10px', marginBottom: '16px' }}>
                  {rCfg.label}
                </div>
              )
            })()}

            <h2 className="font-display" style={{ fontSize: '24px', fontWeight: 900, marginBottom: '8px' }}>
              {confirmItem.label}
            </h2>

            {confirmItem.description && (
              <p className="text-muted" style={{ fontSize: '14px', marginBottom: '20px' }}>
                {confirmItem.description}
              </p>
            )}

            <div style={{ background: 'var(--card2)', border: '1px solid var(--border)', borderRadius: '14px', padding: '16px', marginBottom: '24px' }}>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px' }}>Cost</div>
              <div className="font-display" style={{ fontSize: '32px', fontWeight: 900, color: 'var(--accent)' }}>
                {confirmItem.price} 🪙
              </div>
              <div style={{ fontSize: '12px', color: tokens >= confirmItem.price ? 'var(--text-muted)' : 'var(--hot)', marginTop: '4px' }}>
                Your balance: {tokens} tokens {tokens < confirmItem.price ? '(not enough)' : ''}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn btn-outline btn-full" onClick={() => setConfirmItem(null)}>
                Cancel
              </button>
              <button
                className="btn btn-primary btn-full"
                onClick={handleBuyAndEquip}
                disabled={tokens < confirmItem.price}
                style={{ opacity: tokens < confirmItem.price ? 0.5 : 1 }}
              >
                Buy & Equip
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

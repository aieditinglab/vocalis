'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Nav from '@/components/Nav'
import { PROMPTS } from '@/lib/types'
import { setPendingSession } from '@/lib/db'

const CATS = [
  { key: 'Job Interviews',        icon: '💼', desc: 'Interview prep and pitch practice', allowFiles: false },
  { key: 'College Interviews',    icon: '🎓', desc: 'Common admissions questions', allowFiles: false },
  { key: 'School Presentations',  icon: '📚', desc: 'Upload your script, slides, or rubric', allowFiles: true },
  { key: 'Public Speaking',       icon: '🎤', desc: 'Presentations, debates, and speeches', allowFiles: true },
  { key: 'My Own Prompt',         icon: '✏️', desc: 'Upload your own content to practice with', allowFiles: true },
]

export default function RecordPage() {
  const router = useRouter()
  const [selected, setSelected] = useState<string | null>(null)
  const [promptIdx, setPromptIdx] = useState(0)
  const [custom, setCustom] = useState('')
  const [script, setScript] = useState('')
  const [rubric, setRubric] = useState('')
  const [uploadedFileName, setUploadedFileName] = useState('')
  const [rubricFileName, setRubricFileName] = useState('')
  const [uploadLoading, setUploadLoading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const rubricRef = useRef<HTMLInputElement>(null)

  const selectedCat = CATS.find(c => c.key === selected)
  const prompts = selected ? PROMPTS[selected] || [] : []
  const currentPrompt = selected === 'My Own Prompt' ? custom : (prompts[promptIdx] || '')
  const canStart = selected && (selected !== 'My Own Prompt' || custom.trim())

  const readFile = async (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve(e.target?.result as string || '')
      if (file.type === 'application/pdf') {
        // For PDF, just note it was uploaded — full parsing needs server
        resolve(`[PDF uploaded: ${file.name}]`)
      } else {
        reader.readAsText(file)
      }
    })
  }

  const handleScriptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadLoading(true)
    setUploadedFileName(file.name)
    const text = await readFile(file)
    setScript(text)
    setUploadLoading(false)
  }

  const handleRubricUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setRubricFileName(file.name)
    const text = await readFile(file)
    setRubric(text)
  }

  const handleStart = () => {
    if (!canStart) return
    setPendingSession({
      category: selected!,
      prompt: currentPrompt,
      uploadedScript: script || '',
      rubric: rubric || '',
    })
    router.push('/record/session')
  }

  return (
    <>
      <Nav showApp />
      <div className="container">
        <p className="eyebrow anim-slide-up anim-d1">STEP 1 OF 5 — VOICE</p>
        <h1 className="font-display anim-slide-up anim-d2" style={{ fontSize: 'clamp(38px,5vw,52px)', fontWeight: 900, letterSpacing: '-.04em', marginBottom: '8px' }}>
          Pick a category.
        </h1>
        <p className="text-muted anim-slide-up anim-d2" style={{ fontSize: '16px', marginBottom: '32px' }}>
          What are you practicing for today?
        </p>

        {/* Category grid */}
        <div className="anim-slide-up anim-d3" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '28px' }}>
          {CATS.map(cat => (
            <button key={cat.key} className={`cat-card ${selected === cat.key ? 'selected' : ''}`}
              onClick={() => { setSelected(cat.key); setPromptIdx(0); setScript(''); setRubric('') }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '28px' }}>{cat.icon}</span>
                {cat.allowFiles && <span style={{ fontSize: '11px', background: 'rgba(170,255,0,.1)', color: 'var(--accent)', padding: '3px 8px', borderRadius: '100px', fontWeight: 700 }}>📎 Upload</span>}
              </div>
              <span style={{ fontWeight: 600, fontSize: '16px', textAlign: 'left' }}>{cat.key}</span>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'left' }}>{cat.desc}</span>
            </button>
          ))}
        </div>

        {/* Prompt selector */}
        {selected && selected !== 'My Own Prompt' && (
          <div className="anim-slide-up anim-d1" style={{ marginBottom: '20px' }}>
            <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '.1em', color: 'var(--text-muted)', marginBottom: '12px' }}>YOUR PROMPT</p>
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px', marginBottom: '12px' }}>
              <p style={{ fontSize: '18px', fontWeight: 600, letterSpacing: '-.02em', lineHeight: 1.4 }}>&ldquo;{currentPrompt}&rdquo;</p>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {prompts.map((_, i) => (
                <button key={i} onClick={() => setPromptIdx(i)}
                  style={{ padding: '6px 14px', borderRadius: '100px', border: '1px solid', fontSize: '12px', cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: 600,
                    borderColor: i === promptIdx ? 'var(--accent)' : 'var(--border-light)',
                    background: i === promptIdx ? 'rgba(170,255,0,.08)' : 'transparent',
                    color: i === promptIdx ? 'var(--accent)' : 'var(--text-muted)' }}>
                  Prompt {i + 1}
                </button>
              ))}
            </div>
          </div>
        )}

        {selected === 'My Own Prompt' && (
          <div className="anim-slide-up anim-d1" style={{ marginBottom: '20px' }}>
            <label className="input-label">Your prompt or topic</label>
            <input className="input" type="text" placeholder="e.g. Tell me about a challenge you overcame..." value={custom} onChange={e => setCustom(e.target.value)} />
          </div>
        )}

        {/* File uploads for relevant categories */}
        {selected && selectedCat?.allowFiles && (
          <div className="anim-slide-up anim-d2" style={{ marginBottom: '24px' }}>
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '20px', padding: '24px' }}>
              <p style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '.08em', color: 'var(--accent)', marginBottom: '16px' }}>📎 UPLOAD MATERIALS (OPTIONAL)</p>
              <p className="text-muted" style={{ fontSize: '13px', marginBottom: '20px', lineHeight: 1.6 }}>
                Upload your script, notes, or slides — the AI will compare what you say to what you prepared. Upload your rubric and the AI grades you against it.
              </p>

              {/* Script/Notes upload */}
              <div style={{ marginBottom: '16px' }}>
                <p style={{ fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>Script / Notes / Slides</p>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <button
                    onClick={() => fileRef.current?.click()}
                    style={{ padding: '10px 18px', borderRadius: '12px', border: '1px solid var(--border-light)', background: 'var(--card2)', color: 'var(--text-primary)', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600, transition: 'all .2s' }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border-light)')}
                  >
                    {uploadLoading ? 'Reading...' : '📄 Upload File'}
                  </button>
                  {uploadedFileName && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--accent)' }}>
                      <span>✓</span><span>{uploadedFileName}</span>
                      <button onClick={() => { setScript(''); setUploadedFileName('') }} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '16px' }}>×</button>
                    </div>
                  )}
                  <input ref={fileRef} type="file" accept=".txt,.md,.pdf,.doc,.docx" style={{ display: 'none' }} onChange={handleScriptUpload} />
                </div>
                {!uploadedFileName && (
                  <div style={{ marginTop: '10px' }}>
                    <label className="input-label">Or paste your script here</label>
                    <textarea
                      style={{ background: 'var(--card2)', border: '1px solid var(--border)', borderRadius: '12px', padding: '12px 14px', color: 'var(--text-primary)', fontFamily: 'var(--font-body)', fontSize: '14px', width: '100%', minHeight: '80px', resize: 'vertical', outline: 'none' }}
                      placeholder="Paste your script, notes, or talking points..."
                      value={script}
                      onChange={e => setScript(e.target.value)}
                    />
                  </div>
                )}
              </div>

              {/* Rubric upload - especially for School Presentations */}
              <div>
                <p style={{ fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>
                  Rubric / Grading Criteria
                  {selected === 'School Presentations' && <span style={{ color: 'var(--accent)', marginLeft: '6px', fontSize: '11px' }}>Recommended</span>}
                </p>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <button
                    onClick={() => rubricRef.current?.click()}
                    style={{ padding: '10px 18px', borderRadius: '12px', border: '1px solid var(--border-light)', background: 'var(--card2)', color: 'var(--text-primary)', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600 }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border-light)')}
                  >
                    📋 Upload Rubric
                  </button>
                  {rubricFileName && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--accent)' }}>
                      <span>✓</span><span>{rubricFileName}</span>
                      <button onClick={() => { setRubric(''); setRubricFileName('') }} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '16px' }}>×</button>
                    </div>
                  )}
                  <input ref={rubricRef} type="file" accept=".txt,.md,.pdf,.doc,.docx" style={{ display: 'none' }} onChange={handleRubricUpload} />
                </div>
                {!rubricFileName && (
                  <div style={{ marginTop: '10px' }}>
                    <textarea
                      style={{ background: 'var(--card2)', border: '1px solid var(--border)', borderRadius: '12px', padding: '12px 14px', color: 'var(--text-primary)', fontFamily: 'var(--font-body)', fontSize: '14px', width: '100%', minHeight: '60px', resize: 'vertical', outline: 'none' }}
                      placeholder="Paste your rubric or grading criteria..."
                      value={rubric}
                      onChange={e => setRubric(e.target.value)}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <button className="btn btn-primary btn-full btn-lg anim-slide-up anim-d4"
          onClick={handleStart}
          disabled={!canStart}
          style={{ opacity: canStart ? 1 : 0.4 }}>
          Start Recording →
        </button>
      </div>
    </>
  )
}

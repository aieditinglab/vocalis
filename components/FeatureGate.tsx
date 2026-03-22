'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getFeatureFlag } from '@/lib/admin'

interface FeatureGateProps {
  featureId: string
  children: React.ReactNode
}

export default function FeatureGate({ featureId, children }: FeatureGateProps) {
  const router = useRouter()
  const [enabled, setEnabled] = useState<boolean | null>(null)

  useEffect(() => {
    getFeatureFlag(featureId).then(setEnabled)
  }, [featureId])

  if (enabled === null) return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontSize: '32px' }}>✦</div>
    </div>
  )

  if (!enabled) return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
      <div style={{ maxWidth: '420px', textAlign: 'center' }}>
        <div style={{ fontSize: '64px', marginBottom: '24px' }}>🔧</div>
        <h1 style={{ fontSize: '28px', fontWeight: 900, letterSpacing: '-.03em', marginBottom: '12px' }}>
          Temporarily Unavailable
        </h1>
        <p style={{ fontSize: '16px', color: 'var(--text-muted)', lineHeight: 1.65, marginBottom: '28px' }}>
          This feature is currently under maintenance. We&apos;re working on improvements — check back soon.
        </p>
        <div style={{ background: 'rgba(170,255,0,.06)', border: '1px solid rgba(170,255,0,.15)', borderRadius: '16px', padding: '16px 20px', marginBottom: '24px', fontSize: '14px', color: 'var(--text-muted)' }}>
          🛠 Our team has been notified and is working on a fix.
        </div>
        <button
          onClick={() => router.push('/dashboard')}
          className="btn btn-primary btn-lg"
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  )

  return <>{children}</>
}
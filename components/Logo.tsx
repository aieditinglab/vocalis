interface LogoProps {
  size?: number
  showText?: boolean
  textSize?: number
}

export default function Logo({ size = 36, showText = true, textSize = 16 }: LogoProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <svg width={size} height={size} viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
        <rect width="44" height="44" rx="11" fill="#AAFF00" />
        {/* V-shaped waveform: 6 bars, tallest outside, dips to center */}
        <rect x="4"    y="14" width="4" height="23" rx="2" fill="#0A0A0A" />
        <rect x="10.5" y="20" width="4" height="17" rx="2" fill="#0A0A0A" />
        <rect x="17"   y="27" width="4" height="10" rx="2" fill="#0A0A0A" />
        <rect x="23"   y="27" width="4" height="10" rx="2" fill="#0A0A0A" />
        <rect x="29.5" y="20" width="4" height="17" rx="2" fill="#0A0A0A" />
        <rect x="36"   y="14" width="4" height="23" rx="2" fill="#0A0A0A" />
      </svg>
      {showText && (
        <span style={{ fontFamily:'var(--font-display)', fontSize: textSize, fontWeight:700, letterSpacing:'-0.02em', color:'var(--text-primary)' }}>
          Vocalis
        </span>
      )}
    </div>
  )
}

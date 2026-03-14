import React from 'react'
import type { AvatarConfig } from '@/lib/types'

interface AvatarDisplayProps {
  config: AvatarConfig
  size?: number
}

export default function AvatarDisplay({ config, size = 120 }: AvatarDisplayProps) {
  const { skinColor, hairStyle, hairColor, accessory, outfitColor, bgColor } = config

  const hairPaths: Record<number, React.ReactElement> = {
    // 0: Short/buzzcut
    0: <ellipse cx="50" cy="32" rx="22" ry="10" fill={hairColor} />,
    // 1: Wavy medium
    1: <>
      <path d="M28 32 Q30 18 50 16 Q70 18 72 32 Q68 24 60 22 Q50 20 40 22 Q32 24 28 32Z" fill={hairColor}/>
      <path d="M28 40 Q24 35 26 28 Q28 22 35 20 L32 32Z" fill={hairColor}/>
      <path d="M72 40 Q76 35 74 28 Q72 22 65 20 L68 32Z" fill={hairColor}/>
    </>,
    // 2: Curly/afro
    2: <>
      <circle cx="50" cy="24" r="20" fill={hairColor} />
      <circle cx="32" cy="30" r="8" fill={hairColor} />
      <circle cx="68" cy="30" r="8" fill={hairColor} />
      <circle cx="40" cy="18" r="7" fill={hairColor} />
      <circle cx="60" cy="18" r="7" fill={hairColor} />
    </>,
    // 3: Long straight
    3: <>
      <path d="M28 32 Q26 18 50 15 Q74 18 72 32Z" fill={hairColor}/>
      <rect x="28" y="32" width="8" height="36" rx="4" fill={hairColor}/>
      <rect x="64" y="32" width="8" height="36" rx="4" fill={hairColor}/>
    </>,
    // 4: Ponytail
    4: <>
      <path d="M28 32 Q28 18 50 15 Q72 18 72 32Z" fill={hairColor}/>
      <rect x="56" y="24" width="6" height="28" rx="3" fill={hairColor}/>
      <circle cx="59" cy="54" r="6" fill={hairColor}/>
    </>,
  }

  const accessoryPaths: Record<number, React.ReactElement | null> = {
    0: null,
    // 1: Glasses
    1: <>
      <rect x="32" y="46" width="14" height="10" rx="3" fill="none" stroke="#333" strokeWidth="2.5"/>
      <rect x="54" y="46" width="14" height="10" rx="3" fill="none" stroke="#333" strokeWidth="2.5"/>
      <line x1="46" y1="51" x2="54" y2="51" stroke="#333" strokeWidth="2"/>
      <line x1="32" y1="51" x2="28" y2="50" stroke="#333" strokeWidth="2"/>
      <line x1="68" y1="51" x2="72" y2="50" stroke="#333" strokeWidth="2"/>
    </>,
    // 2: Baseball cap
    2: <>
      <path d="M28 32 Q28 15 50 13 Q72 15 72 32Z" fill={hairColor}/>
      <rect x="24" y="30" width="52" height="8" rx="4" fill={hairColor} opacity="0.9"/>
      <rect x="60" y="35" width="20" height="5" rx="2.5" fill={hairColor} opacity="0.7"/>
      <circle cx="50" cy="18" r="3" fill="#fff" opacity="0.5"/>
    </>,
    // 3: Headphones
    3: <>
      <path d="M30 48 Q28 34 50 32 Q72 34 70 48" fill="none" stroke="#333" strokeWidth="4" strokeLinecap="round"/>
      <rect x="26" y="44" width="10" height="16" rx="5" fill="#333"/>
      <rect x="64" y="44" width="10" height="16" rx="5" fill="#333"/>
      <rect x="27" y="46" width="8" height="12" rx="4" fill={skinColor} opacity="0.6"/>
      <rect x="65" y="46" width="8" height="12" rx="4" fill={skinColor} opacity="0.6"/>
    </>,
    // 4: Crown
    4: <>
      <path d="M30 28 L26 16 L38 24 L50 12 L62 24 L74 16 L70 28Z" fill="#FFD700" stroke="#FFA500" strokeWidth="1.5"/>
      <circle cx="26" cy="16" r="3" fill="#FF3054"/>
      <circle cx="50" cy="12" r="3" fill="#FF3054"/>
      <circle cx="74" cy="16" r="3" fill="#FF3054"/>
    </>,
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 110"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Background */}
      <rect width="100" height="110" rx="16" fill={bgColor} />

      {/* Body / outfit */}
      <ellipse cx="50" cy="108" rx="34" ry="24" fill={outfitColor} />
      <rect x="22" y="88" width="56" height="30" rx="8" fill={outfitColor} />

      {/* Neck */}
      <rect x="43" y="72" width="14" height="20" rx="4" fill={skinColor} />

      {/* Head */}
      <ellipse cx="50" cy="50" rx="24" ry="26" fill={skinColor} />

      {/* Hair (behind face elements) */}
      {hairPaths[hairStyle] || hairPaths[0]}

      {/* Eyes */}
      <ellipse cx="41" cy="48" rx="5" ry="5.5" fill="white"/>
      <ellipse cx="59" cy="48" rx="5" ry="5.5" fill="white"/>
      <circle cx="42" cy="49" r="3" fill="#1a1a1a"/>
      <circle cx="60" cy="49" r="3" fill="#1a1a1a"/>
      <circle cx="43" cy="48" r="1" fill="white"/>
      <circle cx="61" cy="48" r="1" fill="white"/>

      {/* Nose */}
      <ellipse cx="50" cy="57" rx="2.5" ry="1.5" fill={skinColor} stroke="#00000022" strokeWidth="1"/>

      {/* Smile */}
      <path d="M43 63 Q50 69 57 63" stroke="#1a1a1a" strokeWidth="2.5" strokeLinecap="round" fill="none"/>

      {/* Cheek blush */}
      <ellipse cx="36" cy="60" rx="5" ry="3.5" fill={skinColor} opacity="0.4"/>
      <ellipse cx="64" cy="60" rx="5" ry="3.5" fill={skinColor} opacity="0.4"/>

      {/* Accessory (on top) */}
      {accessory !== undefined && accessoryPaths[accessory]}
    </svg>
  )
}

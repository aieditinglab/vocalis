import React from 'react'
import type { AvatarConfig } from '@/lib/types'

interface AvatarDisplayProps {
  config: AvatarConfig
  size?: number
}

export default function AvatarDisplay({ config, size = 120 }: AvatarDisplayProps) {
  const { skinColor, hairStyle, hairColor, accessory, outfitColor, bgColor } = config

  const hairPaths: Record<number, React.ReactElement> = {
    // 0: Buzz cut
    0: <ellipse cx="50" cy="29" rx="23" ry="10" fill={hairColor} />,
    // 1: Wavy
    1: <>
      <path d="M27 35 Q28 15 50 12 Q72 15 73 35 Q67 22 60 20 Q50 17 40 20 Q33 22 27 35Z" fill={hairColor}/>
      <path d="M27 43 Q21 36 23 25 Q27 16 34 14 L30 30Z" fill={hairColor}/>
      <path d="M73 43 Q79 36 77 25 Q73 16 66 14 L70 30Z" fill={hairColor}/>
    </>,
    // 2: Curly / Afro
    2: <>
      <circle cx="50" cy="21" r="20" fill={hairColor}/>
      <circle cx="31" cy="30" r="10" fill={hairColor}/>
      <circle cx="69" cy="30" r="10" fill={hairColor}/>
      <circle cx="39" cy="14" r="9"  fill={hairColor}/>
      <circle cx="61" cy="14" r="9"  fill={hairColor}/>
      <circle cx="50" cy="10" r="9"  fill={hairColor}/>
    </>,
    // 3: Long straight
    3: <>
      <path d="M27 35 Q26 15 50 11 Q74 15 73 35Z" fill={hairColor}/>
      <rect x="25" y="35" width="9" height="46" rx="4.5" fill={hairColor}/>
      <rect x="66" y="35" width="9" height="46" rx="4.5" fill={hairColor}/>
    </>,
    // 4: Ponytail
    4: <>
      <path d="M27 35 Q27 15 50 11 Q73 15 73 35Z" fill={hairColor}/>
      <rect x="58" y="19" width="8" height="34" rx="4" fill={hairColor}/>
      <circle cx="62" cy="55" r="9" fill={hairColor}/>
    </>,
    // 5: Bun
    5: <>
      <path d="M27 35 Q26 18 50 13 Q74 18 73 35Z" fill={hairColor}/>
      <circle cx="50" cy="13" r="13" fill={hairColor}/>
      <circle cx="50" cy="13" r="8"  fill={hairColor} opacity="0.8"/>
    </>,
    // 6: Mohawk
    6: <>
      <rect x="44" y="5" width="12" height="32" rx="6" fill={hairColor}/>
      <path d="M44 28 Q27 30 27 35Z" fill={hairColor}/>
      <path d="M56 28 Q73 30 73 35Z" fill={hairColor}/>
    </>,
    // 7: Braids
    7: <>
      <path d="M27 35 Q26 17 50 13 Q74 17 73 35Z" fill={hairColor}/>
      <rect x="24" y="35" width="9" height="52" rx="4.5" fill={hairColor}/>
      <rect x="67" y="35" width="9" height="52" rx="4.5" fill={hairColor}/>
      {[44, 55, 66, 77].map(y => (
        <React.Fragment key={y}>
          <ellipse cx="28.5" cy={y} rx="3.5" ry="2.5" fill={hairColor} opacity="0.65"/>
          <ellipse cx="71.5" cy={y} rx="3.5" ry="2.5" fill={hairColor} opacity="0.65"/>
        </React.Fragment>
      ))}
    </>,
    // 8: Spiky (Legendary)
    8: <>
      <path d="M27 35 Q26 18 50 13 Q74 18 73 35Z" fill={hairColor}/>
      <path d="M37 24 L31 4  L41 20Z" fill={hairColor}/>
      <path d="M50 15 L47 0  L54 13Z" fill={hairColor}/>
      <path d="M63 24 L69 4  L59 20Z" fill={hairColor}/>
      <path d="M43 19 L39 3  L47 17Z" fill={hairColor}/>
      <path d="M57 19 L61 3  L53 17Z" fill={hairColor}/>
    </>,
  }

  const accessoryPaths: Record<number, React.ReactElement | null> = {
    0: null,
    // 1: Glasses
    1: <>
      <rect x="32" y="47" width="14" height="10" rx="3" fill="none" stroke="#333" strokeWidth="2.5"/>
      <rect x="54" y="47" width="14" height="10" rx="3" fill="none" stroke="#333" strokeWidth="2.5"/>
      <line x1="46" y1="52" x2="54" y2="52" stroke="#333" strokeWidth="2"/>
      <line x1="32" y1="52" x2="27" y2="51" stroke="#333" strokeWidth="2"/>
      <line x1="68" y1="52" x2="73" y2="51" stroke="#333" strokeWidth="2"/>
    </>,
    // 2: Baseball cap
    2: <>
      <path d="M27 35 Q27 14 50 11 Q73 14 73 35Z" fill={hairColor}/>
      <rect x="22" y="33" width="56" height="9" rx="4.5" fill={hairColor} opacity="0.9"/>
      <rect x="60" y="37" width="23" height="6" rx="3" fill={hairColor} opacity="0.75"/>
      <circle cx="50" cy="18" r="3" fill="white" opacity="0.35"/>
    </>,
    // 3: Headphones
    3: <>
      <path d="M29 50 Q27 34 50 31 Q73 34 71 50" fill="none" stroke="#222" strokeWidth="5" strokeLinecap="round"/>
      <rect x="23" y="46" width="12" height="19" rx="6" fill="#222"/>
      <rect x="65" y="46" width="12" height="19" rx="6" fill="#222"/>
      <rect x="25" y="48" width="8" height="15" rx="4" fill={skinColor} opacity="0.45"/>
      <rect x="67" y="48" width="8" height="15" rx="4" fill={skinColor} opacity="0.45"/>
    </>,
    // 4: Crown (Legendary)
    4: <>
      <path d="M29 31 L24 13 L37 24 L50 9 L63 24 L76 13 L71 31Z" fill="#FFD700" stroke="#FFA500" strokeWidth="1.5"/>
      <circle cx="24" cy="13" r="4" fill="#FF3054"/>
      <circle cx="50" cy="9"  r="4" fill="#FF3054"/>
      <circle cx="76" cy="13" r="4" fill="#FF3054"/>
      <circle cx="37" cy="24" r="2.5" fill="#FF3054"/>
      <circle cx="63" cy="24" r="2.5" fill="#FF3054"/>
    </>,
    // 5: Sunglasses
    5: <>
      <rect x="29" y="46" width="18" height="12" rx="6" fill="#111" opacity="0.93"/>
      <rect x="53" y="46" width="18" height="12" rx="6" fill="#111" opacity="0.93"/>
      <line x1="47" y1="52" x2="53" y2="52" stroke="#222" strokeWidth="2.5"/>
      <line x1="29" y1="52" x2="24" y2="50" stroke="#222" strokeWidth="2"/>
      <line x1="71" y1="52" x2="76" y2="50" stroke="#222" strokeWidth="2"/>
      <rect x="29" y="46" width="18" height="12" rx="6" fill={hairColor} opacity="0.2"/>
    </>,
    // 6: Earrings
    6: <>
      <circle cx="25" cy="57" r="4" fill="#FFD700"/>
      <circle cx="25" cy="57" r="2" fill="#FFA500"/>
      <circle cx="75" cy="57" r="4" fill="#FFD700"/>
      <circle cx="75" cy="57" r="2" fill="#FFA500"/>
    </>,
  }

  return (
    <svg width={size} height={size} viewBox="0 0 100 110" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Background */}
      <rect width="100" height="110" rx="18" fill={bgColor}/>

      {/* Body / outfit */}
      <path d="M14 110 Q14 86 50 82 Q86 86 86 110Z" fill={outfitColor}/>
      <rect x="18" y="87" width="64" height="30" rx="10" fill={outfitColor}/>
      {/* Collar V-neck detail */}
      <path d="M42 82 L50 94 L58 82" fill="none" stroke={bgColor} strokeWidth="2.5" opacity="0.35"/>

      {/* Neck */}
      <rect x="42" y="70" width="16" height="18" rx="5" fill={skinColor}/>

      {/* Ears — rendered before head so head overlaps inner ear */}
      <ellipse cx="25" cy="54" rx="6"   ry="8"   fill={skinColor}/>
      <ellipse cx="25" cy="54" rx="3.5" ry="5.5" fill={skinColor} opacity="0.55"/>
      <ellipse cx="75" cy="54" rx="6"   ry="8"   fill={skinColor}/>
      <ellipse cx="75" cy="54" rx="3.5" ry="5.5" fill={skinColor} opacity="0.55"/>

      {/* Head */}
      <ellipse cx="50" cy="50" rx="26" ry="29" fill={skinColor}/>

      {/* Subtle face shading */}
      <ellipse cx="50" cy="42" rx="16" ry="12" fill="white" opacity="0.06"/>

      {/* Hair */}
      {hairPaths[hairStyle] || hairPaths[0]}

      {/* Eyebrows */}
      <path d="M35 40 Q41 36.5 46 39.5" stroke={hairColor} strokeWidth="2.8" strokeLinecap="round" fill="none"/>
      <path d="M54 39.5 Q59 36.5 65 40"  stroke={hairColor} strokeWidth="2.8" strokeLinecap="round" fill="none"/>

      {/* Eyes — white sclera */}
      <ellipse cx="41" cy="49" rx="6"   ry="6.5" fill="white"/>
      <ellipse cx="59" cy="49" rx="6"   ry="6.5" fill="white"/>
      {/* Iris */}
      <circle cx="42" cy="50" r="4" fill="#2a2a4a"/>
      <circle cx="60" cy="50" r="4" fill="#2a2a4a"/>
      {/* Pupil */}
      <circle cx="42" cy="50" r="2.2" fill="#0a0a0a"/>
      <circle cx="60" cy="50" r="2.2" fill="#0a0a0a"/>
      {/* Highlight */}
      <circle cx="43.5" cy="48.5" r="1.3" fill="white"/>
      <circle cx="61.5" cy="48.5" r="1.3" fill="white"/>

      {/* Nose */}
      <path d="M47.5 58 Q50 62.5 52.5 58" stroke="rgba(0,0,0,0.18)" strokeWidth="1.8" strokeLinecap="round" fill="none"/>

      {/* Mouth / smile */}
      <path d="M42 65 Q50 72 58 65" stroke="#1a1a1a" strokeWidth="2.8" strokeLinecap="round" fill="none"/>

      {/* Cheek blush */}
      <ellipse cx="33" cy="61" rx="7" ry="4.5" fill="rgba(255,100,100,0.15)"/>
      <ellipse cx="67" cy="61" rx="7" ry="4.5" fill="rgba(255,100,100,0.15)"/>

      {/* Accessory — rendered last (on top) */}
      {accessory !== undefined && accessoryPaths[accessory]}
    </svg>
  )
}

export interface Session {
  id: string
  date: string
  category: string
  prompt: string
  duration: number
  fillerCount: number
  fillerWords: string[]
  pace: number
  clarityScore: number
  lengthStatus: 'in-range' | 'too-short' | 'too-long'
  feedback: FeedbackPoint[]
  transcriptPreview: string
  tokensEarned?: number
}

export interface FeedbackPoint {
  icon: string
  title: string
  detail: string
  tag: string
  tagColor: string
  tagBg: string
}

export type Theme = 'dark' | 'light'

export interface UserSettings {
  name: string
  email: string
  targetWpmMin: number
  targetWpmMax: number
  defaultCategory: string
  notificationsEnabled: boolean
  remindersEnabled: boolean
  theme: Theme
}

export const DEFAULT_SETTINGS: UserSettings = {
  name: '',
  email: '',
  targetWpmMin: 140,
  targetWpmMax: 160,
  defaultCategory: 'Job Interviews',
  notificationsEnabled: false,
  remindersEnabled: false,
  theme: 'dark',
}

export interface TokenTransaction {
  id: string
  amount: number
  reason: string
  date: string
  type: 'earn' | 'spend'
}

export interface AvatarConfig {
  skinColor: string
  hairStyle: number
  hairColor: string
  accessory: number
  outfitColor: string
  bgColor: string
}

export const DEFAULT_AVATAR: AvatarConfig = {
  skinColor: '#AAFF00',
  hairStyle: 0,
  hairColor: '#1a1a1a',
  accessory: 0,
  outfitColor: '#1C1C1C',
  bgColor: '#141414',
}

export type ItemRarity = 'common' | 'rare' | 'epic' | 'legendary'

export interface AvatarShopItem {
  id: string
  category: 'skin' | 'hair' | 'accessory' | 'outfit' | 'background'
  label: string
  value: string | number
  price: number
  preview: string
  rarity: ItemRarity
  description?: string
}

export interface LeaderboardEntry {
  id: string
  name: string
  gameId: string
  score: number
  date: string
  isMe: boolean
}

export interface GameScore {
  gameId: string
  score: number
  date: string
  level: number
  tokensEarned?: number
}

export interface PracticeStats {
  totalGamesPlayed: number
  totalTokensEarned: number
  bestScores: Record<string, number>
  lastPlayed: string | null
  gamesBreakdown: Record<string, number>
}

export const FILLER_WORDS = [
  'um','uh','like','you know','basically','literally',
  'right','so','actually','honestly','kind of','sort of','i mean'
]

export const PROMPTS: Record<string, string[]> = {
  'Job Interviews': [
    'Tell me about yourself and one thing that makes you stand out.',
    'Describe a challenge you\'ve overcome and what you learned from it.',
    'Why do you want this position and what can you bring to our team?',
    'Where do you see yourself in five years?',
    'Tell me about a time you showed leadership.',
  ],
  'College Interviews': [
    'Why do you want to attend this college specifically?',
    'Describe an academic experience that genuinely excited you.',
    'What would you contribute to our campus community?',
    'Tell me about a person who has significantly influenced you.',
    'How have you grown over the past four years?',
  ],
  'School Presentations': [
    'Introduce your topic and explain why it matters to your audience.',
    'Summarize the three most important points from your research.',
    'Present your argument and support it with two pieces of evidence.',
    'Explain a complex concept as if teaching it to someone younger.',
    'Conclude your presentation with a memorable call to action.',
  ],
  'Public Speaking': [
    'Introduce yourself to a room of strangers in 60 seconds.',
    'Convince the audience that your favorite hobby is worth trying.',
    'Describe a place that means something important to you.',
    'Give a toast at a friend\'s birthday — make it memorable.',
    'Argue for or against social media having a net positive effect.',
  ],
  'My Own Prompt': [
    'Type your own prompt below.',
  ],
}

export const RARITY_CONFIG: Record<ItemRarity, { label: string; color: string; bg: string; border: string }> = {
  common:    { label: 'COMMON',    color: '#888888', bg: 'rgba(136,136,136,0.08)', border: 'rgba(136,136,136,0.2)' },
  rare:      { label: 'RARE',      color: '#4488FF', bg: 'rgba(68,136,255,0.08)',  border: 'rgba(68,136,255,0.25)' },
  epic:      { label: 'EPIC',      color: '#AA44FF', bg: 'rgba(170,68,255,0.08)', border: 'rgba(170,68,255,0.25)' },
  legendary: { label: 'LEGENDARY', color: '#FFD700', bg: 'rgba(255,215,0,0.08)',  border: 'rgba(255,215,0,0.3)'  },
}

export const AVATAR_SHOP_ITEMS: AvatarShopItem[] = [
  // ── SKIN — Realistic ─────────────────────────────────────────────────────
  { id:'skin-fair',     category:'skin', label:'Fair',       value:'#FDDBB4', price:0,   preview:'#FDDBB4', rarity:'common',    description:'Classic fair tone' },
  { id:'skin-light',    category:'skin', label:'Light',      value:'#F0C080', price:0,   preview:'#F0C080', rarity:'common',    description:'Warm light tone' },
  { id:'skin-medium',   category:'skin', label:'Medium',     value:'#C68642', price:0,   preview:'#C68642', rarity:'common',    description:'Natural medium tone' },
  { id:'skin-tan',      category:'skin', label:'Tan',        value:'#A0522D', price:0,   preview:'#A0522D', rarity:'common',    description:'Warm tan tone' },
  { id:'skin-brown',    category:'skin', label:'Brown',      value:'#6B3A2A', price:0,   preview:'#6B3A2A', rarity:'common',    description:'Rich brown tone' },
  { id:'skin-deep',     category:'skin', label:'Deep',       value:'#3B1F10', price:0,   preview:'#3B1F10', rarity:'common',    description:'Deep dark tone' },
  // ── SKIN — Fantasy ───────────────────────────────────────────────────────
  { id:'skin-lime',     category:'skin', label:'Lime',       value:'#AAFF00', price:0,   preview:'#AAFF00', rarity:'common',    description:'Starter lime skin' },
  { id:'skin-sky',      category:'skin', label:'Sky Blue',   value:'#00CFFF', price:50,  preview:'#00CFFF', rarity:'rare',      description:'Electric sky blue' },
  { id:'skin-coral',    category:'skin', label:'Coral',      value:'#FF6B6B', price:50,  preview:'#FF6B6B', rarity:'rare',      description:'Warm coral' },
  { id:'skin-mint',     category:'skin', label:'Mint',       value:'#69EFC5', price:50,  preview:'#69EFC5', rarity:'rare',      description:'Cool mint green' },
  { id:'skin-violet',   category:'skin', label:'Violet',     value:'#B388FF', price:80,  preview:'#B388FF', rarity:'epic',      description:'Mystic violet' },
  { id:'skin-rose',     category:'skin', label:'Rose Gold',  value:'#FF85A1', price:80,  preview:'#FF85A1', rarity:'epic',      description:'Rose gold shimmer' },
  { id:'skin-gold',     category:'skin', label:'Gold',       value:'#FFD700', price:150, preview:'#FFD700', rarity:'legendary', description:'Legendary golden skin' },
  { id:'skin-midnight', category:'skin', label:'Midnight',   value:'#1A0A3E', price:150, preview:'#1A0A3E', rarity:'legendary', description:'Deep midnight aura' },

  // ── HAIR STYLES ──────────────────────────────────────────────────────────
  { id:'hair-0', category:'hair', label:'Buzz Cut',  value:0, price:0,   preview:'buzz',     rarity:'common',    description:'Sharp and clean' },
  { id:'hair-1', category:'hair', label:'Wavy',      value:1, price:25,  preview:'wavy',     rarity:'common',    description:'Natural wave flow' },
  { id:'hair-2', category:'hair', label:'Curly',     value:2, price:25,  preview:'curly',    rarity:'common',    description:'Bold curly volume' },
  { id:'hair-3', category:'hair', label:'Long',      value:3, price:40,  preview:'long',     rarity:'rare',      description:'Flowing long locks' },
  { id:'hair-4', category:'hair', label:'Ponytail',  value:4, price:40,  preview:'ponytail', rarity:'rare',      description:'Classic high ponytail' },
  { id:'hair-5', category:'hair', label:'Bun',       value:5, price:55,  preview:'bun',      rarity:'rare',      description:'Elegant top bun' },
  { id:'hair-6', category:'hair', label:'Mohawk',    value:6, price:80,  preview:'mohawk',   rarity:'epic',      description:'Bold statement mohawk' },
  { id:'hair-7', category:'hair', label:'Braids',    value:7, price:80,  preview:'braids',   rarity:'epic',      description:'Long protective braids' },
  { id:'hair-8', category:'hair', label:'Spiky',     value:8, price:175, preview:'spiky',    rarity:'legendary', description:'Legendary spiky crown' },

  // ── HAIR COLORS ──────────────────────────────────────────────────────────
  { id:'hcol-dark',    category:'hair', label:'Dark',    value:'#1a1a1a', price:0,   preview:'#1a1a1a', rarity:'common',    description:'Classic dark' },
  { id:'hcol-brown',   category:'hair', label:'Brown',   value:'#6B3A2A', price:0,   preview:'#6B3A2A', rarity:'common',    description:'Natural brown' },
  { id:'hcol-blonde',  category:'hair', label:'Blonde',  value:'#FFD166', price:15,  preview:'#FFD166', rarity:'common',    description:'Golden blonde' },
  { id:'hcol-auburn',  category:'hair', label:'Auburn',  value:'#C04000', price:20,  preview:'#C04000', rarity:'common',    description:'Rich auburn' },
  { id:'hcol-red',     category:'hair', label:'Fire Red', value:'#FF3300', price:35,  preview:'#FF3300', rarity:'rare',      description:'Bold fire red' },
  { id:'hcol-blue',    category:'hair', label:'Blue',    value:'#4488FF', price:45,  preview:'#4488FF', rarity:'rare',      description:'Electric blue' },
  { id:'hcol-lime',    category:'hair', label:'Lime',    value:'#AAFF00', price:45,  preview:'#AAFF00', rarity:'rare',      description:'Neon lime' },
  { id:'hcol-pink',    category:'hair', label:'Pink',    value:'#FF85C2', price:60,  preview:'#FF85C2', rarity:'epic',      description:'Vivid bubblegum pink' },
  { id:'hcol-white',   category:'hair', label:'White',   value:'#F0F0F0', price:70,  preview:'#F0F0F0', rarity:'epic',      description:'Pure silver white' },
  { id:'hcol-gold',    category:'hair', label:'Gold',    value:'#FFD700', price:120, preview:'#FFD700', rarity:'legendary', description:'Legendary liquid gold' },

  // ── ACCESSORIES ──────────────────────────────────────────────────────────
  { id:'acc-0',  category:'accessory', label:'None',       value:0, price:0,   preview:'none',       rarity:'common',    description:'No accessory' },
  { id:'acc-1',  category:'accessory', label:'Glasses',    value:1, price:40,  preview:'glasses',    rarity:'rare',      description:'Classic thin frames' },
  { id:'acc-2',  category:'accessory', label:'Cap',        value:2, price:50,  preview:'cap',        rarity:'rare',      description:'Street baseball cap' },
  { id:'acc-5',  category:'accessory', label:'Sunglasses', value:5, price:60,  preview:'sunglasses', rarity:'rare',      description:'Cool dark shades' },
  { id:'acc-6',  category:'accessory', label:'Earrings',   value:6, price:45,  preview:'earrings',   rarity:'rare',      description:'Gold drop earrings' },
  { id:'acc-3',  category:'accessory', label:'Headphones', value:3, price:90,  preview:'headphones', rarity:'epic',      description:'Pro studio headphones' },
  { id:'acc-4',  category:'accessory', label:'Crown',      value:4, price:175, preview:'crown',      rarity:'legendary', description:'Royal jeweled crown' },

  // ── OUTFIT COLORS ────────────────────────────────────────────────────────
  { id:'out-dark',    category:'outfit', label:'Black',    value:'#1C1C1C', price:0,   preview:'#1C1C1C', rarity:'common',    description:'Classic black' },
  { id:'out-gray',    category:'outfit', label:'Gray',     value:'#4A4A4A', price:0,   preview:'#4A4A4A', rarity:'common',    description:'Slate gray' },
  { id:'out-navy',    category:'outfit', label:'Navy',     value:'#1A2A5E', price:20,  preview:'#1A2A5E', rarity:'common',    description:'Deep navy blue' },
  { id:'out-forest',  category:'outfit', label:'Forest',   value:'#1A4A2E', price:20,  preview:'#1A4A2E', rarity:'common',    description:'Forest green' },
  { id:'out-maroon',  category:'outfit', label:'Maroon',   value:'#5C1A2E', price:20,  preview:'#5C1A2E', rarity:'common',    description:'Deep maroon' },
  { id:'out-purple',  category:'outfit', label:'Purple',   value:'#4A1A7E', price:35,  preview:'#4A1A7E', rarity:'rare',      description:'Royal purple' },
  { id:'out-hot',     category:'outfit', label:'Red',      value:'#FF3054', price:45,  preview:'#FF3054', rarity:'rare',      description:'Hot red' },
  { id:'out-orange',  category:'outfit', label:'Orange',   value:'#FF6B00', price:45,  preview:'#FF6B00', rarity:'rare',      description:'Vivid orange' },
  { id:'out-lime',    category:'outfit', label:'Lime',     value:'#AAFF00', price:60,  preview:'#AAFF00', rarity:'epic',      description:'Neon lime' },
  { id:'out-white',   category:'outfit', label:'White',    value:'#F0F0F0', price:60,  preview:'#F0F0F0', rarity:'epic',      description:'Clean white' },
  { id:'out-gold',    category:'outfit', label:'Gold',     value:'#C9A227', price:120, preview:'#C9A227', rarity:'legendary', description:'Legendary gold fit' },

  // ── BACKGROUNDS ──────────────────────────────────────────────────────────
  { id:'bg-dark',     category:'background', label:'Dark',      value:'#141414', price:0,   preview:'#141414', rarity:'common',    description:'Classic dark' },
  { id:'bg-charcoal', category:'background', label:'Charcoal',  value:'#1E1E1E', price:0,   preview:'#1E1E1E', rarity:'common',    description:'Charcoal gray' },
  { id:'bg-space',    category:'background', label:'Space',     value:'#0A0A2E', price:35,  preview:'#0A0A2E', rarity:'rare',      description:'Deep space' },
  { id:'bg-forest',   category:'background', label:'Forest',    value:'#0A2E15', price:35,  preview:'#0A2E15', rarity:'rare',      description:'Dark forest' },
  { id:'bg-sunset',   category:'background', label:'Sunset',    value:'#2E0A1A', price:35,  preview:'#2E0A1A', rarity:'rare',      description:'Midnight sunset' },
  { id:'bg-ocean',    category:'background', label:'Ocean',     value:'#0A1E2E', price:35,  preview:'#0A1E2E', rarity:'rare',      description:'Deep ocean' },
  { id:'bg-cosmic',   category:'background', label:'Cosmic',    value:'#1A0A2E', price:45,  preview:'#1A0A2E', rarity:'rare',      description:'Cosmic purple' },
  { id:'bg-lime',     category:'background', label:'Lime Glow', value:'#0A1A00', price:70,  preview:'#AAFF00', rarity:'epic',      description:'Lime glow aura' },
  { id:'bg-fire',     category:'background', label:'Fire',      value:'#2E0A00', price:70,  preview:'#FF6B00', rarity:'epic',      description:'Fire aura' },
  { id:'bg-gold',     category:'background', label:'Gold Aura', value:'#1A1200', price:150, preview:'#FFD700', rarity:'legendary', description:'Legendary golden aura' },
]

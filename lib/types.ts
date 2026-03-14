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

export interface AvatarShopItem {
  id: string
  category: 'skin' | 'hair' | 'accessory' | 'outfit' | 'background'
  label: string
  value: string | number
  price: number
  preview: string
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

export const AVATAR_SHOP_ITEMS: AvatarShopItem[] = [
  // Skin colors
  { id:'skin-lime',    category:'skin', label:'Lime',     value:'#AAFF00', price:0,   preview:'#AAFF00' },
  { id:'skin-sky',     category:'skin', label:'Sky',      value:'#00CFFF', price:20,  preview:'#00CFFF' },
  { id:'skin-coral',   category:'skin', label:'Coral',    value:'#FF6B6B', price:20,  preview:'#FF6B6B' },
  { id:'skin-violet',  category:'skin', label:'Violet',   value:'#B388FF', price:20,  preview:'#B388FF' },
  { id:'skin-mint',    category:'skin', label:'Mint',     value:'#69EFC5', price:20,  preview:'#69EFC5' },
  { id:'skin-gold',    category:'skin', label:'Gold',     value:'#FFD700', price:30,  preview:'#FFD700' },
  { id:'skin-rose',    category:'skin', label:'Rose',     value:'#FF85A1', price:30,  preview:'#FF85A1' },
  // Hair styles
  { id:'hair-0', category:'hair', label:'Short',    value:0, price:0,   preview:'short' },
  { id:'hair-1', category:'hair', label:'Wavy',     value:1, price:25,  preview:'wavy' },
  { id:'hair-2', category:'hair', label:'Curly',    value:2, price:25,  preview:'curly' },
  { id:'hair-3', category:'hair', label:'Long',     value:3, price:35,  preview:'long' },
  { id:'hair-4', category:'hair', label:'Ponytail', value:4, price:35,  preview:'ponytail' },
  // Hair colors
  { id:'hcol-dark',    category:'hair', label:'Dark',    value:'#1a1a1a', price:0,   preview:'#1a1a1a' },
  { id:'hcol-blonde',  category:'hair', label:'Blonde',  value:'#FFD166', price:15,  preview:'#FFD166' },
  { id:'hcol-red',     category:'hair', label:'Red',     value:'#FF4444', price:15,  preview:'#FF4444' },
  { id:'hcol-blue',    category:'hair', label:'Blue',    value:'#4488FF', price:25,  preview:'#4488FF' },
  { id:'hcol-lime',    category:'hair', label:'Lime',    value:'#AAFF00', price:25,  preview:'#AAFF00' },
  // Accessories
  { id:'acc-0',  category:'accessory', label:'None',       value:0, price:0,   preview:'none' },
  { id:'acc-1',  category:'accessory', label:'Glasses',    value:1, price:40,  preview:'glasses' },
  { id:'acc-2',  category:'accessory', label:'Cap',        value:2, price:50,  preview:'cap' },
  { id:'acc-3',  category:'accessory', label:'Headphones', value:3, price:60,  preview:'headphones' },
  { id:'acc-4',  category:'accessory', label:'Crown',      value:4, price:100, preview:'crown' },
  // Outfit colors
  { id:'out-dark',   category:'outfit', label:'Black',   value:'#1C1C1C', price:0,  preview:'#1C1C1C' },
  { id:'out-navy',   category:'outfit', label:'Navy',    value:'#1A2A5E', price:20, preview:'#1A2A5E' },
  { id:'out-forest', category:'outfit', label:'Forest',  value:'#1A4A2E', price:20, preview:'#1A4A2E' },
  { id:'out-lime',   category:'outfit', label:'Lime',    value:'#AAFF00', price:30, preview:'#AAFF00' },
  { id:'out-hot',    category:'outfit', label:'Red',     value:'#FF3054', price:30, preview:'#FF3054' },
  // Backgrounds
  { id:'bg-dark',    category:'background', label:'Dark',    value:'#141414', price:0,  preview:'#141414' },
  { id:'bg-space',   category:'background', label:'Space',   value:'#0A0A2E', price:30, preview:'#0A0A2E' },
  { id:'bg-forest',  category:'background', label:'Forest',  value:'#0A2E15', price:30, preview:'#0A2E15' },
  { id:'bg-sunset',  category:'background', label:'Sunset',  value:'#2E0A1A', price:30, preview:'#2E0A1A' },
  { id:'bg-ocean',   category:'background', label:'Ocean',   value:'#0A1E2E', price:30, preview:'#0A1E2E' },
  { id:'bg-lime',    category:'background', label:'Lime',    value:'rgba(170,255,0,0.08)', price:50, preview:'#AAFF00' },
]

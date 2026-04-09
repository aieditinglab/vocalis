// lib/profanityFilter.ts

const BANNED_WORDS = [
    'fuck', 'fucking', 'shit', 'bitch', 'ass', 'asshole', 'bastard',
    'cunt', 'dick', 'cock', 'pussy', 'nigga', 'nigger', 'faggot', 'fag',
    'whore', 'slut', 'retard', 'retarded', 'crap', 'piss', 'damn', 'hell',
    'sex', 'porn', 'nude', 'naked', 'penis', 'vagina', 'boob', 'tit',
    'kill', 'rape', 'racist', 'nazi', 'hitler',
  ]
  
  export function containsProfanity(text: string): boolean {
    const normalized = text.toLowerCase().replace(/[^a-z0-9]/g, '')
    return BANNED_WORDS.some(word => {
      const cleanWord = word.replace(/[^a-z0-9]/g, '')
      return normalized.includes(cleanWord)
    })
  }
  
  export function validateDisplayName(name: string): string | null {
    if (!name || name.trim().length === 0) return 'Name cannot be empty.'
    if (name.trim().length < 2) return 'Name must be at least 2 characters.'
    if (name.trim().length > 30) return 'Name must be 30 characters or fewer.'
    if (containsProfanity(name)) return 'This name contains inappropriate language. Please choose a different name.'
    return null // null = valid
  }
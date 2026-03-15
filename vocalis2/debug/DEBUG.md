# Vocalis v2 Debug Guide

## Quick health check — run through in order
1. `npm run build` — zero errors
2. `npm run dev` — starts on localhost:3000
3. Landing page loads with correct fonts and lime green accent
4. Sign up → record category page appears
5. Select category → pick a prompt
6. Record page → shows microphone permission screen
7. Click "Allow Microphone" → browser popup appears → Allow
8. Record button turns red → timer counts up → stop after 30s
9. Playback screen appears → audio plays back
10. See My Analysis → 4 metrics appear with animated bars
11. See My Coaching → 3 feedback cards
12. Done → Level Up screen shows clarity score + tokens earned
13. Dashboard → session appears, expand it to see full details
14. Practice tab in dashboard → shows game stats
15. Practice page → 3 games work end-to-end
16. Games page → 3 arcade games with leaderboards
17. Avatar page → can equip/buy items with tokens
18. Settings → theme toggle switches light/dark mode, saves persist

---

## Common issues

### Mic permission screen never appears
The mic screen IS the first screen in recording. It shows before you press record.
If clicking "Allow Microphone" does nothing:
- Check browser console (F12) for the exact error
- On Chrome: address bar lock icon → Site Settings → Microphone → Allow
- Must be on localhost or https — mic doesn't work on plain http

### `Module not found '@/components/Logo'`
The import is case-sensitive. Check it's `Logo` not `logo`:
```tsx
import Logo from '@/components/Logo'
```

### Theme doesn't apply on page load (flash of wrong theme)
The inline script in layout.tsx handles this. Make sure you didn't remove the `<script dangerouslySetInnerHTML...>` block from layout.tsx.

### Tokens show as 0 even after completing sessions
Open DevTools → Application → Local Storage → check for `vocalis_tokens`
If missing, the `addTokens()` call in levelup/page.tsx isn't running.
Make sure `saveSession` completes before `addTokens` is called.

### Avatar items not saving
Click "Save Avatar" button after equipping items. Equipping alone doesn't save — it's a preview.

### Build error: `useRouter` needs `'use client'`
Every page file that uses hooks must have `'use client'` as the very first line.

### TypeScript error on `(p as any)`
These are intentional casts for cross-page pending session data. Safe to ignore in dev.
For production, move pending session to a proper typed store.

---

## Console helpers — paste into browser DevTools

```js
// View all sessions
JSON.parse(localStorage.getItem('vocalis_sessions')||'[]').forEach((s,i)=>console.log(i+1,s.date,s.clarityScore,'clarity',s.fillerCount,'fillers'))

// View token balance
console.log('Tokens:',JSON.parse(localStorage.getItem('vocalis_tokens')||'50'))

// View avatar
console.log('Avatar:',JSON.parse(localStorage.getItem('vocalis_avatar')||'{}'))

// Add 100 tokens for testing
const t=JSON.parse(localStorage.getItem('vocalis_tokens')||'50');localStorage.setItem('vocalis_tokens',JSON.stringify(t+100));console.log('New balance:',t+100)

// Nuclear reset
['vocalis_sessions','vocalis_settings','vocalis_tokens','vocalis_token_history','vocalis_avatar','vocalis_purchased_items','vocalis_game_scores','vocalis_leaderboard'].forEach(k=>localStorage.removeItem(k));sessionStorage.clear();console.log('Reset complete. Refresh.')
```

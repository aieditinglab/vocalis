// ── GEMINI FREE AI COACHING ────────────────────────────────────────────────
// Uses Google Gemini 1.5 Flash — completely FREE, 1500 requests/day
// Get your free API key: https://aistudio.google.com/apikey
// Add to your .env.local: NEXT_PUBLIC_GEMINI_API_KEY=your_key_here

export interface AICoachingInput {
  transcript: string
  duration: number
  fillerCount: number
  fillerWords: string[]
  pace: number
  clarityScore: number
  lengthStatus: string
  category: string
  prompt: string
  selfRatings?: { confidence: number; clarity: number; pacing: number; structure: number }
  sessionHistory?: { clarityScore: number; fillerCount: number; pace: number; date: string }[]
  uploadedScript?: string
  rubric?: string
}

export interface AICoachingResult {
  overallScore: number
  overallVerdict: string
  coachingPoints: {
    icon: string; title: string; detail: string
    tag: string; tagColor: string; tagBg: string
    priority: 'critical' | 'high' | 'medium' | 'low'
  }[]
  selfVsAI?: { label: string; selfScore: number; aiScore: number; gap: string }[]
  scriptComparison?: string
  rubricFeedback?: string
  nextStepDrill: string
  celebrationMsg: string
}

export async function getAICoaching(input: AICoachingInput): Promise<AICoachingResult> {
  const hasTranscript = input.transcript && input.transcript.trim().length > 20
  const hasSelfRatings = !!input.selfRatings
  const hasHistory = input.sessionHistory && input.sessionHistory.length > 0

  const prompt = `You are an elite public speaking coach for teenagers. Be brutally honest, specific, and encouraging. NEVER give generic advice. Reference what this person specifically said. ALWAYS find at least 3 things to improve — even if they scored 90+, give advanced coaching. There is NEVER a case where "no feedback is needed."

RECORDING DETAILS:
- Category: ${input.category}
- Prompt: "${input.prompt}"
- Duration: ${fmt(input.duration)}
- Clarity score: ${input.clarityScore}/100
- Filler words: ${input.fillerCount} detected (${input.fillerWords.slice(0,5).join(', ') || 'none'})
- Pace: ${input.pace > 0 ? input.pace + ' WPM' : 'not measured'}
- Length: ${input.lengthStatus}

${hasTranscript ? `WHAT THEY SAID:\n"${input.transcript.slice(0, 700)}${input.transcript.length > 700 ? '...' : ''}"\n` : 'No transcript — give feedback based on metrics.\n'}
${hasSelfRatings ? `SELF-RATINGS (1-5):\n- Confidence: ${input.selfRatings!.confidence}\n- Clarity: ${input.selfRatings!.clarity}\n- Pacing: ${input.selfRatings!.pacing}\n- Structure: ${input.selfRatings!.structure}\n` : ''}
${hasHistory ? `PAST SESSIONS:\n${input.sessionHistory!.slice(0,3).map((s,i) => `Session ${i+1}: Clarity ${s.clarityScore}, Fillers ${s.fillerCount}`).join('\n')}\n` : 'First session.\n'}
${input.uploadedScript ? `THEIR SCRIPT:\n"${input.uploadedScript.slice(0,400)}"\n` : ''}
${input.rubric ? `RUBRIC:\n"${input.rubric.slice(0,300)}"\n` : ''}

Respond with ONLY valid JSON, no markdown, no explanation:
{
  "overallScore": <0-100>,
  "overallVerdict": "<2 honest sentences about this specific performance>",
  "coachingPoints": [
    {
      "icon": "<emoji>",
      "title": "<specific issue>",
      "detail": "<3-4 sentences: what they did, why it matters, exact drill to fix it>",
      "tag": "<label>",
      "tagColor": "${input.clarityScore < 55 ? '#FF3054' : input.clarityScore < 70 ? '#FFB800' : '#AAFF00'}",
      "tagBg": "rgba(170,255,0,0.10)",
      "priority": "<critical|high|medium|low>"
    }
  ],
  ${hasSelfRatings ? `"selfVsAI": [
    {"label":"Confidence","selfScore":${(input.selfRatings!.confidence)*20},"aiScore":<0-100>,"gap":"<one sentence>"},
    {"label":"Clarity","selfScore":${(input.selfRatings!.clarity)*20},"aiScore":<0-100>,"gap":"<one sentence>"},
    {"label":"Pacing","selfScore":${(input.selfRatings!.pacing)*20},"aiScore":<0-100>,"gap":"<one sentence>"},
    {"label":"Structure","selfScore":${(input.selfRatings!.structure)*20},"aiScore":<0-100>,"gap":"<one sentence>"}
  ],` : ''}
  ${input.uploadedScript ? `"scriptComparison": "<2-3 sentences comparing delivery vs script>",` : ''}
  ${input.rubric ? `"rubricFeedback": "<evaluate against each rubric criterion>",` : ''}
  "nextStepDrill": "<one specific 5-minute drill to do right now>",
  "celebrationMsg": "<one specific genuine thing they did well>"
}`

  try {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY
    if (!apiKey) {
      console.warn('No Gemini API key — using fallback coaching')
      return fallbackCoaching(input)
    }

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1800,
            responseMimeType: 'application/json',
          }
        })
      }
    )

    const data = await res.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
    const clean = text.replace(/```json|```/g, '').trim()
    const result = JSON.parse(clean) as AICoachingResult

    // Make sure coachingPoints colors are properly set
    result.coachingPoints = result.coachingPoints.map((p, i) => ({
      ...p,
      tagBg: p.tagBg || getTagBg(p.tagColor),
    }))

    return result
  } catch (e) {
    console.error('Gemini AI error:', e)
    return fallbackCoaching(input)
  }
}

function getTagBg(color: string): string {
  if (color?.includes('FF3054')) return 'rgba(255,48,84,0.12)'
  if (color?.includes('FFB800')) return 'rgba(255,184,0,0.12)'
  if (color?.includes('00AEFF')) return 'rgba(0,174,255,0.10)'
  return 'rgba(170,255,0,0.10)'
}

function fmt(s: number) {
  return `${Math.floor(s/60)}:${(s%60).toString().padStart(2,'0')}`
}

// Rule-based fallback — always runs if Gemini fails or no key
function fallbackCoaching(input: AICoachingInput): AICoachingResult {
  const points: AICoachingResult['coachingPoints'] = []

  if (input.fillerCount > 0) {
    points.push({
      icon: '🎯',
      title: `${input.fillerCount} filler word${input.fillerCount > 1 ? 's' : ''} — your #1 priority`,
      detail: `You used ${input.fillerCount} fillers (${input.fillerWords.slice(0,3).join(', ')}). Every filler signals a gap between your thoughts and words. The fix is simple but requires practice: when you feel a filler coming, stop completely and breathe for 1 second instead. This pause actually sounds more confident than filling the silence. Drill: set a timer for 2 minutes, talk about your day out loud, and physically stop every time you feel a filler. Do this 3 times tonight.`,
      tag: 'HIGH IMPACT', tagColor: '#FF3054', tagBg: 'rgba(255,48,84,0.12)', priority: 'critical'
    })
  }

  if (input.pace > 175) {
    points.push({
      icon: '🐢', title: `Speaking at ${input.pace} WPM — too fast`,
      detail: `${input.pace} WPM is ${input.pace - 155} above the ideal range. Fast speech signals nerves and causes listeners to miss key points. The fix: after your opening sentence, take a 2-second pause before continuing. This pause resets your pace naturally. Record yourself reading a paragraph at what feels like 50% of your normal speed — it will feel painfully slow but sound perfect.`,
      tag: 'QUICK WIN', tagColor: '#FFB800', tagBg: 'rgba(255,184,0,0.12)', priority: 'high'
    })
  } else if (input.pace < 115 && input.pace > 0) {
    points.push({
      icon: '⚡', title: `Speaking at ${input.pace} WPM — too slow`,
      detail: `${input.pace} WPM loses listener attention. Emphasize your key words with slightly more volume and vary your speed — faster on connective phrases, slower on important ideas. Record yourself and aim for at least 130 WPM.`,
      tag: 'PACING', tagColor: '#FFB800', tagBg: 'rgba(255,184,0,0.12)', priority: 'high'
    })
  }

  if (input.lengthStatus === 'too-short') {
    points.push({
      icon: '⏱', title: 'Response too short — develop your ideas',
      detail: `${fmt(input.duration)} is not enough time to make an impression. Use the STAR method: Situation (15 sec), Task (15 sec), Action (30 sec), Result (15 sec). This structure alone gets you to 75 seconds. Practice by timing yourself — record again and aim for at least 45 seconds.`,
      tag: 'LENGTH', tagColor: '#FF3054', tagBg: 'rgba(255,48,84,0.12)', priority: 'critical'
    })
  }

  points.push({
    icon: '💡', title: 'Open with your conclusion, not your intro',
    detail: `The most powerful speaking change you can make: state your main point in the very first sentence. Most speakers warm up for 20-30 seconds before getting to their point — by which time listeners have formed their impression. Your opening line should be the thing you most want them to remember. Everything after is just evidence.`,
    tag: 'STRUCTURE', tagColor: '#AAFF00', tagBg: 'rgba(170,255,0,0.10)', priority: 'medium'
  })

  if (points.length < 3) {
    points.push({
      icon: '🎤', title: 'Add vocal variety to maintain engagement',
      detail: `Even a well-structured answer can feel flat without vocal dynamics. Practice the "word emphasis" technique: in each sentence, identify the single most important word and say it 20% louder. This small change makes your speech instantly more engaging and easier to follow.`,
      tag: 'DELIVERY', tagColor: '#00AEFF', tagBg: 'rgba(0,174,255,0.10)', priority: 'medium'
    })
  }

  const score = Math.max(35, Math.min(95, input.clarityScore))
  return {
    overallScore: score,
    overallVerdict: `You completed a ${fmt(input.duration)} response with ${input.fillerCount} filler words. ${score >= 70 ? 'Solid foundation — the details below will sharpen your delivery.' : 'Clear growth areas — applying even one coaching point below will move your score significantly.'}`,
    coachingPoints: points.slice(0, 4),
    selfVsAI: input.selfRatings ? [
      { label: 'Confidence', selfScore: input.selfRatings.confidence * 20, aiScore: Math.min(100, score + 5), gap: 'Your self-assessment aligns with your delivery metrics.' },
      { label: 'Clarity',    selfScore: input.selfRatings.clarity * 20,    aiScore: score, gap: 'Clarity is primarily affected by filler words and structure.' },
      { label: 'Pacing',     selfScore: input.selfRatings.pacing * 20,     aiScore: input.pace > 0 ? Math.max(30, 100 - Math.abs(input.pace - 150)) : 60, gap: 'Pacing is measured objectively from your recording.' },
      { label: 'Structure',  selfScore: input.selfRatings.structure * 20,  aiScore: Math.min(100, score + 10), gap: 'Structure improves with the STAR method — see coaching below.' },
    ] : undefined,
    nextStepDrill: `Set a 3-minute timer and speak about "${input.prompt}" again out loud. This time, pause instead of filling any silence and open with your main point. Record it and compare your filler count.`,
    celebrationMsg: input.fillerCount === 0
      ? `Zero filler words — that's genuinely rare. Most speakers average 8-10 per minute. You've already developed the habit most people struggle with for years.`
      : `You completed a full response without stopping — that takes more courage than most people realize. Every rep builds the habit.`
  }
}

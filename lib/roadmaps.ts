// ── VOCALIS ROADMAPS ────────────────────────────────────────────────────────
// Structured, leveled curriculum. Replaces open-ended improv prompts.
//
// Design rules (from the 7/26 consultant meeting):
//  1. This is NOT a debate app. No prompt should require inventing content on
//     the spot. Every lesson ships with a `framework` (the shape of the answer)
//     and `beats` (the specific points to hit), so the user is practicing
//     DELIVERY, not improvisation.
//  2. Every lesson has `prepSeconds` — dedicated think time before the mic opens.
//  3. Lessons are sequential and gated. The user always knows what's next.
//  4. Tracks are independent. Progress in one never affects another.

export interface Lesson {
  id: number             // 1-indexed, sequential within a track
  level: number          // which level block this lesson belongs to
  title: string
  objective: string      // what the user is actually practicing
  prompt: string         // what they're asked to say
  framework: string      // the shape of a good answer
  beats: string[]        // concrete points to hit — removes "what do I say?"
  prepSeconds: number    // think time before recording opens
  targetSeconds: number  // how long the response should run
}

export interface Track {
  id: string
  label: string
  icon: string
  blurb: string
  levels: { level: number; name: string; caption: string }[]
  lessons: Lesson[]
}

// ── PRESENTATIONS ───────────────────────────────────────────────────────────

const PRESENTATION_LESSONS: Lesson[] = [
  {
    id: 1, level: 1,
    title: 'Your one sentence',
    objective: 'Say what your talk is about without rambling.',
    prompt: 'Introduce a topic you already know well in one clear sentence, then say why it matters.',
    framework: 'Topic → Why it matters',
    beats: [
      'Name the topic in plain words',
      'Say who it affects',
      'Say why the audience should care',
    ],
    prepSeconds: 30, targetSeconds: 30,
  },
  {
    id: 2, level: 1,
    title: 'The clean open',
    objective: 'Start strong instead of trailing into your topic.',
    prompt: 'Open a presentation on your topic. First words to first point, nothing else.',
    framework: 'Hook → Name yourself → State the point',
    beats: [
      'Open with a fact, question, or short moment',
      'Say your name and what you are presenting',
      'State your main point in one line',
    ],
    prepSeconds: 45, targetSeconds: 40,
  },
  {
    id: 3, level: 1,
    title: 'One idea, no filler',
    objective: 'Hold a single idea for 45 seconds without "um" or "like".',
    prompt: 'Explain one single idea from your topic. Just one. Take your time.',
    framework: 'Claim → Explain → Example',
    beats: [
      'State the idea',
      'Explain it in your own words',
      'Give one concrete example',
    ],
    prepSeconds: 45, targetSeconds: 45,
  },

  {
    id: 4, level: 2,
    title: 'Three-point structure',
    objective: 'Organize a talk into three points the audience can follow.',
    prompt: 'Present the three most important things about your topic.',
    framework: 'Signpost → Point 1 → Point 2 → Point 3',
    beats: [
      'Say "there are three things..." up front',
      'Give each point with one supporting detail',
      'Pause between points instead of using "and then"',
    ],
    prepSeconds: 60, targetSeconds: 75,
  },
  {
    id: 5, level: 2,
    title: 'Evidence that lands',
    objective: 'Back a claim with proof instead of repeating the claim louder.',
    prompt: 'Make one argument about your topic and support it with two pieces of evidence.',
    framework: 'Claim → Evidence → Evidence → So what',
    beats: [
      'State the claim in one sentence',
      'Give two specifics: a number, a source, or a real case',
      'Close with what it means',
    ],
    prepSeconds: 60, targetSeconds: 75,
  },
  {
    id: 6, level: 2,
    title: 'Explain it simply',
    objective: 'Translate something complex without jargon.',
    prompt: 'Explain the hardest concept in your topic as if to a younger student.',
    framework: 'Plain definition → Comparison → Check',
    beats: [
      'Define it without technical words',
      'Compare it to something everyday',
      'End with a one-line summary',
    ],
    prepSeconds: 60, targetSeconds: 60,
  },

  {
    id: 7, level: 3,
    title: 'Pace control',
    objective: 'Hold a steady 140–160 wpm instead of rushing.',
    prompt: 'Deliver any 60 seconds of your presentation at a deliberate, even pace.',
    framework: 'Slow open → Steady middle → Slow close',
    beats: [
      'Start slower than feels natural',
      'Pause fully at every period',
      'Do not speed up when you feel nervous',
    ],
    prepSeconds: 45, targetSeconds: 60,
  },
  {
    id: 8, level: 3,
    title: 'The power pause',
    objective: 'Replace filler words with silence.',
    prompt: 'Present part of your topic. Every time you want to say "um", pause instead.',
    framework: 'Sentence → Pause → Sentence',
    beats: [
      'Let silence sit before each new point',
      'Do not fill gaps with "so" or "like"',
      'Breathe at the pauses',
    ],
    prepSeconds: 45, targetSeconds: 60,
  },
  {
    id: 9, level: 3,
    title: 'Transitions',
    objective: 'Move between sections without "and then, um, also".',
    prompt: 'Move through three sections of your presentation, focusing only on the handoffs.',
    framework: 'Close point → Bridge line → Open next point',
    beats: [
      'Summarize the point you are leaving',
      'Use a real bridge: "That leads to..."',
      'Announce the next point clearly',
    ],
    prepSeconds: 60, targetSeconds: 75,
  },

  {
    id: 10, level: 4,
    title: 'Handling the hard question',
    objective: 'Answer a question you did not prepare for, calmly.',
    prompt: 'Someone asks: "What is the biggest weakness in your argument?" Answer it honestly.',
    framework: 'Acknowledge → Answer → Return',
    beats: [
      'Acknowledge the question is fair',
      'Give a real limitation',
      'Return to why your point still holds',
    ],
    prepSeconds: 60, targetSeconds: 60,
  },
  {
    id: 11, level: 4,
    title: 'The close',
    objective: 'End on purpose instead of fading out.',
    prompt: 'Deliver the final 45 seconds of your presentation.',
    framework: 'Recap → Significance → Call to action',
    beats: [
      'Recap your three points in one line',
      'Say why it matters beyond the assignment',
      'End with a clear final sentence — then stop',
    ],
    prepSeconds: 45, targetSeconds: 45,
  },
  {
    id: 12, level: 4,
    title: 'Full run',
    objective: 'Deliver a complete presentation start to finish.',
    prompt: 'Give your full presentation: open, three points, close.',
    framework: 'Open → 3 Points → Close',
    beats: [
      'Hook and state your main point',
      'Three points, each with evidence',
      'Recap and close deliberately',
    ],
    prepSeconds: 90, targetSeconds: 180,
  },
]

// ── JOB INTERVIEWS ──────────────────────────────────────────────────────────

const JOB_LESSONS: Lesson[] = [
  {
    id: 1, level: 1,
    title: 'Tell me about yourself',
    objective: 'Answer the most common opener without rambling.',
    prompt: '"Tell me about yourself."',
    framework: 'Present → Past → Future',
    beats: [
      'What you do now (school, year, focus)',
      'One relevant thing you have done before',
      'What you are looking for next',
    ],
    prepSeconds: 60, targetSeconds: 60,
  },
  {
    id: 2, level: 1,
    title: 'Your strength, proven',
    objective: 'Claim a strength and immediately back it with proof.',
    prompt: '"What is your greatest strength?"',
    framework: 'Strength → Proof → Relevance',
    beats: [
      'Name one strength, not three',
      'Give a specific time you used it',
      'Tie it to the job',
    ],
    prepSeconds: 45, targetSeconds: 45,
  },
  {
    id: 3, level: 1,
    title: 'Why this job',
    objective: 'Show genuine reasoning instead of flattery.',
    prompt: '"Why do you want this position?"',
    framework: 'What draws you → What you bring → Fit',
    beats: [
      'One specific thing about the role or company',
      'One thing you would contribute',
      'Why the two line up',
    ],
    prepSeconds: 60, targetSeconds: 50,
  },

  {
    id: 4, level: 2,
    title: 'STAR: the setup',
    objective: 'Learn the story structure interviewers expect.',
    prompt: '"Tell me about a time you solved a problem."',
    framework: 'Situation → Task → Action → Result',
    beats: [
      'Set the scene in one sentence',
      'Say what you specifically had to do',
      'Say what you did, then the outcome',
    ],
    prepSeconds: 75, targetSeconds: 75,
  },
  {
    id: 5, level: 2,
    title: 'STAR: leadership',
    objective: 'Tell a leadership story with a measurable result.',
    prompt: '"Tell me about a time you led something."',
    framework: 'Situation → Task → Action → Result',
    beats: [
      'What the group needed',
      'What you personally did — say "I", not "we"',
      'The result, with a number if possible',
    ],
    prepSeconds: 75, targetSeconds: 75,
  },
  {
    id: 6, level: 2,
    title: 'STAR: conflict',
    objective: 'Describe conflict without blaming anyone.',
    prompt: '"Tell me about a time you disagreed with someone on a team."',
    framework: 'Situation → Task → Action → Result',
    beats: [
      'Describe the disagreement neutrally',
      'What you did to resolve it',
      'What you learned',
    ],
    prepSeconds: 75, targetSeconds: 75,
  },

  {
    id: 7, level: 3,
    title: 'The weakness question',
    objective: 'Be honest without hurting yourself.',
    prompt: '"What is your greatest weakness?"',
    framework: 'Real weakness → What you are doing → Progress',
    beats: [
      'Name a real one, not a humblebrag',
      'Say what you are actively doing about it',
      'Give evidence you are improving',
    ],
    prepSeconds: 60, targetSeconds: 50,
  },
  {
    id: 8, level: 3,
    title: 'Failure',
    objective: 'Own a failure and show what changed after.',
    prompt: '"Tell me about a time you failed."',
    framework: 'What happened → Your part → What changed',
    beats: [
      'State the failure plainly',
      'Own your role without excuses',
      'What you do differently now',
    ],
    prepSeconds: 75, targetSeconds: 70,
  },
  {
    id: 9, level: 3,
    title: 'No experience',
    objective: 'Answer when you lack a qualification.',
    prompt: '"You don\'t have experience in this. Why should we hire you?"',
    framework: 'Acknowledge → Transferable → Evidence',
    beats: [
      'Acknowledge it directly, no defensiveness',
      'Name skills that transfer',
      'Give proof you learn quickly',
    ],
    prepSeconds: 75, targetSeconds: 60,
  },

  {
    id: 10, level: 4,
    title: 'Your questions for them',
    objective: 'Ask questions that show you did the work.',
    prompt: '"Do you have any questions for us?"',
    framework: 'Specific question → Why you ask → Follow-up',
    beats: [
      'Ask something not answerable from the website',
      'Explain briefly why you are curious',
      'Have a second question ready',
    ],
    prepSeconds: 60, targetSeconds: 50,
  },
  {
    id: 11, level: 4,
    title: 'Where you are headed',
    objective: 'Show direction without sounding scripted.',
    prompt: '"Where do you see yourself in five years?"',
    framework: 'Direction → Skills → Link to this role',
    beats: [
      'Give a real direction, not "successful"',
      'Name skills you want to build',
      'Connect it to this job',
    ],
    prepSeconds: 60, targetSeconds: 55,
  },
  {
    id: 12, level: 4,
    title: 'Full mock interview',
    objective: 'Run four questions back to back, no restarts.',
    prompt: 'Answer in order: tell me about yourself, a strength, a challenge you overcame, and why this role.',
    framework: 'Four answers, ~45s each',
    beats: [
      'Keep each answer tight',
      'Do not restart if you stumble — recover',
      'Close the last answer deliberately',
    ],
    prepSeconds: 90, targetSeconds: 180,
  },
]

// ── COLLEGE INTERVIEWS ──────────────────────────────────────────────────────

const COLLEGE_LESSONS: Lesson[] = [
  {
    id: 1, level: 1,
    title: 'Who you are',
    objective: 'Introduce yourself as a person, not a resume.',
    prompt: '"Tell me about yourself."',
    framework: 'Now → What drives you → Where it points',
    beats: [
      'Your year, school, and main interest',
      'One thing you genuinely care about',
      'Where you want to take it',
    ],
    prepSeconds: 60, targetSeconds: 60,
  },
  {
    id: 2, level: 1,
    title: 'What excites you academically',
    objective: 'Show real intellectual interest.',
    prompt: '"Describe an academic experience that genuinely excited you."',
    framework: 'The moment → Why it hooked you → What you did next',
    beats: [
      'A specific class, project, or book',
      'What made it click',
      'What you did because of it',
    ],
    prepSeconds: 60, targetSeconds: 65,
  },
  {
    id: 3, level: 1,
    title: 'Outside the classroom',
    objective: 'Talk about an activity with real depth.',
    prompt: '"What do you do outside of class that matters to you?"',
    framework: 'Activity → Your role → What it taught you',
    beats: [
      'What it is and how long you have done it',
      'What you specifically do in it',
      'What you have learned',
    ],
    prepSeconds: 60, targetSeconds: 60,
  },

  {
    id: 4, level: 2,
    title: 'Why this school',
    objective: 'Give reasons that could not apply to any school.',
    prompt: '"Why do you want to attend this college specifically?"',
    framework: 'Specific offering → Your fit → What you would do there',
    beats: [
      'Name a program, professor, or opportunity',
      'Connect it to something you already do',
      'Say what you would pursue there',
    ],
    prepSeconds: 75, targetSeconds: 65,
  },
  {
    id: 5, level: 2,
    title: 'What you would contribute',
    objective: 'Show what campus gains by admitting you.',
    prompt: '"What would you contribute to our campus community?"',
    framework: 'What you bring → Evidence → Where it fits',
    beats: [
      'Name one thing you reliably bring',
      'Prove it with something you have already done',
      'Name where it fits on their campus',
    ],
    prepSeconds: 75, targetSeconds: 60,
  },
  {
    id: 6, level: 2,
    title: 'Your intended major',
    objective: 'Explain your academic direction credibly.',
    prompt: '"What do you want to study, and why?"',
    framework: 'Field → Origin → Direction',
    beats: [
      'Name the field',
      'What first pulled you toward it',
      'What you want to do with it',
    ],
    prepSeconds: 60, targetSeconds: 60,
  },

  {
    id: 7, level: 3,
    title: 'Influence',
    objective: 'Talk about someone else while revealing yourself.',
    prompt: '"Tell me about a person who has significantly influenced you."',
    framework: 'Who → What they changed → How you show it',
    beats: [
      'Who they are and your relationship',
      'The specific thing they changed in you',
      'How that shows up in what you do',
    ],
    prepSeconds: 75, targetSeconds: 70,
  },
  {
    id: 8, level: 3,
    title: 'Growth',
    objective: 'Show self-awareness about how you have changed.',
    prompt: '"How have you grown over the past few years?"',
    framework: 'Who you were → What shifted → Who you are now',
    beats: [
      'Honestly describe your earlier self',
      'What caused the change',
      'Concrete evidence of the difference',
    ],
    prepSeconds: 75, targetSeconds: 70,
  },
  {
    id: 9, level: 3,
    title: 'A setback',
    objective: 'Discuss difficulty with maturity.',
    prompt: '"Tell me about a time something did not go the way you planned."',
    framework: 'What happened → How you responded → What you kept',
    beats: [
      'Describe it without drama',
      'What you actually did',
      'What you carried forward',
    ],
    prepSeconds: 75, targetSeconds: 70,
  },

  {
    id: 10, level: 4,
    title: 'Your questions for them',
    objective: 'Ask something that shows real research.',
    prompt: '"What questions do you have for me?"',
    framework: 'Researched question → Why you ask → Follow-up',
    beats: [
      'Ask about something specific to that school',
      'Say briefly why it matters to you',
      'Have a second question ready',
    ],
    prepSeconds: 60, targetSeconds: 50,
  },
  {
    id: 11, level: 4,
    title: 'The closing statement',
    objective: 'Leave one clear impression.',
    prompt: '"Is there anything else you would like us to know?"',
    framework: 'One theme → Evidence → Close',
    beats: [
      'Pick the one thing you want remembered',
      'Support it briefly',
      'End cleanly — do not trail off',
    ],
    prepSeconds: 60, targetSeconds: 50,
  },
  {
    id: 12, level: 4,
    title: 'Full mock interview',
    objective: 'Run a full interview without restarting.',
    prompt: 'Answer in order: tell me about yourself, why this school, what you would contribute, and anything else we should know.',
    framework: 'Four answers, ~45s each',
    beats: [
      'Keep each answer tight and specific',
      'Recover from stumbles instead of restarting',
      'Close deliberately',
    ],
    prepSeconds: 90, targetSeconds: 180,
  },
]

// ── TRACKS ──────────────────────────────────────────────────────────────────

const LEVELS_PRESENTATION = [
  { level: 1, name: 'Foundations',    caption: 'Say one clear thing' },
  { level: 2, name: 'Structure',      caption: 'Organize your points' },
  { level: 3, name: 'Delivery',       caption: 'Pace, pauses, transitions' },
  { level: 4, name: 'Command',        caption: 'Handle pressure and close' },
]

const LEVELS_INTERVIEW = [
  { level: 1, name: 'The Basics',     caption: 'Core questions' },
  { level: 2, name: 'Your Stories',   caption: 'STAR method' },
  { level: 3, name: 'Hard Questions', caption: 'Weakness, failure, gaps' },
  { level: 4, name: 'Full Mock',      caption: 'Put it together' },
]

const LEVELS_COLLEGE = [
  { level: 1, name: 'Who You Are',    caption: 'Introduce yourself' },
  { level: 2, name: 'Why This School',caption: 'Fit and contribution' },
  { level: 3, name: 'Depth',          caption: 'Influence, growth, setbacks' },
  { level: 4, name: 'Full Mock',      caption: 'Put it together' },
]

export const TRACKS: Track[] = [
  {
    id: 'presentations',
    label: 'Presentations',
    icon: '📚',
    blurb: 'Class presentations, speeches, and talks.',
    levels: LEVELS_PRESENTATION,
    lessons: PRESENTATION_LESSONS,
  },
  {
    id: 'job-interviews',
    label: 'Job Interviews',
    icon: '💼',
    blurb: 'First jobs, internships, and applications.',
    levels: LEVELS_INTERVIEW,
    lessons: JOB_LESSONS,
  },
  {
    id: 'college-interviews',
    label: 'College Interviews',
    icon: '🎓',
    blurb: 'Admissions and scholarship interviews.',
    levels: LEVELS_COLLEGE,
    lessons: COLLEGE_LESSONS,
  },
]

// ── HELPERS ─────────────────────────────────────────────────────────────────

export function getTrack(trackId: string): Track | undefined {
  return TRACKS.find(t => t.id === trackId)
}

export function getLesson(trackId: string, lessonId: number): Lesson | undefined {
  return getTrack(trackId)?.lessons.find(l => l.id === lessonId)
}

export function trackLength(trackId: string): number {
  return getTrack(trackId)?.lessons.length ?? 0
}

/** A lesson is unlocked if it's the first, or the one before it is complete. */
export function isLessonUnlocked(lessonId: number, completed: number[]): boolean {
  if (lessonId === 1) return true
  return completed.includes(lessonId - 1)
}

/** Percent complete for a track, 0–100. */
export function trackPercent(trackId: string, completed: number[]): number {
  const total = trackLength(trackId)
  if (!total) return 0
  return Math.round((completed.length / total) * 100)
}

/** Which level block a lesson sits in. */
export function levelOfLesson(trackId: string, lessonId: number): number {
  return getLesson(trackId, lessonId)?.level ?? 1
}

export function lessonsInLevel(trackId: string, level: number): Lesson[] {
  return getTrack(trackId)?.lessons.filter(l => l.level === level) ?? []
}

/** True when every lesson in a level is finished. */
export function isLevelComplete(trackId: string, level: number, completed: number[]): boolean {
  const lessons = lessonsInLevel(trackId, level)
  return lessons.length > 0 && lessons.every(l => completed.includes(l.id))
}

/** The next lesson after this one, or null at the end of the track. */
export function nextLesson(trackId: string, lessonId: number): Lesson | undefined {
  return getLesson(trackId, lessonId + 1)
}

/** Human label for a level, e.g. "Level 2 — Structure". */
export function levelLabel(trackId: string, level: number): string {
  const meta = getTrack(trackId)?.levels.find(l => l.level === level)
  return meta ? `Level ${level} — ${meta.name}` : `Level ${level}`
}

/**
 * A lesson's minimum recording length. Lessons with short targets shouldn't be
 * held to the generic 30s floor, or lesson 1 becomes impossible to pass.
 */
export function minSecondsFor(lesson: Lesson): number {
  return Math.max(12, Math.min(30, Math.round(lesson.targetSeconds * 0.6)))
}

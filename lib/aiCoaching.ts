import OpenAI from "openai"

const client = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
})

export type AICoachingResult = {
  overallScore: number
  summary: string
  strengths: string[]
  improvements: string[]
  deliveryFeedback: string
  suggestedRewrite: string
}

export async function getAICoaching(
  transcript: string
): Promise<AICoachingResult> {
  if (!transcript || transcript.trim().length === 0) {
    return {
      overallScore: 0,
      summary: "No speech detected.",
      strengths: [],
      improvements: ["Provide a spoken response."],
      deliveryFeedback: "",
      suggestedRewrite: "",
    }
  }

  const prompt = `
You are an elite communication coach.

Analyze the following spoken transcript and provide detailed, specific, and actionable feedback.

Transcript:
"""
${transcript}
"""

Return ONLY valid JSON in this format:
{
  "overallScore": number (0-100),
  "summary": "short paragraph",
  "strengths": ["point", "point"],
  "improvements": ["point", "point"],
  "deliveryFeedback": "detailed paragraph",
  "suggestedRewrite": "improved version of what the user said"
}

Rules:
- Be specific to the transcript
- Do NOT be generic
- Call out real phrasing issues
- Sound like a high-level coach
`

  const response = await client.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "system",
        content: "You are a world-class communication and public speaking coach.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    temperature: 0.7,
  })

  const text = response.choices[0]?.message?.content || ""

  try {
    const parsed = JSON.parse(text)
    return parsed
  } catch (err) {
    console.error("AI parsing failed:", text)

    return {
      overallScore: 70,
      summary: "AI response parsing failed.",
      strengths: [],
      improvements: ["Try again."],
      deliveryFeedback: text, // still show raw AI output
      suggestedRewrite: "",
    }
  }
}
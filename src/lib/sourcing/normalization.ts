import { OpenAIConfigError } from "@/lib/openai/scoring"

export interface NormalizedCard {
  card_name: string | null
  set_name: string | null
  card_number: string | null
  condition: string | null
  grading_company: string | null
  grade: string | null
  raw_condition: string | null
  confidence: number
}

const cache = new Map<string, NormalizedCard>()

const NULL_RESULT: NormalizedCard = {
  card_name: null,
  set_name: null,
  card_number: null,
  condition: null,
  grading_company: null,
  grade: null,
  raw_condition: null,
  confidence: 0,
}

export async function normalizeTitle(title: string): Promise<NormalizedCard> {
  const key = title.trim().toLowerCase()
  if (cache.has(key)) return cache.get(key)!

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return NULL_RESULT

  const prompt = `You are a Pokémon card data parser. Extract structured card data from this raw eBay listing title.

Title: "${title}"

Return ONLY valid JSON with these exact fields:
{
  "card_name": string or null,        // e.g. "Charizard", "Pikachu"
  "set_name": string or null,         // e.g. "Base Set", "Jungle", "Skyridge"
  "card_number": string or null,      // e.g. "4/102", "6/64"
  "condition": string or null,        // "Graded" if a grading company/grade is present, "Raw" otherwise
  "grading_company": string or null,  // "PSA", "BGS", "CGC", "SGC" or null
  "grade": string or null,            // "10", "9.5", "9", "8" etc or null
  "raw_condition": string or null,    // "Near Mint", "Lightly Played", "Moderately Played", "Heavily Played", "Damaged" — only if Raw
  "confidence": number                // 0-100: how confident you are in the parse
}`

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.1,
        max_tokens: 200,
      }),
    })

    if (!res.ok) return NULL_RESULT

    const data = await res.json()
    const parsed = JSON.parse(data.choices[0].message.content)

    const result: NormalizedCard = {
      card_name: parsed.card_name ?? null,
      set_name: parsed.set_name ?? null,
      card_number: parsed.card_number ?? null,
      condition: parsed.condition ?? null,
      grading_company: parsed.grading_company ?? null,
      grade: parsed.grade != null ? String(parsed.grade) : null,
      raw_condition: parsed.raw_condition ?? null,
      confidence: typeof parsed.confidence === "number"
        ? Math.min(100, Math.max(0, Math.round(parsed.confidence)))
        : 0,
    }

    cache.set(key, result)
    return result
  } catch {
    return NULL_RESULT
  }
}

export { OpenAIConfigError }

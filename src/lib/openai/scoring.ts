import type { ExternalListing } from "@/lib/types/database"

export class OpenAIConfigError extends Error {
  constructor() {
    super("OpenAI API key is not configured. See docs/SETUP.md → OpenAI.")
    this.name = "OpenAIConfigError"
  }
}

export interface DealScoreResult {
  overall_score: number
  value_score: number
  risk_score: number
  authenticity_score: number
  reasoning: string
  recommendation: "buy" | "watch" | "skip"
  flags: string[]
  model_used: string
  prompt_tokens: number
  completion_tokens: number
}

export async function scoreDeal(
  listing: ExternalListing,
  marketPrice: number | null
): Promise<DealScoreResult> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new OpenAIConfigError()

  const priceDiff = marketPrice
    ? Math.round(((marketPrice - listing.price) / marketPrice) * 100)
    : null

  const prompt = `You are an expert Pokémon card trader evaluating a potential arbitrage deal.

LISTING DATA:
- Title: ${listing.title}
- Source: ${listing.source}
- Price: $${listing.price}${listing.shipping_cost ? ` + $${listing.shipping_cost} shipping` : " (free shipping)"}
- Market Price (TCGplayer): ${marketPrice ? `$${marketPrice}` : "unknown"}
- Price below market: ${priceDiff !== null ? `${priceDiff}%` : "unknown"}
- Seller: ${listing.seller_name ?? "unknown"} (feedback: ${listing.seller_feedback_percent ?? "?"}% positive, ${listing.seller_feedback_score ?? "?"} reviews)
- Condition noted: ${listing.condition ?? "not specified"}
- Grading company: ${listing.grading_company ?? "none"}
- Grade: ${listing.grade ?? "none"}
- Card name (AI-parsed): ${listing.card_name ?? "unknown"}
- Set: ${listing.set_name ?? "unknown"}
- Has image: ${listing.image_url ? "yes" : "no"}

Score this deal 0-100 on:
1. value_score: How good is the price vs market value?
2. risk_score: How trustworthy is this seller/listing? (higher = less risky)
3. authenticity_score: How likely is this card to be genuine?
4. overall_score: Overall deal quality considering all factors

Also provide:
- recommendation: "buy" (score 75+), "watch" (50-74), or "skip" (under 50)
- reasoning: 2-3 sentences explaining your assessment
- flags: array of concerns (e.g. "low_seller_feedback", "no_images", "ungraded_high_value", "suspicious_price", "vague_title")

Respond ONLY with valid JSON matching this schema:
{
  "overall_score": number,
  "value_score": number,
  "risk_score": number,
  "authenticity_score": number,
  "reasoning": string,
  "recommendation": "buy" | "watch" | "skip",
  "flags": string[]
}`

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
      temperature: 0.2,
      max_tokens: 500,
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`OpenAI scoring failed: ${res.status} ${body}`)
  }

  const data = await res.json()
  const content = data.choices[0].message.content
  const parsed = JSON.parse(content)

  return {
    overall_score: Math.min(100, Math.max(0, Math.round(parsed.overall_score))),
    value_score: Math.min(100, Math.max(0, Math.round(parsed.value_score))),
    risk_score: Math.min(100, Math.max(0, Math.round(parsed.risk_score))),
    authenticity_score: Math.min(100, Math.max(0, Math.round(parsed.authenticity_score))),
    reasoning: parsed.reasoning ?? "",
    recommendation: parsed.recommendation ?? "skip",
    flags: Array.isArray(parsed.flags) ? parsed.flags : [],
    model_used: data.model,
    prompt_tokens: data.usage?.prompt_tokens ?? 0,
    completion_tokens: data.usage?.completion_tokens ?? 0,
  }
}

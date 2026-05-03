import { NextResponse } from "next/server"
import { createClient, createAdminClient } from "@/lib/supabase/server"
import { scoreDeal, OpenAIConfigError } from "@/lib/openai/scoring"
import { z } from "zod"

const schema = z.object({ externalListingId: z.string().uuid() })

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single()
  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const adminClient = await createAdminClient()

  const { data: listing, error: fetchError } = await adminClient
    .from("external_listings")
    .select("*")
    .eq("id", parsed.data.externalListingId)
    .single()

  if (fetchError || !listing) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 })
  }

  // Mark as scoring
  await adminClient
    .from("external_listings")
    .update({ status: "scoring" })
    .eq("id", listing.id)

  try {
    const { data: aggRow } = await adminClient
      .from("aggregated_prices")
      .select("confidence_score")
      .eq("external_listing_id", listing.id)
      .single()

    const scoreResult = await scoreDeal(listing, listing.market_price, aggRow?.confidence_score ?? null)

    const { data: score, error: insertError } = await adminClient
      .from("deal_scores")
      .insert({
        external_listing_id: listing.id,
        ...scoreResult,
      })
      .select()
      .single()

    if (insertError) throw new Error(insertError.message)

    await adminClient
      .from("external_listings")
      .update({ status: "scored" })
      .eq("id", listing.id)

    return NextResponse.json({ score })
  } catch (err) {
    // Roll back scoring status on failure
    await adminClient
      .from("external_listings")
      .update({ status: "new" })
      .eq("id", listing.id)

    if (err instanceof OpenAIConfigError) {
      return NextResponse.json(
        { error: "OpenAI API key not configured", missingKey: "OPENAI_API_KEY" },
        { status: 503 }
      )
    }

    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

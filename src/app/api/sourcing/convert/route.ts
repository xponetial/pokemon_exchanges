import { NextResponse } from "next/server"
import { createClient, createAdminClient } from "@/lib/supabase/server"
import { z } from "zod"

const schema = z.object({
  externalListingId: z.string().uuid(),
  purchasePrice: z.number().positive(),
  targetSellPrice: z.number().positive().optional(),
  purchaseDate: z.string().optional(),
  notes: z.string().max(1000).optional(),
})

// POST  /api/sourcing/convert
// Marks an external listing as purchased and adds it to sourced_inventory
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

  // Add to sourced inventory
  const { data: inventory, error: insertError } = await adminClient
    .from("sourced_inventory")
    .insert({
      admin_id: user.id,
      external_listing_id: listing.id,
      card_name: listing.card_name ?? listing.title,
      set_name: listing.set_name,
      card_number: listing.card_number,
      condition: listing.condition ?? "Unknown",
      grading_company: listing.grading_company,
      grade: listing.grade,
      purchase_price: parsed.data.purchasePrice,
      market_price: listing.market_price,
      target_sell_price: parsed.data.targetSellPrice ?? null,
      purchase_url: listing.url,
      purchase_date: parsed.data.purchaseDate ?? new Date().toISOString().split("T")[0],
      notes: parsed.data.notes ?? null,
      images: listing.image_url ? [listing.image_url] : [],
      status: "pending",
    })
    .select()
    .single()

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  // Mark external listing as purchased
  await adminClient
    .from("external_listings")
    .update({ status: "purchased" })
    .eq("id", listing.id)

  return NextResponse.json({ inventory })
}

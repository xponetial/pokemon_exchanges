import { NextResponse } from "next/server"
import { createClient, createAdminClient } from "@/lib/supabase/server"
import { z } from "zod"

const schema = z.object({
  inventoryId: z.string().uuid(),
  price: z.number().positive(),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
})

// POST /api/admin/inventory/create-listing
// Converts a sourced_inventory item into a live marketplace listing
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

  const { data: item, error: fetchError } = await adminClient
    .from("sourced_inventory")
    .select("*")
    .eq("id", parsed.data.inventoryId)
    .eq("admin_id", user.id)
    .single()

  if (fetchError || !item) {
    return NextResponse.json({ error: "Inventory item not found" }, { status: 404 })
  }

  if (item.status === "listed" || item.listing_id) {
    return NextResponse.json({ error: "Already listed" }, { status: 409 })
  }

  // Determine condition fields
  const isGraded = !!item.grading_company
  const listingInsert = {
    seller_id: user.id,
    card_name: item.card_name,
    set_name: item.set_name,
    card_number: item.card_number,
    condition: isGraded ? "Graded" as const : "Raw" as const,
    grading_company: item.grading_company ?? null,
    grade: item.grade ?? null,
    raw_condition: isGraded ? null : item.condition,
    price: Math.round(parsed.data.price * 100),
    title: parsed.data.title,
    description: parsed.data.description ?? null,
    images: item.images ?? [],
    status: "active" as const,
  }

  const { data: listing, error: listingError } = await adminClient
    .from("listings")
    .insert(listingInsert)
    .select()
    .single()

  if (listingError) {
    return NextResponse.json({ error: listingError.message }, { status: 500 })
  }

  // Update inventory status
  await adminClient
    .from("sourced_inventory")
    .update({ status: "listed", listing_id: listing.id })
    .eq("id", item.id)

  return NextResponse.json({ listing })
}

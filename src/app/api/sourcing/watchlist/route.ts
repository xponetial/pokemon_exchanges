import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { z } from "zod"

const addSchema = z.object({
  externalListingId: z.string().uuid(),
  notes: z.string().max(500).optional(),
  priority: z.enum(["low", "normal", "high"]).optional(),
})

const removeSchema = z.object({ externalListingId: z.string().uuid() })

async function getAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single()
  if (profile?.role !== "admin") return null
  return { supabase, userId: user.id }
}

// GET  /api/sourcing/watchlist
export async function GET() {
  const ctx = await getAdmin()
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data, error } = await ctx.supabase
    .from("watchlist")
    .select(`*, external_listings(*, deal_scores(*))`)
    .eq("admin_id", ctx.userId)
    .order("created_at", { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ items: data })
}

// POST  /api/sourcing/watchlist
export async function POST(req: Request) {
  const ctx = await getAdmin()
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json().catch(() => null)
  const parsed = addSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { data, error } = await ctx.supabase
    .from("watchlist")
    .upsert({
      admin_id: ctx.userId,
      external_listing_id: parsed.data.externalListingId,
      notes: parsed.data.notes ?? null,
      priority: parsed.data.priority ?? "normal",
    }, { onConflict: "admin_id,external_listing_id" })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Update listing status
  await ctx.supabase
    .from("external_listings")
    .update({ status: "watchlisted" })
    .eq("id", parsed.data.externalListingId)

  return NextResponse.json({ item: data })
}

// DELETE  /api/sourcing/watchlist
export async function DELETE(req: Request) {
  const ctx = await getAdmin()
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json().catch(() => null)
  const parsed = removeSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { error } = await ctx.supabase
    .from("watchlist")
    .delete()
    .eq("admin_id", ctx.userId)
    .eq("external_listing_id", parsed.data.externalListingId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getSoldCompsPrice } from "@/lib/ebay/soldComps"
import { EbayConfigError } from "@/lib/ebay/client"
import { withCache, TTL } from "@/lib/sourcing/priceCache"

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const query = req.nextUrl.searchParams.get("query")?.trim()
  if (!query) {
    return NextResponse.json({ error: "Missing required param: query" }, { status: 400 })
  }

  try {
    const result = await withCache(
      `ebay-comps:${query.toLowerCase()}`,
      TTL.EBAY_COMPS,
      () => getSoldCompsPrice(query)
    )
    return NextResponse.json(result)
  } catch (err) {
    if (err instanceof EbayConfigError) {
      return NextResponse.json(
        { error: "eBay API keys not configured", averagePrice: null, comps: [], count: 0 },
        { status: 503 }
      )
    }
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    )
  }
}

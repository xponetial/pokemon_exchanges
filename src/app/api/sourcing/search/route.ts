import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { searchAndSave } from "@/lib/sourcing/search"
import { z } from "zod"

const schema = z.object({
  query: z.string().min(1).max(200),
  limit: z.number().int().min(1).max(50).optional(),
})

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

  const result = await searchAndSave(parsed.data.query, { limit: parsed.data.limit })
  return NextResponse.json(result)
}

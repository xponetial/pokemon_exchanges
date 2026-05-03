"use client"
import { createBrowserClient } from "@supabase/ssr"

// Database generic omitted intentionally — use `supabase gen types typescript` once DB is live.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

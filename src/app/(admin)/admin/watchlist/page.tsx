import { createClient, createAdminClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Bookmark } from "lucide-react"
import { DealCard } from "@/components/admin/DealCard"
import type { Metadata } from "next"
import type { ExternalListingWithScore, WatchlistItem } from "@/lib/types/database"

export const metadata: Metadata = { title: "Watchlist — Admin" }

type WatchlistRow = WatchlistItem & {
  external_listings: ExternalListingWithScore
}

export default async function WatchlistPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login?redirect=/admin/watchlist")

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single()
  if (profile?.role !== "admin") redirect("/admin")

  const adminClient = await createAdminClient()
  const { data: items } = await adminClient
    .from("watchlist")
    .select("*, external_listings(*, deal_scores(*))")
    .eq("admin_id", user.id)
    .order("created_at", { ascending: false })

  const watchlistItems = (items ?? []) as WatchlistRow[]

  return (
    <div>
      <h1 className="text-2xl font-bold text-text mb-1">Watchlist</h1>
      <p className="text-text-secondary text-sm mb-6">
        Listings you&apos;ve saved to review before buying.
      </p>

      {watchlistItems.length === 0 ? (
        <div className="bg-surface rounded border border-border p-14 text-center">
          <Bookmark className="w-8 h-8 text-text-muted mx-auto mb-3" />
          <p className="text-text-secondary text-sm mb-3">
            Your watchlist is empty.
          </p>
          <Link href="/admin/sourcing" className="text-primary text-sm hover:underline">
            Search for deals →
          </Link>
        </div>
      ) : (
        <>
          <p className="text-sm text-text-secondary mb-4">
            {watchlistItems.length} item{watchlistItems.length !== 1 ? "s" : ""}
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {watchlistItems.map((item) => (
              <div key={item.id} className="flex flex-col gap-1.5">
                <DealCard listing={item.external_listings} isWatchlisted />
                {item.priority !== "normal" && (
                  <span className={`text-xs text-center font-semibold uppercase ${item.priority === "high" ? "text-red-600" : "text-text-muted"}`}>
                    {item.priority} priority
                  </span>
                )}
                {item.notes && (
                  <p className="text-xs text-text-secondary px-1 line-clamp-2">{item.notes}</p>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

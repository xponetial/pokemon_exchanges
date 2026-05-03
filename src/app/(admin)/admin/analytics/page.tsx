import { createClient, createAdminClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { TrendingUp, DollarSign, ShoppingBag, Target } from "lucide-react"
import { formatPriceDollars } from "@/lib/utils"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Analytics — Admin" }

export default async function AnalyticsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login?redirect=/admin/analytics")

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single()
  if (profile?.role !== "admin") redirect("/admin")

  const adminClient = await createAdminClient()

  const [
    { data: inventoryItems },
    { data: soldItems },
    { count: totalDealsFound },
    { count: totalScored },
    { data: topDeals },
    { data: recentListings },
  ] = await Promise.all([
    adminClient.from("sourced_inventory").select("purchase_price, market_price, target_sell_price, status"),
    adminClient.from("sourced_inventory").select("purchase_price, market_price").eq("status", "sold"),
    adminClient.from("external_listings").select("*", { count: "exact", head: true }),
    adminClient.from("deal_scores").select("*", { count: "exact", head: true }),
    adminClient.from("deal_scores")
      .select("overall_score, recommendation, external_listing_id, external_listings(title, price, market_price, url)")
      .gte("overall_score", 75)
      .order("overall_score", { ascending: false })
      .limit(5),
    adminClient.from("external_listings")
      .select("title, price, market_price, price_diff_percent, status, created_at")
      .order("created_at", { ascending: false })
      .limit(10),
  ])

  const inventory = inventoryItems ?? []
  const sold = soldItems ?? []

  const totalInvested = inventory.reduce((s, i) => s + i.purchase_price, 0)
  const totalMarketValue = inventory.reduce((s, i) => s + (i.market_price ?? i.purchase_price), 0)
  const unrealizedGain = totalMarketValue - totalInvested
  const realizedGain = sold.reduce((s, i) => s + ((i.market_price ?? i.purchase_price) - i.purchase_price), 0)

  const scoringRate = totalDealsFound && totalDealsFound > 0
    ? Math.round(((totalScored ?? 0) / totalDealsFound) * 100)
    : 0

  return (
    <div>
      <h1 className="text-2xl font-bold text-text mb-1">Analytics</h1>
      <p className="text-text-secondary text-sm mb-8">Sourcing performance and platform metrics.</p>

      {/* P&L Summary */}
      <h2 className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-3">Profit & Loss</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {[
          { label: "Total Invested",    value: formatPriceDollars(totalInvested),   icon: DollarSign, color: "text-text" },
          { label: "Market Value",      value: formatPriceDollars(totalMarketValue), icon: TrendingUp, color: "text-text" },
          { label: "Unrealized Gain",   value: formatPriceDollars(unrealizedGain),   icon: Target,     color: unrealizedGain >= 0 ? "text-green-700" : "text-red-600" },
          { label: "Realized Gain",     value: formatPriceDollars(realizedGain),     icon: ShoppingBag, color: realizedGain >= 0 ? "text-green-700" : "text-red-600" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded border border-border p-4">
            <div className="flex items-center gap-2 mb-2">
              <Icon className="w-4 h-4 text-primary" />
              <span className="text-xs text-text-secondary">{label}</span>
            </div>
            <p className={`text-xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Sourcing Stats */}
      <h2 className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-3">Sourcing Activity</h2>
      <div className="grid grid-cols-3 gap-4 mb-10">
        {[
          { label: "Total Deals Found",  value: totalDealsFound ?? 0 },
          { label: "Deals Scored",       value: totalScored ?? 0 },
          { label: "Scoring Rate",       value: `${scoringRate}%` },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white rounded border border-border p-4">
            <p className="text-xs text-text-secondary mb-1">{label}</p>
            <p className="text-2xl font-bold text-text">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Deals */}
        <div>
          <h2 className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-3">Top Scored Deals</h2>
          <div className="bg-white rounded border border-border divide-y divide-border">
            {(topDeals ?? []).length === 0 ? (
              <p className="px-4 py-6 text-sm text-text-muted text-center">No scored deals yet.</p>
            ) : (topDeals ?? []).map((d) => {
              const listing = d.external_listings as unknown as { title: string; price: number; market_price: number | null; url: string } | null
              return (
                <div key={d.external_listing_id} className="px-4 py-3 flex items-center gap-3">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${d.overall_score >= 75 ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>
                    {d.overall_score}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text truncate">{listing?.title ?? "Unknown"}</p>
                    <p className="text-xs text-text-secondary">
                      {listing?.price ? formatPriceDollars(listing.price) : "—"}
                      {listing?.market_price ? ` · market ${formatPriceDollars(listing.market_price)}` : ""}
                    </p>
                  </div>
                  <span className={`text-xs font-semibold uppercase px-2 py-0.5 rounded ${d.recommendation === "buy" ? "bg-green-600 text-white" : "bg-yellow-500 text-white"}`}>
                    {d.recommendation}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Recent Listings */}
        <div>
          <h2 className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-3">Recently Found</h2>
          <div className="bg-white rounded border border-border divide-y divide-border">
            {(recentListings ?? []).length === 0 ? (
              <p className="px-4 py-6 text-sm text-text-muted text-center">No listings found yet.</p>
            ) : (recentListings ?? []).map((l, i) => (
              <div key={i} className="px-4 py-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text truncate">{l.title}</p>
                  <p className="text-xs text-text-secondary">
                    {formatPriceDollars(l.price)}
                    {l.price_diff_percent != null && l.price_diff_percent > 0
                      ? ` · ${Math.round(l.price_diff_percent)}% below market`
                      : ""}
                  </p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded capitalize ${
                  l.status === "purchased" ? "bg-green-100 text-green-800"
                  : l.status === "scored" ? "bg-blue-100 text-blue-800"
                  : "bg-surface text-text-secondary"
                }`}>
                  {l.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

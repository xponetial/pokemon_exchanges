import { createClient, createAdminClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Lock, Search, Bookmark, Package, TrendingUp, Database } from "lucide-react"
import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Admin — Pokemon Exchanges" }

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login?redirect=/admin")

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single()

  if (profile?.role !== "admin") {
    return (
      <div className="bg-white rounded-lg border border-border p-10 text-center max-w-sm mx-auto">
        <Lock className="w-10 h-10 text-text-muted mx-auto mb-3" />
        <h1 className="text-lg font-bold text-text mb-1">Access Denied</h1>
        <p className="text-text-secondary text-sm">This area is restricted to admins only.</p>
      </div>
    )
  }

  const adminClient = await createAdminClient()

  const [
    { count: newDeals },
    { count: watchlistCount },
    { count: inventoryCount },
    { count: scoredDeals },
    { count: totalSnapshots },
    { count: activeSnapshots },
  ] = await Promise.all([
    adminClient.from("external_listings").select("*", { count: "exact", head: true }).eq("status", "new"),
    adminClient.from("watchlist").select("*", { count: "exact", head: true }),
    adminClient.from("sourced_inventory").select("*", { count: "exact", head: true }).neq("status", "sold"),
    adminClient.from("deal_scores").select("*", { count: "exact", head: true }).gte("overall_score", 75),
    adminClient.from("price_snapshots").select("*", { count: "exact", head: true }),
    adminClient.from("price_snapshots").select("*", { count: "exact", head: true }).gt("expires_at", new Date().toISOString()),
  ])

  const cacheHitRate =
    totalSnapshots && totalSnapshots > 0
      ? Math.round(((activeSnapshots ?? 0) / totalSnapshots) * 100)
      : 0

  const stats = [
    { label: "New Deals Found",    value: newDeals ?? 0,      icon: Search,    href: "/admin/sourcing" },
    { label: "Watchlisted",        value: watchlistCount ?? 0, icon: Bookmark,  href: "/admin/watchlist" },
    { label: "Active Inventory",   value: inventoryCount ?? 0, icon: Package,   href: "/admin/inventory" },
    { label: "High-Score Deals",   value: scoredDeals ?? 0,    icon: TrendingUp, href: "/admin/sourcing" },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold text-text mb-1">Admin Dashboard</h1>
      <p className="text-text-secondary text-sm mb-8">AI Sourcing Engine — Phase 2</p>

      {/* Sourcing Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {stats.map(({ label, value, icon: Icon, href }) => (
          <Link
            key={label}
            href={href}
            className="bg-white rounded border border-border p-4 hover:border-primary hover:shadow-sm transition-all"
          >
            <div className="flex items-center gap-2 mb-2">
              <Icon className="w-4 h-4 text-primary" />
              <span className="text-xs text-text-secondary">{label}</span>
            </div>
            <p className="text-2xl font-bold text-text">{value}</p>
          </Link>
        ))}
      </div>

      {/* Price Cache Stats */}
      <div className="bg-white rounded border border-border p-4 mb-10 flex items-center gap-6">
        <Database className="w-5 h-5 text-primary shrink-0" />
        <div>
          <p className="text-xs text-text-secondary mb-0.5">Price Cache</p>
          <p className="text-sm font-semibold text-text">
            {activeSnapshots ?? 0} active / {totalSnapshots ?? 0} total
            <span className="ml-2 text-text-secondary font-normal">({cacheHitRate}% fresh)</span>
          </p>
        </div>
        <p className="text-xs text-text-secondary ml-auto">
          TCGplayer 6h · PriceCharting 12h · eBay 15m
        </p>
      </div>

      {/* Quick actions */}
      <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-widest mb-3">
        Quick Actions
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            title: "Search for Deals",
            description: "Search eBay for undervalued Pokémon cards and score them with AI.",
            href: "/admin/sourcing",
            icon: Search,
            cta: "Open Sourcing Tool",
          },
          {
            title: "Watchlist",
            description: "Review listings you've saved to watch before deciding to buy.",
            href: "/admin/watchlist",
            icon: Bookmark,
            cta: "View Watchlist",
          },
          {
            title: "Sourced Inventory",
            description: "Manage cards you've purchased and track them through to listing.",
            href: "/admin/inventory",
            icon: Package,
            cta: "Manage Inventory",
          },
        ].map((card) => (
          <Link
            key={card.title}
            href={card.href}
            className="bg-white rounded border border-border p-5 hover:border-primary hover:shadow-sm transition-all group"
          >
            <card.icon className="w-6 h-6 text-primary mb-3" />
            <h3 className="font-semibold text-text mb-1">{card.title}</h3>
            <p className="text-sm text-text-secondary mb-4">{card.description}</p>
            <span className="text-sm font-medium text-primary group-hover:underline">{card.cta} →</span>
          </Link>
        ))}
      </div>
    </div>
  )
}

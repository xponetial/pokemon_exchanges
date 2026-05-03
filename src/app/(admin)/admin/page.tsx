import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Lock } from "lucide-react"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Admin — Pokemon Exchanges" }

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login?redirect=/admin")

  const { data: profileData } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  const profile = profileData as { role: string } | null

  if (profile?.role !== "admin") {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="bg-white rounded-lg border border-border p-10 text-center max-w-sm">
          <Lock className="w-10 h-10 text-text-muted mx-auto mb-3" />
          <h1 className="text-lg font-bold text-text mb-1">Access Denied</h1>
          <p className="text-text-secondary text-sm">This area is restricted to admins only.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-screen-xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-text mb-2">Admin Dashboard</h1>
      <p className="text-text-secondary mb-8">Phase 2 — AI Sourcing Engine coming soon</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { title: "AI Sourcing Engine", description: "Search eBay & TCGplayer for undervalued cards", badge: "Phase 2", href: "#" },
          { title: "Deal Scoring", description: "AI-powered deal analysis and risk scoring", badge: "Phase 2", href: "#" },
          { title: "Watchlist", description: "Track sourcing opportunities", badge: "Phase 2", href: "#" },
          { title: "Inventory", description: "Manage Mitch's sourced inventory", badge: "Phase 2", href: "#" },
          { title: "Analytics", description: "GMV, conversion rates, platform revenue", badge: "Phase 2", href: "#" },
          { title: "User Management", description: "Manage users, sellers, and disputes", badge: "Phase 2", href: "#" },
        ].map((card) => (
          <div key={card.title} className="bg-white rounded border border-border p-5 opacity-75">
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold text-text">{card.title}</h3>
              <span className="text-xs bg-surface px-2 py-0.5 rounded text-text-secondary">{card.badge}</span>
            </div>
            <p className="text-sm text-text-secondary">{card.description}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Plus, Package, TrendingUp, DollarSign, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatPriceDollars } from "@/lib/utils"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Seller Dashboard" }

export default async function SellerDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login?redirect=/seller/dashboard")

  const { data: seller } = await supabase
    .from("sellers")
    .select("*")
    .eq("id", user.id)
    .single()

  if (!seller) redirect("/seller/onboarding")

  const { data: listings } = await supabase
    .from("listings")
    .select("*")
    .eq("seller_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10)

  const { data: orders } = await supabase
    .from("orders")
    .select("total, status")
    .eq("seller_id", user.id)

  const totalRevenue = (orders ?? []).filter((o) => o.status === "complete").reduce((s, o) => s + o.total, 0)
  const activeListings = (listings ?? []).filter((l) => l.status === "active").length
  const totalViews = (listings ?? []).reduce((s, l) => s + (l.views ?? 0), 0)

  return (
    <div className="max-w-screen-lg mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text">Seller Dashboard</h1>
          <p className="text-text-secondary text-sm">{seller.display_name}</p>
        </div>
        <Link href="/seller/listings/new">
          <Button><Plus className="w-4 h-4" /> New Listing</Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Revenue", value: formatPriceDollars(totalRevenue), icon: DollarSign, color: "text-success" },
          { label: "Active Listings", value: String(activeListings), icon: Package, color: "text-primary" },
          { label: "Total Orders", value: String(orders?.length ?? 0), icon: TrendingUp, color: "text-primary" },
          { label: "Total Views", value: String(totalViews), icon: Eye, color: "text-text-secondary" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded border border-border p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-text-secondary font-medium uppercase tracking-wide">{stat.label}</p>
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
            </div>
            <p className="text-2xl font-bold text-text">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Recent Listings */}
      <div className="bg-white rounded border border-border">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="font-semibold text-text">Recent Listings</h2>
          <Link href="/seller/listings" className="text-sm text-primary hover:underline">
            View all
          </Link>
        </div>
        {!listings || listings.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-text-secondary text-sm mb-3">No listings yet.</p>
            <Link href="/seller/listings/new">
              <Button size="sm"><Plus className="w-3.5 h-3.5" /> Create your first listing</Button>
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {listings.map((listing) => (
              <div key={listing.id} className="flex items-center gap-4 p-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text truncate">{listing.title}</p>
                  <p className="text-xs text-text-secondary">{listing.set_name ?? "—"}</p>
                </div>
                <div className="flex items-center gap-3 text-sm shrink-0">
                  <Badge variant={listing.status === "active" ? "success" : listing.status === "sold" ? "primary" : "default"}>
                    {listing.status}
                  </Badge>
                  <span className="font-medium text-text w-20 text-right">{formatPriceDollars(listing.price)}</span>
                  <span className="text-text-secondary text-xs w-16 text-right">{listing.views} views</span>
                  <Link href={`/seller/listings/${listing.id}/edit`} className="text-primary hover:underline text-xs">
                    Edit
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stripe notice */}
      <div className="mt-4 bg-primary-light border border-primary rounded-lg p-4 text-sm text-primary">
        <p className="font-medium">Payouts coming soon</p>
        <p className="text-primary/80 mt-0.5">Stripe Connect is being configured. Once live, you&apos;ll receive automatic payouts to your bank account within 2–3 business days of each completed sale.</p>
      </div>
    </div>
  )
}

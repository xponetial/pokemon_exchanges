import { createClient, createAdminClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Package, ExternalLink } from "lucide-react"
import { formatPriceDollars } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import type { Metadata } from "next"
import type { SourcedInventory } from "@/lib/types/database"

export const metadata: Metadata = { title: "Inventory — Admin" }

const statusVariant: Record<SourcedInventory["status"], "default" | "warning" | "primary" | "success"> = {
  pending:  "warning",
  received: "default",
  listed:   "primary",
  sold:     "success",
}

export default async function InventoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login?redirect=/admin/inventory")

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single()
  if (profile?.role !== "admin") redirect("/admin")

  const adminClient = await createAdminClient()
  const { data: items } = await adminClient
    .from("sourced_inventory")
    .select("*")
    .eq("admin_id", user.id)
    .order("created_at", { ascending: false })

  const inventory = (items ?? []) as SourcedInventory[]

  const totalCost = inventory.reduce((sum, i) => sum + i.purchase_price, 0)
  const totalMarket = inventory.reduce((sum, i) => sum + (i.market_price ?? i.purchase_price), 0)
  const unrealizedGain = totalMarket - totalCost

  return (
    <div>
      <h1 className="text-2xl font-bold text-text mb-1">Sourced Inventory</h1>
      <p className="text-text-secondary text-sm mb-6">
        Cards you&apos;ve purchased from external sources.
      </p>

      {/* Summary */}
      {inventory.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: "Total Cost",        value: formatPriceDollars(totalCost) },
            { label: "Market Value",      value: formatPriceDollars(totalMarket) },
            { label: "Unrealized Gain",   value: formatPriceDollars(unrealizedGain), positive: unrealizedGain >= 0 },
          ].map(({ label, value, positive }) => (
            <div key={label} className="bg-white rounded border border-border p-4">
              <p className="text-xs text-text-secondary mb-1">{label}</p>
              <p className={`text-xl font-bold ${positive === false ? "text-red-600" : positive ? "text-green-700" : "text-text"}`}>
                {value}
              </p>
            </div>
          ))}
        </div>
      )}

      {inventory.length === 0 ? (
        <div className="bg-surface rounded border border-border p-14 text-center">
          <Package className="w-8 h-8 text-text-muted mx-auto mb-3" />
          <p className="text-text-secondary text-sm mb-3">No inventory yet.</p>
          <Link href="/admin/sourcing" className="text-primary text-sm hover:underline">
            Find deals to purchase →
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface border-b border-border">
              <tr>
                {["Card", "Condition", "Purchased", "Market", "Target", "Status", ""].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {inventory.map((item) => (
                <tr key={item.id} className="hover:bg-surface/50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-text">{item.card_name}</p>
                    {item.set_name && <p className="text-xs text-text-secondary">{item.set_name}</p>}
                  </td>
                  <td className="px-4 py-3 text-text-secondary">
                    {item.grading_company
                      ? `${item.grading_company} ${item.grade}`
                      : item.condition}
                  </td>
                  <td className="px-4 py-3 font-medium text-text">
                    {formatPriceDollars(item.purchase_price)}
                  </td>
                  <td className="px-4 py-3 text-text-secondary">
                    {item.market_price ? formatPriceDollars(item.market_price) : "—"}
                  </td>
                  <td className="px-4 py-3 text-text-secondary">
                    {item.target_sell_price ? formatPriceDollars(item.target_sell_price) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={statusVariant[item.status]}>{item.status}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    {item.purchase_url && (
                      <a
                        href={item.purchase_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-text-muted hover:text-primary"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

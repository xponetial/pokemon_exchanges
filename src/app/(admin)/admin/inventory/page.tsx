import { createClient, createAdminClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { InventoryClient } from "@/components/admin/InventoryClient"
import type { Metadata } from "next"
import type { SourcedInventory } from "@/lib/types/database"

export const metadata: Metadata = { title: "Inventory — Admin" }

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
  const totalCost = inventory.reduce((s, i) => s + i.purchase_price, 0)
  const totalMarket = inventory.reduce((s, i) => s + (i.market_price ?? i.purchase_price), 0)

  return (
    <div>
      <h1 className="text-2xl font-bold text-text mb-1">Sourced Inventory</h1>
      <p className="text-text-secondary text-sm mb-6">Cards you&apos;ve purchased from external sources.</p>
      <InventoryClient
        inventory={inventory}
        totalCost={totalCost}
        totalMarket={totalMarket}
        unrealizedGain={totalMarket - totalCost}
      />
    </div>
  )
}

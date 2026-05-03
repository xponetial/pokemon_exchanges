import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { formatPriceDollars } from "@/lib/utils"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "My Orders" }

const statusVariant: Record<string, "default" | "primary" | "success" | "warning" | "danger"> = {
  pending:           "warning",
  payment_captured:  "primary",
  shipped:           "primary",
  delivered:         "primary",
  complete:          "success",
  disputed:          "danger",
  refunded:          "danger",
  cancelled:         "danger",
}

export default async function OrdersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login?redirect=/orders")

  const { data: orders } = await supabase
    .from("orders")
    .select("*, order_items(*, listings(title, images))")
    .eq("buyer_id", user.id)
    .order("created_at", { ascending: false })

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-text mb-6">My Orders</h1>
      {!orders || orders.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-text-secondary mb-3">You haven&apos;t placed any orders yet.</p>
          <Link href="/" className="text-primary hover:underline text-sm">Browse cards</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Link key={order.id} href={`/orders/${order.id}`} className="block bg-white rounded border border-border hover:border-border-hover hover:shadow-sm p-5 transition-all">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <p className="text-xs text-text-secondary">Order #{order.id.slice(-8).toUpperCase()}</p>
                  <p className="text-xs text-text-secondary">{new Date(order.created_at).toLocaleDateString()}</p>
                </div>
                <Badge variant={statusVariant[order.status] ?? "default"}>
                  {order.status.replace(/_/g, " ")}
                </Badge>
              </div>
              <div className="text-sm text-text-secondary mb-2">
                {(order.order_items as any[])?.map((item: any) => item.listings?.title).filter(Boolean).join(", ")}
              </div>
              <p className="font-bold text-text">{formatPriceDollars(order.total)}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

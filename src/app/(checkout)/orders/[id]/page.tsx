import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { ChevronLeft, Package, Truck, CheckCircle, Clock } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { formatPriceDollars } from "@/lib/utils"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Order Details" }

const STATUS_STEPS = [
  { key: "pending", label: "Order Placed", icon: Clock },
  { key: "payment_captured", label: "Payment Captured", icon: CheckCircle },
  { key: "shipped", label: "Shipped", icon: Truck },
  { key: "delivered", label: "Delivered", icon: Package },
  { key: "complete", label: "Complete", icon: CheckCircle },
]

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/login?redirect=/orders/${id}`)

  const { data: order } = await supabase
    .from("orders")
    .select("*, order_items(*, listings(title, images, set_name, condition, grade, grading_company, raw_condition)), sellers(display_name)")
    .eq("id", id)
    .single()

  if (!order || (order.buyer_id !== user.id && (order as any).seller_id !== user.id)) notFound()

  const currentStep = STATUS_STEPS.findIndex((s) => s.key === order.status)

  return (
    <div className="max-w-3xl mx-auto">
      <Link href="/orders" className="flex items-center gap-1 text-sm text-text-secondary hover:text-primary mb-4">
        <ChevronLeft className="w-4 h-4" /> Back to Orders
      </Link>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text">Order #{id.slice(-8).toUpperCase()}</h1>
          <p className="text-text-secondary text-sm">{new Date(order.created_at).toLocaleDateString()}</p>
        </div>
        <Badge variant={order.status === "complete" ? "success" : order.status === "pending" ? "warning" : "primary"}>
          {order.status.replace(/_/g, " ")}
        </Badge>
      </div>

      {/* Progress tracker */}
      <div className="bg-white rounded border border-border p-5 mb-4">
        <div className="flex items-center justify-between">
          {STATUS_STEPS.slice(0, 5).map((step, i) => {
            const Icon = step.icon
            const done = i <= currentStep
            return (
              <div key={step.key} className="flex flex-col items-center gap-1 flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${done ? "bg-primary text-white" : "bg-surface text-text-muted"}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <p className={`text-xs text-center leading-tight ${done ? "text-primary font-medium" : "text-text-muted"}`}>
                  {step.label}
                </p>
                {i < 4 && <div className={`h-0.5 w-full ${done ? "bg-primary" : "bg-border"} hidden`} />}
              </div>
            )
          })}
        </div>
        {order.tracking_number && (
          <p className="text-sm text-text-secondary mt-4">
            Tracking: <span className="font-medium">{order.tracking_carrier} — {order.tracking_number}</span>
          </p>
        )}
      </div>

      {/* Items */}
      <div className="bg-white rounded border border-border p-5 mb-4">
        <h2 className="font-semibold text-text mb-3">Items</h2>
        <div className="space-y-3">
          {(order.order_items as any[])?.map((item: any) => (
            <div key={item.id} className="flex gap-3">
              <div className="relative w-14 h-16 bg-surface rounded overflow-hidden shrink-0">
                {item.listings?.images?.[0] ? (
                  <Image src={item.listings.images[0]} alt="" fill sizes="56px" className="object-contain p-1" />
                ) : null}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-text">{item.listings?.title}</p>
                {item.listings?.set_name && <p className="text-xs text-text-secondary">{item.listings.set_name}</p>}
              </div>
              <p className="font-medium text-text text-sm shrink-0">{formatPriceDollars(item.price)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Financials */}
      <div className="bg-white rounded border border-border p-5 mb-4">
        <h2 className="font-semibold text-text mb-3">Payment Summary</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-text-secondary">Subtotal</span><span>{formatPriceDollars(order.subtotal)}</span></div>
          <div className="flex justify-between"><span className="text-text-secondary">Platform fee</span><span>{formatPriceDollars(order.platform_fee)}</span></div>
          <div className="flex justify-between font-bold text-text border-t border-border pt-2 mt-2">
            <span>Total</span><span>{formatPriceDollars(order.total)}</span>
          </div>
        </div>
      </div>

      {/* Shipping */}
      {order.shipping_address && (
        <div className="bg-white rounded border border-border p-5">
          <h2 className="font-semibold text-text mb-2">Shipping Address</h2>
          {(() => {
            const addr = order.shipping_address as any
            return (
              <p className="text-sm text-text-secondary">
                {addr.full_name}<br />
                {addr.address_line1}<br />
                {addr.city}, {addr.state} {addr.zip}<br />
                {addr.country}
              </p>
            )
          })()}
        </div>
      )}
    </div>
  )
}

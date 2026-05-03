"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod/v4"
import { CreditCard, Lock } from "lucide-react"
import { useCartStore } from "@/lib/cart/store"
import { createClient } from "@/lib/supabase/client"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { formatPriceDollars } from "@/lib/utils"
import { PLATFORM_FEE_PERCENT } from "@/lib/constants"

const schema = z.object({
  full_name:    z.string().min(2),
  address_line1: z.string().min(5),
  city:         z.string().min(2),
  state:        z.string().min(2),
  zip:          z.string().min(5),
  country:      z.string().min(1),
})

type FormData = z.infer<typeof schema>

export default function CheckoutPage() {
  const router = useRouter()
  const { items, clearCart, totalPrice } = useCartStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const subtotal = totalPrice()
  const platformFee = subtotal * (PLATFORM_FEE_PERCENT / 100)
  const total = subtotal + platformFee

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { country: "US" },
  })

  async function onSubmit(formData: FormData) {
    setLoading(true)
    setError("")

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.push("/login?redirect=/checkout")
      return
    }

    // Group items by seller
    const bySeller = items.reduce<Record<string, typeof items>>((acc, item) => {
      const sid = item.listing.seller_id
      acc[sid] = [...(acc[sid] ?? []), item]
      return acc
    }, {})

    try {
      for (const [sellerId, sellerItems] of Object.entries(bySeller)) {
        const sub = sellerItems.reduce((s, i) => s + i.listing.price * i.quantity, 0)
        const fee = sub * (PLATFORM_FEE_PERCENT / 100)

        // Create order
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const sb = supabase as any
        const { data: order, error: orderError } = await sb
          .from("orders")
          .insert({
            buyer_id: user.id,
            seller_id: sellerId,
            subtotal: sub,
            platform_fee: fee,
            seller_payout: sub - fee,
            total: sub + fee,
            status: "pending",
            shipping_address: formData,
          })
          .select()
          .single()

        if (orderError || !order) throw new Error(orderError?.message ?? "Order creation failed")

        // Create order items
        await sb.from("order_items").insert(
          sellerItems.map((i: typeof sellerItems[0]) => ({
            order_id: order.id,
            listing_id: i.listing.id,
            price: i.listing.price,
            quantity: i.quantity,
          }))
        )

        // Mark listings as sold
        await sb
          .from("listings")
          .update({ status: "sold" })
          .in("id", sellerItems.map((i: typeof sellerItems[0]) => i.listing.id))
      }

      clearCart()
      router.push("/checkout/success")
    } catch (err: any) {
      setError(err.message ?? "Something went wrong. Please try again.")
      setLoading(false)
    }
  }

  if (items.length === 0) {
    router.replace("/cart")
    return null
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-text mb-6">Checkout</h1>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Shipping form */}
        <div className="flex-1">
          <div className="bg-white rounded border border-border p-6">
            <h2 className="font-semibold text-text mb-4">Shipping Address</h2>
            <form id="checkout-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                label="Full Name"
                {...register("full_name")}
                error={errors.full_name?.message}
                placeholder="Ash Ketchum"
              />
              <Input
                label="Address"
                {...register("address_line1")}
                error={errors.address_line1?.message}
                placeholder="123 Pallet Town Rd"
              />
              <div className="grid grid-cols-2 gap-3">
                <Input label="City" {...register("city")} error={errors.city?.message} placeholder="Pallet Town" />
                <Input label="State" {...register("state")} error={errors.state?.message} placeholder="OH" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input label="ZIP Code" {...register("zip")} error={errors.zip?.message} placeholder="45678" />
                <Input label="Country" {...register("country")} defaultValue="US" placeholder="US" />
              </div>
            </form>
          </div>

          {/* Payment notice */}
          <div className="bg-white rounded border border-border p-6 mt-4">
            <h2 className="font-semibold text-text mb-3 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-primary" />
              Payment
            </h2>
            <div className="bg-primary-light border border-primary rounded p-4 text-sm text-primary">
              <p className="font-medium mb-1">Payment coming soon</p>
              <p>Stripe Connect is being configured. Your order will be placed and the seller will be notified. Payment will be processed once billing is live.</p>
            </div>
          </div>
        </div>

        {/* Order summary */}
        <div className="lg:w-72 shrink-0">
          <div className="bg-white rounded border border-border p-5 sticky top-20">
            <h2 className="font-bold text-text mb-3">Order Summary</h2>
            <div className="space-y-2 text-sm mb-4 max-h-48 overflow-y-auto">
              {items.map(({ listing }) => (
                <div key={listing.id} className="flex justify-between">
                  <span className="text-text-secondary truncate pr-2 max-w-[160px]">{listing.title}</span>
                  <span className="font-medium shrink-0">{formatPriceDollars(listing.price)}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-border pt-3 space-y-1.5 text-sm mb-4">
              <div className="flex justify-between">
                <span className="text-text-secondary">Subtotal</span>
                <span>{formatPriceDollars(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Platform fee</span>
                <span>{formatPriceDollars(platformFee)}</span>
              </div>
              <div className="flex justify-between font-bold text-text">
                <span>Total</span>
                <span>{formatPriceDollars(total)}</span>
              </div>
            </div>
            {error && <p className="text-danger text-sm mb-3">{error}</p>}
            <Button
              type="submit"
              form="checkout-form"
              className="w-full"
              size="lg"
              loading={loading}
            >
              <Lock className="w-4 h-4" />
              Place Order
            </Button>
            <p className="text-xs text-text-muted text-center mt-2">
              Orders are protected by our buyer guarantee
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

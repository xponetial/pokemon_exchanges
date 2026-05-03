"use client"
import Image from "next/image"
import Link from "next/link"
import { Trash2, ShoppingCart } from "lucide-react"
import { useCartStore } from "@/lib/cart/store"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatPriceDollars } from "@/lib/utils"
import { PLATFORM_FEE_PERCENT } from "@/lib/constants"

export default function CartPage() {
  const { items, removeItem, clearCart, totalPrice } = useCartStore()
  const subtotal = totalPrice()
  const platformFee = subtotal * (PLATFORM_FEE_PERCENT / 100)
  const total = subtotal + platformFee

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <ShoppingCart className="w-16 h-16 text-text-muted mb-4" />
        <h2 className="text-xl font-bold text-text mb-1">Your cart is empty</h2>
        <p className="text-text-secondary text-sm mb-4">Add some cards to get started.</p>
        <Link href="/">
          <Button>Browse Cards</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Items */}
      <div className="flex-1">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-text">Shopping Cart ({items.length})</h1>
          <button onClick={clearCart} className="text-sm text-danger hover:underline">
            Clear cart
          </button>
        </div>
        <div className="space-y-3">
          {items.map(({ listing }) => (
            <div key={listing.id} className="bg-white rounded border border-border p-4 flex gap-4">
              <Link href={`/cards/${listing.id}`} className="relative w-20 h-24 shrink-0 bg-surface rounded overflow-hidden">
                {listing.images[0] ? (
                  <Image src={listing.images[0]} alt={listing.title} fill sizes="80px" className="object-contain p-1" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-text-muted text-xs">No img</div>
                )}
              </Link>
              <div className="flex-1 min-w-0">
                <Link href={`/cards/${listing.id}`} className="font-medium text-text hover:text-primary line-clamp-2 text-sm">
                  {listing.title}
                </Link>
                {listing.set_name && <p className="text-xs text-text-secondary mt-0.5">{listing.set_name}</p>}
                <div className="flex items-center gap-2 mt-1">
                  {listing.condition === "Graded" && listing.grading_company ? (
                    <>
                      <Badge variant={listing.grading_company === "PSA" ? "psa" : listing.grading_company === "BGS" ? "bgs" : "cgc"}>
                        {listing.grading_company}
                      </Badge>
                      {listing.grade && <Badge>{listing.grade}</Badge>}
                    </>
                  ) : (
                    <Badge>{listing.raw_condition ?? "Raw"}</Badge>
                  )}
                </div>
                <p className="text-base font-bold text-text mt-2">{formatPriceDollars(listing.price)}</p>
              </div>
              <button
                onClick={() => removeItem(listing.id)}
                className="text-text-muted hover:text-danger shrink-0"
                aria-label="Remove item"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Order summary */}
      <div className="lg:w-72 shrink-0">
        <div className="bg-white rounded border border-border p-5 sticky top-20">
          <h2 className="font-bold text-text mb-4">Order Summary</h2>
          <div className="space-y-2 text-sm mb-4">
            <div className="flex justify-between">
              <span className="text-text-secondary">Subtotal ({items.length} items)</span>
              <span className="font-medium">{formatPriceDollars(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Platform fee ({PLATFORM_FEE_PERCENT}%)</span>
              <span className="font-medium">{formatPriceDollars(platformFee)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Shipping</span>
              <span className="text-success font-medium">Free</span>
            </div>
          </div>
          <div className="border-t border-border pt-3 mb-4">
            <div className="flex justify-between font-bold text-text">
              <span>Total</span>
              <span>{formatPriceDollars(total)}</span>
            </div>
          </div>
          <Link href="/checkout">
            <Button className="w-full" size="lg">Proceed to Checkout</Button>
          </Link>
          <Link href="/" className="block text-center text-sm text-primary hover:underline mt-3">
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  )
}

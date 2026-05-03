"use client"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import { Star, Shield, ChevronLeft, ShoppingCart, Package } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { useCartStore } from "@/lib/cart/store"
import { formatPriceDollars } from "@/lib/utils"
import type { ListingWithSeller } from "@/lib/types/database"

export default function CardDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [listing, setListing] = useState<ListingWithSeller | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState(0)
  const addItem = useCartStore((s) => s.addItem)
  const inCart = useCartStore((s) => s.items.some((i) => i.listing.id === id))

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data } = await supabase
        .from("listings")
        .select("*, sellers(display_name, rating, bio)")
        .eq("id", id)
        .single()
      setListing(data as unknown as ListingWithSeller)
      setLoading(false)
      // increment view count
      supabase.from("listings").update({ views: (data?.views ?? 0) + 1 }).eq("id", id).then(() => {})
    }
    load()
  }, [id])

  if (loading) return (
    <div className="flex justify-center py-20"><Spinner className="w-8 h-8" /></div>
  )

  if (!listing) return (
    <div className="text-center py-20">
      <p className="text-text font-medium">Listing not found.</p>
      <Button variant="link" onClick={() => router.push("/")}>Back to listings</Button>
    </div>
  )

  const gradeBadgeVariant =
    listing.grading_company === "PSA" ? "psa"
    : listing.grading_company === "BGS" ? "bgs"
    : listing.grading_company === "CGC" ? "cgc"
    : "default"

  const platformFee = listing.price * 0.1
  const sellerReceives = listing.price - platformFee

  return (
    <div>
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1 text-sm text-text-secondary hover:text-primary mb-4"
      >
        <ChevronLeft className="w-4 h-4" /> Back
      </button>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Image gallery */}
        <div className="lg:w-[420px] shrink-0">
          <div className="relative aspect-[3/4] rounded border border-border bg-surface overflow-hidden mb-3">
            {listing.images[selectedImage] ? (
              <Image
                src={listing.images[selectedImage]}
                alt={listing.title}
                fill
                sizes="420px"
                className="object-contain p-4"
                priority
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-text-muted">
                No Image
              </div>
            )}
          </div>
          {listing.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {listing.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={`relative w-16 h-16 rounded border-2 overflow-hidden shrink-0 ${
                    selectedImage === i ? "border-primary" : "border-border"
                  }`}
                >
                  <Image src={img} alt="" fill sizes="64px" className="object-contain p-1" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Buy box */}
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-text leading-tight mb-1">{listing.title}</h1>
          {listing.set_name && (
            <p className="text-text-secondary text-sm mb-3">
              {listing.set_name}{listing.card_number ? ` · #${listing.card_number}` : ""}
            </p>
          )}

          {/* Grade / condition badges */}
          <div className="flex items-center gap-2 mb-4">
            {listing.condition === "Graded" && listing.grading_company ? (
              <>
                <Badge variant={gradeBadgeVariant}>{listing.grading_company}</Badge>
                {listing.grade && <Badge>{listing.grade}</Badge>}
              </>
            ) : (
              <Badge>{listing.raw_condition ?? "Raw"}</Badge>
            )}
          </div>

          {/* Price */}
          <div className="bg-surface rounded-lg p-4 mb-4">
            <p className="text-3xl font-bold text-text mb-1">{formatPriceDollars(listing.price)}</p>
            <p className="text-xs text-text-secondary">Free shipping · Buyer protection included</p>

            <div className="flex flex-col gap-2 mt-4">
              <Button
                size="lg"
                className="w-full"
                onClick={() => { addItem(listing as any); router.push("/cart") }}
                disabled={listing.status === "sold" || inCart}
              >
                <ShoppingCart className="w-4 h-4" />
                {listing.status === "sold" ? "Sold" : inCart ? "Already in Cart" : "Add to Cart"}
              </Button>
              {!inCart && listing.status !== "sold" && (
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full"
                  onClick={() => { addItem(listing as any); router.push("/checkout") }}
                >
                  Buy Now
                </Button>
              )}
            </div>
          </div>

          {/* Seller */}
          <div className="border border-border rounded-lg p-4 mb-4">
            <p className="text-sm font-semibold text-text mb-2">Sold by</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary-light flex items-center justify-center text-primary font-bold text-sm">
                {listing.sellers?.display_name?.[0]?.toUpperCase() ?? "?"}
              </div>
              <div>
                <p className="font-medium text-text text-sm">{listing.sellers?.display_name}</p>
                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3 text-warning fill-warning" />
                  <span className="text-xs text-text-secondary">
                    {listing.sellers?.rating?.toFixed(1) ?? "New seller"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Trust */}
          <div className="flex items-start gap-3 text-sm text-text-secondary">
            <Shield className="w-4 h-4 text-success shrink-0 mt-0.5" />
            <p>
              Funds are held securely until you confirm receipt. If the card doesn&apos;t match the
              description, we&apos;ll make it right.
            </p>
          </div>

          {/* Description */}
          {listing.description && (
            <div className="mt-6">
              <p className="font-semibold text-text text-sm mb-1">Description</p>
              <p className="text-sm text-text-secondary whitespace-pre-wrap">{listing.description}</p>
            </div>
          )}

          {/* Platform fee info */}
          <div className="mt-4 p-3 bg-surface rounded text-xs text-text-muted flex items-start gap-2">
            <Package className="w-4 h-4 shrink-0 mt-0.5" />
            <p>
              Platform fee: {formatPriceDollars(platformFee)} (10%) ·
              Seller receives: {formatPriceDollars(sellerReceives)}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

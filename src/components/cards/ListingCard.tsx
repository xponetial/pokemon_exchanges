"use client"
import Image from "next/image"
import Link from "next/link"
import { ShoppingCart, Star } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useCartStore } from "@/lib/cart/store"
import { formatPriceDollars } from "@/lib/utils"
import type { ListingWithSeller } from "@/lib/types/database"

interface ListingCardProps {
  listing: ListingWithSeller
}

export function ListingCard({ listing }: ListingCardProps) {
  const addItem = useCartStore((s) => s.addItem)
  const items = useCartStore((s) => s.items)
  const inCart = items.some((i) => i.listing.id === listing.id)

  const gradeBadgeVariant =
    listing.grading_company === "PSA" ? "psa"
    : listing.grading_company === "BGS" ? "bgs"
    : listing.grading_company === "CGC" ? "cgc"
    : "default"

  return (
    <div className="bg-white rounded border border-border hover:border-border-hover hover:shadow-md transition-all group flex flex-col">
      {/* Image */}
      <Link href={`/cards/${listing.id}`} className="block relative aspect-[3/4] overflow-hidden rounded-t bg-surface">
        {listing.images[0] ? (
          <Image
            src={listing.images[0]}
            alt={listing.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-contain p-3 group-hover:scale-105 transition-transform duration-200"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-text-muted text-sm">
            No Image
          </div>
        )}
        {listing.status === "sold" && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="text-white font-bold text-lg uppercase tracking-widest">Sold</span>
          </div>
        )}
      </Link>

      {/* Info */}
      <div className="p-3 flex flex-col gap-2 flex-1">
        <Link href={`/cards/${listing.id}`} className="block">
          <p className="text-sm font-medium text-text line-clamp-2 leading-snug hover:text-primary">
            {listing.title}
          </p>
          {listing.set_name && (
            <p className="text-xs text-text-secondary mt-0.5">{listing.set_name}</p>
          )}
        </Link>

        {/* Grade / condition */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {listing.condition === "Graded" && listing.grading_company ? (
            <>
              <Badge variant={gradeBadgeVariant}>{listing.grading_company}</Badge>
              {listing.grade && <Badge variant="default">{listing.grade}</Badge>}
            </>
          ) : (
            <Badge variant="default">{listing.raw_condition ?? "Raw"}</Badge>
          )}
        </div>

        {/* Price + seller */}
        <div className="mt-auto">
          <p className="text-lg font-bold text-text">{formatPriceDollars(listing.price)}</p>
          <div className="flex items-center gap-1 mt-0.5">
            <Star className="w-3 h-3 text-warning fill-warning" />
            <span className="text-xs text-text-secondary">
              {listing.sellers?.rating?.toFixed(1) ?? "New"} · {listing.sellers?.display_name}
            </span>
          </div>
        </div>

        <Button
          size="sm"
          variant={inCart ? "secondary" : "primary"}
          className="w-full mt-1"
          onClick={() => !inCart && addItem(listing)}
          disabled={listing.status === "sold" || inCart}
        >
          <ShoppingCart className="w-3.5 h-3.5" />
          {inCart ? "In Cart" : listing.status === "sold" ? "Sold" : "Add to Cart"}
        </Button>
      </div>
    </div>
  )
}

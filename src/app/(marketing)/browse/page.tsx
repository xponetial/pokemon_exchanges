import { Suspense } from "react"
import { createClient } from "@/lib/supabase/server"
import { FiltersSidebar } from "@/components/marketplace/FiltersSidebar"
import { ListingCard } from "@/components/cards/ListingCard"
import { CategoryNav } from "@/components/layout/CategoryNav"
import { Spinner } from "@/components/ui/spinner"
import type { ListingWithSeller } from "@/lib/types/database"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Browse Cards | Pokemon Exchanges" }

interface PageProps {
  searchParams: Promise<{
    q?: string
    condition?: string
    grader?: string
    price?: string
    set?: string
    sort?: string
  }>
}

async function ListingsGrid({ searchParams }: PageProps) {
  const params = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from("listings")
    .select("*, sellers(display_name, rating)")
    .eq("status", "active")

  if (params.q) {
    query = query.or(`title.ilike.%${params.q}%,card_name.ilike.%${params.q}%,set_name.ilike.%${params.q}%`)
  }
  if (params.condition) query = query.eq("condition", params.condition)
  if (params.grader) query = query.eq("grading_company", params.grader)
  if (params.set) query = query.eq("set_name", params.set)
  if (params.price) {
    const [min, max] = params.price.split("-")
    if (min) query = query.gte("price", Number(min))
    if (max) query = query.lte("price", Number(max))
  }

  const sortMap: Record<string, { column: string; ascending: boolean }> = {
    newest:     { column: "created_at", ascending: false },
    price_asc:  { column: "price", ascending: true },
    price_desc: { column: "price", ascending: false },
    popular:    { column: "views", ascending: false },
  }
  const sort = sortMap[params.sort ?? "newest"] ?? sortMap.newest
  query = query.order(sort.column, { ascending: sort.ascending })

  const { data: listings, error } = await query.limit(48)

  if (error) {
    return <p className="text-danger text-sm">Failed to load listings. Please try again.</p>
  }

  if (!listings || listings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-2xl mb-2">🎴</p>
        <p className="text-text font-medium">No cards found</p>
        <p className="text-text-secondary text-sm mt-1">Try adjusting your filters or search.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {(listings as unknown as ListingWithSeller[]).map((listing) => (
        <ListingCard key={listing.id} listing={listing} />
      ))}
    </div>
  )
}

export default async function BrowsePage({ searchParams }: PageProps) {
  const params = await searchParams

  return (
    <>
      <Suspense>
        <CategoryNav />
      </Suspense>
      <div className="max-w-screen-xl mx-auto w-full px-4 py-6">
      <div className="flex gap-6">
      {/* Filters */}
      <Suspense>
        <FiltersSidebar />
      </Suspense>

      {/* Listings */}
      <div className="flex-1 min-w-0">
        {params.q && (
          <p className="text-sm text-text-secondary mb-4">
            Results for <span className="font-medium text-text">&quot;{params.q}&quot;</span>
          </p>
        )}
        <Suspense fallback={
          <div className="flex justify-center py-20"><Spinner className="w-8 h-8" /></div>
        }>
          <ListingsGrid searchParams={Promise.resolve(params)} />
        </Suspense>
      </div>
    </div>
    </div>
    </>
  )
}

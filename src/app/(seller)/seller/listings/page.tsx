import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Plus, Eye, Edit } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatPriceDollars } from "@/lib/utils"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "My Listings" }

export default async function SellerListingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login?redirect=/seller/listings")

  const { data: listings } = await supabase
    .from("listings")
    .select("*")
    .eq("seller_id", user.id)
    .order("created_at", { ascending: false })

  return (
    <div className="max-w-screen-lg mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-text">My Listings</h1>
        <Link href="/seller/listings/new">
          <Button><Plus className="w-4 h-4" /> New Listing</Button>
        </Link>
      </div>

      {!listings || listings.length === 0 ? (
        <div className="bg-white rounded border border-border p-16 text-center">
          <p className="text-text-secondary mb-3">You haven&apos;t created any listings yet.</p>
          <Link href="/seller/listings/new">
            <Button><Plus className="w-4 h-4" /> Create your first listing</Button>
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface border-b border-border">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-text-secondary">Card</th>
                <th className="text-left px-4 py-3 font-medium text-text-secondary hidden md:table-cell">Condition</th>
                <th className="text-right px-4 py-3 font-medium text-text-secondary">Price</th>
                <th className="text-center px-4 py-3 font-medium text-text-secondary">Status</th>
                <th className="text-right px-4 py-3 font-medium text-text-secondary hidden sm:table-cell">Views</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {listings.map((listing) => (
                <tr key={listing.id} className="hover:bg-surface/50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-text truncate max-w-[200px]">{listing.title}</p>
                    {listing.set_name && <p className="text-xs text-text-secondary">{listing.set_name}</p>}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    {listing.condition === "Graded"
                      ? `${listing.grading_company} ${listing.grade}`
                      : listing.raw_condition}
                  </td>
                  <td className="px-4 py-3 text-right font-medium">{formatPriceDollars(listing.price)}</td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant={listing.status === "active" ? "success" : listing.status === "sold" ? "primary" : "default"}>
                      {listing.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right text-text-secondary hidden sm:table-cell">
                    <span className="flex items-center justify-end gap-1">
                      <Eye className="w-3.5 h-3.5" /> {listing.views}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/seller/listings/${listing.id}/edit`} className="inline-flex items-center gap-1 text-primary hover:underline text-xs">
                      <Edit className="w-3.5 h-3.5" /> Edit
                    </Link>
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

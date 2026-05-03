"use client"
import { useState } from "react"
import { Package, ExternalLink, PlusCircle, X } from "lucide-react"
import { formatPriceDollars } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import type { SourcedInventory } from "@/lib/types/database"

const statusVariant: Record<SourcedInventory["status"], "default" | "warning" | "primary" | "success"> = {
  pending:  "warning",
  received: "default",
  listed:   "primary",
  sold:     "success",
}

interface CreateListingModalProps {
  item: SourcedInventory
  onClose: () => void
  onSuccess: (id: string) => void
}

function CreateListingModal({ item, onClose, onSuccess }: CreateListingModalProps) {
  const [price, setPrice] = useState(item.target_sell_price?.toString() ?? "")
  const [title, setTitle] = useState(
    [item.card_name, item.set_name, item.grading_company && item.grade ? `${item.grading_company} ${item.grade}` : item.condition]
      .filter(Boolean).join(" — ")
  )
  const [description, setDescription] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/admin/inventory/create-listing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inventoryId: item.id, price: parseFloat(price), title, description }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? "Failed to create listing"); return }
      onSuccess(item.id)
    } catch {
      setError("Network error — please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg border border-border w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="font-semibold text-text">Create Marketplace Listing</h2>
          <button onClick={onClose} className="text-text-muted hover:text-text"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="bg-surface rounded p-3 text-sm">
            <p className="font-medium text-text">{item.card_name}</p>
            <p className="text-text-secondary text-xs mt-0.5">
              Purchased for {formatPriceDollars(item.purchase_price)}
              {item.market_price ? ` · Market ${formatPriceDollars(item.market_price)}` : ""}
            </p>
          </div>
          <Input label="Listing Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
          <Input
            label="Sell Price ($)" type="number" step="0.01" min="0.01"
            value={price} onChange={(e) => setPrice(e.target.value)} required
            hint={`Purchased for ${formatPriceDollars(item.purchase_price)}`}
          />
          <div>
            <label className="block text-sm font-medium text-text mb-1">Description (optional)</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
              className="w-full border border-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none" />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2 pt-1">
            <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="primary" className="flex-1" loading={loading}>Publish Listing</Button>
          </div>
        </form>
      </div>
    </div>
  )
}

interface InventoryClientProps {
  inventory: SourcedInventory[]
  totalCost: number
  totalMarket: number
  unrealizedGain: number
}

export function InventoryClient({ inventory: initial, totalCost, totalMarket, unrealizedGain }: InventoryClientProps) {
  const [inventory, setInventory] = useState(initial)
  const [modalItem, setModalItem] = useState<SourcedInventory | null>(null)

  function handleSuccess(id: string) {
    setModalItem(null)
    setInventory((prev) => prev.map((i) => i.id === id ? { ...i, status: "listed" as const } : i))
  }

  return (
    <>
      {modalItem && (
        <CreateListingModal item={modalItem} onClose={() => setModalItem(null)} onSuccess={handleSuccess} />
      )}

      {inventory.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: "Total Cost",      value: formatPriceDollars(totalCost) },
            { label: "Market Value",    value: formatPriceDollars(totalMarket) },
            { label: "Unrealized Gain", value: formatPriceDollars(unrealizedGain), positive: unrealizedGain >= 0 },
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
          <Link href="/admin/sourcing" className="text-primary text-sm hover:underline">Find deals to purchase →</Link>
        </div>
      ) : (
        <div className="bg-white rounded border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface border-b border-border">
              <tr>
                {["Card", "Condition", "Purchased", "Market", "Target", "Status", "Actions"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">{h}</th>
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
                    {item.grading_company ? `${item.grading_company} ${item.grade}` : item.condition}
                  </td>
                  <td className="px-4 py-3 font-medium text-text">{formatPriceDollars(item.purchase_price)}</td>
                  <td className="px-4 py-3 text-text-secondary">{item.market_price ? formatPriceDollars(item.market_price) : "—"}</td>
                  <td className="px-4 py-3 text-text-secondary">{item.target_sell_price ? formatPriceDollars(item.target_sell_price) : "—"}</td>
                  <td className="px-4 py-3"><Badge variant={statusVariant[item.status]}>{item.status}</Badge></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {item.purchase_url && (
                        <a href={item.purchase_url} target="_blank" rel="noopener noreferrer" className="text-text-muted hover:text-primary">
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                      {(item.status === "received" || item.status === "pending") && (
                        <button onClick={() => setModalItem(item)}
                          className="flex items-center gap-1 text-xs text-primary hover:underline font-medium">
                          <PlusCircle className="w-3.5 h-3.5" /> List
                        </button>
                      )}
                      {item.status === "listed" && item.listing_id && (
                        <Link href={`/cards/${item.listing_id}`} className="text-xs text-primary hover:underline font-medium">
                          View Listing
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}

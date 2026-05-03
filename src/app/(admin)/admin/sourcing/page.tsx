"use client"
import { useState } from "react"
import { Search, AlertCircle } from "lucide-react"
import { DealCard } from "@/components/admin/DealCard"
import { Spinner } from "@/components/ui/spinner"
import type { ExternalListingWithScore } from "@/lib/types/database"

interface SearchResponse {
  saved: ExternalListingWithScore[]
  skipped: number
  errors: string[]
  missingKeys: string[]
}

export default function SourcingPage() {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<ExternalListingWithScore[] | null>(null)
  const [meta, setMeta] = useState<Omit<SearchResponse, "saved"> | null>(null)
  const [loading, setLoading] = useState(false)
  const [watchlisted, setWatchlisted] = useState<Set<string>>(new Set())

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!query.trim()) return
    setLoading(true)
    setResults(null)
    setMeta(null)

    try {
      const res = await fetch("/api/sourcing/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query.trim(), limit: 20 }),
      })
      const data: SearchResponse = await res.json()
      setResults(data.saved ?? [])
      setMeta({ skipped: data.skipped, errors: data.errors, missingKeys: data.missingKeys })
    } catch {
      setMeta({ skipped: 0, errors: ["Network error — please try again."], missingKeys: [] })
    } finally {
      setLoading(false)
    }
  }

  async function handleScore(id: string) {
    await fetch("/api/sourcing/score", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ externalListingId: id }),
    })
    // Refetch the updated listing
    if (results) {
      const res = await fetch("/api/sourcing/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query.trim(), limit: 20 }),
      })
      const data: SearchResponse = await res.json()
      setResults(data.saved ?? [])
    }
  }

  async function handleWatchlist(id: string) {
    const isWatchlisted = watchlisted.has(id)
    if (isWatchlisted) {
      await fetch("/api/sourcing/watchlist", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ externalListingId: id }),
      })
      setWatchlisted((prev) => { const s = new Set(prev); s.delete(id); return s })
    } else {
      await fetch("/api/sourcing/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ externalListingId: id }),
      })
      setWatchlisted((prev) => new Set(prev).add(id))
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-text mb-1">Sourcing</h1>
      <p className="text-text-secondary text-sm mb-6">
        Search eBay for undervalued Pokémon cards. Results are saved and can be scored with AI.
      </p>

      {/* Search form */}
      <form onSubmit={handleSearch} className="flex gap-2 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder='e.g. "Charizard PSA 10" or "Base Set Blastoise"'
            className="w-full pl-9 pr-4 py-2.5 border border-border rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? <Spinner className="w-4 h-4" /> : "Search"}
        </button>
      </form>

      {/* Missing keys warning */}
      {meta?.missingKeys && meta.missingKeys.length > 0 && (
        <div className="flex items-start gap-3 bg-yellow-50 border border-yellow-200 rounded p-4 mb-5 text-sm text-yellow-800">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <div>
            <strong>Some APIs not configured:</strong>{" "}
            {meta.missingKeys.join(", ")} — add keys to{" "}
            <code className="font-mono text-xs bg-yellow-100 px-1 rounded">.env.local</code>{" "}
            (see <code className="font-mono text-xs bg-yellow-100 px-1 rounded">docs/SETUP.md</code>)
          </div>
        </div>
      )}

      {/* Errors */}
      {meta?.errors && meta.errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded p-4 mb-5 text-sm text-red-700">
          {meta.errors.map((e, i) => <p key={i}>{e}</p>)}
        </div>
      )}

      {/* Results */}
      {results !== null && (
        <>
          <p className="text-sm text-text-secondary mb-4">
            {results.length} new result{results.length !== 1 ? "s" : ""}
            {meta?.skipped ? `, ${meta.skipped} already seen` : ""}
          </p>
          {results.length === 0 ? (
            <div className="bg-surface rounded border border-border p-10 text-center text-text-secondary text-sm">
              No new listings found. Try a different search term.
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {results.map((listing) => (
                <div key={listing.id} className="flex flex-col gap-2">
                  <DealCard
                    listing={listing}
                    onWatchlist={handleWatchlist}
                    isWatchlisted={watchlisted.has(listing.id)}
                  />
                  {!listing.deal_scores?.length && (
                    <button
                      onClick={() => handleScore(listing.id)}
                      className="text-xs text-primary hover:underline text-center"
                    >
                      Score with AI →
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Empty state */}
      {results === null && !loading && (
        <div className="bg-surface rounded border border-border p-14 text-center">
          <Search className="w-8 h-8 text-text-muted mx-auto mb-3" />
          <p className="text-text-secondary text-sm">
            Enter a card name or search term above to find deals on eBay.
          </p>
        </div>
      )}
    </div>
  )
}

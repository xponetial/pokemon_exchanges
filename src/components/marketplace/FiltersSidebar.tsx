"use client"
import { useRouter, useSearchParams } from "next/navigation"
import { useCallback } from "react"
import { GRADING_COMPANIES, RAW_CONDITIONS, POKEMON_SETS } from "@/lib/constants"

export function FiltersSidebar() {
  const router = useRouter()
  const params = useSearchParams()

  const setParam = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(params.toString())
      if (value) next.set(key, value)
      else next.delete(key)
      router.push(`/?${next.toString()}`)
    },
    [params, router]
  )

  const clearAll = () => router.push("/")

  const hasFilters = params.toString().length > 0

  return (
    <aside className="w-56 shrink-0 space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-text text-sm">Filters</h2>
        {hasFilters && (
          <button onClick={clearAll} className="text-xs text-primary hover:underline">
            Clear all
          </button>
        )}
      </div>

      {/* Condition */}
      <FilterSection title="Condition">
        {(["Graded", "Raw"] as const).map((c) => (
          <FilterCheckbox
            key={c}
            label={c}
            checked={params.get("condition") === c}
            onChange={(v) => setParam("condition", v ? c : "")}
          />
        ))}
      </FilterSection>

      {/* Grading company */}
      <FilterSection title="Grading Company">
        {GRADING_COMPANIES.map((g) => (
          <FilterCheckbox
            key={g}
            label={g}
            checked={params.get("grader") === g}
            onChange={(v) => setParam("grader", v ? g : "")}
          />
        ))}
      </FilterSection>

      {/* Price range */}
      <FilterSection title="Price Range">
        {[
          { label: "Under $25", value: "0-25" },
          { label: "$25 – $100", value: "25-100" },
          { label: "$100 – $500", value: "100-500" },
          { label: "$500 – $1,000", value: "500-1000" },
          { label: "$1,000+", value: "1000-" },
        ].map((r) => (
          <FilterCheckbox
            key={r.value}
            label={r.label}
            checked={params.get("price") === r.value}
            onChange={(v) => setParam("price", v ? r.value : "")}
          />
        ))}
      </FilterSection>

      {/* Set */}
      <FilterSection title="Set">
        <select
          className="w-full h-9 border border-border rounded px-2 text-sm text-text bg-white focus:outline-none focus:ring-2 focus:ring-primary"
          value={params.get("set") ?? ""}
          onChange={(e) => setParam("set", e.target.value)}
        >
          <option value="">All Sets</option>
          {POKEMON_SETS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </FilterSection>

      {/* Sort */}
      <FilterSection title="Sort By">
        <select
          className="w-full h-9 border border-border rounded px-2 text-sm text-text bg-white focus:outline-none focus:ring-2 focus:ring-primary"
          value={params.get("sort") ?? "newest"}
          onChange={(e) => setParam("sort", e.target.value)}
        >
          <option value="newest">Newest First</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
          <option value="popular">Most Popular</option>
        </select>
      </FilterSection>
    </aside>
  )
}

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">{title}</p>
      <div className="space-y-1.5">{children}</div>
    </div>
  )
}

function FilterCheckbox({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <label className="flex items-center gap-2 cursor-pointer group">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
      />
      <span className="text-sm text-text group-hover:text-primary">{label}</span>
    </label>
  )
}

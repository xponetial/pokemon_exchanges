import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import type { Listing } from "@/lib/types/database"

export interface CartItem {
  listing: Listing
  quantity: number
}

interface CartStore {
  items: CartItem[]
  addItem: (listing: Listing) => void
  removeItem: (listingId: string) => void
  clearCart: () => void
  totalItems: () => number
  totalPrice: () => number
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (listing) => {
        set((state) => {
          const existing = state.items.find((i) => i.listing.id === listing.id)
          if (existing) return state // one-per-listing for cards
          return { items: [...state.items, { listing, quantity: 1 }] }
        })
      },

      removeItem: (listingId) => {
        set((state) => ({ items: state.items.filter((i) => i.listing.id !== listingId) }))
      },

      clearCart: () => set({ items: [] }),

      totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),

      totalPrice: () => get().items.reduce((sum, i) => sum + i.listing.price * i.quantity, 0),
    }),
    { name: "pokemon-exchanges-cart", storage: createJSONStorage(() => localStorage) }
  )
)

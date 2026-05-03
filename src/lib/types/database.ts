export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          role: "buyer" | "seller" | "admin"
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          role?: "buyer" | "seller" | "admin"
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          role?: "buyer" | "seller" | "admin"
          updated_at?: string
        }
      }
      sellers: {
        Row: {
          id: string
          stripe_account_id: string | null
          stripe_onboarding_complete: boolean
          display_name: string
          bio: string | null
          rating: number
          total_sales: number
          created_at: string
        }
        Insert: {
          id: string
          stripe_account_id?: string | null
          stripe_onboarding_complete?: boolean
          display_name: string
          bio?: string | null
          rating?: number
          total_sales?: number
          created_at?: string
        }
        Update: {
          stripe_account_id?: string | null
          stripe_onboarding_complete?: boolean
          display_name?: string
          bio?: string | null
          rating?: number
          total_sales?: number
        }
      }
      cards: {
        Row: {
          id: string
          name: string
          set_name: string
          set_code: string
          number: string
          rarity: string | null
          hp: string | null
          types: string[] | null
          image_url: string | null
          tcg_player_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          set_name: string
          set_code: string
          number: string
          rarity?: string | null
          hp?: string | null
          types?: string[] | null
          image_url?: string | null
          tcg_player_id?: string | null
          created_at?: string
        }
        Update: {
          name?: string
          set_name?: string
          set_code?: string
          number?: string
          rarity?: string | null
          hp?: string | null
          types?: string[] | null
          image_url?: string | null
          tcg_player_id?: string | null
        }
      }
      listings: {
        Row: {
          id: string
          seller_id: string
          card_id: string | null
          card_name: string | null
          set_name: string | null
          card_number: string | null
          condition: "Graded" | "Raw"
          grading_company: string | null
          grade: string | null
          raw_condition: string | null
          price: number
          title: string
          description: string | null
          images: string[]
          status: "active" | "sold" | "inactive" | "removed"
          views: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          seller_id: string
          card_id?: string | null
          card_name?: string | null
          set_name?: string | null
          card_number?: string | null
          condition: "Graded" | "Raw"
          grading_company?: string | null
          grade?: string | null
          raw_condition?: string | null
          price: number
          title: string
          description?: string | null
          images?: string[]
          status?: "active" | "sold" | "inactive" | "removed"
          views?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          card_id?: string | null
          card_name?: string | null
          set_name?: string | null
          card_number?: string | null
          condition?: "Graded" | "Raw"
          grading_company?: string | null
          grade?: string | null
          raw_condition?: string | null
          price?: number
          title?: string
          description?: string | null
          images?: string[]
          status?: "active" | "sold" | "inactive" | "removed"
          views?: number
          updated_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          buyer_id: string
          seller_id: string
          stripe_payment_intent_id: string | null
          stripe_transfer_id: string | null
          subtotal: number
          platform_fee: number
          seller_payout: number
          total: number
          status: "pending" | "payment_captured" | "shipped" | "delivered" | "complete" | "disputed" | "refunded" | "cancelled"
          escrow_released_at: string | null
          shipping_address: Json | null
          tracking_number: string | null
          tracking_carrier: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          buyer_id: string
          seller_id: string
          stripe_payment_intent_id?: string | null
          stripe_transfer_id?: string | null
          subtotal: number
          platform_fee: number
          seller_payout: number
          total: number
          status?: "pending" | "payment_captured" | "shipped" | "delivered" | "complete" | "disputed" | "refunded" | "cancelled"
          escrow_released_at?: string | null
          shipping_address?: Json | null
          tracking_number?: string | null
          tracking_carrier?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          stripe_payment_intent_id?: string | null
          stripe_transfer_id?: string | null
          status?: "pending" | "payment_captured" | "shipped" | "delivered" | "complete" | "disputed" | "refunded" | "cancelled"
          escrow_released_at?: string | null
          tracking_number?: string | null
          tracking_carrier?: string | null
          notes?: string | null
          updated_at?: string
        }
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          listing_id: string
          price: number
          quantity: number
        }
        Insert: {
          id?: string
          order_id: string
          listing_id: string
          price: number
          quantity?: number
        }
        Update: {
          price?: number
          quantity?: number
        }
      }
      external_listings: {
        Row: {
          id: string
          source: "ebay" | "tcgplayer"
          external_id: string
          title: string
          card_name: string | null
          set_name: string | null
          card_number: string | null
          condition: string | null
          grading_company: string | null
          grade: string | null
          price: number
          market_price: number | null
          price_diff_percent: number | null
          url: string
          image_url: string | null
          seller_name: string | null
          seller_feedback_score: number | null
          seller_feedback_percent: number | null
          shipping_cost: number | null
          ends_at: string | null
          status: "new" | "scoring" | "scored" | "watchlisted" | "purchased" | "ignored" | "expired"
          raw_data: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          source: "ebay" | "tcgplayer"
          external_id: string
          title: string
          card_name?: string | null
          set_name?: string | null
          card_number?: string | null
          condition?: string | null
          grading_company?: string | null
          grade?: string | null
          price: number
          market_price?: number | null
          price_diff_percent?: number | null
          url: string
          image_url?: string | null
          seller_name?: string | null
          seller_feedback_score?: number | null
          seller_feedback_percent?: number | null
          shipping_cost?: number | null
          ends_at?: string | null
          status?: "new" | "scoring" | "scored" | "watchlisted" | "purchased" | "ignored" | "expired"
          raw_data?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          card_name?: string | null
          set_name?: string | null
          card_number?: string | null
          condition?: string | null
          grading_company?: string | null
          grade?: string | null
          price?: number
          market_price?: number | null
          price_diff_percent?: number | null
          image_url?: string | null
          status?: "new" | "scoring" | "scored" | "watchlisted" | "purchased" | "ignored" | "expired"
          updated_at?: string
        }
      }
      deal_scores: {
        Row: {
          id: string
          external_listing_id: string
          overall_score: number
          value_score: number
          risk_score: number
          authenticity_score: number
          reasoning: string | null
          recommendation: "buy" | "watch" | "skip" | null
          flags: string[] | null
          model_used: string | null
          prompt_tokens: number | null
          completion_tokens: number | null
          created_at: string
        }
        Insert: {
          id?: string
          external_listing_id: string
          overall_score: number
          value_score: number
          risk_score: number
          authenticity_score: number
          reasoning?: string | null
          recommendation?: "buy" | "watch" | "skip" | null
          flags?: string[] | null
          model_used?: string | null
          prompt_tokens?: number | null
          completion_tokens?: number | null
          created_at?: string
        }
        Update: never
      }
      watchlist: {
        Row: {
          id: string
          admin_id: string
          external_listing_id: string
          notes: string | null
          priority: "low" | "normal" | "high"
          created_at: string
        }
        Insert: {
          id?: string
          admin_id: string
          external_listing_id: string
          notes?: string | null
          priority?: "low" | "normal" | "high"
          created_at?: string
        }
        Update: {
          notes?: string | null
          priority?: "low" | "normal" | "high"
        }
      }
      aggregated_prices: {
        Row: {
          id: string
          external_listing_id: string | null
          fair_value: number
          confidence_score: number
          tcgplayer_price: number | null
          pricecharting_price: number | null
          ebay_comps_price: number | null
          is_graded: boolean
          weights: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          external_listing_id?: string | null
          fair_value: number
          confidence_score: number
          tcgplayer_price?: number | null
          pricecharting_price?: number | null
          ebay_comps_price?: number | null
          is_graded?: boolean
          weights?: Json | null
          created_at?: string
        }
        Update: {
          fair_value?: number
          confidence_score?: number
          tcgplayer_price?: number | null
          pricecharting_price?: number | null
          ebay_comps_price?: number | null
          is_graded?: boolean
          weights?: Json | null
        }
      }
      sourced_inventory: {
        Row: {
          id: string
          admin_id: string
          external_listing_id: string | null
          card_name: string
          set_name: string | null
          card_number: string | null
          condition: string
          grading_company: string | null
          grade: string | null
          purchase_price: number
          market_price: number | null
          target_sell_price: number | null
          status: "pending" | "received" | "listed" | "sold"
          listing_id: string | null
          purchase_url: string | null
          purchase_date: string | null
          notes: string | null
          images: string[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          admin_id: string
          external_listing_id?: string | null
          card_name: string
          set_name?: string | null
          card_number?: string | null
          condition: string
          grading_company?: string | null
          grade?: string | null
          purchase_price: number
          market_price?: number | null
          target_sell_price?: number | null
          status?: "pending" | "received" | "listed" | "sold"
          listing_id?: string | null
          purchase_url?: string | null
          purchase_date?: string | null
          notes?: string | null
          images?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          card_name?: string
          set_name?: string | null
          card_number?: string | null
          condition?: string
          grading_company?: string | null
          grade?: string | null
          purchase_price?: number
          market_price?: number | null
          target_sell_price?: number | null
          status?: "pending" | "received" | "listed" | "sold"
          listing_id?: string | null
          purchase_date?: string | null
          notes?: string | null
          images?: string[] | null
          updated_at?: string
        }
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}

export type Profile = Database["public"]["Tables"]["profiles"]["Row"]
export type Seller = Database["public"]["Tables"]["sellers"]["Row"]
export type Card = Database["public"]["Tables"]["cards"]["Row"]
export type Listing = Database["public"]["Tables"]["listings"]["Row"]
export type Order = Database["public"]["Tables"]["orders"]["Row"]
export type OrderItem = Database["public"]["Tables"]["order_items"]["Row"]
export type ExternalListing = Database["public"]["Tables"]["external_listings"]["Row"]
export type DealScore = Database["public"]["Tables"]["deal_scores"]["Row"]
export type WatchlistItem = Database["public"]["Tables"]["watchlist"]["Row"]
export type SourcedInventory = Database["public"]["Tables"]["sourced_inventory"]["Row"]

export type AggregatedPriceRow = Database["public"]["Tables"]["aggregated_prices"]["Row"]

export type ListingWithSeller = Listing & { sellers: Pick<Seller, "display_name" | "rating"> }
export type ExternalListingWithScore = ExternalListing & { deal_scores: DealScore[] }
export type WatchlistItemWithListing = WatchlistItem & { external_listings: ExternalListingWithScore }

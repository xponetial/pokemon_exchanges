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
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>
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
        Update: Partial<Database["public"]["Tables"]["sellers"]["Insert"]>
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
        Update: Partial<Database["public"]["Tables"]["cards"]["Insert"]>
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
        Update: Partial<Database["public"]["Tables"]["listings"]["Insert"]>
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
        Update: Partial<Database["public"]["Tables"]["orders"]["Insert"]>
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
        Update: Partial<Database["public"]["Tables"]["order_items"]["Insert"]>
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

export type ListingWithSeller = Listing & { sellers: Pick<Seller, "display_name" | "rating"> }

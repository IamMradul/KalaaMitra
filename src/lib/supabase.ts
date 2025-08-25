import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          name: string
          email: string
          role: 'buyer' | 'seller'
          bio: string | null
          profile_image: string | null
          store_description: string | null
          created_at: string
        }
        Insert: {
          id: string
          name: string
          email: string
          role: 'buyer' | 'seller'
          bio?: string | null
          profile_image?: string | null
          store_description?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          role?: 'buyer' | 'seller'
          bio?: string | null
          profile_image?: string | null
          store_description?: string | null
          created_at?: string
        }
      }
      products: {
        Row: {
          id: string
          seller_id: string
          title: string
          category: string
          description: string
          price: number
          image_url: string
          created_at: string
        }
        Insert: {
          id?: string
          seller_id: string
          title: string
          category: string
          description: string
          price: number
          image_url: string
          created_at?: string
        }
        Update: {
          id?: string
          seller_id?: string
          title?: string
          category?: string
          description?: string
          price?: number
          image_url?: string
          created_at?: string
        }
      }
      cart: {
        Row: {
          id: string
          buyer_id: string
          product_id: string
          quantity: number
          created_at: string
        }
        Insert: {
          id?: string
          buyer_id: string
          product_id: string
          quantity: number
          created_at?: string
        }
        Update: {
          id?: string
          buyer_id?: string
          product_id?: string
          quantity?: number
          created_at?: string
        }
      }
    }
  }
}

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { isSupabaseConfigured } from './utils'

let client: SupabaseClient | null = null

export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null
  if (!client) {
    client = createClient(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_ANON_KEY,
    )
  }
  return client
}

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string | null
          display_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
      }
      bins: {
        Row: {
          id: string
          user_id: string
          qr_token: string
          name: string
          description: string | null
          category: string | null
          tags: string[]
          location: string | null
          preview_image: string | null
          created_at: string
          updated_at: string
        }
      }
      items: {
        Row: {
          id: string
          user_id: string
          bin_id: string
          name: string
          description: string | null
          image: string | null
          tags: string[]
          created_at: string
          updated_at: string
        }
      }
    }
  }
}

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const serviceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY

export const isSupabaseReady = !!(supabaseUrl && supabaseAnonKey)

// Main client used for all regular user auth/session — explicit config so the
// session reliably persists across visits/tabs (fixes "signed out on return").
export const supabase = isSupabaseReady
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
        storageKey: 'suleiman-store-auth',
      },
    })
  : null

// Admin client with service role (bypasses RLS — admin portal only).
// Uses its own storageKey + no session persistence so it never collides with
// the main auth client (avoids "Multiple GoTrueClient instances" session races).
export const supabaseAdmin = (isSupabaseReady && serviceRoleKey)
  ? createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        storageKey: 'suleiman-store-admin',
      },
    })
  : supabase

export default supabase

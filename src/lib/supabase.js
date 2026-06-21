import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const serviceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY

export const isSupabaseReady = !!(supabaseUrl && supabaseAnonKey)

export const supabase = isSupabaseReady
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

// Admin client with service role (bypasses RLS — admin portal only)
export const supabaseAdmin = (isSupabaseReady && serviceRoleKey)
  ? createClient(supabaseUrl, serviceRoleKey)
  : supabase

export default supabase

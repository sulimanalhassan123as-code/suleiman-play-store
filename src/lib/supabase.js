import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

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

// Admin client — routes every request through our server-side proxy at /api/proxy,
// which injects the real Supabase service_role key ONLY on the server after checking
// the admin password (sent as a header). The service_role key never reaches the browser.
export function makeAdminClient(adminPassword) {
  if (typeof window === 'undefined') return null
  return createClient(
    `${window.location.origin}/api/proxy`,
    'proxied', // dummy key — the proxy ignores this and injects the real service key
    {
      auth: { autoRefreshToken: false, persistSession: false, storageKey: 'suleiman-store-admin-proxy' },
      global: { headers: { 'x-admin-password': adminPassword || '' } },
    }
  )
}

export default supabase

// Narrow public telemetry helper (install tracking, session heartbeat) — no
// password needed, but the service_role key stays server-side in /api/track.
export async function track(action, payload = {}) {
  try {
    await fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, payload }),
    })
  } catch {
    // best-effort telemetry — never block the UI on failure
  }
}

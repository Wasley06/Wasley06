import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// Use || not ?? — env vars may be empty string "" in Electron IIFE builds,
// and ?? only falls back on null/undefined, not on "".
export const SUPABASE_URL  = import.meta.env.VITE_SUPABASE_URL  || 'https://tzvlavmaaummnufibgkt.supabase.co'
export const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR6dmxhdm1hYXVtbW51ZmliZ2t0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ5MDU1MjUsImV4cCI6MjEwMDQ4MTUyNX0.6YyJbc9FTBiCaIhbFwJB49XZi4peXq29Ek8pXnyVMvY'

// Singleton stored on globalThis so the IIFE bundle never creates a second
// GoTrueClient even if this module scope executes more than once.
declare global { interface Window { __fabegon_supabase__?: SupabaseClient } }

if (!globalThis.window.__fabegon_supabase__) {
  globalThis.window.__fabegon_supabase__ = createClient(SUPABASE_URL, SUPABASE_ANON, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
      storageKey: 'fabegon-session',
    },
  })
}

export const supabase = globalThis.window.__fabegon_supabase__!

/* Usernames are stored as email = username@fabegon.internal in Supabase Auth */
export const toAuthEmail = (username: string) =>
  username.includes('@') ? username : `${username.toLowerCase()}@fabegon.internal`

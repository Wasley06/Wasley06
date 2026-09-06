import { createClient } from '@supabase/supabase-js'

/* Falls back to hardcoded values when env vars are not set (Figma Make / local dev) */
export const SUPABASE_URL  = import.meta.env.VITE_SUPABASE_URL  ?? 'https://tzvlavmaaummnufibgkt.supabase.co'
export const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR6dmxhdm1hYXVtbW51ZmliZ2t0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ5MDU1MjUsImV4cCI6MjEwMDQ4MTUyNX0.6YyJbc9FTBiCaIhbFwJB49XZi4peXq29Ek8pXnyVMvY'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
  auth: {
    persistSession: true,       // keeps session alive across page reloads
    autoRefreshToken: true,
    detectSessionInUrl: false,
    storageKey: 'fabegon-session',
  },
})

/* Usernames are stored as email = username@fabegon.internal in Supabase Auth */
export const toAuthEmail = (username: string) =>
  username.includes('@') ? username : `${username.toLowerCase()}@fabegon.internal`

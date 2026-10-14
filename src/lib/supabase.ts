import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();

export const configurationError = !supabaseUrl || !supabasePublishableKey
  ? 'Faltan VITE_SUPABASE_URL y/o VITE_SUPABASE_PUBLISHABLE_KEY. Copia .env.example a .env.local y completa ambos valores.'
  : !supabasePublishableKey.startsWith('sb_publishable_')
    ? 'VITE_SUPABASE_PUBLISHABLE_KEY debe ser la nueva Publishable Key (sb_publishable_), no una anon key legacy ni una clave secreta.'
    : null;

export const supabase = configurationError
  ? null
  : createClient(supabaseUrl, supabasePublishableKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    });

export function requireSupabase() {
  if (!supabase) throw new Error(configurationError ?? 'Supabase no está disponible.');
  return supabase;
}

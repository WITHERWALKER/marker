import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { supabaseAnonKey, supabaseUrl } from "./env";

/**
 * Cliente Supabase SIN sesión de cookies: para flujos de token de API
 * (extensión). Uso exclusivo del servidor.
 */

let cached: SupabaseClient | null = null;

export function createSupabaseAnonClient(): SupabaseClient {
  cached ??= createClient(supabaseUrl(), supabaseAnonKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}

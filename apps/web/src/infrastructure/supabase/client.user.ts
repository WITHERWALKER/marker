import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { supabaseAnonKey, supabaseUrl } from "./env";

/**
 * Cliente Supabase "como un usuario": viaja con un JWT efímero de rol
 * `authenticated` (emitido tras verificar un token de API), así que PostgREST
 * aplica exactamente las mismas policies RLS que en la sesión web.
 * Uso exclusivo del servidor.
 */
export function createSupabaseUserClient(jwt: string): SupabaseClient {
  return createClient(supabaseUrl(), supabaseAnonKey(), {
    // accessToken es una opción de NIVEL SUPERIOR en supabase-js 2.x (no va
    // dentro de `auth`): sustituye el bearer en cada petición REST.
    accessToken: async () => jwt,
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

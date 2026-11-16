import { createBrowserClient, createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Fábrica de clientes Supabase. Es el ÚNICO lugar del código que sabe
 * cómo se conecta la app a la base de datos (capa de infraestructura).
 */

export class MissingSupabaseEnvError extends Error {
  constructor(name: string) {
    super(
      `Falta la variable de entorno ${name}. Copia apps/web/.env.example a .env.local y configúrala.`,
    );
    this.name = "MissingSupabaseEnvError";
  }
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.startsWith("reemplaza")) throw new MissingSupabaseEnvError(name);
  return value;
}

export function supabaseUrl(): string {
  return requireEnv("NEXT_PUBLIC_SUPABASE_URL");
}

export function supabaseAnonKey(): string {
  return requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
}

/** Cliente para Server Components / Server Actions (lee y escribe cookies) */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  return createServerClient(supabaseUrl(), supabaseAnonKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Llamado desde un Server Component: la escritura la hace el
          // middleware; se ignora sin romper el render.
        }
      },
    },
  });
}

/** Cliente para el navegador (Client Components) */
export function createSupabaseBrowserClient() {
  return createBrowserClient(supabaseUrl(), supabaseAnonKey());
}

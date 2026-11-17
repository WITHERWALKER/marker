/**
 * Configuración Supabase. Sin dependencias de `next/headers` para poder
 * importarse desde cualquier contexto (cliente, servidor, middleware).
 *
 * IMPORTANTE: las NEXT_PUBLIC_* se leen de forma LITERAL (no dinámica):
 * Next.js solo las inlinea en el bundle del navegador con acceso estático.
 */

export class MissingSupabaseEnvError extends Error {
  constructor(name: string) {
    super(
      `Falta la variable de entorno ${name}. Copia apps/web/.env.example a .env.local y configúrala.`,
    );
    this.name = "MissingSupabaseEnvError";
  }
}

const RAW_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const RAW_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export function supabaseUrl(): string {
  if (!RAW_URL || RAW_URL.startsWith("reemplaza")) {
    throw new MissingSupabaseEnvError("NEXT_PUBLIC_SUPABASE_URL");
  }
  return RAW_URL;
}

export function supabaseAnonKey(): string {
  if (!RAW_ANON_KEY || RAW_ANON_KEY.startsWith("reemplaza")) {
    throw new MissingSupabaseEnvError("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }
  return RAW_ANON_KEY;
}

const RAW_JWT_SECRET = process.env.SUPABASE_JWT_SECRET;

/** Secreto para firmar JWT efímeros (rol authenticated) de la API de tokens. */
export function supabaseJwtSecret(): string {
  if (!RAW_JWT_SECRET) throw new MissingSupabaseEnvError("SUPABASE_JWT_SECRET");
  return RAW_JWT_SECRET;
}

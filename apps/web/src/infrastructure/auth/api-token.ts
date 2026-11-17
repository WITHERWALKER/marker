import { createHash, randomBytes } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Autenticación por token de API (extensión de navegador).
 *
 * En BD solo vive el SHA-256; la verificación es una función SECURITY
 * DEFINER (verify_api_token) que devuelve el user_id sin exponer la
 * service-role key. Esta clase es el ÚNICO punto que sabe hashear tokens.
 */

export class ApiTokenAuthenticator {
  constructor(private readonly client: SupabaseClient) {}

  /** Devuelve el user_id si el token es válido, o null */
  async verify(token: string): Promise<string | null> {
    const { data, error } = await this.client.rpc("verify_api_token", {
      p_token_hash: ApiTokenAuthenticator.hash(token),
    });
    if (error) return null;
    return typeof data === "string" ? data : null;
  }

  static hash(token: string): string {
    return createHash("sha256").update(token).digest("hex");
  }

  /** Token criptográficamente aleatorio; el texto plano solo se muestra una vez */
  static generate(): string {
    return randomBytes(32).toString("base64url");
  }
}

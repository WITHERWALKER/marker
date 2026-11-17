"use server";

import { revalidatePath } from "next/cache";
import { ApiTokenAuthenticator } from "@/infrastructure/auth/api-token";
import { createSupabaseServerClient } from "@/infrastructure/supabase/client.server";

/**
 * Server actions de /settings: crear y eliminar tokens de API.
 * El texto plano del token NUNCA se persiste: en BD vive solo su SHA-256.
 */

export interface CreateTokenState {
  status: "idle" | "ok" | "error";
  /** El token en claro, devuelto UNA sola vez al crearlo */
  plaintext: string | null;
  name: string | null;
  message: string | null;
}

export async function createApiTokenAction(
  _prev: CreateTokenState,
  formData: FormData,
): Promise<CreateTokenState> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      status: "error",
      plaintext: null,
      name: null,
      message: "Sesión no válida: vuelve a entrar.",
    };
  }

  const name = String(formData.get("name") ?? "").trim() || "Extensión";
  const plaintext = ApiTokenAuthenticator.generate();
  const tokenHash = ApiTokenAuthenticator.hash(plaintext);

  const { error } = await supabase.from("api_tokens").insert({
    user_id: user.id,
    name,
    token_hash: tokenHash,
  });

  if (error) {
    return { status: "error", plaintext: null, name, message: error.message };
  }

  revalidatePath("/settings");
  return { status: "ok", plaintext, name, message: null };
}

export async function deleteApiTokenAction(formData: FormData): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const id = String(formData.get("id") ?? "").trim();
  if (!id) return;

  await supabase.from("api_tokens").delete().eq("id", id).eq("user_id", user.id);
  revalidatePath("/settings");
}

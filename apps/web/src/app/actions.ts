"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { makeSaveItem } from "@/infrastructure/composition";
import { createSupabaseServerClient } from "@/infrastructure/supabase/client.server";

/**
 * Server Actions: la frontera HTTP de la app. Traducen la petición web
 * a llamadas a casos de uso; nunca contienen lógica de negocio.
 */

export interface SaveItemState {
  status: "idle" | "ok" | "duplicate" | "error";
  message: string | null;
}

export async function saveItemAction(
  _prev: SaveItemState,
  formData: FormData,
): Promise<SaveItemState> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const url = String(formData.get("url") ?? "");
  const sharedText = String(formData.get("text") ?? "").trim();

  try {
    const saveItem = await makeSaveItem();
    const result = await saveItem.execute({
      userId: user.id,
      url,
      source: "paste",
      sharedText: sharedText || null,
    });

    if (!result.ok) {
      return { status: "error", message: result.message };
    }

    revalidatePath("/");
    return result.duplicated
      ? {
          status: "duplicate",
          message: `Ya lo tenías guardado → ${result.item.title ?? result.item.url}`,
        }
      : {
          status: "ok",
          message: `Guardado ✓ ${result.item.title ?? result.item.url}`,
        };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Error inesperado",
    };
  }
}

export async function signOutAction(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}

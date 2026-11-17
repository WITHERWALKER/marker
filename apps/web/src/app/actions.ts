"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { uniqueTags } from "@/core/domain/tag";
import { makeSaveItem } from "@/infrastructure/composition";
import { createSupabaseServerClient } from "@/infrastructure/supabase/client.server";
import { SupabaseItemRepository } from "@/infrastructure/supabase/item-repository";

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
  const tags = uniqueTags(String(formData.get("tags") ?? "").split(","));

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

    if (!result.duplicated && tags.length > 0) {
      await new SupabaseItemRepository(supabase).replaceTags(user.id, result.item.id, tags);
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

export async function updateItemAction(formData: FormData): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const id = String(formData.get("id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const tags = uniqueTags(String(formData.get("tags") ?? "").split(","));

  const items = new SupabaseItemRepository(supabase);
  await items.update(user.id, id, { title: title || null });
  await items.replaceTags(user.id, id, tags);
  revalidatePath("/");
}

export async function deleteItemAction(formData: FormData): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const id = String(formData.get("id") ?? "");
  const items = new SupabaseItemRepository(supabase);
  await items.delete(user.id, id);
  revalidatePath("/");
}

export async function listUserTags(): Promise<string[]> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];
  return new SupabaseItemRepository(supabase).listTagNames(user.id);
}

export async function signOutAction(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}

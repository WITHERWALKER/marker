import { createListItemsUseCase } from "@/core/application/list-items";
import { createSaveItemUseCase } from "@/core/application/save-item";
import type { SupabaseClient } from "@supabase/supabase-js";
import { HttpMetadataFetcher } from "@/infrastructure/metadata/metadata-fetcher";
import { createSupabaseServerClient } from "@/infrastructure/supabase/client.server";
import { SupabaseItemRepository } from "@/infrastructure/supabase/item-repository";

/**
 * Composition Root: el único punto donde se instancian los adaptadores
 * concretos y se inyectan en los casos de uso.
 */

export async function makeSaveItem() {
  const supabase = await createSupabaseServerClient();
  return createSaveItemUseCase({
    items: new SupabaseItemRepository(supabase),
    metadata: new HttpMetadataFetcher(),
  });
}

/**
 * Variante para flujos de token (extensión): el cliente ya viene preparado
 * para operar como un usuario concreto, con RLS activa.
 */
export function makeSaveItemForClient(client: SupabaseClient) {
  return createSaveItemUseCase({
    items: new SupabaseItemRepository(client),
    metadata: new HttpMetadataFetcher(),
  });
}

export async function makeListItems() {
  const supabase = await createSupabaseServerClient();
  return createListItemsUseCase({
    items: new SupabaseItemRepository(supabase),
  });
}

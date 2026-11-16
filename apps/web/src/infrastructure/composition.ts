import { createListItemsUseCase } from "@/core/application/list-items";
import { createSaveItemUseCase } from "@/core/application/save-item";
import { HttpMetadataFetcher } from "@/infrastructure/metadata/metadata-fetcher";
import { createSupabaseServerClient } from "@/infrastructure/supabase/client";
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

export async function makeListItems() {
  const supabase = await createSupabaseServerClient();
  return createListItemsUseCase({
    items: new SupabaseItemRepository(supabase),
  });
}

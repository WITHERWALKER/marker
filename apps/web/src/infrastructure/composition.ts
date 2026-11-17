import { createEnrichPendingItemsUseCase } from "@/core/application/enrich-pending-items";
import { createEnrichmentQueueQuery } from "@/core/application/enrichment-queue";
import { createImportItemsUseCase } from "@/core/application/import-items";
import { createListItemsUseCase } from "@/core/application/list-items";
import { createSaveItemUseCase } from "@/core/application/save-item";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { ImportParser } from "@/core/ports";
import { AutoImportParser } from "@/infrastructure/import/auto-import-parser";
import { InstagramSavedPostsParser } from "@/infrastructure/import/instagram-saved-posts";
import { XArchiveParser } from "@/infrastructure/import/x-archive";
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

export async function makeImportItems() {
  const supabase = await createSupabaseServerClient();
  return createImportItemsUseCase({
    items: new SupabaseItemRepository(supabase),
  });
}

/** Re-enriquecimiento en lote de los items pendientes (post-import). */
export async function makeEnrichPendingItems() {
  const supabase = await createSupabaseServerClient();
  return createEnrichPendingItemsUseCase({
    items: new SupabaseItemRepository(supabase),
    metadata: new HttpMetadataFetcher(),
  });
}

/** Consulta de la cola de enriquecimiento (cuántos quedan pendientes). */
export async function makeEnrichmentQueue() {
  const supabase = await createSupabaseServerClient();
  return createEnrichmentQueueQuery({
    items: new SupabaseItemRepository(supabase),
  });
}

/** Parser que autodetecta el formato del export (Instagram saved_posts / X archive). */
export function makeImportParser(): ImportParser {
  return new AutoImportParser([new InstagramSavedPostsParser(), new XArchiveParser()]);
}

import type { Item } from "@/core/domain/item";
import type { ItemPatch, ItemRepository, ListItemsOptions } from "@/core/ports";
import type { ItemSource } from "@/core/domain/item";

/**
 * Contratos del caso de uso SaveItem, separados del implementador para
 * mantener el archivo del caso de uso enfocado en la orquestación.
 */

export interface ItemMetadataFetcher {
  fetch(url: string): Promise<{
    title: string | null;
    description: string | null;
    authorName: string | null;
    thumbnailUrl: string | null;
  } | null>;
}

export type SaveItemResult =
  | { ok: true; item: Item; duplicated: boolean }
  | { ok: false; reason: "invalid-url"; message: string };

export type { ItemPatch, ItemRepository, ListItemsOptions, ItemSource };

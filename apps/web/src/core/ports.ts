import type { Item, ItemKind, ItemSource, Platform } from "./domain/item";

/**
 * Puertos: contratos que la capa de aplicación CONSUME y la capa de
 * infraestructura IMPLEMENTA. Así los casos de uso no conocen Supabase,
 * HTTP ni ninguna tecnología (Dependency Inversion Principle).
 */

export interface NewItem {
  url: string;
  canonicalUrl: string;
  platform: Platform;
  kind: ItemKind;
  source: ItemSource;
  title?: string | null;
  description?: string | null;
  contentText?: string | null;
}

export interface ItemPatch {
  title?: string | null;
  description?: string | null;
  authorName?: string | null;
  thumbnailUrl?: string | null;
  contentText?: string | null;
  status?: Item["status"];
  errorMessage?: string | null;
}

export interface ListItemsOptions {
  platform?: Platform;
  kind?: ItemKind;
  query?: string;
  limit?: number;
}

export interface ItemRepository {
  findByCanonicalUrl(userId: string, canonicalUrl: string): Promise<Item | null>;
  create(userId: string, item: NewItem): Promise<Item>;
  update(userId: string, itemId: string, patch: ItemPatch): Promise<Item | null>;
  list(userId: string, options: ListItemsOptions): Promise<Item[]>;
}

/** Metadata obtenida desde la fuente (OpenGraph, oEmbed...) */
export interface ItemMetadata {
  title: string | null;
  description: string | null;
  authorName: string | null;
  thumbnailUrl: string | null;
}

/** Puerto de enriquecimiento: dado un URL, intenta extraer metadata */
export interface MetadataFetcher {
  fetch(url: string): Promise<ItemMetadata | null>;
}

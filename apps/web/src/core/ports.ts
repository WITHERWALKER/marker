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
  /** Solo en imports: preserva cuándo lo guardó el usuario originalmente */
  savedAt?: string | null;
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
  tag?: string;
  limit?: number;
}

export interface ItemRepository {
  findByCanonicalUrl(userId: string, canonicalUrl: string): Promise<Item | null>;
  create(userId: string, item: NewItem): Promise<Item>;
  update(userId: string, itemId: string, patch: ItemPatch): Promise<Item | null>;
  list(userId: string, options: ListItemsOptions): Promise<Item[]>;
  /** Items en un estado dado, del más viejo al más nuevo (cola FIFO) */
  listByStatus(userId: string, status: Item["status"], limit: number): Promise<Item[]>;
  /** Cuántos items hay en un estado dado (para pintar la cola en la UI) */
  countByStatus(userId: string, status: Item["status"]): Promise<number>;
  /** Devuelve los canonical_url de la lista que YA existen para el usuario */
  findByCanonicalUrls(userId: string, canonicalUrls: string[]): Promise<string[]>;
  /** Inserta en bloque; devuelve cuántas filas entró */
  createMany(userId: string, items: NewItem[]): Promise<number>;
  /** Borra un item del usuario. Las etiquetas se van en cascada. */
  delete(userId: string, itemId: string): Promise<void>;
  /** Sustituye las etiquetas del item por esta lista de nombres. */
  replaceTags(userId: string, itemId: string, names: string[]): Promise<void>;
  /** Nombres de etiquetas del usuario, para sugerirlas al escribir. */
  listTagNames(userId: string): Promise<string[]>;
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

/** Una entrada cruda de un export (Instagram/X) antes de validarla */
export interface ImportedEntry {
  url: string;
  /** Cuándo lo guardó el usuario originalmente, si el export lo trae */
  savedAt: string | null;
}

/**
 * Puerto de importación: adapta el formato de export de una plataforma a
 * entradas crudas. `detect` permite elegir el parser adecuado al archivo.
 */
export interface ImportParser {
  detect(raw: string): boolean;
  parse(raw: string): ImportedEntry[];
}

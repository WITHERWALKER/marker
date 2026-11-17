import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Item,
  ItemKind,
  ItemSource,
  ItemStatus,
  Platform,
} from "@/core/domain/item";
import type {
  ItemPatch,
  ItemRepository,
  ListItemsOptions,
  NewItem,
} from "@/core/ports";

/**
 * Implementación del puerto ItemRepository sobre Supabase/Postgres.
 * Traduce entre las filas (snake_case) y la entidad de dominio (camelCase).
 */

const INSERT_CHUNK = 100;

/** Divide una lista en trozos (límites de longitud de URL de PostgREST). */
function chunks<T>(list: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let index = 0; index < list.length; index += size) {
    result.push(list.slice(index, index + size));
  }
  return result;
}

/** Fila de insert: campos comunes + saved_at solo si un import lo trae */
function toInsertRow(userId: string, item: NewItem): Record<string, unknown> {
  return {
    user_id: userId,
    url: item.url,
    canonical_url: item.canonicalUrl,
    platform: item.platform,
    kind: item.kind,
    source: item.source,
    title: item.title ?? null,
    description: item.description ?? null,
    content_text: item.contentText ?? null,
    ...(item.savedAt ? { saved_at: item.savedAt } : {}),
  };
}

interface ItemRow {
  id: string;
  url: string;
  canonical_url: string;
  platform: string;
  kind: string;
  title: string | null;
  description: string | null;
  author_name: string | null;
  thumbnail_url: string | null;
  content_text: string | null;
  status: string;
  error_message: string | null;
  source: string;
  created_at: string;
  updated_at: string;
  saved_at: string;
}

function toDomain(row: ItemRow): Item {
  return {
    id: row.id,
    url: row.url,
    canonicalUrl: row.canonical_url,
    platform: row.platform as Platform,
    kind: row.kind as ItemKind,
    title: row.title,
    description: row.description,
    authorName: row.author_name,
    thumbnailUrl: row.thumbnail_url,
    contentText: row.content_text,
    status: row.status as ItemStatus,
    errorMessage: row.error_message,
    source: row.source as ItemSource,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    savedAt: row.saved_at,
  };
}

export class SupabaseItemRepository implements ItemRepository {
  constructor(private readonly client: SupabaseClient) {}

  async findByCanonicalUrl(userId: string, canonicalUrl: string): Promise<Item | null> {
    const { data, error } = await this.client
      .from("items")
      .select("*")
      .eq("user_id", userId)
      .eq("canonical_url", canonicalUrl)
      .maybeSingle<ItemRow>();
    if (error) throw new Error(`findByCanonicalUrl: ${error.message}`);
    return data ? toDomain(data) : null;
  }

  async create(userId: string, item: NewItem): Promise<Item> {
    const { data, error } = await this.client
      .from("items")
      .insert(toInsertRow(userId, item))
      .select("*")
      .single<ItemRow>();
    if (error) throw new Error(`create: ${error.message}`);
    return toDomain(data);
  }

  async update(userId: string, itemId: string, patch: ItemPatch): Promise<Item | null> {
    const row: Record<string, unknown> = {};
    if (patch.title !== undefined) row.title = patch.title;
    if (patch.description !== undefined) row.description = patch.description;
    if (patch.authorName !== undefined) row.author_name = patch.authorName;
    if (patch.thumbnailUrl !== undefined) row.thumbnail_url = patch.thumbnailUrl;
    if (patch.contentText !== undefined) row.content_text = patch.contentText;
    if (patch.status !== undefined) row.status = patch.status;
    if (patch.errorMessage !== undefined) row.error_message = patch.errorMessage;
    if (Object.keys(row).length === 0) return null;

    const { data, error } = await this.client
      .from("items")
      .update(row)
      .eq("user_id", userId)
      .eq("id", itemId)
      .select("*")
      .maybeSingle<ItemRow>();
    if (error) throw new Error(`update: ${error.message}`);
    return data ? toDomain(data) : null;
  }

  async list(userId: string, options: ListItemsOptions): Promise<Item[]> {
    let query = this.client
      .from("items")
      .select("*")
      .eq("user_id", userId)
      .order("saved_at", { ascending: false })
      .limit(options.limit ?? 100);

    if (options.platform) query = query.eq("platform", options.platform);
    if (options.kind) query = query.eq("kind", options.kind);

    const text = options.query?.trim();
    if (text) {
      // ilike con comodines: escapamos los caracteres que significan algo
      const safe = text.replace(/[%,(*)]/g, " ").trim();
      if (safe.length > 0) {
        query = query.or(
          `title.ilike.%${safe}%,description.ilike.%${safe}%,content_text.ilike.%${safe}%`,
        );
      }
    }

    const { data, error } = await query.returns<ItemRow[]>();
    if (error) throw new Error(`list: ${error.message}`);
    return (data ?? []).map(toDomain);
  }

  async listByStatus(userId: string, status: ItemStatus, limit: number): Promise<Item[]> {
    const { data, error } = await this.client
      .from("items")
      .select("*")
      .eq("user_id", userId)
      .eq("status", status)
      .order("saved_at", { ascending: true })
      .limit(limit)
      .returns<ItemRow[]>();
    if (error) throw new Error(`listByStatus: ${error.message}`);
    return (data ?? []).map(toDomain);
  }

  async countByStatus(userId: string, status: ItemStatus): Promise<number> {
    const { count, error } = await this.client
      .from("items")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", status);
    if (error) throw new Error(`countByStatus: ${error.message}`);
    return count ?? 0;
  }

  async findByCanonicalUrls(userId: string, canonicalUrls: string[]): Promise<string[]> {
    if (canonicalUrls.length === 0) return [];
    const found: string[] = [];
    for (const chunk of chunks(canonicalUrls, 200)) {
      const { data, error } = await this.client
        .from("items")
        .select("canonical_url")
        .eq("user_id", userId)
        .in("canonical_url", chunk)
        .returns<{ canonical_url: string }[]>();
      if (error) throw new Error(`findByCanonicalUrls: ${error.message}`);
      for (const row of data ?? []) found.push(row.canonical_url);
    }
    return found;
  }

  async createMany(userId: string, items: NewItem[]): Promise<number> {
    if (items.length === 0) return 0;
    let inserted = 0;
    for (const chunk of chunks(items, INSERT_CHUNK)) {
      const { error } = await this.client
        .from("items")
        .insert(chunk.map((item) => toInsertRow(userId, item)));
      if (error) throw new Error(`createMany: ${error.message}`);
      inserted += chunk.length;
    }
    return inserted;
  }
}

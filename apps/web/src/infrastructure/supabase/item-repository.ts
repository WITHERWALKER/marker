import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Item,
  ItemKind,
  ItemSource,
  ItemStatus,
  Platform,
} from "@/core/domain/item";
import { uniqueTags } from "@/core/domain/tag";
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
    tags: [],
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

    const tagName = options.tag?.trim().replace(/[%_]/g, "");
    if (tagName) {
      const { data: tagRows, error: tagError } = await this.client
        .from("tags")
        .select("id")
        .eq("user_id", userId)
        .ilike("name", tagName)
        .returns<{ id: string }[]>();
      if (tagError) throw new Error(`list tag: ${tagError.message}`);
      const tagIds = (tagRows ?? []).map((row) => row.id);
      if (tagIds.length === 0) return [];
      const { data: links, error: linkError } = await this.client
        .from("item_tags")
        .select("item_id")
        .in("tag_id", tagIds)
        .returns<{ item_id: string }[]>();
      if (linkError) throw new Error(`list tag: ${linkError.message}`);
      const ids = (links ?? []).map((link) => link.item_id);
      if (ids.length === 0) return [];
      query = query.in("id", ids);
    }

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
    return this.attachTags((data ?? []).map(toDomain));
  }

  /** Junta los nombres de `tags` vía `item_tags` para pintar los badges. */
  private async attachTags(items: Item[]): Promise<Item[]> {
    if (items.length === 0) return items;
    const { data, error } = await this.client
      .from("item_tags")
      .select("item_id, tags(name)")
      .in(
        "item_id",
        items.map((item) => item.id),
      );
    if (error) throw new Error(`attachTags: ${error.message}`);

    const byItem = new Map<string, string[]>();
    for (const row of data ?? []) {
      const linked = row.tags as { name: string } | { name: string }[] | null;
      const name = Array.isArray(linked) ? linked[0]?.name : linked?.name;
      if (!name) continue;
      const names = byItem.get(row.item_id) ?? [];
      names.push(name);
      byItem.set(row.item_id, names);
    }

    return items.map((item) => ({ ...item, tags: byItem.get(item.id) ?? [] }));
  }

  async delete(userId: string, itemId: string): Promise<void> {
    const { error } = await this.client.from("items").delete().eq("user_id", userId).eq("id", itemId);
    if (error) throw new Error(`delete: ${error.message}`);
  }

  async listTagNames(userId: string): Promise<string[]> {
    const { data, error } = await this.client
      .from("tags")
      .select("name")
      .eq("user_id", userId)
      .order("name")
      .returns<{ name: string }[]>();
    if (error) throw new Error(`listTagNames: ${error.message}`);
    return uniqueTags((data ?? []).map((row) => row.name));
  }

  async replaceTags(userId: string, itemId: string, names: string[]): Promise<void> {
    const clean = uniqueTags(names);

    const { data: owned, error: ownError } = await this.client
      .from("items")
      .select("id")
      .eq("user_id", userId)
      .eq("id", itemId)
      .maybeSingle();
    if (ownError) throw new Error(`replaceTags: ${ownError.message}`);
    if (!owned) return;

    const { error: clearError } = await this.client.from("item_tags").delete().eq("item_id", itemId);
    if (clearError) throw new Error(`replaceTags: ${clearError.message}`);
    if (clean.length === 0) return;

    const tagIds: string[] = [];
    for (const name of clean) {
      const { data: existing, error: findError } = await this.client
        .from("tags")
        .select("id, name")
        .eq("user_id", userId)
        .ilike("name", name.replace(/[%_]/g, ""))
        .limit(1)
        .returns<{ id: string; name: string }[]>();
      if (findError) throw new Error(`replaceTags: ${findError.message}`);

      const found = existing?.[0];
      if (found) {
        if (found.name !== name) {
          const { error: renameError } = await this.client
            .from("tags")
            .update({ name })
            .eq("id", found.id);
          if (renameError) throw new Error(`replaceTags: ${renameError.message}`);
        }
        tagIds.push(found.id);
        continue;
      }

      const { data, error } = await this.client
        .from("tags")
        .upsert({ user_id: userId, name }, { onConflict: "user_id,name" })
        .select("id")
        .single<{ id: string }>();
      if (error) throw new Error(`replaceTags: ${error.message}`);
      tagIds.push(data.id);
    }

    const { error: linkError } = await this.client
      .from("item_tags")
      .insert(tagIds.map((tagId) => ({ item_id: itemId, tag_id: tagId })));
    if (linkError) throw new Error(`replaceTags: ${linkError.message}`);
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

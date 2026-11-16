import type { Item } from "@/core/domain/item";
import { detectKind, detectPlatform } from "@/core/domain/platform";
import { canonicalize, parseUrl, InvalidUrlError } from "@/core/domain/url";
import type {
  ItemMetadataFetcher,
  ItemRepository,
  SaveItemResult,
} from "./save-item.types";

/**
 * Caso de uso: guardar un item.
 *
 * Orquesta: validación → dedupe → persistencia → enriquecimiento.
 * Solo conoce puertos; no sabe si abajo hay Supabase o un archivo JSON.
 */

export interface SaveItemInput {
  userId: string;
  url: string;
  source: Item["source"];
  /** Texto que acompañaba al share (caption parcial de Instagram, etc.) */
  sharedText?: string | null;
}

type Deps = {
  items: ItemRepository;
  metadata: ItemMetadataFetcher;
};

export function createSaveItemUseCase(deps: Deps) {
  return {
    async execute(input: SaveItemInput): Promise<SaveItemResult> {
      // 1. Validar y canonicalizar
      let canonicalUrl: string;
      try {
        canonicalUrl = canonicalize(input.url);
        parseUrl(input.url); // garantiza una URL válida antes de insertar
      } catch (error) {
        if (error instanceof InvalidUrlError) {
          return { ok: false, reason: "invalid-url", message: error.message };
        }
        throw error;
      }

      // 2. Dedupe: si ya existe, lo devolvemos sin duplicar
      const existing = await deps.items.findByCanonicalUrl(input.userId, canonicalUrl);
      if (existing) {
        return { ok: true, item: existing, duplicated: true };
      }

      // 3. Persistir como pending (el feed lo muestra "procesando")
      const url = parseUrl(input.url);
      const platform = detectPlatform(url);
      const kind = detectKind(url, platform);

      let item = await deps.items.create(input.userId, {
        url: url.toString(),
        canonicalUrl,
        platform,
        kind,
        source: input.source,
        contentText: input.sharedText?.trim() || null,
      });

      // 4. Enriquecer (OpenGraph/oEmbed). El fallo no rompe el guardado:
      //    el item queda 'error' y podrá reintentarse más adelante.
      try {
        const meta: ItemMetadata | null = await deps.metadata.fetch(item.url);
        const updated = await deps.items.update(input.userId, item.id, {
          title: meta?.title ?? null,
          description: meta?.description ?? null,
          authorName: meta?.authorName ?? null,
          thumbnailUrl: meta?.thumbnailUrl ?? null,
          status: "ready",
        });
        if (updated) item = updated;
      } catch (error) {
        const message = error instanceof Error ? error.message : "fallo al enriquecer";
        const updated = await deps.items.update(input.userId, item.id, {
          status: "error",
          errorMessage: message,
        });
        if (updated) item = updated;
      }

      return { ok: true, item, duplicated: false };
    },
  };
}

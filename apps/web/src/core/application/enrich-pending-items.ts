import type { ItemMetadata, ItemRepository, MetadataFetcher } from "@/core/ports";

/**
 * Caso de uso: reintentar el enriquecimiento de los items `pending`.
 *
 * Es la contraparte asíncrona del paso final de SaveItem: el import dejó
 * cientos de items sin metadata (no es escalable enriquecerlos dentro de la
 * petición HTTP), así que los procesamos en lotes con la MISMA semántica:
 *  - fetch resuelve (con o sin metadata) → status `ready`
 *  - fetch lanza (403, red, timeout)     → status `error` + errorMessage
 */

export interface EnrichPendingItemsInput {
  userId: string;
  /** Máximo de items por invocación (default 15: fetches secuenciales) */
  batchSize?: number;
}

export interface EnrichPendingItemsResult {
  processed: number;
  /** Consiguieron metadata (título/autor/miniatura) */
  enriched: number;
  /** El fetch lanzó → quedaron en `error` */
  failed: number;
  /** Cuántos `pending` quedan en cola tras el lote */
  remaining: number;
}

type Deps = {
  items: ItemRepository;
  metadata: MetadataFetcher;
};

const DEFAULT_BATCH_SIZE = 15;

export function createEnrichPendingItemsUseCase(deps: Deps) {
  return {
    async execute(input: EnrichPendingItemsInput): Promise<EnrichPendingItemsResult> {
      const batchSize = input.batchSize ?? DEFAULT_BATCH_SIZE;
      // FIFO: primero lo más viejo (el histórico importado va primero)
      const pending = await deps.items.listByStatus(input.userId, "pending", batchSize);

      let enriched = 0;
      let failed = 0;

      for (const item of pending) {
        let meta: ItemMetadata | null;
        try {
          meta = await deps.metadata.fetch(item.url);
        } catch (error) {
          await deps.items.update(input.userId, item.id, {
            status: "error",
            errorMessage: error instanceof Error ? error.message : "fallo al enriquecer",
          });
          failed++;
          continue;
        }

        // Sin metadata disponible también es un resultado válido: queda
        // 'ready' con campos vacíos, igual que hace SaveItem.
        await deps.items.update(input.userId, item.id, {
          title: meta?.title ?? null,
          description: meta?.description ?? null,
          authorName: meta?.authorName ?? null,
          thumbnailUrl: meta?.thumbnailUrl ?? null,
          status: "ready",
        });
        if (meta) enriched++;
      }

      return {
        processed: pending.length,
        enriched,
        failed,
        remaining: await deps.items.countByStatus(input.userId, "pending"),
      };
    },
  };
}

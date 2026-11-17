import type { ItemRepository } from "@/core/ports";

/**
 * Consulta de lectura: estado de la cola de enriquecimiento.
 * La UI la usa para saber si queda trabajo pendiente (y cuánto).
 */

export interface EnrichmentQueueStatus {
  pending: number;
}

type Deps = {
  items: ItemRepository;
};

export function createEnrichmentQueueQuery(deps: Deps) {
  return {
    async execute(userId: string): Promise<EnrichmentQueueStatus> {
      return { pending: await deps.items.countByStatus(userId, "pending") };
    },
  };
}

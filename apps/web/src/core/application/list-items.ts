import type { Item } from "@/core/domain/item";
import type { ItemRepository, ListItemsOptions } from "@/core/ports";

/**
 * Caso de uso: listar items del feed con filtros y búsqueda.
 */

type Deps = {
  items: ItemRepository;
};

export function createListItemsUseCase(deps: Deps) {
  return {
    async execute(
      userId: string,
      options: ListItemsOptions = {},
    ): Promise<Item[]> {
      return deps.items.list(userId, {
        limit: options.limit ?? 100,
        platform: options.platform,
        kind: options.kind,
        query: options.query,
        tag: options.tag,
      });
    },
  };
}

import { detectKind, detectPlatform } from "@/core/domain/platform";
import { canonicalize, parseUrl, InvalidUrlError } from "@/core/domain/url";
import type { ImportedEntry, ItemRepository, NewItem } from "@/core/ports";

/**
 * Caso de uso: importar un histórico de guardados (Instagram, X).
 *
 * A diferencia de SaveItem, NO enriquece síncronamente (cientos de fetches
 * no caben en una petición): inserta en bloque con dedupe por canonical_url
 * y preserva la fecha original de cada guardado (saved_at).
 */

export interface ImportItemsInput {
  userId: string;
  entries: ImportedEntry[];
}

export interface ImportItemsResult {
  imported: number;
  duplicates: number;
  invalid: number;
}

type Deps = {
  items: ItemRepository;
};

/** ISO strings se comparan lexicográficamente; nos quedamos con la más nueva */
function latestSavedAt(a: string | null, b: string | null): string | null {
  if (!a) return b;
  if (!b) return a;
  return a > b ? a : b;
}

export function createImportItemsUseCase(deps: Deps) {
  return {
    async execute(input: ImportItemsInput): Promise<ImportItemsResult> {
      // 1. Validar, canonicalizar y deduplicar DENTRO del lote
      const byCanonical = new Map<string, string | null>();
      let invalid = 0;

      for (const entry of input.entries) {
        try {
          const canonical = canonicalize(entry.url);
          const current = byCanonical.get(canonical) ?? null;
          byCanonical.set(canonical, latestSavedAt(current, entry.savedAt));
        } catch (error) {
          if (error instanceof InvalidUrlError) {
            invalid++;
            continue;
          }
          throw error;
        }
      }

      // 2. Dedupe contra la base de datos (en bloque)
      const canonicals = [...byCanonical.keys()];
      const existing = new Set(
        await deps.items.findByCanonicalUrls(input.userId, canonicals),
      );
      const missing = canonicals.filter((canonical) => !existing.has(canonical));
      const duplicates = canonicals.length - missing.length;

      // 3. Insertar los nuevos (sin enriquecimiento; status queda 'pending')
      const newItems: NewItem[] = missing.map((canonical) => {
        const url = parseUrl(canonical); // canonicalize garantiza validez
        const platform = detectPlatform(url);
        return {
          url: url.toString(),
          canonicalUrl: canonical,
          platform,
          kind: detectKind(url, platform),
          source: "import",
          savedAt: byCanonical.get(canonical) ?? null,
        };
      });
      await deps.items.createMany(input.userId, newItems);

      return { imported: newItems.length, duplicates, invalid };
    },
  };
}

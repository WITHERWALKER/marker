import type { ImportedEntry, ImportParser } from "@/core/ports";

interface InstagramSavedPost {
  uri?: string;
  last_update_timestamp?: number;
}

/**
 * Parser de `saved_posts.json` del export de Instagram
 * (Configuración → Tu actividad → Descargar tu información).
 * El archivo puede ser un array o un objeto con clave `saved_saved_posts`.
 */
export class InstagramSavedPostsParser implements ImportParser {
  detect(raw: string): boolean {
    try {
      const data = JSON.parse(raw) as unknown;
      if (Array.isArray(data)) {
        return data.some(
          (entry) =>
            entry !== null &&
            typeof entry === "object" &&
            "uri" in entry &&
            !("like" in entry) &&
            !("tweet" in entry),
        );
      }
      if (data !== null && typeof data === "object") {
        return Array.isArray((data as { saved_saved_posts?: unknown }).saved_saved_posts);
      }
      return false;
    } catch {
      return false;
    }
  }

  parse(raw: string): ImportedEntry[] {
    const data = JSON.parse(raw) as
      | { saved_saved_posts?: InstagramSavedPost[] }
      | InstagramSavedPost[];
    const list = Array.isArray(data)
      ? data
      : (data.saved_saved_posts ?? []);

    return list.map((entry) => ({
      url: typeof entry?.uri === "string" ? entry.uri.trim() : "",
      // Instagram da el timestamp en segundos
      savedAt: toIsoSeconds(entry?.last_update_timestamp),
    }));
  }
}

function toIsoSeconds(seconds: number | undefined): string | null {
  if (typeof seconds !== "number" || !Number.isFinite(seconds) || seconds <= 0) {
    return null;
  }
  return new Date(seconds * 1000).toISOString();
}

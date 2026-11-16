/**
 * Entidad central de Marker: un "item" es cualquier cosa guardada
 * (un reel de Instagram, un tweet, un video de YouTube, un artículo...).
 *
 * Capa de dominio: cero dependencias. Solo tipos y reglas del negocio.
 */

export const PLATFORMS = [
  "instagram",
  "twitter",
  "youtube",
  "reddit",
  "facebook",
  "pinterest",
  "tiktok",
  "web",
] as const;
export type Platform = (typeof PLATFORMS)[number];

export const ITEM_KINDS = ["post", "reel", "video", "article", "image", "link"] as const;
export type ItemKind = (typeof ITEM_KINDS)[number];

/** pending = enriquecimiento en curso · ready = procesado · error = fallo */
export type ItemStatus = "pending" | "ready" | "error";

/** De dónde llegó el item a Marker */
export type ItemSource = "paste" | "share" | "extension" | "import" | "sync";

export interface Item {
  id: string;
  url: string;
  /** URL normalizada, usada para deduplicar */
  canonicalUrl: string;
  platform: Platform;
  kind: ItemKind;
  title: string | null;
  description: string | null;
  authorName: string | null;
  thumbnailUrl: string | null;
  contentText: string | null;
  status: ItemStatus;
  errorMessage: string | null;
  source: ItemSource;
  createdAt: string;
  updatedAt: string;
  savedAt: string;
}
